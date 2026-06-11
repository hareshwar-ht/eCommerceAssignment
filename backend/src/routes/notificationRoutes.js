const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const notificationController = require('../controllers/notificationController');
const { authMiddleware, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management, triggering, history, and templates
 */

const triggerSchema = z.object({
  type: z.enum(['email', 'sms']),
  recipient: z.string().min(1),
  templateName: z.string().min(1),
  payload: z.record(z.any()).optional(),
});

const triggerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many notification requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @swagger
 * /api/notifications/send:
 *   post:
 *     summary: Trigger a notification (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - recipient
 *               - templateName
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [email, sms]
 *               recipient:
 *                 type: string
 *                 description: Email address or Phone number (+E.164 format)
 *               templateName:
 *                 type: string
 *                 description: The name of the registered template
 *               payload:
 *                 type: object
 *                 description: Dynamic parameters for substitution (e.g. name, otp, etc.)
 *     responses:
 *       202:
 *         description: Notification queued successfully
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin role required)
 *       404:
 *         description: Template not found
 *       500:
 *         description: Internal server error
 */
router.post('/send', authMiddleware, authorize('admin'), triggerLimiter, validate(triggerSchema), notificationController.triggerNotification);

/**
 * @swagger
 * /api/notifications/templates:
 *   post:
 *     summary: Create a notification template (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - templateId
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [email, sms]
 *               templateId:
 *                 type: string
 *                 description: SendGrid template ID or Twilio template mapping key
 *               subject:
 *                 type: string
 *                 description: (Email only) Subject line
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of expected template variables
 *     responses:
 *       201:
 *         description: Template created successfully
 *       400:
 *         description: Missing fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Template name already exists
 *       500:
 *         description: Internal server error
 */
router.post('/templates', authMiddleware, authorize('admin'), notificationController.createTemplate);

/**
 * @swagger
 * /api/notifications/history:
 *   get:
 *     summary: Retrieve notification history (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [email, sms]
 *         description: Filter by notification type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, sent, failed, retrying]
 *         description: Filter by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated history retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get('/history', authMiddleware, authorize('admin'), notificationController.getHistory);

/**
 * @swagger
 * /api/notifications/history/{id}/retry:
 *   post:
 *     summary: Manually retry a failed notification (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification history record ID
 *     responses:
 *       200:
 *         description: Notification queued for retry
 *       400:
 *         description: Notification was not in failed status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Notification history record not found
 *       500:
 *         description: Internal server error
 */
router.post('/history/:id/retry', authMiddleware, authorize('admin'), notificationController.retryFailed);

/**
 * @swagger
 * /api/notifications/analytics:
 *   get:
 *     summary: Get notification delivery analytics (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Delivery statistics grouped by type
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get('/analytics', authMiddleware, authorize('admin'), notificationController.getAnalytics);

module.exports = router;
