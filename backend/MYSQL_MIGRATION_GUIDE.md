# MySQL Migration Guide

## Overview
This guide documents the migration from PostgreSQL to MySQL using the mawebtec_lms database schema.

## Database Changes

### Connection Configuration
- Changed from PostgreSQL (pg) to MySQL (mysql2)
- Updated connection pool configuration
- Port changed from 5432 to 3306
- Database name: mawebtec_lms

### Key Schema Differences

#### ID Fields
- PostgreSQL: UUID (uuid_generate_v4())
- MySQL: INT AUTO_INCREMENT

#### Main Tables from mawebtec_lms

1. **users** - User authentication and management
2. **agency** - Company/organization details
3. **customers** - Customer management
4. **vendors** (supplier) - Vendor management
5. **items** - Inventory/product management
6. **invoices** - Invoice management
7. **invoice_details** - Invoice line items
8. **purchase** - Purchase orders
9. **purchase_details** - Purchase line items
10. **payments_received** - Payment tracking
11. **expenses** - Expense management
12. **delivery_challan** - Delivery challans
13. **quotation** - Quotations

## Next Steps

1. Install MySQL dependencies: `npm install mysql2`
2. Import mawebtec_lms.sql into MySQL
3. Update all models to use INT IDs instead of UUIDs
4. Update all controllers to work with MySQL result format
5. Test all API endpoints

## Database Setup

```bash
# Import the database
mysql -u root -p < C:\Users\aryan\Downloads\gst_billing\mawebtec_lms.sql
```
