# MySQL Database Setup Guide

## Prerequisites

1. MySQL Server installed and running
2. MySQL command-line client or MySQL Workbench
3. The mawebtec_lms.sql file at: `C:\Users\aryan\Downloads\gst_billing\mawebtec_lms.sql`

## Step 1: Import the Database

### Option A: Using MySQL Command Line

```bash
# Navigate to the directory containing the SQL file
cd C:\Users\aryan\Downloads\gst_billing

# Import the database
mysql -u root -p < mawebtec_lms.sql
```

### Option B: Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your MySQL server
3. Go to Server > Data Import
4. Select "Import from Self-Contained File"
5. Browse and select `mawebtec_lms.sql`
6. Click "Start Import"

## Step 2: Verify Database Import

```bash
# Login to MySQL
mysql -u root -p

# Check if database exists
SHOW DATABASES;

# Use the database
USE mawebtec_lms;

# Check tables
SHOW TABLES;

# Exit
EXIT;
```

## Step 3: Update Backend Configuration

The `.env` file has been updated with MySQL configuration:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mawebtec_lms
DB_USER=root
DB_PASSWORD=
```

Update the `DB_PASSWORD` if your MySQL root user has a password.

## Step 4: Install Dependencies

```bash
cd backend
npm install
```

This will install `mysql2` package which replaces `pg` (PostgreSQL).

## Step 5: Verify Database Connection

```bash
npm run db:setup
```

This script will verify that:
- MySQL connection is working
- The mawebtec_lms database exists
- Tables are present

## Step 6: Start the Backend

```bash
npm run dev
```

## Database Schema Overview

### Main Tables

- **users** - User authentication
- **agency** - Company/organization details
- **customers** - Customer management
- **customer_addresses** - Customer addresses
- **customer_contacts** - Customer contact persons
- **vendors** (supplier table) - Vendor management
- **vendor_addresses** - Vendor addresses
- **vendor_contacts** - Vendor contact persons
- **items** - Inventory/products
- **invoices** - Invoice headers
- **invoice_details** - Invoice line items
- **purchase** - Purchase orders
- **purchase_details** - Purchase line items
- **payments_received** - Payment tracking
- **invoice_payments** - Payment allocations
- **expenses** - Expense management
- **delivery_challan** - Delivery challans
- **quotation** - Quotations

### Lookup Tables

- **states** - Indian states
- **salutations** - Mr., Mrs., Ms., etc.
- **payment_method** - Cash, Cheque, NEFT, etc.
- **payment_terms** - Net 30, Net 60, etc.
- **gsttreatments** - GST treatment types
- **currencies** - Currency types
- **itemtypes** - Item categories
- **item_units** - Units of measurement

## Key Differences from PostgreSQL

1. **ID Fields**: Changed from UUID to INT AUTO_INCREMENT
2. **Boolean Fields**: Changed from BOOLEAN to TINYINT (0/1)
3. **Timestamps**: Using DATETIME instead of TIMESTAMP
4. **Field Names**: Using snake_case (e.g., `created_date` instead of `createdAt`)
5. **Result Format**: MySQL returns arrays, PostgreSQL returns objects with `rows` property

## Troubleshooting

### Connection Refused

- Ensure MySQL server is running
- Check if port 3306 is open
- Verify credentials in `.env` file

### Database Not Found

- Import the mawebtec_lms.sql file first
- Check database name spelling

### Permission Denied

- Grant necessary permissions to the MySQL user:
```sql
GRANT ALL PRIVILEGES ON mawebtec_lms.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

## Next Steps

After successful setup:

1. Test API endpoints using Postman or similar tool
2. Update frontend to work with new data structure
3. Test all CRUD operations
4. Verify reports and analytics

## Support

For issues, check:
- MySQL error logs
- Backend logs in `backend/logs/`
- Network connectivity
- Firewall settings
