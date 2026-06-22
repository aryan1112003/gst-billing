const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createDemoUser() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'mawebtec_lms'
    });

    console.log('✅ Connected to database\n');

    // Check if demo user already exists
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      ['admin@example.com']
    );

    if (existing.length > 0) {
      console.log('⚠️  Demo user already exists!');
      await connection.end();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create demo user
    await connection.execute(
      `INSERT INTO users (email, name, password_hash, roleId, is_active, createdDtm, updatedDtm) 
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      ['admin@example.com', 'Demo Admin', hashedPassword, 1, 1]
    );

    console.log('✅ Demo user created successfully!');
    console.log('\nCredentials:');
    console.log('  Email: admin@example.com');
    console.log('  Password: admin123');
    console.log('  Role: Admin (roleId: 1)');

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createDemoUser();
