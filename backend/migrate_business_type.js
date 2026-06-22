const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gst_billing_master',
    });

    try {
        console.log('Checking for business_type column in agencies table...');
        const [columns] = await connection.query('SHOW COLUMNS FROM agencies LIKE "business_type"');

        if (columns.length === 0) {
            console.log('Adding business_type column to agencies table...');
            await connection.query('ALTER TABLE agencies ADD COLUMN business_type VARCHAR(100) AFTER subscription_plan');
            console.log('✓ Column added successfully');
        } else {
            console.log('✓ business_type column already exists');
        }
    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        await connection.end();
    }
}

migrate();
