import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env vars
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

async function debugUsers() {
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mawebtec_lms',
    };

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT id, email, name, role, roleId, is_active FROM users');

        fs.writeFileSync(path.join(__dirname, 'users_dump.json'), JSON.stringify(rows, null, 2));
        console.log('Dumped users to users_dump.json');

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

debugUsers();
