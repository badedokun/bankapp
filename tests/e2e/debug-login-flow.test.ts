/**
 * Debug Login Flow Test
 * Captures console logs and errors during login process
 */

import { test, expect } from '@playwright/test';

const TEST_CREDENTIALS = {
  email: 'admin@fmfb.com',
  password: 'Admin-7-super'
};

const BASE_URL = 'http://localhost:3000';

test.describe('Debug Login Flow', () => {
  test('should debug login process with detailed logging', async ({ page }) => {
    console.log('🔍 Starting debug login flow test...');

    // Capture console logs and errors
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
        console.log('❌ Console Error:', text);
      } else {
        consoleLogs.push(text);
        console.log('📝 Console Log:', text);
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(error.message);
      console.log('💥 Page Error:', error.message);
    });

    page.on('requestfailed', request => {
      networkErrors.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
      console.log('🌐 Network Error:', request.method(), request.url(), request.failure()?.errorText);
    });

    // Step 1: Navigate to the application
    console.log('1. Navigating to login page...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Take initial screenshot
    await page.screenshot({
      path: 'tests/screenshots/debug-initial.png',
      fullPage: true
    });

    // Step 2: Fill login form
    console.log('2. Filling login credentials...');

    const emailInput = page.locator('input[placeholder*="email" i]').first();
    await emailInput.waitFor({ timeout: 5000 });
    await emailInput.fill(TEST_CREDENTIALS.email);
    console.log('✓ Email filled');

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ timeout: 5000 });
    await passwordInput.fill(TEST_CREDENTIALS.password);
    console.log('✓ Password filled');

    // Take screenshot before login
    await page.screenshot({
      path: 'tests/screenshots/debug-before-login.png',
      fullPage: true
    });

    // Step 3: Click login button and monitor
    console.log('3. Clicking login button...');

    const loginButton = page.locator('div:has-text("Sign In")').first();
    await loginButton.waitFor({ timeout: 5000 });

    // Click login and monitor network activity
    await Promise.all([
      page.waitForResponse(response => response.url().includes('/api/auth/login'), { timeout: 10000 }).catch(() => null),
      loginButton.click()
    ]);

    console.log('✓ Login button clicked, waiting for response...');

    // Wait for any navigation or error
    await page.waitForTimeout(5000);

    // Step 4: Check current state
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);

    // Take screenshot after login attempt
    await page.screenshot({
      path: 'tests/screenshots/debug-after-login.png',
      fullPage: true
    });

    // Step 5: Check for any runtime errors
    if (consoleErrors.length > 0) {
      console.log('❌ Console/Runtime Errors Found:');
      consoleErrors.forEach((error, i) => {
        console.log(`  ${i + 1}: ${error}`);
      });
    }

    if (networkErrors.length > 0) {
      console.log('🌐 Network Errors Found:');
      networkErrors.forEach((error, i) => {
        console.log(`  ${i + 1}: ${error}`);
      });
    }

    // Step 6: Test API call manually
    console.log('4. Testing API call manually...');
    const response = await page.evaluate(async (credentials) => {
      try {
        const res = await fetch('http://localhost:3001/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            tenantId: 'fmfb'
          })
        });

        if (!res.ok) {
          const errorText = await res.text();
          return { success: false, status: res.status, error: errorText };
        }

        const data = await res.json();
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, TEST_CREDENTIALS);

    console.log('📊 Direct API Test Result:', JSON.stringify(response, null, 2));

    // Summary
    console.log('\n📋 Debug Summary:');
    console.log(`  - Current URL: ${currentUrl}`);
    console.log(`  - Console Errors: ${consoleErrors.length}`);
    console.log(`  - Network Errors: ${networkErrors.length}`);
    console.log(`  - Direct API Test: ${response.success ? 'SUCCESS' : 'FAILED'}`);

    if (response.success) {
      console.log('✅ API authentication works - issue is in frontend handling');
    } else {
      console.log('❌ API authentication failed - issue is in backend');
    }
  });
});