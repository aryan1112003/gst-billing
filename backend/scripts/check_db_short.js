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

        const [rows] = await connection.query('SELECT company_name, city, state FROM agencies WHERE id = 1');
        const row = rows[0];
        console.log('NAME:', row.company_name);
        console.log('CITY:', row.city);
        console.log('STATE:', row.state);

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

check();
