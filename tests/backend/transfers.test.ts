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

// Mock NIBSS service
const mockNIBSSService = {
  accountInquiry: jest.fn(),
  initiateTransfer: jest.fn(),
  getTransactionStatus: jest.fn(),
  getBankList: jest.fn(),
};

jest.mock('../../server/services/nibss', () => ({
  nibssService: mockNIBSSService,
  NIBSSTransferRequest: jest.fn(),
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
    tenantId: '550e8400-e29b-41d4-a716-446655440000',
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
  req.tenant = { id: '550e8400-e29b-41d4-a716-446655440000', name: 'test-tenant' };
  next();
});

jest.mock('../../server/middleware/tenant', () => ({
  validateTenantAccess: mockValidateTenantAccess,
}));

import { query } from '../../server/config/database';
import bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockBcryptCompare = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;

describe('Transfer Routes - NIBSS Integration', () => {
  let app: express.Application;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    mockBcryptCompare.mockResolvedValue(true);
    
    // Reset NIBSS service mocks
    mockNIBSSService.accountInquiry.mockReset();
    mockNIBSSService.initiateTransfer.mockReset();
    mockNIBSSService.getTransactionStatus.mockReset();
    mockNIBSSService.getBankList.mockReset();
    
    // Dynamically import the routes to ensure mocks are applied
    const transferRoutes = await import('../../server/routes/transfers');
    
    app = express();
    app.use(express.json());
    app.use('/api/transfers', transferRoutes.default);
    
    // Add error handler
    app.use((error: any, req: any, res: any, next: any) => {
      console.error('Test error:', error);
      res.status(500).json({ success: false, error: error.message });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/transfers/account-inquiry', () => {
    it('should verify recipient account successfully', async () => {
      const mockInquiryResponse = {
        success: true,
        accountNumber: '1234567890',
        accountName: 'John Doe',
        bankCode: '058',
        bankName: 'Guaranty Trust Bank',
        message: 'Account inquiry successful'
      };

      mockNIBSSService.accountInquiry.mockResolvedValueOnce(mockInquiryResponse);

      const response = await request(app)
        .post('/api/transfers/account-inquiry')
        .send({
          accountNumber: '1234567890',
          bankCode: '058'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accountName).toBe('John Doe');
      expect(response.body.data.bankName).toBe('Guaranty Trust Bank');
      expect(mockNIBSSService.accountInquiry).toHaveBeenCalledWith({
        accountNumber: '1234567890',
        bankCode: '058'
      });
    });

    it('should handle invalid account numbers', async () => {
      const mockInquiryResponse = {
        success: false,
        accountNumber: '0000000000',
        accountName: '',
        bankCode: '058',
        bankName: '',
        message: 'Invalid account number'
      };

      mockNIBSSService.accountInquiry.mockResolvedValueOnce(mockInquiryResponse);

      const response = await request(app)
        .post('/api/transfers/account-inquiry')
        .send({
          accountNumber: '0000000000',
          bankCode: '058'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid account number');
      expect(response.body.code).toBe('ACCOUNT_INQUIRY_FAILED');
    });

    it('should validate account number format', async () => {
      const response = await request(app)
        .post('/api/transfers/account-inquiry')
        .send({
          accountNumber: '123', // Too short
          bankCode: '058'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/transfers/initiate', () => {
    it('should initiate transfer successfully', async () => {
      const mockWallet = {
        id: 'wallet-id',
        user_id: 'test-user-id',
        balance: '100000.00',
        transaction_pin_hash: '$2b$10$hashedpin',
        daily_limit: '500000.00',
        monthly_limit: '2000000.00',
        source_account: '2234567890',
        source_bank_code: '011',
        first_name: 'Test',
        last_name: 'User'
      };

      const mockLimits = {
        daily_spent: '50000.00',
        monthly_spent: '200000.00'
      };

      const mockTransfer = {
        id: 'transfer-id'
      };

      const mockNIBSSResponse = {
        success: true,
        transactionId: 'NIBSS_TXN_123',
        reference: 'ORP_123456',
        status: 'successful' as const,
        message: 'Transfer completed successfully',
        fee: '50.00',
        sessionId: 'SESSION_123'
      };

      // Mock database queries
      mockQuery
        .mockResolvedValueOnce({ query: 'BEGIN' }) // Transaction begin
        .mockResolvedValueOnce(createQueryResult([mockWallet])) // Wallet lookup
        .mockResolvedValueOnce(createQueryResult([mockLimits])) // Limits check
        .mockResolvedValueOnce(createQueryResult([])) // Check existing recipient
        .mockResolvedValueOnce(createQueryResult([mockTransfer])) // Create transfer
        .mockResolvedValueOnce({ query: 'UPDATE wallets' }) // Debit wallet
        .mockResolvedValueOnce({ query: 'UPDATE transfers' }) // Update transfer status
        .mockResolvedValueOnce({ query: 'INSERT INTO transaction_logs' }) // Log transaction
        .mockResolvedValueOnce({ query: 'COMMIT' }); // Transaction commit

      mockNIBSSService.initiateTransfer.mockResolvedValueOnce(mockNIBSSResponse);

      const response = await request(app)
        .post('/api/transfers/initiate')
        .send({
          recipientAccountNumber: '1234567890',
          recipientBankCode: '058',
          recipientName: 'John Doe',
          amount: 10000,
          description: 'Test transfer',
          pin: '1234'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(10000);
      expect(response.body.data.status).toBe('successful');
      expect(response.body.data.transactionId).toBe('NIBSS_TXN_123');
      expect(mockNIBSSService.initiateTransfer).toHaveBeenCalled();
    });

    it('should handle insufficient balance', async () => {
      const mockWallet = {
        id: 'wallet-id',
        user_id: 'test-user-id',
        balance: '5000.00', // Insufficient for transfer
        transaction_pin_hash: '$2b$10$hashedpin'
      };

      mockQuery
        .mockResolvedValueOnce({ query: 'BEGIN' })
        .mockResolvedValueOnce(createQueryResult([mockWallet]))
        .mockResolvedValueOnce({ query: 'ROLLBACK' });

      const response = await request(app)
        .post('/api/transfers/initiate')
        .send({
          recipientAccountNumber: '1234567890',
          recipientBankCode: '058',
          recipientName: 'John Doe',
          amount: 10000,
          pin: '1234'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Insufficient balance');
      expect(response.body.code).toBe('INSUFFICIENT_BALANCE');
    });

    it('should handle invalid PIN', async () => {
      const mockWallet = {
        id: 'wallet-id',
        user_id: 'test-user-id',
        balance: '100000.00',
        transaction_pin_hash: '$2b$10$hashedpin'
      };

      mockQuery
        .mockResolvedValueOnce({ query: 'BEGIN' })
        .mockResolvedValueOnce(createQueryResult([mockWallet]))
        .mockResolvedValueOnce({ query: 'ROLLBACK' });

      mockBcryptCompare.mockResolvedValueOnce(false);

      const response = await request(app)
        .post('/api/transfers/initiate')
        .send({
          recipientAccountNumber: '1234567890',
          recipientBankCode: '058',
          recipientName: 'John Doe',
          amount: 10000,
          pin: 'wrong-pin'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid transaction PIN');
      expect(response.body.code).toBe('INVALID_PIN');
    });

    it('should handle NIBSS transfer failure', async () => {
      const mockWallet = {
        id: 'wallet-id',
        user_id: 'test-user-id',
        balance: '100000.00',
        transaction_pin_hash: '$2b$10$hashedpin',
        daily_limit: '500000.00',
        monthly_limit: '2000000.00',
        source_account: '2234567890',
        source_bank_code: '011'
      };

      const mockLimits = { daily_spent: '0.00', monthly_spent: '0.00' };
      const mockTransfer = { id: 'transfer-id' };

      const mockNIBSSResponse = {
        success: false,
        transactionId: '',
        reference: 'ORP_123456',
        status: 'failed' as const,
        message: 'Transfer failed - insufficient funds at source account'
      };

      mockQuery
        .mockResolvedValueOnce({ query: 'BEGIN' })
        .mockResolvedValueOnce(createQueryResult([mockWallet]))
        .mockResolvedValueOnce(createQueryResult([mockLimits]))
        .mockResolvedValueOnce(createQueryResult([]))
        .mockResolvedValueOnce(createQueryResult([mockTransfer]))
        .mockResolvedValueOnce({ query: 'UPDATE wallets' }) // Initial debit
        .mockResolvedValueOnce({ query: 'UPDATE wallets' }) // Reverse debit
        .mockResolvedValueOnce({ query: 'UPDATE transfers' }) // Update transfer as failed
        .mockResolvedValueOnce({ query: 'INSERT INTO transaction_logs' }) // Log failure
        .mockResolvedValueOnce({ query: 'COMMIT' });

      mockNIBSSService.initiateTransfer.mockResolvedValueOnce(mockNIBSSResponse);

      const response = await request(app)
        .post('/api/transfers/initiate')
        .send({
          recipientAccountNumber: '1234567890',
          recipientBankCode: '058',
          recipientName: 'John Doe',
          amount: 10000,
          pin: '1234'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.data.status).toBe('failed');
      expect(response.body.data.message).toContain('Transfer failed');
    });
  });

  describe('GET /api/transfers/status/:reference', () => {
    it('should return transfer status', async () => {
      const mockTransfer = {
        id: 'transfer-id',
        reference: 'ORP_123456',
        amount: '10000.00',
        status: 'successful',
        direction: 'sent',
        description: 'Test transfer',
        recipient_account_number: '1234567890',
        recipient_name: 'John Doe',
        recipient_bank_code: '058',
        fee: '50.00',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        nibss_transaction_id: 'NIBSS_TXN_123'
      };

      mockQuery.mockResolvedValueOnce(createQueryResult([mockTransfer]));

      const response = await request(app)
        .get('/api/transfers/status/ORP_123456');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reference).toBe('ORP_123456');
      expect(response.body.data.status).toBe('successful');
      expect(response.body.data.amount).toBe(10000);
    });

    it('should update pending transfer status', async () => {
      const mockTransfer = {
        id: 'transfer-id',
        reference: 'ORP_123456',
        status: 'pending',
        nibss_transaction_id: 'NIBSS_TXN_123',
        // ... other fields
      };

      const mockStatusResponse = {
        success: true,
        transactionId: 'NIBSS_TXN_123',
        reference: 'ORP_123456',
        status: 'successful' as const,
        message: 'Transfer completed'
      };

      mockQuery
        .mockResolvedValueOnce(createQueryResult([mockTransfer]))
        .mockResolvedValueOnce({ query: 'UPDATE transfers' });

      mockNIBSSService.getTransactionStatus.mockResolvedValueOnce(mockStatusResponse);

      const response = await request(app)
        .get('/api/transfers/status/ORP_123456');

      expect(response.status).toBe(200);
      expect(mockNIBSSService.getTransactionStatus).toHaveBeenCalledWith({
        reference: 'ORP_123456',
        transactionId: 'NIBSS_TXN_123'
      });
    });

    it('should return 404 for non-existent transfer', async () => {
      mockQuery.mockResolvedValueOnce(createQueryResult([]));

      const response = await request(app)
        .get('/api/transfers/status/INVALID_REF');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Transfer not found');
      expect(response.body.code).toBe('TRANSFER_NOT_FOUND');
    });
  });

  describe('GET /api/transfers/banks', () => {
    it('should return list of supported banks', async () => {
      const mockBanksResponse = {
        success: true,
        banks: [
          { code: '058', name: 'Guaranty Trust Bank', active: true },
          { code: '011', name: 'First Bank of Nigeria', active: true },
          { code: '044', name: 'Access Bank', active: false }
        ]
      };

      mockNIBSSService.getBankList.mockResolvedValueOnce(mockBanksResponse);

      const response = await request(app)
        .get('/api/transfers/banks');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.banks).toHaveLength(2); // Only active banks
      expect(response.body.data.banks[0].name).toBe('Guaranty Trust Bank');
    });

    it('should handle NIBSS service unavailable', async () => {
      const mockBanksResponse = {
        success: false,
        banks: []
      };

      mockNIBSSService.getBankList.mockResolvedValueOnce(mockBanksResponse);

      const response = await request(app)
        .get('/api/transfers/banks');

      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Unable to fetch bank list');
      expect(response.body.code).toBe('SERVICE_UNAVAILABLE');
    });
  });

  describe('GET /api/transfers/history', () => {
    it('should return transfer history with pagination', async () => {
      const mockTransfers = [
        {
          id: 'transfer-1',
          reference: 'ORP_123456',
          amount: '10000.00',
          status: 'successful',
          direction: 'sent',
          description: 'Test transfer',
          recipient_account_number: '1234567890',
          recipient_name: 'John Doe',
          recipient_bank_code: '058',
          fee: '50.00',
          created_at: '2025-01-01T00:00:00Z',
          sender_first_name: 'Test',
          sender_last_name: 'User'
        }
      ];

      const mockCount = { total: '1' };

      mockQuery
        .mockResolvedValueOnce(createQueryResult(mockTransfers))
        .mockResolvedValueOnce(createQueryResult([mockCount]));

      const response = await request(app)
        .get('/api/transfers/history')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.transfers).toHaveLength(1);
      expect(response.body.data.pagination.totalCount).toBe(1);
    });
  });

  describe('GET /api/transfers/recipients', () => {
    it('should return saved recipients', async () => {
      const mockRecipients = [
        {
          id: 'recipient-1',
          account_number: '1234567890',
          account_name: 'John Doe',
          bank_code: '058',
          bank_name: 'Guaranty Trust Bank',
          transfer_count: '3',
          last_transfer: '2025-01-01T00:00:00Z',
          created_at: '2024-12-01T00:00:00Z'
        }
      ];

      mockQuery.mockResolvedValueOnce(createQueryResult(mockRecipients));

      const response = await request(app)
        .get('/api/transfers/recipients');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.recipients).toHaveLength(1);
      expect(response.body.data.recipients[0].accountName).toBe('John Doe');
      expect(response.body.data.recipients[0].transferCount).toBe(3);
    });
  });
});