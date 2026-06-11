const amqp = require("amqplib");
const logger = require("../utils/logger");

let connection = null;
let channel = null;

const QUEUES = {
  EMAIL: "email_notifications",
  SMS: "sms_notifications",
  EMAIL_DELAY_1: "email_notifications_delay_1",
  EMAIL_DELAY_2: "email_notifications_delay_2",
  EMAIL_DELAY_3: "email_notifications_delay_3",
  SMS_DELAY_1: "sms_notifications_delay_1",
  SMS_DELAY_2: "sms_notifications_delay_2",
  SMS_DELAY_3: "sms_notifications_delay_3",
};

const EXCHANGE = "notifications";

const connect = async () => {
  if (connection) return channel;

  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE, "direct", { durable: true });

    await channel.assertQueue(QUEUES.EMAIL, { durable: true });
    await channel.assertQueue(QUEUES.SMS, { durable: true });

    await channel.bindQueue(QUEUES.EMAIL, EXCHANGE, QUEUES.EMAIL);
    await channel.bindQueue(QUEUES.SMS, EXCHANGE, QUEUES.SMS);

    await channel.assertQueue(QUEUES.EMAIL_DELAY_1, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": EXCHANGE,
        "x-dead-letter-routing-key": QUEUES.EMAIL,
        "x-message-ttl": 10000, // 10 seconds backoff
      },
    });
    await channel.assertQueue(QUEUES.EMAIL_DELAY_2, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": EXCHANGE,
        "x-dead-letter-routing-key": QUEUES.EMAIL,
        "x-message-ttl": 30000, // 30 seconds backoff
      },
    });
    await channel.assertQueue(QUEUES.EMAIL_DELAY_3, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": EXCHANGE,
        "x-dead-letter-routing-key": QUEUES.EMAIL,
        "x-message-ttl": 90000, // 90 seconds backoff
      },
    });

    await channel.assertQueue(QUEUES.SMS_DELAY_1, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": EXCHANGE,
        "x-dead-letter-routing-key": QUEUES.SMS,
        "x-message-ttl": 10000, // 10 seconds backoff
      },
    });
    await channel.assertQueue(QUEUES.SMS_DELAY_2, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": EXCHANGE,
        "x-dead-letter-routing-key": QUEUES.SMS,
        "x-message-ttl": 30000, // 30 seconds backoff
      },
    });
    await channel.assertQueue(QUEUES.SMS_DELAY_3, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": EXCHANGE,
        "x-dead-letter-routing-key": QUEUES.SMS,
        "x-message-ttl": 90000, // 90 seconds backoff
      },
    });

    connection.on("close", () => {
      logger.error("RabbitMQ connection closed. Reconnecting...");
      connection = null;
      channel = null;
      setTimeout(connect, 5000);
    });

    logger.info("Connected to RabbitMQ");
    return channel;
  } catch (err) {
    logger.error("Failed to connect to RabbitMQ: " + err.message);
    logger.info("Notifications will operate in fallback mode (direct send)");
    return null;
  }
};

const publish = async (queue, message) => {
  const ch = await connect();
  if (!ch) return false;

  try {
    ch.publish(EXCHANGE, queue, Buffer.from(JSON.stringify(message)), {
      persistent: true,
      contentType: "application/json",
      headers: {
        retry_count: message.retryCount || 0,
        history_id: message.historyId,
      },
    });
    return true;
  } catch (err) {
    logger.error("Failed to publish message: " + err.message);
    return false;
  }
};

const close = async () => {
  if (channel) await channel.close();
  if (connection) await connection.close();
};

module.exports = {
  connect,
  publish,
  close,
  QUEUES,
  EXCHANGE,
};
