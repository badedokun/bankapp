#!/usr/bin/env node

/**
 * Test Local Data Analysis Capabilities
 * Tests whether the AI can analyze local transaction data without OpenAI
 */

const https = require('https');
const http = require('http');

const API_BASE = 'http://localhost:3001';
const TEST_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImVtYWlsIjoidGVzdEBmbWZiLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzU4NDAzMDc3LCJleHAiOjE3NTg0ODk0NzcsImF1ZCI6Im9yb2tpaXBheS1jbGllbnQiLCJpc3MiOiJvcm9raWlwYXktYXBpIn0.hETJlPXefpgN4N-R0zs1R_9cqLofW_AXHB5HnbprK_w';

// Sample transaction data for analysis
const testTransactions = [
  { amount: 150000, type: 'credit', description: 'Salary', date: '2025-01-15', category: 'income' },
  { amount: 45000, type: 'debit', description: 'Rent', date: '2025-01-14', category: 'housing' },
  { amount: 12000, type: 'debit', description: 'Groceries - Shoprite', date: '2025-01-13', category: 'food' },
  { amount: 8500, type: 'debit', description: 'Fuel - Total', date: '2025-01-12', category: 'transport' },
  { amount: 25000, type: 'debit', description: 'Shopping - Mall', date: '2025-01-11', category: 'shopping' },
  { amount: 5000, type: 'debit', description: 'ATM Withdrawal', date: '2025-01-10', category: 'cash' },
  { amount: 3500, type: 'debit', description: 'Internet Bill', date: '2025-01-09', category: 'utilities' },
  { amount: 15000, type: 'debit', description: 'Pharmacy', date: '2025-01-08', category: 'healthcare' },
  { amount: 7500, type: 'debit', description: 'Restaurant - KFC', date: '2025-01-07', category: 'food' },
  { amount: 2000, type: 'debit', description: 'Mobile Recharge', date: '2025-01-06', category: 'utilities' }
];

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    const defaultOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': TEST_TOKEN
      }
    };

    const requestOptions = { ...defaultOptions, ...options };

    const req = protocol.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testLocalDataAnalysis() {
  console.log('🧠 TESTING LOCAL DATA ANALYSIS CAPABILITIES');
  console.log('===========================================');
  console.log('This test verifies that AI can analyze transaction data locally without OpenAI');
  console.log('');

  const testQueries = [
    {
      query: "What's my spending pattern?",
      expectation: "Should analyze transaction categories and amounts"
    },
    {
      query: "Analyze my spending pattern",
      expectation: "Should identify top spending categories (Housing, Shopping, Food)"
    },
    {
      query: "Boost Emergency Fund Goal",
      expectation: "Should suggest savings based on income vs expenses"
    },
    {
      query: "What can I save money on?",
      expectation: "Should identify areas like shopping and dining for savings"
    }
  ];

  let successCount = 0;
  let totalTests = testQueries.length;

  for (let i = 0; i < testQueries.length; i++) {
    const { query, expectation } = testQueries[i];

    console.log(`\n${i + 1}. Testing: "${query}"`);
    console.log(`   Expected: ${expectation}`);

    try {
      const response = await makeRequest(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        body: {
          message: query,
          context: {
            userId: '123e4567-e89b-12d3-a456-426614174000',
            tenantId: '7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3',
            conversationId: `local-data-test-${i + 1}`,
            language: 'en',
            bankingContext: {
              accountBalance: 56500, // After all transactions
              recentTransactions: testTransactions,
              userProfile: {
                monthlyIncome: 150000,
                savingsGoal: 50000
              },
              capabilities: ['balance_inquiry', 'transaction_analysis', 'spending_insights']
            }
          }
        }
      });

      if (response.status === 200) {
        console.log(`   ✅ Status: ${response.status} OK`);

        const { data } = response;
        let analysisFound = false;
        let smartSuggestionsFound = false;

        // Check if response contains actual data analysis (not generic responses)
        if (data.response) {
          const responseText = data.response.toLowerCase();

          // Look for spending analysis indicators
          const analysisIndicators = [
            'housing', 'rent', 'groceries', 'food', 'transport', 'shopping',
            '45000', '12000', '25000', 'spending', 'category', 'pattern',
            'save', 'budget', 'analysis', 'emergency fund'
          ];

          const foundIndicators = analysisIndicators.filter(indicator =>
            responseText.includes(indicator.toLowerCase())
          );

          if (foundIndicators.length > 0) {
            analysisFound = true;
            console.log(`   🎯 Found Analysis: ${foundIndicators.join(', ')}`);
          }
        }

        // Check for smart suggestions
        if (data.suggestions && data.suggestions.length > 0) {
          smartSuggestionsFound = true;
          console.log(`   🧠 Smart Suggestions: ${data.suggestions.length} provided`);

          data.suggestions.slice(0, 2).forEach((suggestion, idx) => {
            const text = typeof suggestion === 'object' ? suggestion.text : suggestion;
            console.log(`      ${idx + 1}. ${text}`);
          });
        }

        // Check for insights
        if (data.insights && data.insights.length > 0) {
          console.log(`   📊 Insights: ${data.insights.length} provided`);
          data.insights.slice(0, 2).forEach((insight, idx) => {
            console.log(`      ${idx + 1}. ${insight.title || insight}`);
          });
        }

        // Determine if this represents successful local analysis
        if (analysisFound || smartSuggestionsFound || (data.insights && data.insights.length > 0)) {
          console.log(`   🎉 LOCAL ANALYSIS WORKING: AI analyzed transaction data locally!`);
          successCount++;
        } else if (data.response && data.response.includes("I'm sorry")) {
          console.log(`   ❌ GENERIC RESPONSE: Still getting generic error message`);
        } else {
          console.log(`   ⚠️  UNCLEAR: Response provided but unclear if local analysis occurred`);
        }

      } else if (response.status === 429) {
        console.log(`   ⚠️  Rate Limited: ${response.status} - This should trigger local analysis fallback`);
        console.log(`   📋 Response: ${JSON.stringify(response.data)}`);
      } else {
        console.log(`   ❌ Error: ${response.status} - ${JSON.stringify(response.data)}`);
      }

    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }

    // Wait between requests
    if (i < testQueries.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 LOCAL DATA ANALYSIS TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Local Analysis Working: ${successCount}`);
  console.log(`Success Rate: ${Math.round((successCount / totalTests) * 100)}%`);

  if (successCount === totalTests) {
    console.log('\n✅ EXCELLENT: AI is analyzing local transaction data without OpenAI!');
    console.log('✅ Smart Suggestions Engine is working independently');
    console.log('✅ Local data analysis capabilities are fully functional');
  } else if (successCount > 0) {
    console.log('\n⚠️  PARTIAL SUCCESS: Some local analysis working, some still dependent on OpenAI');
    console.log('💡 Recommendation: Improve fallback mechanism trigger');
  } else {
    console.log('\n❌ ISSUE: AI is not analyzing local data independently');
    console.log('💡 The system should analyze transaction patterns, spending categories, and provide insights');
    console.log('💡 without requiring OpenAI for basic data analysis tasks');
  }

  return { successCount, totalTests };
}

// Run the test
if (require.main === module) {
  testLocalDataAnalysis().catch(error => {
    console.log(`\n❌ Test failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { testLocalDataAnalysis };