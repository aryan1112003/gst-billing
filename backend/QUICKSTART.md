# Quick Start Guide - MySQL Migration

## 🚀 Quick Setup (5 minutes)

### 1. Install MySQL Dependencies

```bash
cd backend
npm install
```

This installs `mysql2` package.

### 2. Import Database

**Option A: Automatic Import (Recommended)**
```bash
npm run db:import
```

**Option B: Manual Import**
```bash
mysql -u root -p < C:\Users\aryan\Downloads\gst_billing\mawebtec_lms.sql
```

### 3. Configure Database

Edit `backend/.env` and update if needed:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mawebtec_lms
DB_USER=root
DB_PASSWORD=your_password_here
```

### 4. Verify Setup

```bash
npm run db:verify
```

You should see:
```
✅ Connected to MySQL
✅ Database 'mawebtec_lms' exists
✅ Found XX tables in database
🎉 Database setup verified successfully!
```

### 5. Start Backend

```bash
npm run dev
```

The backend should start on `http://localhost:3000`

## ✅ What Changed

### Database
- ✅ PostgreSQL → MySQL
- ✅ UUID IDs → Integer IDs
- ✅ Boolean → TINYINT (0/1)
- ✅ Updated connection pool
- ✅ Updated query methods

### Configuration
- ✅ Updated `.env` file
- ✅ Updated `database.ts`
- ✅ Updated `package.json`
- ✅ Updated TypeScript types

### Files Modified
- `backend/.env` - Database configuration
- `backend/package.json` - Dependencies and scripts
- `backend/src/config/database.ts` - MySQL connection
- `backend/src/types/index.ts` - Type definitions
- `backend/scripts/setup-db.js` - Setup script
- `backend/scripts/import-db.js` - Import script (new)

## 🔍 Testing

### Test Database Connection
```bash
npm run db:verify
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:3000/api/health

# Get customers (after authentication)
curl http://localhost:3000/api/customers
```

## 📊 Database Structure

The mawebtec_lms database includes:

- **Users & Authentication**: users, roles, user_role
- **Customers**: customers, customer_addresses, customer_contacts
- **Vendors**: vendors (supplier), vendor_addresses, vendor_contacts
- **Inventory**: items, itemtypes, item_units
- **Sales**: invoices, invoice_details, quotation
- **Purchases**: purchase, purchase_details
- **Payments**: payments_received, invoice_payments, payment_method
- **Expenses**: expenses, expenses_category
- **Delivery**: delivery_challan, gatepass
- **Lookups**: states, salutations, currencies, gsttreatments

## 🐛 Troubleshooting

### "Database not found"
```bash
# Import the database first
npm run db:import
```

### "Access denied"
```bash
# Check your MySQL credentials in .env
# Make sure MySQL is running
```

### "Cannot find module 'mysql2'"
```bash
# Install dependencies
npm install
```

### "Connection refused"
```bash
# Start MySQL service
# Windows: services.msc → MySQL → Start
# Or check if MySQL is running on port 3306
```

## 📝 Next Steps

1. ✅ Database imported and verified
2. ⏭️ Update controllers to use new schema
3. ⏭️ Update routes to match new data structure
4. ⏭️ Test all API endpoints
5. ⏭️ Update frontend to work with new APIs

## 💡 Tips

- Use MySQL Workbench for visual database management
- Check `backend/logs/` for detailed error logs
- The database uses snake_case naming (e.g., `created_date`)
- All IDs are integers, not UUIDs
- Boolean values are 0 or 1

## 🆘 Need Help?

Check these files for more details:
- `MYSQL_SETUP.md` - Detailed setup guide
- `MYSQL_MIGRATION_GUIDE.md` - Migration overview
- `backend/logs/app.log` - Application logs
