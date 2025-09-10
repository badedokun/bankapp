/**
 * Test Data Setup for Integration Tests
 * Creates real banking data in the database for testing scenarios
 */

import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../server/config/database';

export interface TestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  tenantId: string;
  bvn?: string;
  nin?: string;
}

export interface TestWallet {
  id: string;
  userId: string;
  accountNumber: string;
  walletNumber: string;
  balance: number;
  availableBalance: number;
  reservedBalance: number;
  currency: string;
  dailyLimit: number;
  monthlyLimit: number;
  kycLevel: 'level_1' | 'level_2' | 'level_3';
}

export interface TestTransaction {
  id: string;
  reference: string;
  walletId: string;
  type: 'money_transfer' | 'deposit' | 'withdrawal' | 'bill_payment';
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  description: string;
  entryType: 'credit' | 'debit';
  recipientName?: string;
  recipientBank?: string;
  recipientAccount?: string;
}

export class TestDataManager {
  private tenantId: string = 'fmfb';

  /**
   * Create a test user with realistic banking profile
   */
  async createTestUser(userData: Partial<TestUser> & { email: string; password: string }): Promise<TestUser> {
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user: TestUser = {
      id: userId,
      email: userData.email,
      firstName: userData.firstName || 'Test',
      lastName: userData.lastName || 'User',
      phoneNumber: userData.phoneNumber || '+2348012345678',
      tenantId: this.tenantId,
      bvn: userData.bvn,
      nin: userData.nin,
    };

    // Insert into users table
    await query(`
      INSERT INTO users (
        id, email, password_hash, first_name, last_name, phone_number,
        tenant_id, bvn, nin, status, role, email_verified, phone_verified,
        kyc_level, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      ON CONFLICT (email, tenant_id) DO NOTHING
    `, [
      userId,
      user.email,
      hashedPassword,
      user.firstName,
      user.lastName,
      user.phoneNumber,
      user.tenantId,
      user.bvn,
      user.nin,
      'active',
      'customer',
      true,
      true,
      'level_2',
    ]);

    return user;
  }

  /**
   * Create a wallet for a test user with realistic balance and limits
   */
  async createTestWallet(userId: string, walletData?: Partial<TestWallet>): Promise<TestWallet> {
    const walletId = uuidv4();
    const accountNumber = this.generateAccountNumber();
    const walletNumber = this.generateWalletNumber();
    
    const wallet: TestWallet = {
      id: walletId,
      userId,
      accountNumber,
      walletNumber,
      balance: walletData?.balance || 250000.00, // ₦250,000 default balance
      availableBalance: walletData?.availableBalance || 245000.00,
      reservedBalance: walletData?.reservedBalance || 5000.00,
      currency: walletData?.currency || 'NGN',
      dailyLimit: walletData?.dailyLimit || 500000.00, // ₦500,000 daily limit
      monthlyLimit: walletData?.monthlyLimit || 5000000.00, // ₦5,000,000 monthly limit
      kycLevel: walletData?.kycLevel || 'level_2',
    };

    // Insert into wallets table
    await query(`
      INSERT INTO wallets (
        id, user_id, account_number, wallet_number, balance, 
        available_balance, reserved_balance, currency, daily_limit, 
        monthly_limit, kyc_level, status, created_at, updated_at,
        tenant_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW(), $13)
      ON CONFLICT (account_number, tenant_id) DO NOTHING
    `, [
      walletId,
      userId,
      accountNumber,
      walletNumber,
      wallet.balance,
      wallet.availableBalance,
      wallet.reservedBalance,
      wallet.currency,
      wallet.dailyLimit,
      wallet.monthlyLimit,
      wallet.kycLevel,
      'active',
      this.tenantId,
    ]);

    return wallet;
  }

  /**
   * Create realistic test transactions
   */
  async createTestTransaction(walletId: string, transactionData: Partial<TestTransaction>): Promise<TestTransaction> {
    const transactionId = uuidv4();
    const reference = this.generateTransactionReference();
    
    const transaction: TestTransaction = {
      id: transactionId,
      reference,
      walletId,
      type: transactionData.type || 'money_transfer',
      amount: transactionData.amount || 50000.00,
      status: transactionData.status || 'completed',
      description: transactionData.description || 'Test transaction',
      entryType: transactionData.entryType || 'debit',
      recipientName: transactionData.recipientName,
      recipientBank: transactionData.recipientBank,
      recipientAccount: transactionData.recipientAccount,
    };

    // Insert into transactions table
    await query(`
      INSERT INTO transactions (
        id, reference, wallet_id, type, amount, status, description,
        entry_type, recipient_name, recipient_bank, recipient_account,
        tenant_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
    `, [
      transactionId,
      reference,
      walletId,
      transaction.type,
      transaction.amount,
      transaction.status,
      transaction.description,
      transaction.entryType,
      transaction.recipientName,
      transaction.recipientBank,
      transaction.recipientAccount,
      this.tenantId,
    ]);

    return transaction;
  }

