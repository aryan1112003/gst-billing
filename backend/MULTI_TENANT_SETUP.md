# Multi-Tenant Database Setup Guide

## Overview

This GST Billing system now supports **multi-tenant architecture** where each agency gets its own dedicated database. When an admin creates a new user with the "agency" role (roleId = 2), the system automatically:

1. Creates a new agency record in the master database
2. Creates a dedicated database for that agency
3. Initializes the database with the complete schema
4. Links the user to their agency database

## Architecture

### Master Database (`mawebtec_lms`)
Contains:
- `users` table - All user accounts (admin, agency, regular users)
- `agencies` table - Agency metadata and database references
- `refresh_tokens` table - JWT refresh tokens

### Agency Databases (`agency_{id}_{company_name}`)
Each agency gets a dedicated database containing:
- `customers` table
- `items` table
- `invoices` table
- `vendors` table
- `purchases` table
- `payments` table
- `expenses` table
- All other business data tables

## Setup Instructions

### 1. Run the Initialization Script

First, initialize the multi-tenant setup by running:

```bash
cd backend
npm run init-multitenant
```

Or manually:

```bash
npx ts-node src/scripts/initializeMultiTenant.ts
```

This script will:
- Create the `agencies` table in the master database
- Verify the `users` table has the `agency_id` column
- Display current configuration and existing agencies

### 2. Add NPM Script (Optional)

Add this to your `package.json` scripts section:

```json
{
  "scripts": {
    "init-multitenant": "ts-node src/scripts/initializeMultiTenant.ts"
  }
}
```

## Creating an Agency User

### API Request

To create a new agency user with a dedicated database:

**Endpoint:** `POST /api/v1/users`

**Headers:**
```
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "admin@techcorp.com",
  "name": "Tech Corp Admin",
  "password": "securePassword123",
  "roleId": 2,
  "companyData": {
    "companyName": "Tech Corporation",
    "email": "contact@techcorp.com",
    "phone": "+1-555-0123",
    "address": "123 Business Street, City, State 12345",
    "gstNumber": "22AAAAA0000A1Z5",
    "panNumber": "AAAAA0000A",
    "subscriptionPlan": "premium"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 5,
      "name": "Tech Corp Admin",
      "email": "admin@techcorp.com",
      "roleId": 2,
      "agency_id": 1
    },
    "agency": {
      "id": 1,
      "company_name": "Tech Corporation",
      "database_name": "agency_1_tech_corporation",
      "email": "contact@techcorp.com",
      "phone": "+1-555-0123",
      "address": "123 Business Street, City, State 12345",
      "gst_number": "22AAAAA0000A1Z5",
      "pan_number": "AAAAA0000A",
      "status": "active",
      "subscription_plan": "premium",
      "created_at": "2025-01-15T10:30:00.000Z",
      "updated_at": "2025-01-15T10:30:00.000Z"
    }
  },
  "message": "Agency user created successfully with dedicated database"
}
```

## What Happens Automatically

When you create an agency user (roleId = 2):

1. **Agency Record Created** - Entry added to `agencies` table
2. **Database Created** - New MySQL database: `agency_{id}_{sanitized_company_name}`
3. **Schema Initialized** - All tables created in the new database
4. **User Linked** - User's `agency_id` field set to the new agency ID
5. **Connection Pool** - Managed automatically by the connection manager

## Role Types

- **Role 1 (Admin)** - Super admin, can see all agencies, creates agency users
- **Role 2 (Agency)** - Agency owner, has dedicated database, sees only their data
- **Role 3 (User)** - Regular user under an agency

## Key Features

### Automatic Database Management
- **Connection Pooling** - Each agency database gets its own connection pool
- **Auto-scaling** - Pools created on-demand and cached for performance
- **Cleanup** - Unused connections automatically closed after 30 minutes

### Security & Isolation
- **Data Isolation** - Complete database-level separation
- **No Cross-Agency Access** - Agency users can only access their own database
- **Status Control** - Agencies can be set to active/inactive/suspended

