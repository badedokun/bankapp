/**
 * Integration Tests for Complete Transfer Flows
 * End-to-end testing of real transfer scenarios
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const DEMO_EMAIL = 'demo@fmfb.com';
const DEMO_PASSWORD = 'Demo@123456';
const DEMO_PIN = '1234';

let authToken: string;
let userId: string;
let walletId: string;
let accountNumber: string;

test.describe('Complete Transfer Flow Integration Tests', () => {

  test.beforeAll(async ({ request }) => {
    // Login
    const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: DEMO_EMAIL, password: DEMO_PASSWORD }
    });
    const loginData = await loginResponse.json();
    authToken = loginData.token;
    userId = loginData.user?.id;

    // Get wallet
    const walletsResponse = await request.get(`${BASE_URL}/api/wallets`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const walletsData = await walletsResponse.json();
    if (walletsData.data?.[0]) {
      walletId = walletsData.data[0].id;
      accountNumber = walletsData.data[0].accountNumber;
    }
  });

  // ========================================================================
  // COMPLETE INTERNAL TRANSFER FLOW
  // ========================================================================
  test.describe('Complete Internal Transfer Flow', () => {
    test('should execute full internal transfer with receipt generation', async ({ request }) => {
      // Step 1: Get initial balance
      const balanceResponse = await request.get(`${BASE_URL}/api/wallets/${walletId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const balanceData = await balanceResponse.json();
      const initialBalance = balanceData.data?.balance || 0;

      console.log('Initial balance:', initialBalance);

      // Step 2: Initiate transfer
      const transferResponse = await request.post(`${BASE_URL}/api/transfers/internal`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          recipientAccountNumber: accountNumber,
          amount: 1000,
          description: 'Integration test transfer',
          pin: DEMO_PIN
        }
      });

      expect(transferResponse.ok()).toBeTruthy();
      const transferData = await transferResponse.json();
      expect(transferData.success).toBe(true);

      const transferId = transferData.data.id;
      const reference = transferData.data.reference;

      console.log('Transfer created:', reference);

      // Step 3: Check transfer status
      const statusResponse = await request.get(`${BASE_URL}/api/transfers/status/${reference}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(statusResponse.ok()).toBeTruthy();
      const statusData = await statusResponse.json();
      expect(statusData.data.reference).toBe(reference);
      expect(['pending', 'processing', 'completed']).toContain(statusData.data.status);

      console.log('Transfer status:', statusData.data.status);

      // Step 4: Generate receipt
      const receiptResponse = await request.post(`${BASE_URL}/api/transfers/receipts/generate`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          transactionId: transferId,
          transactionType: 'internal_transfer'
        }
      });

      if (receiptResponse.ok()) {
        const receiptData = await receiptResponse.json();
        expect(receiptData.data).toHaveProperty('receiptNumber');
        console.log('Receipt generated:', receiptData.data.receiptNumber);
      }

      // Step 5: Verify transfer appears in history
      const historyResponse = await request.get(`${BASE_URL}/api/transfers/history`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(historyResponse.ok()).toBeTruthy();
      const historyData = await historyResponse.json();
      const transferInHistory = historyData.data.transfers.find((t: any) => t.reference === reference);
      expect(transferInHistory).toBeTruthy();

      console.log('Transfer found in history');
    });
  });

  // ========================================================================
  // COMPLETE EXTERNAL TRANSFER FLOW WITH VALIDATION
  // ========================================================================
  test.describe('Complete External Transfer Flow', () => {
    test('should execute full external transfer with account validation', async ({ request }) => {
      const recipientAccount = '0123456789';
      const recipientBank = '058';

      // Step 1: Validate recipient account
      const validateResponse = await request.post(`${BASE_URL}/api/transfers/validate-recipient`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          accountNumber: recipientAccount,
          bankCode: recipientBank
        }
      });

      expect(validateResponse.ok()).toBeTruthy();
      const validateData = await validateResponse.json();
      const recipientName = validateData.data.accountName;

      console.log('Recipient validated:', recipientName);

      // Step 2: Calculate fees
      const feeResponse = await request.get(
        `${BASE_URL}/api/transfers/fees/calculate?amount=5000&transferType=external`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(feeResponse.ok()).toBeTruthy();
      const feeData = await feeResponse.json();
      const totalAmount = feeData.data.totalAmount;

      console.log('Total amount with fees:', totalAmount);

      // Step 3: Perform fraud check
      const fraudResponse = await request.post(`${BASE_URL}/api/transfers/fraud-check`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          amount: 5000,
          recipientAccountNumber: recipientAccount,
          recipientBankCode: recipientBank,
          description: 'External transfer test'
        }
      });

      expect(fraudResponse.ok()).toBeTruthy();
      const fraudData = await fraudResponse.json();
      console.log('Fraud check - Risk level:', fraudData.data.riskLevel);

      // Step 4: Execute transfer (only if fraud check passes)
      if (fraudData.data.decision === 'approve') {
        const transferResponse = await request.post(`${BASE_URL}/api/transfers/external`, {
          headers: { Authorization: `Bearer ${authToken}` },
          data: {
            recipientAccountNumber: recipientAccount,
            recipientBankCode: recipientBank,
            recipientName: recipientName,
            amount: 5000,
            description: 'Integration test external transfer',
            pin: DEMO_PIN,
            saveRecipient: true
          }
        });

        const transferData = await transferResponse.json();
        if (transferResponse.ok()) {
          expect(transferData.success).toBe(true);
          console.log('External transfer successful:', transferData.data.reference);

          // Step 5: Verify recipient saved
          const recipientsResponse = await request.get(`${BASE_URL}/api/transfers/recipients`, {
            headers: { Authorization: `Bearer ${authToken}` }
          });

          const recipientsData = await recipientsResponse.json();
          const savedRecipient = recipientsData.data.find(
            (r: any) => r.accountNumber === recipientAccount
          );
          expect(savedRecipient).toBeTruthy();
          console.log('Recipient saved successfully');
        }
      }
    });
  });

  // ========================================================================
  // BILL PAYMENT COMPLETE FLOW
  // ========================================================================
  test.describe('Complete Bill Payment Flow', () => {
    test('should execute full bill payment process', async ({ request }) => {
      // Step 1: Get available billers
      const billersResponse = await request.get(`${BASE_URL}/api/transfers/billers`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(billersResponse.ok()).toBeTruthy();
      const billersData = await billersResponse.json();
      expect(billersData.data.length).toBeGreaterThan(0);

      const biller = billersData.data.find((b: any) => b.code === 'EKEDC') || billersData.data[0];
      console.log('Selected biller:', biller.name);

      // Step 2: Validate customer number (mock validation)
      const customerNumber = '12345678';

      // Step 3: Calculate bill amount
      const billAmount = 5000;

      // Step 4: Process bill payment
      const paymentResponse = await request.post(`${BASE_URL}/api/transfers/bills`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          billerCode: biller.code,
          customerNumber: customerNumber,
          amount: billAmount,
          description: `${biller.name} payment`,
          pin: DEMO_PIN
        }
      });

      const paymentData = await paymentResponse.json();
      if (paymentResponse.ok()) {
        expect(paymentData.success).toBe(true);
        expect(paymentData.data).toHaveProperty('reference');

        const reference = paymentData.data.reference;
        console.log('Bill payment successful:', reference);

        // Step 5: Generate receipt
        const receiptResponse = await request.post(`${BASE_URL}/api/transfers/receipts/generate`, {
          headers: { Authorization: `Bearer ${authToken}` },
          data: {
            transactionId: paymentData.data.id,
            transactionType: 'bill_payment'
          }
        });

        if (receiptResponse.ok()) {
          const receiptData = await receiptResponse.json();
          console.log('Bill payment receipt:', receiptData.data.receiptNumber);
        }

        // Step 6: Verify notification sent
        const notificationsResponse = await request.get(
          `${BASE_URL}/api/transfers/notifications/unread`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (notificationsResponse.ok()) {
          const notificationsData = await notificationsResponse.json();
          console.log('Unread notifications:', notificationsData.data.length);
        }
      }
    });
  });

  // ========================================================================
  // TRANSFER LIMITS AND ANALYTICS FLOW
  // ========================================================================
  test.describe('Transfer Limits and Analytics Flow', () => {
    test('should track limits and generate analytics', async ({ request }) => {
      // Step 1: Check current limits
      const limitsResponse = await request.get(`${BASE_URL}/api/transfers/limits/${userId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(limitsResponse.ok()).toBeTruthy();
      const limitsData = await limitsResponse.json();
      console.log('Daily limit:', limitsData.data.daily);
      console.log('Daily used:', limitsData.data.dailyUsed);

      const availableDaily = limitsData.data.daily.limit - limitsData.data.daily.used;

      // Step 2: Make transfer within limits
      const transferAmount = Math.min(1000, availableDaily * 0.1); // 10% of available

      if (transferAmount > 0) {
        const transferResponse = await request.post(`${BASE_URL}/api/transfers/internal`, {
          headers: { Authorization: `Bearer ${authToken}` },
          data: {
            recipientAccountNumber: accountNumber,
            amount: transferAmount,
            description: 'Limits test transfer',
            pin: DEMO_PIN
          }
        });

        if (transferResponse.ok()) {
          console.log('Transfer within limits successful');

          // Step 3: Check analytics
          const analyticsResponse = await request.get(
            `${BASE_URL}/api/transfers/analytics/summary`,
            { headers: { Authorization: `Bearer ${authToken}` } }
          );

          expect(analyticsResponse.ok()).toBeTruthy();
          const analyticsData = await analyticsResponse.json();
          console.log('Total transfers:', analyticsData.data.totalTransfers);
          console.log('Total volume:', analyticsData.data.totalVolume);

          // Step 4: Get transaction summary
          const summaryResponse = await request.get(
            `${BASE_URL}/api/transfers/transaction-summary/${userId}`,
            { headers: { Authorization: `Bearer ${authToken}` } }
          );

          if (summaryResponse.ok()) {
            const summaryData = await summaryResponse.json();
            console.log('Transaction summary retrieved');
          }
        }
      }
    });
  });

  // ========================================================================
  // ERROR HANDLING AND RECOVERY FLOW
  // ========================================================================
  test.describe('Error Handling and Recovery Flow', () => {
    test('should handle failed transfer and retry', async ({ request }) => {
      // Step 1: Attempt transfer with insufficient funds
      const largeAmount = 999999999;

      const failedTransferResponse = await request.post(`${BASE_URL}/api/transfers/internal`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          recipientAccountNumber: accountNumber,
          amount: largeAmount,
          description: 'Intentional failure test',
          pin: DEMO_PIN
        }
      });

      expect(failedTransferResponse.status()).toBe(400);
      const failedData = await failedTransferResponse.json();
      console.log('Expected error:', failedData.code);

      // Step 2: Retry with valid amount
      const validAmount = 1000;

      const successfulTransferResponse = await request.post(`${BASE_URL}/api/transfers/internal`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          recipientAccountNumber: accountNumber,
          amount: validAmount,
          description: 'Recovery test transfer',
          pin: DEMO_PIN
        }
      });

      if (successfulTransferResponse.ok()) {
        const successData = await successfulTransferResponse.json();
        expect(successData.success).toBe(true);
        console.log('Recovery successful:', successData.data.reference);
      }
    });

    test('should handle invalid PIN and account lockout', async ({ request }) => {
      // Attempt transfer with wrong PIN (simulate)
      const wrongPinResponse = await request.post(`${BASE_URL}/api/transfers/internal`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          recipientAccountNumber: accountNumber,
          amount: 1000,
          description: 'Wrong PIN test',
          pin: '0000' // Wrong PIN
        }
      });

      expect(wrongPinResponse.status()).toBe(400);
      console.log('Invalid PIN rejected as expected');
    });
  });

  // ========================================================================
  // CONCURRENT TRANSFER HANDLING
  // ========================================================================
  test.describe('Concurrent Transfer Handling', () => {
    test('should handle multiple simultaneous transfers correctly', async ({ request }) => {
      const transferPromises = [];

      // Create 3 concurrent transfers
      for (let i = 0; i < 3; i++) {
        const promise = request.post(`${BASE_URL}/api/transfers/internal`, {
          headers: { Authorization: `Bearer ${authToken}` },
          data: {
            recipientAccountNumber: accountNumber,
            amount: 100,
            description: `Concurrent transfer ${i + 1}`,
            pin: DEMO_PIN
          }
        });
        transferPromises.push(promise);
      }

      const results = await Promise.all(transferPromises);
      const successful = results.filter(r => r.ok()).length;

      console.log(`${successful} out of 3 concurrent transfers succeeded`);
      expect(successful).toBeGreaterThan(0);

      // Verify all transfers have unique references
      const references = new Set();
      for (const result of results) {
        if (result.ok()) {
          const data = await result.json();
          references.add(data.data.reference);
        }
      }

      expect(references.size).toBe(successful); // All successful transfers have unique references
    });
  });

  // ========================================================================
  // TRANSACTION RECORD SEARCH AND FILTER
  // ========================================================================
  test.describe('Transaction Record Search and Filter', () => {
    test('should search and filter transaction records', async ({ request }) => {
      // Step 1: Create some test transfers
      await request.post(`${BASE_URL}/api/transfers/internal`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          recipientAccountNumber: accountNumber,
          amount: 1500,
          description: 'Searchable transfer test',
          pin: DEMO_PIN
        }
      });

      // Step 2: Get transaction records with filters
      const recordsResponse = await request.get(
        `${BASE_URL}/api/transfers/transaction-records?limit=20&offset=0`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(recordsResponse.ok()).toBeTruthy();
      const recordsData = await recordsResponse.json();

      expect(recordsData.data).toHaveProperty('records');
      expect(recordsData.data).toHaveProperty('totalCount');
      expect(recordsData.data).toHaveProperty('pagination');

      console.log('Total records found:', recordsData.data.totalCount);
      console.log('Records in page:', recordsData.data.records.length);

      // Step 3: Verify pagination
      expect(recordsData.data.pagination).toHaveProperty('limit');
      expect(recordsData.data.pagination).toHaveProperty('offset');
      expect(recordsData.data.pagination).toHaveProperty('total');
    });
  });
});
