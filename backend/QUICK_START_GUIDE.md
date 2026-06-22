# Quick Start Guide - Multi-Tenant GST Billing System

## 🚀 Get Started in 5 Minutes

This guide will get your multi-tenant GST billing system up and running quickly.

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ MySQL 8+ installed and running
- ✅ MySQL user with CREATE DATABASE privileges

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Ensure your `.env` file has these settings:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mawebtec_lms
DB_USER=root
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 3. Grant MySQL Permissions

Connect to MySQL and run:

```sql
-- Grant necessary permissions
GRANT CREATE, ALTER, DROP, SELECT, INSERT, UPDATE, DELETE
ON *.* TO 'root'@'localhost';

FLUSH PRIVILEGES;
```

### 4. Initialize Multi-Tenant Setup

```bash
npm run init-multitenant
```

**Expected Output:**
```
🚀 Starting multi-tenant database initialization...

Step 1: Creating agencies table in master database...
✓ Agencies table created successfully

Step 2: Checking users table structure...
✓ Users table structure verified

Step 3: Current configuration
─────────────────────────────
Master Database: mawebtec_lms
Database Host: localhost
Database Port: 3306

Step 4: Checking existing agencies...
✓ No agencies found (fresh setup)

✅ Multi-tenant setup initialized successfully!
```

### 5. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### 6. Login as Admin

Get your admin JWT token:

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "user": {
      "id": 1,
      "email": "admin@example.com",
      "name": "Admin",
      "role": "admin"
    }
  }
}
```

**Save the token** - you'll need it for the next step!

### 7. Create Your First Agency

Replace `YOUR_TOKEN` with the token from step 6:

```bash
curl -X POST http://localhost:5000/api/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@mycompany.com",
    "name": "Company Owner",
    "password": "securePass123",
    "roleId": 2,
    "companyData": {
      "companyName": "My First Company",
      "email": "contact@mycompany.com",
      "phone": "1234567890",
      "address": "123 Business Street",
      "gstNumber": "22AAAAA0000A1Z5",
      "panNumber": "AAAAA0000A"
    }
  }'
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 2,
      "name": "Company Owner",
      "email": "owner@mycompany.com",
      "roleId": 2,
      "agency_id": 1
    },
    "agency": {
      "id": 1,
      "company_name": "My First Company",
      "database_name": "agency_1_my_first_company",
      "email": "contact@mycompany.com",
      "status": "active"
    }
  },
  "message": "Agency user created successfully with dedicated database"
}
```

### 8. Verify Database Creation

Connect to MySQL and check:

```sql
-- List all databases
SHOW DATABASES LIKE 'agency_%';

-- Output:
-- +---------------------------+
-- | Database                  |
-- +---------------------------+
-- | agency_1_my_first_company |
-- +---------------------------+

-- Check tables in new database
USE agency_1_my_first_company;
SHOW TABLES;

-- Output:
-- +------------------------------------+
-- | Tables_in_agency_1_my_first_company|
-- +------------------------------------+
-- | customers                          |
-- | invoices                           |
-- | items                              |
-- | vendors                            |
-- | purchases                          |
-- | payments                           |
-- | expenses                           |
-- | ...                                |
-- +------------------------------------+
```

### 9. Test Agency User Login

Login as the agency user you just created:

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@mycompany.com",
    "password": "securePass123"
  }'
```

### 10. Test Data Operations

Create a customer (will be stored in agency database):

```bash
curl -X POST http://localhost:5000/api/v1/customers \
  -H "Authorization: Bearer AGENCY_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "address": "Customer Address",
    "gstNumber": "GST123456"
  }'
```

## 🎉 Success!

You now have:
- ✅ Multi-tenant system running
- ✅ Master database with users and agencies
- ✅ First agency database created
- ✅ Agency user with dedicated database

## What's Next?

### Create More Agencies

Repeat step 7 with different company data.

### Add Regular Users to an Agency

```bash
curl -X POST http://localhost:5000/api/v1/users \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "employee@mycompany.com",
    "name": "Employee Name",
    "password": "password123",
    "roleId": 3,
    "agencyId": 1
  }'
```

### Explore the API

Use the test file:
```bash
# Open in VS Code with REST Client extension
code test-agency-creation.http
```

## Common Commands

```bash
# Initialize multi-tenant
npm run init-multitenant

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# View logs
tail -f logs/app.log
```

## Troubleshooting

### Error: "Failed to create agency database"

**Solution:**
```sql
-- Grant CREATE permission
GRANT CREATE ON *.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

### Error: "Agency with this email already exists"

**Solution:** Each agency needs a unique email. Use a different email for companyData.email.

### Error: "Connection refused"

**Solution:** Make sure MySQL is running:
```bash
# Windows
net start MySQL80

# Linux/Mac
sudo systemctl start mysql
```

### Error: "Cannot find module"

**Solution:** Install dependencies:
```bash
npm install
```

## Database Structure Overview

```
Master Database (mawebtec_lms)
├── users          → All users (admin, agency, regular)
├── agencies       → Agency metadata
└── refresh_tokens → JWT refresh tokens

Agency Databases (agency_X_company_name)
├── customers      → Agency-specific customers
├── invoices       → Agency-specific invoices
├── items          → Agency-specific items
└── ...            → All business tables
```

## Important Notes

⚠️ **roleId Values:**
- `1` = Admin (can create agencies)
- `2` = Agency (gets dedicated database)
- `3` = Regular User (under an agency)

⚠️ **Database Naming:**
- Automatically sanitized: "My Company" → `agency_1_my_company`
- Unique per agency using agency ID prefix

⚠️ **Data Isolation:**
- Complete database separation
- Agency users only access their own database
- No cross-agency data access

## Testing Checklist

- [ ] MySQL running and accessible
- [ ] Dependencies installed (`npm install`)
- [ ] Multi-tenant initialized (`npm run init-multitenant`)
- [ ] Server started (`npm run dev`)
- [ ] Admin login successful
- [ ] First agency created
- [ ] Agency database exists in MySQL
- [ ] Agency user login successful
- [ ] Data operations work (create customer, invoice, etc.)

## Support & Documentation

📖 **Full Documentation:** [MULTI_TENANT_SETUP.md](MULTI_TENANT_SETUP.md)
📊 **Flow Diagrams:** [AGENCY_CREATION_FLOW.md](AGENCY_CREATION_FLOW.md)
📝 **Summary:** [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
🧪 **API Tests:** [test-agency-creation.http](test-agency-creation.http)

## Need Help?

1. Check the console logs during agency creation
2. Verify MySQL user has CREATE DATABASE permission
3. Ensure all required fields are provided
4. Review the error messages in server logs

---

**You're all set!** 🎊

Your multi-tenant GST billing system is ready to handle multiple agencies with complete data isolation.
