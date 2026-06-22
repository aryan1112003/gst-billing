const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🔄 Connecting to MySQL...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });
    
    console.log('✅ Connected to MySQL');
    
    // Check if database exists
    const dbName = process.env.DB_NAME || 'mawebtec_lms';
    console.log(`📋 Checking database: ${dbName}...`);
    
    const [databases] = await connection.query(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [dbName]
    );
    
    if (databases.length === 0) {
      console.log(`❌ Database '${dbName}' not found!`);
      console.log('\n📝 Please import the mawebtec_lms.sql file first:');
      console.log(`   mysql -u ${process.env.DB_USER || 'root'} -p < C:\\Users\\aryan\\Downloads\\gst_billing\\mawebtec_lms.sql`);
      process.exit(1);
    }
    
    console.log(`✅ Database '${dbName}' exists`);
    
    // Use the database
    await connection.query(`USE ${dbName}`);
    
    // Check if tables exist
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`✅ Found ${tables.length} tables in database`);
    
    console.log('\n🎉 Database setup verified successfully!');
    console.log('\n📝 Database Information:');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.DB_PORT || '3306'}`);
    console.log(`   Database: ${dbName}`);
    console.log(`   Tables: ${tables.length}`);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message || error);
    console.error('\n📝 Troubleshooting:');
    console.error('   1. Make sure MySQL is running');
    console.error('   2. Check your credentials in .env file');
    console.error('   3. Verify MySQL is listening on port 3306');
    console.error('   4. Try: mysql -u root -p');
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();