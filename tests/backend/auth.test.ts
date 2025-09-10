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

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock JWT utilities
jest.mock('../../server/middleware/auth', () => ({
  generateToken: jest.fn(() => 'mock-jwt-token'),
  generateRefreshToken: jest.fn(() => 'mock-refresh-token'),
  verifyRefreshToken: jest.fn(),
  authenticateToken: jest.fn((req: any, res: any, next: any) => {
    req.user = {
      id: 'test-user-id',
      email: 'test@example.com',
      sessionId: 'test-session-id'
    };
    next();
  }),
}));

// Mock tenant middleware
const mockValidateTenantAccess = jest.fn((req: any, res: any, next: any) => {
  req.tenant = { id: '550e8400-e29b-41d4-a716-446655440000', name: 'test-tenant' };
  next();
});

jest.mock('../../server/middleware/tenant', () => ({
  validateTenantAccess: mockValidateTenantAccess,
}));

import { query, transaction } from '../../server/config/database';
import bcrypt from 'bcrypt';
import { generateToken, generateRefreshToken, verifyRefreshToken, authenticateToken } from '../../server/middleware/auth';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockTransaction = transaction as jest.MockedFunction<typeof transaction>;
const mockBcryptCompare = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;
const mockGenerateToken = generateToken as jest.MockedFunction<typeof generateToken>;
const mockGenerateRefreshToken = generateRefreshToken as jest.MockedFunction<typeof generateRefreshToken>;
const mockVerifyRefreshToken = verifyRefreshToken as jest.MockedFunction<typeof verifyRefreshToken>;

describe('Auth Routes', () => {
  let app: express.Application;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    mockBcryptCompare.mockResolvedValue(true);
    mockGenerateToken.mockReturnValue('mock-jwt-token');
    mockGenerateRefreshToken.mockReturnValue('mock-refresh-token');
    mockTransaction.mockImplementation(async (callback) => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] }) // UPDATE users for reset failed attempts
          .mockResolvedValueOnce({ rows: [{ id: 'session-123', session_token: 'mock-refresh-token', expires_at: new Date() }] }), // INSERT session
      };
      return await callback(mockClient as any);
    });
    
    // Dynamically import the routes to ensure mocks are applied
    const authRoutes = await import('../../server/routes/auth');
    
    app = express();
    app.use(express.json());
    app.use(mockValidateTenantAccess);
    app.use('/api/auth', authRoutes.default);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123',
      tenantId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID format
    };

    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        password_hash: '$2b$10$hashedpassword',
        first_name: 'Test',
        last_name: 'User',
        role: 'customer',
        status: 'active',
        tenant_id: '550e8400-e29b-41d4-a716-446655440000',
        failed_login_attempts: 0,
        tenant_name: 'test-tenant',
        tenant_display_name: 'Test Tenant',
        branding: {},
        security_settings: { maxLoginAttempts: 5 }
      };

      mockQuery.mockResolvedValueOnce(createQueryResult([mockUser]));

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('access');
      expect(response.body.data.tokens).toHaveProperty('refresh');
      expect(response.body.data.user.email).toBe(validLoginData.email);
    });

    it('should fail with invalid email', async () => {
      mockQuery.mockResolvedValueOnce(createQueryResult([])); // No user found

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          ...validLoginData,
          email: 'invalid@example.com',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should fail with inactive user', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        password_hash: '$2b$10$hashedpassword',
        status: 'inactive',
        tenant_id: '550e8400-e29b-41d4-a716-446655440000',
        failed_login_attempts: 0,
      };

      mockQuery.mockResolvedValueOnce(createQueryResult([mockUser]));

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Account is inactive');
      expect(response.body.code).toBe('ACCOUNT_INACTIVE');
    });

    it('should fail with invalid password', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        password_hash: '$2b$10$hashedpassword',
        status: 'active',
        tenant_id: '550e8400-e29b-41d4-a716-446655440000',
        failed_login_attempts: 0,
        security_settings: { maxLoginAttempts: 5 }
      };

      mockQuery.mockResolvedValueOnce(createQueryResult([mockUser]));
      mockBcryptCompare.mockResolvedValueOnce(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should require all fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          // Missing password and tenantId
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      const validRefreshToken = 'valid-refresh-token';
      const mockSession = {
        id: 'session-id',
        user_id: 'user-id',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'customer',
        status: 'active',
        tenant_id: 'tenant-id',
        tenant_name: 'test-tenant',
        tenant_display_name: 'Test Tenant'
      };

      mockVerifyRefreshToken.mockResolvedValueOnce({
        sessionId: 'session-id',
        userId: 'user-id'
      });
      mockQuery.mockResolvedValueOnce(createQueryResult([mockSession]));

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: validRefreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('access');
      expect(response.body.data.tokens).toHaveProperty('refresh');
    });

    it('should fail with invalid refresh token', async () => {
      mockVerifyRefreshToken.mockRejectedValueOnce(new Error('Invalid refresh token'));

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid refresh token');
      expect(response.body.code).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      mockQuery.mockResolvedValueOnce(createQueryResult([{ id: 'session-id' }]));

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should handle already logged out session', async () => {
      mockQuery.mockResolvedValueOnce(createQueryResult([])); // No session found

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return current user information', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'customer',
        status: 'active',
        tenant_id: '550e8400-e29b-41d4-a716-446655440000',
        kyc_level: 'tier1',
        phone_number: '+1234567890',
        created_at: '2025-01-01T00:00:00Z'
      };

      mockQuery.mockResolvedValueOnce(createQueryResult([mockUser]));

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
    });
  });
});