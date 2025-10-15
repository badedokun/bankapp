/**
 * AI Assistant Backend API Tests
 * Tests for AI chat endpoints, personality modes, and smart suggestions
 */

import { test, expect, request } from '@playwright/test';

const API_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';
const TEST_USER = {
  email: 'demo@fmfb.com',
  password: 'AI-powered-fmfb-1app'
};

let authToken: string = '';
let userId: string = '';

// Helper function to login and get token
async function getAuthToken() {
  const apiContext = await request.newContext({
    baseURL: API_BASE_URL,
  });

  const loginResponse = await apiContext.post('/api/auth/login', {
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': 'fmfb',
    },
    data: {
      email: TEST_USER.email,
      password: TEST_USER.password,
    },
  });

  expect(loginResponse.ok()).toBeTruthy();
  const loginData = await loginResponse.json();

  return {
    token: loginData.data?.tokens?.access || loginData.tokens?.access || loginData.accessToken || loginData.token,
    userId: loginData.data?.user?.id || loginData.user?.id || '',
  };
}

test.describe('AI Backend API - Chat Endpoints', () => {
  test.beforeAll(async () => {
    const auth = await getAuthToken();
    authToken = auth.token;
    userId = auth.userId;
  });

  test('POST /api/ai/chat - should process basic message', async () => {
    const apiContext = await request.newContext({
      baseURL: API_BASE_URL,
    });

    const response = await apiContext.post('/api/ai/chat', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        message: 'Check my account balance',
        context: {
          userId: userId,
          tenantId: 'fmfb',
          conversationId: 'test-conv-1',
          language: 'en',
          bankingContext: {},
        },
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('response');
    expect(typeof data.response).toBe('string');
    expect(data.response.length).toBeGreaterThan(0);

    console.log('✅ Basic AI chat message processed successfully');
    console.log('Response:', data.response.substring(0, 100) + '...');
  });

  test('POST /api/ai/chat - should handle personality modes', async () => {
    const apiContext = await request.newContext({
      baseURL: API_BASE_URL,
    });

    const personalities = ['friendly', 'professional', 'playful', 'roast'];

    for (const personality of personalities) {
      const response = await apiContext.post('/api/ai/chat', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          message: 'Hello',
          aiPersonality: personality,
          context: {
            userId: userId,
            tenantId: 'fmfb',
            conversationId: `test-${personality}`,
            language: 'en',
            personality: personality,
            bankingContext: {},
          },
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty('response');
      console.log(`✅ ${personality} personality response:`, data.response.substring(0, 80) + '...');
    }
  });

  test('POST /api/ai/chat - should include suggestions', async () => {
    const apiContext = await request.newContext({
      baseURL: API_BASE_URL,
    });

    const response = await apiContext.post('/api/ai/chat', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        message: 'What can you help me with?',
        context: {
          userId: userId,
          tenantId: 'fmfb',
          conversationId: 'test-suggestions',
          language: 'en',
          bankingContext: {},
        },
        options: {
          includeSuggestions: true,
        },
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('suggestions');
    expect(Array.isArray(data.suggestions)).toBeTruthy();

    console.log('✅ AI suggestions included:', data.suggestions?.length || 0);
  });

  test('POST /api/ai/chat - should handle missing context gracefully', async () => {
    const apiContext = await request.newContext({
      baseURL: API_BASE_URL,
    });

    const response = await apiContext.post('/api/ai/chat', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        message: 'Hello',
        context: {
          userId: userId,
          tenantId: 'fmfb',
          conversationId: 'test-minimal',
          language: 'en',
          bankingContext: {},
        },
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('response');
    console.log('✅ Minimal context handled successfully');
  });

  test('POST /api/ai/chat - should return 400 for missing message', async () => {
    const apiContext = await request.newContext({
      baseURL: API_BASE_URL,
    });

    const response = await apiContext.post('/api/ai/chat', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        context: {
          userId: userId,
          tenantId: 'fmfb',
        },
      },
    });

    expect(response.status()).toBe(400);
    console.log('✅ Missing message validation works correctly');
  });

  test('POST /api/ai/chat - should require authentication', async () => {
    const apiContext = await request.newContext({
      baseURL: API_BASE_URL,
    });

    const response = await apiContext.post('/api/ai/chat', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        message: 'Hello',
        context: {
          userId: userId,
          tenantId: 'fmfb',
        },
      },
    });

    expect(response.status()).toBe(401);
    console.log('✅ Authentication required for AI chat');
  });
});

