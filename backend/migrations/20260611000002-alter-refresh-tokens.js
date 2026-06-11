exports.up = function(db, callback) {
  db.runSql(`
    ALTER TABLE refresh_tokens RENAME COLUMN token TO token_hash;
    ALTER TABLE users ADD COLUMN reset_token TEXT;
    ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP;
    ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  `, callback);
};

exports.down = function(db, callback) {
  db.runSql(`
    ALTER TABLE users DROP COLUMN updated_at;
    ALTER TABLE users DROP COLUMN reset_token_expires;
    ALTER TABLE users DROP COLUMN reset_token;
    ALTER TABLE refresh_tokens RENAME COLUMN token_hash TO token;
  `, callback);
};
