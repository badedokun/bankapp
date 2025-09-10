import request from 'supertest';
import express from 'express';
import { QueryResult } from 'pg';

// Helper function to create proper QueryResult mock
function createQueryResult<T>(rows: T[]): QueryResult<T> {
  return {
    rows,
    command: 'SELECT',
    rowCount: rows.length,
    oid: 0,
    fields: []
  } as QueryResult<T>;
}

// Mock database dependencies
jest.mock('../../server/config/database', () => ({
  query: jest.fn(),
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock authentication middleware
const mockAuthenticateToken = jest.fn((req: any, res: any, next: any) => {
  req.user = {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'customer',
    status: 'active',
    tenantId: 'test-tenant-id',
    tenantName: 'test-tenant',
    tenantDisplayName: 'Test Tenant',
  };
  next();
});

jest.mock('../../server/middleware/auth', () => ({
  authenticateToken: mockAuthenticateToken,
}));

// Mock tenant middleware 
const mockValidateTenantAccess = jest.fn((req: any, res: any, next: any) => {
  req.tenant = { id: 'test-tenant-id', name: 'test-tenant' };
  next();
});

jest.mock('../../server/middleware/tenant', () => ({
  validateTenantAccess: mockValidateTenantAccess,
}));

import { query } from '../../server/config/database';
import bcrypt from 'bcrypt';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockBcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
const mockBcryptCompare = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;

describe('Wallet Routes', () => {
  let app: express.Application;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    mockBcryptHash.mockResolvedValue('hashed-pin');
    mockBcryptCompare.mockResolvedValue(true);
    
    // Dynamically import the routes to ensure mocks are applied
    const walletRoutes = await import('../../server/routes/wallets');
    
    app = express();
    app.use(express.json());
    app.use(mockAuthenticateToken);
    app.use(mockValidateTenantAccess);
    app.use('/api/wallets', walletRoutes.default);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/wallets/balance', () => {
    it('should return user wallet balance successfully', async () => {
      const mockWallet = {
        id: 'wallet-id',
        user_id: 'test-user-id',
        account_number: '1234567890',
        balance: '50000.00',
        currency: 'NGN',
        wallet_type: 'primary',
        status: 'active',
        first_name: 'Test',
        last_name: 'User',
        kyc_level: 'tier2',
        daily_limit: '100000.00',
        monthly_limit: '500000.00',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      };

      const mockSpending = {
        daily_spent: '25000.00',
        monthly_spent: '150000.00'
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [mockWallet], rowCount: 1 })
        .mockResolvedValueOnce(createQueryResult([mockSpending]));

      const response = await request(app)
        .get('/api/wallets/balance');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accountNumber).toBe('1234567890');
      expect(response.body.data.balance).toBe(50000);
      expect(response.body.data.currency).toBe('NGN');
      expect(response.body.data.limits.dailyLimit).toBe(100000);
      expect(response.body.data.limits.dailySpent).toBe(25000);
      expect(response.body.data.owner.name).toBe('Test User');
    });

    it('should return 404 if wallet not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const response = await request(app)
        .get('/api/wallets/balance');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Wallet not found');
      expect(response.body.code).toBe('WALLET_NOT_FOUND');
    });

    it('should handle database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/wallets/balance');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch wallet balance');
    });
  });

  describe('GET /api/wallets/all', () => {
    it('should return all user wallets', async () => {
      const mockWallets = [
        {
          id: 'primary-wallet-id',
          wallet_type: 'primary',
          balance: '50000.00',
          currency: 'NGN',
          is_primary: true,
          status: 'active',
          first_name: 'Test',
          last_name: 'User',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        {
          id: 'savings-wallet-id',
          wallet_type: 'savings',
          balance: '25000.00',
          currency: 'NGN',
          is_primary: false,
          status: 'active',
          first_name: 'Test',
          last_name: 'User',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z'
        }
      ];

      mockQuery.mockResolvedValueOnce(createQueryResult(mockWallets));

      const response = await request(app)
        .get('/api/wallets/all');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.wallets).toHaveLength(2);
      expect(response.body.data.wallets[0].walletType).toBe('primary');
      expect(response.body.data.wallets[0].isPrimary).toBe(true);
      expect(response.body.data.wallets[1].walletType).toBe('savings');
      expect(response.body.data.wallets[1].isPrimary).toBe(false);
    });
  });

  describe('POST /api/wallets/create', () => {
    it('should create new wallet successfully', async () => {
      const mockCountResult = { wallet_count: '2' };
      const mockNewWallet = {
        id: 'new-wallet-id',
        wallet_type: 'savings',
        wallet_name: 'My Savings',
        balance: '0.00',
        created_at: '2025-01-01T00:00:00Z'
      };

      mockQuery
        .mockResolvedValueOnce(createQueryResult([mockCountResult]))
        .mockResolvedValueOnce(createQueryResult([mockNewWallet]));

      const response = await request(app)
        .post('/api/wallets/create')
        .send({
          walletType: 'savings',
          name: 'My Savings',
          description: 'Emergency fund'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.walletType).toBe('savings');
      expect(response.body.data.name).toBe('My Savings');
    });

    it('should reject invalid wallet type', async () => {
      const response = await request(app)
        .post('/api/wallets/create')
        .send({
          walletType: 'invalid_type',
          name: 'Test Wallet'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('PUT /api/wallets/set-pin', () => {
    it('should set PIN successfully', async () => {
      const mockUser = {
        transaction_pin_hash: null
      };

      mockQuery
        .mockResolvedValueOnce(createQueryResult([mockUser]))
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .put('/api/wallets/set-pin')
        .send({
          pin: '1234',
          confirmPin: '1234'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Transaction PIN set successfully');
      expect(mockBcryptHash).toHaveBeenCalledWith('1234', 12);
    });

    it('should validate PIN confirmation', async () => {
      const response = await request(app)
        .put('/api/wallets/set-pin')
        .send({
          pin: '1234',
          confirmPin: '5678'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('PIN and confirm PIN do not match');
    });

    it('should validate PIN format', async () => {
      const response = await request(app)
        .put('/api/wallets/set-pin')
        .send({
          pin: '123', // Too short
          confirmPin: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/wallets/verify-pin', () => {
    it('should verify PIN successfully', async () => {
      const mockUser = {
        transaction_pin_hash: 'hashed-pin'
      };

      mockQuery.mockResolvedValueOnce(createQueryResult([mockUser]));
      mockBcryptCompare.mockResolvedValueOnce(true);

      const response = await request(app)
        .post('/api/wallets/verify-pin')
        .send({ pin: '1234' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('PIN verified successfully');
    });

    it('should fail with incorrect PIN', async () => {
      const mockUser = {
        transaction_pin_hash: 'hashed-pin'
      };

      mockQuery.mockResolvedValueOnce(createQueryResult([mockUser]));
      mockBcryptCompare.mockResolvedValueOnce(false);

      const response = await request(app)
        .post('/api/wallets/verify-pin')
        .send({ pin: '9999' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid transaction PIN');
    });

    it('should handle PIN not set', async () => {
      const mockUser = {
        transaction_pin_hash: null
      };

      mockQuery.mockResolvedValueOnce(createQueryResult([mockUser]));

      const response = await request(app)
        .post('/api/wallets/verify-pin')
        .send({ pin: '1234' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Transaction PIN not set');
    });
  });

  describe('GET /api/wallets/limits', () => {
    it('should return transaction limits', async () => {
      const mockUser = {
        daily_limit: '100000.00',
        monthly_limit: '500000.00',
        kyc_level: 'tier2',
        balance: '50000.00'
      };

      const mockSpending = {
        daily_spent: '50000.00',
        monthly_spent: '200000.00'
      };

      mockQuery
        .mockResolvedValueOnce(createQueryResult([mockUser]))
        .mockResolvedValueOnce(createQueryResult([mockSpending]));

      const response = await request(app)
        .get('/api/wallets/limits');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.limits.dailyLimit).toBe(100000);
      expect(response.body.data.limits.dailySpent).toBe(50000);
      expect(response.body.data.limits.dailyRemaining).toBe(50000);
      expect(response.body.data.limits.monthlyLimit).toBe(500000);
      expect(response.body.data.limits.monthlySpent).toBe(200000);
      expect(response.body.data.limits.monthlyRemaining).toBe(300000);
    });
  });

  describe('GET /api/wallets/statement', () => {
    it('should return wallet statement', async () => {
      const mockWallet = {
        id: 'wallet-id',
        wallet_number: 'WLT202501001',
        balance: '50000.00',
        first_name: 'Test',
        last_name: 'User'
      };

      const mockOpeningBalance = {
        opening_balance: '40000.00'
      };

      const mockTransactions = [
        {
          id: 'txn-1',
          reference: 'TXN001',
          type: 'credit',
          amount: '10000.00',
          description: 'Wallet funding',
          created_at: '2025-01-01T00:00:00Z',
          recipient_account_number: null,
          recipient_name: null,
          recipient_bank_code: null,
          transaction_type: 'funding'
        }
      ];

      mockQuery
        .mockResolvedValueOnce(createQueryResult([mockWallet]))
        .mockResolvedValueOnce(createQueryResult([mockOpeningBalance]))
        .mockResolvedValueOnce(createQueryResult(mockTransactions));

      const response = await request(app)
        .get('/api/wallets/statement')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-31'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.statement.openingBalance).toBe(40000);
      expect(response.body.data.statement.transactions).toHaveLength(1);
    });

    it('should validate required date parameters', async () => {
      const response = await request(app)
        .get('/api/wallets/statement');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Start date and end date are required');
    });
  });
});