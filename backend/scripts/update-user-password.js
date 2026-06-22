const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function updateUserPassword() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mawebtec_lms'
  });

  try {
    console.log('Connected to database');
    console.log('='.repeat(80));

    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get first agency for testing (mawebtec_lms uses 'agency' table, not 'agencies')
    let testAgencyId = 1;
    let testAgencyName = 'Test Agency';
    
    try {
      const [agencies] = await connection.execute(
        'SELECT id, agency_name FROM agency ORDER BY id LIMIT 1'
      );
      if (agencies.length > 0) {
        testAgencyId = agencies[0].id;
        testAgencyName = agencies[0].agency_name;
      }
    } catch (err) {
      // If agency table doesn't exist, just use default values
      console.log('Note: Using default agency (agency table not found)');
    }

    console.log(`\n📋 Using Agency: ${testAgencyName} (ID: ${testAgencyId})`);

    // 1. Update/Create System Admin
    const adminEmail = 'admin@test.com';
    const [existingAdmin] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [adminEmail]
    );

    if (existingAdmin.length > 0) {
      await connection.execute(
        'UPDATE users SET password = ?, roleId = 1, agecny_id = 0, name = ?, updated_at = NOW() WHERE email = ?',
        [hashedPassword, 'System Admin', adminEmail]
      );
      console.log(`✅ Updated: ${adminEmail} (System Admin)`);
    } else {
      await connection.execute(
        'INSERT INTO users (name, email, password, roleId, agecny_id, created_at, updated_at) VALUES (?, ?, ?, 1, 0, NOW(), NOW())',
        ['System Admin', adminEmail, hashedPassword]
      );
      console.log(`✅ Created: ${adminEmail} (System Admin)`);
    }

    // 2. Update/Create Agency Admin
    const agencyAdminEmail = 'agency@test.com';
    const [existingAgencyAdmin] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [agencyAdminEmail]
    );

    if (existingAgencyAdmin.length > 0) {
      await connection.execute(
        'UPDATE users SET password = ?, roleId = 2, agecny_id = ?, name = ?, updated_at = NOW() WHERE email = ?',
        [hashedPassword, testAgencyId, `${testAgencyName} Admin`, agencyAdminEmail]
      );
      console.log(`✅ Updated: ${agencyAdminEmail} (Agency Admin)`);
    } else {
      await connection.execute(
        'INSERT INTO users (name, email, password, roleId, agecny_id, created_at, updated_at) VALUES (?, ?, ?, 2, ?, NOW(), NOW())',
        [`${testAgencyName} Admin`, agencyAdminEmail, hashedPassword, testAgencyId]
      );
      console.log(`✅ Created: ${agencyAdminEmail} (Agency Admin)`);
    }

    // 3. Update/Create Agency User
    const agencyUserEmail = 'user@test.com';
    const [existingAgencyUser] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [agencyUserEmail]
    );

    if (existingAgencyUser.length > 0) {
      await connection.execute(
        'UPDATE users SET password = ?, roleId = 3, agecny_id = ?, name = ?, updated_at = NOW() WHERE email = ?',
        [hashedPassword, testAgencyId, `${testAgencyName} User`, agencyUserEmail]
      );
      console.log(`✅ Updated: ${agencyUserEmail} (Agency User)`);
    } else {
      await connection.execute(
        'INSERT INTO users (name, email, password, roleId, agecny_id, created_at, updated_at) VALUES (?, ?, ?, 3, ?, NOW(), NOW())',
        [`${testAgencyName} User`, agencyUserEmail, hashedPassword, testAgencyId]
      );
      console.log(`✅ Created: ${agencyUserEmail} (Agency User)`);
    }

    // 4. Also update meenakshi.vats88@gmail.com
    const [existingMeenakshi] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      ['meenakshi.vats88@gmail.com']
    );

    if (existingMeenakshi.length > 0) {
      const adminHash = await bcrypt.hash('admin123', 10);
      await connection.execute(
        'UPDATE users SET password = ?, roleId = 1, agecny_id = 0, updated_at = NOW() WHERE email = ?',
        [adminHash, 'meenakshi.vats88@gmail.com']
      );
      console.log(`✅ Updated: meenakshi.vats88@gmail.com (System Admin)`);
    }

    // 5. Update softwareinbudget@gmail.com
    const [existingSoftware] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      ['softwareinbudget@gmail.com']
    );

    if (existingSoftware.length > 0) {
      await connection.execute(
        'UPDATE users SET password = ?, updated_at = NOW() WHERE email = ?',
        [hashedPassword, 'softwareinbudget@gmail.com']
      );
      console.log(`✅ Updated: softwareinbudget@gmail.com`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL USERS UPDATED SUCCESSFULLY!');
    console.log('='.repeat(80));

    console.log('\n🔑 TEST CREDENTIALS (All passwords: password123):');
    console.log('─'.repeat(80));
    
    console.log('\n1️⃣  SYSTEM ADMIN (Sees ALL data from ALL agencies):');
    console.log('   Email:     admin@test.com');
    console.log('   Password:  password123');
    console.log('   Role:      System Admin (roleId=1)');
    console.log('   Agency:    0 (System Level)');
    console.log('   Access:    ✅ ALL agencies, ALL data');

    console.log('\n2️⃣  AGENCY ADMIN (Sees only their agency data):');
    console.log(`   Email:     agency@test.com`);
    console.log('   Password:  password123');
    console.log('   Role:      Agency Admin (roleId=2)');
    console.log(`   Agency:    ${testAgencyId} (${testAgencyName})`);
    console.log(`   Access:    ✅ Only Agency ${testAgencyId} data`);

    console.log('\n3️⃣  AGENCY USER (Sees only their agency data):');
    console.log(`   Email:     user@test.com`);
    console.log('   Password:  password123');
    console.log('   Role:      Agency User (roleId=3)');
    console.log(`   Agency:    ${testAgencyId} (${testAgencyName})`);
    console.log(`   Access:    ✅ Only Agency ${testAgencyId} data`);

    console.log('\n4️⃣  EXISTING USERS:');
    console.log('   Email:     meenakshi.vats88@gmail.com');
    console.log('   Password:  admin123');
    console.log('   Role:      System Admin');
    console.log('   Access:    ✅ ALL data');

    console.log('\n   Email:     softwareinbudget@gmail.com');
    console.log('   Password:  password123');
    console.log('   Role:      (Current role preserved)');

    console.log('\n' + '='.repeat(80));
    console.log('🧪 HOW TO TEST MULTI-TENANT:');
    console.log('='.repeat(80));
    console.log('\n1. Login as admin@test.com → Should see ALL data');
    console.log('2. Login as agency@test.com → Should see ONLY their agency data');
    console.log('3. Login as user@test.com → Should see ONLY their agency data');
    console.log('4. Compare results - they should be different!');
    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

updateUserPassword();
