const http = require('http');

// Test function to check endpoint health
function testEndpoint(path, port = 3001) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: 'GET',
      headers: {
        'X-Tenant-ID': 'fmfb'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('🧪 Running endpoint verification tests...\n');

  const tests = [
    { name: 'Health Check', path: '/health' },
    { name: 'API Health', path: '/api/health' },
    { name: 'Auth Profile (no token)', path: '/api/auth/profile' }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name} (${test.path})`);
      const result = await testEndpoint(test.path);
      
      console.log(`✅ Status: ${result.statusCode}`);
      
      // Try to parse JSON response
      try {
        const jsonData = JSON.parse(result.data);
        console.log(`📄 Response:`, JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log(`📄 Response: ${result.data.substring(0, 200)}...`);
      }
      
      console.log('---');
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log('---');
    }
  }
  
  console.log('✨ Test verification complete!');
}

runTests().catch(console.error);