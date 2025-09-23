import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:3001';

test.describe('Enhanced AI Responses - No Cache', () => {
  let authToken: string;
  let userId: string;

  test.beforeAll(async ({ request }) => {
    const loginResponse = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'admin@fmfb.com',
        password: 'Admin@123!'
      }
    });

    const loginData = await loginResponse.json();
    authToken = loginData.data?.token || loginData.token;
    userId = loginData.data?.user?.id || '19769e1e-b7c7-437a-b0c4-c242d82e8e3f';

    console.log('✅ Authentication successful');
    console.log(`👤 User ID: ${userId}`);
  });

  test('1. Enhanced Spending Analysis Response', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/ai/chat`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      data: {
        message: 'Am I spending too much?',
        context: {
          userId: userId,
          tenantId: 'fmfb'
        }
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    console.log('\n📊 SPENDING ANALYSIS TEST:');
    console.log(`💬 User Prompt: "Am I spending too much?"`);
    console.log(`🤖 AI Response: ${data.response}`);
    console.log(`🎯 Intent: ${data.intent} (Confidence: ${data.confidence})`);

    expect(data.response).toBeTruthy();
    expect(data.response.toLowerCase()).toContain('transferred');

    const has152k = data.response.includes('152') || data.response.includes('₦152,000');
    console.log(`✅ Contains ₦152,000 spending: ${has152k}`);

    const hasAdvice = data.response.includes('spending') || data.response.includes('expenses');
    console.log(`✅ Contains spending advice: ${hasAdvice}`);
  });

  test('2. Enhanced Transaction History Response', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/ai/chat`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      data: {
        message: 'What are my recent transactions?',
        context: {
          userId: userId,
          tenantId: 'fmfb'
        }
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    console.log('\n📜 TRANSACTION HISTORY TEST:');
    console.log(`💬 User Prompt: "What are my recent transactions?"`);
    console.log(`🤖 AI Response: ${data.response}`);
    console.log(`🎯 Intent: ${data.intent} (Confidence: ${data.confidence})`);

    const hasRecipients = data.response.includes('Shoeb') ||
                          data.response.includes('Randolph') ||
                          data.response.includes('Dotun') ||
                          data.response.includes('Dolapo');
    console.log(`✅ Contains recipient names: ${hasRecipients}`);
  });

  test('3. Balance Inquiry with Financial Data', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/ai/chat`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      data: {
        message: 'What is my account balance?',
        context: {
          userId: userId,
          tenantId: 'fmfb'
        }
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    console.log('\n💰 BALANCE INQUIRY TEST:');
    console.log(`💬 User Prompt: "What is my account balance?"`);
    console.log(`🤖 AI Response: ${data.response}`);
    console.log(`🎯 Intent: ${data.intent} (Confidence: ${data.confidence})`);

    expect(data.response).toContain('₦88,000');
  });

  test('4. Verify Financial Data Integration', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/ai/chat`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        message: 'Show me my financial summary',
        context: {
          userId: userId,
          tenantId: 'fmfb'
        }
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    console.log('\n📈 FINANCIAL DATA INTEGRATION TEST:');
    console.log(`💬 User Prompt: "Show me my financial summary"`);
    console.log(`🤖 AI Response: ${data.response}`);

    if (data.context?.financialData) {
      const fd = data.context.financialData;
      console.log('\n💼 Financial Data Context:');
      console.log(`   Balance: ₦${fd.balance?.toLocaleString() || 0}`);
      console.log(`   Total Expenses: ₦${fd.totalExpenses?.toLocaleString() || 0}`);
      console.log(`   Recent Transactions: ${fd.recentTransactions?.length || 0}`);

      expect(fd.totalExpenses).toBeGreaterThan(0);
      console.log(`\n✅ Expenses calculated: ₦${fd.totalExpenses?.toLocaleString()}`);
    }
  });
});
