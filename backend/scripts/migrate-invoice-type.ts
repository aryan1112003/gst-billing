import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function runMigration() {
    let connection;

    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'mawebtec_lms'
        });

        console.log('Connected successfully!');

        // Check if column already exists
        console.log('Checking if type column exists...');
        const [columns] = await connection.query(
            "SHOW COLUMNS FROM invoices LIKE 'type'"
        );

        if (Array.isArray(columns) && columns.length > 0) {
            console.log('✅ Column "type" already exists in invoices table');
        } else {
            console.log('Adding type column to invoices table...');
            await connection.query(`
                ALTER TABLE invoices
                ADD COLUMN type ENUM('invoice', 'quotation', 'challan') NOT NULL DEFAULT 'invoice' AFTER status
            `);
            console.log('✅ Column "type" added successfully');
        }

        // Check if index exists
        console.log('Checking if index exists...');
        const [indexes] = await connection.query(
            "SHOW INDEX FROM invoices WHERE Key_name = 'idx_invoices_type'"
        );

        if (Array.isArray(indexes) && indexes.length > 0) {
            console.log('✅ Index "idx_invoices_type" already exists');
        } else {
            console.log('Creating index on type column...');
            await connection.query(`
                CREATE INDEX idx_invoices_type ON invoices(type)
            `);
            console.log('✅ Index created successfully');
        }

        console.log('\n🎉 Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

runMigration();
