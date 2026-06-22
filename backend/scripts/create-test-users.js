const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTestUsers() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mawebtec_lms'
    });

    console.log('✅ Connected to database');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const agencyPassword = await bcrypt.hash('agency123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    console.log('✅ Passwords hashed');

    // Delete existing test users
    await connection.execute(
      "DELETE FROM users WHERE email IN ('admin@test.com', 'agency@test.com', 'user@test.com')"
    );
    console.log('✅ Deleted existing test users');

    // Create admin user
    await connection.execute(
      'INSERT INTO users (username, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)',
      ['admin', 'admin@test.com', adminPassword, 'admin', 1]
    );
    console.log('✅ Created admin user (admin@test.com / admin123)');

    // Create agency user
    await connection.execute(
      'INSERT INTO users (username, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)',
      ['agency', 'agency@test.com', agencyPassword, 'agency', 1]
    );
    console.log('✅ Created agency user (agency@test.com / agency123)');

    // Create regular user
    await connection.execute(
      'INSERT INTO users (username, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)',
      ['user', 'user@test.com', userPassword, 'user', 1]
    );
    console.log('✅ Created regular user (user@test.com / user123)');

    // Verify users
    const [users] = await connection.execute(
      "SELECT id, username, email, role, is_active FROM users WHERE email LIKE '%@test.com'"
    );

    console.log('\n📋 Test Users Created:');
    console.table(users);

    console.log('\n🎉 Test users created successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('   Admin:  admin@test.com  / admin123');
    console.log('   Agency: agency@test.com / agency123');
    console.log('   User:   user@test.com   / user123');

  } catch (error) {
    console.error('❌ Error creating test users:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

// Run the script
createTestUsers();
