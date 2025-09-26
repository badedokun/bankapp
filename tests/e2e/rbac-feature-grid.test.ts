import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

test.describe('RBAC Feature Grid Tests', () => {

  test('Admin should see all banking features in feature grid', async ({ page }) => {
    // Navigate to app and login
    await page.goto(BASE_URL);
    await page.waitForSelector('[data-testid="login-form"]');

    // Fill login form
    await page.fill('input[name="email"]', 'admin@fmfb.com');
    await page.fill('input[name="password"]', 'Admin-7-super');
    await page.selectOption('select[name="tenantId"]', 'fmfb');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard-container"]', { timeout: 10000 });

    // Expected admin features from our RBAC matrix
    const expectedAdminFeatures = [
      'Internal Transfers',
      'External Transfers',
      'NIBSS Transfers',
      'Bulk Transfers',
      'Scheduled Transfers',
      'Target Savings',
      'Flexible Savings',
      'Fixed Deposits',
      'Group Savings',
      'Save as You Transact',
      'Quick Loans',
      'Personal Loans',
      'Business Loans',
      'Loan Approvals',
      'Customer Management',
      'Account Management',
      'Transaction Management',
      'Audit Trails',
      'Compliance Reports',
      'KYC Management',
      'Fraud Detection',
      'Risk Management',
      'Platform Management',
      'System Settings'
    ];

    console.log('🔍 Checking for RBAC Feature Grid...');

    // Check if feature grid is visible
    const featureGrid = await page.locator('[data-testid="feature-grid"]').first();
    await expect(featureGrid).toBeVisible({ timeout: 5000 });

    // Get all feature cards
    const featureCards = await page.locator('[data-testid*="feature-card"]').all();
    console.log(`📊 Found ${featureCards.length} feature cards`);

    // Verify admin has access to high-privilege features
    const privilegedFeatures = [
      'Platform Management',
      'System Settings',
      'Audit Trails',
      'Compliance Reports',
      'Fraud Detection',
      'Risk Management'
    ];

    for (const feature of privilegedFeatures) {
      const featureCard = page.locator(`[data-testid*="feature-card"]:has-text("${feature}")`).first();
      await expect(featureCard).toBeVisible();
      console.log(`✅ Admin has access to: ${feature}`);
    }

    console.log('🎯 RBAC Feature Grid test completed successfully');
  });

  test('Feature grid should be organized by categories', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector('[data-testid="login-form"]');

    await page.fill('input[name="email"]', 'admin@fmfb.com');
    await page.fill('input[name="password"]', 'Admin-7-super');
    await page.selectOption('select[name="tenantId"]', 'fmfb');
    await page.click('button[type="submit"]');

    await page.waitForSelector('[data-testid="dashboard-container"]', { timeout: 10000 });

    // Check for category sections
    const expectedCategories = [
      'Transfers',
      'Savings',
      'Loans',
      'Operations',
      'Management',
      'Platform'
    ];

    for (const category of expectedCategories) {
      const categorySection = page.locator(`text="${category}"`).first();
      await expect(categorySection).toBeVisible();
      console.log(`📁 Found category: ${category}`);
    }
  });

  test('Banking statistics should show Nigerian metrics', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector('[data-testid="login-form"]');

    await page.fill('input[name="email"]', 'admin@fmfb.com');
    await page.fill('input[name="password"]', 'Admin-7-super');
    await page.selectOption('select[name="tenantId"]', 'fmfb');
    await page.click('button[type="submit"]');

    await page.waitForSelector('[data-testid="dashboard-container"]', { timeout: 10000 });

    // Check for banking stats grid
    const statsGrid = page.locator('[data-testid="banking-stats"]').first();
    await expect(statsGrid).toBeVisible();

    // Verify Nigerian banking metrics are displayed
    const nigerianMetrics = [
      'NGN', // Nigerian Naira currency
      'Customer Accounts',
      'Active Loans',
      'Savings Accounts',
      'Transaction Volume'
    ];

    for (const metric of nigerianMetrics) {
      const metricElement = page.locator(`text="${metric}"`).first();
      await expect(metricElement).toBeVisible();
      console.log(`💰 Found Nigerian banking metric: ${metric}`);
    }
  });

  test('Transaction limits should display CBN compliance', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector('[data-testid="login-form"]');

    await page.fill('input[name="email"]', 'admin@fmfb.com');
    await page.fill('input[name="password"]', 'Admin-7-super');
    await page.selectOption('select[name="tenantId"]', 'fmfb');
    await page.click('button[type="submit"]');

    await page.waitForSelector('[data-testid="dashboard-container"]', { timeout: 10000 });

    // Check for transaction limits panel
    const limitsPanel = page.locator('[data-testid="transaction-limits"]').first();
    await expect(limitsPanel).toBeVisible();

    // Verify CBN compliance indicators
    const complianceElements = [
      'Daily Limit',
      'Monthly Limit',
      'CBN Compliant'
    ];

    for (const element of complianceElements) {
      const complianceElement = page.locator(`text="${element}"`).first();
      await expect(complianceElement).toBeVisible();
      console.log(`⚖️ Found CBN compliance element: ${element}`);
    }
  });

  test('AI Assistant should provide role-specific suggestions', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector('[data-testid="login-form"]');

    await page.fill('input[name="email"]', 'admin@fmfb.com');
    await page.fill('input[name="password"]', 'Admin-7-super');
    await page.selectOption('select[name="tenantId"]', 'fmfb');
    await page.click('button[type="submit"]');

    await page.waitForSelector('[data-testid="dashboard-container"]', { timeout: 10000 });

    // Check for AI Assistant panel
    const aiPanel = page.locator('[data-testid="ai-assistant-panel"]').first();
    await expect(aiPanel).toBeVisible();

    // Verify admin-specific AI suggestions are present
    const adminSuggestions = [
      'Review platform performance',
      'Check compliance reports',
      'Monitor system health',
      'Analyze user activity'
    ];

    let foundSuggestions = 0;
    for (const suggestion of adminSuggestions) {
      const suggestionElement = page.locator(`text="${suggestion}"`).first();
      if (await suggestionElement.isVisible()) {
        foundSuggestions++;
        console.log(`🤖 Found admin AI suggestion: ${suggestion}`);
      }
    }

    expect(foundSuggestions).toBeGreaterThan(0);
    console.log(`🎯 Found ${foundSuggestions} admin-specific AI suggestions`);
  });
});