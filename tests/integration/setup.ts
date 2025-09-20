import { Pool } from 'pg';
import { config } from 'dotenv';

// Load test environment
config({ path: '.env.test' });

// Test database configuration
const testDbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  user: process.env.DB_USER || 'bisiadedokun',
  password: process.env.DB_PASSWORD || '',
  database: 'bank_app_platform_test',
};

let testDbPool: Pool;

export const setupTestDatabase = async (): Promise<Pool> => {
  // Create test database if it doesn't exist
  const adminPool = new Pool({
    ...testDbConfig,
    database: 'postgres', // Connect to default database first
  });

  try {
    await adminPool.query(`CREATE DATABASE ${testDbConfig.database}`);
  } catch (error) {
    // Database might already exist, which is fine
  } finally {
    await adminPool.end();
  }

  // Connect to test database
  testDbPool = new Pool(testDbConfig);
  
  // Run basic schema setup if needed
  await testDbPool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await testDbPool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
  
  return testDbPool;
};

export const cleanupTestDatabase = async (): Promise<void> => {
  if (testDbPool) {
    try {
      // Clean up test data with proper PostgreSQL syntax
      await testDbPool.query(`
        DO $$ 
        BEGIN
          IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'platform' AND table_name = 'tenants') THEN
            TRUNCATE TABLE platform.tenants CASCADE;
          END IF;
          IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'platform' AND table_name = 'tenant_assets') THEN
            TRUNCATE TABLE platform.tenant_assets CASCADE;
          END IF;
        END $$;
      `);
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
    }
    await testDbPool.end();
  }
};

export const seedTestData = async (): Promise<void> => {
  // Create basic platform schema if it doesn't exist
  await testDbPool.query('CREATE SCHEMA IF NOT EXISTS platform');
  
  // Create basic tenants table for testing
  await testDbPool.query(`
    CREATE TABLE IF NOT EXISTS platform.tenants (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) UNIQUE NOT NULL,
      display_name VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'active',
      subdomain VARCHAR(100),
      tier VARCHAR(50) DEFAULT 'basic',
      branding JSONB DEFAULT '{}',
      configuration JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert test tenant
  await testDbPool.query(`
    INSERT INTO platform.tenants (
      name, display_name, subdomain, tier, status, branding
    ) VALUES (
      'test-tenant',
      'Test Tenant',
      'test',
      'enterprise',
      'active',
      '{"primaryColor": "#007bff", "secondaryColor": "#6c757d"}'::jsonb
    ) ON CONFLICT (name) DO NOTHING
  `);
};

// Setup and teardown hooks
beforeAll(async () => {
  await setupTestDatabase();
  await seedTestData();
});

afterAll(async () => {
  await cleanupTestDatabase();
});

export { testDbPool };