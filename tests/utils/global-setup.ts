/**
 * Global Test Setup
 * Prepares the test environment before all tests run
 */

import { FullConfig } from '@playwright/test';
import { setupTestEnvironment } from './test-data-setup';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up test environment...');

  try {
    // Setup test data fixtures
    const fixtures = await setupTestEnvironment();

    // Store fixtures globally for tests to access
    process.env.TEST_FIXTURES_READY = 'true';

    console.log('✅ Test environment setup complete');
    console.log('   - Test users created and configured');
    console.log('   - Database schemas verified');
    console.log('   - Test data fixtures prepared');

    return fixtures;
  } catch (error) {
    console.error('❌ Test environment setup failed:', error);
    throw error;
  }
}

export default globalSetup;