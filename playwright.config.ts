/**
 * Playwright Configuration for Money Transfer System Tests
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'api-tests',
      testMatch: /.*\.api\.test\.ts/,
      use: {
        baseURL: process.env.TEST_BASE_URL || 'http://localhost:3001',
      },
    },
    {
      name: 'e2e-tests',
      testMatch: /.*e2e.*\.test\.ts/,
      use: {
        baseURL: process.env.FRONTEND_URL || 'http://localhost:3000',
      },
    },
    {
      name: 'performance-tests',
      testMatch: /.*performance.*\.test\.ts/,
      use: {
        baseURL: process.env.TEST_BASE_URL || 'http://localhost:3001',
      },
      timeout: 60000, // Longer timeout for performance tests
    },
  ],

  webServer: [
    {
      command: 'npm run server',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      env: {
        ENABLE_AI_INTELLIGENCE: 'true',
        ENABLE_SMART_SUGGESTIONS: 'true',
        ENABLE_ANALYTICS_INSIGHTS: 'true',
        ENABLE_CONTEXTUAL_RECOMMENDATIONS: 'true',
      },
    },
    {
      command: 'npm run web:dev',
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
  ],

  // Global test timeout
  timeout: 30000,

  // Global setup and teardown
  globalSetup: require.resolve('./tests/utils/global-setup.ts'),
  globalTeardown: require.resolve('./tests/utils/global-teardown.ts'),
});