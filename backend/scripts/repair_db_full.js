const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function repair() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'mawebtec_lms'
        });

        console.log('Repairing Agency ID 1 with FULL DATA...');
        await connection.query(
            `UPDATE agencies SET 
        company_name = ?, 
        phone = ?, 
        address = ?, 
        city = ?, 
        state = ?, 
        zip_code = ?,
        gst_number = ?,
        pan_number = ?,
        business_type = ?,
        fax_number = ?,
        vat_number = ?,
        cst_number = ?,
        service_tax_number = ?
      WHERE id = ?`,
            [
                'Ma Web Technologies',
                '9876543210',
                '123, Tech Plaza, Corporate Road',
                'Ahmedabad',
                'Gujarat',
                '380051',
                '24AAAAA0000A1Z5',
                'ABCDE1234F',
                'Service Provider',
                '079-12345678',
                'VAT123',
                'CST456',
                'ST789',
                1
            ]
        );

        console.log('✅ Repair completed successfully.');
        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

repair();
