const sgMail = require('@sendgrid/mail');
const { sendEmail } = require('../../src/services/emailService');

jest.mock('@sendgrid/mail', () => {
  return {
    setApiKey: jest.fn(),
    send: jest.fn()
  };
});

describe('Email Service', () => {
  beforeEach(() => {
    process.env.EMAIL_FROM = 'noreply@example.com';
    jest.clearAllMocks();
  });

  it('should send email using template successfully', async () => {
    sgMail.send.mockResolvedValue([{ headers: { 'x-message-id': 'sg-msg-id-123' } }]);

    const result = await sendEmail({
      to: 'customer@example.com',
      templateId: 'd-test-template',
      dynamicTemplateData: { name: 'Customer' }
    });

    expect(sgMail.send).toHaveBeenCalledWith({
      to: 'customer@example.com',
      from: 'noreply@example.com',
      templateId: 'd-test-template',
      dynamicTemplateData: { name: 'Customer' }
    });
    expect(result).toEqual({ success: true, messageId: 'sg-msg-id-123' });
  });

  it('should send direct text/html email if no template is provided', async () => {
    sgMail.send.mockResolvedValue([{ headers: {} }]);

    const result = await sendEmail({
      to: 'customer@example.com',
      subject: 'Test Subject',
      text: 'Hello world',
      html: '<h1>Hello world</h1>'
    });

    expect(sgMail.send).toHaveBeenCalledWith({
      to: 'customer@example.com',
      from: 'noreply@example.com',
      subject: 'Test Subject',
      text: 'Hello world',
      html: '<h1>Hello world</h1>'
    });
    expect(result.success).toBe(true);
  });

  it('should throw error if SendGrid fails to send', async () => {
    sgMail.send.mockRejectedValue(new Error('SendGrid API Down'));

    await expect(sendEmail({
      to: 'customer@example.com',
      templateId: 'd-test-template',
    })).rejects.toThrow('SendGrid API Down');
  });
});
