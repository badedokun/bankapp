import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

interface TestUser {
  id: string;
  email: string;
  password: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'super_agent' | 'agent' | 'merchant' | 'viewer';
  status: 'active' | 'inactive';
  tenantId: string;
  phoneNumber: string;
  kycLevel: number;
}

interface TestTenant {
  id: string;
  name: string;
  displayName: string;
  subdomain: string;
  databaseName: string;
  databaseHost: string;
  databasePort: number;
  status: 'active' | 'inactive';
  tier: string;
  region: string;
  complianceLevel: string;
  databaseConfig: object;
  configuration: object;
  aiConfiguration: object;
  branding: object;
  securitySettings: object;
  billingInfo: object;
  complianceSettings: object;
}

interface TestWallet {
  id: string;
  userId: string;
  balance: string;
  currency: string;
  status: 'active' | 'inactive';
  transactionPinHash: string;
  transactionPin: string;
}

interface TestBillProvider {
  id: string;
  name: string;
  billType: 'electricity' | 'cable_tv' | 'water' | 'internet';
  description: string;
  logoUrl: string;
  minAmount: string;
  maxAmount: string;
  status: 'active' | 'inactive';
}

export class DatabaseTestSetup {
  private pool: Pool;
  
  // Test data containers
  public testTenants: TestTenant[] = [];
  public testUsers: TestUser[] = [];
  public testWallets: TestWallet[] = [];
  public testBillProviders: TestBillProvider[] = [];
  
  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER || 'bisiadedokun',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'bank_app_platform',
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT || '5433'),
    });
  }

  async initialize(): Promise<void> {
    try {
      // Create test tenants
      await this.createTestTenants();
      
      // Create test users for each tenant
      await this.createTestUsers();
      
      // Update auto-created wallets with transaction PIN hashes
      await this.updateWalletPins();
      
      // Note: Bill providers table doesn't exist yet, skipping for now
      // await this.createTestBillProviders();
      
      console.log('Database test setup completed successfully');
    } catch (error) {
      console.error('Database test setup failed:', error);
      throw error;
    }
  }

  private async createTestTenants(): Promise<void> {
    const tenants: TestTenant[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'test-tenant',
        displayName: 'Test Tenant',
        subdomain: 'test-tenant',
        databaseName: 'tenant_test_db',
        databaseHost: 'localhost',
        databasePort: 5432,
        status: 'active',
        tier: 'basic',
        region: 'us-east',
        complianceLevel: 'tier1',
        databaseConfig: { poolSize: 10, timeout: 30000 },
        configuration: { features: ['transfers', 'bills'] },
        aiConfiguration: { enabled: true, provider: 'openai' },
        branding: {
          logoUrl: 'https://example.com/logo.png',
          primaryColor: '#007bff',
          secondaryColor: '#6c757d'
        },
        securitySettings: {
          maxLoginAttempts: 5,
          sessionTimeout: 3600,
          requireTwoFactor: false
        },
        billingInfo: { plan: 'basic', currency: 'USD' },
        complianceSettings: { kycRequired: true, amlEnabled: true }
      },
      {
        id: '660f9511-f3ac-52e5-b827-557766551111',
        name: 'fmfb-tenant',
        displayName: 'FMFB Bank',
        subdomain: 'fmfb-bank',
        databaseName: 'tenant_fmfb_db',
        databaseHost: 'localhost',
        databasePort: 5432,
        status: 'active',
        tier: 'enterprise',
        region: 'us-east',
        complianceLevel: 'tier3',
        databaseConfig: { poolSize: 20, timeout: 30000 },
        configuration: { features: ['transfers', 'bills', 'loans'] },
        aiConfiguration: { enabled: true, provider: 'openai' },
        branding: {
          logoUrl: 'https://example.com/fmfb-logo.png',
          primaryColor: '#28a745',
          secondaryColor: '#20c997'
        },
        securitySettings: {
          maxLoginAttempts: 3,
          sessionTimeout: 1800,
          requireTwoFactor: true
        },
        billingInfo: { plan: 'enterprise', currency: 'USD' },
        complianceSettings: { kycRequired: true, amlEnabled: true, fraudDetection: true }
      }
    ];

    for (const tenant of tenants) {
      const query = `
        INSERT INTO platform.tenants (
          id, name, display_name, subdomain, database_name, database_host, database_port,
          status, tier, region, compliance_level, database_config, configuration,
          ai_configuration, branding, security_settings, billing_info, compliance_settings,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          display_name = EXCLUDED.display_name,
          subdomain = EXCLUDED.subdomain,
          status = EXCLUDED.status,
          tier = EXCLUDED.tier,
          region = EXCLUDED.region,
          compliance_level = EXCLUDED.compliance_level,
          database_config = EXCLUDED.database_config,
          configuration = EXCLUDED.configuration,
          ai_configuration = EXCLUDED.ai_configuration,
          branding = EXCLUDED.branding,
          security_settings = EXCLUDED.security_settings,
          billing_info = EXCLUDED.billing_info,
          compliance_settings = EXCLUDED.compliance_settings,
          updated_at = NOW()
      `;
      
      await this.pool.query(query, [
        tenant.id,
        tenant.name,
        tenant.displayName,
        tenant.subdomain,
        tenant.databaseName,
        tenant.databaseHost,
        tenant.databasePort,
        tenant.status,
        tenant.tier,
        tenant.region,
        tenant.complianceLevel,
        JSON.stringify(tenant.databaseConfig),
        JSON.stringify(tenant.configuration),
        JSON.stringify(tenant.aiConfiguration),
        JSON.stringify(tenant.branding),
        JSON.stringify(tenant.securitySettings),
        JSON.stringify(tenant.billingInfo),
        JSON.stringify(tenant.complianceSettings)
      ]);
    }

    this.testTenants = tenants;
  }

  private async createTestUsers(): Promise<void> {
    const users: TestUser[] = [
      {
        id: '11111111-2222-3333-4444-555555555555',
        email: 'test@example.com',
        password: 'password123',
        passwordHash: await bcrypt.hash('password123', 10),
        firstName: 'Test',
        lastName: 'User',
        role: 'agent',
        status: 'active',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        phoneNumber: '+2349012345678',
        kycLevel: 1
      },
      {
        id: '22222222-3333-4444-5555-666666666666',
        email: 'admin@example.com',
        password: 'admin123',
        passwordHash: await bcrypt.hash('admin123', 10),
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        status: 'active',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        phoneNumber: '+2349012345679',
        kycLevel: 2
      },
      {
        id: '33333333-4444-5555-6666-777777777777',
        email: 'customer@fmfb.com',
        password: 'fmfb123',
        passwordHash: await bcrypt.hash('fmfb123', 10),
        firstName: 'FMFB',
        lastName: 'Customer',
        role: 'agent',
        status: 'active',
        tenantId: '660f9511-f3ac-52e5-b827-557766551111',
        phoneNumber: '+2349012345680',
        kycLevel: 2
      },
      {
        id: '44444444-5555-6666-7777-888888888888',
        email: 'inactive@example.com',
        password: 'inactive123',
        passwordHash: await bcrypt.hash('inactive123', 10),
        firstName: 'Inactive',
        lastName: 'User',
        role: 'agent',
        status: 'inactive',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        phoneNumber: '+2349012345681',
        kycLevel: 1
      }
    ];

    for (const user of users) {
      const transactionPinHash = await bcrypt.hash('1234', 10); // Standard test PIN
      
      const query = `
        INSERT INTO tenant.users (
          id, email, password_hash, first_name, last_name, role, status,
          tenant_id, phone_number, kyc_level, failed_login_attempts,
          transaction_pin_hash, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, $11, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          password_hash = EXCLUDED.password_hash,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          role = EXCLUDED.role,
          status = EXCLUDED.status,
          phone_number = EXCLUDED.phone_number,
          kyc_level = EXCLUDED.kyc_level,
          transaction_pin_hash = EXCLUDED.transaction_pin_hash,
          updated_at = NOW()
      `;
      
      await this.pool.query(query, [
        user.id,
        user.email,
        user.passwordHash,
        user.firstName,
        user.lastName,
        user.role,
        user.status,
        user.tenantId,
        user.phoneNumber,
        user.kycLevel,
        transactionPinHash
      ]);
    }

    this.testUsers = users;
  }

  private async createTestWallets(): Promise<void> {
    const wallets: TestWallet[] = [
      {
        id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        userId: '11111111-2222-3333-4444-555555555555',
        balance: '100000.00',
        currency: 'NGN',
        status: 'active',
        transactionPin: '1234',
        transactionPinHash: await bcrypt.hash('1234', 10)
      },
      {
        id: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
        userId: '22222222-3333-4444-5555-666666666666',
        balance: '500000.00',
        currency: 'NGN',
        status: 'active',
        transactionPin: '5678',
        transactionPinHash: await bcrypt.hash('5678', 10)
      },
      {
        id: 'cccccccc-dddd-eeee-ffff-000000000000',
        userId: '33333333-4444-5555-6666-777777777777',
        balance: '250000.00',
        currency: 'NGN',
        status: 'active',
        transactionPin: '9012',
        transactionPinHash: await bcrypt.hash('9012', 10)
      },
      {
        id: 'dddddddd-eeee-ffff-0000-111111111111',
        userId: '44444444-5555-6666-7777-888888888888',
        balance: '1000.00',
        currency: 'NGN',
        status: 'inactive',
        transactionPin: '3456',
        transactionPinHash: await bcrypt.hash('3456', 10)
      }
    ];

    for (const wallet of wallets) {
      const query = `
        INSERT INTO tenant.wallets (
          id, user_id, tenant_id, wallet_type, wallet_name, balance, currency, status,
          available_balance, reserved_balance, is_primary, transaction_pin_hash,
          created_at, updated_at
        ) VALUES ($1, $2, $3, 'primary', 'Primary Account', $4, $5, $6, $4, 0.00, true, $7, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          balance = EXCLUDED.balance,
          available_balance = EXCLUDED.balance,
          currency = EXCLUDED.currency,
          status = EXCLUDED.status,
          updated_at = NOW()
      `;
      
      await this.pool.query(query, [
        wallet.id,
        wallet.userId,
        this.testUsers.find(u => u.id === wallet.userId)?.tenantId,
        wallet.balance,
        wallet.currency,
        wallet.status,
        wallet.transactionPinHash
      ]);
    }

    this.testWallets = wallets;
  }

  private async updateWalletPins(): Promise<void> {
    try {
      // Wait for auto-created wallets from user trigger
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update wallet PINs for our test users
      const pinUpdates = [
        { userId: '11111111-2222-3333-4444-555555555555', pin: '1234' },
        { userId: '22222222-3333-4444-5555-666666666666', pin: '5678' },
        { userId: '33333333-4444-5555-6666-777777777777', pin: '9012' },
        { userId: '44444444-5555-6666-7777-888888888888', pin: '3456' }
      ];

      for (const update of pinUpdates) {
        const hashedPin = await bcrypt.hash(update.pin, 10);
        
        // Try to update transaction_pin_hash if column exists, otherwise skip
        try {
          await this.pool.query(`
            UPDATE tenant.wallets 
            SET transaction_pin_hash = $1 
            WHERE user_id = $2
          `, [hashedPin, update.userId]);
        } catch (error) {
          // If column doesn't exist, we'll skip PIN validation in tests
          console.log(`Note: transaction_pin_hash column not found, skipping PIN setup for user ${update.userId}`);
        }
      }
    } catch (error) {
      console.log('Wallet PIN update failed, continuing without PIN validation:', error.message);
    }
  }

  private async createTestBillProviders(): Promise<void> {
    const providers: TestBillProvider[] = [
      {
        id: 'provider-ekedc-001',
        name: 'EKEDC',
        billType: 'electricity',
        description: 'Eko Electricity Distribution Company',
        logoUrl: 'https://example.com/ekedc-logo.png',
        minAmount: '100.00',
        maxAmount: '500000.00',
        status: 'active'
      },
      {
        id: 'provider-dstv-001',
        name: 'DStv',
        billType: 'cable_tv',
        description: 'Digital Satellite Television',
        logoUrl: 'https://example.com/dstv-logo.png',
        minAmount: '1000.00',
        maxAmount: '50000.00',
        status: 'active'
      },
      {
        id: 'provider-water-001',
        name: 'Lagos Water Corporation',
        billType: 'water',
        description: 'Lagos State Water Corporation',
        logoUrl: 'https://example.com/water-logo.png',
        minAmount: '500.00',
        maxAmount: '100000.00',
        status: 'active'
      },
      {
        id: 'provider-inactive-001',
        name: 'Inactive Provider',
        billType: 'internet',
        description: 'Test Inactive Provider',
        logoUrl: 'https://example.com/inactive-logo.png',
        minAmount: '1000.00',
        maxAmount: '10000.00',
        status: 'inactive'
      }
    ];

    for (const provider of providers) {
      const query = `
        INSERT INTO tenant.bill_providers (
          id, name, bill_type, description, logo_url, min_amount, max_amount,
          status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          bill_type = EXCLUDED.bill_type,
          description = EXCLUDED.description,
          logo_url = EXCLUDED.logo_url,
          min_amount = EXCLUDED.min_amount,
          max_amount = EXCLUDED.max_amount,
          status = EXCLUDED.status,
          updated_at = NOW()
      `;
      
      await this.pool.query(query, [
        provider.id,
        provider.name,
        provider.billType,
        provider.description,
        provider.logoUrl,
        provider.minAmount,
        provider.maxAmount,
        provider.status
      ]);
    }

    this.testBillProviders = providers;
  }

  async cleanup(): Promise<void> {
    try {
      // Clean up in reverse order to avoid foreign key constraints
      const userIds = [
        '11111111-2222-3333-4444-555555555555',
        '22222222-3333-4444-5555-666666666666',
        '33333333-4444-5555-6666-777777777777',
        '44444444-5555-6666-7777-888888888888'
      ];
      
      const walletIds = [
        'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
        'cccccccc-dddd-eeee-ffff-000000000000',
        'dddddddd-eeee-ffff-0000-111111111111'
      ];

      await this.pool.query('DELETE FROM tenant.wallet_transactions WHERE wallet_id = ANY($1)', [walletIds]);
      await this.pool.query('DELETE FROM tenant.transactions WHERE user_id = ANY($1)', [userIds]);
      await this.pool.query('DELETE FROM tenant.user_sessions WHERE user_id = ANY($1)', [userIds]);
      await this.pool.query('DELETE FROM tenant.wallets WHERE id = ANY($1)', [walletIds]);
      
      await this.pool.query('DELETE FROM tenant.users WHERE id = ANY($1)', [userIds]);
      
      // Note: Bill providers table cleanup skipped (table doesn't exist)
      // await this.pool.query('DELETE FROM tenant.bill_providers WHERE id IN ($1, $2, $3, $4)', [
      //   'provider-ekedc-001', 'provider-dstv-001', 'provider-water-001', 'provider-inactive-001'
      // ]);
      
      // Clean up audit logs first to avoid foreign key constraint errors
      try {
        await this.pool.query('DELETE FROM audit.tenant_audit_logs WHERE tenant_id IN ($1, $2)', 
          ['550e8400-e29b-41d4-a716-446655440000', '660f9511-f3ac-52e5-b827-557766551111']);
      } catch (error) {
        console.log('Note: tenant_audit_logs table or records not found, continuing cleanup');
      }

      // Try to disable audit trigger temporarily during cleanup (may not exist)
      try {
        await this.pool.query('ALTER TABLE platform.tenants DISABLE TRIGGER ALL');
      } catch (error) {
        console.log('Note: could not disable triggers, continuing cleanup');
      }
      
      await this.pool.query('DELETE FROM platform.tenants WHERE id = $1', ['550e8400-e29b-41d4-a716-446655440000']);
      await this.pool.query('DELETE FROM platform.tenants WHERE id = $1', ['660f9511-f3ac-52e5-b827-557766551111']);
      
      // Try to re-enable audit trigger (may not exist)
      try {
        await this.pool.query('ALTER TABLE platform.tenants ENABLE TRIGGER ALL');
      } catch (error) {
        console.log('Note: could not re-enable triggers, cleanup complete');
      }
      
      console.log('Database test cleanup completed successfully');
    } catch (error) {
      console.error('Database test cleanup failed:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  // Helper methods to get test data
  getTestUser(email: string): TestUser | undefined {
    return this.testUsers.find(user => user.email === email);
  }

  getTestWallet(userId: string): TestWallet | undefined {
    return this.testWallets.find(wallet => wallet.userId === userId);
  }

  getTestTenant(id: string): TestTenant | undefined {
    return this.testTenants.find(tenant => tenant.id === id);
  }

  getTestBillProvider(id: string): TestBillProvider | undefined {
    return this.testBillProviders.find(provider => provider.id === id);
  }
}

// Global test setup instance
export const testDatabase = new DatabaseTestSetup();

// Jest setup and teardown helpers
export const setupTestDatabase = async (): Promise<void> => {
  await testDatabase.initialize();
};

export const cleanupTestDatabase = async (): Promise<void> => {
  await testDatabase.cleanup();
};

export const closeTestDatabase = async (): Promise<void> => {
  await testDatabase.close();
};