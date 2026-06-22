const axios = require('axios');

async function testApi() {
    try {
        // 1. Login to get token
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:8001/api/v1/auth/login', {
            email: 'admin@example.com',
            password: 'admin123'
        });

        const token = loginRes.data.token;
        const agencyId = loginRes.data.user.agencyId;
        console.log('Login successful. Agency ID:', agencyId);

        // 2. Fetch agency data
        console.log(`Fetching agency ${agencyId}...`);
        const agencyRes = await axios.get(`http://localhost:8001/api/v1/agencies/${agencyId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('API RESPONSE:');
        console.log(JSON.stringify(agencyRes.data, null, 2));

    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
    }
}

testApi();
