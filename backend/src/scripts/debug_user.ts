
import { query } from '../config/database';
import { connectDatabase, disconnectDatabase } from '../config/database';

async function checkUser() {
    try {
        await connectDatabase();
        // The logs showed the user ID was likely 98 for agency 12
        // "Verifying OTP for User: 98 ... agency 12"
        const result = await query('SELECT * FROM users WHERE id = 98');
        console.log('User 98:', result.rows);

        const agencyResult = await query('SELECT * FROM agencies WHERE id = 12');
        console.log('Agency 12:', agencyResult.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await disconnectDatabase();
    }
}

checkUser();
