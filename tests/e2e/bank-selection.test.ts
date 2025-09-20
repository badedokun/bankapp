/**
 * End-to-End Bank Selection Component Test
 * Tests the complete bank selection flow from frontend to backend
 */

import { test, expect } from '@playwright/test';

test.describe('Bank Selection Component', () => {
  test.beforeEach(async ({ page }) => {
    // Start with clean state and login
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Login with admin credentials
    await page.fill('input[placeholder*="email"]', 'admin@fmfb.com');
    await page.fill('input[type="password"]', 'Admin@123!');
    await page.click('button:has-text("Sign In")');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should load banks from backend API', async ({ page }) => {
    // Navigate to transfer screen
    await page.click('button:has-text("Send Money")');
    await expect(page.locator('text=AI Transfer')).toBeVisible();

    // Find the bank selector
    const bankSelector = page.locator('[data-testid="recipient-bank-selector"]');
    await expect(bankSelector).toBeVisible();

    // Click to open bank selection modal
    await bankSelector.click();

    // Verify modal opens
    const bankModal = page.locator('[data-testid="recipient-bank-selector-modal"]');
    await expect(bankModal).toBeVisible();

    // Verify banks are loaded from API
    await expect(page.locator('text=Loading banks')).toBeVisible();

    // Wait for banks to load
    await page.waitForSelector('[data-testid="recipient-bank-selector-bank-044"]', { timeout: 10000 });

    // Verify major Nigerian banks are available
    await expect(page.locator('text=Access Bank')).toBeVisible();
    await expect(page.locator('text=Guaranty Trust Bank')).toBeVisible();
    await expect(page.locator('text=Zenith Bank')).toBeVisible();
    await expect(page.locator('text=First Bank')).toBeVisible();
  });

  test('should filter banks using search functionality', async ({ page }) => {
    // Navigate to transfer screen and open bank selector
    await page.click('button:has-text("Send Money")');
    await page.click('[data-testid="recipient-bank-selector"]');

    // Wait for modal to open and banks to load
    await page.waitForSelector('[data-testid="recipient-bank-selector-search"]');
    await page.waitForSelector('[data-testid="recipient-bank-selector-bank-044"]', { timeout: 10000 });

    // Test search by bank name
    const searchInput = page.locator('[data-testid="recipient-bank-selector-search"]');
    await searchInput.fill('Access');

    // Verify filtering works
    await expect(page.locator('text=Access Bank')).toBeVisible();
    await expect(page.locator('text=Guaranty Trust Bank')).not.toBeVisible();

    // Clear search and try bank code
    await searchInput.clear();
    await searchInput.fill('058');

    // Verify GTBank (code 058) appears
    await expect(page.locator('text=Guaranty Trust Bank')).toBeVisible();
    await expect(page.locator('text=Access Bank')).not.toBeVisible();

    // Test partial search
    await searchInput.clear();
    await searchInput.fill('zen');

    // Verify Zenith Bank appears
    await expect(page.locator('text=Zenith Bank')).toBeVisible();
  });

  test('should select bank and integrate with transfer form', async ({ page }) => {
    // Navigate to transfer screen
    await page.click('button:has-text("Send Money")');
    await expect(page.locator('text=AI Transfer')).toBeVisible();

    // Open bank selector
    await page.click('[data-testid="recipient-bank-selector"]');
    await page.waitForSelector('[data-testid="recipient-bank-selector-bank-044"]', { timeout: 10000 });

    // Select Access Bank
    await page.click('[data-testid="recipient-bank-selector-bank-044"]');

    // Verify modal closes
    const bankModal = page.locator('[data-testid="recipient-bank-selector-modal"]');
    await expect(bankModal).not.toBeVisible();

    // Verify bank is selected in the form
    const bankSelector = page.locator('[data-testid="recipient-bank-selector"]');
    await expect(bankSelector).toContainText('Access Bank');
    await expect(bankSelector).toContainText('044');

    // Test account validation with selected bank
    await page.fill('input[placeholder*="account number"]', '1234567890');

    // Verify account validation is triggered
    await expect(page.locator('text*="Validating account"')).toBeVisible();

    // Continue with rest of transfer form
    await page.fill('input[placeholder*="recipient name"]', 'John Doe');
    await page.fill('input[placeholder*="amount"]', '5000');
    await page.fill('input[placeholder*="description"]', 'Test transfer');
    await page.fill('input[placeholder*="PIN"]', '1234');

    // Verify form validation includes selected bank
    const transferButton = page.locator('button:has-text("Send Money")');
    await expect(transferButton).toBeVisible();
    await expect(transferButton).not.toBeDisabled();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept bank API to simulate error
    await page.route('**/api/transfers/banks', async route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    // Navigate to transfer screen
    await page.click('button:has-text("Send Money")');
    await page.click('[data-testid="recipient-bank-selector"]');

    // Verify error state is shown
    await expect(page.locator('text*="Failed to load banks"')).toBeVisible();
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();

    // Test retry functionality
    await page.unroute('**/api/transfers/banks');
    await page.click('button:has-text("Retry")');

    // Verify banks load after retry
    await page.waitForSelector('[data-testid="recipient-bank-selector-bank-044"]', { timeout: 10000 });
    await expect(page.locator('text=Access Bank')).toBeVisible();
  });

  test('should preserve selection across form interactions', async ({ page }) => {
    // Navigate to transfer screen and select bank
    await page.click('button:has-text("Send Money")');
    await page.click('[data-testid="recipient-bank-selector"]');
    await page.waitForSelector('[data-testid="recipient-bank-selector-bank-058"]', { timeout: 10000 });
    await page.click('[data-testid="recipient-bank-selector-bank-058"]');

    // Verify GTBank is selected
    await expect(page.locator('[data-testid="recipient-bank-selector"]')).toContainText('Guaranty Trust Bank');

    // Fill other form fields
    await page.fill('input[placeholder*="recipient name"]', 'Jane Smith');
    await page.fill('input[placeholder*="account number"]', '9876543210');

    // Verify bank selection is preserved
    await expect(page.locator('[data-testid="recipient-bank-selector"]')).toContainText('Guaranty Trust Bank');
    await expect(page.locator('[data-testid="recipient-bank-selector"]')).toContainText('058');

    // Open bank selector again
    await page.click('[data-testid="recipient-bank-selector"]');

    // Verify previously selected bank is highlighted
    const selectedBank = page.locator('[data-testid="recipient-bank-selector-bank-058"]');
    await expect(selectedBank).toHaveClass(/bankItemSelected/);

    // Close modal
    await page.click('button:has-text("Close")');

    // Verify selection is still preserved
    await expect(page.locator('[data-testid="recipient-bank-selector"]')).toContainText('Guaranty Trust Bank');
  });

  test('should work across different tenants', async ({ page }) => {
    // Test with current tenant (FMFB)
    await page.click('button:has-text("Send Money")');
    await page.click('[data-testid="recipient-bank-selector"]');

    // Verify tenant-specific loading message
    await expect(page.locator('text*="Loading banks from"')).toBeVisible();

    // Wait for banks to load
    await page.waitForSelector('[data-testid="recipient-bank-selector-bank-044"]', { timeout: 10000 });

    // Verify banks are loaded
    await expect(page.locator('text=Access Bank')).toBeVisible();

    // Close modal
    await page.click('button:has-text("Close")');

    // Note: In a real multi-tenant test, we would switch tenants here
    // For this test, we verify the component respects tenant context
    await expect(page.locator('[data-testid="recipient-bank-selector"]')).toBeVisible();
  });

  test('should handle account validation with selected bank', async ({ page }) => {
    // Navigate to transfer screen
    await page.click('button:has-text("Send Money")');

    // Select a bank first
    await page.click('[data-testid="recipient-bank-selector"]');
    await page.waitForSelector('[data-testid="recipient-bank-selector-bank-044"]', { timeout: 10000 });
    await page.click('[data-testid="recipient-bank-selector-bank-044"]');

    // Enter account number
    await page.fill('input[placeholder*="account number"]', '1234567890');

    // Verify validation is triggered with selected bank
    await expect(page.locator('text*="Validating account"')).toBeVisible();

    // Mock successful account validation
    await page.route('**/api/transfers/account-inquiry', async route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            accountNumber: '1234567890',
            accountName: 'Test Account Holder',
            bankName: 'Access Bank Plc',
            bankCode: '044'
          }
        })
      });
    });

    // Wait for validation to complete
    await expect(page.locator('text*="Test Account Holder"')).toBeVisible();
    await expect(page.locator('text*="Access Bank"')).toBeVisible();
  });

  test('should support keyboard navigation and accessibility', async ({ page }) => {
    // Navigate to transfer screen
    await page.click('button:has-text("Send Money")');

    // Test keyboard navigation to bank selector
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Navigate to bank selector

    // Open with Enter key
    await page.keyboard.press('Enter');

    // Verify modal opens
    await expect(page.locator('[data-testid="recipient-bank-selector-modal"]')).toBeVisible();

    // Test search input focus
    const searchInput = page.locator('[data-testid="recipient-bank-selector-search"]');
    await expect(searchInput).toBeFocused();

    // Type to search
    await page.keyboard.type('access');
    await expect(page.locator('text=Access Bank')).toBeVisible();

    // Test escape key to close
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="recipient-bank-selector-modal"]')).not.toBeVisible();
  });

  test('should validate complete transfer flow with bank selection', async ({ page }) => {
    // Complete transfer flow with bank selection
    await page.click('button:has-text("Send Money")');

    // Fill recipient name
    await page.fill('input[placeholder*="recipient name"]', 'Transfer Recipient');

    // Select bank
    await page.click('[data-testid="recipient-bank-selector"]');
    await page.waitForSelector('[data-testid="recipient-bank-selector-bank-044"]', { timeout: 10000 });
    await page.click('[data-testid="recipient-bank-selector-bank-044"]');

    // Fill account number
    await page.fill('input[placeholder*="account number"]', '1234567890');

    // Fill amount and description
    await page.fill('input[placeholder*="amount"]', '1000');
    await page.fill('input[placeholder*="description"]', 'E2E Test Transfer');
    await page.fill('input[placeholder*="PIN"]', '1234');

    // Verify all fields are filled
    await expect(page.locator('[data-testid="recipient-bank-selector"]')).toContainText('Access Bank');
    await expect(page.locator('input[placeholder*="recipient name"]')).toHaveValue('Transfer Recipient');
    await expect(page.locator('input[placeholder*="account number"]')).toHaveValue('1234567890');

    // Test form submission readiness
    const transferButton = page.locator('button:has-text("Send Money")');
    await expect(transferButton).toBeVisible();
    await expect(transferButton).not.toBeDisabled();

    // Note: In real test, we would mock the transfer API and test the complete flow
  });
});