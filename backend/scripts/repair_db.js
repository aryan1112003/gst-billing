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

        console.log('Repairing Agency ID 1...');
        await connection.query(
            'UPDATE agencies SET company_name = ?, phone = ?, address = ?, city = ?, state = ? WHERE id = ?',
            ['Ma Web Technologies', '9876543210', 'Demo Address', 'Ahmedabad', 'Gujarat', 1]
        );

        console.log('Assigning Admin to Agency ID 1...');
        await connection.query(
            'UPDATE users SET agency_id = ? WHERE email = ?',
            [1, 'admin@example.com']
        );

        console.log('✅ Repair completed successfully.');
        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

repair();
