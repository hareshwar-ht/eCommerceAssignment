exports.up = function(db, callback) {
  db.runSql(`
    ALTER TABLE notification_templates DROP COLUMN body;
    ALTER TABLE notification_templates ADD COLUMN template_id VARCHAR(255);
    ALTER TABLE notification_templates ADD COLUMN variables JSONB;
    ALTER TABLE notification_templates ADD COLUMN is_active BOOLEAN DEFAULT true;

    ALTER TABLE notification_history DROP COLUMN template_name;
    ALTER TABLE notification_history ADD COLUMN template_id UUID REFERENCES notification_templates(id);
    ALTER TABLE notification_history ADD COLUMN retry_count INT DEFAULT 0;
    ALTER TABLE notification_history ADD COLUMN max_retries INT DEFAULT 3;
    ALTER TABLE notification_history ADD COLUMN sent_at TIMESTAMP;
  `, callback);
};

exports.down = function(db, callback) {
  db.runSql(`
    ALTER TABLE notification_history DROP COLUMN sent_at;
    ALTER TABLE notification_history DROP COLUMN max_retries;
    ALTER TABLE notification_history DROP COLUMN retry_count;
    ALTER TABLE notification_history DROP COLUMN template_id;
    ALTER TABLE notification_history ADD COLUMN template_name VARCHAR(100);

    ALTER TABLE notification_templates DROP COLUMN is_active;
    ALTER TABLE notification_templates DROP COLUMN variables;
    ALTER TABLE notification_templates DROP COLUMN template_id;
    ALTER TABLE notification_templates ADD COLUMN body TEXT;
  `, callback);
};
