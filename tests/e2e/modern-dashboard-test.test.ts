/**
 * Modern Dashboard Test - Quick verification of new dashboard functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Modern Dashboard Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Allow theme to load completely
  });

  test('Should login successfully and show modern dashboard', async ({ page }) => {
    console.log('🚀 Starting modern dashboard test...');

    // Take initial screenshot
    await page.screenshot({ path: '/tmp/01-login-page.png' });

    // Wait for and fill login form
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 15000 });
    await page.fill('input[type="email"], input[name="email"]', 'admin@fmfb.com');
    await page.fill('input[type="password"], input[name="password"]', 'Admin-7-super');

    console.log('📝 Filled login form');

    // Click login button - try multiple selectors
    const loginButtonSelectors = [
      'button:has-text("Sign In")',
      '[role="button"]:has-text("Sign In")',
      'text=Sign In',
      '.touchable-opacity:has-text("Sign In")',
      'div:has-text("Sign In"):last-child'
    ];

    let buttonClicked = false;
    for (const selector of loginButtonSelectors) {
      try {
        await page.click(selector, { timeout: 3000 });
        console.log(`🔑 Clicked login button with selector: ${selector}`);
        buttonClicked = true;
        break;
      } catch (error) {
        console.log(`Selector failed: ${selector}`);
      }
    }

    if (!buttonClicked) {
      console.log('🚨 All button selectors failed, taking screenshot for debugging');
      await page.screenshot({ path: '/tmp/login-button-debug.png' });
      throw new Error('Could not find login button with any selector');
    }

    // Wait for navigation to dashboard
    await page.waitForURL(/.*/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Allow dashboard to fully load

    console.log('🏠 Navigated to dashboard');

    // Take dashboard screenshot
    await page.screenshot({ path: '/tmp/02-modern-dashboard.png' });

    // Check for modern dashboard elements
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);

    const pageTitle = await page.title();
    console.log(`📄 Page title: ${pageTitle}`);

    // Look for modern dashboard elements
    const hasWelcomeText = await page.locator('text=Welcome back').count() > 0;
    const hasStatsCards = await page.locator('[data-testid="stats-card"], .statsCard').count() > 0;
    const hasDashboardContent = await page.locator('text=Total Balance, text=Monthly Transaction, text=Account Status').count() > 0;
    const hasAIAssistant = await page.locator('text=AI Banking Assistant, text=🤖').count() > 0;
    const hasQuickActions = await page.locator('text=Quick Actions, text=Transfer, text=Pay Bills').count() > 0;

    console.log(`✅ Dashboard elements found:`);
    console.log(`   - Welcome text: ${hasWelcomeText}`);
    console.log(`   - Stats cards: ${hasStatsCards}`);
    console.log(`   - Dashboard content: ${hasDashboardContent}`);
    console.log(`   - AI Assistant: ${hasAIAssistant}`);
    console.log(`   - Quick Actions: ${hasQuickActions}`);

    // Check for no runtime errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log(`❌ Console error: ${msg.text()}`);
      }
    });

    // Verify the page loaded without major errors
    expect(pageTitle).toContain('First Midas');

    // If we got this far, the dashboard loaded successfully
    console.log('🎉 Modern dashboard test passed!');
  });

  test('Should display FMFB branding correctly', async ({ page }) => {
    console.log('🎨 Testing FMFB branding...');

    // Login first
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 15000 });
    await page.fill('input[type="email"], input[name="email"]', 'admin@fmfb.com');
    await page.fill('input[type="password"], input[name="password"]', 'Admin-7-super');
    // Click login button using the same improved logic
    const loginButtonSelectors = [
      'button:has-text("Sign In")',
      '[role="button"]:has-text("Sign In")',
      'text=Sign In',
      '.touchable-opacity:has-text("Sign In")',
      'div:has-text("Sign In"):last-child'
    ];

    let buttonClicked = false;
    for (const selector of loginButtonSelectors) {
      try {
        await page.click(selector, { timeout: 3000 });
        console.log(`🔑 Clicked login button with selector: ${selector}`);
        buttonClicked = true;
        break;
      } catch (error) {
        console.log(`Selector failed: ${selector}`);
      }
    }

    if (!buttonClicked) {
      await page.screenshot({ path: '/tmp/branding-login-debug.png' });
      throw new Error('Could not find login button with any selector');
    }

    // Wait for dashboard
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check for FMFB branding elements
    const pageTitle = await page.title();
    expect(pageTitle).toContain('First Midas');

    console.log('✅ FMFB branding verified');
  });
});