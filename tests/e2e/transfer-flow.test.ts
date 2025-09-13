/**
 * End-to-End Transfer Flow Test
 * Tests the complete user journey from login to transfer completion
 */

import { test, expect } from '@playwright/test';

test.describe('Complete Transfer Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start with clean state
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('should complete full transfer workflow with proper user feedback', async ({ page }) => {
    // Step 1: Login
    await page.fill('input[placeholder*="email"]', 'admin@fmfb.com');
    await page.fill('input[type="password"]', 'Admin@123!');
    await page.click('button:has-text("Login")');
    
    // Wait for dashboard to load
    await expect(page.locator('text=Dashboard')).toBeVisible();
    
    // Step 2: Navigate to Transfer
    await page.click('button:has-text("Send Money")');
    await expect(page.locator('text=AI Transfer')).toBeVisible();
    
    // Step 3: Fill transfer form with user input
    const recipientName = 'Bolaji Akinola';
    const amount = '25000';
    const accountNumber = '0987654321';
    const bankCode = '044';
    const pin = '2348';
    
    // Fill recipient name FIRST (before account validation)
    await page.fill('input[placeholder*="recipient name"]', recipientName);
    
    // Fill other fields
    await page.fill('input[placeholder*="account number"]', accountNumber);
    await page.fill('input[placeholder*="bank code"]', bankCode);
    await page.fill('input[placeholder*="amount"]', amount);
    await page.fill('input[placeholder*="PIN"]', pin);
    
    // Step 4: Verify recipient name is NOT overwritten by validation
    await page.waitForTimeout(2000); // Wait for validation
    const recipientValue = await page.inputValue('input[placeholder*="recipient name"]');
    expect(recipientValue).toBe(recipientName); // Should still be user input, not "Jane Smith"
    
    // Step 5: Verify validation shows user name, not hardcoded name
    const validationText = await page.locator('text*="✅"').textContent();
    expect(validationText).toContain(recipientName);
    expect(validationText).not.toContain('Jane Smith');
    
    // Step 6: Submit transfer
    await page.click('button:has-text("Send Money")');
    
    // Step 7: Verify user feedback appears
    await expect(page.locator('text*="Transfer Successful"')).toBeVisible({ timeout: 10000 });
    
    // Step 8: Verify transfer details in alert
    const alertText = await page.locator('[role="dialog"]').textContent();
    expect(alertText).toContain(amount);
    expect(alertText).toContain(recipientName);
    expect(alertText).toContain('Reference:');
    
    // Step 9: Dismiss alert and verify navigation
    await page.click('button:has-text("OK")');
    
    // Step 10: Verify return to dashboard
    await expect(page.locator('text=Dashboard')).toBeVisible();
    
    // Step 11: Verify transfer appears in history
    await expect(page.locator(`text*="${recipientName}"`)).toBeVisible();
  });

  test('should handle transfer errors gracefully', async ({ page }) => {
    // Login
    await page.fill('input[placeholder*="email"]', 'admin@fmfb.com');
    await page.fill('input[type="password"]', 'Admin@123!');
    await page.click('button:has-text("Login")');
    await expect(page.locator('text=Dashboard')).toBeVisible();
    
    // Navigate to transfer
    await page.click('button:has-text("Send Money")');
    
    // Fill form with amount exceeding balance
    await page.fill('input[placeholder*="recipient name"]', 'Test User');
    await page.fill('input[placeholder*="account number"]', '1234567890');
    await page.fill('input[placeholder*="bank code"]', '011');
    await page.fill('input[placeholder*="amount"]', '999999999'); // Exceeds balance
    await page.fill('input[placeholder*="PIN"]', '2348');
    
    // Submit transfer
    await page.click('button:has-text("Send Money")');
    
    // Verify error feedback
    await expect(page.locator('text*="Transfer Failed"')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text*="Insufficient"')).toBeVisible();
    
    // Dismiss error and verify navigation
    await page.click('button:has-text("OK")');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should preserve user input during validation', async ({ page }) => {
    // Login and navigate to transfer
    await page.fill('input[placeholder*="email"]', 'admin@fmfb.com');
    await page.fill('input[type="password"]', 'Admin@123!');
    await page.click('button:has-text("Login")');
    await page.click('button:has-text("Send Money")');
    
    // Type recipient name character by character
    const recipientName = 'Custom Recipient Name';
    await page.focus('input[placeholder*="recipient name"]');
    
    for (const char of recipientName) {
      await page.keyboard.type(char);
      await page.waitForTimeout(50); // Simulate real typing
    }
    
    // Now trigger validation by filling account details
    await page.fill('input[placeholder*="account number"]', '0987654321');
    await page.fill('input[placeholder*="bank code"]', '044');
    
    // Wait for validation
    await page.waitForTimeout(2000);
    
    // Verify recipient name is preserved
    const recipientValue = await page.inputValue('input[placeholder*="recipient name"]');
    expect(recipientValue).toBe(recipientName);
  });
});