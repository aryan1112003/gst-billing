const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const API_URL = 'http://localhost:8001/api/v1';

async function testCompleteFlow() {
    console.log('=== TESTING LOGO UPLOAD COMPLETE FLOW ===\n');

    try {
        // Step 1: Login
        console.log('Step 1: Logging in as admin@example.com...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@example.com',
            password: 'admin123'
        });

        if (!loginRes.data || !loginRes.data.token) {
            throw new Error('Login failed - no token received');
        }

        const { token, user } = loginRes.data;
        console.log('✓ Login successful');
        console.log(`  User ID: ${user.id}`);
        console.log(`  User Email: ${user.email}`);
        console.log(`  User Agency ID: ${user.agencyId}`);
        console.log('');

        if (!user.agencyId) {
            throw new Error('CRITICAL: User has no agencyId! This is the core problem.');
        }

        // Step 2: Create a test image file
        console.log('Step 2: Creating test image file...');
        const testImagePath = path.join(__dirname, 'test-upload-logo.png');
        // Create a minimal valid PNG file
        const pngSignature = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 image
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
            0x54, 0x08, 0xD7, 0x63, 0x60, 0x00, 0x00, 0x00,
            0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33, 0x00,
            0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
            0x42, 0x60, 0x82
        ]);
        fs.writeFileSync(testImagePath, pngSignature);
        console.log(`✓ Test image created at: ${testImagePath}`);
        console.log('');

        // Step 3: Upload the logo
        console.log('Step 3: Uploading logo...');
        const form = new FormData();
        form.append('logo', fs.createReadStream(testImagePath));

        const uploadUrl = `${API_URL}/agencies/${user.agencyId}/logo`;
        console.log(`  Upload URL: ${uploadUrl}`);

        const uploadRes = await axios.post(uploadUrl, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        console.log('✓ Upload successful!');
        console.log('  Response:', JSON.stringify(uploadRes.data, null, 2));
        console.log('');

        // Step 4: Verify the file exists
        if (uploadRes.data.success && uploadRes.data.data.logoUrl) {
            const logoUrl = uploadRes.data.data.logoUrl;
            const logoPath = path.join(process.cwd(), logoUrl.replace(/^\//, ''));

            console.log('Step 4: Verifying file exists on server...');
            console.log(`  Expected path: ${logoPath}`);

            if (fs.existsSync(logoPath)) {
                console.log('✓ Logo file exists on server!');
                const stats = fs.statSync(logoPath);
                console.log(`  File size: ${stats.size} bytes`);
            } else {
                console.log('✗ Logo file NOT found on server!');
            }
            console.log('');

            // Step 5: Test accessing the logo via HTTP
            console.log('Step 5: Testing logo access via HTTP...');
            try {
                const logoHttpUrl = `http://localhost:8001${logoUrl}`;
                console.log(`  Logo HTTP URL: ${logoHttpUrl}`);
                const logoRes = await axios.get(logoHttpUrl, {
                    responseType: 'arraybuffer'
                });
                console.log(`✓ Logo accessible via HTTP (${logoRes.status})`);
                console.log(`  Content type: ${logoRes.headers['content-type']}`);
                console.log(`  Content length: ${logoRes.data.length} bytes`);
            } catch (err) {
                console.log('✗ Logo NOT accessible via HTTP');
                console.log(`  Error: ${err.message}`);
            }
        }

        console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
        console.log('If you see this message, the backend upload is working!');
        console.log('If upload still fails in frontend, the issue is in the React Native Web code.');

    } catch (error) {
        console.error('\n=== TEST FAILED ===');
        if (error.response) {
            console.error('API Error Response:');
            console.error('  Status:', error.response.status);
            console.error('  Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
        process.exit(1);
    }
}

testCompleteFlow();
