const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    let connection;
    try {
        console.log('🔄 Connecting to MySQL...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'mawebtec_lms'
        });

        console.log('✅ Connected. Adding columns...');

        const columns = [
            "ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255) DEFAULT NULL",
            "ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE",
            "ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255) DEFAULT NULL",
            "ADD COLUMN IF NOT EXISTS reset_password_expires DATETIME DEFAULT NULL"
        ];

        for (const col of columns) {
            try {
                await connection.query(`ALTER TABLE users ${col}`);
                console.log(`   ✅ Executed: ${col}`);
            } catch (e) {
                // Ignore "Duplicate column name" if manual check failed (though IF NOT EXISTS handles it usually)
                if (e.code === 'ER_DUP_FIELDNAME') {
                    console.log(`   ⚠️ Column already exists (skipped): ${col}`);
                } else {
                    // For MySQL 5.7 which might not support IF NOT EXISTS in ALTER TABLE
                    console.log(`   ⚠️ Note: ${e.message}`);
                    if (!e.message.includes("Duplicate column")) throw e;
                }
            }
        }

        console.log('🎉 Migration Complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
