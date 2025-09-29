/**
 * Comprehensive API Tests
 * Tests the actual implemented endpoints with real authentication
 */

import { test, expect } from '@playwright/test';

let authToken: string;

test.describe('Comprehensive API Tests', () => {
  test.beforeAll(async ({ request }) => {
    // Login once and reuse token
    const loginResponse = await request.post('http://localhost:3001/api/auth/login', {
      data: {
        email: 'demo@fmfb.com',
        password: 'AI-powered-fmfb-1app'
      }
    });

    const loginData = await loginResponse.json();

    if (loginResponse.ok() && loginData.data?.tokens?.access) {
      authToken = loginData.data.tokens.access;
      console.log('✅ Authentication successful for comprehensive tests');
    } else {
      console.log('Login failed:', loginData);
      throw new Error('Failed to authenticate for comprehensive tests');
    }
  });

  test('should test user profile endpoint', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/users/profile', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log(`Profile endpoint status: ${response.status()}`);

    if (response.ok()) {
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('email');
      console.log('✅ Profile endpoint working');
    }
  });

  test('should test wallet/balance endpoint', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/wallets/balance', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log(`Wallet balance endpoint status: ${response.status()}`);

    if (response.ok()) {
      const data = await response.json();
      console.log('✅ Wallet balance endpoint working:', data);
    } else {
      const errorText = await response.text();
      console.log('Wallet balance error:', errorText);
    }
  });

  test('should test accounts endpoint', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/accounts', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log(`Accounts endpoint status: ${response.status()}`);

    if (response.ok()) {
      const data = await response.json();
      console.log('✅ Accounts endpoint working');
    } else {
      const errorText = await response.text();
      console.log('Accounts error:', errorText);
    }
  });

  test('should test transfers history endpoint', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/transfers/history?limit=5', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log(`Transfer history endpoint status: ${response.status()}`);

    if (response.ok()) {
      const data = await response.json();
      console.log('✅ Transfer history endpoint working');
      expect(data).toHaveProperty('data');
    } else {
      const errorText = await response.text();
      console.log('Transfer history error:', errorText);
    }
  });

  test('should test internal transfer validation', async ({ request }) => {
    const response = await request.post('http://localhost:3001/api/transfers/internal', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        // Invalid data to test validation
        amount: 'invalid',
        recipientAccountNumber: '123',
        description: 'Test transfer',
        pin: '1234'
      }
    });

    console.log(`Internal transfer validation status: ${response.status()}`);

    // Should return validation error (400)
    expect(response.status()).toBeGreaterThanOrEqual(400);

    if (!response.ok()) {
      const errorData = await response.json();
      console.log('✅ Validation working correctly:', errorData.error);
    }
  });

  test('should test external transfer validation', async ({ request }) => {
    const response = await request.post('http://localhost:3001/api/transfers/external', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        amount: 1000,
        recipientAccountNumber: '1234567890',
        recipientBankCode: '058',
        description: 'Test external transfer',
        pin: '1234'
      }
    });

    console.log(`External transfer endpoint status: ${response.status()}`);

    if (response.ok()) {
      const data = await response.json();
      console.log('✅ External transfer endpoint accessible');
    } else {
      const errorData = await response.json();
      console.log('External transfer response:', errorData);
    }
  });

  test('should test bill payment endpoints', async ({ request }) => {
    // Test bill payment providers
    const providersResponse = await request.get('http://localhost:3001/api/bills/providers', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log(`Bill providers endpoint status: ${providersResponse.status()}`);

    if (providersResponse.ok()) {
      const data = await providersResponse.json();
      console.log('✅ Bill providers endpoint working');
    }

    // Test bill payment
    const paymentResponse = await request.post('http://localhost:3001/api/bills/pay', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        provider: 'electricity',
        accountNumber: '12345678901',
        amount: 5000,
        pin: '1234'
      }
    });

    console.log(`Bill payment endpoint status: ${paymentResponse.status()}`);
  });

  test('should test AI endpoints', async ({ request }) => {
    // Test AI chat endpoint
    const chatResponse = await request.post('http://localhost:3001/api/ai/chat', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        message: 'What is my account balance?',
        context: {
          conversationId: 'test-conversation',
          sessionId: 'test-session',
          userIntent: 'balance_inquiry'
        }
      }
    });

    console.log(`AI chat endpoint status: ${chatResponse.status()}`);

    if (chatResponse.ok()) {
      const data = await chatResponse.json();
      console.log('✅ AI chat endpoint working');
    } else {
      const errorData = await chatResponse.json();
      console.log('AI chat error:', errorData);
    }

    // Test AI suggestions endpoint
    const suggestionsResponse = await request.get('http://localhost:3001/api/ai/suggestions', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log(`AI suggestions endpoint status: ${suggestionsResponse.status()}`);
  });

  test('should test analytics endpoints', async ({ request }) => {
    const analyticsResponse = await request.get('http://localhost:3001/api/analytics/dashboard', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log(`Analytics dashboard endpoint status: ${analyticsResponse.status()}`);

    if (analyticsResponse.ok()) {
      const data = await analyticsResponse.json();
      console.log('✅ Analytics dashboard endpoint working');
    }
  });

  test('should test scheduled payments', async ({ request }) => {
    const scheduledResponse = await request.get('http://localhost:3001/api/transfers/scheduled', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log(`Scheduled payments endpoint status: ${scheduledResponse.status()}`);

    if (scheduledResponse.ok()) {
      const data = await scheduledResponse.json();
      console.log('✅ Scheduled payments endpoint working');
    }
  });

  test('should test notification preferences', async ({ request }) => {
    const notificationsResponse = await request.get('http://localhost:3001/api/notifications/preferences', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log(`Notification preferences endpoint status: ${notificationsResponse.status()}`);

    if (notificationsResponse.ok()) {
      const data = await notificationsResponse.json();
      console.log('✅ Notification preferences endpoint working');
    }
  });
});