const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function simpleUpdatePassword() {
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
    const adminPassword = 'admin123';
    const adminHashedPassword = await bcrypt.hash(adminPassword, 10);

    // Use agency_id = 1 for testing (most databases have at least one agency)
    const testAgencyId = 1;

    console.log('\n📋 Creating/Updating Test Users...\n');

    // 1. System Admin
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

    // 2. Agency Admin
    const agencyAdminEmail = 'agency@test.com';
    const [existingAgencyAdmin] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [agencyAdminEmail]
    );

    if (existingAgencyAdmin.length > 0) {
      await connection.execute(
        'UPDATE users SET password = ?, roleId = 2, agecny_id = ?, name = ?, updated_at = NOW() WHERE email = ?',
        [hashedPassword, testAgencyId, 'Agency Admin', agencyAdminEmail]
      );
      console.log(`✅ Updated: ${agencyAdminEmail} (Agency Admin)`);
    } else {
      await connection.execute(
        'INSERT INTO users (name, email, password, roleId, agecny_id, created_at, updated_at) VALUES (?, ?, ?, 2, ?, NOW(), NOW())',
        ['Agency Admin', agencyAdminEmail, hashedPassword, testAgencyId]
      );
      console.log(`✅ Created: ${agencyAdminEmail} (Agency Admin)`);
    }

    // 3. Agency User
    const agencyUserEmail = 'user@test.com';
    const [existingAgencyUser] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [agencyUserEmail]
    );

    if (existingAgencyUser.length > 0) {
      await connection.execute(
        'UPDATE users SET password = ?, roleId = 3, agecny_id = ?, name = ?, updated_at = NOW() WHERE email = ?',
        [hashedPassword, testAgencyId, 'Agency User', agencyUserEmail]
      );
      console.log(`✅ Updated: ${agencyUserEmail} (Agency User)`);
    } else {
      await connection.execute(
        'INSERT INTO users (name, email, password, roleId, agecny_id, created_at, updated_at) VALUES (?, ?, ?, 3, ?, NOW(), NOW())',
        ['Agency User', agencyUserEmail, hashedPassword, testAgencyId]
      );
      console.log(`✅ Created: ${agencyUserEmail} (Agency User)`);
    }

    // 4. Update meenakshi.vats88@gmail.com
    const [existingMeenakshi] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      ['meenakshi.vats88@gmail.com']
    );

    if (existingMeenakshi.length > 0) {
      await connection.execute(
        'UPDATE users SET password = ?, roleId = 1, agecny_id = 0, updated_at = NOW() WHERE email = ?',
        [adminHashedPassword, 'meenakshi.vats88@gmail.com']
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

    console.log('\n🔑 LOGIN CREDENTIALS:');
    console.log('─'.repeat(80));
    
    console.log('\n1️⃣  SYSTEM ADMIN (Sees ALL data):');
    console.log('   Email:     admin@test.com');
    console.log('   Password:  password123');
    console.log('   Role:      System Admin (roleId=1)');
    console.log('   Agency:    0 (System Level)');

    console.log('\n2️⃣  AGENCY ADMIN (Sees only Agency 1 data):');
    console.log('   Email:     agency@test.com');
    console.log('   Password:  password123');
    console.log('   Role:      Agency Admin (roleId=2)');
    console.log('   Agency:    1');

    console.log('\n3️⃣  AGENCY USER (Sees only Agency 1 data):');
    console.log('   Email:     user@test.com');
    console.log('   Password:  password123');
    console.log('   Role:      Agency User (roleId=3)');
    console.log('   Agency:    1');

    console.log('\n4️⃣  EXISTING USERS:');
    console.log('   Email:     meenakshi.vats88@gmail.com');
    console.log('   Password:  admin123');
    console.log('   Role:      System Admin');

    console.log('\n   Email:     softwareinbudget@gmail.com');
    console.log('   Password:  password123');

    console.log('\n' + '='.repeat(80));
    console.log('🧪 TEST NOW:');
    console.log('='.repeat(80));
    console.log('\n1. Start backend: npm start');
    console.log('2. Login as admin@test.com → See ALL data');
    console.log('3. Login as agency@test.com → See ONLY Agency 1 data');
    console.log('4. Compare results!');
    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

simpleUpdatePassword();
