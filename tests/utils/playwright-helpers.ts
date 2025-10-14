/**
 * Playwright-specific Test Helper Utilities for Money Transfer System
 * Provides utilities for setting up test data and API interactions using Playwright
 */

import { APIRequestContext, Page } from '@playwright/test';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  tenantId: string;
  token?: string;
  accountId?: string;
  accountNumber?: string;
}

export interface TestAccount {
  id: string;
  userId: string;
  accountNumber: string;
  accountName: string;
  balance: number;
  currency: string;
  tenantId: string;
}

export class PlaywrightTestDataManager {
  private baseUrl: string;
  private request: APIRequestContext;

  constructor(request: APIRequestContext, baseUrl: string = 'http://localhost:3001') {
    this.request = request;
    this.baseUrl = baseUrl;
  }

  /**
   * Login user and get token
   */
  async loginUser(email: string, password: string): Promise<string> {
    const response = await this.request.post(`${this.baseUrl}/api/auth/login`, {
      data: { email, password },
    });

    if (!response.ok()) {
      throw new Error(`Login failed: ${await response.text()}`);
    }

    const result = await response.json();
    return result.data.token;
  }

  /**
   * Get account balance
   */
  async getAccountBalance(accountId: string, token: string): Promise<number> {
    const response = await this.request.get(`${this.baseUrl}/api/accounts/${accountId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok()) {
      throw new Error(`Failed to get account balance: ${await response.text()}`);
    }

    const result = await response.json();
    return parseFloat(result.data.balance);
  }

  /**
   * Wait for transfer completion
   */
  async waitForTransferCompletion(reference: string, token: string, timeout: number = 30000): Promise<any> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const response = await this.request.get(`${this.baseUrl}/api/transfers/status/${reference}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok()) {
        const result = await response.json();
        if (result.data.status === 'completed' || result.data.status === 'failed') {
          return result.data;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error(`Transfer ${reference} did not complete within ${timeout}ms`);
  }

  /**
   * Validate recipient account
   */
  async validateRecipient(accountNumber: string, bankCode: string, token: string): Promise<any> {
    const response = await this.request.post(`${this.baseUrl}/api/transfers/validate-recipient`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { accountNumber, bankCode },
    });

    if (!response.ok()) {
      throw new Error(`Failed to validate recipient: ${await response.text()}`);
    }

    return await response.json();
  }

  /**
   * Get transfer history
   */
  async getTransferHistory(token: string, limit: number = 10): Promise<any[]> {
    const response = await this.request.get(`${this.baseUrl}/api/transfers/history?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok()) {
      throw new Error(`Failed to get transfer history: ${await response.text()}`);
    }

    const result = await response.json();
    return result.data.transfers;
  }
}

export class PlaywrightUIHelpers {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Login to the application
   */
  async login(email: string, password: string): Promise<void> {
    await this.page.goto('http://localhost:3000');

    // Wait for login form to appear
    await this.page.waitForSelector('input[type="email"], input[placeholder*="email"], [data-testid*="email"]', { timeout: 10000 });

    // Try different selectors for email input
    const emailSelectors = [
      '[data-testid="email-input"]',
      'input[type="email"]',
      'input[placeholder*="email" i]',
      'input[name="email"]',
      '#email'
    ];

    for (const selector of emailSelectors) {
      try {
        if (await this.page.locator(selector).isVisible()) {
          await this.page.fill(selector, email);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Try different selectors for password input
    const passwordSelectors = [
      '[data-testid="password-input"]',
      'input[type="password"]',
      'input[placeholder*="password" i]',
      'input[name="password"]',
      '#password'
    ];

    for (const selector of passwordSelectors) {
      try {
        if (await this.page.locator(selector).isVisible()) {
          await this.page.fill(selector, password);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Try different selectors for login button
    const loginButtonSelectors = [
      '[data-testid="login-button"]',
      'button[type="submit"]',
      'button:has-text("Login")',
      'button:has-text("Sign In")',
      '.login-button',
      '#login-button'
    ];

    for (const selector of loginButtonSelectors) {
      try {
        if (await this.page.locator(selector).isVisible()) {
          await this.page.click(selector);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Wait for successful login (dashboard or main page)
    await this.page.waitForSelector('text=Dashboard, text=Welcome, [data-testid="dashboard"], .dashboard', { timeout: 10000 });
  }

  /**
   * Navigate to transfer page
   */
  async navigateToTransfers(): Promise<void> {
    const transferNavSelectors = [
      '[data-testid="transfers-nav"]',
      'a:has-text("Transfer")',
      'button:has-text("Transfer")',
      '.transfer-nav',
      '[href*="transfer"]'
    ];

    for (const selector of transferNavSelectors) {
      try {
        if (await this.page.locator(selector).isVisible()) {
          await this.page.click(selector);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Wait for transfer page to load
    await this.page.waitForSelector('text=Transfer, [data-testid="transfer-page"], .transfer-page', { timeout: 10000 });
  }

  /**
   * Fill transfer form
   */
  async fillTransferForm(transferData: {
    amount: string;
    recipientAccount?: string;
    recipientBank?: string;
    description?: string;
    pin: string;
    transferType?: 'internal' | 'external';
  }): Promise<void> {
    // Select transfer type if specified
    if (transferData.transferType) {
      const typeSelectors = [
        `[data-testid="${transferData.transferType}-transfer"]`,
        `button:has-text("${transferData.transferType === 'internal' ? 'Internal' : 'External'}")`,
        `.${transferData.transferType}-transfer`
      ];

      for (const selector of typeSelectors) {
        try {
          if (await this.page.locator(selector).isVisible()) {
            await this.page.click(selector);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
    }

    // Fill amount
    const amountSelectors = [
      '[data-testid="amount-input"]',
      'input[placeholder*="amount" i]',
      'input[name="amount"]',
      '#amount'
    ];

    for (const selector of amountSelectors) {
      try {
        if (await this.page.locator(selector).isVisible()) {
          await this.page.fill(selector, transferData.amount);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Fill recipient account if provided
    if (transferData.recipientAccount) {
      const accountSelectors = [
        '[data-testid="recipient-account-input"]',
        'input[placeholder*="account" i]',
        'input[name*="account"]',
        '#recipientAccount'
      ];

      for (const selector of accountSelectors) {
        try {
          if (await this.page.locator(selector).isVisible()) {
            await this.page.fill(selector, transferData.recipientAccount);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
    }

    // Select bank if provided
    if (transferData.recipientBank) {
      const bankSelectors = [
        '[data-testid="bank-select"]',
        'select[name*="bank"]',
        '#bankSelect'
      ];

      for (const selector of bankSelectors) {
        try {
          if (await this.page.locator(selector).isVisible()) {
            await this.page.selectOption(selector, transferData.recipientBank);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
    }

    // Fill description if provided
    if (transferData.description) {
      const descriptionSelectors = [
        '[data-testid="description-input"]',
        'input[placeholder*="description" i]',
        'textarea[placeholder*="description" i]',
        'input[name="description"]',
        '#description'
      ];

      for (const selector of descriptionSelectors) {
        try {
          if (await this.page.locator(selector).isVisible()) {
            await this.page.fill(selector, transferData.description);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
    }

    // Fill PIN
    const pinSelectors = [
      '[data-testid="pin-input"]',
      'input[placeholder*="pin" i]',
      'input[type="password"][name*="pin"]',
      'input[name="pin"]',
      '#pin'
    ];

    for (const selector of pinSelectors) {
      try {
        if (await this.page.locator(selector).isVisible()) {
          await this.page.fill(selector, transferData.pin);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
  }

  /**
   * Submit transfer and wait for result
   */
  async submitTransfer(): Promise<void> {
    const submitSelectors = [
      '[data-testid="submit-transfer-button"]',
      'button[type="submit"]',
      'button:has-text("Submit")',
      'button:has-text("Send")',
      'button:has-text("Transfer")',
      '.submit-button'
    ];

    for (const selector of submitSelectors) {
      try {
        if (await this.page.locator(selector).isVisible()) {
          await this.page.click(selector);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Wait for either success or error result
    await this.page.waitForSelector('text=Success, text=Error, text=Failed, text=Completed, [data-testid="transfer-result"]', { timeout: 30000 });
  }

  /**
   * Get transfer result message
   */
  async getTransferResult(): Promise<{ success: boolean; message: string; reference?: string }> {
    // Look for success indicators
    const successSelectors = [
      '.success',
      '[data-testid="success-message"]',
      'text=Success',
      'text=Completed',
      'text=successful'
    ];

    let isSuccess = false;
    for (const selector of successSelectors) {
      try {
        if (await this.page.locator(selector).isVisible()) {
          isSuccess = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Get message text
    const messageSelectors = [
      '[data-testid="transfer-result"]',
      '.result-message',
      '.transfer-message',
      '.alert-message'
    ];

    let message = '';
    for (const selector of messageSelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.isVisible()) {
          message = await element.textContent() || '';
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // If no specific message element, get all visible text
    if (!message) {
      message = await this.page.textContent('body') || '';
    }

    // Extract reference if present
    let reference: string | undefined;
    const referenceMatch = message.match(/(?:reference|ref|id)[:\s]*([A-Z0-9]+)/i);
    if (referenceMatch) {
      reference = referenceMatch[1];
    }

    return {
      success: isSuccess,
      message,
      reference
    };
  }

  /**
   * Wait for notification
   */
  async waitForNotification(expectedText?: string, timeout: number = 10000): Promise<string> {
    const notificationSelectors = [
      '[data-testid="notification"]',
      '.notification',
      '.toast',
      '.alert',
      '.snackbar'
    ];

    let notification;
    for (const selector of notificationSelectors) {
      try {
        notification = this.page.locator(selector);
        await notification.waitFor({ timeout: timeout / notificationSelectors.length });
        break;
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!notification) {
      throw new Error('No notification found');
    }

    const text = await notification.textContent();

    if (expectedText && text && !text.includes(expectedText)) {
      throw new Error(`Expected notification to contain "${expectedText}", but got "${text}"`);
    }

    return text || '';
  }

  /**
   * Check account balance display
   */
  async getDisplayedBalance(): Promise<number> {
    const balanceSelectors = [
      '[data-testid="account-balance"]',
      '.account-balance',
      '.balance',
      'text=₦',
      'text=NGN'
    ];

    let balanceText = '';
    for (const selector of balanceSelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.isVisible()) {
          balanceText = await element.textContent() || '';
          if (balanceText.includes('₦') || balanceText.includes('NGN')) {
            break;
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!balanceText) {
      throw new Error('Balance not found on page');
    }

    // Extract numeric value from formatted balance (e.g., "₦1,000,000.00" -> 1000000)
    const numericValue = balanceText.replace(/[^\d.]/g, '');
    return parseFloat(numericValue);
  }

  /**
   * Take screenshot on failure
   */
  async takeScreenshotOnFailure(testName: string): Promise<void> {
    const screenshot = await this.page.screenshot({ fullPage: true });
    const fs = require('fs').promises;
    await fs.mkdir('tests/screenshots', { recursive: true });
    await fs.writeFile(`tests/screenshots/${testName}-${Date.now()}.png`, screenshot);
  }

  /**
   * Wait for page to be ready
   */
  async waitForPageReady(timeout: number = 10000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Check if element exists and is visible
   */
  async isElementVisible(selector: string): Promise<boolean> {
    try {
      return await this.page.locator(selector).isVisible();
    } catch (e) {
      return false;
    }
  }
}

export const PLAYWRIGHT_TEST_CONFIG = {
  BASE_URL: process.env.TEST_BASE_URL || 'http://localhost:3001',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  DEFAULT_TIMEOUT: 30000,
  TEST_TENANT_ID: '7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3',

  // Test users
  ADMIN_USER: {
    email: 'admin@fmfb.com',
    password: 'Admin-7-super',
    pin: '1234',
  },

  DEMO_USER: {
    email: 'demo@fmfb.com',
    password: 'AI-powered-fmfb-1app',
    pin: '1234',
  },

  // Test banks
  TEST_BANKS: {
    GTB: { code: '058', name: 'Guaranty Trust Bank' },
    UBA: { code: '033', name: 'United Bank for Africa' },
    ZENITH: { code: '057', name: 'Zenith Bank' },
  },

  // Test amounts
  AMOUNTS: {
    SMALL: '1000',
    MEDIUM: '50000',
    LARGE: '500000',
  },

  // Test data
  TEST_RECIPIENTS: {
    VALID_GTB: {
      accountNumber: '1234567890',
      bankCode: '058',
      expectedName: 'Test Account Holder'
    },
    VALID_UBA: {
      accountNumber: '0987654321',
      bankCode: '033',
      expectedName: 'Another Test User'
    }
  }
};

export const waitFor = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await waitFor(delay * attempt);
      }
    }
  }

  throw lastError!;
};