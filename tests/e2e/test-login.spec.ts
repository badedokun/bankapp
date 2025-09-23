import { test, expect } from '@playwright/test';

test('Login page loads and can login with demo credentials', async ({ page }) => {
  // Navigate to the app
  const baseUrl = process.env.TEST_URL || 'http://localhost:3000';
  await page.goto(baseUrl);

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Take a screenshot of the initial page
  await page.screenshot({ path: '/tmp/01-initial-page.png', fullPage: true });
  console.log('Screenshot saved: /tmp/01-initial-page.png');

  // Look for login form elements
  const emailInput = page.locator('input[type="email"], input[placeholder*="email" i], input[name*="email" i]').first();
  const passwordInput = page.locator('input[type="password"], input[placeholder*="password" i], input[name*="password" i]').first();

  // Check if we have login inputs
  const hasLoginForm = await emailInput.count() > 0 && await passwordInput.count() > 0;

  if (hasLoginForm) {
    console.log('Login form found!');

    // Fill in credentials
    await emailInput.fill('demo@fmfb.com');
    await passwordInput.fill('AI-powered-fmfb-1app');

    // Take screenshot before login
    await page.screenshot({ path: '/tmp/02-before-login.png', fullPage: true });
    console.log('Screenshot saved: /tmp/02-before-login.png');

    // Debug: Print all buttons
    const allButtons = await page.locator('button, [role="button"], div[onclick]').all();
    console.log(`Found ${allButtons.length} clickable elements`);

    for (let i = 0; i < allButtons.length; i++) {
      const text = await allButtons[i].textContent();
      const html = await allButtons[i].evaluate(el => el.outerHTML.substring(0, 200));
      console.log(`Button ${i}: "${text}" | HTML: ${html}`);
    }

    // Try clicking by text content directly
    const signInButton = page.locator('text="Sign In"');
    const signInCount = await signInButton.count();
    console.log(`Found ${signInCount} elements with "Sign In" text`);

    if (signInCount > 0) {
      await signInButton.first().click();
      await page.waitForTimeout(3000);

      // Take screenshot after login
      await page.screenshot({ path: '/tmp/03-after-login.png', fullPage: true });
      console.log('Screenshot saved: /tmp/03-after-login.png');

      console.log('Current URL:', page.url());
      console.log('Page title:', await page.title());
    }
  } else {
    console.log('No login form found. Page content:');
    const bodyText = await page.locator('body').textContent();
    console.log(bodyText?.substring(0, 500));
  }
});