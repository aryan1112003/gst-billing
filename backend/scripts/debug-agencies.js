const mysql = require('mysql2/promise');
require('dotenv').config();

const { config } = require('../dist/config');

async function checkAgencies() {
    console.log('Checking agencies...');

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'erp_business_db'
        });

        const [rows] = await connection.execute('SELECT * FROM agencies');
        console.log('Agencies found:', rows.length);
        if (rows.length > 0) {
            rows.forEach(agency => {
                console.log(`ID: ${agency.id}, Name: ${agency.company_name}, Email: ${agency.email}`);
            });
        } else {
            console.log('No agencies found.');
        }

        // Also check current admin user
        const [users] = await connection.execute('SELECT * FROM users WHERE email = "admin@example.com"');
        if (users.length > 0) {
            console.log('Admin user found:', users[0]);
        }

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkAgencies();
