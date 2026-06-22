import { query, connectDatabase, disconnectDatabase } from '../src/config/database';
import fs from 'fs';
import path from 'path';

const runMigration = async () => {
    try {
        console.log('Connecting to database...');
        await connectDatabase();

        const sqlPath = path.join(__dirname, 'add-invoice-type-column.sql');
        console.log(`Reading SQL file from ${sqlPath}...`);

        if (!fs.existsSync(sqlPath)) {
            console.error('Migration file not found!');
            process.exit(1);
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');
        const statements = sql.split(';').filter(s => s.trim().length > 0);

        console.log(`Found ${statements.length} statements to execute.`);

        for (const statement of statements) {
            console.log(`Executing: ${statement.substring(0, 50)}...`);
            try {
                await query(statement);
                console.log('Success.');
            } catch (err: any) {
                // Ignore "duplicate column name" error (Code 1060)
                if (err.code === 'ER_DUP_FIELDNAME' || err.message.includes('Duplicate column name')) {
                    console.log('Column already exists, skipping.');
                }
                // Ignore "duplicate key name" error (Code 1061)
                else if (err.code === 'ER_DUP_KEYNAME' || err.message.includes('Duplicate key name')) {
                    console.log('Index already exists, skipping.');
                }
                else {
                    console.error('Error executing statement:', err);
                    throw err;
                }
            }
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await disconnectDatabase();
        process.exit(0);
    }
};

runMigration();
