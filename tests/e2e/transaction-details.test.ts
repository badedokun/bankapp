/**
 * End-to-End Transaction Details Test
 * Tests the complete transaction details flow from dashboard/history to details screen
 */

import { test, expect } from '@playwright/test';

test.describe('Transaction Details Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Start with clean state and login
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Login with admin credentials
    await page.fill('input[placeholder*="email"]', 'admin@fmfb.com');
    await page.fill('input[type="password"]', 'Admin@123!');
    await page.click('button:has-text("Login")');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should navigate to transaction details from dashboard', async ({ page }) => {
    // Wait for dashboard to load with transaction data
    await page.waitForSelector('[data-testid="recent-transactions"]', { timeout: 10000 });

    // Find the first transaction item
    const transactionItem = page.locator('[data-testid="transaction-item"]').first();
    await expect(transactionItem).toBeVisible();

    // Click on the transaction to view details
    await transactionItem.click();

    // Verify we're on the transaction details screen
    await expect(page.locator('text=Transaction Details')).toBeVisible();

    // Verify essential transaction details are displayed
    await expect(page.locator('[data-testid="transaction-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-reference"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-date"]')).toBeVisible();
  });

  test('should navigate to transaction details from history screen', async ({ page }) => {
    // Navigate to transaction history
    await page.click('button:has-text("View All")');
    await expect(page.locator('text=Transaction History')).toBeVisible();

    // Wait for transaction list to load
    await page.waitForSelector('[data-testid="transaction-list"]', { timeout: 10000 });

    // Click on the first transaction
    const firstTransaction = page.locator('[data-testid="transaction-item"]').first();
    await expect(firstTransaction).toBeVisible();
    await firstTransaction.click();

    // Verify transaction details screen loads
    await expect(page.locator('text=Transaction Details')).toBeVisible();

    // Verify back button navigates to history
    await page.click('[data-testid="back-button"]');
    await expect(page.locator('text=Transaction History')).toBeVisible();
  });

  test('should display comprehensive transaction information', async ({ page }) => {
    // Navigate to first transaction details
    const transactionItem = page.locator('[data-testid="transaction-item"]').first();
    await transactionItem.click();
    await expect(page.locator('text=Transaction Details')).toBeVisible();

    // Verify transaction information sections are present
    await expect(page.locator('text=Transaction Information')).toBeVisible();
    await expect(page.locator('text=Amount Details')).toBeVisible();

    // Verify specific fields
    await expect(page.locator('[data-testid="reference-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-id"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-type"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-channel"]')).toBeVisible();

    // Verify recipient/sender details section
    const recipientSection = page.locator('text=Recipient Details');
    const senderSection = page.locator('text=Sender Details');

    // At least one should be visible
    const hasRecipientOrSender = await recipientSection.isVisible() || await senderSection.isVisible();
    expect(hasRecipientOrSender).toBeTruthy();

    // Verify amount breakdown
    await expect(page.locator('[data-testid="transaction-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-fee"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-amount"]')).toBeVisible();
  });

  test('should show correct status indicators and colors', async ({ page }) => {
    // Navigate to transaction details
    const transactionItem = page.locator('[data-testid="transaction-item"]').first();
    await transactionItem.click();

    // Get the status element
    const statusElement = page.locator('[data-testid="transaction-status"]');
    await expect(statusElement).toBeVisible();

    const statusText = await statusElement.textContent();
    const statusIcon = page.locator('[data-testid="status-icon"]');

    // Verify status text is one of the expected values
    const validStatuses = ['SUCCESSFUL', 'PENDING', 'FAILED', 'REVERSED'];
    expect(validStatuses.some(status => statusText?.includes(status))).toBeTruthy();

    // Verify status icon is present
    await expect(statusIcon).toBeVisible();
  });

  test('should handle share functionality', async ({ page }) => {
    // Navigate to transaction details
    const transactionItem = page.locator('[data-testid="transaction-item"]').first();
    await transactionItem.click();

    // Click share button
    const shareButton = page.locator('[data-testid="share-button"]');
    await expect(shareButton).toBeVisible();
    await shareButton.click();

    // Note: Actual sharing behavior depends on browser/OS
    // We can test that the button is clickable and doesn't crash
    await page.waitForTimeout(1000);
  });

  test('should handle download receipt functionality', async ({ page }) => {
    // Navigate to transaction details
    const transactionItem = page.locator('[data-testid="transaction-item"]').first();
    await transactionItem.click();

    // Click download button
    const downloadButton = page.locator('[data-testid="download-button"]');
    await expect(downloadButton).toBeVisible();

    // Set up download handler
    const downloadPromise = page.waitForEvent('download');
    await downloadButton.click();

    // Verify download was triggered (or alert shown)
    try {
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('receipt');
    } catch (error) {
      // If download doesn't work, check for success alert
      await expect(page.locator('text*="Receipt downloaded successfully"')).toBeVisible();
    }
  });

  test('should handle report issue functionality', async ({ page }) => {
    // Navigate to transaction details
    const transactionItem = page.locator('[data-testid="transaction-item"]').first();
    await transactionItem.click();

    // Click report issue button
    const reportButton = page.locator('[data-testid="report-button"]');
    await expect(reportButton).toBeVisible();
    await reportButton.click();

    // Verify confirmation dialog
    await expect(page.locator('text*="Report Transaction Issue"')).toBeVisible();

    // Confirm report
    await page.click('button:has-text("Report Issue")');

    // Verify success message
    await expect(page.locator('text*="Issue Reported"')).toBeVisible();
    await expect(page.locator('text*="RPT-"')).toBeVisible(); // Reference number
  });

  test('should handle retry functionality for failed transactions', async ({ page }) => {
    // This test assumes we have a failed transaction
    // In real implementation, you might need to create a failed transaction first

    // Navigate to transaction details
    const transactionItem = page.locator('[data-testid="transaction-item"]').first();
    await transactionItem.click();

    // Check if retry button exists (only for failed transactions)
    const retryButton = page.locator('[data-testid="retry-button"]');

    if (await retryButton.isVisible()) {
      await retryButton.click();

      // Verify confirmation dialog
      await expect(page.locator('text*="Retry Transaction"')).toBeVisible();

      // Confirm retry
      await page.click('button:has-text("Retry Transfer")');

      // Should navigate to transfer screen
      await expect(page.locator('text=AI Transfer')).toBeVisible();
    }
  });

  test('should refresh transaction details on pull-to-refresh', async ({ page }) => {
    // Navigate to transaction details
    const transactionItem = page.locator('[data-testid="transaction-item"]').first();
    await transactionItem.click();

    // Get initial reference number
    const initialReference = await page.locator('[data-testid="reference-number"]').textContent();

    // Simulate pull-to-refresh (scroll up at the top)
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });

    // Trigger refresh programmatically (since pull-to-refresh is hard to simulate)
    await page.reload();
    await expect(page.locator('text=Transaction Details')).toBeVisible();

    // Verify reference number is still the same (data consistency)
    const refreshedReference = await page.locator('[data-testid="reference-number"]').textContent();
    expect(refreshedReference).toBe(initialReference);
  });

  test('should handle loading states gracefully', async ({ page }) => {
    // Intercept API call to simulate slow loading
    await page.route('**/api/transactions/**/details', async route => {
      // Delay response by 2 seconds
      await page.waitForTimeout(2000);
      route.continue();
    });

    // Navigate to transaction details
    const transactionItem = page.locator('[data-testid="transaction-item"]').first();
    await transactionItem.click();

    // Verify loading state is shown
    await expect(page.locator('text*="Loading transaction details"')).toBeVisible();

    // Wait for loading to complete
    await expect(page.locator('text=Transaction Details')).toBeVisible({ timeout: 15000 });
  });

  test('should handle error states when transaction not found', async ({ page }) => {
    // Intercept API call to simulate 404 error
    await page.route('**/api/transactions/**/details', async route => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Transaction not found' })
      });
    });

    // Navigate to transaction details
    const transactionItem = page.locator('[data-testid="transaction-item"]').first();
    await transactionItem.click();

    // Verify error state is shown
    await expect(page.locator('text*="Transaction not found"')).toBeVisible();
    await expect(page.locator('button:has-text("Go Back")')).toBeVisible();

    // Test go back functionality
    await page.click('button:has-text("Go Back")');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should format amounts and dates correctly', async ({ page }) => {
    // Navigate to transaction details
    const transactionItem = page.locator('[data-testid="transaction-item"]').first();
    await transactionItem.click();

    // Verify amount formatting (should include ₦ symbol and commas)
    const amountElement = page.locator('[data-testid="transaction-amount"]');
    const amountText = await amountElement.textContent();
    expect(amountText).toMatch(/₦[\d,]+/); // Should have naira symbol and numbers with commas

    // Verify date formatting
    const dateElement = page.locator('[data-testid="transaction-date"]');
    const dateText = await dateElement.textContent();
    expect(dateText).toMatch(/\w+ \d{1,2}, \d{4}/); // Should be like "January 15, 2024"

    // Verify time formatting
    const timeElement = page.locator('[data-testid="transaction-time"]');
    const timeText = await timeElement.textContent();
    expect(timeText).toMatch(/\d{1,2}:\d{2}:\d{2} (AM|PM)/); // Should be like "2:30:45 PM"
  });

  test('should maintain accessibility standards', async ({ page }) => {
    // Navigate to transaction details
    const transactionItem = page.locator('[data-testid="transaction-item"]').first();
    await transactionItem.click();

    // Check for proper heading structure
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();

    // Check for proper button labels
    const shareButton = page.locator('[data-testid="share-button"]');
    if (await shareButton.isVisible()) {
      const ariaLabel = await shareButton.getAttribute('aria-label');
      expect(ariaLabel || await shareButton.textContent()).toContain('Share');
    }

    // Check for proper role attributes
    const statusElement = page.locator('[data-testid="transaction-status"]');
    await expect(statusElement).toBeVisible();

    // Verify no accessibility violations (basic check)
    const focusableElements = page.locator('button, [role="button"], input, [tabindex="0"]');
    const count = await focusableElements.count();
    expect(count).toBeGreaterThan(0); // Should have focusable elements
  });
});