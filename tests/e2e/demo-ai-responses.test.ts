import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:3001';

test.describe('AI Response Demonstrations', () => {
  let authToken: string;
  let userId: string;

  test.beforeAll(async ({ request }) => {
    const loginResponse = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'admin@fmfb.com',
        password: 'Admin-7-super'
      }
    });

    const loginData = await loginResponse.json();
    authToken = loginData.data?.token || loginData.token;
    userId = loginData.data?.user?.id || '19769e1e-b7c7-437a-b0c4-c242d82e8e3f';
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  🤖 AI INTELLIGENCE DEMONSTRATION - REAL RESPONSES');
    console.log('═══════════════════════════════════════════════════════════════\n');
  });

  test('Demo 1: Balance Inquiry', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/ai/chat`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        message: 'What is my account balance?',
        context: { userId, tenantId: 'fmfb' }
      }
    });

    const data = await response.json();
    
    console.log('💬 USER: "What is my account balance?"');
    console.log(`🤖 AI: ${data.response}`);
    console.log(`📊 Intent: ${data.intent} (${(data.confidence * 100).toFixed(0)}% confidence)`);
    console.log(`💡 Suggestions: ${data.suggestions?.length || 0} provided\n`);
    
    expect(response.ok()).toBeTruthy();
  });

  test('Demo 2: Transaction History', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/ai/chat`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        message: 'Show me my recent transactions',
        context: { userId, tenantId: 'fmfb' }
      }
    });

    const data = await response.json();
    
    console.log('💬 USER: "Show me my recent transactions"');
    console.log(`🤖 AI: ${data.response}`);
    console.log(`📊 Intent: ${data.intent} (${(data.confidence * 100).toFixed(0)}% confidence)`);
    
    if (data.context?.financialData) {
      const fd = data.context.financialData;
      console.log(`\n📈 Financial Context:`);
      console.log(`   • Total Transfers: ₦${fd.totalExpenses?.toLocaleString() || 0}`);
      console.log(`   • Transaction Count: ${fd.recentTransactions?.length || 0}`);
    }
    console.log('');
    
    expect(response.ok()).toBeTruthy();
  });

  test('Demo 3: Spending Analysis', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/ai/chat`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        message: 'Am I spending too much money?',
        context: { userId, tenantId: 'fmfb' }
      }
    });

    const data = await response.json();
    
    console.log('💬 USER: "Am I spending too much money?"');
    console.log(`🤖 AI: ${data.response}`);
    console.log(`📊 Intent: ${data.intent} (${(data.confidence * 100).toFixed(0)}% confidence)\n`);
    
    expect(response.ok()).toBeTruthy();
  });

  test('Demo 4: Transfer Intent', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/ai/chat`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        message: 'I want to send 25000 naira to John Doe',
        context: { userId, tenantId: 'fmfb' }
      }
    });

    const data = await response.json();
    
    console.log('💬 USER: "I want to send 25000 naira to John Doe"');
    console.log(`🤖 AI: ${data.response}`);
    console.log(`📊 Intent: ${data.intent} (${(data.confidence * 100).toFixed(0)}% confidence)`);
    
    if (data.entities) {
      console.log(`🎯 Extracted Entities:`);
      if (data.entities.amount) console.log(`   • Amount: ₦${data.entities.amount.toLocaleString()}`);
      if (data.entities.recipient) console.log(`   • Recipient: ${data.entities.recipient}`);
    }
    console.log('');
    
    expect(response.ok()).toBeTruthy();
  });

  test('Demo 5: Smart Suggestions', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/ai/smart-suggestions?userId=${userId}&tenantId=fmfb`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();
    
    console.log('💬 USER: [Requests Smart Suggestions]');
    console.log(`🤖 AI: Generated ${data.suggestions?.length || 0} personalized suggestions:\n`);
    
    data.suggestions?.slice(0, 3).forEach((s: any, i: number) => {
      console.log(`   ${i + 1}. [${s.type}] ${s.text}`);
    });
    console.log('');
    
    expect(response.ok()).toBeTruthy();
  });

  test('Demo 6: Analytics Insights', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/ai/analytics-insights?userId=${userId}&tenantId=fmfb&type=spending`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();
    
    console.log('💬 USER: [Requests Spending Analytics]');
    console.log(`🤖 AI: Analytics for ${data.timeframe || 'month'}:\n`);
    
    data.insights?.forEach((insight: any) => {
      console.log(`   📊 ${insight.category}: ${insight.value} (${insight.trend})`);
    });
    
    if (data.recommendations?.length > 0) {
      console.log(`\n   💡 Recommendations:`);
      data.recommendations.forEach((rec: string) => {
        console.log(`      • ${rec}`);
      });
    }
    console.log('');
    
    expect(response.ok()).toBeTruthy();
  });

  test.afterAll(async () => {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ✅ AI Intelligence System - All Features Demonstrated');
    console.log('═══════════════════════════════════════════════════════════════\n');
  });
});
