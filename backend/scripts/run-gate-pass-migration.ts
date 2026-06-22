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
            database: process.env.DB_NAME || 'mawebtec_lms',
            multipleStatements: false
        });

        console.log('Connected successfully!');

        const statements = [
            `DROP TABLE IF EXISTS gate_passes`,
            `CREATE TABLE gate_passes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                gate_pass_number VARCHAR(50) NOT NULL UNIQUE,
                type ENUM('inward', 'outward') NOT NULL,
                party_name VARCHAR(255) NOT NULL,
                vehicle_number VARCHAR(50) NOT NULL,
                driver_name VARCHAR(255) NOT NULL,
                driver_phone VARCHAR(20) NOT NULL,
                purpose TEXT,
                items_description TEXT NOT NULL,
                quantity DECIMAL(10, 2) NOT NULL,
                unit VARCHAR(50) NOT NULL DEFAULT 'pcs',
                remarks TEXT,
                status ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
                agency_id INT NOT NULL,
                created_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_gate_pass_number (gate_pass_number),
                INDEX idx_type (type),
                INDEX idx_status (status),
                INDEX idx_agency_id (agency_id),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci`,
            `ALTER TABLE gate_passes ADD CONSTRAINT fk_gate_pass_agency FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE`,
            `ALTER TABLE gate_passes ADD CONSTRAINT fk_gate_pass_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE`
        ];

        for (const sql of statements) {
            try {
                console.log(`Running: ${sql.substring(0, 50)}...`);
                await connection.query(sql);
            } catch (err: any) {
                console.error('SQL Error Message:', err.message);
                console.error('SQL State:', err.sqlState);
                console.error('Error Code:', err.code);
                throw err;
            }
        }

        console.log('✅ Gate passes table created successfully with foreign keys');
        console.log('\n🎉 Migration completed successfully!');

    } catch (error: any) {
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

runMigration();