### Database Naming Convention
```
agency_{agency_id}_{sanitized_company_name}
```

Example: `agency_1_tech_corporation`

Company names are:
- Converted to lowercase
- Spaces/special chars replaced with underscores
- Truncated to 50 characters max
- Prefixed with agency ID for uniqueness

## Files Added/Modified

### New Files Created:
1. **`src/services/databaseConnectionManager.ts`** - Manages multiple database connections
2. **`src/services/agencyService.ts`** - Agency CRUD operations and database provisioning
3. **`src/database/agencies.schema.sql`** - Agencies table schema
4. **`src/scripts/initializeMultiTenant.ts`** - Setup script

### Modified Files:
1. **`src/routes/users.ts`** - Added agency database creation on user creation
2. **`src/config/database.ts`** - Added multi-tenant query routing

## Using the Multi-Tenant Query Functions

### For Master Database Queries
```typescript
import { query } from '../config/database';

// Queries master database (users, agencies, etc.)
const users = await query('SELECT * FROM users WHERE roleId = ?', [2]);
```

### For Agency Database Queries
```typescript
import { agencyQuery } from '../config/database';

// Automatically routes to agency's database
const customers = await agencyQuery(agencyId, 'SELECT * FROM customers');
```

### With Explicit Database Name
```typescript
import { query } from '../config/database';

// Query specific agency database
const invoices = await query(
  'SELECT * FROM invoices',
  [],
  'agency_1_tech_corporation'
);
```

## Environment Variables

No changes required to `.env` file. The system uses:
- `DB_HOST` - MySQL host (default: localhost)
- `DB_PORT` - MySQL port (default: 3306)
- `DB_NAME` - Master database name (default: mawebtec_lms)
- `DB_USER` - MySQL username
- `DB_PASSWORD` - MySQL password

## Troubleshooting

### Issue: "Agency with this email already exists"
**Solution:** Each agency must have a unique email address.

### Issue: "Failed to create agency database"
**Solution:** Check MySQL user has CREATE DATABASE privileges:
```sql
GRANT CREATE, ALTER, DROP, SELECT, INSERT, UPDATE, DELETE ON *.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

### Issue: "Connection pool timeout"
**Solution:** Increase connection limits in database.ts or check for connection leaks.

### Issue: Typo in users table (agecny_id instead of agency_id)
**Solution:** Run this SQL to fix:
```sql
ALTER TABLE users CHANGE COLUMN agecny_id agency_id INT;
```

## Migration from Single Database

If you have existing data in a single-database setup:

1. Run initialization script
2. Create agencies for existing users
3. Migrate data from main database to agency databases
4. Update user records with correct agency_id values

A migration script can be created if needed.

## Testing

### Test Agency Creation
```bash
# Create test agency user
curl -X POST http://localhost:5000/api/v1/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@agency.com",
    "name": "Test Agency",
    "password": "password123",
    "roleId": 2,
    "companyData": {
      "companyName": "Test Company",
      "email": "test@agency.com"
    }
  }'
```

### Check Created Database
```sql
-- Show all databases
SHOW DATABASES LIKE 'agency_%';

-- Check agency table structure
USE agency_1_test_company;
SHOW TABLES;
```

## Best Practices

1. **Always use roleId = 2** for agency users to trigger database creation
2. **Provide complete company data** for better agency management
3. **Monitor connection pools** to prevent resource exhaustion
4. **Regular backups** - Each agency database should be backed up separately
5. **Database cleanup** - Implement soft delete for inactive agencies

## Support

For issues or questions:
1. Check the console logs during agency creation
2. Verify MySQL user permissions
3. Ensure all required fields are provided in companyData
4. Review the initialization script output

## Future Enhancements

- Automatic database backups per agency
- Agency data migration tools
- Database size monitoring and quotas
- Multi-region database support
- Agency self-service portal
