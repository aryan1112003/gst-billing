
import { query } from '../config/database';
import { connectDatabase, disconnectDatabase } from '../config/database';

const emailsToDelete = [
    'rajasaabsir007@gmail.com',
    'aryanacharya12003@gmail.com',
    'aaryanacharya12003@gmail.com'
];

async function cleanupUsers() {
    try {
        await connectDatabase();

        console.log(`Searching for users: ${emailsToDelete.join(', ')}`);

        // Find users first
        const usersResult = await query(
            `SELECT id, email, agency_id, agecny_id FROM users WHERE email IN (?, ?, ?)`,
            emailsToDelete
        );

        const users = usersResult.rows;

        if (users.length === 0) {
            console.log('No users found with these emails.');
            return;
        }

        console.log(`Found ${users.length} users to delete.`);

        for (const user of users) {
            const agencyId = user.agency_id || user.agecny_id;
            console.log(`Deleting User: ${user.email} (ID: ${user.id}), Agency ID: ${agencyId}`);

            // 1. Delete Subscriptions for this agency
            if (agencyId) {
                await query('DELETE FROM subscriptions WHERE agency_id = ?', [agencyId]);
                console.log(`- Deleted subscriptions for agency ${agencyId}`);

                // 2. Delete Agency
                // We might need to update the user's agency_id to NULL first if there's a strict FK, 
                // but usually we can just delete if ON DELETE CASCADE isn't set blocking it.
                // To be safe against "fail on FK":
                await query('UPDATE users SET agency_id = NULL, agecny_id = NULL WHERE id = ?', [user.id]);

                await query('DELETE FROM agencies WHERE id = ?', [agencyId]);
                console.log(`- Deleted agency ${agencyId}`);
            }

            // 3. Delete User
            await query('DELETE FROM users WHERE id = ?', [user.id]);
            console.log(`- Deleted user ${user.id}`);
        }

        console.log('Cleanup complete.');

    } catch (e) {
        console.error('Error during cleanup:', e);
    } finally {
        await disconnectDatabase();
    }
}

cleanupUsers();
