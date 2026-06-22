
import { query } from '../config/database';
import { connectDatabase, disconnectDatabase } from '../config/database';

async function fixUserRole() {
    try {
        await connectDatabase();
        // Update user 98 to have roleId 2 ('agency') instead of 1 ('admin')
        await query('UPDATE users SET role = "agency", roleId = 2 WHERE id = 98');
        console.log('Fixed user 98 role to agency/2');
    } catch (e) {
        console.error(e);
    } finally {
        await disconnectDatabase();
    }
}

fixUserRole();
