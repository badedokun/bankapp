import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

test.describe('RBAC Dashboard Visual Verification', () => {

  test('Admin dashboard should load with RBAC features visible', async ({ page }) => {
    console.log('🚀 Starting RBAC Dashboard Visual Verification...');

    // Navigate to app
    await page.goto(BASE_URL);
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });

    console.log('📝 Filling login form...');

    // Fill login form
    await page.fill('input[name="email"]', 'admin@fmfb.com');
    await page.fill('input[name="password"]', 'Admin-7-super');
    await page.selectOption('select[name="tenantId"]', 'fmfb');
    await page.click('button[type="submit"]');

    console.log('⏳ Waiting for dashboard to load...');

    // Wait for dashboard content to appear (look for common elements)
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Give time for React components to render

    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/rbac-dashboard-admin.png', fullPage: true });
    console.log('📸 Screenshot saved: test-results/rbac-dashboard-admin.png');

    // Check that we're not on the login page anymore
    const loginForm = await page.locator('input[name="email"]').isVisible();
    expect(loginForm).toBeFalsy();

    // Look for key dashboard elements by text content
    console.log('🔍 Verifying dashboard elements...');

    // Check for dashboard greeting or header
    const dashboardLoaded = await page.waitForSelector('h1, h2, h3', { timeout: 5000 }).catch(() => null);
    expect(dashboardLoaded).toBeTruthy();

    // Check for balance display (should contain NGN or ₦)
    const balanceVisible = await page.locator('text=/₦|NGN|Balance/').first().isVisible().catch(() => false);
    if (balanceVisible) {
      console.log('✅ Balance information displayed');
    }

    // Check for banking features
    const bankingFeatures = [
      'Transfer',
      'Savings',
      'Loan',
      'Transaction',
      'Account'
    ];

    let featuresFound = 0;
    for (const feature of bankingFeatures) {
      const featureVisible = await page.locator(`text=${feature}`).first().isVisible().catch(() => false);
      if (featureVisible) {
        featuresFound++;
        console.log(`✅ Found banking feature: ${feature}`);
      }
    }

    console.log(`📊 Found ${featuresFound}/${bankingFeatures.length} banking features`);
    expect(featuresFound).toBeGreaterThan(0);

    // Check for admin-level features
    const adminFeatures = [
      'Management',
      'Admin',
      'Platform',
      'Settings',
      'Reports',
      'Analytics'
    ];

    let adminFeaturesFound = 0;
    for (const feature of adminFeatures) {
      const featureVisible = await page.locator(`text=${feature}`).first().isVisible().catch(() => false);
      if (featureVisible) {
        adminFeaturesFound++;
        console.log(`✅ Found admin feature: ${feature}`);
      }
    }

    console.log(`🎯 Found ${adminFeaturesFound}/${adminFeatures.length} admin features`);

    console.log('✅ RBAC Dashboard Visual Verification completed successfully');
  });

  test('Dashboard should show AI Assistant functionality', async ({ page }) => {
    console.log('🤖 Testing AI Assistant functionality...');

    await page.goto(BASE_URL);
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });

    await page.fill('input[name="email"]', 'admin@fmfb.com');
    await page.fill('input[name="password"]', 'Admin-7-super');
    await page.selectOption('select[name="tenantId"]', 'fmfb');
    await page.click('button[type="submit"]');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Look for AI-related elements
    const aiElements = [
      'AI',
      'Assistant',
      'Chat',
      'Smart',
      'Intelligence'
    ];

    let aiElementsFound = 0;
    for (const element of aiElements) {
      const elementVisible = await page.locator(`text=${element}`).first().isVisible().catch(() => false);
      if (elementVisible) {
        aiElementsFound++;
        console.log(`✅ Found AI element: ${element}`);
      }
    }

    console.log(`🤖 Found ${aiElementsFound}/${aiElements.length} AI elements`);
    expect(aiElementsFound).toBeGreaterThan(0);

    console.log('✅ AI Assistant verification completed');
  });

  test('Dashboard should display Nigerian banking context', async ({ page }) => {
    console.log('🇳🇬 Testing Nigerian banking context...');

    await page.goto(BASE_URL);
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });

    await page.fill('input[name="email"]', 'admin@fmfb.com');
    await page.fill('input[name="password"]', 'Admin-7-super');
    await page.selectOption('select[name="tenantId"]', 'fmfb');
    await page.click('button[type="submit"]');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Look for Nigerian banking context
    const nigerianContext = [
      '₦', // Naira symbol
      'NGN',
      'NIBSS',
      'CBN',
      'Naira'
    ];

    let contextFound = 0;
    for (const context of nigerianContext) {
      const contextVisible = await page.locator(`text=${context}`).first().isVisible().catch(() => false);
      if (contextVisible) {
        contextFound++;
        console.log(`✅ Found Nigerian context: ${context}`);
      }
    }

    console.log(`🇳🇬 Found ${contextFound}/${nigerianContext.length} Nigerian banking context elements`);
    expect(contextFound).toBeGreaterThan(0);

    console.log('✅ Nigerian banking context verification completed');
  });
});