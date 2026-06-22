const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function migrate() {
    console.log('Starting migration to add missing columns to agencies table...');

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'mawebtec_lms'
        });

        console.log('Connected to database.');

        const alterQueries = [
            "ADD COLUMN IF NOT EXISTS city VARCHAR(100) AFTER address",
            "ADD COLUMN IF NOT EXISTS state VARCHAR(100) AFTER city",
            "ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20) AFTER state",
            "ADD COLUMN IF NOT EXISTS fax_number VARCHAR(50) AFTER phone",
            "ADD COLUMN IF NOT EXISTS vat_number VARCHAR(50) AFTER pan_number",
            "ADD COLUMN IF NOT EXISTS cst_number VARCHAR(50) AFTER vat_number",
            "ADD COLUMN IF NOT EXISTS service_tax_number VARCHAR(50) AFTER cst_number"
        ];

        for (const query of alterQueries) {
            console.log(`Executing: ALTER TABLE agencies ${query}`);
            await connection.query(`ALTER TABLE agencies ${query}`);
        }

        console.log('✅ Migration completed successfully.');
        await connection.end();

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
