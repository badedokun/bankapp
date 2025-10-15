import { test, expect } from '@playwright/test';

/**
 * AI Transfer with Receipt Test
 * Tests the complete conversational transfer flow including receipt viewing
 */

test.describe('AI Conversational Transfer with Receipt', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');

    // Wait for app to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('should complete transfer via AI chat and view receipt', async ({ page }) => {
    console.log('🧪 Starting AI transfer with receipt test...');

    // Step 1: Login
    console.log('📝 Step 1: Logging in...');
    await page.fill('input[type="email"]', 'admin@fmfb.com');
    await page.fill('input[type="password"]', 'Admin-7-super');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await page.waitForTimeout(3000);
    console.log('✅ Login successful');

    // Step 2: Navigate to AI Chat
    console.log('📝 Step 2: Opening AI Chat...');

    // Look for AI Chat button/link - try multiple selectors
    const aiChatSelectors = [
      'text=AI Assistant',
      'text=AI Chat',
      '[data-testid="ai-chat"]',
      'button:has-text("AI")',
      'a:has-text("AI")'
    ];

    let chatOpened = false;
    for (const selector of aiChatSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          chatOpened = true;
          console.log(`✅ Opened AI Chat using selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!chatOpened) {
      // If no AI Chat button, might already be on chat screen or need to navigate differently
      console.log('⚠️ Could not find AI Chat button, checking if already on chat screen...');

      // Check if we're already on a chat screen by looking for message input
      const messageInput = page.locator('input[placeholder*="message" i], input[placeholder*="Type" i], textarea[placeholder*="message" i]').first();
      if (await messageInput.isVisible({ timeout: 2000 })) {
        console.log('✅ Already on chat screen');
      } else {
        throw new Error('Could not find or open AI Chat');
      }
    }

    await page.waitForTimeout(2000);

    // Step 3: Start transfer conversation
    console.log('📝 Step 3: Starting transfer...');

    // Find message input
    const messageInput = page.locator('input[placeholder*="message" i], input[placeholder*="Type" i], textarea[placeholder*="message" i]').first();
    await messageInput.fill('Transfer money');

    // Find and click send button
    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
    await sendButton.click();

    // Wait for AI response
    await page.waitForTimeout(3000);
    console.log('✅ Transfer initiated');

    // Step 4: Enter amount
    console.log('📝 Step 4: Entering amount...');
    await messageInput.fill('5000');
    await sendButton.click();
    await page.waitForTimeout(3000);
    console.log('✅ Amount entered: ₦5,000');

    // Step 5: Enter account number (10 digits)
    console.log('📝 Step 5: Entering account number...');
    await messageInput.fill('0123456789');
    await sendButton.click();
    await page.waitForTimeout(3000);
    console.log('✅ Account number entered: 0123456789');

    // Step 6: Select bank
    console.log('📝 Step 6: Selecting bank...');

    // Try clicking suggestion button first
    const accessBankSuggestion = page.locator('button:has-text("Access Bank")').first();
    if (await accessBankSuggestion.isVisible({ timeout: 2000 })) {
      await accessBankSuggestion.click();
      console.log('✅ Selected Access Bank (via suggestion)');
    } else {
      // Type it manually
      await messageInput.fill('Access Bank');
      await sendButton.click();
      console.log('✅ Selected Access Bank (typed)');
    }

    await page.waitForTimeout(3000);

    // Step 7: Skip description
    console.log('📝 Step 7: Skipping description...');

    const skipButton = page.locator('button:has-text("Skip")').first();
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
      console.log('✅ Description skipped (via button)');
    } else {
      await messageInput.fill('Skip');
      await sendButton.click();
      console.log('✅ Description skipped (typed)');
    }

    await page.waitForTimeout(3000);

    // Step 8: Enter PIN
    console.log('📝 Step 8: Entering PIN...');
    await messageInput.fill('2348');
    await sendButton.click();

    // Wait for transfer to complete
    await page.waitForTimeout(5000);
    console.log('✅ PIN entered');

    // Step 9: Verify transfer success
    console.log('📝 Step 9: Verifying transfer success...');

    // Look for success message and reference
    const successMessage = page.locator('text=/Transfer Successful|✅/i').first();
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    console.log('✅ Transfer successful');

    // Extract reference from the page
    const referenceElement = page.locator('text=/Reference:\\s*([A-Z0-9]{25})/i').first();
    await expect(referenceElement).toBeVisible({ timeout: 5000 });

    const referenceText = await referenceElement.textContent();
    const referenceMatch = referenceText?.match(/Reference:\s*([A-Z0-9]{25})/i);
    const reference = referenceMatch ? referenceMatch[1] : null;

    console.log('📋 Transfer reference:', reference);
    expect(reference).toBeTruthy();
    expect(reference?.length).toBe(25);

    // Step 10: View receipt
    console.log('📝 Step 10: Viewing receipt...');

    const viewReceiptButton = page.locator('button:has-text("View receipt")').first();
    await expect(viewReceiptButton).toBeVisible({ timeout: 5000 });
    await viewReceiptButton.click();

    // Wait for receipt to load
    await page.waitForTimeout(3000);
    console.log('✅ Receipt requested');

    // Step 11: Verify receipt contents
    console.log('📝 Step 11: Verifying receipt contents...');

    // Check for receipt header
    const receiptHeader = page.locator('text=/Transfer Receipt|📄/i').first();
    await expect(receiptHeader).toBeVisible({ timeout: 10000 });
    console.log('✅ Receipt header found');

    // Verify receipt contains key information
    const receiptChecks = [
      { label: 'Reference', pattern: reference },
      { label: 'Amount', pattern: /₦5,000|5000/ },
      { label: 'Recipient', pattern: /John Doe|Recipient/ },
      { label: 'Account', pattern: '0123456789' },
      { label: 'Bank', pattern: /Access Bank/ },
    ];

    for (const check of receiptChecks) {
      const element = page.locator(`text=${check.pattern}`).first();
      await expect(element).toBeVisible({ timeout: 5000 });
      console.log(`✅ Receipt contains ${check.label}`);
    }

    // Step 12: Take screenshot of receipt
    console.log('📝 Step 12: Taking receipt screenshot...');
    await page.screenshot({
      path: 'tests/screenshots/ai-transfer-receipt.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: tests/screenshots/ai-transfer-receipt.png');

    // Final verification
    console.log('\n🎉 TEST PASSED: All steps completed successfully!');
    console.log('📊 Test Summary:');
    console.log('  ✅ Login successful');
    console.log('  ✅ AI Chat opened');
    console.log('  ✅ Transfer flow completed (6 steps)');
    console.log(`  ✅ Transfer reference: ${reference}`);
    console.log('  ✅ Receipt displayed with all details');
    console.log('  ✅ Screenshot captured');
  });

  test('should handle wrong PIN gracefully', async ({ page }) => {
    console.log('🧪 Starting wrong PIN test...');

    // Login
    await page.fill('input[type="email"]', 'admin@fmfb.com');
    await page.fill('input[type="password"]', 'Admin-7-super');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate to AI Chat (simplified for second test)
    const messageInput = page.locator('input[placeholder*="message" i], input[placeholder*="Type" i], textarea[placeholder*="message" i]').first();
    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();

    // Quick transfer flow
    await messageInput.fill('Transfer money');
    await sendButton.click();
    await page.waitForTimeout(2000);

    await messageInput.fill('1000');
    await sendButton.click();
    await page.waitForTimeout(2000);

    await messageInput.fill('0123456789');
    await sendButton.click();
    await page.waitForTimeout(2000);

    await messageInput.fill('Access Bank');
    await sendButton.click();
    await page.waitForTimeout(2000);

    await messageInput.fill('Skip');
    await sendButton.click();
    await page.waitForTimeout(2000);

    // Enter wrong PIN
    console.log('📝 Entering wrong PIN...');
    await messageInput.fill('9999');
    await sendButton.click();
    await page.waitForTimeout(3000);

    // Verify error message
    const errorMessage = page.locator('text=/Incorrect PIN|try again/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    console.log('✅ Wrong PIN error displayed correctly');

    // Verify input is still numeric and limited to 4 digits
    await messageInput.fill('abcd1234567890');
    const inputValue = await messageInput.inputValue();
    expect(inputValue.length).toBeLessThanOrEqual(4);
    expect(/^\d*$/.test(inputValue)).toBeTruthy();
    console.log('✅ PIN input validation working');

    // Enter correct PIN
    console.log('📝 Entering correct PIN...');
    await messageInput.fill('2348');
    await sendButton.click();
    await page.waitForTimeout(5000);

    // Verify success
    const successMessage = page.locator('text=/Transfer Successful|✅/i').first();
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    console.log('✅ Transfer succeeded after correct PIN');
    console.log('🎉 Wrong PIN test PASSED!');
  });

  test('should validate account number format', async ({ page }) => {
    console.log('🧪 Starting account number validation test...');

    // Login
    await page.fill('input[type="email"]', 'admin@fmfb.com');
    await page.fill('input[type="password"]', 'Admin-7-super');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const messageInput = page.locator('input[placeholder*="message" i], input[placeholder*="Type" i], textarea[placeholder*="message" i]').first();
    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();

    // Start transfer
    await messageInput.fill('Transfer money');
    await sendButton.click();
    await page.waitForTimeout(2000);

    await messageInput.fill('1000');
    await sendButton.click();
    await page.waitForTimeout(2000);

    // Test 1: Too short
    console.log('📝 Testing short account number...');
    await messageInput.fill('123');
    await sendButton.click();
    await page.waitForTimeout(2000);

    const shortError = page.locator('text=/valid 10-digit|10 digits/i').first();
    await expect(shortError).toBeVisible({ timeout: 5000 });
    console.log('✅ Short account number rejected');

    // Test 2: With letters
    console.log('📝 Testing account number with letters...');
    await messageInput.fill('abc1234567');
    await sendButton.click();
    await page.waitForTimeout(2000);

    const letterError = page.locator('text=/valid 10-digit|10 digits/i').first();
    await expect(letterError).toBeVisible({ timeout: 5000 });
    console.log('✅ Account number with letters rejected');

    // Test 3: Too long
    console.log('📝 Testing long account number...');
    await messageInput.fill('12345678901');
    await sendButton.click();
    await page.waitForTimeout(2000);

    const longError = page.locator('text=/valid 10-digit|10 digits/i').first();
    await expect(longError).toBeVisible({ timeout: 5000 });
    console.log('✅ Long account number rejected');

    // Test 4: Valid 10 digits
    console.log('📝 Testing valid account number...');
    await messageInput.fill('0123456789');
    await sendButton.click();
    await page.waitForTimeout(2000);

    const bankPrompt = page.locator('text=/Which bank|Select bank/i').first();
    await expect(bankPrompt).toBeVisible({ timeout: 5000 });
    console.log('✅ Valid account number accepted');
    console.log('🎉 Account validation test PASSED!');
  });
});
