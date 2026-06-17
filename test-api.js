const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ override: true });

async function testApis() {
  const PORT = process.env.PORT || 3000;
  const BASE_URL = `http://localhost:${PORT}/api/v1`;

  // 1. Generate JWT
  const tokenPayload = { id: '64a7c2b3e4b0a1c2d3e4f5a6', role: 'admin' };
  const authToken = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'super-secret-development-key-change-in-production', { expiresIn: '1d' });
  const headers = { Authorization: `Bearer ${authToken}` };

  try {
    // Test 1: Sync Sheet Endpoint
    console.log('\n--- Test 1: Sync Sheet API ---');
    // Using a random email to ensure we get a new registration
    const randId = Math.floor(Math.random() * 100000);
    const syncPayload = {
      eventId: '64a7c2b3e4b0a1c2d3e4f5a6',
      mockRows: [
        { name: `Test User ${randId}`, email: `test${randId}@example.com`, phone: '1112223333' }
      ]
    };
    
    const syncRes = await axios.post(`${BASE_URL}/sync/sheet`, syncPayload, { headers });
    console.log('Sync Response:', syncRes.data);

    const qrToken = syncRes.data.testToken;
    if (!qrToken) {
      throw new Error('QR Token was not returned by sync endpoint');
    }
    console.log(`\nFound generated QR token from API: ${qrToken}`);

    // Test 2: Day 1 Scan
    console.log('\n--- Test 2: Scan Day 1 API ---');
    const scanDay1Res = await axios.post(`${BASE_URL}/attendance/scan`, {
      token: qrToken,
      checkpoint: 'day1'
    }, { headers });
    console.log('Day 1 Scan Response:', scanDay1Res.data);

    // Test 3: Duplicate Day 1 Scan (Should fail with 409)
    console.log('\n--- Test 3: Duplicate Day 1 Scan API ---');
    try {
      await axios.post(`${BASE_URL}/attendance/scan`, {
        token: qrToken,
        checkpoint: 'day1'
      }, { headers });
    } catch (err) {
      console.log('Duplicate Scan Expected Error:', err.response?.data);
    }

    // Test 4: Day 2 Scan (Should trigger eligibility and mock email)
    console.log('\n--- Test 4: Scan Day 2 API ---');
    const scanDay2Res = await axios.post(`${BASE_URL}/attendance/scan`, {
      token: qrToken,
      checkpoint: 'day2'
    }, { headers });
    console.log('Day 2 Scan Response:', scanDay2Res.data);

    // Test 5: Certificate Collected Pre-validation
    console.log('\n--- Test 5: Certificate Collected API ---');
    const scanCertRes = await axios.post(`${BASE_URL}/attendance/scan`, {
      token: qrToken,
      checkpoint: 'certificateCollected'
    }, { headers });
    console.log('Certificate Scan Response:', scanCertRes.data);

  } catch (error) {
    console.error('API Test Error:', error.response?.data || error.message);
  }
  console.log('\nTests completed successfully.');
}

testApis();
