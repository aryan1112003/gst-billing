import axios from 'axios';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

const BASE_URL = `http://localhost:${process.env.PORT || 8001}/api/v1/auth`;

async function testRegistrationAndLogin() {
    console.log('--- Testing Registration and Login ---');
    const testUser = {
        username: `testuser_${Date.now()}`,
        email: `testuser_${Date.now()}@example.com`,
        password: 'Password123!',
        role: 'admin' // Trying to create an admin
    };

    console.log('1. Registering user:', testUser.email);
    try {
        const regRes = await axios.post(`${BASE_URL}/register`, testUser);
        console.log('✅ Registration success:', regRes.data.success);
    } catch (error: any) {
        console.error('❌ Registration failed:', error.response?.data || error.message);
        return;
    }

    // Check DB state immediately
    console.log('2. Checking DB state...');
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mawebtec_lms',
    };

    let userId;
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows]: any = await connection.execute(
            'SELECT id, email, role, roleId, is_active FROM users WHERE email = ?',
            [testUser.email]
        );
        console.log('DB Record:', JSON.stringify(rows[0], null, 2));
        userId = rows[0]?.id;
        await connection.end();
    } catch (error) {
        console.error('❌ DB Check failed:', error);
    }

    console.log('3. Attempting Login...');
    try {
        const loginRes = await axios.post(`${BASE_URL}/login`, {
            email: testUser.email,
            password: testUser.password
        });
        console.log('✅ Login success!');
        console.log('Token received:', !!loginRes.data.token);
        console.log('User Role in response:', loginRes.data.user.role);
    } catch (error: any) {
        console.error('❌ Login failed:', error.response?.status, error.response?.data);
    }
}

testRegistrationAndLogin();
