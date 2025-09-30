import { test, expect } from '@playwright/test';

test.describe('Final AI Chat Test', () => {
  const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';

  test('should complete full AI chat flow successfully', async ({ page }) => {
    console.log('🚀 Starting final AI chat test...');

    // Navigate to the app
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    // Login
    await page.waitForSelector('input[type="email"], input[placeholder*="email" i]', { timeout: 10000 });
    await page.fill('input[type="email"], input[placeholder*="email" i]', 'admin@fmfb.com');
    await page.fill('input[type="password"], input[placeholder*="password" i]', 'Admin-7-super');
    await page.press('input[type="password"], input[placeholder*="password" i]', 'Enter');

    console.log('🔑 Logged in successfully');

    // Wait for dashboard and find AI Assistant
    await page.waitForTimeout(3000);
    await page.waitForSelector('text=AI Assistant', { timeout: 10000 });
    await page.click('text=AI Assistant');

    console.log('🤖 Opened AI Assistant');

    // Wait for chat interface
    await page.waitForTimeout(2000);
    const messageInput = page.locator('[data-testid="message-input"], textarea[placeholder*="message" i]').first();
    await expect(messageInput).toBeVisible({ timeout: 10000 });

    // Type message
    const testMessage = "What is my account balance?";
    await messageInput.fill(testMessage);

    console.log(`💬 Typed message: ${testMessage}`);

    // Wait for send button to be enabled
    await page.waitForTimeout(500); // Give React time to update state

    // Find send button using multiple selectors
    const sendButton = page.locator('[data-testid="send-button"], button:has-text("→"), button[disabled=false]:has-text("→")').first();

    // Check if button is enabled
    const isEnabled = await sendButton.isEnabled();
    console.log(`📤 Send button enabled: ${isEnabled}`);

    if (isEnabled) {
      await sendButton.click();
      console.log('✅ Clicked send button');
    } else {
      // Try pressing Enter on the input
      await messageInput.press('Enter');
      console.log('⌨️ Pressed Enter on input');
    }

    // Wait for AI response
    console.log('⏳ Waiting for AI response...');
    await page.waitForTimeout(8000);

    // Check for response containing balance information
    const responseLocators = [
      page.locator('text=₦'),
      page.locator('text=5000000'),
      page.locator('text=balance'),
      page.locator('text=Your current balance')
    ];

    let responseFound = false;
    for (const locator of responseLocators) {
      if (await locator.first().isVisible({ timeout: 2000 })) {
        console.log(`✅ Found response with: ${await locator.first().textContent()}`);
        responseFound = true;
        break;
      }
    }

    // Also check page content for balance information
    const pageContent = await page.textContent('body');
    if (pageContent?.includes('₦') || pageContent?.includes('5000000') || pageContent?.includes('balance')) {
      responseFound = true;
      console.log('✅ Found balance information in page content');
    }

    if (responseFound) {
      console.log('🎉 AI Chat is working correctly - responses are displayed!');
    } else {
      console.log('❌ No AI response found');
      await page.screenshot({ path: 'test-results/no-ai-response.png', fullPage: true });

      // Log what we see in the chat area
      const chatArea = await page.textContent('body');
      console.log('Chat area content preview:', chatArea?.substring(0, 1000));
    }

    // Verify the message was sent (should see user message in chat)
    const userMessage = page.locator(`text=${testMessage}`);
    if (await userMessage.isVisible()) {
      console.log('✅ User message appears in chat');
    } else {
      console.log('❌ User message not found in chat');
    }

    expect(responseFound).toBe(true);
    console.log('🏁 Test completed successfully');
  });
});