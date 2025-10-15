import { test, expect, chromium } from '@playwright/test';

test.describe('FMFB Production Login Test - Standalone', () => {
  test.use({
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 }
  });

  test('should successfully login with admin credentials', async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      console.log('🌐 Navigating to FMFB login page...');
      await page.goto('https://fmfb-34-59-143-25.nip.io/', { waitUntil: 'domcontentloaded' });

      // Wait a bit for the page to load
      await page.waitForTimeout(3000);

      // Take screenshot of login page
      await page.screenshot({ path: '/tmp/01-login-page.png', fullPage: true });
      console.log('📸 Screenshot saved: /tmp/01-login-page.png');

      // Log page title
      const title = await page.title();
      console.log('📄 Page title:', title);

      // Get current URL
      console.log('🔗 Current URL:', page.url());

      // Listen for console messages
      page.on('console', msg => {
        const type = msg.type();
        if (type === 'error' || type === 'warning') {
          console.log(`🖥️  Browser ${type}:`, msg.text());
        }
      });

      // Listen for network requests
      page.on('request', request => {
        if (request.url().includes('/api/')) {
          console.log(`📤 API Request: ${request.method()} ${request.url()}`);
        }
      });

      page.on('response', async response => {
        if (response.url().includes('/api/')) {
          console.log(`📥 API Response: ${response.status()} ${response.url()}`);
          if (response.url().includes('/api/auth/login')) {
            try {
              const body = await response.text();
              console.log('📥 Login Response Body:', body.substring(0, 300));
            } catch (e) {
              console.log('Could not read response body');
            }
          }
        }
      });

      // Try to find email input with multiple selectors
      console.log('🔍 Looking for email input...');
      let emailInput;
      try {
        emailInput = await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      } catch {
        try {
          emailInput = await page.waitForSelector('input[placeholder*="email" i]', { timeout: 5000 });
        } catch {
          emailInput = await page.waitForSelector('input[name="email"]', { timeout: 5000 });
        }
      }

      if (emailInput) {
        console.log('✅ Email input found');
        await emailInput.fill('admin@fmfb.com');
        console.log('✅ Email filled: admin@fmfb.com');
      } else {
        console.log('❌ Could not find email input');
        await page.screenshot({ path: '/tmp/error-no-email-input.png', fullPage: true });
        throw new Error('Email input not found');
      }

      // Find password field
      console.log('🔍 Looking for password input...');
      const passwordInput = await page.waitForSelector('input[type="password"]', { timeout: 5000 });
      if (passwordInput) {
        console.log('✅ Password input found');
        await passwordInput.fill('Admin-7-super');
        console.log('✅ Password filled');
      }

      // Take screenshot before login
      await page.screenshot({ path: '/tmp/02-before-login.png', fullPage: true });
      console.log('📸 Screenshot saved: /tmp/02-before-login.png');

      // Find and click login button
      console.log('🔍 Looking for login button...');
      let loginButton;
      try {
        loginButton = await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
      } catch {
        loginButton = await page.waitForSelector('button:has-text("Login")', { timeout: 5000 });
      }

      if (loginButton) {
        console.log('✅ Login button found');
        await loginButton.click();
        console.log('🔄 Login button clicked, waiting for response...');
      }

      // Wait for navigation or response
      await page.waitForTimeout(5000);

      // Take screenshot after login attempt
      await page.screenshot({ path: '/tmp/03-after-login.png', fullPage: true });
      console.log('📸 Screenshot saved: /tmp/03-after-login.png');

      // Check current URL
      const currentUrl = page.url();
      console.log('🔗 URL after login:', currentUrl);

      // Check if we're still on login page or navigated away
      if (currentUrl.includes('/login') || currentUrl === 'https://fmfb-34-59-143-25.nip.io/') {
        console.log('⚠️  Still on login page - checking for errors...');

        // Try to find error messages
        const errorElements = await page.$$('text=/error|invalid|failed/i');
        if (errorElements.length > 0) {
          for (const el of errorElements) {
            const text = await el.textContent();
            console.log('❌ Error message found:', text);
          }
        }

        // Get all text content to see what's on the page
        const bodyText = await page.textContent('body');
        console.log('📄 Page content sample:', bodyText?.substring(0, 500));

      } else {
        console.log('✅ Login successful! Navigated to:', currentUrl);
      }

      // Keep browser open for a bit to see the result
      console.log('⏳ Keeping browser open for 10 seconds...');
      await page.waitForTimeout(10000);

    } catch (error) {
      console.error('❌ Test failed with error:', error);
      await page.screenshot({ path: '/tmp/error-screenshot.png', fullPage: true });
      console.log('📸 Error screenshot saved: /tmp/error-screenshot.png');
      throw error;
    } finally {
      await browser.close();
    }
  });
});
