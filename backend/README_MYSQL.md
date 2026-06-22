# Backend - MySQL Migration Complete ✅

## 🎉 What's Done

The backend has been successfully migrated from PostgreSQL to MySQL to work with your `mawebtec_lms` database.

### ✅ Completed Changes

1. **Dependencies Updated**
   - Removed: `pg` (PostgreSQL)
   - Added: `mysql2` (MySQL)
   - Installed: ✅

2. **Configuration Updated**
   - `.env` - MySQL connection settings
   - `src/config/database.ts` - MySQL connection pool
   - `package.json` - New scripts and dependencies

3. **Type Definitions Updated**
   - All interfaces updated to match mawebtec_lms schema
   - Changed from UUID to INT IDs
   - Added new interfaces for all tables

4. **Scripts Created**
   - `scripts/import-db.js` - Import SQL file
   - `scripts/setup-db.js` - Verify database

5. **Documentation Created**
   - `QUICKSTART.md` - Quick setup guide
   - `MYSQL_SETUP.md` - Detailed setup
   - `MYSQL_INSTALLATION.md` - MySQL installation
   - `MYSQL_MIGRATION_GUIDE.md` - Migration overview
   - `MIGRATION_SUMMARY.md` - Complete summary
   - `README_MYSQL.md` - This file

## 🚀 Quick Start

### Prerequisites

- ✅ Node.js installed
- ⚠️ MySQL Server installed and running
- ✅ mawebtec_lms.sql file available

### Step 1: Check MySQL

```bash
# Check if MySQL is running
mysql --version

# If not installed, see MYSQL_INSTALLATION.md
```

### Step 2: Import Database

**Option A: Using npm script**
```bash
npm run db:import
```

**Option B: Using MySQL command**
```bash
mysql -u root -p < C:\Users\aryan\Downloads\gst_billing\mawebtec_lms.sql
```

### Step 3: Configure

Edit `.env` if needed:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mawebtec_lms
DB_USER=root
DB_PASSWORD=
```

### Step 4: Verify

```bash
npm run db:verify
```

Expected output:
```
✅ Connected to MySQL
✅ Database 'mawebtec_lms' exists
✅ Found XX tables in database
🎉 Database setup verified successfully!
```

### Step 5: Start Backend

```bash
npm run dev
```

Backend will start on: `http://localhost:3000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          ✅ Updated for MySQL
│   ├── types/
│   │   └── index.ts              ✅ Updated types
│   ├── controllers/              ⏭️ Need updating
│   ├── routes/                   ⏭️ Need updating
│   ├── services/                 ⏭️ Need updating
│   └── server.ts
├── scripts/
│   ├── import-db.js              ✅ New
│   └── setup-db.js               ✅ Updated
├── .env                          ✅ Updated
├── package.json                  ✅ Updated
├── QUICKSTART.md                 ✅ New
├── MYSQL_SETUP.md                ✅ New
├── MYSQL_INSTALLATION.md         ✅ New
├── MYSQL_MIGRATION_GUIDE.md      ✅ New
├── MIGRATION_SUMMARY.md          ✅ New
└── README_MYSQL.md               ✅ This file
```

## 📊 Database Schema

### Main Tables

| Table | Description |
|-------|-------------|
| `users` | User authentication |
| `agency` | Company/organization details |
| `customers` | Customer management |
| `customer_addresses` | Customer addresses |
| `customer_contacts` | Customer contact persons |
| `vendors` (supplier) | Vendor management |
| `vendor_addresses` | Vendor addresses |
| `vendor_contacts` | Vendor contact persons |
| `items` | Inventory/products |
| `invoices` | Invoice headers |
| `invoice_details` | Invoice line items |
| `purchase` | Purchase orders |
| `purchase_details` | Purchase line items |
| `payments_received` | Payment tracking |
| `invoice_payments` | Payment allocations |
| `expenses` | Expense management |
| `delivery_challan` | Delivery challans |
| `quotation` | Quotations |

### Lookup Tables

- `states` - Indian states
- `salutations` - Mr., Mrs., Ms., etc.
- `payment_method` - Cash, Cheque, NEFT, etc.
- `payment_terms` - Net 30, Net 60, etc.
- `gsttreatments` - GST treatment types
- `currencies` - Currency types
- `itemtypes` - Item categories
- `item_units` - Units of measurement

## 🔧 Available Scripts

```bash
# Install dependencies
npm install

