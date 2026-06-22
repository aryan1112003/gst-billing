const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const API_URL = 'http://localhost:8001/api/v1';

async function testUpload() {
    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@example.com',
            password: 'admin123'
        });

        const { token, user } = loginRes.data;
        console.log('   Login successful. Token obtained.');
        console.log('   User Agency ID:', user.agencyId);

        if (!user.agencyId) {
            throw new Error('User has no Agency ID!');
        }

        // Create a dummy image file
        const filePath = path.join(__dirname, 'test-logo.png');
        // Create a simple 1x1 PNG or just some bytes (renaming it .png is usually enough for multer check if it checks ext, but let's try to be safe)
        // Minimal PNG signature
        const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
        fs.writeFileSync(filePath, pngSignature);
        console.log('2. Dummy file created at:', filePath);

        // Upload
        console.log('3. Uploading file...');
        const form = new FormData();
        form.append('logo', fs.createReadStream(filePath));

        const uploadRes = await axios.post(`${API_URL}/agencies/${user.agencyId}/logo`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('4. Upload Response:', uploadRes.data);

        if (uploadRes.data.success) {
            console.log('SUCCESS: Logo upload verified working on backend.');
        } else {
            console.log('FAILURE: Backend returned success=false');
        }

    } catch (error) {
        console.error('TEST FAILED:', error.response ? error.response.data : error.message);
    }
}

testUpload();
