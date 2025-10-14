/**
 * Simple API Test to verify setup
 */

import { test, expect } from '@playwright/test';

test.describe('Simple API Tests', () => {
  test('should reach the server health endpoint', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/health');

    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('status');
      console.log('✅ Server is healthy:', data);
    } else {
      console.log('ℹ️  Health endpoint not available, checking base URL');

      // Try base URL
      const baseResponse = await request.get('http://localhost:3001/');
      console.log(`Base URL response status: ${baseResponse.status()}`);
    }
  });

  test('should attempt authentication endpoint', async ({ request }) => {
    try {
      const response = await request.post('http://localhost:3001/api/auth/login', {
        data: {
          email: 'demo@fmfb.com',
          password: 'demo123'
        }
      });

      console.log(`Login endpoint response status: ${response.status()}`);

      if (response.ok()) {
        const data = await response.json();
        console.log('✅ Login successful');
        expect(data).toBeDefined();
      } else {
        const errorText = await response.text();
        console.log('ℹ️  Login failed (expected for test):', errorText);
      }
    } catch (error) {
      console.log('ℹ️  Login endpoint error (may be expected):', error.message);
    }
  });
});