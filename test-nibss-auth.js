#!/usr/bin/env node

/**
 * Comprehensive NIBSS API Authentication Test
 * Tests various authentication methods and endpoints
 */

require('dotenv').config();
const https = require('https');
const crypto = require('crypto');

console.log('🏦 NIBSS API Authentication Test Suite\n');
console.log('========================================');
console.log('Configuration:');
console.log(`Base URL: ${process.env.NIBSS_BASE_URL}`);
console.log(`Client ID: ${process.env.NIBSS_CLIENT_ID}`);
console.log(`API Key: ${process.env.NIBSS_API_KEY ? '✅ Present' : '❌ Missing'}`);
console.log(`Client Secret: ${process.env.NIBSS_CLIENT_SECRET ? '✅ Present' : '❌ Missing'}`);
console.log('========================================\n');

/**
 * Test 1: OAuth2 Client Credentials Flow
 */
async function testOAuth2() {
  console.log('📝 Test 1: OAuth2 Client Credentials Flow');
  console.log('------------------------------------------');

  const authString = Buffer.from(
    `${process.env.NIBSS_CLIENT_ID}:${process.env.NIBSS_CLIENT_SECRET}`
  ).toString('base64');

  const tokenEndpoints = [
    '/v2/auth/token',
    '/oauth/token',
    '/token',
    '/api/v1/auth/token'
  ];

  for (const endpoint of tokenEndpoints) {
    console.log(`\nTrying endpoint: ${endpoint}`);

    const url = new URL(process.env.NIBSS_BASE_URL);

    const options = {
      hostname: url.hostname,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authString}`,
      },
    };

    const result = await makeRequest(options, 'grant_type=client_credentials');

    if (result.success) {
      console.log('✅ OAuth2 token obtained successfully!');
      console.log(`Token: ${JSON.stringify(result.data, null, 2).substring(0, 200)}...`);
      return result.data.access_token || result.data.token;
    } else {
      console.log(`❌ Failed: ${result.error}`);
    }
  }

  return null;
}

/**
 * Test 2: Direct API Key Authentication
 */
async function testAPIKeyAuth() {
  console.log('\n📝 Test 2: Direct API Key Authentication');
  console.log('------------------------------------------');

  const endpoints = [
    '/api/v1/banks',
    '/api/banks',
    '/banks',
    '/api/v1/bank/list'
  ];

  for (const endpoint of endpoints) {
    console.log(`\nTrying endpoint: ${endpoint}`);

    const url = new URL(process.env.NIBSS_BASE_URL);

    const options = {
      hostname: url.hostname,
      path: endpoint,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NIBSS_API_KEY}`,
        'X-Client-ID': process.env.NIBSS_CLIENT_ID,
        'X-API-Key': process.env.NIBSS_API_KEY,
      },
    };

    const result = await makeRequest(options);

    if (result.success) {
      console.log('✅ API Key authentication successful!');
      console.log(`Response: ${JSON.stringify(result.data, null, 2).substring(0, 200)}...`);
      return true;
    } else {
      console.log(`❌ Failed: ${result.error}`);
    }
  }

  return false;
}

/**
 * Test 3: HMAC256 Signature Authentication
 */
async function testHMACAuth() {
  console.log('\n📝 Test 3: HMAC256 Signature Authentication');
  console.log('---------------------------------------------');

  const endpoints = [
    '/api/v1/banks',
    '/api/banks',
    '/banks'
  ];

  for (const endpoint of endpoints) {
    console.log(`\nTrying endpoint: ${endpoint}`);

    // Generate nonce
    const nonce = crypto.randomBytes(16).toString('hex') + Date.now();

    // Create HMAC signature
    const hmac = crypto.createHmac('sha256', process.env.NIBSS_CLIENT_SECRET);
    hmac.update(nonce);
    const signature = hmac.digest('base64');

    const url = new URL(process.env.NIBSS_BASE_URL);

    const options = {
      hostname: url.hostname,
      path: endpoint,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ClientId': process.env.NIBSS_CLIENT_ID,
        'X-Client-ID': process.env.NIBSS_CLIENT_ID,
        'Nonce': nonce,
        'X-Nonce': nonce,
        'Signature': signature,
        'X-Signature': signature,
        'X-API-Key': process.env.NIBSS_API_KEY,
      },
    };

    const result = await makeRequest(options);

    if (result.success) {
      console.log('✅ HMAC authentication successful!');
      console.log(`Response: ${JSON.stringify(result.data, null, 2).substring(0, 200)}...`);
      return true;
    } else {
      console.log(`❌ Failed: ${result.error}`);
    }
  }

  return false;
}

/**
 * Test 4: Combined Authentication
 */
async function testCombinedAuth(token) {
  console.log('\n📝 Test 4: Combined Authentication (Token + Headers)');
  console.log('-----------------------------------------------------');

  const nonce = crypto.randomBytes(16).toString('hex') + Date.now();
  const hmac = crypto.createHmac('sha256', process.env.NIBSS_CLIENT_SECRET);
  hmac.update(nonce);
  const signature = hmac.digest('base64');

  const endpoints = [
    '/api/v1/banks',
    '/api/banks',
    '/nip/banks',
    '/api/v1/nip/banks'
  ];

  for (const endpoint of endpoints) {
    console.log(`\nTrying endpoint: ${endpoint}`);

    const url = new URL(process.env.NIBSS_BASE_URL);

    const options = {
      hostname: url.hostname,
      path: endpoint,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : `Bearer ${process.env.NIBSS_API_KEY}`,
        'X-Client-ID': process.env.NIBSS_CLIENT_ID,
        'X-API-Key': process.env.NIBSS_API_KEY,
        'X-Nonce': nonce,
        'X-Signature': signature,
      },
    };

    const result = await makeRequest(options);

    if (result.success) {
      console.log('✅ Combined authentication successful!');
      console.log(`Response: ${JSON.stringify(result.data, null, 2).substring(0, 200)}...`);
      return true;
    } else {
      console.log(`❌ Failed: ${result.error}`);
    }
  }

  return false;
}

/**
 * Helper function to make HTTPS requests
 */
function makeRequest(options, body) {
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            resolve({ success: true, data: JSON.parse(data) });
          } catch {
            resolve({ success: true, data: data });
          }
        } else {
          resolve({
            success: false,
            error: `Status ${res.statusCode}: ${data.substring(0, 100)}`
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ success: false, error: 'Request timeout' });
    });

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('Starting authentication tests...\n');

  // Test 1: OAuth2
  const token = await testOAuth2();

  // Test 2: API Key
  await testAPIKeyAuth();

  // Test 3: HMAC
  await testHMACAuth();

  // Test 4: Combined
  await testCombinedAuth(token);

  console.log('\n========================================');
  console.log('📊 Test Summary');
  console.log('========================================');
  console.log(`
Based on the test results above, determine which authentication
method works with your NIBSS credentials. Once identified, update
the NIBSS service implementation accordingly.

Common NIBSS authentication patterns:
1. OAuth2 with client credentials
2. API Key with Bearer token
3. HMAC256 signature authentication
4. Combined approach with multiple headers

Next steps:
1. Identify which authentication method succeeded
2. Update server/services/nibss.ts with the correct auth flow
3. Contact NIBSS support for API documentation if all tests fail
  `);
}

// Run tests
runTests().catch(console.error);