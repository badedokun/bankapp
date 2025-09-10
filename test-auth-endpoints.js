/**
 * Test Phase 1 Endpoints with Authentication
 * Uses demo authentication to test PCI DSS, CBN, and SIEM endpoints
 */

const jwt = require('jsonwebtoken');

// Create a properly signed JWT token using the server's secret
function createDemoToken() {
  const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  
  const payload = {
    userId: 'demo-user-123',
    email: 'demo@fmfb.com',
    tenantId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    tenantName: 'fmfb',
    role: 'admin'
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1h',
    issuer: 'orokiipay-api',
    audience: 'orokiipay-client'
  });
}

function base64UrlEncode(str) {
  const base64 = Buffer.from(str).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function testEndpoint(url, token, description) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Tenant-ID': 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
      }
    });

    const data = await response.json();
    
    console.log(`\n✅ ${description}`);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.log(`\n❌ ${description}`);
    console.error(`Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing Phase 1 Endpoints with Authentication\n');
  
  const token = createDemoToken();
  console.log(`Generated demo token: ${token.substring(0, 50)}...`);
  
  const baseUrl = 'http://localhost:3001/api';
  
  // Test each Phase 1 endpoint
  const tests = [
    {
      url: `${baseUrl}/pci-dss-compliance/status`,
      description: 'PCI DSS Compliance Status'
    },
    {
      url: `${baseUrl}/pci-dss-compliance/dashboard`,
      description: 'PCI DSS Compliance Dashboard'
    },
    {
      url: `${baseUrl}/cbn-compliance/status`,
      description: 'CBN Compliance Status'
    },
    {
      url: `${baseUrl}/cbn-compliance/dashboard`,
      description: 'CBN Compliance Dashboard'
    },
    {
      url: `${baseUrl}/security-monitoring/alerts`,
      description: 'SIEM Security Monitoring Alerts'
    },
    {
      url: `${baseUrl}/security-monitoring/dashboard`,
      description: 'SIEM Security Monitoring Dashboard'
    }
  ];

  const results = [];
  
  for (const test of tests) {
    const result = await testEndpoint(test.url, token, test.description);
    results.push({ ...test, ...result });
  }
  
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`✅ Successful: ${successful}/${total}`);
  console.log(`❌ Failed: ${total - successful}/${total}`);
  
  if (successful === total) {
    console.log('\n🎉 All Phase 1 endpoints are working with authentication!');
  } else {
    console.log('\n⚠️  Some endpoints need attention:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.description}: ${r.error || `Status ${r.status}`}`);
    });
  }
}

// Run the tests
runTests().catch(console.error);