import { agencyService } from '../services/agencyService';
import dbConnectionManager from '../services/databaseConnectionManager';
import fs from 'fs/promises';
import path from 'path';

/**
 * Initialize master database with required tables
 */
async function initializeMasterDatabase() {
  console.log('🚀 Initializing Master Database...\n');

  try {
    const masterPool = dbConnectionManager.getMasterPool();

    // Read master schema SQL - handles both dist and src environments
    let schemaPath = path.join(__dirname, '../database/master-schema.sql');
    try {
      await fs.access(schemaPath);
    } catch {
      // Try src fallback
      schemaPath = path.join(__dirname, '../../src/database/master-schema.sql');
      try {
        await fs.access(schemaPath);
      } catch {
        // Fallback for execution from scripts/
        schemaPath = path.join(__dirname, '../src/database/master-schema.sql');
      }
    }
    const schemaSql = await fs.readFile(schemaPath, 'utf-8');

    console.log('Step 1: Creating master database tables...');

    // Split SQL into individual statements and execute
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      try {
        await masterPool.query(statement);
      } catch (error: any) {
        // Ignore "table already exists" and "duplicate entry" errors
        if (!error.message.includes('already exists') && !error.message.includes('Duplicate entry')) {
          console.error(`Error executing statement: ${statement.substring(0, 100)}...`);
          throw error;
        }
      }
    }

    console.log('✓ Master database tables created successfully\n');

    // Verify tables
    console.log('Step 2: Verifying tables...');
    const [tables]: any = await masterPool.query('SHOW TABLES');
    console.log('✓ Tables found:', tables.map((t: any) => Object.values(t)[0]).join(', '));
    console.log('');

    // Check for system admin
    console.log('Step 3: Checking system admin...');
    const [adminUsers]: any = await masterPool.query(
      'SELECT id, email, roleId FROM users WHERE roleId = ? LIMIT 1',
      [1]
    );

    if (adminUsers.length > 0) {
      console.log('✓ System admin exists:', adminUsers[0].email);
    } else {
      console.log('⚠️  No system admin found. Creating default admin...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);

      await masterPool.query(
        `INSERT INTO users (email, name, password_hash, roleId, is_active) 
         VALUES (?, ?, ?, ?, ?)`,
        ['admin@system.com', 'System Administrator', hashedPassword, 1, 1]
      );

      console.log('✓ Default admin created: admin@system.com / admin123');
    }
    console.log('');

    console.log('✅ Master Database Initialization Complete!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 Summary:');
    console.log('   - Master database tables created');
    console.log('   - System admin configured');
    console.log('   - Ready to create agencies');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('🎯 Next Steps:');
    console.log('   1. Start your backend server');
    console.log('   2. Login as system admin (admin@system.com / admin123)');
    console.log('   3. Create agencies via POST /api/agencies');
    console.log('   4. Each agency gets its own database automatically!');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error initializing master database:', error);
    throw error;
  } finally {
    await dbConnectionManager.closeAll();
  }
}

// Run if called directly
if (require.main === module) {
  initializeMasterDatabase()
    .then(() => {
      console.log('✓ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('✗ Script failed:', error);
      process.exit(1);
    });
}

export default initializeMasterDatabase;
