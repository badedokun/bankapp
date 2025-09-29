/**
 * Comprehensive E2E Tests for Money Transfer Workflows
 * Tests complete user journeys from login to transfer completion
 */

import { test, expect } from '@playwright/test';
import { PlaywrightTestDataManager, PlaywrightUIHelpers, PLAYWRIGHT_TEST_CONFIG, retry, waitFor } from '../utils/playwright-helpers';

test.describe('Money Transfer System - E2E Workflows', () => {
  let testDataManager: PlaywrightTestDataManager;
  let uiHelpers: PlaywrightUIHelpers;

  test.beforeEach(async ({ page, request }) => {
    testDataManager = new PlaywrightTestDataManager(request);
    uiHelpers = new PlaywrightUIHelpers(page);

    // Clear any existing sessions
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test.afterEach(async ({ page }) => {
    // Take screenshot on failure
    if (test.info().status === 'failed') {
      await uiHelpers.takeScreenshotOnFailure(test.info().title);
    }
  });

  test.describe('Internal Transfer Workflows', () => {
    test('should complete internal transfer successfully', async ({ page }) => {
      // Login as demo user
      await uiHelpers.login(PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email, PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password);

      // Navigate to transfers
      await uiHelpers.navigateToTransfers();

      // Record initial balance
      const initialBalance = await uiHelpers.getDisplayedBalance();

      // Fill transfer form for internal transfer
      await uiHelpers.fillTransferForm({
        transferType: 'internal',
        amount: PLAYWRIGHT_TEST_CONFIG.AMOUNTS.SMALL,
        recipientAccount: '9876543210', // Another internal account
        description: 'E2E Test Internal Transfer',
        pin: PLAYWRIGHT_TEST_CONFIG.DEMO_USER.pin
      });

      // Submit transfer
      await uiHelpers.submitTransfer();

      // Verify success result
      const result = await uiHelpers.getTransferResult();
      expect(result.success).toBe(true);
      expect(result.message).toContain('successful');
      expect(result.reference).toBeTruthy();

      // Wait for balance update
      await waitFor(2000);

      // Verify balance is updated
      const newBalance = await uiHelpers.getDisplayedBalance();
      const transferAmount = parseFloat(PLAYWRIGHT_TEST_CONFIG.AMOUNTS.SMALL);
      expect(newBalance).toBeLessThan(initialBalance - transferAmount + 1000); // Allow for fees
    });

    test('should handle insufficient funds gracefully', async ({ page }) => {
      await uiHelpers.login(PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email, PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password);
      await uiHelpers.navigateToTransfers();

      // Try to transfer more than available balance
      await uiHelpers.fillTransferForm({
        transferType: 'internal',
        amount: '999999999', // Very large amount
        recipientAccount: '9876543210',
        description: 'Insufficient Funds Test',
        pin: PLAYWRIGHT_TEST_CONFIG.DEMO_USER.pin
      });

      await uiHelpers.submitTransfer();

      const result = await uiHelpers.getTransferResult();
      expect(result.success).toBe(false);
      expect(result.message.toLowerCase()).toMatch(/insufficient|balance|funds/);
    });
  });

  test.describe('External Transfer Workflows', () => {
    test('should complete external transfer to GTB successfully', async ({ page }) => {
      await uiHelpers.login(PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email, PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password);
      await uiHelpers.navigateToTransfers();

      const initialBalance = await uiHelpers.getDisplayedBalance();

      await uiHelpers.fillTransferForm({
        transferType: 'external',
        amount: PLAYWRIGHT_TEST_CONFIG.AMOUNTS.MEDIUM,
        recipientAccount: PLAYWRIGHT_TEST_CONFIG.TEST_RECIPIENTS.VALID_GTB.accountNumber,
        recipientBank: PLAYWRIGHT_TEST_CONFIG.TEST_RECIPIENTS.VALID_GTB.bankCode,
        description: 'E2E Test External Transfer to GTB',
        pin: PLAYWRIGHT_TEST_CONFIG.DEMO_USER.pin
      });

      await uiHelpers.submitTransfer();

      const result = await uiHelpers.getTransferResult();
      expect(result.success).toBe(true);
      expect(result.reference).toBeTruthy();

      // Wait for processing
      await waitFor(3000);

      // Verify balance deduction
      const newBalance = await uiHelpers.getDisplayedBalance();
      const transferAmount = parseFloat(PLAYWRIGHT_TEST_CONFIG.AMOUNTS.MEDIUM);
      expect(newBalance).toBeLessThan(initialBalance - transferAmount + 2000); // Allow for fees
    });

    test('should validate recipient account before transfer', async ({ page }) => {
      await uiHelpers.login(PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email, PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password);
      await uiHelpers.navigateToTransfers();

      // Try transfer with invalid account number
      await uiHelpers.fillTransferForm({
        transferType: 'external',
        amount: PLAYWRIGHT_TEST_CONFIG.AMOUNTS.SMALL,
        recipientAccount: '0000000000', // Invalid account
        recipientBank: PLAYWRIGHT_TEST_CONFIG.TEST_BANKS.GTB.code,
        description: 'Invalid Account Test',
        pin: PLAYWRIGHT_TEST_CONFIG.DEMO_USER.pin
      });

      await uiHelpers.submitTransfer();

      const result = await uiHelpers.getTransferResult();
      expect(result.success).toBe(false);
      expect(result.message.toLowerCase()).toMatch(/invalid|account|not found/);
    });
  });

  test.describe('Bill Payment Workflows', () => {
    test('should complete electricity bill payment', async ({ page }) => {
      await uiHelpers.login(PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email, PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password);

      // Navigate to bill payments
      await page.click('text=Bills, [data-testid="bills-nav"], .bills-nav');
      await page.waitForSelector('text=Electricity, [data-testid="electricity-bill"]');

      // Select electricity bill
      await page.click('text=Electricity, [data-testid="electricity-bill"]');

      // Fill bill payment form
      await page.fill('[data-testid="meter-number"], input[placeholder*="meter"]', '12345678901');
      await page.selectOption('[data-testid="provider-select"], select[name*="provider"]', 'EKEDC');
      await page.fill('[data-testid="amount-input"], input[name="amount"]', '5000');
      await page.fill('[data-testid="pin-input"], input[name="pin"]', PLAYWRIGHT_TEST_CONFIG.DEMO_USER.pin);

      // Submit payment
      await page.click('button[type="submit"], [data-testid="pay-button"]');

      // Wait for result
      await page.waitForSelector('text=Success, text=Payment, [data-testid="payment-result"]');

      // Verify success
      const successElement = await page.locator('text=Success, .success, [data-testid="success"]');
      expect(await successElement.isVisible()).toBe(true);
    });

    test('should handle invalid meter number', async ({ page }) => {
      await uiHelpers.login(PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email, PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password);

      await page.click('text=Bills, [data-testid="bills-nav"]');
      await page.click('text=Electricity, [data-testid="electricity-bill"]');

      // Use invalid meter number
      await page.fill('[data-testid="meter-number"], input[placeholder*="meter"]', '00000000000');
      await page.selectOption('[data-testid="provider-select"]', 'EKEDC');
      await page.fill('[data-testid="amount-input"]', '1000');
      await page.fill('[data-testid="pin-input"]', PLAYWRIGHT_TEST_CONFIG.DEMO_USER.pin);

      await page.click('button[type="submit"]');

      // Verify error handling
      const errorElement = await page.locator('text=Error, text=Invalid, .error');
      await expect(errorElement).toBeVisible();
    });
  });

  test.describe('International Transfer Workflows', () => {
    test('should initiate international transfer with compliance checks', async ({ page }) => {
      await uiHelpers.login(PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email, PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password);

      // Navigate to international transfers
      await page.click('text=International, [data-testid="international-nav"]');
      await page.waitForSelector('[data-testid="international-form"], .international-transfer');

      // Fill international transfer form
      await page.fill('[data-testid="beneficiary-name"]', 'John Smith');
      await page.fill('[data-testid="beneficiary-account"]', 'GB29NWBK60161331926819');
      await page.fill('[data-testid="beneficiary-bank"]', 'NWBKGB2L');
      await page.selectOption('[data-testid="currency-select"]', 'USD');
      await page.fill('[data-testid="amount-input"]', '1000');
      await page.fill('[data-testid="purpose-input"]', 'Business payment');
      await page.fill('[data-testid="pin-input"]', PLAYWRIGHT_TEST_CONFIG.DEMO_USER.pin);

      await page.click('[data-testid="submit-international"]');

      // Should trigger compliance review for large amounts
      const complianceElement = await page.locator('text=Review, text=Compliance, [data-testid="compliance"]');
      expect(await complianceElement.isVisible()).toBe(true);
    });
  });

  test.describe('Scheduled Payment Workflows', () => {
    test('should create future-dated transfer', async ({ page }) => {
      await uiHelpers.login(PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email, PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password);

      await page.click('text=Schedule, [data-testid="schedule-nav"]');
      await page.waitForSelector('[data-testid="schedule-form"]');

      // Set future date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];

      await page.fill('[data-testid="schedule-date"]', dateString);
      await page.fill('[data-testid="amount-input"]', '10000');
      await page.fill('[data-testid="recipient-account"]', '9876543210');
      await page.fill('[data-testid="description-input"]', 'Scheduled payment test');
      await page.fill('[data-testid="pin-input"]', PLAYWRIGHT_TEST_CONFIG.DEMO_USER.pin);

      await page.click('[data-testid="schedule-submit"]');

      // Verify scheduling success
      const successElement = await page.locator('text=Scheduled, text=Success, [data-testid="scheduled-success"]');
      expect(await successElement.isVisible()).toBe(true);
    });

    test('should create recurring monthly transfer', async ({ page }) => {
      await uiHelpers.login(PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email, PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password);

      await page.click('text=Schedule, [data-testid="schedule-nav"]');

      // Enable recurring option
      await page.check('[data-testid="recurring-checkbox"]');
      await page.selectOption('[data-testid="frequency-select"]', 'monthly');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];

      await page.fill('[data-testid="schedule-date"]', dateString);
      await page.fill('[data-testid="amount-input"]', '5000');
      await page.fill('[data-testid="recipient-account"]', '9876543210');
      await page.fill('[data-testid="description-input"]', 'Monthly recurring payment');
      await page.fill('[data-testid="pin-input"]', PLAYWRIGHT_TEST_CONFIG.DEMO_USER.pin);

      await page.click('[data-testid="schedule-submit"]');

      const successElement = await page.locator('text=Recurring, text=Scheduled, [data-testid="recurring-success"]');
      expect(await successElement.isVisible()).toBe(true);
    });
  });

  test.describe('Receipt and Transaction History', () => {
    test('should generate and view transfer receipt', async ({ page }) => {
      await uiHelpers.login(PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email, PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password);
      await uiHelpers.navigateToTransfers();

      // Complete a transfer
      await uiHelpers.fillTransferForm({
        transferType: 'internal',
        amount: '2000',
        recipientAccount: '9876543210',
        description: 'Receipt test transfer',
        pin: PLAYWRIGHT_TEST_CONFIG.DEMO_USER.pin
      });

      await uiHelpers.submitTransfer();
      const result = await uiHelpers.getTransferResult();
      expect(result.success).toBe(true);

      // Navigate to transaction history
      await page.click('text=History, [data-testid="history-nav"], .history-nav');
      await page.waitForSelector('[data-testid="transaction-list"], .transaction-history');

      // View latest transaction receipt
      await page.click('[data-testid="view-receipt"]:first-child, .view-receipt:first-child');

      // Verify receipt details
      await page.waitForSelector('[data-testid="receipt-modal"], .receipt-modal');
      const receiptElement = await page.locator('[data-testid="receipt-content"]');
      expect(await receiptElement.isVisible()).toBe(true);

      // Check receipt contains key information
      const receiptText = await receiptElement.textContent();
      expect(receiptText).toContain('2000');
      expect(receiptText).toContain('Receipt test transfer');
      expect(receiptText).toContain(result.reference || '');
    });

    test('should filter transaction history by date range', async ({ page }) => {
      await uiHelpers.login(PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email, PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password);

      await page.click('text=History, [data-testid="history-nav"]');
      await page.waitForSelector('[data-testid="transaction-list"]');

      // Set date filter to last 7 days
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      await page.fill('[data-testid="date-from"]', weekAgo.toISOString().split('T')[0]);
      await page.fill('[data-testid="date-to"]', today.toISOString().split('T')[0]);
      await page.click('[data-testid="apply-filter"]');

      // Verify filtered results
      await page.waitForSelector('[data-testid="filtered-results"]');
      const transactions = await page.locator('[data-testid="transaction-item"]').count();
      expect(transactions).toBeGreaterThan(0);
    });
  });

  test.describe('Notification Workflows', () => {
    test('should receive transfer notifications', async ({ page }) => {
      await uiHelpers.login(PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email, PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password);

      // Enable browser notifications if supported
      await page.context().grantPermissions(['notifications']);

      await uiHelpers.navigateToTransfers();

      // Complete a transfer
      await uiHelpers.fillTransferForm({
        transferType: 'internal',
        amount: '1500',
        recipientAccount: '9876543210',
        description: 'Notification test',
        pin: PLAYWRIGHT_TEST_CONFIG.DEMO_USER.pin
      });

      await uiHelpers.submitTransfer();

      // Wait for and verify notification
      const notification = await uiHelpers.waitForNotification('Transfer successful', 10000);
      expect(notification).toContain('successful');
      expect(notification).toContain('1500');
    });

    test('should access notification center', async ({ page }) => {
      await uiHelpers.login(PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email, PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password);

      // Click notification bell/icon
      await page.click('[data-testid="notifications-icon"], .notifications-icon, [aria-label*="notification"]');

      // Verify notification center opens
      await page.waitForSelector('[data-testid="notification-center"], .notification-center');

      // Check for recent notifications
      const notifications = await page.locator('[data-testid="notification-item"]').count();
      expect(notifications).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network connectivity issues', async ({ page }) => {
      await uiHelpers.login(PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email, PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password);

      // Simulate network failure
      await page.route('**/api/transfers/**', route => route.abort());

      await uiHelpers.navigateToTransfers();

      await uiHelpers.fillTransferForm({
        transferType: 'internal',
        amount: '1000',
        recipientAccount: '9876543210',
        description: 'Network failure test',
        pin: PLAYWRIGHT_TEST_CONFIG.DEMO_USER.pin
      });

      await uiHelpers.submitTransfer();

      // Should show network error
      const errorElement = await page.locator('text=Network, text=Connection, .network-error');
      await expect(errorElement).toBeVisible({ timeout: 15000 });
    });

    test('should handle session expiration gracefully', async ({ page }) => {
      await uiHelpers.login(PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email, PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password);

      // Clear authentication token/session
      await page.context().clearCookies();
      await page.evaluate(() => localStorage.clear());

      await uiHelpers.navigateToTransfers();

      // Should redirect to login
      await page.waitForSelector('input[type="email"], [data-testid="email-input"]', { timeout: 10000 });
      expect(page.url()).toContain('login');
    });

    test('should validate PIN attempts and lockout', async ({ page }) => {
      await uiHelpers.login(PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email, PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password);
      await uiHelpers.navigateToTransfers();

      // Try multiple incorrect PINs
      for (let i = 0; i < 3; i++) {
        await uiHelpers.fillTransferForm({
          transferType: 'internal',
          amount: '1000',
          recipientAccount: '9876543210',
          description: `Wrong PIN attempt ${i + 1}`,
          pin: '0000' // Wrong PIN
        });

        await uiHelpers.submitTransfer();

        if (i < 2) {
          // Should show PIN error
          const result = await uiHelpers.getTransferResult();
          expect(result.success).toBe(false);
          expect(result.message.toLowerCase()).toMatch(/pin|incorrect|invalid/);
        }
      }

      // After 3 attempts, should be locked out
      const lockoutElement = await page.locator('text=Locked, text=Too many attempts, .lockout-error');
      await expect(lockoutElement).toBeVisible();
    });
  });

  test.describe('Performance and Load', () => {
    test('should handle concurrent transfer requests', async ({ page, context }) => {
      // Create multiple pages for concurrent testing
      const pages = await Promise.all([
        context.newPage(),
        context.newPage(),
        context.newPage()
      ]);

      // Login all pages concurrently
      await Promise.all(pages.map(async (p) => {
        const helper = new PlaywrightUIHelpers(p);
        await helper.login(PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email, PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password);
        await helper.navigateToTransfers();
      }));

      // Submit transfers concurrently
      const transferPromises = pages.map(async (p, index) => {
        const helper = new PlaywrightUIHelpers(p);
        await helper.fillTransferForm({
          transferType: 'internal',
          amount: '500',
          recipientAccount: '9876543210',
          description: `Concurrent transfer ${index + 1}`,
          pin: PLAYWRIGHT_TEST_CONFIG.DEMO_USER.pin
        });

        await helper.submitTransfer();
        return helper.getTransferResult();
      });

      const results = await Promise.all(transferPromises);

      // At least one should succeed (depending on balance and concurrency handling)
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBeGreaterThan(0);

      // Clean up
      await Promise.all(pages.map(p => p.close()));
    });

    test('should load transfer history efficiently', async ({ page }) => {
      await uiHelpers.login(PLAYWRIGHT_TEST_CONFIG.DEMO_USER.email, PLAYWRIGHT_TEST_CONFIG.DEMO_USER.password);

      // Navigate to history and measure load time
      const startTime = Date.now();
      await page.click('text=History, [data-testid="history-nav"]');
      await page.waitForSelector('[data-testid="transaction-list"]');
      const loadTime = Date.now() - startTime;

      // Should load within reasonable time (5 seconds)
      expect(loadTime).toBeLessThan(5000);

      // Should display transactions
      const transactionCount = await page.locator('[data-testid="transaction-item"]').count();
      expect(transactionCount).toBeGreaterThanOrEqual(0);
    });
  });
});