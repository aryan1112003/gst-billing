import { pool } from '../src/config/database';

async function seedGatePasses() {
    try {
        // Find a user who is associated with an agency
        const [users] = await pool.query('SELECT u.id as user_id, u.agency_id FROM users u WHERE u.agency_id IS NOT NULL LIMIT 1') as any;

        if (!users || users.length === 0) {
            console.error('❌ Error: No users found with a valid agency_id. Cannot seed gate passes.');
            return;
        }

        const { user_id, agency_id } = users[0];
        console.log(`🌱 Seeding demo gate passes for User ID: ${user_id}, Agency ID: ${agency_id}`);

        const gatePasses = [
            {
                gate_pass_number: 'GPI-2401-0001',
                type: 'inward',
                party_name: 'Steel Traders Ltd',
                vehicle_number: 'MH-12-AB-1234',
                driver_name: 'Rajesh Kumar',
                driver_phone: '9876543210',
                purpose: 'Raw material delivery',
                items_description: 'Steel Sheets 10mm',
                quantity: 50,
                unit: 'nos',
                remarks: 'Quality check pending',
                status: 'pending',
                agency_id,
                created_by: user_id
            },
            {
                gate_pass_number: 'GPO-2401-0002',
                type: 'outward',
                party_name: 'Precision Engineering Co',
                vehicle_number: 'MH-14-XY-5678',
                driver_name: 'Suresh Patil',
                driver_phone: '9988776655',
                purpose: 'Repair and maintenance',
                items_description: 'CNC Machine Spindle',
                quantity: 1,
                unit: 'pc',
                remarks: 'Expect back within 3 days',
                status: 'approved',
                agency_id,
                created_by: user_id
            },
            {
                gate_pass_number: 'GPI-2401-0003',
                type: 'inward',
                party_name: 'Industrial Gases Corp',
                vehicle_number: 'MH-15-GH-9012',
                driver_name: 'Suhas Mane',
                driver_phone: '9123456789',
                purpose: 'Refilling',
                items_description: 'Oxygen Cylinders',
                quantity: 10,
                unit: 'slots',
                remarks: '',
                status: 'completed',
                agency_id,
                created_by: user_id
            },
            {
                gate_pass_number: 'GPO-2401-0004',
                type: 'outward',
                party_name: 'Courier Express',
                vehicle_number: 'DL-01-CP-0001',
                driver_name: 'Amit Singh',
                driver_phone: '9000111222',
                purpose: 'Document Dispatch',
                items_description: 'Legal Documents Bundle',
                quantity: 1,
                unit: 'box',
                remarks: 'High priority',
                status: 'pending',
                agency_id,
                created_by: user_id
            }
        ];

        for (const gp of gatePasses) {
            await pool.query(
                `INSERT INTO gate_passes 
                (gate_pass_number, type, party_name, vehicle_number, driver_name, driver_phone, purpose, items_description, quantity, unit, remarks, status, agency_id, created_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    gp.gate_pass_number, gp.type, gp.party_name, gp.vehicle_number,
                    gp.driver_name, gp.driver_phone, gp.purpose, gp.items_description,
                    gp.quantity, gp.unit, gp.remarks, gp.status, gp.agency_id, gp.created_by
                ]
            );
        }

        console.log('✅ Success: Seeded 4 demo gate passes.');
    } catch (err) {
        console.error('❌ Seeding failed:', err);
    } finally {
        process.exit();
    }
}

seedGatePasses();
