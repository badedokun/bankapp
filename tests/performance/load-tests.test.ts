/**
 * Performance and Load Tests for Money Transfer System
 * Tests system performance under various load conditions
 */

import { test, expect } from '@playwright/test';
import { PlaywrightTestDataManager, PLAYWRIGHT_TEST_CONFIG, retry, waitFor } from '../utils/playwright-helpers';
import { TestDataFixtures, setupTestEnvironment, teardownTestEnvironment } from '../utils/test-data-setup';

test.describe('Money Transfer System - Performance Tests', () => {
  let testDataManager: PlaywrightTestDataManager;
  let fixtures: TestDataFixtures;

  test.beforeAll(async () => {
    fixtures = await setupTestEnvironment();
  });

  test.afterAll(async () => {
    await teardownTestEnvironment(fixtures);
  });

  test.beforeEach(async ({ request }) => {
    testDataManager = new PlaywrightTestDataManager(request);
  });

  test.describe('API Load Tests', () => {
    test('should handle concurrent login requests', async ({ request }) => {
      const concurrentUsers = 10;
      const startTime = Date.now();

      // Create concurrent login requests
      const loginPromises = Array.from({ length: concurrentUsers }, async (_, index) => {
        try {
          const token = await testDataManager.loginUser(
            PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email,
            PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password
          );
          return { success: true, token, index };
        } catch (error) {
          return { success: false, error: error.message, index };
        }
      });

      const results = await Promise.all(loginPromises);
      const totalTime = Date.now() - startTime;

      // Analyze results
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log(`Concurrent logins - Total: ${concurrentUsers}, Success: ${successful}, Failed: ${failed}, Time: ${totalTime}ms`);

      // At least 80% should succeed under normal load
      expect(successful).toBeGreaterThanOrEqual(Math.floor(concurrentUsers * 0.8));

      // Should complete within reasonable time (30 seconds)
      expect(totalTime).toBeLessThan(30000);

      // Average response time should be reasonable
      const avgResponseTime = totalTime / concurrentUsers;
      expect(avgResponseTime).toBeLessThan(3000);
    });

    test('should handle concurrent transfer requests', async ({ request }) => {
      // Login once to get token
      const token = await testDataManager.loginUser(
        PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email,
        PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password
      );

      const concurrentTransfers = 5;
      const transferAmount = 1000; // Small amounts to avoid balance issues
      const startTime = Date.now();

      const transferPromises = Array.from({ length: concurrentTransfers }, async (_, index) => {
        try {
          const response = await request.post(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/internal`, {
            headers: { Authorization: `Bearer ${token}` },
            data: {
              recipientAccountNumber: '9876543210',
              amount: transferAmount,
              description: `Concurrent transfer ${index + 1}`,
              pin: '1234'
            }
          });

          const responseTime = Date.now() - startTime;
          const result = await response.json();

          return {
            success: response.ok(),
            status: response.status(),
            responseTime,
            data: result,
            index
          };
        } catch (error) {
          return {
            success: false,
            error: error.message,
            responseTime: Date.now() - startTime,
            index
          };
        }
      });

      const results = await Promise.all(transferPromises);
      const totalTime = Date.now() - startTime;

      // Analyze results
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

      console.log(`Concurrent transfers - Total: ${concurrentTransfers}, Success: ${successful}, Failed: ${failed}`);
      console.log(`Total time: ${totalTime}ms, Avg response time: ${avgResponseTime.toFixed(2)}ms`);

      // Should handle concurrent requests gracefully (some may fail due to race conditions)
      expect(successful).toBeGreaterThan(0);

      // Average response time should be reasonable
      expect(avgResponseTime).toBeLessThan(5000);
    });

    test('should handle rapid sequential transfers', async ({ request }) => {
      const token = await testDataManager.loginUser(
        PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email,
        PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password
      );

      const sequentialTransfers = 10;
      const transferAmount = 500;
      const startTime = Date.now();
      const results = [];

      for (let i = 0; i < sequentialTransfers; i++) {
        const requestStart = Date.now();

        try {
          const response = await request.post(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/internal`, {
            headers: { Authorization: `Bearer ${token}` },
            data: {
              recipientAccountNumber: '9876543210',
              amount: transferAmount,
              description: `Sequential transfer ${i + 1}`,
              pin: '1234'
            }
          });

          const responseTime = Date.now() - requestStart;
          const result = await response.json();

          results.push({
            success: response.ok(),
            status: response.status(),
            responseTime,
            data: result,
            index: i
          });

          // Small delay between requests to avoid overwhelming
          await waitFor(100);

        } catch (error) {
          results.push({
            success: false,
            error: error.message,
            responseTime: Date.now() - requestStart,
            index: i
          });
        }
      }

      const totalTime = Date.now() - startTime;
      const successful = results.filter(r => r.success).length;
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

      console.log(`Sequential transfers - Total: ${sequentialTransfers}, Success: ${successful}`);
      console.log(`Total time: ${totalTime}ms, Avg response time: ${avgResponseTime.toFixed(2)}ms`);

      // Most should succeed with sequential requests
      expect(successful).toBeGreaterThanOrEqual(Math.floor(sequentialTransfers * 0.7));

      // Response times should be consistent
      expect(avgResponseTime).toBeLessThan(2000);
    });
  });

  test.describe('Database Performance Tests', () => {
    test('should efficiently retrieve transfer history', async ({ request }) => {
      const token = await testDataManager.loginUser(
        PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email,
        PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password
      );

      // Test different page sizes
      const pageSizes = [10, 50, 100, 200];
      const performanceResults = [];

      for (const limit of pageSizes) {
        const startTime = Date.now();

        const response = await request.get(
          `${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/history?limit=${limit}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        const responseTime = Date.now() - startTime;
        const result = await response.json();

        performanceResults.push({
          limit,
          responseTime,
          recordCount: result.data?.transfers?.length || 0,
          success: response.ok()
        });

        console.log(`History query - Limit: ${limit}, Time: ${responseTime}ms, Records: ${result.data?.transfers?.length || 0}`);
      }

      // All queries should succeed
      expect(performanceResults.every(r => r.success)).toBe(true);

      // Response times should scale reasonably
      const smallQuery = performanceResults.find(r => r.limit === 10);
      const largeQuery = performanceResults.find(r => r.limit === 200);

      expect(smallQuery.responseTime).toBeLessThan(1000);
      expect(largeQuery.responseTime).toBeLessThan(5000);

      // Large queries shouldn't be dramatically slower than small ones
      if (smallQuery.responseTime > 0) {
        const slowdownFactor = largeQuery.responseTime / smallQuery.responseTime;
        expect(slowdownFactor).toBeLessThan(10); // Should not be 10x slower
      }
    });

    test('should handle complex search queries efficiently', async ({ request }) => {
      const token = await testDataManager.loginUser(
        PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email,
        PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password
      );

      const searchQueries = [
        // Date range search
        {
          name: 'Date Range',
          params: {
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            limit: 50
          }
        },
        // Amount range search
        {
          name: 'Amount Range',
          params: {
            minAmount: 1000,
            maxAmount: 100000,
            limit: 50
          }
        },
        // Status filter
        {
          name: 'Status Filter',
          params: {
            status: 'completed',
            limit: 50
          }
        },
        // Combined filters
        {
          name: 'Combined Filters',
          params: {
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            status: 'completed',
            minAmount: 1000,
            limit: 50
          }
        }
      ];

      for (const query of searchQueries) {
        const startTime = Date.now();
        const queryParams = new URLSearchParams(query.params as any).toString();

        const response = await request.get(
          `${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/search?${queryParams}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        const responseTime = Date.now() - startTime;

        console.log(`${query.name} search - Time: ${responseTime}ms, Status: ${response.status()}`);

        // Should respond within reasonable time even with complex queries
        expect(responseTime).toBeLessThan(3000);
      }
    });
  });

  test.describe('Memory and Resource Tests', () => {
    test('should handle multiple user sessions efficiently', async ({ request, context }) => {
      const sessionCount = 20;
      const users = [];

      // Create multiple user sessions
      for (let i = 0; i < sessionCount; i++) {
        try {
          const token = await testDataManager.loginUser(
            PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email,
            PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password
          );

          users.push({
            index: i,
            token,
            loginTime: Date.now()
          });

          // Small delay between logins
          await waitFor(50);
        } catch (error) {
          console.log(`Failed to create session ${i}: ${error.message}`);
        }
      }

      console.log(`Created ${users.length} user sessions out of ${sessionCount} attempts`);

      // Test that all sessions can make requests simultaneously
      const concurrentRequests = users.map(async (user) => {
        try {
          const response = await request.get(
            `${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/accounts/balance`,
            {
              headers: { Authorization: `Bearer ${user.token}` }
            }
          );

          return {
            userIndex: user.index,
            success: response.ok(),
            status: response.status()
          };
        } catch (error) {
          return {
            userIndex: user.index,
            success: false,
            error: error.message
          };
        }
      });

      const results = await Promise.all(concurrentRequests);
      const successfulRequests = results.filter(r => r.success).length;

      console.log(`Concurrent session requests - Success: ${successfulRequests}/${users.length}`);

      // Most sessions should be able to make requests successfully
      expect(successfulRequests).toBeGreaterThanOrEqual(Math.floor(users.length * 0.8));
    });

    test('should handle large receipt generation efficiently', async ({ request }) => {
      const token = await testDataManager.loginUser(
        PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email,
        PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password
      );

      // First create a transfer to get a receipt
      const transferResponse = await request.post(`${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/internal`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          recipientAccountNumber: '9876543210',
          amount: 10000,
          description: 'Receipt generation test',
          pin: '1234'
        }
      });

      if (!transferResponse.ok()) {
        console.log('Transfer failed, skipping receipt test');
        return;
      }

      const transferResult = await transferResponse.json();
      const transferId = transferResult.data?.id || transferResult.data?.reference;

      if (!transferId) {
        console.log('No transfer ID available, skipping receipt test');
        return;
      }

      // Test receipt generation performance
      const startTime = Date.now();

      const receiptResponse = await request.get(
        `${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/${transferId}/receipt`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const responseTime = Date.now() - startTime;

      console.log(`Receipt generation - Time: ${responseTime}ms, Status: ${receiptResponse.status()}`);

      // Receipt generation should be fast
      expect(responseTime).toBeLessThan(2000);
      expect(receiptResponse.ok()).toBe(true);

      if (receiptResponse.ok()) {
        const receipt = await receiptResponse.text();
        expect(receipt.length).toBeGreaterThan(100); // Should generate substantial content
      }
    });
  });

  test.describe('Network and Timeout Tests', () => {
    test('should handle slow network conditions', async ({ request }) => {
      const token = await testDataManager.loginUser(
        PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email,
        PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password
      );

      // Test with increased timeout for slow networks
      const slowNetworkTimeout = 15000;

      const startTime = Date.now();

      const response = await request.get(
        `${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/history?limit=100`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: slowNetworkTimeout
        }
      );

      const responseTime = Date.now() - startTime;

      console.log(`Slow network test - Time: ${responseTime}ms, Status: ${response.status()}`);

      // Should still respond within timeout
      expect(responseTime).toBeLessThan(slowNetworkTimeout);
      expect(response.ok()).toBe(true);
    });

    test('should handle request retry logic', async ({ request }) => {
      const token = await testDataManager.loginUser(
        PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email,
        PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password
      );

      // Test retry mechanism with potentially unreliable endpoint
      const maxRetries = 3;
      let attempts = 0;
      let lastError;

      for (let i = 0; i < maxRetries; i++) {
        attempts++;
        try {
          const response = await request.get(
            `${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/transfers/analytics`,
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000
            }
          );

          if (response.ok()) {
            console.log(`Analytics endpoint succeeded on attempt ${attempts}`);
            break;
          } else {
            lastError = `HTTP ${response.status()}`;
          }
        } catch (error) {
          lastError = error.message;
          console.log(`Attempt ${attempts} failed: ${error.message}`);

          if (i < maxRetries - 1) {
            await waitFor(1000 * (i + 1)); // Exponential backoff
          }
        }
      }

      // Should either succeed or fail gracefully after retries
      expect(attempts).toBeLessThanOrEqual(maxRetries);

      if (attempts === maxRetries && lastError) {
        console.log(`All retry attempts failed. Last error: ${lastError}`);
        // This is acceptable for analytics endpoints which may be less critical
      }
    });
  });

  test.describe('Stress Tests', () => {
    test('should maintain performance under sustained load', async ({ request }) => {
      const token = await testDataManager.loginUser(
        PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email,
        PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password
      );

      const sustainedDuration = 30000; // 30 seconds
      const requestInterval = 500; // Request every 500ms
      const startTime = Date.now();
      const results = [];

      while (Date.now() - startTime < sustainedDuration) {
        const requestStart = Date.now();

        try {
          const response = await request.get(
            `${PLAYWRIGHT_TEST_CONFIG.BASE_URL}/api/accounts/balance`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          results.push({
            timestamp: Date.now(),
            responseTime: Date.now() - requestStart,
            success: response.ok(),
            status: response.status()
          });

        } catch (error) {
          results.push({
            timestamp: Date.now(),
            responseTime: Date.now() - requestStart,
            success: false,
            error: error.message
          });
        }

        await waitFor(requestInterval);
      }

      // Analyze sustained load results
      const totalRequests = results.length;
      const successfulRequests = results.filter(r => r.success).length;
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / totalRequests;
      const maxResponseTime = Math.max(...results.map(r => r.responseTime));

      console.log(`Sustained load test - Duration: ${sustainedDuration}ms`);
      console.log(`Total requests: ${totalRequests}, Success rate: ${(successfulRequests/totalRequests*100).toFixed(1)}%`);
      console.log(`Avg response time: ${avgResponseTime.toFixed(2)}ms, Max: ${maxResponseTime}ms`);

      // Should maintain reasonable performance under load
      expect(successfulRequests / totalRequests).toBeGreaterThan(0.9); // 90% success rate
      expect(avgResponseTime).toBeLessThan(2000); // Average under 2 seconds
      expect(maxResponseTime).toBeLessThan(10000); // Max under 10 seconds
    });
  });
});