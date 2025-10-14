import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3001';

// Test credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@fmfb.com',
  password: 'Admin-7-super'
};

const DEMO_CREDENTIALS = {
  email: 'demo@fmfb.com',
  password: 'Demo-7-super'
};

// Helper function to authenticate and get token
async function getAuthToken(page: any, credentials: any) {
  const response = await page.request.post(`${BASE_URL}/api/auth/login`, {
    data: {
      email: credentials.email,
      password: credentials.password,
      tenantCode: 'fmfb'
    }
  });

  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  return data.token;
}

test.describe('RBAC Endpoints Test Suite', () => {
  let adminToken: string;
  let demoToken: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();

    console.log('🔐 Getting authentication tokens...');
    adminToken = await getAuthToken(page, ADMIN_CREDENTIALS);
    demoToken = await getAuthToken(page, DEMO_CREDENTIALS);

    expect(adminToken).toBeTruthy();
    expect(demoToken).toBeTruthy();

    console.log('✅ Authentication tokens obtained');
    await page.close();
  });

  test('1. Enhanced Dashboard Data Endpoint - Admin User', async ({ request }) => {
    console.log('🚀 Testing Enhanced Dashboard Data endpoint with admin user...');

    const response = await request.get(`${BASE_URL}/api/rbac/enhanced-dashboard-data`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-tenant-code': 'fmfb',
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status());
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    console.log('📊 Response data keys:', Object.keys(data));

    // Verify response structure
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('userContext');
    expect(data.data).toHaveProperty('permissions');
    expect(data.data).toHaveProperty('availableFeatures');
    expect(data.data).toHaveProperty('roleBasedMetrics');
    expect(data.data).toHaveProperty('aiSuggestions');

    // Verify user context
    expect(data.data.userContext).toHaveProperty('userId');
    expect(data.data.userContext).toHaveProperty('email', 'admin@fmfb.com');
    expect(data.data.userContext).toHaveProperty('roles');

    // Verify permissions array
    expect(Array.isArray(data.data.permissions)).toBeTruthy();
    expect(data.data.permissions.length).toBeGreaterThan(0);

    // Verify available features
    expect(Array.isArray(data.data.availableFeatures)).toBeTruthy();
    expect(data.data.availableFeatures.length).toBeGreaterThan(0);

    // Verify AI suggestions
    expect(Array.isArray(data.data.aiSuggestions)).toBeTruthy();

    console.log('✅ Enhanced Dashboard Data endpoint test passed for admin user');
    console.log(`📈 Permissions count: ${data.data.permissions.length}`);
    console.log(`🎯 Features count: ${data.data.availableFeatures.length}`);
    console.log(`🤖 AI suggestions count: ${data.data.aiSuggestions.length}`);
  });

  test('2. Enhanced Dashboard Data Endpoint - Demo User', async ({ request }) => {
    console.log('🚀 Testing Enhanced Dashboard Data endpoint with demo user...');

    const response = await request.get(`${BASE_URL}/api/rbac/enhanced-dashboard-data`, {
      headers: {
        'Authorization': `Bearer ${demoToken}`,
        'x-tenant-code': 'fmfb',
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status());
    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // Verify response structure
    expect(data).toHaveProperty('success', true);
    expect(data.data.userContext).toHaveProperty('email', 'demo@fmfb.com');
    expect(Array.isArray(data.data.permissions)).toBeTruthy();
    expect(Array.isArray(data.data.availableFeatures)).toBeTruthy();

    console.log('✅ Enhanced Dashboard Data endpoint test passed for demo user');
    console.log(`📈 Permissions count: ${data.data.permissions.length}`);
    console.log(`🎯 Features count: ${data.data.availableFeatures.length}`);
  });

  test('3. User Permissions Endpoint', async ({ request }) => {
    console.log('🚀 Testing User Permissions endpoint...');

    const response = await request.get(`${BASE_URL}/api/rbac/user/permissions`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-tenant-code': 'fmfb',
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status());
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('permissions');
    expect(Array.isArray(data.permissions)).toBeTruthy();

    console.log('✅ User Permissions endpoint test passed');
    console.log(`📊 Permissions returned: ${data.permissions.length}`);
  });

  test('4. User Roles Endpoint', async ({ request }) => {
    console.log('🚀 Testing User Roles endpoint...');

    const response = await request.get(`${BASE_URL}/api/rbac/user/roles`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-tenant-code': 'fmfb',
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status());
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('roles');
    expect(Array.isArray(data.roles)).toBeTruthy();

    console.log('✅ User Roles endpoint test passed');
    console.log(`👤 Roles returned: ${data.roles.length}`);
  });

  test('5. Available Features Endpoint', async ({ request }) => {
    console.log('🚀 Testing Available Features endpoint...');

    const response = await request.get(`${BASE_URL}/api/rbac/user/features`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-tenant-code': 'fmfb',
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status());
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('features');
    expect(Array.isArray(data.features)).toBeTruthy();

    console.log('✅ Available Features endpoint test passed');
    console.log(`🎯 Features returned: ${data.features.length}`);
  });

  test('6. Permission Check Endpoint', async ({ request }) => {
    console.log('🚀 Testing Permission Check endpoint...');

    const response = await request.post(`${BASE_URL}/api/rbac/check-permission`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-tenant-code': 'fmfb',
        'Content-Type': 'application/json'
      },
      data: {
        permissionCode: 'user_management'
      }
    });

    console.log('📡 Response status:', response.status());
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('hasPermission');
    expect(typeof data.hasPermission).toBe('boolean');

    console.log('✅ Permission Check endpoint test passed');
    console.log(`🔐 Has user_management permission: ${data.hasPermission}`);
  });

  test('7. Platform Roles Endpoint', async ({ request }) => {
    console.log('🚀 Testing Platform Roles endpoint...');

    const response = await request.get(`${BASE_URL}/api/rbac/platform/roles`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-tenant-code': 'fmfb',
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status());
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('roles');
    expect(Array.isArray(data.roles)).toBeTruthy();

    console.log('✅ Platform Roles endpoint test passed');
    console.log(`👥 Platform roles returned: ${data.roles.length}`);
  });

  test('8. Platform Permissions Endpoint', async ({ request }) => {
    console.log('🚀 Testing Platform Permissions endpoint...');

    const response = await request.get(`${BASE_URL}/api/rbac/platform/permissions`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-tenant-code': 'fmfb',
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status());
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('permissions');
    expect(Array.isArray(data.permissions)).toBeTruthy();

    console.log('✅ Platform Permissions endpoint test passed');
    console.log(`🔑 Platform permissions returned: ${data.permissions.length}`);
  });

  test('9. Unauthorized Access Test', async ({ request }) => {
    console.log('🚀 Testing unauthorized access...');

    const response = await request.get(`${BASE_URL}/api/rbac/enhanced-dashboard-data`, {
      headers: {
        'x-tenant-code': 'fmfb',
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status());
    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('token');

    console.log('✅ Unauthorized access properly blocked');
  });

  test('10. Invalid Token Test', async ({ request }) => {
    console.log('🚀 Testing invalid token...');

    const response = await request.get(`${BASE_URL}/api/rbac/enhanced-dashboard-data`, {
      headers: {
        'Authorization': 'Bearer invalid-token-here',
        'x-tenant-code': 'fmfb',
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status());
    expect(response.status()).toBe(401);

    console.log('✅ Invalid token properly rejected');
  });

  test('11. Performance Test - Multiple Concurrent Requests', async ({ request }) => {
    console.log('🚀 Testing performance with concurrent requests...');

    const startTime = Date.now();

    const promises = Array(5).fill(null).map(() =>
      request.get(`${BASE_URL}/api/rbac/enhanced-dashboard-data`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'x-tenant-code': 'fmfb',
          'Content-Type': 'application/json'
        }
      })
    );

    const responses = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`⏱️ 5 concurrent requests completed in ${duration}ms`);
    console.log(`📊 Average response time: ${duration / 5}ms`);

    // Verify all responses are successful
    responses.forEach((response, index) => {
      expect(response.ok()).toBeTruthy();
      console.log(`✅ Request ${index + 1}: ${response.status()}`);
    });

    // Performance threshold: should complete within 10 seconds
    expect(duration).toBeLessThan(10000);

    console.log('✅ Performance test passed');
  });

  test('12. Feature Permission Mapping Test', async ({ request }) => {
    console.log('🚀 Testing feature permission mapping...');

    // Test specific features that should be available
    const featuresToTest = [
      'internal_transfers',
      'user_management',
      'bank_performance_dashboard',
      'access_ai_chat'
    ];

    for (const feature of featuresToTest) {
      const response = await request.post(`${BASE_URL}/api/rbac/check-permission`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'x-tenant-code': 'fmfb',
          'Content-Type': 'application/json'
        },
        data: {
          permissionCode: feature
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      console.log(`🔍 Feature '${feature}': ${data.hasPermission ? '✅ Allowed' : '❌ Denied'}`);
    }

    console.log('✅ Feature permission mapping test completed');
  });
});

