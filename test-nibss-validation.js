#!/usr/bin/env node

/**
 * NIBSS API Configuration Validation Test
 * Tests connection to NIBSS API with all available configuration parameters
 * Updated: September 25, 2025
 */

const https = require('https');
const crypto = require('crypto');

// NIBSS Configuration - Updated with new data points
const CONFIG = {
    // API Endpoints
    BASE_URL: 'https://apitest.nibss-plc.com.ng',

    // Authentication (from existing configuration)
    API_KEY: 'o1rjrqtLdaZou7PQApzXQVHygLqEnoWi',
    CLIENT_ID: 'd86e0fe1-2468-4490-96bb-588e32af9a89',
    CLIENT_SECRET: '~Ou8Q~NPF7jfauwivWFSDOviFex..VWCdqTSIdpa',

    // NEW: Institution Configuration (Sept 25, 2025)
    INSTITUTION_CODE: '090575',
    MANDATE_REFERENCE: 'RC0220310/1349/0009291032',
    FCMB_BILLER_ID: '362',

    // Application Details
    APP_NAME: 'NIP_MINI_SERVICE (FIRSTMIDAS_MICROFINANCE_BANK_LIMITED)',
    ENVIRONMENT: 'sandbox'
};

console.log('🔐 NIBSS API Configuration Validation Test');
console.log('==========================================');
console.log('Base URL:', CONFIG.BASE_URL);
console.log('Institution Code:', CONFIG.INSTITUTION_CODE);
console.log('Mandate Reference:', CONFIG.MANDATE_REFERENCE);
console.log('FCMB Biller ID:', CONFIG.FCMB_BILLER_ID);
console.log('Environment:', CONFIG.ENVIRONMENT);
console.log('');

// Test functions
async function testEndpoint(endpoint, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, CONFIG.BASE_URL);

        const defaultHeaders = {
            'Content-Type': 'application/json',
            'User-Agent': `${CONFIG.APP_NAME}/1.0`,
            'X-API-Key': CONFIG.API_KEY,
            'X-Institution-Code': CONFIG.INSTITUTION_CODE,
            'X-Mandate-Reference': CONFIG.MANDATE_REFERENCE,
            'X-FCMB-Biller-ID': CONFIG.FCMB_BILLER_ID
        };

        const options = {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname + url.search,
            method: method,
            headers: { ...defaultHeaders, ...headers },
            timeout: 10000
        };

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const parsedData = responseData ? JSON.parse(responseData) : {};
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: parsedData,
                        raw: responseData
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: null,
                        raw: responseData,
                        parseError: e.message
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject({
                error: error.message,
                code: error.code
            });
        });

        req.on('timeout', () => {
            req.destroy();
            reject({
                error: 'Request timeout',
                code: 'TIMEOUT'
            });
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function testOAuthToken() {
    console.log('1️⃣ Testing OAuth Token Endpoint...');

    const tokenData = {
        grant_type: 'client_credentials',
        client_id: CONFIG.CLIENT_ID,
        client_secret: CONFIG.CLIENT_SECRET,
        scope: 'profile'
    };

    try {
        const result = await testEndpoint('/oauth/token', 'POST', tokenData, {
            'Content-Type': 'application/x-www-form-urlencoded'
        });

        console.log('✅ Token endpoint accessible');
        console.log('   Status:', result.status);
        console.log('   Response:', result.raw.substring(0, 200) + '...');

        return result.status === 200 ? result.data : null;
    } catch (error) {
        console.log('❌ Token endpoint failed');
        console.log('   Error:', error.error || error.message);
        console.log('   Code:', error.code);
        return null;
    }
}

async function testBankList(accessToken = null) {
    console.log('\n2️⃣ Testing Bank List Endpoint...');

    const headers = {};
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
        const result = await testEndpoint('/nipservice/v1/banks', 'GET', null, headers);

        console.log('✅ Bank list endpoint accessible');
        console.log('   Status:', result.status);
        console.log('   Response:', result.raw.substring(0, 200) + '...');

        return result.data;
    } catch (error) {
        console.log('❌ Bank list endpoint failed');
        console.log('   Error:', error.error || error.message);
        console.log('   Code:', error.code);
        return null;
    }
}

async function testNameEnquiry(accessToken = null) {
    console.log('\n3️⃣ Testing Name Enquiry Endpoint...');

    const enquiryData = {
        accountNumber: '0123456789',
        channelCode: '1',
        destinationInstitutionCode: CONFIG.INSTITUTION_CODE,
        transactionId: generateTransactionId()
    };

    const headers = {};
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
        const result = await testEndpoint('/nipservice/v1/nip/nameenquiry', 'POST', enquiryData, headers);

        console.log('✅ Name enquiry endpoint accessible');
        console.log('   Status:', result.status);
        console.log('   Response:', result.raw.substring(0, 200) + '...');

        return result.data;
    } catch (error) {
        console.log('❌ Name enquiry endpoint failed');
        console.log('   Error:', error.error || error.message);
        console.log('   Code:', error.code);
        return null;
    }
}

