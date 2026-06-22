# MySQL Migration Summary

## Overview

Successfully migrated the backend from PostgreSQL to MySQL to work with the existing `mawebtec_lms` database.

## Changes Made

### 1. Dependencies (`package.json`)

**Removed:**
- `pg` (PostgreSQL driver)
- `@types/pg`

**Added:**
- `mysql2` (MySQL driver with Promise support)

**Updated Scripts:**
```json
"db:import": "node scripts/import-db.js",    // New: Import SQL file
"db:setup": "node scripts/setup-db.js",      // Updated: Verify MySQL
"db:verify": "node scripts/setup-db.js"      // New: Alias for setup
```

### 2. Environment Configuration (`.env`)

```env
# Before (PostgreSQL)
DB_PORT=5432
DB_NAME=erp_business_db
DB_USER=postgres

# After (MySQL)
DB_PORT=3306
DB_NAME=mawebtec_lms
DB_USER=root
```

### 3. Database Configuration (`src/config/database.ts`)

**Key Changes:**
- Replaced `pg.Pool` with `mysql2.createPool()`
- Updated connection configuration for MySQL
- Modified query method to handle MySQL result format
- Updated health check for MySQL
- Changed response handling (MySQL returns `[rows, fields]`)

### 4. Type Definitions (`src/types/index.ts`)

**Major Changes:**
- Changed all ID types from `string` (UUID) to `number` (INT)
- Updated field names to match database schema (snake_case)
- Added new interfaces for mawebtec_lms tables:
  - `Agency` - Company details
  - `CustomerAddress` - Customer addresses
  - `CustomerContact` - Customer contacts
  - `VendorAddress` - Vendor addresses
  - `VendorContact` - Vendor contacts
  - `InvoiceDetail` - Invoice line items
  - `PurchaseDetail` - Purchase line items
  - `InvoicePayment` - Payment allocations
  - `ExpenseCategory` - Expense categories
  - `State`, `Salutation`, `PaymentMethod`, `PaymentTerm` - Lookup tables

**Field Mapping Examples:**

| Old (PostgreSQL) | New (MySQL) |
|-----------------|-------------|
| `id: string` | `id: number` |
| `isActive: boolean` | `is_active: number` |
| `createdAt: Date` | `created_date: Date` |
| `updatedAt: Date` | `updated_date: Date` |
| `customerId: string` | `customer_id: number` |

### 5. Database Scripts

**New Files:**
- `scripts/import-db.js` - Automated database import
- `MYSQL_SETUP.md` - Detailed setup guide
- `MYSQL_MIGRATION_GUIDE.md` - Migration overview
- `QUICKSTART.md` - Quick start guide
- `MIGRATION_SUMMARY.md` - This file

**Updated Files:**
- `scripts/setup-db.js` - Now verifies MySQL connection and database

## Database Schema Mapping

### Users
```typescript
// Old
id: UUID, email, password_hash, name, role

// New
id: INT, email, username, mobile, role, is_active
```

### Customers
```typescript
// Old
id: UUID, name, email, phone, address fields, gstin

// New
id: INT, fname, lname, company_name, customer_email, 
cwork_phone, cmobile_phone, gstin_number, agency_id
+ customer_addresses table
+ customer_contacts table
```

### Items
```typescript
// Old
id: UUID, sku, name, unitPrice, currentStock

// New
id: INT, item_name, item_rate, opening_stock, 
item_unit, itemtype_id, agency_id
```

### Invoices
```typescript
// Old
id: UUID, invoiceNumber, customerId, issueDate, total

// New
id: INT, invoice_number, customer_id, invoice_date,
invoice_type, invoice_status, sub_total, agency_id
+ invoice_details table for line items
```

### Vendors
```typescript
// Old
id: UUID, name, email, phone, gstin

// New
id: INT, fname, lname, company_name, vendor_email,
vwork_phone, vmobile_phone, gstin_number, agency_id
+ vendor_addresses table
+ vendor_contacts table
```

## Next Steps Required

### 1. Update Controllers

All controllers need to be updated to:
- Use integer IDs instead of UUIDs
- Use snake_case field names
- Handle MySQL result format
- Work with the new schema structure

**Example:**
```typescript
// Old
const customer = await query('SELECT * FROM customers WHERE id = $1', [id]);
return customer.rows[0];

// New
const [customers] = await query('SELECT * FROM customers WHERE id = ?', [id]);
return customers[0];
```

### 2. Update Routes

Routes need to:
- Accept integer IDs in parameters
- Validate against new schema
- Handle new field names

### 3. Update Services

Services need to:
- Work with related tables (addresses, contacts)
- Handle agency_id for multi-tenancy
- Use proper joins for related data

### 4. Update Validation

Validation schemas need to:
- Accept integer IDs
- Validate snake_case fields
- Handle new required fields (agency_id, etc.)

### 5. Test All Endpoints

Test each endpoint:
- Authentication
- Customers CRUD
- Vendors CRUD
- Items CRUD
- Invoices CRUD
- Purchases CRUD
- Payments CRUD
- Expenses CRUD
- Reports

## Installation Steps

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Import Database
```bash
npm run db:import
```

### 3. Verify Setup
```bash
npm run db:verify
```

### 4. Start Backend
```bash
npm run dev
```

## Testing Checklist

- [ ] Database connection successful
- [ ] All tables imported correctly
- [ ] Health endpoint working
- [ ] Authentication working
- [ ] Customer endpoints working
- [ ] Vendor endpoints working
- [ ] Item endpoints working
- [ ] Invoice endpoints working
- [ ] Purchase endpoints working
- [ ] Payment endpoints working
- [ ] Expense endpoints working
- [ ] Report endpoints working

## Important Notes

1. **Multi-tenancy**: The database uses `agency_id` for multi-tenancy
2. **Relationships**: Many tables have related tables (addresses, contacts)
3. **Lookup Tables**: Use lookup tables for states, salutations, payment methods, etc.
4. **Field Names**: All fields use snake_case (e.g., `created_date`)
5. **Boolean Values**: Stored as TINYINT (0 or 1)
6. **Date Format**: MySQL DATETIME format

## Rollback Plan

If you need to rollback to PostgreSQL:

1. Restore `package.json` from git
2. Restore `.env` from git
3. Restore `src/config/database.ts` from git
4. Restore `src/types/index.ts` from git
5. Run `npm install`
6. Restore PostgreSQL database

## Support Files

- `QUICKSTART.md` - Quick setup guide
- `MYSQL_SETUP.md` - Detailed setup instructions
- `MYSQL_MIGRATION_GUIDE.md` - Migration overview
- `backend/logs/app.log` - Application logs

## Status

✅ Database configuration updated
✅ Dependencies updated
✅ Type definitions updated
✅ Setup scripts updated
✅ Documentation created
⏭️ Controllers need updating
⏭️ Routes need updating
⏭️ Services need updating
⏭️ Testing required

## Estimated Time for Remaining Work

- Update Controllers: 2-3 hours
- Update Routes: 1-2 hours
- Update Services: 2-3 hours
- Testing: 2-3 hours
- **Total: 7-11 hours**
