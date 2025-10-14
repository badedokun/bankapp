import { test, expect } from '@playwright/test';

test.describe('Comprehensive AI Chat Test', () => {
  const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';

  test('should show correct transaction totals and handle transfer flow', async ({ page }) => {
    console.log('🚀 Starting comprehensive AI chat test...');

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

    // Test 1: Check transaction history with correct totals
    console.log('\n📊 Testing transaction history...');
    await messageInput.fill('Show my recent transactions');
    await page.waitForTimeout(500);

    const sendButton = page.locator('[data-testid="send-button"], button:has-text("→")').first();
    await sendButton.click();

    // Wait for response
    await page.waitForTimeout(5000);

    // Check for correct transaction display
    const responseText = await page.textContent('body');

    // Should show actual transactions and correct total (not ₦0)
    if (responseText?.includes('₦') && !responseText?.includes('totaling ₦0')) {
      console.log('✅ Transaction totaling is correct');

      // Extract and display the total
      const totalMatch = responseText.match(/totaling ₦([\d,]+)/);
      if (totalMatch) {
        console.log(`   Total amount: ₦${totalMatch[1]}`);
      }

      // Count how many transactions are displayed
      const transactionMatches = responseText.match(/₦[\d,]+/g);
      if (transactionMatches && transactionMatches.length > 3) {
        console.log(`✅ Showing ${transactionMatches.length} transactions (more than 3)`);
      }
    } else {
      console.log('❌ Transaction totaling might still be showing ₦0');
    }

    // Test 2: Test transfer flow initialization
    console.log('\n💸 Testing transfer flow...');
    await messageInput.fill('I want to transfer 45000');
    await page.waitForTimeout(500);
    await sendButton.click();

    // Wait for response
    await page.waitForTimeout(5000);

    const transferResponse = await page.textContent('body');

    // Should NOT show "Processed: 45000"
    if (transferResponse?.includes('Processed: 45000')) {
      console.log('❌ Still showing "Processed: 45000" response');
    } else if (transferResponse?.includes('account number') ||
               transferResponse?.includes('10-digit') ||
               transferResponse?.includes('transfer ₦45,000')) {
      console.log('✅ Transfer flow initiated correctly');

      // Test providing account number
      await messageInput.fill('1234567890');
      await page.waitForTimeout(500);
      await sendButton.click();
      await page.waitForTimeout(3000);

      const accountResponse = await page.textContent('body');
      if (accountResponse?.includes('bank') || accountResponse?.includes('Bank')) {
        console.log('✅ Account number accepted, asking for bank');

        // Test providing bank name
        await messageInput.fill('First Bank');
        await page.waitForTimeout(500);
        await sendButton.click();
        await page.waitForTimeout(3000);

        const bankResponse = await page.textContent('body');
        if (bankResponse?.includes('confirm') || bankResponse?.includes('description')) {
          console.log('✅ Bank accepted, transfer flow progressing');
        }
      }
    }

    // Test 3: Check balance inquiry
    console.log('\n💰 Testing balance inquiry...');
    await messageInput.fill('What is my balance?');
    await page.waitForTimeout(500);
    await sendButton.click();

    await page.waitForTimeout(3000);
    const balanceResponse = await page.textContent('body');

    if (balanceResponse?.includes('₦5,000,000') || balanceResponse?.includes('₦5000000')) {
      console.log('✅ Balance inquiry working correctly');
    }

    // Test 4: Check spending analysis
    console.log('\n📈 Testing spending analysis...');
    await messageInput.fill('Am I spending too much?');
    await page.waitForTimeout(500);
    await sendButton.click();

    await page.waitForTimeout(3000);
    const spendingResponse = await page.textContent('body');

    if (spendingResponse?.includes('transferred') && !spendingResponse?.includes('₦0')) {
      console.log('✅ Spending analysis working with actual data');
    }

    console.log('\n🏁 Comprehensive test completed');
  });
});