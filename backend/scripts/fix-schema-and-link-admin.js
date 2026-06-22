const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixSchemaAndLink() {
    console.log('Fixing schema and linking admin...');

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'erp_business_db'
        });

        // 1. Add agency_id column if not exists
        try {
            await connection.execute('ALTER TABLE users ADD COLUMN agency_id INT NULL');
            console.log('Added agency_id column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('agency_id column already exists.');
            } else {
                console.error('Error adding column:', e);
            }
        }

        // 2. Also ensure 'role' column exists as agencyService uses it (schema showed roleId)
        try {
            await connection.execute("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user'");
            console.log('Added role column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('role column already exists.');
            } else {
                // It might be okay if they use roleId, but let's check
                console.log('Note on role column:', e.message);
            }
        }

        // 3. Link Admin to Agency ID 1 (created in previous step)
        // First verify Agency 1 exists
        const [agencies] = await connection.execute('SELECT * FROM agencies WHERE id = 1');
        if (agencies.length === 0) {
            console.log('Agency 1 not found. Creating one...');
            const [result] = await connection.execute(`
            INSERT INTO agencies (company_name, database_name, email, status) 
            VALUES ('My Default Company', 'agency_default', 'admin@example.com', 'active')
        `);
            console.log('Created Agency ID:', result.insertId);
        } else {
            console.log('Agency 1 found.');
        }

        // Update user
        await connection.execute('UPDATE users SET agency_id = 1 WHERE email = ?', ['admin@example.com']);
        console.log('Linked admin@example.com to Agency ID 1.');

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

fixSchemaAndLink();
