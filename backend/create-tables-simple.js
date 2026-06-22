const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTables() {
  console.log('🔧 Creating missing tables...\n');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mawebtec_lms'
  });

  try {
    // Create agencies table
    console.log('Creating agencies table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS agencies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        database_name VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20) DEFAULT NULL,
        address TEXT,
        gst_number VARCHAR(50) DEFAULT NULL,
        pan_number VARCHAR(50) DEFAULT NULL,
        logo_url VARCHAR(255) DEFAULT NULL,
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        subscription_plan VARCHAR(50) DEFAULT 'basic',
        subscription_expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_database_name (database_name),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ agencies table created');

    // Create refresh_tokens table
    console.log('Creating refresh_tokens table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ refresh_tokens table created');

    // Create system_audit_logs table
    console.log('Creating system_audit_logs table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS system_audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        agency_id INT DEFAULT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100) DEFAULT NULL,
        entity_id INT DEFAULT NULL,
        details TEXT,
        ip_address VARCHAR(50) DEFAULT NULL,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_agency_id (agency_id),
        INDEX idx_action (action),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ system_audit_logs table created');

    // Verify
    console.log('\n📋 Verifying tables...');
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    console.log('✓ agencies:', tableNames.includes('agencies') ? '✅ EXISTS' : '❌ MISSING');
    console.log('✓ refresh_tokens:', tableNames.includes('refresh_tokens') ? '✅ EXISTS' : '❌ MISSING');
    console.log('✓ system_audit_logs:', tableNames.includes('system_audit_logs') ? '✅ EXISTS' : '❌ MISSING');

    console.log('\n✅ All tables created successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

createTables()
  .then(() => {
    console.log('\n✓ Done! You can now restart your backend server.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Failed:', error.message);
    process.exit(1);
  });
