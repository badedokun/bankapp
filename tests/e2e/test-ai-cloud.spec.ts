import { test, expect } from '@playwright/test';

test('Test AI Assistant on cloud deployment', async ({ page }) => {
  const baseUrl = process.env.TEST_URL || 'https://fmfb-34-59-143-25.nip.io';

  // Login
  await page.goto(baseUrl);
  await page.waitForLoadState('networkidle');

  const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  await emailInput.fill('demo@fmfb.com');
  await passwordInput.fill('AI-powered-fmfb-1app');

  const signInButton = page.locator('text="Sign In"');
  await signInButton.first().click();

  await page.waitForTimeout(3000);

  // Find and click AI Assistant button
  const aiButton = page.locator('text=/Open AI Chat|AI Assistant/i').first();
  await aiButton.click();

  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/ai-chat-opened.png', fullPage: true });

  // Type message in AI chat
  const chatInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]').first();
  await chatInput.fill('Show me my recent transactions');

  // Send message
  const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
  await sendButton.click();

  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/ai-response.png', fullPage: true });

  // Check for AI response
  const aiResponse = await page.locator('text=/Here are your recent|transaction/i').first().textContent();
  console.log('AI Response:', aiResponse);

  expect(aiResponse).toContain('transaction');
});