import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const API_URL = 'http://localhost:3001';

test.describe('AI Chat Spending Analysis E2E Test', () => {
  test.beforeEach(async ({ page }) => {
    // Set timeout for this test
    test.setTimeout(60000);

    // Navigate to the application
    await page.goto(BASE_URL);

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should successfully analyze spending when user asks "am I spending too much?"', async ({ page }) => {
    console.log('Starting AI Chat Spending Analysis test...');

    // Step 1: Login with admin credentials
    console.log('Step 1: Logging in...');

    // Wait for and fill login form
    await page.waitForSelector('input[type="email"], input[name="email"], input[placeholder*="mail"]', { timeout: 10000 });
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="mail"]', 'admin@fmfb.com');

    await page.waitForSelector('input[type="password"], input[name="password"], input[placeholder*="assword"]', { timeout: 10000 });
    await page.fill('input[type="password"], input[name="password"], input[placeholder*="assword"]', 'Admin-7-super');

    // Click login button
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign in"), button:has-text("Submit"), button[type="submit"]').first();
    await loginButton.click();

    // Wait for dashboard to load
    console.log('Waiting for dashboard to load...');
    await page.waitForURL(/dashboard|home/i, { timeout: 15000 }).catch(() => {
      console.log('URL did not change to dashboard, checking for dashboard elements...');
    });

    // Verify we're on the dashboard by checking for key elements
    const dashboardLoaded = await page.locator('text=/balance|account|₦|NGN/i').first().isVisible().catch(() => false);
    expect(dashboardLoaded).toBeTruthy();
    console.log('✓ Dashboard loaded successfully');

    // Step 2: Navigate to AI Chat
    console.log('Step 2: Navigating to AI Chat...');

    // Look for AI Chat button or icon
    const aiChatButton = await page.locator('button:has-text("AI"), button:has-text("Chat"), button:has-text("Assistant"), [aria-label*="AI"], [aria-label*="chat"], [title*="AI"]').first();

    if (await aiChatButton.isVisible()) {
      await aiChatButton.click();
      console.log('Clicked AI Chat button');
    } else {
      // Try to find AI Chat in navigation menu
      const navLinks = page.locator('a[href*="ai"], a[href*="chat"], a:has-text("AI Chat"), a:has-text("AI Assistant")');
      if (await navLinks.count() > 0) {
        await navLinks.first().click();
        console.log('Clicked AI Chat navigation link');
      } else {
        // Look for floating AI chat button
        const floatingButton = page.locator('[class*="ai-chat"], [class*="chat-button"], [class*="assistant"]');
        if (await floatingButton.count() > 0) {
          await floatingButton.first().click();
          console.log('Clicked floating AI Chat button');
        }
      }
    }

    // Wait for chat interface to appear
    await page.waitForSelector('[class*="chat"], [class*="message"], textarea[placeholder*="message"], input[placeholder*="message"], textarea[placeholder*="ask"], input[placeholder*="ask"]', { timeout: 10000 });
    console.log('✓ AI Chat interface loaded');

    // Step 3: Send spending inquiry message
    console.log('Step 3: Sending spending inquiry...');

    // Find the message input field
    const messageInput = page.locator('textarea[placeholder*="message"], input[placeholder*="message"], textarea[placeholder*="ask"], input[placeholder*="ask"], textarea[placeholder*="type"], input[placeholder*="type"]').first();
    await messageInput.waitFor({ state: 'visible', timeout: 5000 });

    // Type the spending inquiry
    await messageInput.fill('am I spending too much?');
    console.log('Typed: "am I spending too much?"');

    // Send the message
    const sendButton = page.locator('button:has-text("Send"), button[type="submit"], button[aria-label*="send"]').first();
    if (await sendButton.isVisible()) {
      await sendButton.click();
    } else {
      // Try pressing Enter
      await messageInput.press('Enter');
    }
    console.log('Message sent');

    // Step 4: Wait for and verify AI response
    console.log('Step 4: Waiting for AI response...');

    // Wait for response to appear (look for currency symbols or spending keywords)
    const responseLocator = page.locator('[class*="message"]:has-text("₦"), [class*="message"]:has-text("spending"), [class*="message"]:has-text("balance"), [class*="response"]:has-text("₦")');

    // Wait for the response with increased timeout
    await expect(responseLocator.first()).toBeVisible({ timeout: 20000 });

    // Get the response text
    const responseText = await responseLocator.first().textContent();
    console.log('AI Response received:', responseText);

    // Step 5: Verify response contains expected financial analysis
    console.log('Step 5: Verifying response content...');

    // Check for spending amount (should be ₦582,000)
    expect(responseText).toMatch(/₦\s*582[,.]?000/);
    console.log('✓ Response contains correct spending amount (₦582,000)');

    // Check for balance amount (should be ₦5,000,000)
    expect(responseText).toMatch(/₦\s*5[,.]?000[,.]?000/);
    console.log('✓ Response contains correct balance (₦5,000,000)');

    // Check for spending advice
    const hasSpendingAdvice =
      responseText?.includes('spending is under control') ||
      responseText?.includes('spending is moderate') ||
      responseText?.includes('Consider reducing expenses') ||
      responseText?.includes('spent');

    expect(hasSpendingAdvice).toBeTruthy();
    console.log('✓ Response contains spending advice');

    // Verify it's not the default "Processed:" message
    expect(responseText).not.toMatch(/^Processed:/);
    console.log('✓ Response is not the default "Processed" message');

    // Step 6: Test another financial query
    console.log('Step 6: Testing balance inquiry...');

    // Clear input and ask for balance
    await messageInput.fill('what is my balance?');

    // Send the message
    if (await sendButton.isVisible()) {
      await sendButton.click();
    } else {
      await messageInput.press('Enter');
    }

    // Wait for balance response
    const balanceResponse = await page.locator('[class*="message"]:has-text("₦"):last-of-type, [class*="response"]:has-text("₦"):last-of-type');
    await expect(balanceResponse).toBeVisible({ timeout: 20000 });

    const balanceText = await balanceResponse.textContent();
    console.log('Balance response:', balanceText);

    // Verify balance is shown correctly
    expect(balanceText).toMatch(/₦\s*5[,.]?000[,.]?000/);
    console.log('✓ Balance inquiry works correctly');

    console.log('✅ All AI Chat spending analysis tests passed!');
  });

  test('should display correct transaction count and analysis', async ({ page, request }) => {
    console.log('Testing transaction analysis via API...');

    // First, get a login token
    const loginResponse = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'admin@fmfb.com',
        password: 'Admin-7-super',
        tenantCode: 'fmfb'
      }
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✓ Got authentication token');

    // Test spending inquiry via API
    const chatResponse = await request.post(`${API_URL}/api/ai/chat`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        message: 'am I spending too much?'
      }
    });

    expect(chatResponse.ok()).toBeTruthy();
    const chatData = await chatResponse.json();
    console.log('AI Chat API Response:', JSON.stringify(chatData, null, 2));

    // Verify response structure
    expect(chatData).toHaveProperty('response');
    expect(chatData).toHaveProperty('intent');
    expect(chatData).toHaveProperty('confidence');

    // Verify intent classification
    expect(chatData.intent).toBe('spending_inquiry');
    expect(chatData.confidence).toBeGreaterThan(0.9);
    console.log('✓ Intent correctly classified as spending_inquiry');

    // Verify response content
    const response = chatData.response;
    expect(response).toContain('₦');
    expect(response).not.toMatch(/^Processed:/);

    // Check for specific amounts
    expect(response).toMatch(/₦\s*582[,.]?000/); // Total spending
    expect(response).toMatch(/₦\s*5[,.]?000[,.]?000/); // Balance
    console.log('✓ API response contains correct financial data');

    // Verify suggestions are included
    if (chatData.suggestions) {
      expect(Array.isArray(chatData.suggestions)).toBeTruthy();
      expect(chatData.suggestions.length).toBeGreaterThan(0);
      console.log('✓ Suggestions included in response');
    }

    // Verify insights are included
    if (chatData.insights) {
      expect(chatData.insights).toHaveProperty('insights');
      expect(chatData.insights).toHaveProperty('recommendations');
      console.log('✓ Insights included in response');
    }

    console.log('✅ API transaction analysis test passed!');
  });
});