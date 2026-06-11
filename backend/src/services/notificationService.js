const crypto = require("crypto");
const rabbitmq = require("../config/rabbitmq");
const notificationModel = require("../models/notificationModel");
const logger = require("../utils/logger");
const { sendEmail } = require("./emailService");
const { sendSMS } = require("./smsService");

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const queueNotification = async ({
  type,
  userId,
  recipient,
  templateName,
  payload,
}) => {
  const template = await notificationModel.findByName(templateName);
  if (!template) {
    throw new Error(`Template not found: ${templateName}`);
  }

  const history = await notificationModel.createHistory({
    userId,
    type,
    recipient,
    templateId: template.id,
    payload,
  });

  const message = {
    historyId: history.id,
    type,
    recipient,
    templateId: template.template_id,
    payload,
    retryCount: 0,
  };

  const queue = type === "email" ? rabbitmq.QUEUES.EMAIL : rabbitmq.QUEUES.SMS;
  const published = await rabbitmq.publish(queue, message);

  if (!published) {
    await processDirect(message);
  }

  return history;
};

const processDirect = async (message) => {
  try {
    let result;
    if (message.type === "email") {
      result = await sendEmail({
        to: message.recipient,
        templateId: message.templateId,
        dynamicTemplateData: message.payload,
      });
    } else {
      result = await sendSMS({
        to: message.recipient,
        body: message.payload.body || message.payload.message || "",
      });
    }

    await notificationModel.updateHistoryStatus(message.historyId, "sent");
    return result;
  } catch (err) {
    await notificationModel.updateHistoryStatus(
      message.historyId,
      "failed",
      err.message,
    );
    throw err;
  }
};

const processEmail = async (message) => {
  try {
    await notificationModel.incrementRetry(message.historyId);

    const result = await sendEmail({
      to: message.recipient,
      templateId: message.templateId,
      dynamicTemplateData: message.payload,
    });

    await notificationModel.updateHistoryStatus(message.historyId, "SENT");
    logger.info(`Email sent: ${message.historyId}`);
    return result;
  } catch (err) {
    const shouldRetry = (message.retryCount || 0) < 3;
    const status = shouldRetry ? "failed" : "failed";
    await notificationModel.updateHistoryStatus(
      message.historyId,
      status,
      err.message,
    );
    throw err;
  }
};

const processSMS = async (message) => {
  try {
    await notificationModel.incrementRetry(message.historyId);

    const result = await sendSMS({
      to: message.recipient,
      body: message.payload.body || message.payload.message || "",
    });

    await notificationModel.updateHistoryStatus(message.historyId, "SENT");
    logger.info(`SMS sent: ${message.historyId}`);
    return result;
  } catch (err) {
    await notificationModel.updateHistoryStatus(
      message.historyId,
      "failed",
      err.message,
    );
    throw err;
  }
};

module.exports = {
  generateOTP,
  queueNotification,
  processEmail,
  processSMS,
  processDirect,
};
