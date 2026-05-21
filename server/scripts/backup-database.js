#!/usr/bin/env node

/**
 * Database Backup Script
 * Exports all tables from PostgreSQL/SQLite to JSON
 * Usage: node server/scripts/backup-database.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const db = require('../database');

const backupDir = path.join(__dirname, '../../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

console.log('📦 Starting database backup...');
console.log(`📁 Backup file: ${backupFile}\n`);

const tables = [
  'users',
  'subscriptions',
  'admin_users',
  'products',
  'categories',
  'orders',
  'blogs',
  'newsletter_subscribers',
  'hero_slides',
  'membership_submissions'
];

const backup = {};
let completed = 0;

// Backup each table
tables.forEach(table => {
  db.allAsync(`SELECT * FROM ${table}`, [])
    .then(rows => {
      backup[table] = rows;
      completed++;
      console.log(`✅ ${table}: ${rows.length} records`);
      
      if (completed === tables.length) {
        saveBackup();
      }
    })
    .catch(err => {
      console.error(`⚠️  ${table}: ${err.message}`);
      backup[table] = [];
      completed++;
      
      if (completed === tables.length) {
        saveBackup();
      }
    });
});

function saveBackup() {
  const backupData = {
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite',
    tables: backup,
    summary: {
      users: backup.users?.length || 0,
      products: backup.products?.length || 0,
      orders: backup.orders?.length || 0,
      admin_users: backup.admin_users?.length || 0,
      blogs: backup.blogs?.length || 0,
      total_records: Object.values(backup).reduce((sum, arr) => sum + (arr?.length || 0), 0)
    }
  };

  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
  
  console.log('\n✨ Backup complete!\n');
  console.log('📊 Summary:');
  console.log(`  - Users: ${backupData.summary.users}`);
  console.log(`  - Products: ${backupData.summary.products}`);
  console.log(`  - Orders: ${backupData.summary.orders}`);
  console.log(`  - Admin Users: ${backupData.summary.admin_users}`);
  console.log(`  - Blogs: ${backupData.summary.blogs}`);
  console.log(`  - Total Records: ${backupData.summary.total_records}`);
  console.log(`\n📥 File: ${path.relative(process.cwd(), backupFile)}`);
  console.log(`\n✅ Backup saved successfully!`);
  
  process.exit(0);
}

// Timeout after 30 seconds
setTimeout(() => {
  console.error('\n❌ Backup timeout - could not connect to database');
  process.exit(1);
}, 30000);
