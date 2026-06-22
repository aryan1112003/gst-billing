import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

async function fixUserRole() {
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mawebtec_lms',
    };

    try {
        const connection = await mysql.createConnection(dbConfig);
        const agencyId = 7; // nevaanorganic
        const targetEmail = 'admin1@example.com';

        console.log(`Updating ${targetEmail} to be Agency Admin for Agency ID ${agencyId} (nevaanorganic)...`);

        // Update role to agency (2), assign agency_id, and ensure active
        const [result] = await connection.execute(
            `UPDATE users 
       SET role = 'agency', 
           roleId = 2, 
           agency_id = ?, 
           agecny_id = ?,
           is_active = 1 
       WHERE email = ?`,
            [agencyId, agencyId, targetEmail]
        );

        console.log('Result:', JSON.stringify(result));

        // Also ensuring admin@nevaanorganic.com is correctly set just in case
        console.log(`Ensuring admin@nevaanorganic.com is also correct...`);
        await connection.execute(
            `UPDATE users 
       SET role = 'agency', 
           roleId = 2, 
           agency_id = ?, 
           agecny_id = ?, 
           is_active = 1 
       WHERE email = 'admin@nevaanorganic.com'`,
            [agencyId, agencyId]
        );

        console.log('✅ Updates completed successfully!');
        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

fixUserRole();
