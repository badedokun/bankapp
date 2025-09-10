import request from 'supertest';
import express from 'express';
import { testDatabase } from '../setup/database-setup';
import authRoutes from '../../server/routes/auth';
import { tenantMiddleware } from '../../server/middleware/tenant';
import { errorHandler } from '../../server/middleware/errorHandler';
import bcrypt from 'bcrypt';

describe('Auth Routes', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use(tenantMiddleware);
    app.use('/api/auth', authRoutes);
    app.use(errorHandler);
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const testUser = testDatabase.getTestUser('test@example.com');
      
      const response = await request(app)
        .post('/api/auth/login')
        .set('X-Tenant-ID', 'test-tenant')
        .set('X-Tenant-ID', 'test-tenant')
        .send({
          email: testUser!.email,
          password: testUser!.password,
          tenantId: testUser!.tenantId
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('access');
      expect(response.body.data.tokens).toHaveProperty('refresh');
      expect(response.body.data.user.email).toBe(testUser!.email);
      expect(response.body.data.user.firstName).toBe(testUser!.firstName);
      expect(response.body.data.user.lastName).toBe(testUser!.lastName);
      expect(response.body.data.user.role).toBe(testUser!.role);
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('X-Tenant-ID', 'test-tenant')
        .send({
          email: 'invalid@example.com',
          password: 'password123',
          tenantId: '550e8400-e29b-41d4-a716-446655440000'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should fail with inactive user', async () => {
      const inactiveUser = testDatabase.getTestUser('inactive@example.com');
      
      const response = await request(app)
        .post('/api/auth/login')
        .set('X-Tenant-ID', 'test-tenant')
        .send({
          email: inactiveUser!.email,
          password: inactiveUser!.password,
          tenantId: inactiveUser!.tenantId
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Account is inactive');
      expect(response.body.code).toBe('ACCOUNT_INACTIVE');
    });

    it('should fail with invalid password', async () => {
      const testUser = testDatabase.getTestUser('test@example.com');
      
      const response = await request(app)
        .post('/api/auth/login')
        .set('X-Tenant-ID', 'test-tenant')
        .send({
          email: testUser!.email,
          password: 'wrongpassword',
          tenantId: testUser!.tenantId
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should require all fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('X-Tenant-ID', 'test-tenant')
        .send({
          email: 'test@example.com',
          // Missing password and tenantId
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeAll(async () => {
      // First login to get valid tokens
      const testUser = testDatabase.getTestUser('test@example.com');
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .set('X-Tenant-ID', 'test-tenant')
        .send({
          email: testUser!.email,
          password: testUser!.password,
          tenantId: testUser!.tenantId
        });

      accessToken = loginResponse.body.data.tokens.access;
      refreshToken = loginResponse.body.data.tokens.refresh;
    });

    it('should refresh token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('X-Tenant-ID', 'test-tenant')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('access');
      expect(response.body.data.tokens).toHaveProperty('refresh');
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('X-Tenant-ID', 'test-tenant')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid refresh token');
      expect(response.body.code).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken: string;

    beforeAll(async () => {
      // Login to get a valid token
      const testUser = testDatabase.getTestUser('test@example.com');
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .set('X-Tenant-ID', 'test-tenant')
        .send({
          email: testUser!.email,
          password: testUser!.password,
          tenantId: testUser!.tenantId
        });

      accessToken = loginResponse.body.data.tokens.access;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('X-Tenant-ID', 'test-tenant')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should handle unauthorized requests', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('X-Tenant-ID', 'test-tenant');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    let accessToken: string;

    beforeAll(async () => {
      // Login to get a valid token
      const testUser = testDatabase.getTestUser('test@example.com');
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .set('X-Tenant-ID', 'test-tenant')
        .send({
          email: testUser!.email,
          password: testUser!.password,
          tenantId: testUser!.tenantId
        });

      accessToken = loginResponse.body.data.tokens.access;
    });

    it('should return current user information', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('X-Tenant-ID', 'test-tenant')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.firstName).toBe('Test');
      expect(response.body.data.user.lastName).toBe('User');
      expect(response.body.data.user.role).toBe('agent');
      expect(response.body.data.user.kycLevel).toBe(1);
    });

    it('should handle unauthorized requests', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('X-Tenant-ID', 'test-tenant');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});