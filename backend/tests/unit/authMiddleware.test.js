const { authMiddleware, authorize } = require("../../src/middleware/auth");
const { verifyAccessToken } = require("../../src/utils/jwt");

jest.mock("../../src/utils/jwt");

describe("Auth Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("authMiddleware", () => {
    it("should call next if token is valid", () => {
      req.headers.authorization = "Bearer valid-token";
      const decodedUser = { sub: "user-123", role: "admin" };
      verifyAccessToken.mockReturnValue(decodedUser);

      authMiddleware(req, res, next);

      expect(verifyAccessToken).toHaveBeenCalledWith("valid-token");
      expect(req.user).toEqual(decodedUser);
      expect(next).toHaveBeenCalled();
    });

    it("should return 401 if authorization header is missing", () => {
      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Access denied. No token provided.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if token is expired", () => {
      req.headers.authorization = "Bearer expired-token";
      const error = new Error("jwt expired");
      error.name = "TokenExpiredError";
      verifyAccessToken.mockImplementation(() => {
        throw error;
      });

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Token expired.",
      });
    });

    it("should return 401 if token is invalid", () => {
      req.headers.authorization = "Bearer invalid-token";
      verifyAccessToken.mockImplementation(() => {
        throw new Error("invalid signature");
      });

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid token.",
      });
    });
  });

  describe("authorize", () => {
    it("should allow access if user has the required role", () => {
      req.user = { role: "admin" };
      const middleware = authorize("admin", "editor");

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should forbid access if user does not have the required role", () => {
      req.user = { role: "user" };
      const middleware = authorize("admin");

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Forbidden. Insufficient permissions.",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
