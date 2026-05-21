# Quick: Restore Database Only on Hosting Raja VPS

**Goal:** Just restore PostgreSQL and see all your products without deploying the full website yet.

---

## Step 1: SSH into Your VPS

```bash
ssh root@your-vps-ip-address
# Or with username:
ssh username@your-vps-ip-address
```

---

## Step 2: Install PostgreSQL (1 minute)

```bash
# Update packages
sudo apt-get update

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib postgresql-client

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify it's running
sudo systemctl status postgresql
```

---

## Step 3: Create Database & User (2 minutes)

```bash
# Enter PostgreSQL interactive mode
sudo -u postgres psql

# Run these commands (paste all at once):
CREATE USER nivaran_user WITH PASSWORD 'secure_password_123';
CREATE DATABASE nivaran_db OWNER nivaran_user;
GRANT ALL PRIVILEGES ON DATABASE nivaran_db TO nivaran_user;
ALTER DATABASE nivaran_db OWNER TO nivaran_user;
\q
```

---

## Step 4: Upload Backup Files to VPS (5 minutes)

**On your local machine:**
```bash
# From Windows PowerShell in your project directory:
scp -r Render_db\2026-05-19T07_27Z\nivaran_db_z84e root@YOUR-VPS-IP:/home/backup/

# Or if using Windows, use WinSCP or Putty pscp:
pscp -r Render_db\2026-05-19T07_27Z\nivaran_db_z84e root@YOUR-VPS-IP:/home/backup/
```

---

## Step 5: Restore the Database (3 minutes)

**Back on VPS:**
```bash
# Create backup directory if it doesn't exist
mkdir -p /home/backup

# Restore the database
sudo -u postgres pg_restore -d nivaran_db -v /home/backup/nivaran_db_z84e/

# If above doesn't work, try:
pg_restore -U nivaran_user -d nivaran_db -h localhost /home/backup/nivaran_db_z84e/
```

You'll see output like:
```
restore started
... [lots of commands] ...
restore complete
```

---

## Step 6: Check How Many Products! 🎉

```bash
# Connect to database and see products
sudo -u postgres psql -d nivaran_db

# Inside PostgreSQL, run:
SELECT COUNT(*) as product_count FROM products;
SELECT title, price FROM products LIMIT 5;
\q
```

**You'll see:**
```
 product_count
---------------
      15
(1 row)
```

---

## Step 7: See ALL Details

```bash
# View all products with details
sudo -u postgres psql -d nivaran_db -c "
SELECT 
  id, 
  title, 
  price, 
  category, 
  stock 
FROM products 
ORDER BY created_at DESC;"
```

---

## Troubleshooting

### Connection Refused
```bash
# Check if PostgreSQL is running
sudo systemctl restart postgresql
ps aux | grep postgres
```

### Permission Denied
```bash
# Make sure you're using sudo -u postgres
sudo -u postgres psql -d nivaran_db -c "SELECT COUNT(*) FROM products;"
```

### pg_restore not found
```bash
sudo apt-get install postgresql-client
```

### Restore fails with "no such file"
```bash
# Check file permissions
ls -la /home/backup/nivaran_db_z84e/
chmod 755 /home/backup/nivaran_db_z84e/*
```

---

## That's It! ✅

Your database is now restored and you can see all your products!

**Connection String (for later when you deploy backend):**
```
postgresql://nivaran_user:secure_password_123@localhost:5432/nivaran_db
```

Once you verify all products are there, then you can deploy the full backend!
