const bcrypt = require("bcrypt");
const pool = require("../config/database");

const SALT_ROUNDS = 10;

const create = async ({ name, email, password, phone, role }) => {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await pool.query(
    "INSERT INTO users (name, email, password_hash, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone, role, created_at",
    [name, email, passwordHash, phone || null, role || 'user'],
  );
  return result.rows[0];
};

const findByEmail = async (email) => {
  const result = await pool.query(
    "SELECT id, name, email, phone, role, password_hash FROM users WHERE email = $1",
    [email],
  );
  return result.rows[0] || null;
};

const findById = async (id) => {
  const result = await pool.query(
    "SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1",
    [id],
  );
  return result.rows[0] || null;
};

const verifyPassword = async (plainPassword, hash) => {
  return bcrypt.compare(plainPassword, hash);
};

const saveResetToken = async (email, token, expiresAt) => {
  await pool.query(
    "UPDATE users SET reset_token = $1, reset_token_expires = $2, updated_at = CURRENT_TIMESTAMP WHERE email = $3",
    [token, expiresAt, email],
  );
};

const findByResetToken = async (token) => {
  const result = await pool.query(
    "SELECT id, name, email FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()",
    [token],
  );
  return result.rows[0] || null;
};

const clearResetToken = async (userId) => {
  await pool.query(
    "UPDATE users SET reset_token = NULL, reset_token_expires = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
    [userId],
  );
};

const updatePassword = async (userId, newPassword) => {
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.query(
    "UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
    [passwordHash, userId],
  );
};

const updateProfile = async (userId, { name, email, phone }) => {
  const result = await pool.query(
    "UPDATE users SET name = $1, email = $2, phone = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, name, email, phone, role",
    [name, email, phone, userId]
  );
  return result.rows[0];
};

const deleteProfile = async (userId) => {
  await pool.query("DELETE FROM users WHERE id = $1", [userId]);
};

module.exports = {
  create,
  findByEmail,
  findById,
  verifyPassword,
  saveResetToken,
  findByResetToken,
  clearResetToken,
  updatePassword,
  updateProfile,
  deleteProfile,
};
