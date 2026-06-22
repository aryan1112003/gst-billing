
import { query } from '../src/config/database';

async function migrateAgencyId() {
    try {
        console.log('🔄 Starting migration of agecny_id to agency_id...');

        // Check if both columns exist
        const result = await query('SHOW COLUMNS FROM users');
        const columnNames = result.rows.map((c: any) => c.Field);

        if (columnNames.includes('agecny_id') && columnNames.includes('agency_id')) {
            console.log('✅ Both columns exist. Copying values...');

            // Copy values from agecny_id to agency_id where agency_id is NULL
            const updateResult = await query(
                'UPDATE users SET agency_id = agecny_id WHERE agency_id IS NULL AND agecny_id IS NOT NULL'
            );

            console.log(`✅ Migration complete. Updated ${updateResult.rowCount} rows.`);

            // Also copy other way around just in case
            const reverseUpdate = await query(
                'UPDATE users SET agecny_id = agency_id WHERE agecny_id IS NULL AND agency_id IS NOT NULL'
            );
            console.log(`✅ Reverse sync complete. Updated ${reverseUpdate.rowCount} rows.`);
        } else {
            console.log('ℹ️ One or both columns missing. Skipping data copy.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateAgencyId();
