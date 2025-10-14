/**
 * Simple Playwright Configuration for Basic Testing
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['simple-api.test.ts', 'simple-login.test.ts', 'comprehensive-api.test.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'simple-test',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  timeout: 10000,
});