/**
 * Global Test Teardown
 * Cleans up the test environment after all tests complete
 */

import { FullConfig } from '@playwright/test';
import { TestDataFixtures, TEST_DB_CONFIG } from './test-data-setup';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up test environment...');

  try {
    // Only cleanup if we have test fixtures
    if (process.env.TEST_FIXTURES_READY === 'true') {
      const fixtures = new TestDataFixtures(TEST_DB_CONFIG);
      await fixtures.cleanup();
      console.log('✅ Test data cleaned up successfully');
    }

    console.log('✅ Test environment teardown complete');
  } catch (error) {
    console.error('❌ Test environment teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

export default globalTeardown;