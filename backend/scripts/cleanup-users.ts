import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

async function cleanupDuplicates() {
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mawebtec_lms',
    };

    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Removing duplicate user ID 92 (admin@nevaanorganic.com)...');

        const [result] = await connection.execute('DELETE FROM users WHERE id = 92');
        console.log('Result:', JSON.stringify(result));

        // Also activate admin3 for good measure if they are testing with it
        console.log('Activating admin3@example.com...');
        await connection.execute('UPDATE users SET is_active = 1 WHERE email = ?', ['admin3@example.com']);

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

cleanupDuplicates();
