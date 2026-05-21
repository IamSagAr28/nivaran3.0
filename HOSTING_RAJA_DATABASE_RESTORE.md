# Database Restoration Guide for Hosting Raja VPS

## What You Have
- PostgreSQL database backup files in Render custom format
- Location: `Render_db/2026-05-19T07_27Z/nivaran_db_z84e/`
- Files: `toc.dat`, `3505.dat`, `3507.dat`, etc. (PostgreSQL dump files)

---

## Steps to Restore on Hosting Raja VPS

### Step 1: SSH into Your VPS
```bash
ssh root@your-vps-ip-address
# Or if you have a username:
ssh username@your-vps-ip-address
```

### Step 2: Install PostgreSQL
```bash
# Update package manager
sudo apt-get update

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Step 3: Create Database User & Database
```bash
# Switch to postgres user
sudo -u postgres psql

# In the PostgreSQL prompt, run:
CREATE USER nivaran_user WITH PASSWORD 'your_password_here';
CREATE DATABASE nivaran_db OWNER nivaran_user;
GRANT ALL PRIVILEGES ON DATABASE nivaran_db TO nivaran_user;
\q
```

### Step 4: Copy Backup Files to VPS
```bash
# On your local machine, upload the backup folder:
scp -r Render_db/2026-05-19T07_27Z/nivaran_db_z84e/ root@your-vps-ip:/home/backup/

# Or use SFTP if you prefer
```

### Step 5: Restore the Database
```bash
# SSH into VPS and run:
sudo -u postgres pg_restore -d nivaran_db -v /home/backup/nivaran_db_z84e/

# Or if above doesn't work, try:
pg_restore -U nivaran_user -d nivaran_db -h localhost /home/backup/nivaran_db_z84e/
```

### Step 6: Verify Restoration
```bash
# Check if products were restored:
sudo -u postgres psql -d nivaran_db -c "SELECT COUNT(*) FROM products;"
sudo -u postgres psql -d nivaran_db -c "SELECT COUNT(*) FROM orders;"
sudo -u postgres psql -d nivaran_db -c "SELECT COUNT(*) FROM admin_users;"
```

### Step 7: Get PostgreSQL Connection String
```bash
# For your backend .env file:
postgresql://nivaran_user:your_password_here@localhost:5432/nivaran_db
```

### Step 8: Update Backend .env
```env
DATABASE_URL=postgresql://nivaran_user:your_password_here@localhost:5432/nivaran_db
NODE_ENV=production
PORT=5000
```

### Step 9: Install Node.js (if not already installed)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

node --version  # Should show v18.x.x
```

### Step 10: Deploy Your Backend
```bash
# Clone your repository
git clone https://github.com/IamSagAr28/nivaran3.0.git
cd nivaran3.0

# Install dependencies
npm install

# Start the server
npm start
# Or use PM2 for production:
npm install -g pm2
pm2 start npm --name "nivaran-backend" -- start
pm2 save
pm2 startup
```

---

## Troubleshooting

### If pg_restore fails with "directory does not look like a pg_restore dump"
The backup might be in a different format. Try:
```bash
file /home/backup/nivaran_db_z84e/toc.dat
# Should show: "data" or "PostgreSQL" format
```

### If you can't find `pg_restore`
```bash
sudo apt-get install postgresql-client
which pg_restore
```

### To check PostgreSQL is running
```bash
sudo systemctl status postgresql
```

### To access PostgreSQL directly
```bash
sudo -u postgres psql
\l  # List databases
\c nivaran_db  # Connect to database
\dt  # List tables
```

---

## Quick Copy-Paste Script (All-in-one)

Save this as `setup-database.sh` and run on your VPS:

```bash
#!/bin/bash

# Update and install PostgreSQL
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib postgresql-client

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create user and database
sudo -u postgres psql << EOF
CREATE USER nivaran_user WITH PASSWORD 'nivaran_secure_2025';
CREATE DATABASE nivaran_db OWNER nivaran_user;
GRANT ALL PRIVILEGES ON DATABASE nivaran_db TO nivaran_user;
\q
EOF

echo "✅ Database and user created!"
echo "Connection String: postgresql://nivaran_user:nivaran_secure_2025@localhost:5432/nivaran_db"

# Create backup directory
mkdir -p /home/backup

echo "📁 Ready to receive backup files at: /home/backup/nivaran_db_z84e/"
echo ""
echo "📥 Upload your backup files:"
echo "scp -r Render_db/2026-05-19T07_27Z/nivaran_db_z84e/ root@YOUR_VPS_IP:/home/backup/"
echo ""
echo "🔄 Then restore:"
echo "sudo -u postgres pg_restore -d nivaran_db -v /home/backup/nivaran_db_z84e/"
```

Run it:
```bash
chmod +x setup-database.sh
./setup-database.sh
```

---

## Files You Need to Keep Safe
- `Render_db/2026-05-19T07_27Z/nivaran_db_z84e/` - Keep this entire folder!

That's it! All your products will be restored! 🎉
