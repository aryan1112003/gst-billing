const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function fixDatabase() {
  console.log('🔧 Fixing database tables...\n');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mawebtec_lms',
    multipleStatements: true
  });

  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, 'create-missing-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('Executing SQL statements...');
    
    // Split and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await connection.query(statement);
        console.log('✓ Executed:', statement.substring(0, 50) + '...');
      } catch (error) {
        if (error.message.includes('Duplicate column') || 
            error.message.includes('already exists')) {
          console.log('⚠️  Already exists:', statement.substring(0, 50) + '...');
        } else {
          console.error('❌ Error:', error.message);
        }
      }
    }

    // Verify tables
    console.log('\n📋 Verifying tables...');
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    console.log('✓ agencies table:', tableNames.includes('agencies') ? 'EXISTS' : 'MISSING');
    console.log('✓ refresh_tokens table:', tableNames.includes('refresh_tokens') ? 'EXISTS' : 'MISSING');
    console.log('✓ system_audit_logs table:', tableNames.includes('system_audit_logs') ? 'EXISTS' : 'MISSING');

    // Check users table structure
    console.log('\n📋 Checking users table...');
    const [columns] = await connection.query('SHOW COLUMNS FROM users');
    const columnNames = columns.map(c => c.Field);
    console.log('✓ agecny_id column:', columnNames.includes('agecny_id') ? 'EXISTS' : 'MISSING');

    console.log('\n✅ Database fix complete!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

fixDatabase()
  .then(() => {
    console.log('\n✓ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Script failed:', error);
    process.exit(1);
  });
