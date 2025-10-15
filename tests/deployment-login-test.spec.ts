import { test, expect } from '@playwright/test';

test.describe('FMFB Production Login Test', () => {
  test('should successfully login with admin credentials', async ({ page }) => {
    // Navigate to FMFB login page
    await page.goto('https://fmfb-34-59-143-25.nip.io/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take screenshot of login page
    await page.screenshot({ path: '/tmp/01-login-page.png', fullPage: true });
    console.log('📸 Screenshot saved: /tmp/01-login-page.png');

    // Check if FMFB branding is visible
    const pageContent = await page.content();
    console.log('🔍 Checking for FMFB branding...');

    // Wait for email input field
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i], input[name="email"]').first();
    await emailInput.waitFor({ timeout: 10000 });
    console.log('✅ Email input found');

    // Fill in credentials
    await emailInput.fill('admin@fmfb.com');
    console.log('✅ Email filled: admin@fmfb.com');

    // Find password field
    const passwordInput = page.locator('input[type="password"], input[placeholder*="password" i], input[name="password"]').first();
    await passwordInput.fill('Admin-7-super');
    console.log('✅ Password filled');

    // Take screenshot before login
    await page.screenshot({ path: '/tmp/02-before-login.png', fullPage: true });
    console.log('📸 Screenshot saved: /tmp/02-before-login.png');

    // Set up request/response logging
    page.on('request', request => {
      if (request.url().includes('/api/auth/login')) {
        console.log('📤 LOGIN REQUEST:', {
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
      }
    });

    page.on('response', async response => {
      if (response.url().includes('/api/auth/login')) {
        console.log('📥 LOGIN RESPONSE:', {
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          headers: response.headers()
        });
        try {
          const body = await response.text();
          console.log('📥 Response body:', body.substring(0, 500));
        } catch (e) {
          console.log('Could not read response body');
        }
      }
    });

    // Find and click login button
    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
    await loginButton.waitFor({ timeout: 5000 });
    console.log('✅ Login button found');

    await loginButton.click();
    console.log('🔄 Login button clicked, waiting for response...');

    // Wait for either success (navigation) or error message
    try {
      // Wait for navigation or specific success indicators
      await Promise.race([
        page.waitForURL(/dashboard|home|accounts/, { timeout: 10000 }),
        page.waitForSelector('text=/Welcome|Dashboard|Accounts/i', { timeout: 10000 }),
        page.waitForLoadState('networkidle', { timeout: 10000 })
      ]);

      console.log('✅ Login appears successful!');
      console.log('Current URL:', page.url());

      // Take screenshot after login
      await page.screenshot({ path: '/tmp/03-after-login-success.png', fullPage: true });
      console.log('📸 Screenshot saved: /tmp/03-after-login-success.png');

      // Check for success indicators
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/login');

    } catch (error) {
      console.log('❌ Login did not navigate away from login page');
      console.log('Current URL:', page.url());

      // Take screenshot of error state
      await page.screenshot({ path: '/tmp/03-after-login-error.png', fullPage: true });
      console.log('📸 Screenshot saved: /tmp/03-after-login-error.png');

      // Check for error messages
      const errorMessage = await page.locator('text=/error|invalid|failed/i').first().textContent().catch(() => null);
      if (errorMessage) {
        console.log('❌ Error message found:', errorMessage);
      }

      // Get browser console logs
      console.log('📋 Checking for console errors...');

      throw error;
    }
  });
});
