const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function importDatabase() {
  let connection;
  
  try {
    console.log('🔄 Starting database import...');
    
    // SQL file path
    const sqlFilePath = 'C:\\Users\\aryan\\Downloads\\gst_billing\\mawebtec_lms.sql';
    
    // Check if file exists
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`❌ SQL file not found at: ${sqlFilePath}`);
      console.log('\n📝 Please ensure the file exists at the specified location');
      process.exit(1);
    }
    
    console.log(`✅ Found SQL file: ${sqlFilePath}`);
    console.log('📖 Reading SQL file...');
    
    // Read SQL file
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log(`✅ SQL file read successfully (${(sqlContent.length / 1024).toFixed(2)} KB)`);
    
    // Connect to MySQL
    console.log('🔄 Connecting to MySQL...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });
    
    console.log('✅ Connected to MySQL');
    
    // Execute SQL
    console.log('🔄 Importing database (this may take a while)...');
    await connection.query(sqlContent);
    
    console.log('✅ Database imported successfully!');
    
    // Verify import
    const dbName = process.env.DB_NAME || 'mawebtec_lms';
    await connection.query(`USE ${dbName}`);
    
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`✅ Verified: ${tables.length} tables created`);
    
    // Show some table names
    console.log('\n📋 Sample tables:');
    tables.slice(0, 10).forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`   ${index + 1}. ${tableName}`);
    });
    
    if (tables.length > 10) {
      console.log(`   ... and ${tables.length - 10} more tables`);
    }
    
    console.log('\n🎉 Database import completed successfully!');
    
  } catch (error) {
    console.error('❌ Database import failed:', error.message || error);
    console.error('\n📝 Troubleshooting:');
    console.error('   1. Make sure MySQL is running');
    console.error('   2. Check your credentials in .env file');
    console.error('   3. Verify MySQL is listening on port 3306');
    console.error('   4. Try: mysql -u root -p');
    if (error.sql) {
      console.error('\nSQL Error:', error.sql.substring(0, 200));
    }
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

importDatabase();
