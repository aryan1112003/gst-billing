const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkColumns() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'erp_business_db'
        });

        const [columns] = await connection.execute('SHOW COLUMNS FROM users');
        console.log('Users Table Columns:', columns.map(c => c.Field));

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkColumns();
