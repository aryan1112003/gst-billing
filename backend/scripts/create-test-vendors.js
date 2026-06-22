const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTestVendors() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mawebtec_lms'
    });

    console.log('✅ Connected to database');

    // Delete existing test vendors
    await connection.execute("DELETE FROM vendors WHERE name LIKE 'Test Vendor%'");
    console.log('✅ Deleted existing test vendors');

    // Create test vendors
    const vendors = [
      {
        name: 'Test Vendor 1 - Tech Supplies',
        email: 'contact@techsupplies.com',
        phone: '+91 9876543210',
        address: '123 Tech Street, Mumbai, Maharashtra 400001',
        gstin: '27AABCT1234H1Z5'
      },
      {
        name: 'Test Vendor 2 - Office Solutions',
        email: 'info@officesolutions.com',
        phone: '+91 9876543211',
        address: '456 Office Road, Delhi 110001',
        gstin: '07AABCT5678K1Z9'
      },
      {
        name: 'Test Vendor 3 - Cleaning Services',
        email: 'service@cleaningpro.com',
        phone: '+91 9876543212',
        address: '789 Service Lane, Bangalore, Karnataka 560001',
        gstin: '29AABCT9012M1Z3'
      },
      {
        name: 'Test Vendor 4 - IT Contractors',
        email: 'hello@itcontractors.com',
        phone: '+91 9876543213',
        address: '321 IT Park, Pune, Maharashtra 411001',
        gstin: '27AABCT3456N1Z7'
      },
      {
        name: 'Test Vendor 5 - Stationery Mart',
        email: 'sales@stationerymart.com',
        phone: '+91 9876543214',
        address: '654 Market Street, Chennai, Tamil Nadu 600001',
        gstin: '33AABCT7890P1Z1'
      }
    ];

    const createdVendors = [];

    for (const vendor of vendors) {
      const [result] = await connection.execute(
        'INSERT INTO vendors (name, email, phone, address, gstin) VALUES (?, ?, ?, ?, ?)',
        [vendor.name, vendor.email, vendor.phone, vendor.address, vendor.gstin]
      );
      
      createdVendors.push({
        id: result.insertId,
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone
      });
      
      console.log(`✅ Created vendor: ${vendor.name}`);
    }

    console.log('\n📋 Test Vendors Created:');
    console.table(createdVendors);

    console.log('\n🎉 Test vendors created successfully!');
    console.log(`\n📝 Total Vendors: ${createdVendors.length}`);
    console.log('\n✨ Refresh your Vendors page to see the data!');

  } catch (error) {
    console.error('❌ Error creating test vendors:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

createTestVendors();
