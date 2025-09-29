import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3001';

// Test data
const TEST_TENANT_ID = '7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3'; // FMFB tenant
const TEST_ADMIN_USER_ID = '19769e1e-b7c7-437a-b0c4-c242d82e8e3f'; // admin@fmfb.com
const TEST_DEMO_USER_ID = '06cd7648-a556-41b1-9ffa-a831ff75b982'; // demo@fmfb.com

// Helper function to get auth token
async function getAuthToken(page: any, email: string, password: string) {
  const response = await page.request.post(`${BASE_URL}/api/auth/login`, {
    data: {
      email,
      password,
      tenantCode: 'fmfb'
    }
  });

  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  return data.token;
}

test.describe('RBAC Service Unit Tests', () => {
  let adminToken: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    adminToken = await getAuthToken(page, 'admin@fmfb.com', 'Admin-7-super');
    await page.close();
  });

  test('1. Database Connection Test', async ({ request }) => {
    console.log('🔌 Testing database connection...');

    const response = await request.get(`${BASE_URL}/health`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('status', 'healthy');

    console.log('✅ Database connection test passed');
  });

  test('2. User Permission Resolution Test', async ({ request }) => {
    console.log('🔍 Testing user permission resolution...');

    // Test specific permission check
    const response = await request.post(`${BASE_URL}/api/rbac/check-permission`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-tenant-code': 'fmfb',
        'Content-Type': 'application/json'
      },
      data: {
        permissionCode: 'platform_administration'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('hasPermission');
    expect(data).toHaveProperty('permissionLevel');

    console.log(`🔐 Platform administration permission: ${data.hasPermission}`);
    console.log(`📊 Permission level: ${data.permissionLevel}`);

    console.log('✅ User permission resolution test passed');
  });

  test('3. Role Hierarchy Validation', async ({ request }) => {
    console.log('👥 Testing role hierarchy validation...');

    const response = await request.get(`${BASE_URL}/api/rbac/platform/roles`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-tenant-code': 'fmfb',
        'Content-Type': 'application/json'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Validate role hierarchy levels
    const roles = data.roles;
    expect(roles).toBeDefined();
    expect(Array.isArray(roles)).toBeTruthy();

    // Check for expected roles
    const rolesCodes = roles.map((role: any) => role.code);
    expect(rolesCodes).toContain('ceo');
    expect(rolesCodes).toContain('admin');

    // Validate level structure (CEO should be level 0, highest authority)
    const ceoRole = roles.find((role: any) => role.code === 'ceo');
    expect(ceoRole).toBeDefined();
    expect(ceoRole.level).toBe(0);

    console.log(`📋 Total roles: ${roles.length}`);
    console.log(`👑 CEO role level: ${ceoRole.level}`);

    console.log('✅ Role hierarchy validation passed');
  });

  test('4. Permission Inheritance Test', async ({ request }) => {
    console.log('🔄 Testing permission inheritance...');

    // Get admin user permissions
    const response = await request.get(`${BASE_URL}/api/rbac/user/permissions`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-tenant-code': 'fmfb',
        'Content-Type': 'application/json'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    const permissions = data.permissions;
    expect(Array.isArray(permissions)).toBeTruthy();
    expect(permissions.length).toBeGreaterThan(0);

    // Validate permission structure
    permissions.forEach((permission: any) => {
      expect(permission).toHaveProperty('code');
      expect(permission).toHaveProperty('level');
      expect(['none', 'read', 'write', 'full']).toContain(permission.level);
    });

    console.log(`🔑 Total permissions: ${permissions.length}`);

    // Count permissions by level
    const permissionsByLevel = permissions.reduce((acc: any, perm: any) => {
      acc[perm.level] = (acc[perm.level] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Permissions by level:', permissionsByLevel);

    console.log('✅ Permission inheritance test passed');
  });

  test('5. Feature Access Control Test', async ({ request }) => {
    console.log('🎯 Testing feature access control...');

    const response = await request.get(`${BASE_URL}/api/rbac/user/features`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-tenant-code': 'fmfb',
        'Content-Type': 'application/json'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    const features = data.features;
    expect(Array.isArray(features)).toBeTruthy();
    expect(features.length).toBeGreaterThan(0);

    // Validate feature structure
    features.forEach((feature: any) => {
      expect(feature).toHaveProperty('id');
      expect(feature).toHaveProperty('name');
      expect(feature).toHaveProperty('category');
      expect(feature).toHaveProperty('requiredPermission');
    });

    console.log(`🎯 Total accessible features: ${features.length}`);

    // Group features by category
    const featuresByCategory = features.reduce((acc: any, feature: any) => {
      acc[feature.category] = (acc[feature.category] || 0) + 1;
      return acc;
    }, {});

    console.log('📋 Features by category:', featuresByCategory);

    console.log('✅ Feature access control test passed');
  });

  test('6. Multi-tenant Isolation Test', async ({ request }) => {
    console.log('🏢 Testing multi-tenant isolation...');

    // Test with valid tenant
    const validResponse = await request.get(`${BASE_URL}/api/rbac/user/permissions`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-tenant-code': 'fmfb',
        'Content-Type': 'application/json'
      }
    });

    expect(validResponse.ok()).toBeTruthy();

    // Test with invalid tenant (should fail)
    const invalidResponse = await request.get(`${BASE_URL}/api/rbac/user/permissions`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-tenant-code': 'invalid-tenant',
        'Content-Type': 'application/json'
      }
    });

    expect(invalidResponse.status()).toBe(400);

    console.log('✅ Multi-tenant isolation test passed');
  });

  test('7. Permission Level Validation Test', async ({ request }) => {
    console.log('📊 Testing permission level validation...');

    // Test various permission levels
    const permissionsToTest = [
      'user_management',
      'internal_transfers',
      'bank_performance_dashboard',
      'audit_trail_access'
    ];

    for (const permission of permissionsToTest) {
      const response = await request.post(`${BASE_URL}/api/rbac/check-permission`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'x-tenant-code': 'fmfb',
          'Content-Type': 'application/json'
        },
        data: {
          permissionCode: permission
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      console.log(`🔍 ${permission}: ${data.hasPermission ? '✅' : '❌'} (Level: ${data.permissionLevel})`);

      // Validate response structure
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('hasPermission');
      expect(data).toHaveProperty('permissionLevel');

      if (data.hasPermission) {
        expect(['read', 'write', 'full']).toContain(data.permissionLevel);
      }
    }

    console.log('✅ Permission level validation test passed');
  });

  test('8. RBAC Cache Performance Test', async ({ request }) => {
    console.log('⚡ Testing RBAC cache performance...');

    const iterations = 3;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();

      await request.get(`${BASE_URL}/api/rbac/enhanced-dashboard-data`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'x-tenant-code': 'fmfb',
          'Content-Type': 'application/json'
        }
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      times.push(duration);

      console.log(`⏱️ Request ${i + 1}: ${duration}ms`);
    }

    const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`📊 Average response time: ${averageTime.toFixed(2)}ms`);

    // Performance threshold: should be under 2 seconds
    expect(averageTime).toBeLessThan(2000);

    console.log('✅ RBAC cache performance test passed');
  });

  test('9. Error Handling Test', async ({ request }) => {
    console.log('❌ Testing error handling...');

    // Test invalid permission check
    const response = await request.post(`${BASE_URL}/api/rbac/check-permission`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-tenant-code': 'fmfb',
        'Content-Type': 'application/json'
      },
      data: {
        permissionCode: 'invalid_permission_code'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Should return false for invalid permission
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('hasPermission', false);
    expect(data).toHaveProperty('permissionLevel', 'none');

    console.log('✅ Error handling test passed');
  });

  test('10. Data Consistency Test', async ({ request }) => {
    console.log('🔄 Testing data consistency...');

    // Get permissions via different endpoints and compare
    const permissionsResponse = await request.get(`${BASE_URL}/api/rbac/user/permissions`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-tenant-code': 'fmfb',
        'Content-Type': 'application/json'
      }
    });

    const dashboardResponse = await request.get(`${BASE_URL}/api/rbac/enhanced-dashboard-data`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-tenant-code': 'fmfb',
        'Content-Type': 'application/json'
      }
    });

    expect(permissionsResponse.ok()).toBeTruthy();
    expect(dashboardResponse.ok()).toBeTruthy();

    const permissionsData = await permissionsResponse.json();
    const dashboardData = await dashboardResponse.json();

    // Compare permission counts
    const directPermissions = permissionsData.permissions;
    const dashboardPermissions = dashboardData.data.permissions;

    expect(directPermissions.length).toBe(dashboardPermissions.length);

    console.log(`🔍 Permissions consistency: ${directPermissions.length} = ${dashboardPermissions.length}`);

    console.log('✅ Data consistency test passed');
  });
});

