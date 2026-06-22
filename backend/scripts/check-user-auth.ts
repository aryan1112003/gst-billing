
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'erp_db',
};

async function checkUser() {
    const email = 'admin3@example.com';
    console.log(`Checking user: ${email}...`);

    try {
        const connection = await mysql.createConnection(dbConfig);

        // Get user details
        const [rows] = await connection.execute(
            'SELECT id, email, password, password_hash, roleId, role, is_active, agecny_id, agency_id FROM users WHERE email = ?',
            [email]
        );

        if ((rows as any[]).length === 0) {
            console.log('User not found!');
        } else {
            const user = (rows as any[])[0];
            const fs = require('fs');
            fs.writeFileSync('user_debug.json', JSON.stringify(user, null, 2));
            console.log('Written detailed info to user_debug.json');
        }

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkUser();
