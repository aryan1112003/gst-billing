import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkSchema() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'mawebtec_lms',
        });

        const [rows]: any = await connection.query('SHOW INDEX FROM users');
        console.log('Indexes on users table:');
        console.log(rows.map((r: any) => ({ Key_name: r.Key_name, Column_name: r.Column_name, Non_unique: r.Non_unique })));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

checkSchema();
