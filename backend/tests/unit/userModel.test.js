const bcrypt = require("bcrypt");
const pool = require("../../src/config/database");
const userModel = require("../../src/models/userModel");

jest.mock("../../src/config/database", () => {
  return {
    query: jest.fn(),
  };
});

describe("User Model", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findByEmail", () => {
    it("should find user by email", async () => {
      const mockUser = { id: "1", email: "test@example.com" };
      pool.query.mockResolvedValue({ rows: [mockUser] });

      const user = await userModel.findByEmail("test@example.com");
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining(
          "SELECT id, name, email, phone, role, password_hash FROM users WHERE email =",
        ),
        ["test@example.com"],
      );
      expect(user).toEqual(mockUser);
    });

    it("should return null if user not found", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const user = await userModel.findByEmail("missing@example.com");
      expect(user).toBeNull();
    });
  });

  describe("findById", () => {
    it("should find user by id", async () => {
      const mockUser = { id: "1", email: "test@example.com" };
      pool.query.mockResolvedValue({ rows: [mockUser] });

      const user = await userModel.findById("1");
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining(
          "SELECT id, name, email, phone, role, created_at FROM users WHERE id =",
        ),
        ["1"],
      );
      expect(user).toEqual(mockUser);
    });
  });

  describe("create", () => {
    it("should create user and hash password", async () => {
      const mockUser = { id: "1", name: "Bob" };
      pool.query.mockResolvedValue({ rows: [mockUser] });

      const user = await userModel.create({
        name: "Bob",
        email: "bob@example.com",
        password: "password123",
        phone: "1234567890",
      });

      expect(pool.query).toHaveBeenCalled();
      expect(user).toEqual(mockUser);
    });
  });

  describe("verifyPassword", () => {
    it("should verify correct password", async () => {
      const hash = await bcrypt.hash("password123", 10);
      const isValid = await userModel.verifyPassword("password123", hash);
      expect(isValid).toBe(true);
    });

    it("should fail on wrong password", async () => {
      const hash = await bcrypt.hash("password123", 10);
      const isValid = await userModel.verifyPassword("wrong", hash);
      expect(isValid).toBe(false);
    });
  });

  describe("saveResetToken", () => {
    it("should save token and expiry", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      await userModel.saveResetToken(
        "bob@example.com",
        "token-abc",
        new Date(),
      );
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE users SET reset_token ="),
        ["token-abc", expect.any(Date), "bob@example.com"],
      );
    });
  });

  describe("findByResetToken", () => {
    it("should find user with valid token and expiry", async () => {
      const mockUser = { id: "1" };
      pool.query.mockResolvedValue({ rows: [mockUser] });

      const user = await userModel.findByResetToken("token-abc");
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining(
          "SELECT id, name, email FROM users WHERE reset_token =",
        ),
        ["token-abc"],
      );
      expect(user).toEqual(mockUser);
    });
  });

  describe("clearResetToken", () => {
    it("should clear reset token fields", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      await userModel.clearResetToken("user-123");
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE users SET reset_token = NULL"),
        ["user-123"],
      );
    });
  });

  describe("updatePassword", () => {
    it("should hash new password and update user", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      await userModel.updatePassword("user-123", "newpassword");
      expect(pool.query).toHaveBeenCalled();
    });
  });
});
