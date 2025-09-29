/**
 * Debug Login Elements Test
 * Logs all available elements to help identify the correct selectors
 */

import { test, expect, Page } from '@playwright/test';

const TEST_CREDENTIALS = {
  email: 'admin@fmfb.com',
  password: 'Admin-7-super'
};

const BASE_URL = 'http://localhost:3000';

test.describe('Debug Login Elements', () => {
  test('should debug login page elements', async ({ page }) => {
    console.log('🔍 Starting debug test for login elements...');

    // Step 1: Navigate to the application
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Step 2: Take initial screenshot
    await page.screenshot({
      path: 'tests/screenshots/debug-initial.png',
      fullPage: true
    });

    // Step 3: Log all buttons on the page
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} button elements:`);

    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const text = await button.textContent();
      const isVisible = await button.isVisible();
      const isEnabled = await button.isEnabled();
      console.log(`  Button ${i}: text="${text}", visible=${isVisible}, enabled=${isEnabled}`);
    }

    // Step 4: Log all elements with "Sign" text
    const signElements = await page.locator('*:has-text("Sign")').all();
    console.log(`Found ${signElements.length} elements containing "Sign":`);

    for (let i = 0; i < signElements.length; i++) {
      const element = signElements[i];
      const tagName = await element.evaluate(el => el.tagName);
      const text = await element.textContent();
      const isVisible = await element.isVisible();
      const classes = await element.getAttribute('class');
      console.log(`  Sign Element ${i}: tag=${tagName}, text="${text}", visible=${isVisible}, classes="${classes}"`);
    }

    // Step 5: Try to find any clickable elements
    const clickables = await page.locator('button, input[type="submit"], [role="button"], *[onclick]').all();
    console.log(`Found ${clickables.length} potentially clickable elements:`);

    for (let i = 0; i < clickables.length; i++) {
      const element = clickables[i];
      const tagName = await element.evaluate(el => el.tagName);
      const text = await element.textContent();
      const type = await element.getAttribute('type');
      const role = await element.getAttribute('role');
      const isVisible = await element.isVisible();
      console.log(`  Clickable ${i}: tag=${tagName}, text="${text}", type=${type}, role=${role}, visible=${isVisible}`);
    }

    // Step 6: Get the full HTML of the form area
    const formArea = page.locator('form, [data-testid*="form"], .form, .login');
    const formCount = await formArea.count();

    if (formCount > 0) {
      const formHTML = await formArea.first().innerHTML();
      console.log('Form HTML:', formHTML.substring(0, 500) + '...');
    } else {
      console.log('No form elements found');
    }

    // Step 7: Try using CSS selectors to find submit elements
    const submitByCSS = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, input[type="submit"]');
      return Array.from(elements).map(el => ({
        tagName: el.tagName,
        text: el.textContent || el.value,
        type: el.type,
        className: el.className,
        id: el.id,
        visible: el.offsetWidth > 0 && el.offsetHeight > 0
      }));
    });

    console.log('Submit elements by CSS:', JSON.stringify(submitByCSS, null, 2));

    console.log('✅ Debug test completed');
  });
});