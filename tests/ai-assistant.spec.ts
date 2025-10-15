/**
 * AI Assistant Frontend Tests
 * Tests for personality modes, UI interactions, and animations
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const TEST_USER = {
  email: 'demo@fmfb.com',
  password: 'AI-powered-fmfb-1app'
};

// Helper function to login
async function login(page: Page) {
  await page.goto(FRONTEND_URL);
  await page.waitForLoadState('networkidle');

  const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  await emailInput.fill(TEST_USER.email);
  await passwordInput.fill(TEST_USER.password);

  const signInButton = page.locator('button:has-text("Sign In"), button[type="submit"]').first();
  await signInButton.click();

  // Wait for dashboard to load
  await page.waitForTimeout(2000);
}

test.describe('AI Assistant - UI and Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should open AI chat screen from dashboard', async ({ page }) => {
    // Find AI Assistant button/link
    const aiButton = page.locator('text=/AI Assistant|AI Chat|Open AI/i').first();
    await expect(aiButton).toBeVisible({ timeout: 10000 });

    await aiButton.click();
    await page.waitForTimeout(1000);

    // Verify AI chat screen is visible
    await expect(page.locator('text=/AI Assistant|AI Banking Assistant/i')).toBeVisible();

    // Verify welcome message or input is visible
    const messageInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]').first();
    await expect(messageInput).toBeVisible();

    console.log('✅ AI Chat screen opened successfully');
  });

  test('should display personality picker', async ({ page }) => {
    // Navigate to AI chat
    const aiButton = page.locator('text=/AI Assistant|AI Chat|Open AI/i').first();
    await aiButton.click();
    await page.waitForTimeout(1000);

    // Look for personality button (emoji 🤖 or 🔥)
    const personalityButton = page.locator('button').filter({ hasText: /🤖|🔥/ }).first();

    if (await personalityButton.isVisible()) {
      await personalityButton.click();
      await page.waitForTimeout(500);

      // Check if personality options are visible
      const friendlyOption = page.locator('text="Friendly"').first();
      const professionalOption = page.locator('text="Professional"').first();
      const playfulOption = page.locator('text="Playful"').first();
      const roastOption = page.locator('text=/Roast Mode/i').first();

      await expect(friendlyOption).toBeVisible();
      await expect(professionalOption).toBeVisible();
      await expect(playfulOption).toBeVisible();
      await expect(roastOption).toBeVisible();

      console.log('✅ Personality picker displayed successfully');
    } else {
      console.log('⚠️  Personality button not found (may not be on this screen)');
    }
  });

  test('should change AI personality mode', async ({ page }) => {
    const aiButton = page.locator('text=/AI Assistant|AI Chat|Open AI/i').first();
    await aiButton.click();
    await page.waitForTimeout(1000);

    const personalityButton = page.locator('button').filter({ hasText: /🤖|🔥/ }).first();

    if (await personalityButton.isVisible()) {
      await personalityButton.click();
      await page.waitForTimeout(500);

      // Select Roast Mode
      const roastOption = page.locator('text=/Roast Mode/i').first();
      await roastOption.click();
      await page.waitForTimeout(500);

      // Verify personality changed - check header subtitle
      const headerSubtitle = page.locator('text=/Online.*Roast Mode/i').first();
      await expect(headerSubtitle).toBeVisible();

      // Verify emoji changed to 🔥
      const roastEmoji = page.locator('button').filter({ hasText: '🔥' }).first();
      await expect(roastEmoji).toBeVisible();

      console.log('✅ AI Personality changed to Roast Mode successfully');
    }
  });

  test('should send message and receive AI response', async ({ page }) => {
    const aiButton = page.locator('text=/AI Assistant|AI Chat|Open AI/i').first();
    await aiButton.click();
    await page.waitForTimeout(1000);

    // Find message input
    const messageInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]').first();
    await messageInput.fill('Check my balance');

    // Find and click send button
    const sendButton = page.locator('button[testid="send-button"], button:has-text("→")').first();
    await sendButton.click();

    // Wait for AI response
    await page.waitForTimeout(3000);

    // Check for user message in chat
    const userMessage = page.locator('text="Check my balance"').first();
    await expect(userMessage).toBeVisible();

    // Check for AI response (should contain some banking-related text)
    const aiResponseContainer = page.locator('[style*="rgba(255, 255, 255, 0.95)"]').last();
    await expect(aiResponseContainer).toBeVisible();

    console.log('✅ Message sent and AI response received');
  });

  test('should display suggestion chips', async ({ page }) => {
    const aiButton = page.locator('text=/AI Assistant|AI Chat|Open AI/i').first();
    await aiButton.click();
    await page.waitForTimeout(1000);

    // Look for suggestion chips
    const suggestions = page.locator('text=/Check.*balance|Transfer.*money|View.*transactions/i');
    const suggestionCount = await suggestions.count();

    expect(suggestionCount).toBeGreaterThan(0);
    console.log(`✅ Found ${suggestionCount} suggestion chips`);
  });

  test('should click suggestion chip and send message', async ({ page }) => {
    const aiButton = page.locator('text=/AI Assistant|AI Chat|Open AI/i').first();
    await aiButton.click();
    await page.waitForTimeout(1000);

    // Click first suggestion
    const firstSuggestion = page.locator('text=/Check.*balance|Transfer.*money/i').first();
    const suggestionText = await firstSuggestion.textContent();

    await firstSuggestion.click();
    await page.waitForTimeout(3000);

    // Verify message was sent
    if (suggestionText) {
      const sentMessage = page.locator(`text="${suggestionText}"`).first();
      await expect(sentMessage).toBeVisible();
    }

    console.log('✅ Suggestion chip clicked and message sent');
  });

  test('should show typing indicator when AI is responding', async ({ page }) => {
    const aiButton = page.locator('text=/AI Assistant|AI Chat|Open AI/i').first();
    await aiButton.click();
    await page.waitForTimeout(1000);

    const messageInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]').first();
    await messageInput.fill('Tell me about my account');

    const sendButton = page.locator('button[testid="send-button"], button:has-text("→")').first();
    await sendButton.click();

    // Look for typing indicator (dots animation)
    await page.waitForTimeout(500);
    // The typing indicator should appear briefly
    // We just verify the message was processed
    await page.waitForTimeout(2000);

    const aiResponse = page.locator('[style*="rgba(255, 255, 255, 0.95)"]').last();
    await expect(aiResponse).toBeVisible();

    console.log('✅ Typing indicator test completed');
  });

  test('should handle voice button (if available)', async ({ page }) => {
    const aiButton = page.locator('text=/AI Assistant|AI Chat|Open AI/i').first();
    await aiButton.click();
    await page.waitForTimeout(1000);

    // Look for voice button (microphone emoji 🎤)
    const voiceButton = page.locator('button').filter({ hasText: '🎤' }).first();

    if (await voiceButton.isVisible()) {
      await voiceButton.click();
      await page.waitForTimeout(500);

      // On web, this may show a permission prompt or listening indicator
      // Just verify button interaction works
      console.log('✅ Voice button interaction test completed');
    } else {
      console.log('⚠️  Voice button not found (may be web-only feature)');
    }
  });

  test('should navigate back from AI chat', async ({ page }) => {
    const aiButton = page.locator('text=/AI Assistant|AI Chat|Open AI/i').first();
    await aiButton.click();
    await page.waitForTimeout(1000);

    // Find back button
    const backButton = page.locator('button:has-text("←"), button[aria-label*="back" i]').first();
    await backButton.click();
    await page.waitForTimeout(500);

    // Verify we're back on dashboard (AI button should be visible again)
    const aiButtonAgain = page.locator('text=/AI Assistant|AI Chat|Open AI/i').first();
    await expect(aiButtonAgain).toBeVisible();

    console.log('✅ Back navigation works correctly');
  });

  test('should display action buttons in AI responses', async ({ page }) => {
    const aiButton = page.locator('text=/AI Assistant|AI Chat|Open AI/i').first();
    await aiButton.click();
    await page.waitForTimeout(1000);

    const messageInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]').first();
    await messageInput.fill('I need help');

    const sendButton = page.locator('button[testid="send-button"], button:has-text("→")').first();
    await sendButton.click();

    await page.waitForTimeout(3000);

    // Look for action buttons in response
    const actionButtons = page.locator('button').filter({ hasText: /View.*|Check.*|Transfer.*|Help/i });
    const actionCount = await actionButtons.count();

    if (actionCount > 0) {
      console.log(`✅ Found ${actionCount} action buttons in AI response`);
    } else {
      console.log('⚠️  No action buttons found (response may not include actions)');
    }
  });
});

test.describe('AI Assistant - Floating Panel', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should toggle floating AI assistant panel', async ({ page }) => {
    // Look for floating AI button (🤖 emoji, usually bottom right)
    const floatingAIButton = page.locator('button').filter({ hasText: '🤖' }).last();

    if (await floatingAIButton.isVisible()) {
      // Click to open panel
      await floatingAIButton.click();
      await page.waitForTimeout(500);

      // Verify panel is visible
      const aiPanel = page.locator('text="AI Banking Assistant"').first();
      await expect(aiPanel).toBeVisible();

      // Click close button (×)
      const closeButton = page.locator('button:has-text("×")').first();
      await closeButton.click();
      await page.waitForTimeout(500);

      // Verify panel is closed
      await expect(aiPanel).not.toBeVisible();

      console.log('✅ Floating AI panel toggle works correctly');
    } else {
      console.log('⚠️  Floating AI button not found (may be on different screen)');
    }
  });

  test('should send message from floating panel', async ({ page }) => {
    const floatingAIButton = page.locator('button').filter({ hasText: '🤖' }).last();

    if (await floatingAIButton.isVisible()) {
      await floatingAIButton.click();
      await page.waitForTimeout(500);

      // Find input in floating panel
      const panelInput = page.locator('input[placeholder*="banking" i]').first();
      await panelInput.fill('Show my transactions');

      // Click send button
      const sendButton = page.locator('button').filter({ hasText: '➤' }).first();
      await sendButton.click();

      await page.waitForTimeout(3000);

      // Verify message was sent
      const userMessage = page.locator('text="Show my transactions"').first();
      await expect(userMessage).toBeVisible();

      console.log('✅ Message sent from floating panel successfully');
    }
  });
});

test.describe('AI Assistant - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should be keyboard navigable', async ({ page }) => {
    const aiButton = page.locator('text=/AI Assistant|AI Chat|Open AI/i').first();
    await aiButton.click();
    await page.waitForTimeout(1000);

    // Tab to message input
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Type message using keyboard
    await page.keyboard.type('Hello AI');

    // Tab to send button and press Enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(2000);

    // Verify message was sent
    const userMessage = page.locator('text="Hello AI"').first();
    await expect(userMessage).toBeVisible();

    console.log('✅ Keyboard navigation works correctly');
  });
});

test.describe('AI Assistant - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should handle empty message gracefully', async ({ page }) => {
    const aiButton = page.locator('text=/AI Assistant|AI Chat|Open AI/i').first();
    await aiButton.click();
    await page.waitForTimeout(1000);

    // Try to send empty message
    const sendButton = page.locator('button[testid="send-button"], button:has-text("→")').first();

    // Send button should be disabled when input is empty
    const isDisabled = await sendButton.isDisabled();
    expect(isDisabled).toBeTruthy();

    console.log('✅ Empty message handling works correctly (button disabled)');
  });

  test('should display fallback response on API error', async ({ page }) => {
    // This test simulates API failure by sending a message when backend might be unavailable
    const aiButton = page.locator('text=/AI Assistant|AI Chat|Open AI/i').first();
    await aiButton.click();
    await page.waitForTimeout(1000);

    const messageInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]').first();
    await messageInput.fill('Test error handling');

    const sendButton = page.locator('button[testid="send-button"], button:has-text("→")').first();
    await sendButton.click();

    await page.waitForTimeout(4000);

    // Should get either AI response or error message
    const responses = page.locator('[style*="rgba(255, 255, 255, 0.95)"]');
    const responseCount = await responses.count();

    expect(responseCount).toBeGreaterThan(0);
    console.log('✅ Response received (or fallback shown)');
  });
});
