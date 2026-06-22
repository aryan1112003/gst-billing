import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

async function debugSchema() {
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mawebtec_lms',
    };

    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected successfully!');

        console.log('\n--- DESCRIBE USERS ---');
        const [rows] = await connection.execute('DESCRIBE users');
        console.log(JSON.stringify(rows, null, 2));

        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

debugSchema();
