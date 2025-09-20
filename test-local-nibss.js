#!/usr/bin/env node

/**
 * Local NIBSS Testing Script
 * Tests different approaches to connect to NIBSS API from local development
 */

require('dotenv').config();
const https = require('https');

console.log('🏠 Local NIBSS Integration Testing');
console.log('===================================');

/**
 * Test 1: Direct Connection (Expected to Fail - Not Whitelisted)
 */
async function testDirectConnection() {
  console.log('\n📝 Test 1: Direct Connection (Expected to Fail)');
  console.log('-----------------------------------------------');

  const url = new URL(process.env.NIBSS_BASE_URL);

  const options = {
    hostname: url.hostname,
    path: '/api/v1/banks',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NIBSS_API_KEY}`,
      'X-Client-ID': process.env.NIBSS_CLIENT_ID,
    },
    timeout: 5000
  };

  try {
    const result = await makeRequest(options);
    if (result.success) {
      console.log('✅ Unexpected success - Direct connection worked!');
      return true;
    } else {
      console.log(`❌ Expected failure: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Expected failure: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: SSH Tunnel Connection
 */
async function testSSHTunnel() {
  console.log('\n📝 Test 2: SSH Tunnel Connection');
  console.log('----------------------------------');
  console.log('ℹ️  Prerequisites: SSH tunnel must be running');
  console.log('   Run: ./scripts/nibss-tunnel.sh');
  console.log('');

  const options = {
    hostname: 'localhost',
    port: 8443,
    path: '/api/v1/banks',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NIBSS_API_KEY}`,
      'X-Client-ID': process.env.NIBSS_CLIENT_ID,
    },
    rejectUnauthorized: false, // Allow self-signed certificates
    timeout: 10000
  };

  try {
    const result = await makeRequest(options);
    if (result.success) {
      console.log('✅ SSH tunnel connection successful!');
      console.log(`Response: ${JSON.stringify(result.data, null, 2).substring(0, 200)}...`);
      return true;
    } else {
      if (result.error.includes('ECONNREFUSED')) {
        console.log('❌ Connection refused - SSH tunnel not running');
        console.log('💡 Start tunnel: ./scripts/nibss-tunnel.sh');
      } else {
        console.log(`❌ Failed: ${result.error}`);
      }
      return false;
    }
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Mock Service
 */
async function testMockService() {
  console.log('\n📝 Test 3: Mock NIBSS Service');
  console.log('------------------------------');

  try {
    // Import mock service
    const { NIBSSMockService } = await import('./server/services/nibss-mock.js');
    const mockService = new NIBSSMockService();

    console.log('Testing mock responses:');

    // Test bank list
    const bankList = mockService.mockBankListResponse();
    console.log(`✅ Bank list: ${bankList.data.length} banks available`);

    // Test name enquiry
    const nameEnquiry = mockService.mockNameEnquiryResponse('1234567890', '058');
    console.log(`✅ Name enquiry: ${nameEnquiry.data.accountName}`);

    // Test transfer
    const transfer = mockService.mockTransferResponse();
    console.log(`✅ Transfer: ${transfer.data.transactionId}`);

    return true;
  } catch (error) {
    console.log(`❌ Mock service failed: ${error.message}`);
    console.log('💡 Ensure TypeScript files are compiled');
    return false;
  }
}

/**
 * Test 4: Environment Configuration Check
 */
function testEnvironmentConfig() {
  console.log('\n📝 Test 4: Environment Configuration');
  console.log('------------------------------------');

  const requiredVars = [
    'NIBSS_BASE_URL',
    'NIBSS_API_KEY',
    'NIBSS_CLIENT_ID',
    'NIBSS_CLIENT_SECRET'
  ];

  let allConfigured = true;

  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Configured`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      allConfigured = false;
    }
  });

  // Check optional configuration
  console.log('\nOptional configuration:');
  console.log(`   NIBSS_USE_MOCK: ${process.env.NIBSS_USE_MOCK || 'false'}`);
  console.log(`   NIBSS_PROXY_URL: ${process.env.NIBSS_PROXY_URL || 'Not set'}`);

  return allConfigured;
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

    req.setTimeout(options.timeout || 10000, () => {
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
  console.log('Starting local NIBSS integration tests...\n');

  // Test environment configuration
  const configOk = testEnvironmentConfig();
  if (!configOk) {
    console.log('\n❌ Configuration issues detected. Please check your .env file.');
    return;
  }

  // Test direct connection (expected to fail)
  await testDirectConnection();

  // Test SSH tunnel
  await testSSHTunnel();

  // Test mock service
  await testMockService();

  console.log('\n📊 Summary and Recommendations');
  console.log('===============================');
  console.log(`
🎯 Recommended Local Testing Approach:

1. **For Initial Development (Recommended):**
   - Set NIBSS_USE_MOCK=true in your .env.local
   - Use mock service for rapid development and testing
   - All NIBSS operations will return realistic mock data

2. **For Integration Testing:**
   - Use SSH tunnel: ./scripts/nibss-tunnel.sh
   - Update .env.local: NIBSS_BASE_URL=https://localhost:8443
   - Test with real NIBSS API through your whitelisted GCP server

3. **For Production Deployment:**
   - Deploy to GCP with whitelisted IP (34.59.143.25)
   - Use real NIBSS_BASE_URL=https://apitest.nibss-plc.com.ng

📝 Environment Variables for Local Testing:

# Mock mode (fastest for development)
NIBSS_USE_MOCK=true

# SSH tunnel mode (for real API testing)
NIBSS_BASE_URL=https://localhost:8443
NODE_TLS_REJECT_UNAUTHORIZED=0  # Only for local testing

# Production mode (GCP deployment)
NIBSS_BASE_URL=https://apitest.nibss-plc.com.ng
  `);
}

// Run tests
runTests().catch(console.error);