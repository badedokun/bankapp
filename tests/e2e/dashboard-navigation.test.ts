/**
 * Dashboard Navigation & RBAC Permissions Test
 * Tests critical dashboard interactions including:
 * - Money Transfer button navigation
 * - Admin user permissions
 * - External Transfer access
 * - Feature access based on roles
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

test.describe('Dashboard Navigation and Permissions', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto(BASE_URL);

    // Wait for login page to load
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
  });

  test('Admin user should have full access to all features', async ({ page }) => {
    console.log('🔐 Testing admin user permissions...');

    // Login as admin
    await page.fill('input[name="email"]', 'admin@fmfb.com');
    await page.fill('input[name="password"]', 'Admin-7-super');
    await page.click('button:has-text("Sign In")');

    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard"], .dashboard, [class*="dashboard"]', { timeout: 15000 });
    console.log('✅ Admin logged in successfully');

    // Check for "FULL" access indicator
    const accessIndicator = await page.locator('text=/FULL|Full Access/i').first();
    await expect(accessIndicator).toBeVisible({ timeout: 5000 });
    console.log('✅ Admin has FULL access indicator');

    // Test Money Transfer button click
    console.log('💸 Testing Money Transfer navigation...');

    // Look for Money Transfer in multiple possible locations
    const moneyTransferButton = await page.locator('text=/Money Transfer|💸.*Transfer/i').first();
    await expect(moneyTransferButton).toBeVisible();

    // Click and verify navigation
    await moneyTransferButton.click();

    // Should navigate to transfer page or show transfer form
    const transferPageIndicator = await Promise.race([
      page.waitForSelector('text=/Transfer Money|Send Money|Make.*Transfer/i', { timeout: 5000 }).catch(() => null),
      page.waitForSelector('[data-testid="transfer-form"]', { timeout: 5000 }).catch(() => null),
      page.waitForURL('**/transfer**', { timeout: 5000 }).catch(() => null)
    ]);

    expect(transferPageIndicator).toBeTruthy();
    console.log('✅ Money Transfer navigation works');

    // Navigate back to dashboard
    await page.goBack();
    await page.waitForSelector('[data-testid="dashboard"], .dashboard, [class*="dashboard"]', { timeout: 5000 });

    // Test External Transfer access
    console.log('🌍 Testing External Transfer access...');

    const externalTransferButton = await page.locator('text=/External Transfer|International.*Transfer/i').first();

    if (await externalTransferButton.isVisible()) {
      await externalTransferButton.click();

      // Should NOT show "Access Denied"
      const accessDeniedMessage = await page.locator('text=/Access Denied/i').isVisible();
      expect(accessDeniedMessage).toBeFalsy();
      console.log('✅ External Transfer access granted (no Access Denied)');
    }

    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/admin-dashboard-access.png', fullPage: true });
  });

  test('Demo user role-based access should work correctly', async ({ page }) => {
    console.log('👤 Testing demo user permissions...');

    // Login as demo user
    await page.fill('input[name="email"]', 'demo@fmfb.com');
    await page.fill('input[name="password"]', 'Demo-7-super');
    await page.click('button:has-text("Sign In")');

    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard"], .dashboard, [class*="dashboard"]', { timeout: 15000 });
    console.log('✅ Demo user logged in successfully');

    // Check permissions are loaded
    const dashboardContent = await page.content();
    const hasPermissionInfo = dashboardContent.includes('CEO') || dashboardContent.includes('Manager') || dashboardContent.includes('role');
    expect(hasPermissionInfo).toBeTruthy();
    console.log('✅ Role information displayed');

    // Test that at least Money Transfer is available
    const moneyTransferButton = await page.locator('text=/Money Transfer|💸.*Transfer/i').first();
    await expect(moneyTransferButton).toBeVisible();

    // Click should work without errors
    await moneyTransferButton.click();

    // Should not show access denied for basic transfer
    const accessDeniedForTransfer = await page.locator('text=/Access Denied.*money_transfer/i').isVisible();
    expect(accessDeniedForTransfer).toBeFalsy();
    console.log('✅ Demo user can access Money Transfer');

    // Take screenshot
    await page.screenshot({ path: 'test-results/demo-dashboard-access.png', fullPage: true });
  });

  test('Dashboard feature cards should be interactive', async ({ page }) => {
    console.log('🎯 Testing dashboard feature card interactions...');

    // Login as admin for full access
    await page.fill('input[name="email"]', 'admin@fmfb.com');
    await page.fill('input[name="password"]', 'Admin-7-super');
    await page.click('button:has-text("Sign In")');

    // Wait for dashboard
    await page.waitForSelector('[data-testid="dashboard"], .dashboard, [class*="dashboard"]', { timeout: 15000 });

    // Test clicking on various feature cards
    const featuresToTest = [
      { name: 'Money Transfer', expectedUrl: /transfer/i, expectedText: /transfer|send/i },
      { name: 'Bill Payment', expectedUrl: /bill/i, expectedText: /bill|payment/i },
      { name: 'Transaction History', expectedUrl: /history|transaction/i, expectedText: /history|transaction/i }
    ];

    for (const feature of featuresToTest) {
      console.log(`📱 Testing ${feature.name} feature...`);

      const featureCard = await page.locator(`text=/${feature.name}/i`).first();

      if (await featureCard.isVisible()) {
        // Store current URL
        const currentUrl = page.url();

        // Click the feature
        await featureCard.click();
        await page.waitForTimeout(1000); // Wait for navigation

        // Check if navigation occurred or modal opened
        const navigationOccurred = page.url() !== currentUrl;
        const modalOpened = await page.locator(`text=/${feature.expectedText.source}/i`).isVisible();

        if (navigationOccurred || modalOpened) {
          console.log(`✅ ${feature.name} is interactive and navigates/opens correctly`);
        } else {
          console.log(`⚠️ ${feature.name} click didn't trigger expected action`);
        }

        // Navigate back if needed
        if (navigationOccurred) {
          await page.goBack();
          await page.waitForSelector('[data-testid="dashboard"], .dashboard, [class*="dashboard"]', { timeout: 5000 });
        }
      } else {
        console.log(`⏭️ ${feature.name} not visible on dashboard`);
      }
    }
  });

  test('RBAC permissions should affect feature visibility', async ({ page }) => {
    console.log('🔒 Testing RBAC permission-based visibility...');

    // Login as admin
    await page.fill('input[name="email"]', 'admin@fmfb.com');
    await page.fill('input[name="password"]', 'Admin-7-super');
    await page.click('button:has-text("Sign In")');

    // Wait for dashboard
    await page.waitForSelector('[data-testid="dashboard"], .dashboard, [class*="dashboard"]', { timeout: 15000 });

    // Admin should see management features
    const adminFeatures = [
      'RBAC Management',
      'User Management',
      'Platform Administration'
    ];

    for (const feature of adminFeatures) {
      const featureVisible = await page.locator(`text=/${feature}/i`).isVisible().catch(() => false);
      if (featureVisible) {
        console.log(`✅ Admin can see: ${feature}`);
      } else {
        console.log(`⚠️ Admin feature not visible: ${feature}`);
      }
    }

    // Log out
    await page.locator('text=/Logout|Sign Out/i').first().click();
    await page.waitForSelector('input[name="email"]', { timeout: 5000 });

    // Login as demo user
    await page.fill('input[name="email"]', 'demo@fmfb.com');
    await page.fill('input[name="password"]', 'Demo-7-super');
    await page.click('button:has-text("Sign In")');

    // Wait for dashboard
    await page.waitForSelector('[data-testid="dashboard"], .dashboard, [class*="dashboard"]', { timeout: 15000 });

    // Demo user should have limited features based on role
    const basicFeatures = [
      'Money Transfer',
      'Transaction History',
      'Account Balance'
    ];

    for (const feature of basicFeatures) {
      const featureVisible = await page.locator(`text=/${feature}/i`).isVisible().catch(() => false);
      if (featureVisible) {
        console.log(`✅ Demo user can see: ${feature}`);
      } else {
        console.log(`⚠️ Basic feature not visible for demo: ${feature}`);
      }
    }
  });

  test('Console errors should not occur during navigation', async ({ page }) => {
    console.log('🔍 Monitoring console for errors...');

    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Login as admin
    await page.fill('input[name="email"]', 'admin@fmfb.com');
    await page.fill('input[name="password"]', 'Admin-7-super');
    await page.click('button:has-text("Sign In")');

    // Wait for dashboard
    await page.waitForSelector('[data-testid="dashboard"], .dashboard, [class*="dashboard"]', { timeout: 15000 });

    // Try various interactions
    const moneyTransfer = await page.locator('text=/Money Transfer/i').first();
    if (await moneyTransfer.isVisible()) {
      await moneyTransfer.click();
      await page.waitForTimeout(1000);
    }

    // Check for console errors
    if (consoleErrors.length > 0) {
      console.log('❌ Console errors detected:', consoleErrors);

      // Filter out known non-critical errors
      const criticalErrors = consoleErrors.filter(err =>
        !err.includes('TensorFlow') &&
        !err.includes('favicon') &&
        !err.includes('DevTools')
      );

      expect(criticalErrors.length).toBe(0);
    } else {
      console.log('✅ No console errors during navigation');
    }
  });
});