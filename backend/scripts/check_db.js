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

        const [agencies] = await connection.query('SELECT id, company_name, phone, address, city, state, logo_url FROM agencies WHERE id = 1');
        console.log('--- AGENCY 1 DATA ---');
        console.log(JSON.stringify(agencies[0], null, 2));

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

check();