test.describe('RBAC Data Validation Tests', () => {
  let adminToken: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    adminToken = await getAuthToken(page, ADMIN_CREDENTIALS);
    await page.close();
  });

  test('13. Enhanced Dashboard Data Structure Validation', async ({ request }) => {
    console.log('🚀 Testing enhanced dashboard data structure...');

    const response = await request.get(`${BASE_URL}/api/rbac/enhanced-dashboard-data`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-tenant-code': 'fmfb',
        'Content-Type': 'application/json'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Detailed structure validation
    expect(data.data.userContext).toMatchObject({
      userId: expect.any(String),
      email: expect.any(String),
      roles: expect.any(Array)
    });

    // Validate permissions structure
    if (data.data.permissions.length > 0) {
      const permission = data.data.permissions[0];
      expect(permission).toMatchObject({
        code: expect.any(String),
        level: expect.any(String)
      });
    }

    // Validate features structure
    if (data.data.availableFeatures.length > 0) {
      const feature = data.data.availableFeatures[0];
      expect(feature).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        category: expect.any(String)
      });
    }

    // Validate AI suggestions structure
    if (data.data.aiSuggestions.length > 0) {
      const suggestion = data.data.aiSuggestions[0];
      expect(suggestion).toMatchObject({
        title: expect.any(String),
        description: expect.any(String),
        priority: expect.any(String)
      });
    }

    console.log('✅ Enhanced Dashboard data structure validation passed');
  });

  test('14. Permission Levels Validation', async ({ request }) => {
    console.log('🚀 Testing permission levels validation...');

    const response = await request.get(`${BASE_URL}/api/rbac/user/permissions`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-tenant-code': 'fmfb',
        'Content-Type': 'application/json'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Validate permission levels are valid
    const validLevels = ['none', 'read', 'write', 'full'];
    data.permissions.forEach((permission: any) => {
      expect(validLevels).toContain(permission.level);
    });

    console.log('✅ Permission levels validation passed');
  });
});