const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDefaultAgency() {
    console.log('Creating default agency...');

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'erp_business_db'
        });

        // 1. Create Agency
        const [result] = await connection.execute(`
      INSERT INTO agencies (
        company_name, database_name, email, phone, address, 
        gst_number, subscription_plan, status, created_at, updated_at
      ) VALUES (
        'My Default Company', 
        'agency_default', 
        'admin@example.com', 
        '1234567890', 
        '123 Business St', 
        'GST12345', 
        'enterprise', 
        'active', 
        NOW(), 
        NOW()
      )
    `);

        const agencyId = result.insertId;
        console.log(`Created Agency ID: ${agencyId}`);

        // 2. Update Admin User to link to this agency
        await connection.execute('UPDATE users SET agency_id = ? WHERE email = ?', [agencyId, 'admin@example.com']);
        console.log(`Updated admin@example.com to have agency_id: ${agencyId}`);

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

createDefaultAgency();
