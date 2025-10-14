/**
 * Comprehensive Login and Dashboard Test
 * Tests complete login flow and verifies modern dashboard functionality
 * Uses credentials: admin@fmfb.com/Admin-7-super
 */

import { test, expect, Page } from '@playwright/test';

const TEST_CREDENTIALS = {
  email: 'admin@fmfb.com',
  password: 'Admin-7-super'
};

const BASE_URL = 'http://localhost:3000';

test.describe('Comprehensive Login and Dashboard Test', () => {
  test('should complete full login flow and verify modern dashboard', async ({ page }) => {
    console.log('🚀 Starting comprehensive login and dashboard test...');

    // Step 1: Navigate to the application
    console.log('1. Navigating to login page...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Wait for page to fully load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Take initial screenshot
    await page.screenshot({
      path: 'tests/screenshots/comprehensive-login-initial.png',
      fullPage: true
    });

    // Step 2: Fill login form
    console.log('2. Filling login credentials...');

    // Find email input - try multiple selectors
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
        await emailInput.waitFor({ timeout: 3000 });
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
    console.log('✓ Email filled:', TEST_CREDENTIALS.email);

    // Find password input
    const passwordSelectors = [
      'input[type="password"]',
      'input[placeholder*="password" i]',
      'input[name="password"]'
    ];

    let passwordInput = null;
    for (const selector of passwordSelectors) {
      try {
        passwordInput = page.locator(selector).first();
        await passwordInput.waitFor({ timeout: 3000 });
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

    // Step 3: Find and click login button
    console.log('3. Clicking login button...');

    const buttonSelectors = [
      'div:has-text("Sign In")',
      '*:has-text("Sign In"):visible',
      'div[class*="cursor"]:has-text("Sign In")',
      'div[class*="touchAction"]:has-text("Sign In")',
      '[class*="r-cursor-1loqt21"]',
      'button:has-text("Sign In")',
      'button:text("Sign In")',
      'button[type="submit"]',
      '[role="button"]:has-text("Sign In")'
    ];

    let loginButton = null;
    for (const selector of buttonSelectors) {
      try {
        loginButton = page.locator(selector).first();
        await loginButton.waitFor({ timeout: 3000 });
        console.log(`✓ Found login button with selector: ${selector}`);
        break;
      } catch (e) {
        console.log(`✗ Button selector failed: ${selector}`);
      }
    }

    if (!loginButton) {
      throw new Error('Could not find login button');
    }

    // Take screenshot before clicking
    await page.screenshot({
      path: 'tests/screenshots/comprehensive-before-login-click.png',
      fullPage: true
    });

    // Click login button
    await loginButton.click();
    console.log('✓ Login button clicked');

    // Step 4: Wait for navigation and check for errors
    console.log('4. Waiting for login processing...');

    try {
      // Wait for either successful navigation or error messages
      await Promise.race([
        page.waitForURL('**/dashboard**', { timeout: 20000 }),
        page.waitForSelector('.error, .alert-danger, [role="alert"]', { timeout: 5000 })
      ]);
    } catch (e) {
      console.log('Navigation timeout, checking current state...');
    }

    // Check for runtime errors in console
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else {
        consoleLogs.push(msg.text());
      }
    });

    await page.waitForTimeout(3000);

    // Step 5: Verify current state
    const finalUrl = page.url();
    console.log(`Current URL: ${finalUrl}`);

    // Take screenshot of current state
    await page.screenshot({
      path: 'tests/screenshots/comprehensive-after-login.png',
      fullPage: true
    });

    // Check for errors first
    const errorElements = page.locator('.error, .alert-danger, [role="alert"]');
    const errorCount = await errorElements.count();

    if (errorCount > 0) {
      console.log('❌ Found error messages on page:');
      for (let i = 0; i < Math.min(errorCount, 3); i++) {
        const errorText = await errorElements.nth(i).textContent();
        console.log(`  Error ${i + 1}: ${errorText}`);
      }
    }

    if (consoleErrors.length > 0) {
      console.log('❌ Console errors detected:');
      consoleErrors.slice(0, 5).forEach((error, i) => {
        console.log(`  Console Error ${i + 1}: ${error}`);
      });
    }

    // Step 6: Verify successful login and dashboard access
    if (finalUrl.includes('/dashboard')) {
      console.log('🎉 Successfully navigated to dashboard!');

      // Wait for dashboard content to load
      await page.waitForTimeout(3000);

      // Step 7: Comprehensive dashboard verification
      console.log('5. Verifying dashboard components...');

      // Check for modern dashboard elements
      const dashboardChecks = await page.evaluate(() => {
        const checks = {
          // Basic elements
          hasMainContent: !!document.querySelector('main, [data-testid="dashboard"], .dashboard'),
          hasNavigation: !!document.querySelector('nav, .navigation, [data-testid="navigation"]'),

          // Modern dashboard features
          hasModernFeatureGrid: !!document.querySelector('[data-testid="modern-feature-grid"], .modern-feature-grid, .feature-grid'),
          hasQuickStats: !!document.querySelector('[data-testid="quick-stats"], .quick-stats, .stats'),
          hasTransactionLimits: !!document.querySelector('[data-testid="transaction-limits"], .transaction-limits'),

          // AI Assistant
          hasAIAssistant: !!document.querySelector('[data-testid="ai-assistant"], .ai-assistant, [aria-label*="AI"]'),

          // Recent activity
          hasRecentActivity: !!document.querySelector('[data-testid="recent-activity"], .recent-activity'),

          // Cards and components
          cardCount: document.querySelectorAll('.card, [data-testid="card"], .dashboard-card, .panel').length,

          // Theme elements (modern glassmorphism)
          hasGlassmorphism: !!document.querySelector('[style*="backdrop-filter"], [style*="rgba"]'),

          // Banking specific elements
          hasBalanceDisplay: !!document.querySelector('.balance, [data-testid="balance"], .account-balance'),
          hasFeatureButtons: document.querySelectorAll('button, [role="button"]').length,

          // Page info
          title: document.title,
          bodyClassList: Array.from(document.body.classList),
          hasErrors: document.querySelectorAll('.error, [role="alert"]').length > 0
        };

        return checks;
      });

      console.log('📊 Dashboard Verification Results:');
      console.log(`  Page Title: ${dashboardChecks.title}`);
      console.log(`  Main Content: ${dashboardChecks.hasMainContent ? '✓' : '✗'}`);
      console.log(`  Navigation: ${dashboardChecks.hasNavigation ? '✓' : '✗'}`);
      console.log(`  Modern Feature Grid: ${dashboardChecks.hasModernFeatureGrid ? '✓' : '✗'}`);
      console.log(`  Quick Stats: ${dashboardChecks.hasQuickStats ? '✓' : '✗'}`);
      console.log(`  Transaction Limits: ${dashboardChecks.hasTransactionLimits ? '✓' : '✗'}`);
      console.log(`  AI Assistant: ${dashboardChecks.hasAIAssistant ? '✓' : '✗'}`);
      console.log(`  Recent Activity: ${dashboardChecks.hasRecentActivity ? '✓' : '✗'}`);
      console.log(`  Balance Display: ${dashboardChecks.hasBalanceDisplay ? '✓' : '✗'}`);
      console.log(`  Glassmorphism: ${dashboardChecks.hasGlassmorphism ? '✓' : '✗'}`);
      console.log(`  Cards/Panels: ${dashboardChecks.cardCount}`);
      console.log(`  Feature Buttons: ${dashboardChecks.hasFeatureButtons}`);
      console.log(`  Has Errors: ${dashboardChecks.hasErrors ? '❌' : '✓'}`);

      // Step 8: Test key dashboard interactions
      console.log('6. Testing dashboard interactions...');

      // Try to interact with AI assistant if present
      const aiAssistant = page.locator('[data-testid="ai-assistant"], .ai-assistant, [aria-label*="AI"]').first();
      if (await aiAssistant.count() > 0) {
        try {
          await aiAssistant.waitFor({ timeout: 3000 });
          console.log('✓ AI Assistant is visible and interactive');
        } catch (e) {
          console.log('! AI Assistant found but not interactive');
        }
      }

      // Try to find and test feature grid interactions
      const featureButtons = page.locator('.feature-button, [data-testid="feature-button"], .feature-card button').first();
      if (await featureButtons.count() > 0) {
        try {
          await featureButtons.waitFor({ timeout: 3000 });
          console.log('✓ Feature buttons are present and clickable');
        } catch (e) {
          console.log('! Feature buttons found but not clickable');
        }
      }

      // Take final dashboard screenshot
      await page.screenshot({
        path: 'tests/screenshots/comprehensive-dashboard-loaded.png',
        fullPage: true
      });

      // Step 9: Verify no critical errors
      expect(dashboardChecks.hasErrors).toBe(false);
      expect(finalUrl).toContain('/dashboard');
      expect(dashboardChecks.hasMainContent).toBe(true);

      console.log('✅ Comprehensive login and dashboard test completed successfully!');

    } else {
      // Login did not succeed
      console.log('❌ Login did not navigate to dashboard');
      console.log(`Current URL: ${finalUrl}`);

      if (errorCount > 0) {
        const errorMessages = [];
        for (let i = 0; i < Math.min(errorCount, 3); i++) {
          const errorText = await errorElements.nth(i).textContent();
          errorMessages.push(errorText);
        }
        throw new Error(`Login failed with errors: ${errorMessages.join(', ')}`);
      } else {
        throw new Error('Login did not redirect to dashboard - check credentials or server status');
      }
    }
  });

  test('should handle login form validation', async ({ page }) => {
    console.log('🔍 Testing login form validation...');

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In")').first();
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await page.waitForTimeout(2000);

      // Check for validation messages
      const validationErrors = page.locator('.error, [role="alert"], .field-error');
      const hasValidation = await validationErrors.count() > 0;

      console.log(`Form validation: ${hasValidation ? '✓ Working' : '! No validation found'}`);
    }
  });
});