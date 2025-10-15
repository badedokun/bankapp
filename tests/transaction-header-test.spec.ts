import { test, expect } from '@playwright/test';

test.describe('Transaction History Header Visibility', () => {
  test('should display header with gradient background', async ({ page }) => {
    // Navigate to the application
    await page.goto('https://fmfb-34-59-143-25.nip.io/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Login
    await page.fill('input[type="email"]', 'admin@fmfb.com');
    await page.fill('input[type="password"]', 'Admin-7-super');
    await page.click('button:has-text("Sign In")');

    // Wait for dashboard to load
    await page.waitForTimeout(2000);

    // Navigate to Transaction History
    // Look for the menu button or navigation element
    const transactionLink = page.locator('text=Transaction').or(page.locator('text=History')).or(page.locator('[href*="transaction"]')).first();
    if (await transactionLink.isVisible()) {
      await transactionLink.click();
      await page.waitForTimeout(1000);
    }

    // Verify header elements are visible
    const backButton = page.locator('text=←').first();
    await expect(backButton).toBeVisible({ timeout: 10000 });

    const headerTitle = page.locator('text=Transaction History').first();
    await expect(headerTitle).toBeVisible({ timeout: 10000 });

    // Verify hero section is visible
    const heroTitle = page.locator('text=All Transactions').first();
    await expect(heroTitle).toBeVisible({ timeout: 10000 });

    const heroSubtitle = page.locator('text=All your financial activities').first();
    await expect(heroSubtitle).toBeVisible({ timeout: 10000 });

    // Verify action buttons are visible
    const analyticsButton = page.locator('text=Analytics').first();
    await expect(analyticsButton).toBeVisible({ timeout: 10000 });

    const exportButton = page.locator('text=Export').first();
    await expect(exportButton).toBeVisible({ timeout: 10000 });

    // Verify gradient background is applied (check computed styles)
    const gradientDiv = page.locator('div').filter({ has: backButton }).first();
    const backgroundImage = await gradientDiv.evaluate((el) => {
      return window.getComputedStyle(el.parentElement || el).backgroundImage;
    });

    // Should have a linear-gradient
    expect(backgroundImage).toContain('linear-gradient');

    console.log('✅ All header elements are visible!');
    console.log('✅ Gradient background is applied:', backgroundImage);

    // Take a screenshot for verification
    await page.screenshot({ path: '/tmp/transaction-header-visible.png', fullPage: true });
  });
});
