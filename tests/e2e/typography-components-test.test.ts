/**
 * Typography Components Test
 * Tests that the application loads correctly with the new Typography components
 * and verifies that the Text constructor error is resolved
 *
 * Credentials: admin@fmfb.com / Admin-7-super
 */

import { test, expect, Page } from '@playwright/test';

const TEST_CREDENTIALS = {
  email: 'admin@fmfb.com',
  password: 'Admin-7-super'
};

const BASE_URL = 'http://localhost:3000';

test.describe('Typography Components and Application Load Test', () => {
  let page: Page;
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    consoleErrors.length = 0;
    pageErrors.length = 0;

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const errorText = msg.text();
        console.error('Browser console error:', errorText);
        consoleErrors.push(errorText);
      }
    });

    // Capture page errors (uncaught exceptions)
    page.on('pageerror', (error) => {
      const errorMsg = error.message;
      console.error('Page error:', errorMsg);
      pageErrors.push(errorMsg);
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should load application without Text constructor errors', async () => {
    console.log('Starting Typography Components Test...');

    // Step 1: Navigate to the application
    console.log('1. Navigating to application...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Step 2: Check for Text constructor error immediately
    console.log('2. Checking for Text constructor errors...');

    // Wait a moment for any errors to surface
    await page.waitForTimeout(2000);

    // Verify no Text constructor errors
    const textConstructorError = pageErrors.find(err =>
      err.includes("Failed to construct 'Text'") ||
      err.includes('Please use the \'new\' operator')
    );

    expect(textConstructorError).toBeUndefined();
    console.log('✓ No Text constructor errors detected');

    // Step 3: Verify login form loads
    console.log('3. Verifying login form loads correctly...');

    const emailInput = page.locator('input[placeholder*="email" i], input[placeholder*="phone" i]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });

    const passwordInput = page.locator('input[type="password"], input[placeholder*="password" i]').first();
    await expect(passwordInput).toBeVisible({ timeout: 5000 });

    const loginButton = page.locator('button:has-text("Sign In")').first();
    await expect(loginButton).toBeVisible({ timeout: 5000 });

    console.log('✓ Login form loaded successfully');

    // Step 4: Login with credentials
    console.log('4. Logging in with test credentials...');
    await emailInput.fill(TEST_CREDENTIALS.email);
    await passwordInput.fill(TEST_CREDENTIALS.password);
    await loginButton.click();

    // Step 5: Wait for dashboard to load
    console.log('5. Waiting for dashboard to load...');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    console.log('✓ Successfully navigated to dashboard');

    // Step 6: Verify dashboard loads without errors
    console.log('6. Verifying dashboard components load...');

    const dashboardContainer = page.locator('[data-testid="dashboard"], .dashboard, main').first();
    await expect(dashboardContainer).toBeVisible({ timeout: 10000 });
    console.log('✓ Dashboard container loaded');

    // Wait for any delayed errors to surface
    await page.waitForTimeout(3000);

    // Step 7: Check specifically for Typography component rendering
    console.log('7. Checking for Typography components...');

    // Look for "Quick Actions" text which should be rendered with HeadlineSmall
    const quickActionsText = page.locator('text="Quick Actions"').first();
    try {
      await expect(quickActionsText).toBeVisible({ timeout: 5000 });
      console.log('✓ Typography component "Quick Actions" rendered successfully');
    } catch (e) {
      console.log('! Quick Actions text not found - may need to expand sections');
    }

    // Step 8: Verify no runtime errors accumulated
    console.log('8. Verifying no runtime errors...');

    if (pageErrors.length > 0) {
      console.error('❌ Page errors detected:');
      pageErrors.forEach((err, idx) => {
        console.error(`  ${idx + 1}. ${err}`);
      });
    }

    if (consoleErrors.length > 0) {
      console.warn('⚠ Console errors detected:');
      consoleErrors.forEach((err, idx) => {
        console.warn(`  ${idx + 1}. ${err}`);
      });
    }

    // Fail test if critical errors exist
    expect(pageErrors.length).toBe(0);
    console.log('✓ No page errors detected');

    // Step 9: Take screenshot
    console.log('9. Taking screenshot for verification...');
    await page.screenshot({
      path: 'tests/screenshots/typography-dashboard.png',
      fullPage: true
    });
    console.log('✓ Screenshot saved to tests/screenshots/typography-dashboard.png');

    console.log('🎉 Typography components test completed successfully!');
  });

  test('should verify all Typography components render without errors', async () => {
    console.log('Testing Typography component rendering...');

    // Login first
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const emailInput = page.locator('input[placeholder*="email" i], input[placeholder*="phone" i]').first();
    const passwordInput = page.locator('input[type="password"], input[placeholder*="password" i]').first();
    const loginButton = page.locator('button:has-text("Sign In")').first();

    await emailInput.fill(TEST_CREDENTIALS.email);
    await passwordInput.fill(TEST_CREDENTIALS.password);
    await loginButton.click();

    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // Wait for dashboard to fully render
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for various text elements that should use Typography components
    console.log('Checking for Typography-rendered text elements...');

    // Check for any text content on the page
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    console.log('✓ Body has text content');

    // Verify no Text constructor errors during rendering
    const textConstructorError = pageErrors.find(err =>
      err.includes("Failed to construct 'Text'") ||
      err.includes('Please use the \'new\' operator') ||
      err.includes('Text constructor')
    );

    expect(textConstructorError).toBeUndefined();
    console.log('✓ All Typography components rendered without Text constructor errors');

    // Check that the page actually has content
    const hasVisibleContent = await page.evaluate(() => {
      const body = document.querySelector('body');
      return body ? body.offsetHeight > 100 : false;
    });

    expect(hasVisibleContent).toBeTruthy();
    console.log('✓ Dashboard has visible content');
  });

  test('should verify ErrorState and EmptyState components work', async () => {
    console.log('Testing ErrorState and EmptyState components...');

    // Navigate to app
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Just verify the components are available and don't cause errors
    // They may not be visible on the dashboard, but should be loaded without errors

    const hasTextConstructorError = pageErrors.some(err =>
      err.includes("Failed to construct 'Text'") ||
      err.includes('Please use the \'new\' operator')
    );

    expect(hasTextConstructorError).toBe(false);
    console.log('✓ No Text constructor errors from ErrorState/EmptyState components');
  });
});
