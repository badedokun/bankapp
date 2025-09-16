#!/usr/bin/env node

/**
 * Test NIBSS API Connection
 * Verifies that NIBSS credentials are properly configured
 */

require('dotenv').config();
const https = require('https');

console.log('🏦 Testing NIBSS API Connection...\n');

// Display configuration (masked for security)
console.log('📋 Configuration:');
console.log('   Base URL:', process.env.NIBSS_BASE_URL);
console.log('   Environment:', process.env.NIBSS_ENVIRONMENT);
console.log('   App Name:', process.env.NIBSS_APP_NAME);
console.log('   Client ID:', process.env.NIBSS_CLIENT_ID);
console.log('   API Key:', process.env.NIBSS_API_KEY ? '✅ Configured' : '❌ Missing');
console.log('   Client Secret:', process.env.NIBSS_CLIENT_SECRET ? '✅ Configured' : '❌ Missing');
console.log('   Reset URL:', process.env.NIBSS_RESET_URL);
console.log('');

// Test 1: Basic connectivity to NIBSS API
console.log('🔄 Test 1: Testing basic connectivity to NIBSS API...');

const url = new URL(process.env.NIBSS_BASE_URL);
const options = {
  hostname: url.hostname,
  path: '/health', // Assuming there's a health endpoint
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.NIBSS_API_KEY}`,
    'X-Client-ID': process.env.NIBSS_CLIENT_ID,
    'X-Client-Secret': process.env.NIBSS_CLIENT_SECRET,
  },
  timeout: 10000
};

const req = https.request(options, (res) => {
  console.log(`   Status Code: ${res.statusCode}`);
  console.log(`   Status Message: ${res.statusMessage}`);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('   ✅ Successfully connected to NIBSS API');
    } else if (res.statusCode === 401) {
      console.log('   ⚠️  Authentication failed - please verify credentials');
    } else if (res.statusCode === 404) {
      console.log('   ℹ️  Health endpoint not found (this may be normal)');
      console.log('   ✅ NIBSS API is reachable');
    } else {
      console.log(`   ⚠️  Unexpected response: ${res.statusCode}`);
    }

    if (data) {
      try {
        const jsonData = JSON.parse(data);
        console.log('   Response:', JSON.stringify(jsonData, null, 2).substring(0, 200));
      } catch (e) {
        console.log('   Response (text):', data.substring(0, 200));
      }
    }

    testBankList();
  });
});

req.on('error', (error) => {
  console.error('   ❌ Connection failed:', error.message);
  if (error.code === 'ENOTFOUND') {
    console.log('   💡 Check if the URL is correct and you have internet connectivity');
  } else if (error.code === 'ETIMEDOUT') {
    console.log('   💡 Connection timed out - check network or firewall settings');
  }
  process.exit(1);
});

req.on('timeout', () => {
  console.error('   ❌ Request timed out');
  req.destroy();
  process.exit(1);
});

req.end();

// Test 2: Get Bank List (common NIBSS endpoint)
function testBankList() {
  console.log('\n🔄 Test 2: Fetching bank list from NIBSS...');

  const url = new URL(`${process.env.NIBSS_BASE_URL}/banks`);
  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NIBSS_API_KEY}`,
      'X-Client-ID': process.env.NIBSS_CLIENT_ID,
      'X-Client-Secret': process.env.NIBSS_CLIENT_SECRET,
    },
    timeout: 10000
  };

  const req = https.request(options, (res) => {
    console.log(`   Status Code: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('   ✅ Successfully fetched bank list');
        try {
          const banks = JSON.parse(data);
          if (Array.isArray(banks) || (banks.data && Array.isArray(banks.data))) {
            const bankList = Array.isArray(banks) ? banks : banks.data;
            console.log(`   📊 Found ${bankList.length} banks`);
            if (bankList.length > 0) {
              console.log('   Sample banks:');
              bankList.slice(0, 3).forEach(bank => {
                console.log(`      - ${bank.name || bank.bankName} (${bank.code || bank.bankCode})`);
              });
            }
          }
        } catch (e) {
          console.log('   ⚠️  Could not parse bank list response');
        }
      } else {
        console.log(`   ⚠️  Could not fetch bank list: ${res.statusCode}`);
      }

      console.log('\n📋 Summary:');
      console.log('===========');
      if (res.statusCode === 200 || res.statusCode === 401) {
        console.log('✅ NIBSS API is configured and reachable');
        if (res.statusCode === 401) {
          console.log('⚠️  Authentication credentials need verification');
          console.log('💡 Please verify with NIBSS that:');
          console.log('   1. Your IP address (34.59.143.25) is whitelisted');
          console.log('   2. The credentials are correct and active');
          console.log('   3. You have the necessary permissions');
        }
      } else {
        console.log('ℹ️  NIBSS API is reachable but returned unexpected status');
      }
    });
  });

  req.on('error', (error) => {
    console.error('   ❌ Request failed:', error.message);
  });

  req.end();
}