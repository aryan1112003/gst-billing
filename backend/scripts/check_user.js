const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function check() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'mawebtec_lms'
        });

        const [users] = await connection.query('SELECT id, email, role, agency_id FROM users WHERE email = ?', ['admin@example.com']);
        console.log('--- ADMIN USER ---');
        console.log(JSON.stringify(users[0], null, 2));

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

check();
