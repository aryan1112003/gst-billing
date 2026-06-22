
import { query } from '../src/config/database';

async function checkUser85() {
    try {
        const result = await query('SELECT id, email, name, agecny_id, agency_id FROM users WHERE id = 85');
        console.log('User 85:', JSON.stringify(result.rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUser85();
