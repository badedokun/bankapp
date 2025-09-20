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
  transaction: jest.fn(),
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
jest.mock('../../server/middleware/tenant', () => ({
  validateTenantAccess: jest.fn((req: any, res: any, next: any) => {
    req.tenant = { id: 'test-tenant-id', name: 'test-tenant' };
    next();
  }),
}));

import { query } from '../../server/config/database';
import bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockBcryptCompare = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;

describe('Transaction Routes', () => {
  let app: express.Application;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    mockBcryptCompare.mockResolvedValue(true);
    
    // Dynamically import the routes to ensure mocks are applied
    const transactionRoutes = await import('../../server/routes/transactions');
    
    app = express();
    app.use(express.json());
    app.use(mockAuthenticateToken);
    app.use((req: any, res: any, next: any) => {
      req.tenant = { id: 'test-tenant-id', name: 'test-tenant' };
      next();
    });
    app.use('/api/transactions', transactionRoutes.default);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/transactions/bill-payment', () => {
    it('should process bill payment successfully', async () => {
      const mockWallet = {
        id: 'wallet-id',
        user_id: 'test-user-id',
        balance: '100000.00',
        transaction_pin_hash: '$2b$10$hashedpin',
        status: 'active'
      };

      const mockProvider = {
        id: 'provider-id',
        name: 'EKEDC',
        bill_type: 'electricity',
        status: 'active',
        min_amount: '100',
        max_amount: '500000'
      };

      const mockTransaction = {
        id: 'transaction-id'
      };

      // Mock database queries
      mockQuery
        .mockResolvedValueOnce({ query: 'BEGIN' }) // Transaction begin
        .mockResolvedValueOnce(createQueryResult([mockWallet])) // Wallet lookup
        .mockResolvedValueOnce(createQueryResult([mockProvider])) // Provider lookup
        .mockResolvedValueOnce(createQueryResult([mockTransaction])) // Transaction insert
        .mockResolvedValueOnce({ query: 'UPDATE wallets' }) // Wallet debit
        .mockResolvedValueOnce({ query: 'INSERT INTO wallet_transactions' }) // Wallet transaction
        .mockResolvedValueOnce({ query: 'UPDATE transactions' }) // Update transaction status
        .mockResolvedValueOnce({ query: 'COMMIT' }); // Transaction commit

      const billPaymentData = {
        billType: 'electricity',
        providerId: 'provider-id',
        customerNumber: '1234567890',
        amount: 5000,
        pin: '1234',
        description: 'Electricity bill payment'
      };

      const response = await request(app)
        .post('/api/transactions/bill-payment')
        .send(billPaymentData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(5000);
      expect(response.body.data.provider.name).toBe('EKEDC');
    });

    it('should reject invalid bill type', async () => {
      const response = await request(app)
        .post('/api/transactions/bill-payment')
        .send({
          billType: 'invalid-type',
          providerId: 'provider-id',
          customerNumber: '1234567890',
          amount: 5000,
          pin: '1234'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Invalid bill type'
          })
        ])
      );
    });

    it('should handle insufficient balance', async () => {
      const mockWallet = {
        id: 'wallet-id',
        user_id: 'test-user-id',
        balance: '1000.00', // Insufficient for payment + fee
        transaction_pin_hash: '$2b$10$hashedpin',
        status: 'active'
      };

      const mockProvider = {
        id: 'provider-id',
        name: 'EKEDC',
        bill_type: 'electricity',
        status: 'active'
      };

      mockQuery
        .mockResolvedValueOnce({ query: 'BEGIN' })
        .mockResolvedValueOnce(createQueryResult([mockWallet]))
        .mockResolvedValueOnce(createQueryResult([mockProvider]))
        .mockResolvedValueOnce({ query: 'ROLLBACK' });

      const response = await request(app)
        .post('/api/transactions/bill-payment')
        .send({
          billType: 'electricity',
          providerId: 'provider-id',
          customerNumber: '1234567890',
          amount: 5000,
          pin: '1234'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Insufficient balance');
      expect(response.body.code).toBe('INSUFFICIENT_BALANCE');
    });
  });

  describe('POST /api/transactions/airtime-purchase', () => {
    it('should purchase airtime successfully', async () => {
      const mockWallet = {
        id: 'wallet-id',
        user_id: 'test-user-id',
        balance: '10000.00',
        transaction_pin_hash: '$2b$10$hashedpin',
        status: 'active'
      };

      const mockTransaction = {
        id: 'transaction-id'
      };

      mockQuery
        .mockResolvedValueOnce({ query: 'BEGIN' })
        .mockResolvedValueOnce(createQueryResult([mockWallet]))
        .mockResolvedValueOnce(createQueryResult([mockTransaction]))
        .mockResolvedValueOnce({ query: 'UPDATE wallets' })
        .mockResolvedValueOnce({ query: 'INSERT INTO wallet_transactions' })
        .mockResolvedValueOnce({ query: 'UPDATE transactions' })
        .mockResolvedValueOnce({ query: 'COMMIT' });

      const response = await request(app)
        .post('/api/transactions/airtime-purchase')
        .send({
          network: 'MTN',
          phoneNumber: '+2348012345678',
          amount: 1000,
          pin: '1234'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(1000);
      expect(response.body.data.network).toBe('MTN');
      expect(response.body.data.phoneNumber).toBe('+2348012345678');
    });

    it('should validate Nigerian phone numbers', async () => {
      const response = await request(app)
        .post('/api/transactions/airtime-purchase')
        .send({
          network: 'MTN',
          phoneNumber: '+1234567890', // Invalid Nigerian number
          amount: 1000,
          pin: '1234'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate network providers', async () => {
      const response = await request(app)
        .post('/api/transactions/airtime-purchase')
        .send({
          network: 'INVALID_NETWORK',
          phoneNumber: '+2348012345678',
          amount: 1000,
          pin: '1234'
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Invalid network provider'
          })
        ])
      );
    });
  });

  describe('GET /api/transactions/history', () => {
    it('should return transaction history with pagination', async () => {
      const mockTransactions = [
        {
          id: 'txn-1',
          reference: 'TXN_123456',
          type: 'bill_payment',
          amount: '5000.00',
          fee: '50.00',
          status: 'completed',
          description: 'Electricity bill payment',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          metadata: '{"billType":"electricity"}',
          recipient_name: null,
          recipient_account: null
        },
        {
          id: 'txn-2',
          reference: 'TXN_789012',
          type: 'airtime_purchase',
          amount: '1000.00',
          fee: '0.00',
          status: 'completed',
          description: 'MTN Airtime',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
          metadata: '{"network":"MTN"}',
          recipient_name: null,
          recipient_account: null
        }
      ];

      const mockCount = { total: '2' };

      mockQuery
        .mockResolvedValueOnce(createQueryResult(mockTransactions))
        .mockResolvedValueOnce(createQueryResult([mockCount]));

      const response = await request(app)
        .get('/api/transactions/history')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toHaveLength(2);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalCount).toBe(2);
    });

    it('should filter transactions by type', async () => {
      mockQuery
        .mockResolvedValueOnce(createQueryResult([]))
        .mockResolvedValueOnce(createQueryResult([{ total: '0' }]));

      const response = await request(app)
        .get('/api/transactions/history')
        .query({ type: 'bill_payment' });

      expect(response.status).toBe(200);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('t.type = $3'),
        expect.arrayContaining(['bill_payment'])
      );
    });
  });

  describe('GET /api/transactions/:reference/status', () => {
    it('should return transaction details', async () => {
      const mockTransaction = {
        id: 'transaction-id',
        reference: 'TXN_123456',
        type: 'bill_payment',
        amount: '5000.00',
        fee: '50.00',
        status: 'completed',
        description: 'Electricity bill payment',
        metadata: '{"billType":"electricity"}',
        external_reference: 'EXT_REF_789',
        failure_reason: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      };

      mockQuery.mockResolvedValueOnce(createQueryResult([mockTransaction]));

      const response = await request(app)
        .get('/api/transactions/TXN_123456/status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reference).toBe('TXN_123456');
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.metadata.billType).toBe('electricity');
    });

    it('should handle transaction not found', async () => {
      mockQuery.mockResolvedValueOnce(createQueryResult([]));

      const response = await request(app)
        .get('/api/transactions/INVALID_REF/status');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Transaction not found');
    });
  });

  describe('GET /api/transactions/bill-providers', () => {
    it('should return active bill providers', async () => {
      const mockProviders = [
        {
          id: 'provider-1',
          name: 'EKEDC',
          bill_type: 'electricity',
          description: 'Eko Electricity Distribution Company',
          logo_url: 'https://example.com/ekedc-logo.png',
          min_amount: '100.00',
          max_amount: '500000.00',
          status: 'active'
        },
        {
          id: 'provider-2',
          name: 'DStv',
          bill_type: 'cable_tv',
          description: 'Digital Satellite Television',
          logo_url: 'https://example.com/dstv-logo.png',
          min_amount: '1000.00',
          max_amount: '50000.00',
          status: 'active'
        }
      ];

      mockQuery.mockResolvedValueOnce(createQueryResult(mockProviders));

      const response = await request(app)
        .get('/api/transactions/bill-providers');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.providers).toHaveLength(2);
      expect(response.body.data.providers[0].name).toBe('EKEDC');
      expect(response.body.data.providers[1].billType).toBe('cable_tv');
    });

    it('should filter providers by type', async () => {
      mockQuery.mockResolvedValueOnce(createQueryResult([]));

      const response = await request(app)
        .get('/api/transactions/bill-providers')
        .query({ type: 'electricity' });

      expect(response.status).toBe(200);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('bill_type = $2'),
        ['active', 'electricity']
      );
    });
  });
});