test.describe('RBAC Integration Tests', () => {
  test('11. End-to-End Permission Flow Test', async ({ browser }) => {
    console.log('🔄 Testing end-to-end permission flow...');

    const page = await browser.newPage();

    // Step 1: Login
    const loginResponse = await page.request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: 'admin@fmfb.com',
        password: 'Admin-7-super',
        tenantCode: 'fmfb'
      }
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    const token = loginData.token;

    // Step 2: Get user roles
    const rolesResponse = await page.request.get(`${BASE_URL}/api/rbac/user/roles`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-tenant-code': 'fmfb'
      }
    });

    expect(rolesResponse.ok()).toBeTruthy();
    const rolesData = await rolesResponse.json();

    // Step 3: Get permissions based on roles
    const permissionsResponse = await page.request.get(`${BASE_URL}/api/rbac/user/permissions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-tenant-code': 'fmfb'
      }
    });

    expect(permissionsResponse.ok()).toBeTruthy();
    const permissionsData = await permissionsResponse.json();

    // Step 4: Get available features
    const featuresResponse = await page.request.get(`${BASE_URL}/api/rbac/user/features`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-tenant-code': 'fmfb'
      }
    });

    expect(featuresResponse.ok()).toBeTruthy();
    const featuresData = await featuresResponse.json();

    // Step 5: Verify enhanced dashboard aggregates all data correctly
    const dashboardResponse = await page.request.get(`${BASE_URL}/api/rbac/enhanced-dashboard-data`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-tenant-code': 'fmfb'
      }
    });

    expect(dashboardResponse.ok()).toBeTruthy();
    const dashboardData = await dashboardResponse.json();

    // Verify data consistency across endpoints
    expect(rolesData.roles.length).toBeGreaterThan(0);
    expect(permissionsData.permissions.length).toBeGreaterThan(0);
    expect(featuresData.features.length).toBeGreaterThan(0);
    expect(dashboardData.data.permissions.length).toBe(permissionsData.permissions.length);

    console.log('📊 Flow summary:');
    console.log(`👤 Roles: ${rolesData.roles.length}`);
    console.log(`🔑 Permissions: ${permissionsData.permissions.length}`);
    console.log(`🎯 Features: ${featuresData.features.length}`);

    await page.close();

    console.log('✅ End-to-end permission flow test passed');
  });
});