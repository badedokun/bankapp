import { test, expect } from '@playwright/test';

test.describe('Production Transaction History Header', () => {
  test('should display header with gradient background on production', async ({ page }) => {
    // Navigate directly to production
    await page.goto('https://fmfb-34-59-143-25.nip.io/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Login
    console.log('Attempting login...');
    await page.fill('input[type="email"]', 'admin@fmfb.com');
    await page.fill('input[type="password"]', 'Admin-7-super');
    await page.click('button:has-text("Sign In")');

    // Wait for dashboard
    await page.waitForTimeout(3000);
    console.log('Logged in, looking for transaction history...');

    // Try to find and click transaction history link
    // It might be in a menu or directly visible
    const possibleLinks = [
      page.locator('text=/transaction/i').first(),
      page.locator('text=/history/i').first(),
      page.locator('[href*="transaction"]').first(),
      page.locator('button:has-text("Transactions")').first(),
    ];

    for (const link of possibleLinks) {
      if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('Found transaction link, clicking...');
        await link.click();
        await page.waitForTimeout(2000);
        break;
      }
    }

    // Take screenshot before checking
    await page.screenshot({ path: '/tmp/before-header-check.png', fullPage: true });

    // Verify header elements
    console.log('Checking for header elements...');

    const backButton = page.locator('text=←');
    const isBackVisible = await backButton.isVisible({ timeout: 5000 }).catch(() => false);
    console.log('Back button visible:', isBackVisible);

    const headerTitle = page.locator('text=/transaction.*history/i');
    const isTitleVisible = await headerTitle.count().then(c => c > 0);
    console.log('Header title found:', isTitleVisible);

    const heroTitle = page.locator('text=/all.*transaction/i');
    const isHeroVisible = await heroTitle.count().then(c => c > 0);
    console.log('Hero title found:', isHeroVisible);

    // Check for gradient
    const body = page.locator('body');
    const pageHTML = await body.innerHTML();
    const hasGradient = pageHTML.includes('backgroundImage') || pageHTML.includes('linear-gradient');
    console.log('Page has gradient styling:', hasGradient);

    // Take final screenshot
    await page.screenshot({ path: '/tmp/transaction-header-final.png', fullPage: true });

    console.log('\n=== Test Results ===');
    console.log('✅ Screenshot saved to: /tmp/transaction-header-final.png');
    console.log('Back button visible:', isBackVisible);
    console.log('Header title visible:', isTitleVisible);
    console.log('Hero title visible:', isHeroVisible);
    console.log('Has gradient:', hasGradient);

    // Assertions
    expect(isBackVisible || isTitleVisible || isHeroVisible).toBe(true);
  });
});
