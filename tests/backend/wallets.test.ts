import request from 'supertest';
import express from 'express';
import { testUtils } from './setup';

// Mock database dependencies
jest.mock('../../server/config/multi-tenant-database', () => ({
  queryTenant: jest.fn(),
}));

import dbManager from '../../server/config/multi-tenant-database';

const mockQueryTenant = dbManager.queryTenant as jest.MockedFunction<typeof dbManager.queryTenant>;

// Mock authentication middleware
const mockAuthMiddleware = (req: any, res: any, next: any) => {
  req.user = testUtils.createMockUser();
  next();
};

const mockTenantMiddleware = (req: any, res: any, next: any) => {
  req.tenant = { id: 'test-tenant-id', name: 'test-tenant' };
  next();
};

describe('Wallet Routes', () => {
  let app: express.Application;

  beforeEach(async () => {
    // Dynamically import the routes to ensure mocks are applied
    const walletRoutes = await import('../../server/routes/wallets');
    
    app = express();
    app.use(express.json());
    app.use(mockAuthMiddleware);
    app.use(mockTenantMiddleware);
    app.use('/api/wallets', walletRoutes.default);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/wallets/balance', () => {
    it('should return user wallet balance', async () => {
      const mockWalletData = {
        id: 'wallet-id',
        user_id: 'test-user-id',
        wallet_number: 'WLT202501001',
        balance: 50000.00,
        available_balance: 45000.00,
        reserved_balance: 5000.00,
        currency: 'NGN',
        first_name: 'Test',
        last_name: 'User',
      };

      mockQueryTenant.mockResolvedValueOnce({
        rows: [mockWalletData]
      });

      const response = await request(app)
        .get('/api/wallets/balance')
        .expect(200);

      expect(response.body.wallet).toEqual(mockWalletData);
      expect(mockQueryTenant).toHaveBeenCalledWith(
        'test-user-id',
        expect.stringContaining('SELECT w.*, u.first_name, u.last_name'),
        ['test-user-id']
      );
    });

    it('should return 404 if wallet not found', async () => {
      mockQueryTenant.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/wallets/balance')
        .expect(404);

      expect(response.body.error).toBe('Wallet not found');
    });

    it('should handle database errors', async () => {
      mockQueryTenant.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/wallets/balance')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch wallet balance');
    });
  });

  describe('GET /api/wallets/statement', () => {
    it('should return wallet statement with transactions', async () => {
      const mockWallet = {
        id: 'wallet-id',
        wallet_number: 'WLT202501001',
      };

      const mockTransactions = [
        {
          id: 'txn-1',
          reference: 'TXN202501001',
          type: 'money_transfer',
          amount: 5000.00,
          status: 'completed',
          description: 'Transfer to John Doe',
          created_at: '2025-01-01T00:00:00Z',
          entry_type: 'debit',
        },
        {
          id: 'txn-2',
          reference: 'TXN202501002',
          type: 'credit',
          amount: 10000.00,
          status: 'completed',
          description: 'Account credit',
          created_at: '2025-01-02T00:00:00Z',
          entry_type: 'credit',
        },
      ];

      mockQueryTenant
        .mockResolvedValueOnce({ rows: [mockWallet] }) // Wallet lookup
        .mockResolvedValueOnce({ rows: [{ opening_balance: 40000.00 }] }) // Opening balance
        .mockResolvedValueOnce({ rows: mockTransactions }); // Transactions

      const response = await request(app)
        .get('/api/wallets/statement')
        .query({ startDate: '2025-01-01', endDate: '2025-01-31' })
        .expect(200);

      expect(response.body.statement.openingBalance).toBe(40000.00);
      expect(response.body.statement.transactions).toHaveLength(2);
      expect(response.body.statement.transactions[0]).toMatchObject({
        reference: 'TXN202501001',
        type: 'money_transfer',
        amount: 5000.00,
      });
    });

    it('should validate date parameters', async () => {
      const response = await request(app)
        .get('/api/wallets/statement')
        .query({ startDate: 'invalid-date' })
        .expect(400);

      expect(response.body.error).toContain('Invalid date format');
    });
  });

  describe('PUT /api/wallets/set-pin', () => {
    const validPinData = {
      currentPin: '1234',
      newPin: '5678',
      confirmPin: '5678',
    };

    it('should set new PIN successfully', async () => {
      // Mock current user lookup
      mockQueryTenant.mockResolvedValueOnce({
        rows: [{ transaction_pin_hash: '$2b$10$hashedcurrentpin' }]
      });

      // Mock PIN update
      mockQueryTenant.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .put('/api/wallets/set-pin')
        .send(validPinData)
        .expect(200);

      expect(response.body.message).toBe('Transaction PIN updated successfully');
    });

    it('should validate PIN confirmation', async () => {
      const response = await request(app)
        .put('/api/wallets/set-pin')
        .send({
          ...validPinData,
          confirmPin: '9999', // Different from newPin
        })
        .expect(400);

      expect(response.body.error).toBe('PIN confirmation does not match');
    });

    it('should validate PIN format', async () => {
      const response = await request(app)
        .put('/api/wallets/set-pin')
        .send({
          ...validPinData,
          newPin: '123', // Too short
        })
        .expect(400);

      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'newPin',
            msg: 'PIN must be exactly 4 digits',
          }),
        ])
      );
    });
  });

  describe('POST /api/wallets/verify-pin', () => {
    it('should verify PIN successfully', async () => {
      mockQueryTenant.mockResolvedValueOnce({
        rows: [{ transaction_pin_hash: '$2b$10$correcthash' }]
      });

      const response = await request(app)
        .post('/api/wallets/verify-pin')
        .send({ pin: '1234' })
        .expect(200);

      expect(response.body.valid).toBe(true);
    });

    it('should fail with incorrect PIN', async () => {
      mockQueryTenant.mockResolvedValueOnce({
        rows: [{ transaction_pin_hash: '$2b$10$differenthash' }]
      });

      const response = await request(app)
        .post('/api/wallets/verify-pin')
        .send({ pin: '9999' })
        .expect(400);

      expect(response.body.valid).toBe(false);
      expect(response.body.error).toBe('Invalid PIN');
    });
  });

  describe('GET /api/wallets/limits', () => {
    it('should return user transaction limits', async () => {
      const mockUserLimits = {
        daily_limit: 500000,
        monthly_limit: 5000000,
      };

      const mockSpending = {
        daily_spent: 50000,
        monthly_spent: 200000,
      };

      mockQueryTenant
        .mockResolvedValueOnce({ rows: [mockUserLimits] })
        .mockResolvedValueOnce({ rows: [mockSpending] });

      const response = await request(app)
        .get('/api/wallets/limits')
        .expect(200);

      expect(response.body.limits).toMatchObject({
        daily: {
          limit: 500000,
          used: 50000,
          remaining: 450000,
        },
        monthly: {
          limit: 5000000,
          used: 200000,
          remaining: 4800000,
        },
      });
    });
  });
});