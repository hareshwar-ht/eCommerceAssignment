const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerDocs = require("./config/swagger");
const logger = require("./utils/logger");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const maxAuthRequests = 500;
const maxForgotRequests = parseInt(process.env.FORGOT_RATE_LIMIT_MAX, 10) || 3;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: maxAuthRequests,
  message: { success: false, message: "Too many attempts. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/user/login", authLimiter);
app.use("/api/user/register", authLimiter);
app.use("/api/user/register/initiate", authLimiter);
app.use("/api/user/register/verify", authLimiter);
app.use("/api/user/refresh", authLimiter);
app.use(
  "/api/user/forgot-password",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: maxForgotRequests,
    message: { success: false, message: "Too many attempts. Try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use("/api/user", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.get("/favicon.ico", (req, res) => res.status(204).end());

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

app.use((err, req, res, _next) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error.",
    errorDetail: err.message, // added for debugging
    stack: err.stack, // added for debugging
  });
});

module.exports = app;
