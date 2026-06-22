import { pool } from '../src/config/database';

async function listIds() {
    try {
        const [agencies] = await pool.query('SELECT id, company_name FROM agencies LIMIT 5');
        console.log('Agencies:', agencies);
        const [users] = await pool.query('SELECT id, name, agency_id FROM users LIMIT 5');
        console.log('Users:', users);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

listIds();