# Import database from SQL file
npm run db:import

# Verify database connection
npm run db:verify

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

## ⚠️ Important Notes

### 1. Multi-tenancy

The database uses `agency_id` for multi-tenancy. Each record belongs to an agency.

### 2. Field Naming

All fields use `snake_case`:
- `created_date` not `createdAt`
- `customer_id` not `customerId`
- `is_active` not `isActive`

### 3. ID Fields

All IDs are integers, not UUIDs:
```typescript
// Old
id: string (UUID)

// New
id: number (INT AUTO_INCREMENT)
```

### 4. Boolean Fields

Stored as TINYINT (0 or 1):
```typescript
is_active: number  // 0 = false, 1 = true
```

### 5. Related Tables

Many entities have related tables:
- Customers → customer_addresses, customer_contacts
- Vendors → vendor_addresses, vendor_contacts
- Invoices → invoice_details
- Purchases → purchase_details

## 🐛 Troubleshooting

### MySQL Not Running

```bash
# Windows - Check service
Get-Service MySQL80

# Start service
net start MySQL80

# Or use XAMPP Control Panel
```

### Connection Refused

1. Check MySQL is running
2. Verify port 3306 is open
3. Check credentials in `.env`
4. Try: `mysql -u root -p`

### Database Not Found

```bash
# Import the database first
npm run db:import

# Or manually
mysql -u root -p < C:\Users\aryan\Downloads\gst_billing\mawebtec_lms.sql
```

### Access Denied

1. Check username/password in `.env`
2. Verify MySQL user has permissions
3. Try connecting manually: `mysql -u root -p`

### Module Not Found

```bash
# Reinstall dependencies
npm install
```

## 📝 Next Steps

### For Backend Development

1. ✅ Database migrated to MySQL
2. ✅ Types updated
3. ⏭️ Update controllers to use new schema
4. ⏭️ Update routes
5. ⏭️ Update services
6. ⏭️ Test all endpoints

### For Frontend Development

1. ⏭️ Update API calls to use new field names
2. ⏭️ Handle integer IDs instead of UUIDs
3. ⏭️ Update forms to match new schema
4. ⏭️ Test all screens

## 📚 Documentation

- **Quick Start**: `QUICKSTART.md`
- **Detailed Setup**: `MYSQL_SETUP.md`
- **MySQL Installation**: `MYSQL_INSTALLATION.md`
- **Migration Guide**: `MYSQL_MIGRATION_GUIDE.md`
- **Complete Summary**: `MIGRATION_SUMMARY.md`

## 🆘 Getting Help

### Check Logs

```bash
# Backend logs
backend/logs/app.log

# MySQL logs (Windows)
C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err

# XAMPP MySQL logs
C:\xampp\mysql\data\*.err
```

### Enable Debug Mode

Edit `.env`:
```env
LOG_LEVEL=debug
```

### Test Database Connection

```bash
# Using npm script
npm run db:verify

# Using MySQL client
mysql -u root -p mawebtec_lms -e "SELECT COUNT(*) FROM customers;"
```

## ✅ Verification Checklist

- [ ] MySQL installed and running
- [ ] Database imported successfully
- [ ] Backend dependencies installed
- [ ] `.env` configured correctly
- [ ] `npm run db:verify` passes
- [ ] `npm run dev` starts successfully
- [ ] Health endpoint responds: `http://localhost:3000/api/health`

## 🎯 Current Status

### ✅ Completed
- Database configuration
- Type definitions
- Setup scripts
- Documentation

### ⏭️ Pending
- Controller updates
- Route updates
- Service updates
- Endpoint testing
- Frontend integration

## 💡 Tips

1. Use MySQL Workbench for visual database management
2. Keep `.env` file secure (never commit passwords)
3. Use `npm run db:verify` to test connection
4. Check logs for detailed error messages
5. The database has sample data you can use for testing

## 🔗 Useful Links

- MySQL Documentation: https://dev.mysql.com/doc/
- MySQL Workbench: https://dev.mysql.com/downloads/workbench/
- Node.js MySQL2: https://github.com/sidorares/node-mysql2

## 📞 Support

For issues:
1. Check the troubleshooting section
2. Review the documentation files
3. Check MySQL and backend logs
4. Verify MySQL is running and accessible

---

**Migration completed on**: 2025-11-07
**Database**: mawebtec_lms (MySQL)
**Backend**: Node.js + Express + MySQL2
