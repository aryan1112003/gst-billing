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

        const [info]: any = await connection.query(`
            SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = 'mawebtec_lms' 
            AND TABLE_NAME IN ('agencies', 'users') 
            AND COLUMN_NAME = 'id'
        `);
        console.log(JSON.stringify(info, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

checkSchema();
