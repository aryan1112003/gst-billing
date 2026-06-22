import { agencyService } from '../services/agencyService';
import { pool } from '../config/database';
import { logger } from '../config/logger';
import fs from 'fs/promises';
import path from 'path';

/**
 * Script to initialize multi-tenant database setup
 * Run this script once to set up the agencies table in master database
 */
async function initializeMultiTenant() {
  console.log('🚀 Starting multi-tenant database initialization...\n');

  try {
    // Step 1: Initialize agencies table in master database
    console.log('Step 1: Creating agencies table in master database...');
    await agencyService.initializeAgenciesTable();
    console.log('✓ Agencies table created successfully\n');

    // Step 2: Check if users table has agency_id column (or the typo agecny_id)
    console.log('Step 2: Checking users table structure...');
    const connection = await pool.getConnection();

    try {
      const [columns]: any = await connection.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
        [process.env.DB_NAME || 'mawebtec_lms']
      );

      const columnNames = columns.map((col: any) => col.COLUMN_NAME);
      const hasAgencyId = columnNames.includes('agency_id');
      const hasTypoAgencyId = columnNames.includes('agecny_id');

      if (hasTypoAgencyId && !hasAgencyId) {
        console.log('⚠️  Found typo column "agecny_id" in users table');
        console.log('   You may want to fix this typo by running:');
        console.log('   ALTER TABLE users CHANGE COLUMN agecny_id agency_id INT;');
      } else if (hasAgencyId) {
        console.log('✓ Users table has agency_id column');
      } else if (!hasAgencyId && !hasTypoAgencyId) {
        console.log('⚠️  Users table missing agency_id column, adding it...');
        await connection.query('ALTER TABLE users ADD COLUMN agency_id INT NULL');
        await connection.query('ALTER TABLE users ADD INDEX idx_agency_id (agency_id)');
        console.log('✓ Added agency_id column to users table');
      }
    } finally {
      connection.release();
    }

    console.log('✓ Users table structure verified\n');

    // Step 3: Display current configuration
    console.log('Step 3: Current configuration');
    console.log('─────────────────────────────');
    console.log(`Master Database: ${process.env.DB_NAME || 'mawebtec_lms'}`);
    console.log(`Database Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`Database Port: ${process.env.DB_PORT || '3306'}`);
    console.log();

    // Step 4: Check existing agencies
    console.log('Step 4: Checking existing agencies...');
    const agencies = await agencyService.getAllAgencies();

    if (agencies.length === 0) {
      console.log('✓ No agencies found (fresh setup)');
      console.log('\nTo create a new agency user, make a POST request to:');
      console.log('  POST /api/v1/users');
      console.log('  Body: {');
      console.log('    "email": "agency@example.com",');
      console.log('    "name": "Agency Admin",');
      console.log('    "password": "password123",');
      console.log('    "roleId": 2,');
      console.log('    "companyData": {');
      console.log('      "companyName": "Example Company",');
      console.log('      "email": "company@example.com",');
      console.log('      "phone": "1234567890",');
      console.log('      "address": "123 Main St",');
      console.log('      "gstNumber": "GST123456",');
      console.log('      "panNumber": "PAN123456"');
      console.log('    }');
      console.log('  }');
    } else {
      console.log(`✓ Found ${agencies.length} existing agency/agencies:\n`);
      agencies.forEach((agency, index) => {
        console.log(`   ${index + 1}. ${agency.company_name}`);
        console.log(`      Database: ${agency.database_name}`);
        console.log(`      Status: ${agency.status}`);
        console.log(`      Email: ${agency.email}`);
        console.log();
      });
    }

    console.log('\n✅ Multi-tenant setup initialized successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Create agency users via POST /api/v1/users with roleId=2');
    console.log('   2. Each agency will automatically get a dedicated database');
    console.log('   3. Agency users will only see their own company data');
    console.log();

  } catch (error) {
    console.error('\n❌ Error during initialization:', error);
    throw error;
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Run initialization
initializeMultiTenant().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
