/**
 * Comprehensive API Integration Tests for Money Transfer System
 * Tests all transfer endpoints and validates frontend-backend integration
 */

import { test, expect } from '@playwright/test';
import { PlaywrightTestDataManager, PLAYWRIGHT_TEST_CONFIG } from '../utils/playwright-helpers';

test.describe('Money Transfer API Integration Tests', () => {
  let testDataManager: PlaywrightTestDataManager;
  let adminToken: string;
  let demoToken: string;

  test.beforeAll(async ({ request }) => {
    testDataManager = new PlaywrightTestDataManager(request);

    // Login admin and demo users
    adminToken = await testDataManager.loginUser(
      PLAYWRIGHT_TEST_CONFIG.ADMIN_USER.email,
      PLAYWRIGHT_TEST_CONFIG.ADMIN_USER.password
    );

    demoToken = await testDataManager.loginUser(
      PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email,
      PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password
    );
  });

  test.describe('Authentication & Authorization', () => {
    test('should authenticate users successfully', async () => {
      expect(adminToken).toBeTruthy();
      expect(demoToken).toBeTruthy();
    });

    test('should reject requests without token', async ({ request }) => {
      const response = await request.get(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/history`);
      expect(response.status()).toBe(401);
    });

    test('should reject requests with invalid token', async ({ request }) => {
      const response = await request.get(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/history`, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Account Validation API', () => {
    test('should validate recipient account successfully', async ({ request }) => {
      const response = await request.post(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/validate-recipient`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          accountNumber: PLAYWRIGHT_TEST_CONFIG.TEST_RECIPIENTS.VALID_GTB.accountNumber,
          bankCode: PLAYWRIGHT_TEST_CONFIG.TEST_RECIPIENTS.VALID_GTB.bankCode
        }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();

      expect(result).toHaveProperty('success', true);
      expect(result.data).toHaveProperty('accountNumber');
      expect(result.data).toHaveProperty('accountName');
      expect(result.data).toHaveProperty('bankName');
      expect(result.data).toHaveProperty('isValid', true);
    });

    test('should handle invalid account validation', async ({ request }) => {
      const response = await request.post(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/validate-recipient`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          accountNumber: '0000000000', // Invalid account
          bankCode: '058'
        }
      });

      expect(response.status()).toBe(400);
      const result = await response.json();
      expect(result.success).toBe(false);
    });

    test('should validate input parameters', async ({ request }) => {
      const response = await request.post(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/validate-recipient`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          accountNumber: '123', // Too short
          bankCode: '058'
        }
      });

      expect(response.status()).toBe(400);
      const result = await response.json();
      expect(result.code).toBe('VALIDATION_ERROR');
    });
  });

  test.describe('Internal Transfer API', () => {
    test('should process internal transfer successfully', async ({ request }) => {
      const transferData = {
        recipientAccountId: '19769e1e-b7c7-437a-b0c4-c242d82e8e3f', // Admin account ID
        amount: parseFloat(PLAYWRIGHT_TEST_CONFIG.AMOUNTS.SMALL),
        description: 'Test internal transfer',
        pin: PLAYWRIGHT_TEST_CONFIG.DEMO_USER.pin
      };

      const response = await request.post(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/internal`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: transferData
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('reference');
      expect(result.data).toHaveProperty('status');
      expect(result.data.amount).toBe(transferData.amount);
      expect(result.data.recipient).toHaveProperty('name');
    });

    test('should reject internal transfer with insufficient funds', async ({ request }) => {
      const transferData = {
        recipientAccountId: '19769e1e-b7c7-437a-b0c4-c242d82e8e3f',
        amount: 999999999, // Very large amount
        description: 'Test insufficient funds',
        pin: PLAYWRIGHT_TEST_CONFIG.DEMO_USER.pin
      };

      const response = await request.post(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/internal`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: transferData
      });

      expect(response.status()).toBe(400);
      const result = await response.json();
      expect(result.code).toBe('INSUFFICIENT_FUNDS');
    });

    test('should validate internal transfer parameters', async ({ request }) => {
      const response = await request.post(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/internal`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          recipientAccountId: 'invalid-id',
          amount: -100, // Negative amount
          pin: '1234'
        }
      });

      expect(response.status()).toBe(400);
      const result = await response.json();
      expect(result.code).toBe('VALIDATION_ERROR');
    });
  });

  test.describe('External Transfer API', () => {
    test('should process external transfer successfully', async ({ request }) => {
      const transferData = {
        recipientAccountNumber: PLAYWRIGHT_TEST_CONFIG.TEST_RECIPIENTS.VALID_GTB.accountNumber,
        recipientBankCode: PLAYWRIGHT_TEST_CONFIG.TEST_RECIPIENTS.VALID_GTB.bankCode,
        recipientName: 'Test Recipient',
        amount: parseFloat(PLAYWRIGHT_TEST_CONFIG.AMOUNTS.SMALL),
        description: 'Test external transfer',
        pin: PLAYWRIGHT_TEST_CONFIG.DEMO_USER.pin,
        saveRecipient: false
      };

      const response = await request.post(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/external`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: transferData
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('reference');
      expect(result.data).toHaveProperty('status');
      expect(result.data).toHaveProperty('fees');
      expect(result.data.recipient.accountNumber).toBe(transferData.recipientAccountNumber);
    });

    test('should include transfer fees in external transfer', async ({ request }) => {
      const transferData = {
        recipientAccountNumber: PLAYWRIGHT_TEST_CONFIG.TEST_RECIPIENTS.VALID_UBA.accountNumber,
        recipientBankCode: PLAYWRIGHT_TEST_CONFIG.TEST_RECIPIENTS.VALID_UBA.bankCode,
        recipientName: 'Test Recipient',
        amount: parseFloat(PLAYWRIGHT_TEST_CONFIG.AMOUNTS.MEDIUM),
        description: 'Test external transfer with fees',
        pin: PLAYWRIGHT_TEST_CONFIG.DEMO_USER.pin
      };

      const response = await request.post(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/external`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: transferData
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();

      expect(result.data.fees).toBeGreaterThan(0);
      expect(result.data.totalAmount).toBe(result.data.amount + result.data.fees);
    });
  });

  test.describe('Bill Payment API', () => {
    test('should process bill payment successfully', async ({ request }) => {
      const billData = {
        billerCode: 'EKEDC',
        customerNumber: '12345678',
        amount: parseFloat(PLAYWRIGHT_TEST_CONFIG.AMOUNTS.SMALL),
        description: 'Electricity bill payment',
        pin: PLAYWRIGHT_TEST_CONFIG.DEMO_USER.pin
      };

      const response = await request.post(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/bills`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: billData
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('reference');
      expect(result.data.biller).toHaveProperty('name');
      expect(result.data.customer).toHaveProperty('number', billData.customerNumber);
    });

    test('should get available billers', async ({ request }) => {
      const response = await request.get(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/billers`, {
        headers: { Authorization: `Bearer ${demoToken}` }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      // Check biller structure
      const biller = result.data[0];
      expect(biller).toHaveProperty('code');
      expect(biller).toHaveProperty('name');
      expect(biller).toHaveProperty('category');
    });
  });

  test.describe('International Transfer API', () => {
    test('should process international transfer successfully', async ({ request }) => {
      const internationalData = {
        recipientName: 'John Doe',
        recipientIban: 'GB82WEST12345698765432',
        recipientSwiftCode: 'WESTGB22XXX',
        recipientCountry: 'GB',
        recipientCity: 'London',
        recipientAddress: '123 Main Street, London',
        amount: parseFloat(PLAYWRIGHT_TEST_CONFIG.AMOUNTS.MEDIUM),
        purpose: 'Personal transfer',
        sourceOfFunds: 'Salary',
        description: 'Test international transfer',
        pin: PLAYWRIGHT_TEST_CONFIG.DEMO_USER.pin
      };

      const response = await request.post(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/international`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: internationalData
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('reference');
      expect(result.data).toHaveProperty('fees');
      expect(result.data.recipient.name).toBe(internationalData.recipientName);
      expect(result.data.fees).toBeGreaterThan(0); // International transfers should have fees
    });

    test('should validate international transfer compliance', async ({ request }) => {
      const highRiskData = {
        recipientName: 'Test User',
        recipientIban: 'AF1234567890123456789012',
        recipientSwiftCode: 'TESTAFXX',
        recipientCountry: 'AF', // High-risk country
        recipientCity: 'Kabul',
        recipientAddress: 'Test Address',
        amount: 100000, // Large amount
        purpose: 'Investment',
        sourceOfFunds: 'Business',
        pin: PLAYWRIGHT_TEST_CONFIG.DEMO_USER.pin
      };

      const response = await request.post(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/international`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: highRiskData
      });

      expect(response.status()).toBe(400);
      const result = await response.json();
      expect(result.message).toContain('compliance');
    });
  });

  test.describe('Scheduled Payment API', () => {
    test('should create scheduled payment successfully', async ({ request }) => {
      const scheduledData = {
        transferType: 'internal',
        recipientAccountId: '19769e1e-b7c7-437a-b0c4-c242d82e8e3f',
        amount: parseFloat(PLAYWRIGHT_TEST_CONFIG.AMOUNTS.SMALL),
        description: 'Monthly salary transfer',
        frequency: 'monthly',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Next year
        pin: PLAYWRIGHT_TEST_CONFIG.DEMO_USER.pin
      };

      const response = await request.post(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/scheduled`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: scheduledData
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('status', 'active');
      expect(result.data.frequency).toBe(scheduledData.frequency);
      expect(new Date(result.data.nextExecutionDate)).toBeInstanceOf(Date);
    });

    test('should get scheduled payments list', async ({ request }) => {
      const response = await request.get(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/scheduled`, {
        headers: { Authorization: `Bearer ${demoToken}` }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  test.describe('Transfer Status & History', () => {
    test('should get transfer history', async ({ request }) => {
      const response = await request.get(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/history`, {
        headers: { Authorization: `Bearer ${demoToken}` }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('transfers');
      expect(Array.isArray(result.data.transfers)).toBe(true);
    });

    test('should track transfer status', async ({ request }) => {
      // First create a transfer
      const transferData = {
        recipientAccountId: '19769e1e-b7c7-437a-b0c4-c242d82e8e3f',
        amount: 5000,
        description: 'Status tracking test',
        pin: PLAYWRIGHT_TEST_CONFIG.DEMO_USER.pin
      };

      const transferResponse = await request.post(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/internal`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: transferData
      });

      expect(transferResponse.ok()).toBeTruthy();
      const transferResult = await transferResponse.json();
      const reference = transferResult.data.reference;

      // Then check status
      const statusResponse = await request.get(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/status/${reference}`, {
        headers: { Authorization: `Bearer ${demoToken}` }
      });

      expect(statusResponse.ok()).toBeTruthy();
      const statusResult = await statusResponse.json();

      expect(statusResult.success).toBe(true);
      expect(statusResult.data).toHaveProperty('reference', reference);
      expect(statusResult.data).toHaveProperty('status');
      expect(['pending', 'processing', 'completed', 'failed']).toContain(statusResult.data.status);
    });
  });

  test.describe('Receipt Management API', () => {
    test('should generate receipt for transfer', async ({ request }) => {
      // First create a transfer
      const transferData = {
        recipientAccountId: '19769e1e-b7c7-437a-b0c4-c242d82e8e3f',
        amount: 10000,
        description: 'Receipt generation test',
        pin: PLAYWRIGHT_TEST_CONFIG.DEMO_USER.pin
      };

      const transferResponse = await request.post(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/internal`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: transferData
      });

      const transferResult = await transferResponse.json();
      const transferId = transferResult.data.id;

      // Generate receipt
      const receiptResponse = await request.post(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/receipts/generate`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          transactionId: transferId,
          transactionType: 'internal_transfer'
        }
      });

      expect(receiptResponse.ok()).toBeTruthy();
      const receiptResult = await receiptResponse.json();

      expect(receiptResult.success).toBe(true);
      expect(receiptResult.data).toHaveProperty('id');
      expect(receiptResult.data).toHaveProperty('receiptNumber');
      expect(receiptResult.data).toHaveProperty('transactionId', transferId);
    });

    test('should search transaction records', async ({ request }) => {
      const response = await request.get(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/transaction-records?limit=10`, {
        headers: { Authorization: `Bearer ${demoToken}` }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('records');
      expect(result.data).toHaveProperty('totalCount');
      expect(result.data).toHaveProperty('pagination');
    });
  });

  test.describe('Analytics & Limits API', () => {
    test('should get transfer analytics', async ({ request }) => {
      const response = await request.get(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/analytics/summary`, {
        headers: { Authorization: `Bearer ${demoToken}` }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('totalTransfers');
      expect(result.data).toHaveProperty('totalVolume');
      expect(result.data).toHaveProperty('transfersByType');
    });

    test('should get transfer limits', async ({ request }) => {
      const response = await request.get(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/limits/06cd7648-a556-41b1-9ffa-a831ff75b982`, {
        headers: { Authorization: `Bearer ${demoToken}` }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('daily');
      expect(result.data).toHaveProperty('monthly');
      expect(result.data).toHaveProperty('perTransaction');
    });

    test('should calculate transfer fees', async ({ request }) => {
      const response = await request.get(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/fees/calculate?amount=50000&transferType=external`, {
        headers: { Authorization: `Bearer ${demoToken}` }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('transferAmount', 50000);
      expect(result.data).toHaveProperty('fees');
      expect(result.data).toHaveProperty('totalAmount');
    });
  });

  test.describe('Fraud Detection API', () => {
    test('should perform fraud analysis', async ({ request }) => {
      const fraudData = {
        amount: parseFloat(PLAYWRIGHT_TEST_CONFIG.AMOUNTS.LARGE),
        recipientAccountNumber: '1234567890',
        recipientBankCode: '058',
        description: 'Large transfer for fraud testing'
      };

      const response = await request.post(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/fraud-check`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: fraudData
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('riskScore');
      expect(result.data).toHaveProperty('riskLevel');
      expect(result.data).toHaveProperty('decision');
      expect(result.data).toHaveProperty('flags');
      expect(typeof result.data.riskScore).toBe('number');
      expect(['low', 'medium', 'high']).toContain(result.data.riskLevel);
      expect(['approve', 'review', 'block']).toContain(result.data.decision);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle malformed requests gracefully', async ({ request }) => {
      const response = await request.post(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/internal`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: { invalid: 'data' }
      });

      expect(response.status()).toBe(400);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.code).toBe('VALIDATION_ERROR');
    });

    test('should handle non-existent endpoints', async ({ request }) => {
      const response = await request.get(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/non-existent`, {
        headers: { Authorization: `Bearer ${demoToken}` }
      });

      expect(response.status()).toBe(404);
    });

    test('should handle server errors gracefully', async ({ request }) => {
      // This test would typically involve mocking server errors
      // For now, we'll test invalid data that might cause server errors
      const response = await request.post(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/internal`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          recipientAccountId: 'definitely-not-a-uuid',
          amount: 'not-a-number',
          pin: '1234'
        }
      });

      expect(response.status()).toBeBetween(400, 500);
    });
  });
});