/**
 * Playwright Configuration for AI Assistant Tests
 * Simplified config without global setup/teardown
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: /ai-(assistant|backend).*\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report-ai' }],
    ['json', { outputFile: 'test-results/ai-results.json' }],
  ],
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'ai-frontend-tests',
      testMatch: /ai-assistant\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.FRONTEND_URL || 'http://localhost:3000',
      },
    },
    {
      name: 'ai-api-tests',
      testMatch: /ai-backend\.api\.test\.ts/,
      use: {
        baseURL: process.env.TEST_BASE_URL || 'http://localhost:3001',
      },
    },
  ],

  webServer: [
    {
      command: 'npm run server',
      port: 3001,
      reuseExistingServer: true,
      timeout: 30000,
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
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],

  timeout: 30000,
});
