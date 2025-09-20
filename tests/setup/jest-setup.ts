import { setupTestDatabase, cleanupTestDatabase, closeTestDatabase } from './database-setup';

// Global setup - runs once before all tests
beforeAll(async () => {
  console.log('Setting up test database...');
  await setupTestDatabase();
  console.log('Test database setup complete');
}, 30000); // 30 second timeout for database setup

// Global cleanup - runs once after all tests
afterAll(async () => {
  console.log('Cleaning up test database...');
  await cleanupTestDatabase();
  await closeTestDatabase();
  console.log('Test database cleanup complete');
}, 30000); // 30 second timeout for database cleanup

// Increase default timeout for database operations
jest.setTimeout(10000);