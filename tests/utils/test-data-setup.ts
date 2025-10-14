/**
 * Test Data Setup and Teardown Utilities
 * Manages test data lifecycle for comprehensive testing
 */

import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export interface TestDatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface TestUserData {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  pin: string;
  tenantId: string;
  role: string;
  status: string;
}

export interface TestAccountData {
  id: string;
  userId: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  balance: number;
  currency: string;
  tenantId: string;
  status: string;
}

export interface TestTransferData {
  id: string;
  senderId: string;
  recipientName: string;
  recipientAccountNumber: string;
  recipientBankCode: string;
  amount: number;
  fees: number;
  description: string;
  status: string;
  reference: string;
  tenantId: string;
}

export class TestDataManager {
  private pool: Pool;
  private createdUsers: Set<string> = new Set();
  private createdAccounts: Set<string> = new Set();
  private createdTransfers: Set<string> = new Set();
  private createdWallets: Set<string> = new Set();

  constructor(config: TestDatabaseConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  /**
   * Setup test tenant and basic data
   */
  async setupTestTenant(): Promise<string> {
    const client = await this.pool.connect();
    try {
      const tenantId = '7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3'; // FMFB tenant

      // Ensure tenant exists
      await client.query(`
        INSERT INTO platform.tenants (id, name, display_name, subdomain, status)
        VALUES ($1, 'fmfb', 'First MFB', 'fmfb', 'active')
        ON CONFLICT (id) DO NOTHING
      `, [tenantId]);

      return tenantId;
    } finally {
      client.release();
    }
  }

  /**
   * Create test user with wallet
   */
  async createTestUser(userData: Partial<TestUserData> = {}): Promise<TestUserData> {
    const client = await this.pool.connect();
    try {
      const user: TestUserData = {
        id: userData.id || uuidv4(),
        email: userData.email || `test-${Date.now()}@example.com`,
        password: userData.password || '$2b$10$example.hashed.password', // bcrypt hash of 'test123'
        firstName: userData.firstName || 'Test',
        lastName: userData.lastName || 'User',
        phone: userData.phone || '+2348000000000',
        pin: userData.pin || '$2b$10$example.hashed.pin', // bcrypt hash of '1234'
        tenantId: userData.tenantId || '7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3',
        role: userData.role || 'agent',
        status: userData.status || 'active'
      };

      // Insert user
      await client.query(`
        INSERT INTO tenant.users (
          id, email, password_hash, first_name, last_name, phone_number, transaction_pin_hash,
          tenant_id, role, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      `, [
        user.id, user.email, user.password, user.firstName, user.lastName, user.phone,
        user.pin, user.tenantId, user.role, user.status
      ]);

      // Create wallet for user
      const walletId = uuidv4();
      await client.query(`
        INSERT INTO tenant.wallets (
          id, user_id, balance, currency, status, tenant_id, created_at, updated_at
        ) VALUES ($1, $2, 1000000.00, 'NGN', 'active', $3, NOW(), NOW())
      `, [walletId, user.id, user.tenantId]);

      this.createdUsers.add(user.id);
      this.createdWallets.add(walletId);

      return user;
    } finally {
      client.release();
    }
  }

  /**
   * Create test account for user
   */
  async createTestAccount(userId: string, accountData: Partial<TestAccountData> = {}): Promise<TestAccountData> {
    const client = await this.pool.connect();
    try {
      const account: TestAccountData = {
        id: accountData.id || uuidv4(),
        userId: userId,
        accountNumber: accountData.accountNumber || this.generateAccountNumber(),
        accountName: accountData.accountName || 'Test Account',
        accountType: accountData.accountType || 'savings',
        balance: accountData.balance || 500000.00,
        currency: accountData.currency || 'NGN',
        tenantId: accountData.tenantId || '7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3',
        status: accountData.status || 'active'
      };

      await client.query(`
        INSERT INTO tenant.wallets (
          id, user_id, wallet_number, balance, currency,
          wallet_type, tenant_id, status, is_primary, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, NOW(), NOW())
        ON CONFLICT (user_id) WHERE is_primary = true DO UPDATE SET
          balance = EXCLUDED.balance,
          updated_at = NOW()
      `, [
        account.id, account.userId, account.accountNumber, account.balance, account.currency,
        account.accountType, account.tenantId, account.status
      ]);

      this.createdAccounts.add(account.id);
      return account;
    } finally {
      client.release();
    }
  }

  /**
   * Create test transfer record
   */
  async createTestTransfer(transferData: Partial<TestTransferData>): Promise<TestTransferData> {
    const client = await this.pool.connect();
    try {
      const transfer: TestTransferData = {
        id: transferData.id || uuidv4(),
        senderId: transferData.senderId!,
        recipientName: transferData.recipientName || 'Test Recipient',
        recipientAccountNumber: transferData.recipientAccountNumber || this.generateAccountNumber(),
        recipientBankCode: transferData.recipientBankCode || '058',
        amount: transferData.amount || 10000.00,
        fee: transferData.fee || 100.00,
        description: transferData.description || 'Test transfer',
        status: transferData.status || 'successful',
        reference: transferData.reference || `TXN${Date.now()}`,
        tenantId: transferData.tenantId || '7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3'
      };

      await client.query(`
        INSERT INTO tenant.transfers (
          id, sender_id, recipient_name, recipient_account_number,
          recipient_bank_code, amount, fee, description, status,
          reference, tenant_id, source_account_number, source_bank_code,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      `, [
        transfer.id, transfer.senderId, transfer.recipientName, transfer.recipientAccountNumber,
        transfer.recipientBankCode, transfer.amount, transfer.fee, transfer.description,
        transfer.status, transfer.reference, transfer.tenantId,
        '1234567890', // source_account_number
        '058' // source_bank_code
      ]);

      this.createdTransfers.add(transfer.id);
      return transfer;
    } finally {
      client.release();
    }
  }

  /**
   * Setup realistic test scenario with multiple users and transfers
   */
  async setupRealisticTestScenario(): Promise<{
    senderUser: TestUserData;
    recipientUser: TestUserData;
    senderAccount: TestAccountData;
    recipientAccount: TestAccountData;
    transfers: TestTransferData[];
  }> {
    // Generate unique timestamp for test data
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 5);

    // Create sender user with unique email
    const senderUser = await this.createTestUser({
      email: `sender-${timestamp}-${randomSuffix}@test.com`,
      firstName: 'John',
      lastName: 'Sender',
      phone: `+234812${timestamp.toString().slice(-7)}`
    });

    // Create recipient user with unique email
    const recipientUser = await this.createTestUser({
      email: `recipient-${timestamp}-${randomSuffix}@test.com`,
      firstName: 'Jane',
      lastName: 'Recipient',
      phone: `+234898${timestamp.toString().slice(-7)}`
    });

    // Create accounts
    const senderAccount = await this.createTestAccount(senderUser.id, {
      accountName: 'John Sender Account',
      balance: 2000000.00
    });

    const recipientAccount = await this.createTestAccount(recipientUser.id, {
      accountName: 'Jane Recipient Account',
      balance: 100000.00
    });

    // Create some transfer history
    const transfers: TestTransferData[] = [];

    // Recent successful transfer
    transfers.push(await this.createTestTransfer({
      senderId: senderUser.id,
      recipientName: `${recipientUser.firstName} ${recipientUser.lastName}`,
      recipientAccountNumber: recipientAccount.accountNumber,
      amount: 50000.00,
      status: 'successful',
      description: 'Payment for services'
    }));

    // Pending transfer
    transfers.push(await this.createTestTransfer({
      senderId: senderUser.id,
      recipientName: 'External Recipient',
      recipientAccountNumber: '1234567890',
      recipientBankCode: '033',
      amount: 25000.00,
      status: 'pending',
      description: 'Bill payment'
    }));

    // Failed transfer
    transfers.push(await this.createTestTransfer({
      senderId: senderUser.id,
      recipientName: 'Failed Recipient',
      recipientAccountNumber: '0000000000',
      amount: 10000.00,
      status: 'failed',
      description: 'Failed transaction test'
    }));

    return {
      senderUser,
      recipientUser,
      senderAccount,
      recipientAccount,
      transfers
    };
  }

