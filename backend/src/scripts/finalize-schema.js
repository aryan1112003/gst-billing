const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mawebtec_lms'
    });

    try {
        console.log('Creating audit_logs table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        table_name VARCHAR(50),
        record_id INT,
        action VARCHAR(20),
        old_values JSON,
        new_values JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
        console.log('✓ Audit logs table created successfully');

        // Also check if settings table exists and has defaults
        console.log('Ensuring settings table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        setting_type VARCHAR(50) DEFAULT 'string',
        description TEXT,
        updated_by INT DEFAULT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_setting_key (setting_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

        console.log('Seeding default settings...');
        const defaults = [
            ['invoice_prefix', 'INV'],
            ['invoice_next_number', '1'],
            ['quotation_prefix', 'QUO'],
            ['quotation_next_number', '1'],
            ['challan_prefix', 'DC'],
            ['challan_next_number', '1']
        ];

        for (const [key, value] of defaults) {
            await connection.query(
                'INSERT IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)',
                [key, value]
            );
        }
        console.log('✓ Settings table verified');

    } catch (error) {
        console.error('Failed to update schema:', error);
    } finally {
        await connection.end();
    }
    process.exit(0);
}

run();