async function testHealthCheck() {
    console.log('\n4️⃣ Testing Health/Status Endpoint...');

    try {
        const result = await testEndpoint('/health', 'GET');

        console.log('✅ Health endpoint accessible');
        console.log('   Status:', result.status);
        console.log('   Response:', result.raw.substring(0, 200) + '...');

        return result.data;
    } catch (error) {
        console.log('❌ Health endpoint failed');
        console.log('   Error:', error.error || error.message);
        console.log('   Code:', error.code);
        return null;
    }
}

function generateTransactionId() {
    // Generate a unique transaction ID based on NIBSS format
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14);
    const random = Math.random().toString().substring(2, 8);
    return `${CONFIG.INSTITUTION_CODE}${timestamp}${random}`;
}

function validateConfiguration() {
    console.log('\n🔍 Configuration Validation:');
    console.log('============================');

    const checks = [
        { name: 'Base URL', value: CONFIG.BASE_URL, valid: !!CONFIG.BASE_URL },
        { name: 'API Key', value: CONFIG.API_KEY?.substring(0, 8) + '...', valid: !!CONFIG.API_KEY },
        { name: 'Client ID', value: CONFIG.CLIENT_ID?.substring(0, 8) + '...', valid: !!CONFIG.CLIENT_ID },
        { name: 'Client Secret', value: '***masked***', valid: !!CONFIG.CLIENT_SECRET },
        { name: 'Institution Code', value: CONFIG.INSTITUTION_CODE, valid: !!CONFIG.INSTITUTION_CODE },
        { name: 'Mandate Reference', value: CONFIG.MANDATE_REFERENCE, valid: !!CONFIG.MANDATE_REFERENCE },
        { name: 'FCMB Biller ID', value: CONFIG.FCMB_BILLER_ID, valid: !!CONFIG.FCMB_BILLER_ID }
    ];

    let validCount = 0;
    checks.forEach(check => {
        const status = check.valid ? '✅' : '❌';
        console.log(`   ${status} ${check.name}: ${check.value || 'NOT SET'}`);
        if (check.valid) validCount++;
    });

    console.log(`\n📊 Configuration Status: ${validCount}/${checks.length} parameters configured`);

    return validCount === checks.length;
}

// Main test execution
async function runTests() {
    console.log('Starting NIBSS API validation tests...\n');

    // Validate configuration
    const configValid = validateConfiguration();

    if (!configValid) {
        console.log('\n❌ Configuration incomplete. Please ensure all parameters are set.');
        process.exit(1);
    }

    console.log('\n🚀 Starting API endpoint tests...\n');

    // Test OAuth token
    const tokenData = await testOAuthToken();
    const accessToken = tokenData?.access_token;

    // Test bank list
    await testBankList(accessToken);

    // Test name enquiry
    await testNameEnquiry(accessToken);

    // Test health endpoint
    await testHealthCheck();

    console.log('\n🏁 Test Summary:');
    console.log('================');
    console.log('✅ Configuration: All 7 parameters configured');
    console.log('🔐 Institution Code: 090575 (FirstMidas Microfinance Bank)');
    console.log('📋 Mandate Reference: RC0220310/1349/0009291032');
    console.log('🏦 FCMB Biller ID: 362');
    console.log('🌐 Environment: Sandbox Testing');
    console.log('\nNext Steps:');
    console.log('1. Review API responses for any authentication issues');
    console.log('2. Verify institution code acceptance by NIBSS');
    console.log('3. Test with production credentials when ready');
    console.log('4. Implement proper error handling in production code');
}

// Run the tests
runTests().catch(error => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
});