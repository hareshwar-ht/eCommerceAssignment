const bcrypt = require("bcrypt");
const pool = require("../config/database");

const SALT_ROUNDS = 10;

const create = async (userId, token) => {
  const tokenHash = await bcrypt.hash(token, SALT_ROUNDS);
  const expiresAt = new Date(
    Date.now() + parseInt(process.env.REFRESH_TOKEN_EXPIRES_MS),
  );

  const result = await pool.query(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3) RETURNING id, expires_at",
    [userId, tokenHash, expiresAt],
  );
  return result.rows[0];
};

const findByUserId = async (userId) => {
  const result = await pool.query(
    "SELECT id, user_id, token_hash, expires_at FROM refresh_tokens WHERE user_id = $1 AND expires_at > NOW()",
    [userId],
  );
  return result.rows;
};

const findByUserIdSingle = async (userId) => {
  const result = await pool.query(
    "SELECT id, user_id, token_hash, expires_at FROM refresh_tokens WHERE user_id = $1 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
    [userId],
  );
  return result.rows[0] || null;
};

const verifyToken = async (token, tokenHash) => {
  return bcrypt.compare(token, tokenHash);
};

const deleteByUserId = async (userId) => {
  await pool.query("DELETE FROM refresh_tokens WHERE user_id = $1", [userId]);
};

const deleteAllExpired = async () => {
  await pool.query("DELETE FROM refresh_tokens WHERE expires_at <= NOW()");
};

module.exports = {
  create,
  findByUserId,
  findByUserIdSingle,
  verifyToken,
  deleteByUserId,
  deleteAllExpired,
};
