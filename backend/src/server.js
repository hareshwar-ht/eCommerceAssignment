require("dotenv").config();
const app = require("./app");
const pool = require("./config/database");
const { connect } = require("./config/rabbitmq");
const { startConsumer } = require("./services/notificationConsumer");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 5000;

const seedTemplates = async () => {
  const notificationModel = require("./models/notificationModel");

  const templates = [
    {
      name: "register-success",
      type: "email",
      templateId: process.env.SENDGRID_EMAIL_TEMPLATE_REGISTER_SUCCESS,
      subject: "Welcome to our platform!",
      variables: ["name", "login_url"],
    },
    {
      name: "SMS_OTP_REGISTER",
      type: "sms",
      templateId: "sms-otp-register-template",
      subject: "OTP Verification",
      variables: ["body", "otp", "name"],
    },
  ];

  for (const t of templates) {
    const existing = await notificationModel.findByName(t.name);
    if (!existing) {
      await notificationModel.createTemplate(t);
      logger.info(`Seeded template: ${t.name}`);
    }
  }
};

async function startServer() {
  try {
    await pool.query("SELECT 1");
    logger.info("Database connection verified.");

    await seedTemplates();

    await connect();

    startConsumer();

    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error(err, "Failed to start server");
    process.exit(1);
  }
}

// Trigger reload
startServer();
