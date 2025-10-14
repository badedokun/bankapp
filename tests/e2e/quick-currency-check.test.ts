/**
 * Quick Multi-Currency Check - E2E Tests
 * Fast validation of currency display across tenants
 */

import { test, expect, Page } from '@playwright/test';

const TENANTS = [
  { name: 'FMFB', email: 'admin@fmfb.com', password: 'Admin-7-super', symbol: '₦', currency: 'NGN' },
  { name: 'US Bank', email: 'admin@usbank.com', password: 'Admin-7-super', symbol: '$', currency: 'USD' },
];

async function quickLogin(page: Page, email: string, password: string) {
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });

  try {
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    return true;
  } catch (error) {
    return false;
  }
}

test.describe('Quick Currency Display Check', () => {

  test('FMFB shows Naira (₦) on dashboard', async ({ page }) => {
    const success = await quickLogin(page, TENANTS[0].email, TENANTS[0].password);
    expect(success).toBeTruthy();

    await page.waitForTimeout(2000);
    const bodyText = await page.textContent('body');

    expect(bodyText).toContain('₦');
    console.log('✓ FMFB: Dashboard shows ₦');
  });

  test('US Bank shows Dollar ($) on dashboard', async ({ page }) => {
    const success = await quickLogin(page, TENANTS[1].email, TENANTS[1].password);
    expect(success).toBeTruthy();

    await page.waitForTimeout(2000);
    const bodyText = await page.textContent('body');

    expect(bodyText).toMatch(/\$/);
    console.log('✓ US Bank: Dashboard shows $');
  });

});
