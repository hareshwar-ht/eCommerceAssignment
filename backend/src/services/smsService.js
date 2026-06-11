const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

const sendSMS = async ({ to, body }) => {
  let formattedTo = to;
  if (formattedTo && !formattedTo.startsWith("+")) {
    let cleaned = formattedTo.replace(/[\s()-]/g, "");
    if (cleaned.length === 10 && /^\d+$/.test(cleaned)) {
      formattedTo = `+91${cleaned}`;
    } else if (
      cleaned.startsWith("91") &&
      cleaned.length === 12 &&
      /^\d+$/.test(cleaned)
    ) {
      formattedTo = `+${cleaned}`;
    } else {
      formattedTo = `+${cleaned}`;
    }
  }

  const message = await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER_FROM,
    to: formattedTo,
  });
  return {
    success: true,
    messageId: message.sid,
  };
};

module.exports = { sendSMS };
