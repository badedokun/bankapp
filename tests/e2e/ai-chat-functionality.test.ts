import { test, expect } from '@playwright/test';

test.describe('AI Chat Functionality', () => {
  const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';

  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto(baseURL);

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Login with admin credentials
    await page.fill('input[placeholder*="email" i]', 'admin@fmfb.com');
    await page.fill('input[placeholder*="password" i]', 'Admin-7-super');
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');

    // Wait for dashboard to load
    await page.waitForTimeout(3000);
  });

  test('should display AI chat interface and handle responses', async ({ page }) => {
    // Look for AI Assistant or Chat button
    const aiButton = page.locator('text=AI Assistant, text=Start Conversation, text=AI, [data-testid="ai-chat-button"]').first();

    if (await aiButton.isVisible()) {
      await aiButton.click();
    } else {
      // Try navigating directly to AI chat if button not found
      await page.goto(`${baseURL}#/ai-chat`);
    }

    // Wait for AI chat screen to load
    await page.waitForTimeout(2000);

    // Check if we're on the AI chat screen
    const chatInterface = page.locator('text=AI Assistant, text=AI Banking Assistant, input[placeholder*="message" i], input[placeholder*="type" i]');
    await expect(chatInterface.first()).toBeVisible({ timeout: 10000 });

    // Find the message input field
    const messageInput = page.locator('input[placeholder*="message" i], input[placeholder*="type" i], textarea[placeholder*="message" i]').first();
    await expect(messageInput).toBeVisible();

    // Type a test message
    const testMessage = "What is my account balance?";
    await messageInput.fill(testMessage);

    // Find and click send button
    const sendButton = page.locator('button:has-text("→"), button:has-text("Send"), [data-testid="send-button"], button[type="submit"]').last();
    await sendButton.click();

    // Wait for response
    await page.waitForTimeout(5000);

    // Check if the user message appears
    const userMessage = page.locator(`text=${testMessage}`);
    await expect(userMessage).toBeVisible();

    // Check if AI response appears
    const aiResponse = page.locator('text=balance, text=₦, text=account').first();
    await expect(aiResponse).toBeVisible({ timeout: 15000 });

    // Verify that the response contains expected balance information
    const responseText = await page.textContent('body');
    expect(responseText).toContain('₦');

    console.log('✅ AI Chat functionality test completed successfully');
  });

  test('should handle AI chat suggestions', async ({ page }) => {
    // Navigate to AI chat
    const aiButton = page.locator('text=AI Assistant, text=Start Conversation, text=AI').first();

    if (await aiButton.isVisible()) {
      await aiButton.click();
    } else {
      await page.goto(`${baseURL}#/ai-chat`);
    }

    await page.waitForTimeout(2000);

    // Look for suggestion chips
    const suggestions = page.locator('text=Check balance, text=Transfer money, text=View transactions');

    if (await suggestions.first().isVisible()) {
      await suggestions.first().click();

      // Wait for response
      await page.waitForTimeout(3000);

      // Check if response appears
      const response = page.locator('text=balance, text=₦').first();
      await expect(response).toBeVisible({ timeout: 10000 });
    }

    console.log('✅ AI Chat suggestions test completed');
  });

  test('should handle multiple messages in conversation', async ({ page }) => {
    // Navigate to AI chat
    const aiButton = page.locator('text=AI Assistant, text=Start Conversation, text=AI').first();

    if (await aiButton.isVisible()) {
      await aiButton.click();
    } else {
      await page.goto(`${baseURL}#/ai-chat`);
    }

    await page.waitForTimeout(2000);

    const messageInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]').first();
    const sendButton = page.locator('button:has-text("→"), button:has-text("Send")').last();

    // Send first message
    await messageInput.fill("Hello");
    await sendButton.click();
    await page.waitForTimeout(3000);

    // Send second message
    await messageInput.fill("What is my balance?");
    await sendButton.click();
    await page.waitForTimeout(5000);

    // Check if both messages and responses are visible
    const helloMessage = page.locator('text=Hello');
    const balanceMessage = page.locator('text=What is my balance?');

    await expect(helloMessage).toBeVisible();
    await expect(balanceMessage).toBeVisible();

    // Check for AI responses
    const aiResponses = page.locator('text=₦, text=balance, text=help').first();
    await expect(aiResponses).toBeVisible();

    console.log('✅ Multiple messages conversation test completed');
  });
});