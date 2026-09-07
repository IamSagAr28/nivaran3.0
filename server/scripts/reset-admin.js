/**
 * reset-admin.js
 * Run this script to reset (or create) the admin user in the database.
 * Usage: node server/scripts/reset-admin.js [username] [password]
 * Defaults: username=admin, password=nivara@admin123
 */

const path = require('path');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

const username = process.argv[2] || 'admin';
const password = process.argv[3] || 'nivara@admin123';

console.log(`\n🔧 Resetting admin user in: ${dbPath}`);
console.log(`   Username: ${username}`);
console.log(`   Password: ${password}\n`);

const hash = bcrypt.hashSync(password, 10);

// Ensure table exists
db.run(`CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
  if (err) {
    console.error('❌ Failed to ensure table:', err.message);
    db.close();
    return;
  }

  // Delete old admin with this username (if any)
  db.run('DELETE FROM admin_users WHERE username = ?', [username], (err) => {
    if (err) {
      console.error('❌ Failed to clear old admin:', err.message);
      db.close();
      return;
    }

    // Insert fresh admin
    db.run(
      'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)',
      [username, hash],
      function (err) {
        if (err) {
          console.error('❌ Failed to create admin user:', err.message);
        } else {
          console.log('✅ Admin user created/reset successfully!');
          console.log(`   Login with: ${username} / ${password}`);
        }
        db.close();
      }
    );
  });
});