  /**
   * Generate realistic account number
   */
  private generateAccountNumber(): string {
    return Math.floor(Math.random() * 9000000000 + 1000000000).toString();
  }

  /**
   * Update user balance
   */
  async updateUserBalance(userId: string, newBalance: number): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE tenant.wallets
        SET balance = $1, updated_at = NOW()
        WHERE user_id = $2
      `, [newBalance, userId]);
    } finally {
      client.release();
    }
  }

  /**
   * Clear all login attempts for user
   */
  async clearLoginAttempts(email: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        DELETE FROM tenant.login_attempts WHERE identifier = $1
      `, [email]);

      await client.query(`
        UPDATE tenant.users
        SET failed_login_attempts = 0, status = 'active', updated_at = NOW()
        WHERE email = $1
      `, [email]);
    } finally {
      client.release();
    }
  }

  /**
   * Clear user sessions
   */
  async clearUserSessions(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM tenant.user_sessions');
    } finally {
      client.release();
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<TestUserData | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, email, first_name, last_name, phone_number, tenant_id, role, status
        FROM tenant.users WHERE email = $1
      `, [email]);

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        password: '',
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone_number,
        pin: '',
        tenantId: row.tenant_id,
        role: row.role,
        status: row.status
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get user's wallet balance
   */
  async getUserBalance(userId: string): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT balance FROM tenant.wallets WHERE user_id = $1
      `, [userId]);

      return result.rows.length > 0 ? parseFloat(result.rows[0].balance) : 0;
    } finally {
      client.release();
    }
  }

  /**
   * Comprehensive cleanup of all test-related data
   */
  async comprehensiveCleanup(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Delete all test data in dependency order
      console.log('🧹 Starting comprehensive test data cleanup...');

      // Remove test transfers
      await client.query(`
        DELETE FROM tenant.transfers
        WHERE description LIKE '%test%'
        OR recipient_name LIKE '%test%'
        OR recipient_name LIKE '%Test%'
        OR reference LIKE '%TXN%'
      `);

      // Remove test transactions
      await client.query(`
        DELETE FROM tenant.transactions
        WHERE description LIKE '%test%'
        OR description LIKE '%Test%'
        OR reference LIKE '%TXN%'
      `);

      // Remove test wallets
      await client.query(`
        DELETE FROM tenant.wallets
        WHERE user_id IN (
          SELECT id FROM tenant.users
          WHERE email LIKE '%@test.com'
          OR email LIKE '%test%'
          OR first_name = 'Test'
        )
      `);

      // Remove test user sessions and login attempts
      await client.query(`
        DELETE FROM tenant.user_sessions
        WHERE user_id IN (
          SELECT id FROM tenant.users
          WHERE email LIKE '%@test.com'
          OR email LIKE '%test%'
        )
      `);

      await client.query(`
        DELETE FROM tenant.login_attempts
        WHERE identifier LIKE '%@test.com'
        OR identifier LIKE '%test%'
      `);

      // Remove test users (except admin and demo)
      await client.query(`
        DELETE FROM tenant.users
        WHERE (email LIKE '%@test.com' OR email LIKE '%test%' OR first_name = 'Test')
        AND email NOT IN ('admin@fmfb.com', 'demo@fmfb.com')
      `);

      console.log('✅ Test data cleanup completed');
    } finally {
      client.release();
    }
  }

  /**
   * Cleanup tracked test data
   */
  async cleanup(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Delete in reverse order of dependencies
      if (this.createdTransfers.size > 0) {
        await client.query(`
          DELETE FROM tenant.transfers WHERE id = ANY($1)
        `, [Array.from(this.createdTransfers)]);
      }

      if (this.createdAccounts.size > 0) {
        await client.query(`
          DELETE FROM tenant.accounts WHERE id = ANY($1)
        `, [Array.from(this.createdAccounts)]);
      }

      if (this.createdWallets.size > 0) {
        await client.query(`
          DELETE FROM tenant.wallets WHERE id = ANY($1)
        `, [Array.from(this.createdWallets)]);
      }

      if (this.createdUsers.size > 0) {
        await client.query(`
          DELETE FROM tenant.users WHERE id = ANY($1)
        `, [Array.from(this.createdUsers)]);
      }

      // Clear tracking sets
      this.createdUsers.clear();
      this.createdAccounts.clear();
      this.createdTransfers.clear();
      this.createdWallets.clear();
    } finally {
      client.release();
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

export const TEST_DB_CONFIG: TestDatabaseConfig = {
  host: 'localhost',
  port: 5433,
  database: 'bank_app_platform',
  username: 'bisiadedokun',
  password: 'orokiipay_secure_banking_2024!@#'
};

export class TestDataFixtures {
  private dataManager: TestDataManager;

  constructor(config: TestDatabaseConfig = TEST_DB_CONFIG) {
    this.dataManager = new TestDataManager(config);
  }

  /**
   * Setup fresh test environment
   */
  async setupFreshEnvironment(): Promise<{
    adminUser: TestUserData;
    demoUser: TestUserData;
    testScenario: Awaited<ReturnType<TestDataManager['setupRealisticTestScenario']>>;
  }> {
    // First perform comprehensive cleanup of all test data
    await this.dataManager.comprehensiveCleanup();

    // Setup tenant
    await this.dataManager.setupTestTenant();

    // Ensure default users exist and are properly configured
    const adminUser = await this.ensureTestUser({
      email: 'admin@fmfb.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });

    const demoUser = await this.ensureTestUser({
      email: 'demo@fmfb.com',
      firstName: 'Demo',
      lastName: 'User',
      role: 'agent'
    });

    // Clear any existing sessions and login attempts
    await this.dataManager.clearUserSessions();
    await this.dataManager.clearLoginAttempts(adminUser.email);
    await this.dataManager.clearLoginAttempts(demoUser.email);

    // Update balances to known amounts
    await this.dataManager.updateUserBalance(adminUser.id, 5000000.00);
    await this.dataManager.updateUserBalance(demoUser.id, 1000000.00);

    // Setup realistic test scenario
    const testScenario = await this.dataManager.setupRealisticTestScenario();

    return {
      adminUser,
      demoUser,
      testScenario
    };
  }

  /**
   * Ensure test user exists or create if missing
   */
  private async ensureTestUser(userData: Partial<TestUserData>): Promise<TestUserData> {
    const existingUser = await this.dataManager.getUserByEmail(userData.email!);

    if (existingUser) {
      return existingUser;
    }

    return await this.dataManager.createTestUser(userData);
  }

  /**
   * Get data manager instance
   */
  getDataManager(): TestDataManager {
    return this.dataManager;
  }

  /**
   * Cleanup and close
   */
  async cleanup(): Promise<void> {
    await this.dataManager.cleanup();
    await this.dataManager.close();
  }
}

export const waitForCondition = async (
  condition: () => Promise<boolean>,
  timeout: number = 30000,
  interval: number = 1000
): Promise<void> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
};

export const setupTestEnvironment = async (): Promise<TestDataFixtures> => {
  const fixtures = new TestDataFixtures();
  await fixtures.setupFreshEnvironment();
  return fixtures;
};

export const teardownTestEnvironment = async (fixtures: TestDataFixtures): Promise<void> => {
  await fixtures.cleanup();
};