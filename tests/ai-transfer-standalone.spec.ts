import { test, expect } from '@playwright/test';

/**
 * Standalone AI Transfer with Receipt Test
 * No global setup - uses existing logged-in session
 */

test.describe('AI Transfer with Receipt (Standalone)', () => {
  test('complete transfer and view receipt', async ({ page }) => {
    console.log('\n🧪 ====== AI TRANSFER WITH RECEIPT TEST ======\n');

    // Step 1: Navigate and Login
    console.log('📝 Step 1: Navigating to application...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    console.log('📝 Step 2: Logging in...');
    await page.fill('input[type="email"]', 'admin@fmfb.com');
    await page.fill('input[type="password"]', 'Admin-7-super');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    console.log('✅ Logged in successfully\n');

    // Step 2: Find and open AI Chat
    console.log('📝 Step 3: Looking for AI Chat...');

    // Try to find AI chat button
    let foundChat = false;
    const chatSelectors = [
      'text=/AI.*Chat/i',
      'text=/AI.*Assistant/i',
      '[data-testid="ai-chat"]',
      'button:has-text("AI")',
    ];

    for (const selector of chatSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 1000 })) {
          await btn.click();
          foundChat = true;
          console.log(`✅ Found and clicked AI Chat: ${selector}\n`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    await page.waitForTimeout(2000);

    // Find message input
    console.log('📝 Step 4: Finding message input...');
    const messageInput = page.locator('input[placeholder*="message" i], input[placeholder*="Type" i], textarea[placeholder*="message" i]').first();
    await expect(messageInput).toBeVisible({ timeout: 5000 });
    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
    console.log('✅ Found message input\n');

    // Step 3: Start Transfer
    console.log('📝 Step 5: Starting transfer conversation...');
    await messageInput.fill('Transfer money');
    await sendButton.click();
    await page.waitForTimeout(3000);
    console.log('✅ Transfer initiated\n');

    // Step 4: Enter Amount
    console.log('📝 Step 6: Entering amount (₦5,000)...');
    await messageInput.fill('5000');
    await sendButton.click();
    await page.waitForTimeout(3000);
    console.log('✅ Amount entered\n');

    // Step 5: Enter Account Number
    console.log('📝 Step 7: Entering account number (0123456789)...');
    await messageInput.fill('0123456789');
    await sendButton.click();
    await page.waitForTimeout(3000);
    console.log('✅ Account number entered\n');

    // Step 6: Select Bank
    console.log('📝 Step 8: Selecting bank (Access Bank)...');
    const accessBankBtn = page.locator('button:has-text("Access Bank")').first();
    if (await accessBankBtn.isVisible({ timeout: 2000 })) {
      await accessBankBtn.click();
      console.log('✅ Selected Access Bank via button\n');
    } else {
      await messageInput.fill('Access Bank');
      await sendButton.click();
      console.log('✅ Typed Access Bank\n');
    }
    await page.waitForTimeout(3000);

    // Step 7: Skip Description
    console.log('📝 Step 9: Skipping description...');
    const skipBtn = page.locator('button:has-text("Skip")').first();
    if (await skipBtn.isVisible({ timeout: 2000 })) {
      await skipBtn.click();
      console.log('✅ Skipped via button\n');
    } else {
      await messageInput.fill('Skip');
      await sendButton.click();
      console.log('✅ Typed Skip\n');
    }
    await page.waitForTimeout(3000);

    // Step 8: Enter PIN
    console.log('📝 Step 10: Entering transaction PIN (2348)...');
    await messageInput.fill('2348');
    await sendButton.click();
    console.log('✅ PIN entered\n');

    // Wait for transfer to complete
    console.log('⏳ Waiting for transfer to complete...');
    await page.waitForTimeout(6000);

    // Step 9: Verify Success
    console.log('📝 Step 11: Verifying transfer success...');
    const successMsg = page.locator('text=/Transfer Successful|✅.*Transfer/i').first();
    await expect(successMsg).toBeVisible({ timeout: 10000 });
    console.log('✅ Transfer successful!\n');

    // Step 10: Extract Reference
    console.log('📝 Step 12: Extracting transfer reference...');
    const referenceText = await page.locator('text=/Reference.*[A-Z0-9]{25}/i').first().textContent();
    const refMatch = referenceText?.match(/([A-Z0-9]{25})/);
    const reference = refMatch ? refMatch[1] : null;

    console.log(`📋 Transfer Reference: ${reference}`);
    expect(reference).toBeTruthy();
    expect(reference?.length).toBe(25);
    console.log('✅ Reference extracted\n');

    // Step 11: View Receipt
    console.log('📝 Step 13: Clicking "View receipt" button...');
    const viewReceiptBtn = page.locator('button:has-text("View receipt")').first();
    await expect(viewReceiptBtn).toBeVisible({ timeout: 5000 });
    await viewReceiptBtn.click();
    console.log('✅ Clicked View Receipt\n');

    // Wait for receipt to load
    console.log('⏳ Waiting for receipt to load...');
    await page.waitForTimeout(4000);

    // Step 12: Verify Receipt
    console.log('📝 Step 14: Verifying receipt contents...');

    // Check for receipt header
    const receiptHeader = page.locator('text=/Transfer Receipt|📄.*Receipt/i').first();
    await expect(receiptHeader).toBeVisible({ timeout: 10000 });
    console.log('  ✅ Receipt header found');

    // Verify key details
    await expect(page.locator(`text=${reference}`).first()).toBeVisible({ timeout: 5000 });
    console.log(`  ✅ Reference found: ${reference}`);

    await expect(page.locator('text=/₦5,000|5000|5,000/').first()).toBeVisible({ timeout: 5000 });
    console.log('  ✅ Amount found: ₦5,000');

    await expect(page.locator('text=/0123456789/').first()).toBeVisible({ timeout: 5000 });
    console.log('  ✅ Account number found: 0123456789');

    await expect(page.locator('text=/Access Bank/i').first()).toBeVisible({ timeout: 5000 });
    console.log('  ✅ Bank name found: Access Bank');

    await expect(page.locator('text=/John Doe|Recipient.*Name/i').first()).toBeVisible({ timeout: 5000 });
    console.log('  ✅ Recipient name found');

    console.log('\n✅ Receipt displayed with all details!\n');

    // Step 13: Screenshot
    console.log('📝 Step 15: Taking screenshot...');
    await page.screenshot({
      path: 'tests/screenshots/ai-transfer-receipt-standalone.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: tests/screenshots/ai-transfer-receipt-standalone.png\n');

    // Final Summary
    console.log('🎉 ====== TEST PASSED ======');
    console.log('\n📊 Summary:');
    console.log('  ✅ Login: Success');
    console.log('  ✅ Transfer Flow: Completed (6 steps)');
    console.log(`  ✅ Reference: ${reference}`);
    console.log('  ✅ Receipt: Displayed correctly');
    console.log('  ✅ Validation: All fields present');
    console.log('  ✅ Screenshot: Captured');
    console.log('\n============================\n');
  });
});
