const mysql = require('mysql2/promise');

async function checkUsers() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'mawebtec_lms'
    });

    console.log('✅ Connected to database\n');

    const [users] = await connection.execute('SELECT id, email, name, roleId, is_active FROM users LIMIT 10');
    
    console.log(`Found ${users.length} users:\n`);
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Role: ${user.roleId}, Active: ${user.is_active}`);
    });

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUsers();
