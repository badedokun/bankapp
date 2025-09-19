#!/usr/bin/env node

/**
 * Login Test Script
 * Tests both demo and admin credentials against the cloud API
 */

const https = require('https');

const testCredentials = [
  {
    name: 'Demo User',
    email: 'demo@fmfb.com',
    password: 'AI-powered-fmfb-1app'
  },
  {
    name: 'Admin User', 
    email: 'admin@fmfb.com',
    password: 'Admin@123!'
  }
];

function makeRequest(credentials) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: credentials.email,
      password: credentials.password
    });

    const options = {
      hostname: 'fmfb-34-59-143-25.nip.io',
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsed
          });
        } catch (e) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function testLogin() {
  console.log('🧪 Testing Login Credentials on Cloud Application\n');
  console.log('🌐 Target: https://fmfb-34-59-143-25.nip.io/api/auth/login\n');
  
  for (const creds of testCredentials) {
    console.log(`Testing ${creds.name} (${creds.email})...`);
    
    try {
      const response = await makeRequest(creds);
      
      if (response.status === 200 && response.data.success) {
        console.log(`✅ ${creds.name}: Login successful`);
        console.log(`   Role: ${response.data.data.user.role}`);
        console.log(`   Status: ${response.data.data.user.status}`);
        console.log(`   Tenant: ${response.data.data.user.tenant.displayName}`);
      } else {
        console.log(`❌ ${creds.name}: Login failed`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Error: ${response.data.error || response.data.message}`);
      }
    } catch (error) {
      console.log(`❌ ${creds.name}: Request failed`);
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🎯 Test complete! Both credentials should work on the live application.');
  console.log('🌐 Try logging in at: https://fmfb-34-59-143-25.nip.io');
}

testLogin().catch(console.error);