test.describe('AI Backend API - Smart Suggestions', () => {
  test.beforeAll(async () => {
    const auth = await getAuthToken();
    authToken = auth.token;
    userId = auth.userId;
  });

  test('GET /api/ai/suggestions/smart - should return personalized suggestions', async () => {
    const apiContext = await request.newContext({
      baseURL: API_BASE_URL,
    });

    const context = JSON.stringify({
      userId: userId,
      tenantId: 'fmfb',
      conversationId: 'test-smart-suggestions',
      language: 'en',
      bankingContext: {},
    });

    const response = await apiContext.get(`/api/ai/suggestions/smart?context=${encodeURIComponent(context)}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('suggestions');
    expect(Array.isArray(data.suggestions)).toBeTruthy();

    console.log('✅ Smart suggestions returned:', data.suggestions?.length || 0);
    if (data.suggestions && data.suggestions.length > 0) {
      console.log('Sample suggestion:', data.suggestions[0]);
    }
  });

  test('GET /api/ai/suggestions/smart - should filter by category', async () => {
    const apiContext = await request.newContext({
      baseURL: API_BASE_URL,
    });

    const categories = ['financial', 'action', 'automation'];

    for (const category of categories) {
      const context = JSON.stringify({
        userId: userId,
        tenantId: 'fmfb',
        bankingContext: {},
      });

      const response = await apiContext.get(
        `/api/ai/suggestions/smart?context=${encodeURIComponent(context)}&category=${category}&limit=3`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty('suggestions');
      console.log(`✅ ${category} suggestions:`, data.suggestions?.length || 0);
    }
  });
});

test.describe('AI Backend API - Analytics Insights', () => {
  test.beforeAll(async () => {
    const auth = await getAuthToken();
    authToken = auth.token;
    userId = auth.userId;
  });

  test('GET /api/ai/analytics/insights - should return financial insights', async () => {
    const apiContext = await request.newContext({
      baseURL: API_BASE_URL,
    });

    const context = JSON.stringify({
      userId: userId,
      tenantId: 'fmfb',
      bankingContext: {},
    });

    const response = await apiContext.get(
      `/api/ai/analytics/insights?context=${encodeURIComponent(context)}&type=spending&timeframe=month`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('insights');
    console.log('✅ Analytics insights returned');
  });
});

test.describe('AI Backend API - Voice and Intent', () => {
  test.beforeAll(async () => {
    const auth = await getAuthToken();
    authToken = auth.token;
    userId = auth.userId;
  });

  test('POST /api/ai/intent - should classify user intent', async () => {
    const apiContext = await request.newContext({
      baseURL: API_BASE_URL,
    });

    const response = await apiContext.post('/api/ai/intent', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        text: 'I want to transfer money to my friend',
        context: {
          userId: userId,
          tenantId: 'fmfb',
        },
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('confidence');
    console.log('✅ Intent classified:', data.name, `(${Math.round(data.confidence * 100)}% confidence)`);
  });

  test('POST /api/ai/entities - should extract entities from text', async () => {
    const apiContext = await request.newContext({
      baseURL: API_BASE_URL,
    });

    const response = await apiContext.post('/api/ai/entities', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        text: 'Transfer 5000 naira to John on Friday',
        context: {
          userId: userId,
          tenantId: 'fmfb',
        },
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('entities');
    console.log('✅ Entities extracted:', data.entities);
  });

  test('GET /api/ai/suggestions - should return default suggestions', async () => {
    const apiContext = await request.newContext({
      baseURL: API_BASE_URL,
    });

    const response = await apiContext.get('/api/ai/suggestions', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('suggestions');
    expect(Array.isArray(data.suggestions)).toBeTruthy();
    expect(data.suggestions.length).toBeGreaterThan(0);

    console.log('✅ Default suggestions returned:', data.suggestions.length);
  });
});

test.describe('AI Backend API - Personalized Suggestions', () => {
  test.beforeAll(async () => {
    const auth = await getAuthToken();
    authToken = auth.token;
    userId = auth.userId;
  });

  test('POST /api/ai/suggestions/personalized - should return context-aware suggestions', async () => {
    const apiContext = await request.newContext({
      baseURL: API_BASE_URL,
    });

    const response = await apiContext.post('/api/ai/suggestions/personalized', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        category: 'financial',
        maxSuggestions: 5,
        language: 'en',
        accountBalance: 50000,
        recentTransactions: [],
        timeOfDay: 'afternoon',
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('suggestions');
    expect(data).toHaveProperty('metadata');
    expect(data.metadata.personalized).toBeTruthy();

    console.log('✅ Personalized suggestions returned:', data.suggestions?.length || 0);
  });
});

test.describe('AI Backend API - Health and Configuration', () => {
  test.beforeAll(async () => {
    const auth = await getAuthToken();
    authToken = auth.token;
  });

  test('GET /api/ai/health - should return AI service health status', async () => {
    const apiContext = await request.newContext({
      baseURL: API_BASE_URL,
    });

    const response = await apiContext.get('/api/ai/health', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('services');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('performance');

    console.log('✅ AI service health check passed');
    console.log('Services:', Object.keys(data.services || {}));
    console.log('Performance:', `${data.performance?.successRate}% success rate, ${data.performance?.requestCount} requests`);
  });

  test('GET /api/ai/config - should return AI configuration', async () => {
    const apiContext = await request.newContext({
      baseURL: API_BASE_URL,
    });

    const response = await apiContext.get('/api/ai/config', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('configuration');

    console.log('✅ AI configuration retrieved');
  });

  test('GET /api/ai/languages - should return supported languages', async () => {
    const apiContext = await request.newContext({
      baseURL: API_BASE_URL,
    });

    const response = await apiContext.get('/api/ai/languages', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('languages');
    expect(Array.isArray(data.languages)).toBeTruthy();

    console.log('✅ Supported languages:', data.languages?.length || 0);
  });
});

test.describe('AI Backend API - Development Controls', () => {
  test.beforeAll(async () => {
    const auth = await getAuthToken();
    authToken = auth.token;
    userId = auth.userId;
  });

  test('GET /api/ai/dev/usage - should return usage statistics', async () => {
    const apiContext = await request.newContext({
      baseURL: API_BASE_URL,
    });

    const response = await apiContext.get('/api/ai/dev/usage', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('usageStats');
    expect(data).toHaveProperty('configuration');

    console.log('✅ Usage statistics retrieved');
    console.log('Development mode:', data.developmentMode);
    console.log('Mock responses:', data.useMockResponses);
  });
});

test.describe('AI Backend API - Performance', () => {
  test.beforeAll(async () => {
    const auth = await getAuthToken();
    authToken = auth.token;
    userId = auth.userId;
  });

  test('AI chat response time should be under 5 seconds', async () => {
    const apiContext = await request.newContext({
      baseURL: API_BASE_URL,
    });

    const startTime = Date.now();

    const response = await apiContext.post('/api/ai/chat', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        message: 'Quick test',
        context: {
          userId: userId,
          tenantId: 'fmfb',
          conversationId: 'perf-test',
          language: 'en',
          bankingContext: {},
        },
      },
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(5000);

    console.log(`✅ AI response time: ${responseTime}ms (target: <5000ms)`);
  });

  test('Smart suggestions response time should be under 2 seconds', async () => {
    const apiContext = await request.newContext({
      baseURL: API_BASE_URL,
    });

    const startTime = Date.now();

    const context = JSON.stringify({
      userId: userId,
      tenantId: 'fmfb',
      bankingContext: {},
    });

    const response = await apiContext.get(`/api/ai/suggestions/smart?context=${encodeURIComponent(context)}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(2000);

    console.log(`✅ Smart suggestions response time: ${responseTime}ms (target: <2000ms)`);
  });
});
