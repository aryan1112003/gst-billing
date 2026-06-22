import { query } from '../config/database';

async function run() {
    try {
        console.log('Creating settings table...');
        await query(`
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
            await query(
                'INSERT IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)',
                [key, value]
            );
        }

        console.log('✓ Settings table fixed in master database');
    } catch (error) {
        console.error('Failed to fix settings:', error);
    }
    process.exit(0);
}

run();
