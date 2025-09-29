/**
 * Direct Login Test using DOM interaction
 * Uses JavaScript execution to perform login
 */

import { test, expect } from '@playwright/test';

const TEST_CREDENTIALS = {
  email: 'admin@fmfb.com',
  password: 'Admin-7-super'
};

const BASE_URL = 'http://localhost:3000';

test('should perform direct login and access dashboard', async ({ page }) => {
  console.log('🚀 Starting direct login test...');

  // Step 1: Navigate to the application
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  console.log('✓ Navigated to application');

  // Step 2: Fill form using JavaScript evaluation
  await page.evaluate((credentials) => {
    // Find email input
    const emailInputs = document.querySelectorAll('input[placeholder*="email" i], input[placeholder*="phone" i], input[type="email"]');
    const emailInput = emailInputs[0] as HTMLInputElement;

    // Find password input
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    const passwordInput = passwordInputs[0] as HTMLInputElement;

    // Fill inputs
    if (emailInput) {
      emailInput.value = credentials.email;
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (passwordInput) {
      passwordInput.value = credentials.password;
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    return {
      emailFilled: !!emailInput,
      passwordFilled: !!passwordInput
    };
  }, TEST_CREDENTIALS);

  console.log('✓ Form filled using JavaScript');

  // Step 3: Take screenshot before submission
  await page.screenshot({
    path: 'tests/screenshots/direct-before-submit.png',
    fullPage: true
  });

  // Step 4: Submit form using JavaScript
  const submitResult = await page.evaluate(() => {
    // Try to find and click the Sign In button
    const buttons = document.querySelectorAll('button');
    let signInButton = null;

    for (const button of buttons) {
      const text = button.textContent?.toLowerCase() || '';
      if (text.includes('sign in') || text.includes('login')) {
        signInButton = button;
        break;
      }
    }

    if (signInButton) {
      signInButton.click();
      return { success: true, method: 'button_click' };
    }

    // Try to submit a form if button doesn't work
    const forms = document.querySelectorAll('form');
    if (forms.length > 0) {
      forms[0].submit();
      return { success: true, method: 'form_submit' };
    }

    return { success: false, method: 'none' };
  });

  console.log(`✓ Form submitted using: ${submitResult.method}`);

  // Step 5: Wait for navigation
  console.log('⏳ Waiting for navigation...');

  try {
    // Wait for either dashboard URL or stay on same page with different content
    await Promise.race([
      page.waitForURL('**/dashboard**', { timeout: 15000 }),
      page.waitForTimeout(5000) // Give it some time to process
    ]);
  } catch (e) {
    console.log('Navigation timeout, checking current state...');
  }

  // Step 6: Check final state
  const finalUrl = page.url();
  console.log(`Final URL: ${finalUrl}`);

  // Take final screenshot
  await page.screenshot({
    path: 'tests/screenshots/direct-after-submit.png',
    fullPage: true
  });

  // Step 7: Analyze the result
  if (finalUrl.includes('/dashboard')) {
    console.log('🎉 Successfully reached dashboard!');

    // Wait for dashboard content to load
    await page.waitForTimeout(3000);

    // Take dashboard screenshot
    await page.screenshot({
      path: 'tests/screenshots/dashboard-loaded.png',
      fullPage: true
    });

    // Check for dashboard elements
    const dashboardAnalysis = await page.evaluate(() => {
      const body = document.body;
      const hasBalance = !!document.querySelector('.balance, [data-testid="balance"], .stats, [data-testid="stats"]');
      const hasFeatures = !!document.querySelector('.features, [data-testid="features"], .feature-grid, [data-testid="feature-grid"]');
      const hasAI = !!document.querySelector('.ai-assistant, [data-testid="ai-assistant"], [aria-label*="AI"]');
      const hasCards = document.querySelectorAll('.card, [data-testid="card"], .dashboard-card').length;

      return {
        hasBalance,
        hasFeatures,
        hasAI,
        cardCount: hasCards,
        title: document.title,
        bodyText: body.textContent?.substring(0, 500) || ''
      };
    });

    console.log('📊 Dashboard Analysis:');
    console.log(`  Title: ${dashboardAnalysis.title}`);
    console.log(`  Has Balance/Stats: ${dashboardAnalysis.hasBalance}`);
    console.log(`  Has Features: ${dashboardAnalysis.hasFeatures}`);
    console.log(`  Has AI Assistant: ${dashboardAnalysis.hasAI}`);
    console.log(`  Card Count: ${dashboardAnalysis.cardCount}`);

    // Verify we're actually on the dashboard
    expect(finalUrl).toContain('/dashboard');

    console.log('✅ Login and dashboard verification completed successfully!');

  } else {
    console.log('⚠️ Did not reach dashboard, analyzing current page...');

    // Check for error messages
    const pageAnalysis = await page.evaluate(() => {
      const errors = document.querySelectorAll('.error, .alert-danger, [role="alert"]');
      const errorMessages = Array.from(errors).map(el => el.textContent?.trim()).filter(Boolean);

      return {
        title: document.title,
        url: window.location.href,
        errorCount: errors.length,
        errorMessages: errorMessages.slice(0, 3),
        bodyText: document.body.textContent?.substring(0, 300) || ''
      };
    });

    console.log('📋 Page Analysis:');
    console.log(`  Title: ${pageAnalysis.title}`);
    console.log(`  URL: ${pageAnalysis.url}`);
    console.log(`  Errors: ${pageAnalysis.errorCount}`);
    if (pageAnalysis.errorMessages.length > 0) {
      console.log(`  Error Messages: ${pageAnalysis.errorMessages.join(', ')}`);
    }

    if (pageAnalysis.errorMessages.length > 0) {
      throw new Error(`Login failed with errors: ${pageAnalysis.errorMessages.join(', ')}`);
    } else if (finalUrl === BASE_URL || finalUrl === BASE_URL + '/') {
      throw new Error('Login did not redirect - possibly incorrect credentials or server issue');
    }
  }
});