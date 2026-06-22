# MySQL Installation Guide for Windows

## Check if MySQL is Already Installed

```bash
# Check for MySQL service
Get-Service | Where-Object {$_.Name -like "*mysql*"}

# Try to connect
mysql --version
```

If MySQL is not installed, follow the steps below.

## Option 1: Install MySQL Server (Recommended)

### Download MySQL

1. Go to: https://dev.mysql.com/downloads/mysql/
2. Select "Windows (x86, 64-bit), ZIP Archive"
3. Or download MySQL Installer: https://dev.mysql.com/downloads/installer/

### Install MySQL Installer (Easiest)

1. Download MySQL Installer from: https://dev.mysql.com/downloads/installer/
2. Run the installer (mysql-installer-community-X.X.X.X.msi)
3. Choose "Developer Default" or "Server only"
4. Click "Execute" to install
5. Configure MySQL Server:
   - Choose "Standalone MySQL Server"
   - Port: 3306 (default)
   - Root Password: Set a password (or leave empty for development)
   - Windows Service: Yes
   - Service Name: MySQL80 (or similar)
6. Complete the installation

### Verify Installation

```bash
# Check MySQL service
Get-Service MySQL80

# Connect to MySQL
mysql -u root -p
```

## Option 2: Install XAMPP (Includes MySQL)

### Download XAMPP

1. Go to: https://www.apachefriends.org/
2. Download XAMPP for Windows
3. Run the installer
4. Select at least "MySQL" and "phpMyAdmin"
5. Install to C:\xampp (default)

### Start MySQL

1. Open XAMPP Control Panel
2. Click "Start" next to MySQL
3. MySQL will run on port 3306

### Verify Installation

```bash
# Navigate to XAMPP MySQL bin
cd C:\xampp\mysql\bin

# Connect to MySQL
.\mysql.exe -u root -p
```

## Option 3: Install MySQL via Chocolatey

If you have Chocolatey installed:

```bash
# Install MySQL
choco install mysql

# Start MySQL service
net start MySQL
```

## After Installation

### 1. Add MySQL to PATH (if not already)

**For MySQL Server:**
```
C:\Program Files\MySQL\MySQL Server 8.0\bin
```

**For XAMPP:**
```
C:\xampp\mysql\bin
```

Add to System Environment Variables:
1. Search "Environment Variables" in Windows
2. Edit "Path" in System Variables
3. Add MySQL bin directory
4. Click OK and restart terminal

### 2. Test MySQL Connection

```bash
# Test connection
mysql -u root -p

# Inside MySQL, check version
SELECT VERSION();

# Exit
EXIT;
```

### 3. Create Database (if needed)

```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE mawebtec_lms;

# Exit
EXIT;
```

### 4. Import Database

```bash
# Import the SQL file
mysql -u root -p mawebtec_lms < C:\Users\aryan\Downloads\gst_billing\mawebtec_lms.sql

# Or use the npm script
cd backend
npm run db:import
```

## Update Backend Configuration

Edit `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mawebtec_lms
DB_USER=root
DB_PASSWORD=your_password_here
```

**Note:** If you didn't set a password during installation, leave `DB_PASSWORD` empty.

## Troubleshooting

### MySQL Service Won't Start

```bash
# Check if port 3306 is in use
netstat -ano | findstr :3306

# If in use, kill the process or change MySQL port
```

### Access Denied Error

```bash
# Reset root password
# Stop MySQL service first
net stop MySQL80

# Start MySQL without grant tables
mysqld --skip-grant-tables

# In another terminal, connect and reset password
mysql -u root
USE mysql;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
EXIT;

# Restart MySQL normally
net start MySQL80
```

### Can't Connect to MySQL

1. Check if MySQL service is running:
   ```bash
   Get-Service MySQL80
   ```

2. Check if MySQL is listening on port 3306:
   ```bash
   netstat -ano | findstr :3306
   ```

3. Check firewall settings

4. Verify credentials in `.env` file

### Port 3306 Already in Use

If another application is using port 3306:

1. Change MySQL port in `my.ini` or `my.cnf`
2. Update `DB_PORT` in `.env` file
3. Restart MySQL service

## Alternative: Use Docker

If you prefer Docker:

```bash
# Pull MySQL image
docker pull mysql:8.0

# Run MySQL container
docker run --name mysql-mawebtec -e MYSQL_ROOT_PASSWORD=password -p 3306:3306 -d mysql:8.0

# Import database
docker exec -i mysql-mawebtec mysql -u root -ppassword < C:\Users\aryan\Downloads\gst_billing\mawebtec_lms.sql
```

Update `.env`:
```env
DB_PASSWORD=password
```

## Verify Everything Works

```bash
# 1. Check MySQL is running
mysql -u root -p -e "SELECT VERSION();"

# 2. Check database exists
mysql -u root -p -e "SHOW DATABASES;"

# 3. Check tables
mysql -u root -p mawebtec_lms -e "SHOW TABLES;"

# 4. Verify backend connection
cd backend
npm run db:verify

# 5. Start backend
npm run dev
```

## Next Steps

Once MySQL is installed and running:

1. ✅ Import the database: `npm run db:import`
2. ✅ Verify setup: `npm run db:verify`
3. ✅ Start backend: `npm run dev`
4. ✅ Test API: `http://localhost:3000/api/health`

## Useful MySQL Commands

```sql
-- Show all databases
SHOW DATABASES;

-- Use a database
USE mawebtec_lms;

-- Show all tables
SHOW TABLES;

-- Describe a table
DESCRIBE customers;

-- Count records
SELECT COUNT(*) FROM customers;

-- Show table structure
SHOW CREATE TABLE customers;
```

## GUI Tools (Optional)

For easier database management:

1. **MySQL Workbench** (Official)
   - Download: https://dev.mysql.com/downloads/workbench/

2. **phpMyAdmin** (Web-based, comes with XAMPP)
   - Access: http://localhost/phpmyadmin

3. **DBeaver** (Universal)
   - Download: https://dbeaver.io/

4. **HeidiSQL** (Windows)
   - Download: https://www.heidisql.com/

## Support

If you encounter issues:

1. Check MySQL error logs:
   - MySQL Server: `C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err`
   - XAMPP: `C:\xampp\mysql\data\*.err`

2. Check backend logs:
   - `backend/logs/app.log`

3. Enable debug mode in `.env`:
   ```env
   LOG_LEVEL=debug
   ```
