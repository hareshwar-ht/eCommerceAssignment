const fs = require('fs');
const path = require('path');
require('dotenv').config();
const pool = require('../config/database');

async function main() {
  try {
    console.log('Resetting database schema...');
    
    // Drop existing tables in reverse dependency order
    await pool.query('DROP TABLE IF EXISTS refresh_tokens CASCADE');
    await pool.query('DROP TABLE IF EXISTS notification_history CASCADE');
    await pool.query('DROP TABLE IF EXISTS notification_templates CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');
    await pool.query('DROP TABLE IF EXISTS pending_registrations CASCADE');
    console.log('Dropped existing tables.');

    // Read init.sql
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Run the initialization script
    await pool.query(sql);
    console.log('Database initialized successfully with new schema.');
  } catch (err) {
    console.error('Failed to reset database schema:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