  /**
   * Set up a complete banking scenario with user, wallet, and transactions
   */
  async createBankingScenario(userEmail: string, password: string): Promise<{
    user: TestUser;
    wallet: TestWallet;
    transactions: TestTransaction[];
  }> {
    console.log(`🏦 Creating banking scenario for: ${userEmail}`);

    // Create user
    const user = await this.createTestUser({
      email: userEmail,
      password,
      firstName: userEmail.split('.')[0] || 'Test',
      lastName: userEmail.split('.')[1]?.split('@')[0] || 'User',
      bvn: '221' + Math.random().toString().substr(2, 8),
      nin: Math.random().toString().substr(2, 11),
    });

    // Create wallet
    const wallet = await this.createTestWallet(user.id);

    // Create sample transactions
    const transactions = await Promise.all([
      // Incoming transfer
      this.createTestTransaction(wallet.id, {
        type: 'deposit',
        amount: 100000.00,
        entryType: 'credit',
        description: 'Salary payment',
        status: 'completed',
      }),
      // Outgoing transfer
      this.createTestTransaction(wallet.id, {
        type: 'money_transfer',
        amount: 25000.00,
        entryType: 'debit',
        description: 'Transfer to family',
        status: 'completed',
        recipientName: 'Jane Doe',
        recipientBank: 'GTBank',
        recipientAccount: '0123456789',
      }),
      // Bill payment
      this.createTestTransaction(wallet.id, {
        type: 'bill_payment',
        amount: 15000.00,
        entryType: 'debit',
        description: 'Electricity bill payment',
        status: 'completed',
      }),
      // Pending transaction
      this.createTestTransaction(wallet.id, {
        type: 'money_transfer',
        amount: 50000.00,
        entryType: 'debit',
        description: 'Business payment',
        status: 'pending',
        recipientName: 'ABC Company Ltd',
        recipientBank: 'UBA',
        recipientAccount: '2234567890',
      }),
    ]);

    // Set transaction PIN
    const hashedPin = await bcrypt.hash('1234', 10);
    await query(`
      UPDATE users SET transaction_pin_hash = $1, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3
    `, [hashedPin, user.id, this.tenantId]);

    console.log(`✅ Banking scenario created:`);
    console.log(`   👤 User: ${user.firstName} ${user.lastName}`);
    console.log(`   💳 Account: ${wallet.accountNumber}`);
    console.log(`   💰 Balance: ₦${wallet.balance.toLocaleString()}`);
    console.log(`   📝 Transactions: ${transactions.length} records`);
    console.log(`   🔐 PIN: 1234`);

    return { user, wallet, transactions };
  }

  /**
   * Clean up test data
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test data...');
    
    const testEmails = [
      'john.doe@example.com',
      'jane.smith@example.com',
      'test.customer@example.com',
    ];

    for (const email of testEmails) {
      // Get user ID first
      const userResult = await query(
        'SELECT id FROM users WHERE email = $1 AND tenant_id = $2',
        [email, this.tenantId]
      );

      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].id;

        // Delete transactions first (foreign key dependency)
        await query(
          'DELETE FROM transactions WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = $1)',
          [userId]
        );

        // Delete wallets
        await query('DELETE FROM wallets WHERE user_id = $1', [userId]);

        // Delete user
        await query('DELETE FROM users WHERE id = $1', [userId]);
      }
    }

    console.log('✅ Test data cleanup completed');
  }

  /**
   * Generate realistic account number
   */
  private generateAccountNumber(): string {
    // Nigerian account numbers are typically 10 digits
    return '30' + Math.random().toString().substr(2, 8);
  }

  /**
   * Generate wallet number
   */
  private generateWalletNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString().substr(2, 5);
    return `WLT${year}${month}${random}`;
  }

  /**
   * Generate transaction reference
   */
  private generateTransactionReference(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    const random = Math.random().toString().substr(2, 6);
    return `TXN${year}${month}${day}${random}`;
  }

  /**
   * Generate spending data for limits testing
   */
  async createSpendingData(userId: string): Promise<void> {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Insert daily spending record
    await query(`
      INSERT INTO daily_spending (user_id, date, amount_spent, tenant_id, created_at)
      VALUES ($1, CURRENT_DATE, $2, $3, NOW())
      ON CONFLICT (user_id, date, tenant_id) DO UPDATE SET
        amount_spent = $2,
        updated_at = NOW()
    `, [userId, 125000.00, this.tenantId]); // ₦125,000 spent today

    // Insert monthly spending record
    await query(`
      INSERT INTO monthly_spending (user_id, year, month, amount_spent, tenant_id, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (user_id, year, month, tenant_id) DO UPDATE SET
        amount_spent = $4,
        updated_at = NOW()
    `, [userId, today.getFullYear(), today.getMonth() + 1, 750000.00, this.tenantId]); // ₦750,000 spent this month
  }
}

export const testDataManager = new TestDataManager();