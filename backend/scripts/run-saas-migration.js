const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    let connection;
    try {
        console.log('🔄 Connecting to MySQL...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'mawebtec_lms',
            multipleStatements: true
        });

        console.log('✅ Connected. Running SaaS migration...');

        // Read the SQL file
        const sqlFile = path.join(__dirname, 'create-saas-tables.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        // Execute the SQL
        await connection.query(sql);

        console.log('🎉 SaaS tables created successfully!');

        // Verify tables
        const [tables] = await connection.query(`
      SELECT 
        'subscription_plans' AS table_name,
        COUNT(*) AS record_count 
      FROM subscription_plans
      UNION ALL
      SELECT 'subscriptions', COUNT(*) FROM subscriptions
      UNION ALL
      SELECT 'usage_tracking', COUNT(*) FROM usage_tracking
      UNION ALL
      SELECT 'payment_transactions', COUNT(*) FROM payment_transactions
    `);

        console.log('\n📊 Table Statistics:');
        console.table(tables);

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

runMigration();
