const jwt = require("jsonwebtoken");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} = require("../../src/utils/jwt");

describe("JWT Utility", () => {
  const user = { id: "user-id", role: "admin" };

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = "access-secret";
    process.env.JWT_REFRESH_SECRET = "refresh-secret";
    process.env.ACCESS_TOKEN_EXPIRES = "15m";
    process.env.REFRESH_TOKEN_EXPIRES = "7d";
  });

  it("should generate a valid access token", () => {
    const token = generateAccessToken(user);
    expect(token).toBeDefined();

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    expect(decoded.sub).toBe(user.id);
    expect(decoded.role).toBe(user.role);
  });

  it("should generate a valid refresh token", () => {
    const token = generateRefreshToken(user);
    expect(token).toBeDefined();

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    expect(decoded.sub).toBe(user.id);
  });

  it("should verify a valid access token", () => {
    const token = jwt.sign(
      { sub: user.id, role: user.role },
      process.env.JWT_ACCESS_SECRET,
    );
    const result = verifyAccessToken(token);
    expect(result.sub).toBe(user.id);
    expect(result.role).toBe(user.role);
  });

  it("should verify a valid refresh token", () => {
    const token = jwt.sign({ sub: user.id }, process.env.JWT_REFRESH_SECRET);
    const result = verifyRefreshToken(token);
    expect(result.sub).toBe(user.id);
  });
});
