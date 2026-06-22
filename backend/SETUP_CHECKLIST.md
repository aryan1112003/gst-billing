# Backend MySQL Setup Checklist

Use this checklist to ensure everything is set up correctly.

## Prerequisites

- [ ] Node.js installed (v14 or higher)
- [ ] npm installed
- [ ] MySQL Server installed
- [ ] mawebtec_lms.sql file available at: `C:\Users\aryan\Downloads\gst_billing\mawebtec_lms.sql`

## Step 1: MySQL Installation

- [ ] MySQL is installed
- [ ] MySQL service is running
- [ ] Can connect: `mysql -u root -p`
- [ ] Know the root password (or it's empty)

**If not installed**: See `MYSQL_INSTALLATION.md`

## Step 2: Backend Dependencies

```bash
cd backend
npm install
```

- [ ] Dependencies installed successfully
- [ ] No errors during installation
- [ ] `mysql2` package installed

## Step 3: Database Configuration

Edit `backend/.env`:

- [ ] `DB_HOST` is correct (usually `localhost`)
- [ ] `DB_PORT` is correct (usually `3306`)
- [ ] `DB_NAME` is `mawebtec_lms`
- [ ] `DB_USER` is correct (usually `root`)
- [ ] `DB_PASSWORD` is correct (or empty)

## Step 4: Import Database

```bash
npm run db:import
```

- [ ] SQL file found
- [ ] Connected to MySQL
- [ ] Database imported successfully
- [ ] Tables created

**Alternative**: `mysql -u root -p < C:\Users\aryan\Downloads\gst_billing\mawebtec_lms.sql`

## Step 5: Verify Database

```bash
npm run db:verify
```

Expected output:
- [ ] ✅ Connected to MySQL
- [ ] ✅ Database 'mawebtec_lms' exists
- [ ] ✅ Found XX tables in database
- [ ] 🎉 Database setup verified successfully!

## Step 6: Test MySQL Connection

```bash
mysql -u root -p mawebtec_lms
```

Then run:
```sql
SHOW TABLES;
SELECT COUNT(*) FROM customers;
SELECT COUNT(*) FROM vendors;
SELECT COUNT(*) FROM items;
EXIT;
```

- [ ] Can connect to database
- [ ] Tables exist
- [ ] Data is present

## Step 7: Start Backend

```bash
npm run dev
```

- [ ] Backend starts without errors
- [ ] Listening on port 3000
- [ ] No database connection errors
- [ ] Logs show successful MySQL connection

## Step 8: Test API

Open browser or use curl:
```bash
curl http://localhost:3000/api/health
```

- [ ] Health endpoint responds
- [ ] Returns success status
- [ ] Database health check passes

## Step 9: Check Logs

```bash
# View logs
cat backend/logs/app.log

# Or on Windows
type backend\logs\app.log
```

- [ ] No error messages
- [ ] MySQL connection successful
- [ ] Redis connection successful (or skipped if not using)

## Troubleshooting

### If MySQL won't start:

- [ ] Check if port 3306 is in use: `netstat -ano | findstr :3306`
- [ ] Check MySQL service: `Get-Service MySQL80`
- [ ] Try starting: `net start MySQL80`
- [ ] Check MySQL error logs

### If database import fails:

- [ ] Verify SQL file exists
- [ ] Check MySQL credentials
- [ ] Try manual import: `mysql -u root -p < file.sql`
- [ ] Check MySQL error logs

### If backend won't start:

- [ ] Check `.env` configuration
- [ ] Verify MySQL is running
- [ ] Check port 3000 is available
- [ ] Review `backend/logs/app.log`

### If connection is refused:

- [ ] MySQL service is running
- [ ] Port 3306 is open
- [ ] Credentials are correct
- [ ] Firewall allows connection

## Verification Commands

### Check MySQL Service
```bash
# Windows
Get-Service MySQL80

# Or
net start | findstr MySQL
```

### Check MySQL Connection
```bash
mysql -u root -p -e "SELECT VERSION();"
```

### Check Database
```bash
mysql -u root -p -e "SHOW DATABASES;" | findstr mawebtec_lms
```

### Check Tables
```bash
mysql -u root -p mawebtec_lms -e "SHOW TABLES;"
```

### Check Backend
```bash
curl http://localhost:3000/api/health
```

## Final Checklist

- [ ] MySQL installed and running
- [ ] Database imported successfully
- [ ] Backend dependencies installed
- [ ] `.env` configured correctly
- [ ] `npm run db:verify` passes
- [ ] `npm run dev` starts successfully
- [ ] Health endpoint responds
- [ ] No errors in logs

## Next Steps

Once all items are checked:

1. [ ] Review `README_MYSQL.md` for usage
2. [ ] Update controllers for MySQL
3. [ ] Update routes
4. [ ] Test all API endpoints
5. [ ] Update frontend

## Quick Reference

### Start MySQL
```bash
# Windows Service
net start MySQL80

# XAMPP
# Use XAMPP Control Panel
```

### Start Backend
```bash
cd backend
npm run dev
```

### View Logs
```bash
# Backend logs
type backend\logs\app.log

# MySQL logs (if needed)
# C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err
```

### Test Connection
```bash
# MySQL
mysql -u root -p mawebtec_lms -e "SELECT 1;"

# Backend
curl http://localhost:3000/api/health
```

## Status

Current Status: _______________

Date Completed: _______________

Notes:
_________________________________
_________________________________
_________________________________

---

**Tip**: Keep this checklist handy for future reference or when setting up on another machine.
