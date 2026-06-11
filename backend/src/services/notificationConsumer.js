const rabbitmq = require('../config/rabbitmq');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

const startConsumer = async () => {
  const channel = await rabbitmq.connect();
  if (!channel) {
    logger.info('RabbitMQ not available. Skipping consumer.');
    return;
  }

  const handleFailure = async (msg, message, queueName) => {
    const retryCount = parseInt(msg.properties.headers?.retry_count || 0);
    if (retryCount < 3) {
      message.retryCount = retryCount + 1;
      let delayQueue;
      if (queueName === rabbitmq.QUEUES.EMAIL) {
        if (message.retryCount === 1) delayQueue = rabbitmq.QUEUES.EMAIL_DELAY_1;
        else if (message.retryCount === 2) delayQueue = rabbitmq.QUEUES.EMAIL_DELAY_2;
        else delayQueue = rabbitmq.QUEUES.EMAIL_DELAY_3;
      } else {
        if (message.retryCount === 1) delayQueue = rabbitmq.QUEUES.SMS_DELAY_1;
        else if (message.retryCount === 2) delayQueue = rabbitmq.QUEUES.SMS_DELAY_2;
        else delayQueue = rabbitmq.QUEUES.SMS_DELAY_3;
      }

      channel.publish('', delayQueue, Buffer.from(JSON.stringify(message)), {
        persistent: true,
        contentType: 'application/json',
        headers: { retry_count: message.retryCount },
      });
      channel.ack(msg);
    } else {
      channel.ack(msg);
    }
  };

  channel.consume(rabbitmq.QUEUES.EMAIL, async (msg) => {
    if (!msg) return;

    let message;
    try {
      message = JSON.parse(msg.content.toString());
      message.retryCount = parseInt(msg.properties.headers?.retry_count || 0);

      await notificationService.processEmail(message);
      channel.ack(msg);
    } catch (err) {
      logger.error('Email processing failed: ' + err.message);
      if (message) await handleFailure(msg, message, rabbitmq.QUEUES.EMAIL);
      else channel.ack(msg);
    }
  });

  channel.consume(rabbitmq.QUEUES.SMS, async (msg) => {
    if (!msg) return;

    let message;
    try {
      message = JSON.parse(msg.content.toString());
      message.retryCount = parseInt(msg.properties.headers?.retry_count || 0);

      await notificationService.processSMS(message);
      channel.ack(msg);
    } catch (err) {
      logger.error('SMS processing failed: ' + err.message);
      if (message) await handleFailure(msg, message, rabbitmq.QUEUES.SMS);
      else channel.ack(msg);
    }
  });

  logger.info('Notification consumers started');
};

module.exports = { startConsumer };
