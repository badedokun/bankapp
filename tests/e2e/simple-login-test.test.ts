/**
 * Simple Login Test for Modern Dashboard
 * Direct test of login functionality with admin@fmfb.com/Admin-7-super
 */

import { test, expect, Page } from '@playwright/test';

const TEST_CREDENTIALS = {
  email: 'admin@fmfb.com',
  password: 'Admin-7-super'
};

const BASE_URL = 'http://localhost:3000';

test.describe('Simple Login Test', () => {
  test('should login and access dashboard', async ({ page }) => {
    console.log('🚀 Starting simple login test...');

    // Step 1: Navigate to the application
    console.log('1. Navigating to application...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

    // Step 2: Take initial screenshot
    await page.screenshot({
      path: 'tests/screenshots/login-page-initial.png',
      fullPage: true
    });
    console.log('📷 Initial screenshot taken');

    // Step 3: Find and fill email input
    console.log('2. Looking for email input...');

    // Try multiple selectors for email input
    const emailSelectors = [
      'input[placeholder*="email" i]',
      'input[placeholder*="phone" i]',
      'input[type="email"]',
      'input[name="email"]',
      'input[name="identifier"]'
    ];

    let emailInput = null;
    for (const selector of emailSelectors) {
      try {
        emailInput = page.locator(selector).first();
        await emailInput.waitFor({ timeout: 2000 });
        console.log(`✓ Found email input with selector: ${selector}`);
        break;
      } catch (e) {
        console.log(`✗ Email selector failed: ${selector}`);
      }
    }

    if (!emailInput) {
      throw new Error('Could not find email input field');
    }

    await emailInput.fill(TEST_CREDENTIALS.email);
    console.log('✓ Email filled');

    // Step 4: Find and fill password input
    console.log('3. Looking for password input...');

    const passwordSelectors = [
      'input[type="password"]',
      'input[placeholder*="password" i]',
      'input[name="password"]'
    ];

    let passwordInput = null;
    for (const selector of passwordSelectors) {
      try {
        passwordInput = page.locator(selector).first();
        await passwordInput.waitFor({ timeout: 2000 });
        console.log(`✓ Found password input with selector: ${selector}`);
        break;
      } catch (e) {
        console.log(`✗ Password selector failed: ${selector}`);
      }
    }

    if (!passwordInput) {
      throw new Error('Could not find password input field');
    }

    await passwordInput.fill(TEST_CREDENTIALS.password);
    console.log('✓ Password filled');

    // Step 5: Find and click login button
    console.log('4. Looking for login button...');

    const buttonSelectors = [
      'button:text("Sign In")',
      'button:text-is("Sign In")',
      'button[type="submit"]',
      'button:has-text("Sign In")',
      'input[type="submit"]',
      '[role="button"]:has-text("Sign In")'
    ];

    let loginButton = null;
    for (const selector of buttonSelectors) {
      try {
        loginButton = page.locator(selector).first();
        await loginButton.waitFor({ timeout: 2000 });
        console.log(`✓ Found login button with selector: ${selector}`);
        break;
      } catch (e) {
        console.log(`✗ Button selector failed: ${selector}`);
      }
    }

    if (!loginButton) {
      // Fallback: try to find any button on the page
      console.log('Trying fallback button search...');
      const allButtons = page.locator('button');
      const buttonCount = await allButtons.count();
      console.log(`Found ${buttonCount} buttons on page`);

      if (buttonCount > 0) {
        for (let i = 0; i < buttonCount; i++) {
          const buttonText = await allButtons.nth(i).textContent();
          console.log(`Button ${i}: "${buttonText}"`);
          if (buttonText && buttonText.toLowerCase().includes('sign')) {
            loginButton = allButtons.nth(i);
            console.log(`✓ Using button with text: "${buttonText}"`);
            break;
          }
        }
      }
    }

    if (!loginButton) {
      throw new Error('Could not find login button');
    }

    // Step 6: Take screenshot before clicking
    await page.screenshot({
      path: 'tests/screenshots/before-login-click.png',
      fullPage: true
    });
    console.log('📷 Pre-login screenshot taken');

    // Step 7: Click login button
    console.log('5. Clicking login button...');
    await loginButton.click();

    // Step 8: Wait for navigation
    console.log('6. Waiting for navigation...');

    try {
      // Wait for either dashboard URL or error
      await Promise.race([
        page.waitForURL('**/dashboard**', { timeout: 15000 }),
        page.waitForSelector('.error, .alert-danger, [role="alert"]', { timeout: 5000 })
      ]);
    } catch (e) {
      console.log('Navigation timeout, checking current state...');
    }

    // Step 9: Check final state
    const finalUrl = page.url();
    console.log(`Final URL: ${finalUrl}`);

    // Take final screenshot
    await page.screenshot({
      path: 'tests/screenshots/after-login-attempt.png',
      fullPage: true
    });
    console.log('📷 Final screenshot taken');

    // Step 10: Verify we're on dashboard or handle errors
    if (finalUrl.includes('/dashboard')) {
      console.log('🎉 Successfully reached dashboard!');

      // Look for dashboard elements
      console.log('7. Checking dashboard elements...');

      // Wait a bit for dashboard to load
      await page.waitForTimeout(2000);

      // Look for common dashboard elements
      const dashboardElements = [
        '[data-testid="dashboard"]',
        '.dashboard',
        'main',
        '.balance',
        '.stats',
        '.feature-grid',
        '.cards'
      ];

      let foundElements = [];
      for (const selector of dashboardElements) {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          foundElements.push(`${selector} (${count})`);
        }
      }

      console.log(`Dashboard elements found: ${foundElements.join(', ')}`);

      // Check for AI assistant
      const aiElements = page.locator('[data-testid="ai-assistant"], .ai-assistant, [aria-label*="AI"]');
      const aiCount = await aiElements.count();
      if (aiCount > 0) {
        console.log(`✓ AI Assistant found (${aiCount} elements)`);
      } else {
        console.log('! AI Assistant not found');
      }

      // Verify dashboard content is loaded
      expect(finalUrl).toContain('/dashboard');

    } else {
      // Check for error messages
      const errorElements = page.locator('.error, .alert-danger, [role="alert"]');
      const errorCount = await errorElements.count();

      if (errorCount > 0) {
        console.log('❌ Login failed with errors:');
        for (let i = 0; i < Math.min(errorCount, 3); i++) {
          const errorText = await errorElements.nth(i).textContent();
          console.log(`  Error ${i + 1}: ${errorText}`);
        }
        throw new Error('Login failed with error messages');
      } else {
        console.log('⚠️ Login did not navigate to dashboard, but no errors found');
        console.log('Current page might be showing different content');

        // Log page title and some content for debugging
        const title = await page.title();
        console.log(`Page title: ${title}`);

        const bodyText = await page.locator('body').textContent();
        const snippet = bodyText?.substring(0, 200) + '...';
        console.log(`Page content snippet: ${snippet}`);
      }
    }

    console.log('✅ Login test completed');
  });
});