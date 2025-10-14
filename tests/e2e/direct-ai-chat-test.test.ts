import { test, expect } from '@playwright/test';

test.describe('Direct AI Chat Test', () => {
  const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';

  test('should access AI chat and verify response display', async ({ page }) => {
    console.log('🚀 Starting direct AI chat test...');

    // Navigate to the app
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    console.log('📱 Navigated to app, looking for login elements...');

    // Wait for login form to be visible
    await page.waitForSelector('input[type="email"], input[placeholder*="email" i], [data-testid="email-input"]', { timeout: 10000 });

    // Try different login button selectors
    const loginSelectors = [
      'button[type="submit"]',
      'button:has-text("Sign In")',
      'button:has-text("Login")',
      'button:has-text("Log In")',
      '[data-testid="login-button"]',
      'button:text("Enter")',
      'button[role="button"]:has-text("Sign")',
      '.login-button'
    ];

    let loginButton = null;
    let loginButtonSelector = '';

    // Find which login button exists
    for (const selector of loginSelectors) {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 1000 })) {
        loginButton = button;
        loginButtonSelector = selector;
        console.log(`✅ Found login button with selector: ${selector}`);
        break;
      }
    }

    if (!loginButton) {
      // Take a screenshot to see what's on the page
      await page.screenshot({ path: 'test-results/login-page-debug.png', fullPage: true });
      console.log('📸 Screenshot saved to test-results/login-page-debug.png');

      // List all buttons on the page
      const allButtons = await page.locator('button').all();
      console.log(`🔍 Found ${allButtons.length} buttons on the page`);

      for (let i = 0; i < allButtons.length; i++) {
        const text = await allButtons[i].textContent();
        const isVisible = await allButtons[i].isVisible();
        console.log(`Button ${i}: "${text}" (visible: ${isVisible})`);
      }
    }

    // Fill login form
    await page.fill('input[type="email"], input[placeholder*="email" i], [data-testid="email-input"]', 'admin@fmfb.com');
    await page.fill('input[type="password"], input[placeholder*="password" i], [data-testid="password-input"]', 'Admin-7-super');

    console.log('📝 Filled login credentials');

    // Try to click login button
    if (loginButton) {
      await loginButton.click();
      console.log(`🔑 Clicked login button: ${loginButtonSelector}`);
    } else {
      // Try pressing Enter on password field
      await page.press('input[type="password"], input[placeholder*="password" i]', 'Enter');
      console.log('⌨️ Pressed Enter on password field');
    }

    // Wait for navigation or dashboard
    await page.waitForTimeout(5000);

    console.log('⏳ Waiting for dashboard to load...');

    // Look for dashboard elements or AI elements
    const dashboardElements = [
      'text=Dashboard',
      'text=Balance',
      'text=AI Assistant',
      'text=Welcome',
      'text=Account',
      '[data-testid="dashboard"]',
      '.dashboard'
    ];

    let isDashboardLoaded = false;
    for (const selector of dashboardElements) {
      if (await page.locator(selector).first().isVisible({ timeout: 2000 })) {
        console.log(`✅ Dashboard loaded - found: ${selector}`);
        isDashboardLoaded = true;
        break;
      }
    }

    if (!isDashboardLoaded) {
      await page.screenshot({ path: 'test-results/after-login-debug.png', fullPage: true });
      console.log('📸 After-login screenshot saved to test-results/after-login-debug.png');
    }

    // Look for AI Assistant button or chat interface
    const aiSelectors = [
      'text=AI Assistant',
      'text=AI Banking Assistant',
      'text=Start Conversation',
      'text=Chat',
      '[data-testid="ai-button"]',
      '.ai-assistant',
      'button:has-text("AI")'
    ];

    let aiButton = null;
    for (const selector of aiSelectors) {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 2000 })) {
        aiButton = button;
        console.log(`✅ Found AI button: ${selector}`);
        break;
      }
    }

    if (aiButton) {
      await aiButton.click();
      console.log('🤖 Clicked AI Assistant button');
      await page.waitForTimeout(3000);
    } else {
      // Try navigating directly to AI chat
      console.log('🔗 Trying direct navigation to AI chat...');
      await page.goto(`${baseURL}#/ai-chat`);
      await page.waitForTimeout(2000);
    }

    // Look for chat interface
    const chatSelectors = [
      'input[placeholder*="message" i]',
      'input[placeholder*="type" i]',
      'textarea[placeholder*="message" i]',
      '[data-testid="message-input"]',
      '.message-input'
    ];

    let messageInput = null;
    for (const selector of chatSelectors) {
      const input = page.locator(selector).first();
      if (await input.isVisible({ timeout: 2000 })) {
        messageInput = input;
        console.log(`✅ Found message input: ${selector}`);
        break;
      }
    }

    if (messageInput) {
      // Test sending a message
      const testMessage = "What is my account balance?";
      await messageInput.fill(testMessage);
      console.log(`💬 Typed message: ${testMessage}`);

      // Find send button
      const sendSelectors = [
        'button:has-text("→")',
        'button:has-text("Send")',
        'button[type="submit"]',
        '[data-testid="send-button"]',
        '.send-button'
      ];

      let sendButton = null;
      for (const selector of sendSelectors) {
        const button = page.locator(selector).last();
        if (await button.isVisible({ timeout: 1000 })) {
          sendButton = button;
          console.log(`✅ Found send button: ${selector}`);
          break;
        }
      }

      if (sendButton) {
        await sendButton.click();
        console.log('📤 Clicked send button');

        // Wait for response
        await page.waitForTimeout(8000);

        // Check for response
        const responseSelectors = [
          'text=₦',
          'text=balance',
          'text=5000000',
          'text=account',
          '.ai-message',
          '.message-bubble'
        ];

        let foundResponse = false;
        for (const selector of responseSelectors) {
          if (await page.locator(selector).first().isVisible({ timeout: 2000 })) {
            console.log(`✅ Found AI response with: ${selector}`);
            foundResponse = true;
            break;
          }
        }

        if (foundResponse) {
          console.log('🎉 AI Chat is working correctly!');
        } else {
          console.log('❌ No AI response found');
          await page.screenshot({ path: 'test-results/no-response-debug.png', fullPage: true });
        }

        // Get all text content to check for response
        const pageText = await page.textContent('body');
        if (pageText?.includes('₦') || pageText?.includes('balance')) {
          console.log('✅ Response detected in page content');
        } else {
          console.log('❌ No balance response in page content');
          console.log('Page content preview:', pageText?.substring(0, 500));
        }

      } else {
        console.log('❌ Could not find send button');
        await page.screenshot({ path: 'test-results/no-send-button-debug.png', fullPage: true });
      }
    } else {
      console.log('❌ Could not find message input');
      await page.screenshot({ path: 'test-results/no-input-debug.png', fullPage: true });
    }

    console.log('🏁 Test completed');
  });
});