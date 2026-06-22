import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

async function listAgencies() {
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mawebtec_lms',
    };

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM agencies ORDER BY id DESC LIMIT 5');

        fs.writeFileSync(path.join(__dirname, 'agencies_dump.json'), JSON.stringify(rows, null, 2));
        console.log('Dumped agencies to agencies_dump.json');

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

listAgencies();
