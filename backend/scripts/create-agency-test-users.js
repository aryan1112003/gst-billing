const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createTestUsers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mawebtec_lms'
  });

  try {
    console.log('Connected to database');

    // Hash password for test users
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    // Get first 5 agencies
    const [agencies] = await connection.execute(
      'SELECT id, agency_name FROM agencies ORDER BY id LIMIT 5'
    );

    console.log(`\nFound ${agencies.length} agencies`);

    const testUsers = [];

    // Create test users for each agency
    for (const agency of agencies) {
      const agencyId = agency.id;
      const agencyName = agency.agency_name;

      // Agency Admin
      const adminEmail = `agency${agencyId}@test.com`;
      const adminName = `${agencyName} Admin`;

      // Agency User
      const userEmail = `agency${agencyId}user@test.com`;
      const userName = `${agencyName} User`;

      // Check if users already exist
      const [existingAdmin] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [adminEmail]
      );

      const [existingUser] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [userEmail]
      );

      // Create admin if doesn't exist
      if (existingAdmin.length === 0) {
        await connection.execute(
          `INSERT INTO users (name, email, password, roleId, agecny_id, created_at, updated_at)
           VALUES (?, ?, ?, 2, ?, NOW(), NOW())`,
          [adminName, adminEmail, hashedPassword, agencyId]
        );
        console.log(`✓ Created: ${adminEmail}`);
        testUsers.push({
          email: adminEmail,
          password: password,
          role: 'Agency Admin',
          agency_id: agencyId,
          agency_name: agencyName
        });
      } else {
        console.log(`- Already exists: ${adminEmail}`);
      }

      // Create user if doesn't exist
      if (existingUser.length === 0) {
        await connection.execute(
          `INSERT INTO users (name, email, password, roleId, agecny_id, created_at, updated_at)
           VALUES (?, ?, ?, 3, ?, NOW(), NOW())`,
          [userName, userEmail, hashedPassword, agencyId]
        );
        console.log(`✓ Created: ${userEmail}`);
        testUsers.push({
          email: userEmail,
          password: password,
          role: 'Agency User',
          agency_id: agencyId,
          agency_name: agencyName
        });
      } else {
        console.log(`- Already exists: ${userEmail}`);
      }
    }

    // Get system admin
    const [systemAdmin] = await connection.execute(
      'SELECT email FROM users WHERE roleId = 1 LIMIT 1'
    );

    console.log('\n' + '='.repeat(80));
    console.log('TEST USERS CREATED SUCCESSFULLY!');
    console.log('='.repeat(80));

    console.log('\n📋 SYSTEM ADMIN (sees ALL data):');
    console.log('─'.repeat(80));
    if (systemAdmin.length > 0) {
      console.log(`Email:    ${systemAdmin[0].email}`);
      console.log(`Password: admin123 (or your existing password)`);
      console.log(`Role:     System Admin`);
      console.log(`Access:   ALL agencies, ALL data`);
    }

    console.log('\n📋 AGENCY TEST USERS (see only their agency data):');
    console.log('─'.repeat(80));

    // Get all test users
    const [allTestUsers] = await connection.execute(
      `SELECT u.email, u.roleId, u.agecny_id, a.agency_name
       FROM users u
       LEFT JOIN agencies a ON u.agecny_id = a.id
       WHERE u.email LIKE '%@test.com'
       ORDER BY u.agecny_id, u.roleId`
    );

    allTestUsers.forEach((user, index) => {
      const roleMap = { 1: 'System Admin', 2: 'Agency Admin', 3: 'Agency User' };
      console.log(`\n${index + 1}. ${user.agency_name || 'System'}`);
      console.log(`   Email:     ${user.email}`);
      console.log(`   Password:  password123`);
      console.log(`   Role:      ${roleMap[user.roleId]}`);
      console.log(`   Agency ID: ${user.agecny_id}`);
      console.log(`   Access:    ${user.agecny_id === 0 ? 'ALL data' : `Only Agency ${user.agecny_id} data`}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('🧪 HOW TO TEST:');
    console.log('='.repeat(80));
    console.log('\n1. Start backend: cd backend && npm start');
    console.log('\n2. Login with System Admin to see ALL data');
    console.log('\n3. Login with Agency 1 user to see ONLY Agency 1 data');
    console.log('\n4. Login with Agency 2 user to see ONLY Agency 2 data');
    console.log('\n5. Compare results - they should be different!');
    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

createTestUsers();
