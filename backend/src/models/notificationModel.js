const pool = require('../config/database');

const createTemplate = async ({ name, type, templateId, subject, variables }) => {
  const result = await pool.query(
    `INSERT INTO notification_templates (name, type, template_id, subject, variables)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, type, templateId, subject || null, JSON.stringify(variables || [])]
  );
  return result.rows[0];
};

const findByName = async (name) => {
  const result = await pool.query(
    'SELECT * FROM notification_templates WHERE name = $1 AND is_active = true',
    [name]
  );
  return result.rows[0] || null;
};

const findById = async (id) => {
  const result = await pool.query(
    `SELECT nh.*, nt.template_id as external_template_id
     FROM notification_history nh
     LEFT JOIN notification_templates nt ON nh.template_id = nt.id
     WHERE nh.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const createHistory = async ({ userId, type, recipient, templateId, payload }) => {
  const result = await pool.query(
    `INSERT INTO notification_history (user_id, type, recipient, template_id, payload)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, type, recipient, templateId || null, JSON.stringify(payload || {})]
  );
  return result.rows[0];
};

const updateHistoryStatus = async (id, status, errorMessage) => {
  const fields = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
  const values = [status];

  if (status === 'sent') {
    fields.push('sent_at = CURRENT_TIMESTAMP');
  }

  if (errorMessage) {
    fields.push(`error_message = $${values.length + 1}`);
    values.push(errorMessage);
  }

  values.push(id);

  await pool.query(
    `UPDATE notification_history SET ${fields.join(', ')} WHERE id = $${values.length}`,
    values
  );
};

const incrementRetry = async (id) => {
  await pool.query(
    `UPDATE notification_history
     SET retry_count = retry_count + 1, status = 'retrying', updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [id]
  );
};

const getFailedRetriable = async (limit = 50) => {
  const result = await pool.query(
    `SELECT * FROM notification_history
     WHERE status IN ('failed', 'retrying')
     AND retry_count < max_retries
     ORDER BY created_at ASC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
};

const getHistory = async ({ userId, type, status, page = 1, limit = 20 }) => {
  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (userId) {
    conditions.push(`user_id = $${paramIndex}`);
    values.push(userId);
    paramIndex++;
  }
  if (type) {
    conditions.push(`type = $${paramIndex}`);
    values.push(type);
    paramIndex++;
  }
  if (status) {
    conditions.push(`status = $${paramIndex}`);
    values.push(status);
    paramIndex++;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const [historyResult, countResult] = await Promise.all([
    pool.query(
      `SELECT nh.*, nt.name as template_name
       FROM notification_history nh
       LEFT JOIN notification_templates nt ON nh.template_id = nt.id
       ${whereClause}
       ORDER BY nh.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*) FROM notification_history nh ${whereClause}`,
      values
    ),
  ]);

  return {
    records: historyResult.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    limit,
  };
};

const getAnalytics = async () => {
  const result = await pool.query(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'retrying' THEN 1 ELSE 0 END) as retrying,
      type
    FROM notification_history
    GROUP BY type
  `);
  return result.rows;
};

module.exports = {
  createTemplate,
  findByName,
  findById,
  createHistory,
  updateHistoryStatus,
  incrementRetry,
  getFailedRetriable,
  getHistory,
  getAnalytics,
};
