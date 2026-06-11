const request = require('supertest');
const app = require('../../src/app');
const notificationModel = require('../../src/models/notificationModel');
const notificationService = require('../../src/services/notificationService');
const jwt = require('jsonwebtoken');
const rabbitmq = require('../../src/config/rabbitmq');

jest.mock('../../src/models/notificationModel');
jest.mock('../../src/services/notificationService');
jest.mock('../../src/config/rabbitmq', () => {
  return {
    connect: jest.fn(),
    publish: jest.fn(),
    QUEUES: {
      EMAIL: 'email_notifications',
      SMS: 'sms_notifications',
    }
  };
});

describe('Notification Routes Integration', () => {
  let token;

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-secret';
    token = jwt.sign({ sub: 'user-id', role: 'admin' }, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/notifications/send', () => {
    it('should trigger a notification successfully', async () => {
      notificationService.queueNotification.mockResolvedValue({ id: 'hist-id' });

      const response = await request(app)
        .post('/api/notifications/send')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'email',
          recipient: 'test@example.com',
          templateName: 'welcome',
          payload: { name: 'Test' },
        });

      expect(response.status).toBe(202);
      expect(response.body.success).toBe(true);
      expect(response.body.data.historyId).toBe('hist-id');
    });

    it('should return 400 on invalid input', async () => {
      const response = await request(app)
        .post('/api/notifications/send')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'unknown',
          recipient: 'test@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/notifications/templates', () => {
    it('should create template successfully', async () => {
      const templateData = { name: 'order-confirm', type: 'email', templateId: 'sg-temp-123', subject: 'Your Order' };
      notificationModel.findByName.mockResolvedValue(null);
      notificationModel.createTemplate.mockResolvedValue({ id: 'temp-uuid', ...templateData });

      const response = await request(app)
        .post('/api/notifications/templates')
        .set('Authorization', `Bearer ${token}`)
        .send(templateData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.template.id).toBe('temp-uuid');
    });

    it('should fail if template name exists', async () => {
      notificationModel.findByName.mockResolvedValue({ id: 'existing' });

      const response = await request(app)
        .post('/api/notifications/templates')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'existing', type: 'email', templateId: '123' });

      expect(response.status).toBe(409);
    });
  });

  describe('GET /api/notifications/history', () => {
    it('should retrieve history logs', async () => {
      const logs = { records: [{ id: '1', recipient: 'bob@example.com' }], total: 1, page: 1, limit: 20 };
      notificationModel.getHistory.mockResolvedValue(logs);

      const response = await request(app)
        .get('/api/notifications/history')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data.total).toBe(1);
    });
  });

  describe('GET /api/notifications/analytics', () => {
    it('should return analytics stats', async () => {
      const stats = [{ total: 10, sent: 8, failed: 2, type: 'email' }];
      notificationModel.getAnalytics.mockResolvedValue(stats);

      const response = await request(app)
        .get('/api/notifications/analytics')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(stats);
    });
  });

  describe('POST /api/notifications/history/:id/retry', () => {
    it('should queue a failed notification for manual retry', async () => {
      const failedNotif = {
        id: 'hist-uuid',
        status: 'failed',
        type: 'email',
        recipient: 'test@example.com',
        external_template_id: 'sg-external-123',
        payload: { body: 'data' },
        retry_count: 1
      };
      
      notificationModel.findById.mockResolvedValue(failedNotif);
      rabbitmq.publish.mockResolvedValue(true);
      notificationModel.updateHistoryStatus.mockResolvedValue({});

      const response = await request(app)
        .post('/api/notifications/history/hist-uuid/retry')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(rabbitmq.publish).toHaveBeenCalledWith(
        rabbitmq.QUEUES.EMAIL,
        expect.objectContaining({
          historyId: 'hist-uuid',
          templateId: 'sg-external-123'
        })
      );
    });

    it('should fallback to direct send if RabbitMQ is not available during retry', async () => {
      const failedNotif = {
        id: 'hist-uuid',
        status: 'failed',
        type: 'sms',
        recipient: '+1234567890',
        external_template_id: 'sms-temp',
        payload: { message: 'hello' },
        retry_count: 0
      };

      notificationModel.findById.mockResolvedValue(failedNotif);
      rabbitmq.publish.mockResolvedValue(false); // RabbitMQ fail
      notificationService.processDirect.mockResolvedValue({});

      const response = await request(app)
        .post('/api/notifications/history/hist-uuid/retry')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(notificationService.processDirect).toHaveBeenCalled();
    });

    it('should fail if notification is not in failed state', async () => {
      notificationModel.findById.mockResolvedValue({ id: 'hist-uuid', status: 'sent' });

      const response = await request(app)
        .post('/api/notifications/history/hist-uuid/retry')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    it('should return 404 if notification is not found', async () => {
      notificationModel.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/notifications/history/missing-uuid/retry')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});
