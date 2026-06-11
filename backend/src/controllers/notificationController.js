const notificationModel = require('../models/notificationModel');
const logger = require('../utils/logger');

const createTemplate = async (req, res) => {
  try {
    const { name, type, templateId, subject, variables } = req.body;

    if (!name || !type || !templateId) {
      return res.status(400).json({
        success: false,
        message: 'Name, type, and templateId are required.',
      });
    }

    const existing = await notificationModel.findByName(name);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Template with this name already exists.',
      });
    }

    const template = await notificationModel.createTemplate({
      name,
      type,
      templateId,
      subject,
      variables,
    });

    res.status(201).json({
      success: true,
      message: 'Template created.',
      data: { template },
    });
  } catch (err) {
    logger.error('Create template error: ' + err);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const getHistory = async (req, res) => {
  try {
    const { userId, type, status, page, limit } = req.query;

    const result = await notificationModel.getHistory({
      userId,
      type,
      status,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    logger.error('Get history error: ' + err);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const retryFailed = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await notificationModel.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    if (notification.status !== 'failed') {
      return res.status(400).json({
        success: false,
        message: 'Only failed notifications can be retried.',
      });
    }

    const rabbitmq = require('../config/rabbitmq');
    const notificationService = require('../services/notificationService');

    const message = {
      historyId: notification.id,
      type: notification.type,
      recipient: notification.recipient,
      templateId: notification.external_template_id,
      payload: notification.payload,
      retryCount: notification.retry_count,
    };

    const queue = notification.type === 'email' ? rabbitmq.QUEUES.EMAIL : rabbitmq.QUEUES.SMS;
    const published = await rabbitmq.publish(queue, message);

    if (published) {
      await notificationModel.updateHistoryStatus(notification.id, 'retrying');
    } else {
      await notificationService.processDirect(message);
    }

    res.json({
      success: true,
      message: 'Notification queued for retry.',
    });
  } catch (err) {
    logger.error('Retry error: ' + err);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const triggerNotification = async (req, res) => {
  try {
    const { type, recipient, templateName, payload } = req.body;
    const notificationService = require('../services/notificationService');

    const history = await notificationService.queueNotification({
      type,
      userId: req.user ? req.user.sub : null,
      recipient,
      templateName,
      payload: payload || {},
    });

    res.status(202).json({
      success: true,
      message: 'Notification queued successfully.',
      data: { historyId: history.id },
    });
  } catch (err) {
    logger.error('Trigger notification error: ' + err);
    res.status(err.message.includes('Template not found') ? 404 : 500).json({
      success: false,
      message: err.message || 'Internal server error.',
    });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const stats = await notificationModel.getAnalytics();
    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    logger.error('Get analytics error: ' + err);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

module.exports = {
  createTemplate,
  getHistory,
  retryFailed,
  triggerNotification,
  getAnalytics,
};
