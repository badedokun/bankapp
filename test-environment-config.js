#!/usr/bin/env node

/**
 * Test Environment Configuration System
 * Verifies that environment detection and URL building works correctly
 */

const path = require('path');

// Test the Node.js environment configuration
const testEnvironment = require('./src/config/testEnvironment.js');

console.log('🧪 Testing Environment Configuration System');
console.log('='.repeat(60));

// Test 1: Local Development Environment
console.log('\n1️⃣  Testing Local Development Configuration');
console.log('-'.repeat(50));

// Clear environment variables to simulate local development
delete process.env.REACT_APP_ENV;
delete process.env.REACT_APP_API_URL;
delete process.env.CLOUD_PROVIDER;
delete process.env.GOOGLE_CLOUD_PROJECT;

// Re-require to get fresh configuration
delete require.cache[require.resolve('./src/config/testEnvironment.js')];
const localConfig = require('./src/config/testEnvironment.js');

console.log('📊 Local Configuration:');
console.log(`   API_BASE_URL: ${localConfig.API_BASE_URL}`);
console.log(`   WEB_BASE_URL: ${localConfig.WEB_BASE_URL}`);
console.log(`   API_URL: ${localConfig.API_URL}`);

// Test URL building
const localApiUrl = localConfig.buildApiUrl('/api/auth/login');
const localWebUrl = localConfig.buildWebUrl('/dashboard');

console.log('\n🔗 Local URL Building:');
console.log(`   buildApiUrl('/api/auth/login'): ${localApiUrl}`);
console.log(`   buildWebUrl('/dashboard'): ${localWebUrl}`);

// Test 2: Cloud Environment
console.log('\n2️⃣  Testing Cloud Environment Configuration');
console.log('-'.repeat(50));

// Set cloud environment variables
process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
process.env.REACT_APP_API_URL = '';
process.env.NODE_ENV = 'production';

// Re-require to get fresh configuration
delete require.cache[require.resolve('./src/config/testEnvironment.js')];
const cloudConfig = require('./src/config/testEnvironment.js');

console.log('☁️  Cloud Configuration:');
console.log(`   API_BASE_URL: ${cloudConfig.API_BASE_URL || '(empty - relative URLs)'}`);
console.log(`   WEB_BASE_URL: ${cloudConfig.WEB_BASE_URL || '(empty - relative URLs)'}`);
console.log(`   API_URL: ${cloudConfig.API_URL || '(empty - relative URLs)'}`);

// Test URL building
const cloudApiUrl = cloudConfig.buildApiUrl('/api/auth/login');
const cloudWebUrl = cloudConfig.buildWebUrl('/dashboard');

console.log('\n🔗 Cloud URL Building:');
console.log(`   buildApiUrl('/api/auth/login'): ${cloudApiUrl}`);
console.log(`   buildWebUrl('/dashboard'): ${cloudWebUrl}`);

// Test 3: Custom Environment
console.log('\n3️⃣  Testing Custom Environment Configuration');
console.log('-'.repeat(50));

// Clear cloud environment variables and set custom environment variables
delete process.env.GOOGLE_CLOUD_PROJECT;
delete process.env.CLOUD_PROVIDER;
process.env.NODE_ENV = 'development';
process.env.REACT_APP_API_URL = 'https://api.example.com';
process.env.REACT_APP_WEB_URL = 'https://web.example.com';

// Re-require to get fresh configuration
delete require.cache[require.resolve('./src/config/testEnvironment.js')];
const customConfig = require('./src/config/testEnvironment.js');

console.log('⚙️  Custom Configuration:');
console.log(`   API_BASE_URL: ${customConfig.API_BASE_URL}`);
console.log(`   WEB_BASE_URL: ${customConfig.WEB_BASE_URL}`);
console.log(`   API_URL: ${customConfig.API_URL}`);

// Test URL building
const customApiUrl = customConfig.buildApiUrl('/api/auth/login');
const customWebUrl = customConfig.buildWebUrl('/dashboard');

console.log('\n🔗 Custom URL Building:');
console.log(`   buildApiUrl('/api/auth/login'): ${customApiUrl}`);
console.log(`   buildWebUrl('/dashboard'): ${customWebUrl}`);

// Validation Tests
console.log('\n4️⃣  Validation Tests');
console.log('-'.repeat(50));

const tests = [
  {
    name: 'Local URLs contain localhost',
    test: () => localConfig.API_BASE_URL.includes('localhost'),
    expected: true
  },
  {
    name: 'Cloud URLs are relative (empty)',
    test: () => cloudConfig.API_BASE_URL === '',
    expected: true
  },
  {
    name: 'Custom URLs match environment variables',
    test: () => customConfig.API_BASE_URL === 'https://api.example.com',
    expected: true
  },
  {
    name: 'buildApiUrl handles relative URLs correctly',
    test: () => cloudApiUrl === '/api/auth/login',
    expected: true
  },
  {
    name: 'buildApiUrl handles absolute URLs correctly',
    test: () => customApiUrl === 'https://api.example.com/api/auth/login',
    expected: true
  }
];

let passedTests = 0;
tests.forEach((test, index) => {
  const result = test.test();
  const status = result === test.expected ? '✅' : '❌';
  console.log(`   ${status} Test ${index + 1}: ${test.name}`);
  if (result === test.expected) passedTests++;
});

console.log('\n📊 Test Results');
console.log('-'.repeat(50));
console.log(`   Passed: ${passedTests}/${tests.length}`);
console.log(`   Success Rate: ${Math.round((passedTests / tests.length) * 100)}%`);

if (passedTests === tests.length) {
  console.log('\n🎉 All environment configuration tests passed!');
  console.log('✅ The centralized environment system is working correctly.');
  console.log('🚀 You can now deploy to cloud environments without hardcoded URLs.');
} else {
  console.log('\n⚠️  Some tests failed. Please check the configuration.');
  process.exit(1);
}

console.log('\n' + '='.repeat(60));
console.log('🏁 Environment Configuration Test Complete');