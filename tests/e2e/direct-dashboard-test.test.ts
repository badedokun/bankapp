/**
 * Direct Dashboard Test - Navigate directly to dashboard after login
 */

import { test, expect } from '@playwright/test';

test.describe('Direct Dashboard Navigation', () => {
  test('Should show modern dashboard when navigating directly', async ({ page }) => {
    console.log('🚀 Starting direct dashboard navigation test...');

    // Step 1: Login via API to get token
    const loginResponse = await page.request.post('http://localhost:3001/api/auth/login', {
      data: {
        email: 'admin@fmfb.com',
        password: 'Admin-7-super'
      }
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    const token = loginData.data?.tokens?.access;

    console.log('✅ Got authentication token');

    // Step 2: Set authentication in local storage before navigating
    await page.goto('http://localhost:3000');

    await page.evaluate((authToken) => {
      // Set auth tokens in localStorage
      localStorage.setItem('access_token', authToken);
      localStorage.setItem('isAuthenticated', 'true');

      // Trigger a storage event to notify the app
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'access_token',
        newValue: authToken,
        url: window.location.href
      }));
    }, token);

    console.log('✅ Set authentication in localStorage');

    // Step 3: Now reload the page - it should check auth and show dashboard
    await page.reload();
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: '/tmp/direct-dashboard-after-auth.png' });

    // Check what screen we're on
    const currentUrl = page.url();
    console.log(`📍 Current URL after auth: ${currentUrl}`);

    // Look for dashboard elements
    const hasLoginForm = await page.locator('input[type="password"]').count() > 0;
    const hasWelcomeText = await page.locator('text=/Welcome.*Admin/i').count() > 0;
    const hasDashboardContent = await page.locator('text=/Dashboard|Balance|Transaction/i').count() > 0;

    console.log(`📊 Page state:`);
    console.log(`   - Has login form: ${hasLoginForm}`);
    console.log(`   - Has welcome text: ${hasWelcomeText}`);
    console.log(`   - Has dashboard content: ${hasDashboardContent}`);

    // We should NOT see the login form
    expect(hasLoginForm).toBeFalsy();

    // We SHOULD see dashboard content
    expect(hasDashboardContent || hasWelcomeText).toBeTruthy();

    console.log('🎉 Direct dashboard navigation test completed!');
  });

  test('Should render ModernDashboardScreen components', async ({ page }) => {
    console.log('🔍 Testing ModernDashboardScreen rendering...');

    // Login via API first
    const loginResponse = await page.request.post('http://localhost:3001/api/auth/login', {
      data: {
        email: 'admin@fmfb.com',
        password: 'Admin-7-super'
      }
    });

    const loginData = await loginResponse.json();
    const token = loginData.data?.tokens?.access;

    // Navigate and set auth
    await page.goto('http://localhost:3000');

    await page.evaluate((authData) => {
      localStorage.setItem('access_token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      localStorage.setItem('isAuthenticated', 'true');
    }, { token, user: loginData.data?.user });

    // Reload to trigger auth check
    await page.reload();
    await page.waitForTimeout(3000);

    // Look for ModernDashboardScreen specific elements
    const modernElements = {
      glassmorphism: await page.locator('[class*="glassmorphism"], [style*="backdrop-filter"]').count(),
      statsCards: await page.locator('[class*="stats"], [class*="card"]').count(),
      aiAssistant: await page.locator('text=/AI.*Assistant|Smart.*Suggestions/i').count(),
      quickActions: await page.locator('text=/Quick.*Actions|Transfer.*Money|Pay.*Bills/i').count(),
      modernLayout: await page.locator('[class*="modern"], [class*="dashboard"]').count()
    };

    console.log('🎨 Modern Dashboard Elements Found:');
    console.log(`   - Glassmorphism effects: ${modernElements.glassmorphism}`);
    console.log(`   - Stats cards: ${modernElements.statsCards}`);
    console.log(`   - AI Assistant: ${modernElements.aiAssistant}`);
    console.log(`   - Quick Actions: ${modernElements.quickActions}`);
    console.log(`   - Modern layout: ${modernElements.modernLayout}`);

    // Take a final screenshot
    await page.screenshot({ path: '/tmp/modern-dashboard-elements.png' });

    // At least some modern elements should be present
    const hasModernElements = Object.values(modernElements).some(count => count > 0);
    expect(hasModernElements).toBeTruthy();

    console.log('✅ ModernDashboardScreen rendering test completed!');
  });
});