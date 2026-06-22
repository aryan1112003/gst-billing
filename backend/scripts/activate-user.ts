import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

async function activateUser() {
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mawebtec_lms',
    };

    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Activating admin1@example.com...');

        const [result] = await connection.execute(
            'UPDATE users SET is_active = 1 WHERE email = ?',
            ['admin1@example.com']
        );

        console.log('Result:', JSON.stringify(result));
        console.log('✅ User admin1@example.com activated successfully!');

        await connection.end();
    } catch (error) {
        console.error('Error activating user:', error);
    }
}

activateUser();
