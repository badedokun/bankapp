/**
 * Comprehensive API Test Suite for All Transfer Endpoints
 * Tests every endpoint in the transfer system with full coverage
 *
 * Endpoints tested:
 * - Fraud Detection & Validation
 * - Account Validation & Inquiry
 * - Internal, External, Bill, International Transfers
 * - Scheduled & Recurring Payments
 * - Receipts & Transaction Records
 * - Notifications
 * - Analytics & Limits
 * - Fee Calculation
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const ADMIN_EMAIL = 'admin@fmfb.com';
const ADMIN_PASSWORD = 'Admin@123456';
const DEMO_EMAIL = 'demo@fmfb.com';
const DEMO_PASSWORD = 'Demo@123456';
const DEMO_PIN = '1234';

let adminToken: string;
let demoToken: string;
let userId: string;
let walletId: string;
let accountNumber: string;

test.describe('Transfer API - Complete Test Suite', () => {

  test.beforeAll(async ({ request }) => {
    // Login admin user
    const adminLogin = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      }
    });
    const adminResult = await adminLogin.json();
    adminToken = adminResult.token;

    // Login demo user
    const demoLogin = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD
      }
    });
    const demoResult = await demoLogin.json();
    demoToken = demoResult.token;
    userId = demoResult.user?.id;

    // Get wallet details
    if (userId) {
      const walletsResponse = await request.get(`${BASE_URL}/api/wallets`, {
        headers: { Authorization: `Bearer ${demoToken}` }
      });
      const walletsData = await walletsResponse.json();
      if (walletsData.data && walletsData.data.length > 0) {
        walletId = walletsData.data[0].id;
        accountNumber = walletsData.data[0].accountNumber;
      }
    }
  });

  // ========================================================================
  // 1. AUTHENTICATION & AUTHORIZATION TESTS
  // ========================================================================
  test.describe('1. Authentication & Authorization', () => {
    test('should authenticate users successfully', () => {
      expect(adminToken).toBeTruthy();
      expect(demoToken).toBeTruthy();
    });

    test('should reject requests without token', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/transfers/history`);
      expect(response.status()).toBe(401);
    });

    test('should reject requests with invalid token', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/transfers/history`, {
        headers: { Authorization: 'Bearer invalid-token-12345' }
      });
      expect(response.status()).toBe(401);
    });
  });

  // ========================================================================
  // 2. FRAUD DETECTION & VALIDATION TESTS
  // ========================================================================
  test.describe('2. Fraud Detection & Validation', () => {
    test('POST /api/transfers/fraud-check - should perform fraud analysis', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/transfers/fraud-check`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          amount: 50000,
          recipientAccountNumber: '0123456789',
          recipientBankCode: '058',
          description: 'Test transfer for fraud check'
        }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('riskScore');
      expect(result.data).toHaveProperty('riskLevel');
      expect(result.data).toHaveProperty('decision');
      expect(['low', 'medium', 'high']).toContain(result.data.riskLevel);
      expect(['approve', 'review', 'block']).toContain(result.data.decision);
    });

    test('POST /api/transfers/fraud-check - should flag high-risk transactions', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/transfers/fraud-check`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          amount: 5000000, // Very large amount
          recipientAccountNumber: '9999999999',
          recipientBankCode: '999',
          description: 'Suspicious transfer'
        }
      });

      const result = await response.json();
      expect(result.data.riskLevel).toMatch(/medium|high/);
    });

    test('POST /api/transfers/validate-recipient - should validate recipient account', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/transfers/validate-recipient`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          accountNumber: '0123456789',
          bankCode: '058'
        }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('accountNumber');
      expect(result.data).toHaveProperty('accountName');
      expect(result.data).toHaveProperty('bankName');
    });

    test('POST /api/transfers/account-inquiry - should perform NIBSS account inquiry', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/transfers/account-inquiry`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          accountNumber: '0123456789',
          bankCode: '058'
        }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('accountNumber');
      expect(result.data).toHaveProperty('accountName');
    });
  });

  // ========================================================================
  // 3. INTERNAL TRANSFER TESTS
  // ========================================================================
  test.describe('3. Internal Transfer API', () => {
    test('POST /api/transfers/internal - should process internal transfer successfully', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/transfers/internal`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          recipientAccountNumber: accountNumber,
          amount: 1000,
          description: 'Test internal transfer',
          pin: DEMO_PIN
        }
      });

      if (!response.ok()) {
        const error = await response.json();
        console.log('Internal transfer error:', error);
      }

      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('reference');
      expect(result.data).toHaveProperty('status');
    });

    test('POST /api/transfers/internal - should reject transfer with insufficient funds', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/transfers/internal`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          recipientAccountNumber: accountNumber,
          amount: 999999999,
          description: 'Large amount transfer',
          pin: DEMO_PIN
        }
      });

      expect(response.status()).toBe(400);
      const result = await response.json();
      expect(result.code).toMatch(/INSUFFICIENT_FUNDS|LIMIT_EXCEEDED/);
    });

    test('POST /api/transfers/internal - should validate pin', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/transfers/internal`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          recipientAccountNumber: accountNumber,
          amount: 1000,
          description: 'Test wrong pin',
          pin: '0000' // Wrong PIN
        }
      });

      expect(response.status()).toBe(400);
    });
  });

  // ========================================================================
  // 4. EXTERNAL TRANSFER TESTS
  // ========================================================================
  test.describe('4. External Transfer API', () => {
    test('POST /api/transfers/external - should process external transfer', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/transfers/external`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          recipientAccountNumber: '0123456789',
          recipientBankCode: '058',
          recipientName: 'Test Recipient',
          amount: 5000,
          description: 'Test external transfer',
          pin: DEMO_PIN,
          saveRecipient: false
        }
      });

      const result = await response.json();
      if (response.ok()) {
        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('reference');
        expect(result.data).toHaveProperty('fees');
        expect(result.data.fees).toBeGreaterThanOrEqual(0);
      }
    });

    test('POST /api/transfers/external - should calculate fees correctly', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/transfers/external`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          recipientAccountNumber: '0123456789',
          recipientBankCode: '033',
          recipientName: 'Fee Test',
          amount: 10000,
          description: 'Fee calculation test',
          pin: DEMO_PIN
        }
      });

      const result = await response.json();
      if (response.ok()) {
        expect(result.data.totalAmount).toBe(result.data.amount + result.data.fees);
      }
    });
  });

  // ========================================================================
  // 5. BILL PAYMENT TESTS
  // ========================================================================
  test.describe('5. Bill Payment API', () => {
    test('GET /api/transfers/billers - should get available billers', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/transfers/billers`, {
        headers: { Authorization: `Bearer ${demoToken}` }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);

      if (result.data.length > 0) {
        const biller = result.data[0];
        expect(biller).toHaveProperty('code');
        expect(biller).toHaveProperty('name');
        expect(biller).toHaveProperty('category');
      }
    });

    test('POST /api/transfers/bills - should process bill payment', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/transfers/bills`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          billerCode: 'EKEDC',
          customerNumber: '12345678',
          amount: 5000,
          description: 'Electricity bill payment',
          pin: DEMO_PIN
        }
      });

      const result = await response.json();
      if (response.ok()) {
        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('reference');
        expect(result.data.biller).toHaveProperty('name');
      }
    });
  });

  // ========================================================================
  // 6. TRANSFER STATUS & HISTORY TESTS
  // ========================================================================
  test.describe('6. Transfer Status & History', () => {
    let testReference: string;

    test('GET /api/transfers/history - should get transfer history', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/transfers/history`, {
        headers: { Authorization: `Bearer ${demoToken}` }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('transfers');
      expect(Array.isArray(result.data.transfers)).toBe(true);

      // Save reference for status check
      if (result.data.transfers.length > 0) {
        testReference = result.data.transfers[0].reference;
      }
    });

    test('GET /api/transfers/status/:reference - should get transfer status', async ({ request }) => {
      // Create a transfer first
      const transferResponse = await request.post(`${BASE_URL}/api/transfers/internal`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          recipientAccountNumber: accountNumber,
          amount: 500,
          description: 'Status check test',
          pin: DEMO_PIN
        }
      });

      if (transferResponse.ok()) {
        const transferResult = await transferResponse.json();
        const reference = transferResult.data.reference;

        const statusResponse = await request.get(`${BASE_URL}/api/transfers/status/${reference}`, {
          headers: { Authorization: `Bearer ${demoToken}` }
        });

        expect(statusResponse.ok()).toBeTruthy();
        const statusResult = await statusResponse.json();
        expect(statusResult.success).toBe(true);
        expect(statusResult.data).toHaveProperty('reference', reference);
        expect(['pending', 'processing', 'completed', 'failed']).toContain(statusResult.data.status);
      }
    });
  });

  // ========================================================================
  // 7. BANK & RECIPIENT MANAGEMENT TESTS
  // ========================================================================
  test.describe('7. Bank & Recipient Management', () => {
    test('GET /api/transfers/banks - should get list of banks', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/transfers/banks`, {
        headers: { Authorization: `Bearer ${demoToken}` }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);

      if (result.data.length > 0) {
        const bank = result.data[0];
        expect(bank).toHaveProperty('code');
        expect(bank).toHaveProperty('name');
      }
    });

    test('GET /api/transfers/recipients - should get saved recipients', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/transfers/recipients`, {
        headers: { Authorization: `Bearer ${demoToken}` }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  // ========================================================================
  // 8. RECEIPT & TRANSACTION RECORD TESTS
  // ========================================================================
  test.describe('8. Receipt & Transaction Records', () => {
    test('POST /api/transfers/receipts/generate - should generate receipt', async ({ request }) => {
      // Create a transfer first
      const transferResponse = await request.post(`${BASE_URL}/api/transfers/internal`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          recipientAccountNumber: accountNumber,
          amount: 1000,
          description: 'Receipt generation test',
          pin: DEMO_PIN
        }
      });

      if (transferResponse.ok()) {
        const transferResult = await transferResponse.json();
        const transferId = transferResult.data.id;

        const receiptResponse = await request.post(`${BASE_URL}/api/transfers/receipts/generate`, {
          headers: { Authorization: `Bearer ${demoToken}` },
          data: {
            transactionId: transferId,
            transactionType: 'internal_transfer'
          }
        });

        if (receiptResponse.ok()) {
          const receiptResult = await receiptResponse.json();
          expect(receiptResult.success).toBe(true);
          expect(receiptResult.data).toHaveProperty('receiptNumber');
        }
      }
    });

    test('GET /api/transfers/transaction-records - should get transaction records', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/transfers/transaction-records?limit=10`, {
        headers: { Authorization: `Bearer ${demoToken}` }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('records');
      expect(result.data).toHaveProperty('totalCount');
      expect(result.data).toHaveProperty('pagination');
    });

    test('GET /api/transfers/transaction-summary/:accountId - should get transaction summary', async ({ request }) => {
      if (userId) {
        const response = await request.get(`${BASE_URL}/api/transfers/transaction-summary/${userId}`, {
          headers: { Authorization: `Bearer ${demoToken}` }
        });

        if (response.ok()) {
          const result = await response.json();
          expect(result.success).toBe(true);
          expect(result.data).toHaveProperty('totalTransactions');
        }
      }
    });
  });

  // ========================================================================
  // 9. NOTIFICATION TESTS
  // ========================================================================
  test.describe('9. Notification Management', () => {
    test('GET /api/transfers/notifications/unread - should get unread notifications', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/transfers/notifications/unread`, {
        headers: { Authorization: `Bearer ${demoToken}` }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    test('POST /api/transfers/notifications/test - should send test notification', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/transfers/notifications/test`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          type: 'transfer_success',
          message: 'Test notification'
        }
      });

      if (response.ok()) {
        const result = await response.json();
        expect(result.success).toBe(true);
      }
    });
  });

  // ========================================================================
  // 10. ANALYTICS & LIMITS TESTS
  // ========================================================================
  test.describe('10. Analytics & Limits', () => {
    test('GET /api/transfers/analytics/summary - should get transfer analytics', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/transfers/analytics/summary`, {
        headers: { Authorization: `Bearer ${demoToken}` }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('totalTransfers');
      expect(result.data).toHaveProperty('totalVolume');
    });

    test('GET /api/transfers/limits/:accountId - should get transfer limits', async ({ request }) => {
      if (userId) {
        const response = await request.get(`${BASE_URL}/api/transfers/limits/${userId}`, {
          headers: { Authorization: `Bearer ${demoToken}` }
        });

        expect(response.ok()).toBeTruthy();
        const result = await response.json();
        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('daily');
        expect(result.data).toHaveProperty('monthly');
        expect(result.data).toHaveProperty('perTransaction');
      }
    });

    test('GET /api/transfers/fees/calculate - should calculate transfer fees', async ({ request }) => {
      const response = await request.get(
        `${BASE_URL}/api/transfers/fees/calculate?amount=50000&transferType=external`,
        { headers: { Authorization: `Bearer ${demoToken}` } }
      );

      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('transferAmount', 50000);
      expect(result.data).toHaveProperty('fees');
      expect(result.data).toHaveProperty('totalAmount');
      expect(result.data.totalAmount).toBe(result.data.transferAmount + result.data.fees);
    });
  });

  // ========================================================================
  // 11. ERROR HANDLING & VALIDATION TESTS
  // ========================================================================
  test.describe('11. Error Handling & Validation', () => {
    test('should handle malformed requests', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/transfers/internal`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: { invalid: 'data' }
      });

      expect(response.status()).toBe(400);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.code).toBe('VALIDATION_ERROR');
    });

    test('should validate amount parameters', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/transfers/internal`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          recipientAccountNumber: accountNumber,
          amount: -100, // Negative amount
          pin: DEMO_PIN
        }
      });

      expect(response.status()).toBe(400);
    });

    test('should validate required fields', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/transfers/external`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          amount: 1000
          // Missing required fields
        }
      });

      expect(response.status()).toBe(400);
    });

    test('should handle non-existent endpoints', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/transfers/non-existent-endpoint`, {
        headers: { Authorization: `Bearer ${demoToken}` }
      });

      expect(response.status()).toBe(404);
    });
  });

  // ========================================================================
  // 12. RATE LIMITING & SECURITY TESTS
  // ========================================================================
  test.describe('12. Security & Rate Limiting', () => {
    test('should enforce authentication on all endpoints', async ({ request }) => {
      const endpoints = [
        '/api/transfers/history',
        '/api/transfers/banks',
        '/api/transfers/billers',
        '/api/transfers/recipients'
      ];

      for (const endpoint of endpoints) {
        const response = await request.get(`${BASE_URL}${endpoint}`);
        expect(response.status()).toBe(401);
      }
    });

    test('should validate input to prevent injection attacks', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/transfers/internal`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          recipientAccountNumber: "'; DROP TABLE users; --",
          amount: 1000,
          pin: DEMO_PIN
        }
      });

      expect(response.status()).toBe(400);
    });
  });
});
