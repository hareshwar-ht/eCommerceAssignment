const request = require("supertest");
const app = require("../../src/app");
const userModel = require("../../src/models/userModel");
const refreshTokenModel = require("../../src/models/refreshTokenModel");
const notificationService = require("../../src/services/notificationService");
const pool = require("../../src/config/database");
const jwt = require("jsonwebtoken");

jest.mock("../../src/models/userModel");
jest.mock("../../src/models/refreshTokenModel");
jest.mock("../../src/services/notificationService");
jest.mock("../../src/config/database", () => {
  const mPool = {
    query: jest.fn(),
    on: jest.fn(),
  };
  mPool.connect = jest.fn().mockImplementation(() => ({
    query: mPool.query,
    release: jest.fn(),
  }));
  return mPool;
});

describe("User Routes / Auth Controller Integration", () => {
  let token;
  const accessSecret = "access-secret-test-123";
  const refreshSecret = "refresh-secret-test-123";

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = accessSecret;
    process.env.JWT_REFRESH_SECRET = refreshSecret;
    process.env.ACCESS_TOKEN_EXPIRES = "15m";
    process.env.REFRESH_TOKEN_EXPIRES_MS = "604800000";
    process.env.REFRESH_TOKEN_EXPIRES = "7d";
    token = jwt.sign({ sub: "user-123", role: "user" }, accessSecret, {
      expiresIn: "1h",
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/user/register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        name: "Alice",
        email: "alice@example.com",
        password: "password123",
        phone: "9876543210",
      };
      const createdUser = {
        id: "alice-id",
        name: "Alice",
        email: "alice@example.com",
        phone: "+919876543210",
        role: "user",
      };

      userModel.findByEmail.mockResolvedValue(null);
      userModel.create.mockResolvedValue(createdUser);
      notificationService.generateOTP.mockReturnValue("123456");
      refreshTokenModel.create.mockResolvedValue({});

      const response = await request(app)
        .post("/api/user/register")
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe("alice-id");
      expect(notificationService.queueNotification).toHaveBeenCalledTimes(2); // sms and email welcome
    });

    it("should fail registration if email is already taken", async () => {
      userModel.findByEmail.mockResolvedValue({ id: "existing" });

      const response = await request(app)
        .post("/api/user/register")
        .send({
          name: "Bob",
          email: "bob@example.com",
          password: "password123",
          phone: "9876543210",
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it("should fail if fields are missing", async () => {
      const response = await request(app)
        .post("/api/user/register")
        .send({ name: "Bob" });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("required");
    });
  });

  describe("POST /api/user/register/initiate", () => {
    it("should initiate OTP registration successfully", async () => {
      userModel.findByEmail.mockResolvedValue(null);
      notificationService.generateOTP.mockReturnValue("654321");
      pool.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .post("/api/user/register/initiate")
        .send({
          name: "Bob",
          email: "bob@example.com",
          password: "password123",
          phone: "9876543210",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(notificationService.queueNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "sms",
          recipient: "+919876543210",
          templateName: "SMS_OTP_REGISTER",
        }),
      );
    });
  });

  describe("POST /api/user/register/verify", () => {
    it("should verify OTP and register user successfully", async () => {
      const pendingData = {
        name: "Bob",
        email: "bob@example.com",
        password_hash: "hashed",
        phone: "+919876543210",
        otp: "654321",
      };

      pool.query
        .mockResolvedValueOnce({ rows: [pendingData] }) // Select pending
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [
            {
              id: "bob-id",
              name: "Bob",
              email: "bob@example.com",
              phone: "+919876543210",
              role: "user",
            },
          ],
        }) // Insert user
        .mockResolvedValueOnce({ rows: [] }) // Delete pending
        .mockResolvedValueOnce({}); // COMMIT

      userModel.findByEmail.mockResolvedValue(null);
      refreshTokenModel.create.mockResolvedValue({});

      const response = await request(app)
        .post("/api/user/register/verify")
        .send({ phone: "9876543210", otp: "654321" });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe("bob@example.com");
    });

    it("should return error on invalid OTP", async () => {
      pool.query.mockResolvedValue({ rows: [] }); // No pending registration

      const response = await request(app)
        .post("/api/user/register/verify")
        .send({ phone: "9876543210", otp: "000000" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/user/login", () => {
    it("should login user and set cookie", async () => {
      const user = {
        id: "user-id",
        email: "user@example.com",
        password_hash: "hash",
        role: "user",
      };
      userModel.findByEmail.mockResolvedValue(user);
      userModel.verifyPassword.mockResolvedValue(true);
      refreshTokenModel.create.mockResolvedValue({});

      const response = await request(app)
        .post("/api/user/login")
        .send({ email: "user@example.com", password: "password123" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should return 401 on incorrect credentials", async () => {
      userModel.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/user/login")
        .send({ email: "wrong@example.com", password: "password" });

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/user/forgot-password", () => {
    it("should send reset URL", async () => {
      userModel.findByEmail.mockResolvedValue({
        id: "user-id",
        email: "user@example.com",
      });
      userModel.saveResetToken.mockResolvedValue({});

      const response = await request(app)
        .post("/api/user/forgot-password")
        .send({ email: "user@example.com" });

      expect(response.status).toBe(200);
      expect(response.body.data.resetUrl).toBeDefined();
    });
  });

  describe("POST /api/user/reset-password", () => {
    it("should reset password with valid token", async () => {
      userModel.findByResetToken.mockResolvedValue({ id: "user-id" });
      userModel.updatePassword.mockResolvedValue({});
      refreshTokenModel.deleteByUserId.mockResolvedValue({});

      const response = await request(app)
        .post("/api/user/reset-password")
        .send({ token: "valid-reset-token", newPassword: "newsecurepassword" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return error for invalid reset token", async () => {
      userModel.findByResetToken.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/user/reset-password")
        .send({ token: "invalid-token", newPassword: "newsecurepassword" });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/user/profile", () => {
    it("should return profile for authenticated user", async () => {
      userModel.findById.mockResolvedValue({
        id: "user-123",
        name: "Bob",
        email: "bob@example.com",
      });

      const response = await request(app)
        .get("/api/user/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.name).toBe("Bob");
    });

    it("should return 401 if unauthenticated", async () => {
      const response = await request(app).get("/api/user/profile");
      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/user/logout", () => {
    it("should clear cookies and return success", async () => {
      const refreshToken = jwt.sign({ sub: "user-123" }, refreshSecret);

      refreshTokenModel.deleteByUserId.mockResolvedValue({});

      const response = await request(app)
        .post("/api/user/logout")
        .set("Cookie", [`refreshToken=${refreshToken}`]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
