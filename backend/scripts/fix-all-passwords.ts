
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'erp_db',
};

async function fixLegacyPasswords() {
    console.log('Scanning for users with misplaced passwords...');
    const connection = await mysql.createConnection(dbConfig);

    try {
        const [rows] = await connection.execute(
            'SELECT id, email, password FROM users WHERE password_hash IS NULL AND password LIKE "$2%"'
        );

        const users = rows as any[];
        console.log(`Found ${users.length} users to fix.`);

        for (const user of users) {
            console.log(`Fixing user ${user.email} (ID: ${user.id})...`);
            await connection.execute(
                'UPDATE users SET password_hash = ? WHERE id = ?',
                [user.password, user.id]
            );
        }

        console.log('Done!');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

fixLegacyPasswords();
