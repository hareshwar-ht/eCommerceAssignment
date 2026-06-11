const pool = require("../config/database");

const create = async (name, email, passwordHash, phone, otp, expiresAt) => {
  const result = await pool.query(
    `INSERT INTO pending_registrations (name, email, password_hash, phone, otp, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [name, email, passwordHash, phone, otp, expiresAt],
  );
  return result.rows[0];
};

const findLatestByPhone = async (phone) => {
  const result = await pool.query(
    `SELECT * FROM pending_registrations 
     WHERE phone = $1 AND expires_at > CURRENT_TIMESTAMP 
     ORDER BY created_at DESC LIMIT 1`,
    [phone],
  );
  return result.rows[0] || null;
};

const deleteByPhone = async (phone) => {
  await pool.query("DELETE FROM pending_registrations WHERE phone = $1", [
    phone,
  ]);
};

module.exports = {
  create,
  findLatestByPhone,
  deleteByPhone,
};
