const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async ({ to, from, templateId, dynamicTemplateData, subject, text, html }) => {
  const msg = {
    to,
    from: from || process.env.EMAIL_FROM,
  };

  if (templateId) {
    msg.templateId = templateId;
    msg.dynamicTemplateData = dynamicTemplateData || {};
  } else {
    msg.subject = subject;
    if (text) msg.text = text;
    if (html) msg.html = html;
  }

  const response = await sgMail.send(msg);
  return {
    success: true,
    messageId: response[0]?.headers?.['x-message-id'] || 'unknown',
  };
};

module.exports = { sendEmail };
