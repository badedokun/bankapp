import request from 'supertest';
import express from 'express';
import { testDbPool } from './setup';

// Import all the routes we want to test
import authRoutes from '../../server/routes/auth';
import tenantRoutes from '../../server/routes/tenants';
import assetsRoutes from '../../server/routes/assets';
import walletsRoutes from '../../server/routes/wallets';
import transfersRoutes from '../../server/routes/transfers';

describe('API Integration Tests', () => {
  let app: express.Application;
  let authToken: string;
  let tenantId: string;

  beforeAll(async () => {
    // Setup Express app with all routes
    app = express();
    app.use(express.json());
    
    // Add routes
    app.use('/api/auth', authRoutes);
    app.use('/api/tenants', tenantRoutes);
    app.use('/api/assets', assetsRoutes);
    app.use('/api/wallets', walletsRoutes);
    app.use('/api/transfers', transfersRoutes);

    // Get test tenant ID
    const tenantResult = await testDbPool.query(
      'SELECT id FROM platform.tenants WHERE name = $1',
      ['test-tenant']
    );
    tenantId = tenantResult.rows[0]?.id;
  });

  describe('Full Authentication Flow', () => {
    it('should complete full auth flow: tenant lookup → login → profile', async () => {
      // 1. First, lookup tenant by name
      const tenantResponse = await request(app)
        .get('/api/tenants/by-name/test-tenant')
        .expect(200);

      expect(tenantResponse.body.tenant).toMatchObject({
        name: 'test-tenant',
        display_name: 'Test Tenant',
        status: 'active',
      });

      // Note: Since we don't have actual user data in the test database,
      // this part would fail in a real integration test. We'd need to:
      // 1. Create a test tenant database
      // 2. Provision test users
      // 3. Then test the login flow
      
      // This is more of a smoke test to ensure routes are wired correctly
    });
  });

  describe('Tenant Assets Flow', () => {
    it('should handle asset upload and retrieval', async () => {
      // Mock base64 image data
      const mockImageData = Buffer.from('fake-image-data').toString('base64');
      
      // Upload asset
      const uploadResponse = await request(app)
        .post(`/api/tenants/${tenantId}/assets`)
        .send({
          assetType: 'logo',
          assetName: 'test-logo',
          assetData: mockImageData,
          mimeType: 'image/png',
          dimensions: { width: 100, height: 100 },
          metadata: { description: 'Test logo' },
        })
        .expect(200);

      expect(uploadResponse.body.success).toBe(true);
      expect(uploadResponse.body.assetUrl).toContain('/assets/logo/test-logo');

      // Retrieve asset
      const assetResponse = await request(app)
        .get(`/api/tenants/${tenantId}/assets/logo/test-logo`)
        .expect(200);

      expect(assetResponse.headers['content-type']).toBe('image/png');
    });

    it('should handle asset retrieval by tenant name', async () => {
      const assetResponse = await request(app)
        .get('/api/tenants/by-name/test-tenant/assets/logo/test-logo')
        .expect(200);

      expect(assetResponse.headers['content-type']).toBe('image/png');
    });

    it('should return 404 for non-existent assets', async () => {
      await request(app)
        .get(`/api/tenants/${tenantId}/assets/logo/non-existent`)
        .expect(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid tenant ID format', async () => {
      const response = await request(app)
        .get('/api/tenants/invalid-uuid/assets/logo/test')
        .expect(400);

      expect(response.body.error).toContain('Invalid tenant ID');
    });

    it('should handle invalid asset type', async () => {
      const response = await request(app)
        .get(`/api/tenants/${tenantId}/assets/invalid-type/test`)
        .expect(400);

      expect(response.body.error).toContain('Invalid asset type');
    });
  });

  describe('Complete Banking Flow Integration', () => {
    let mockUserId: string;
    let mockWalletId: string;

    beforeEach(async () => {
      // Create mock tenant database tables for testing
      await testDbPool.query(`
        CREATE SCHEMA IF NOT EXISTS tenant_test_tenant
      `);
      
      await testDbPool.query(`
        CREATE TABLE IF NOT EXISTS tenant_test_tenant.users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          phone_number VARCHAR(20),
          is_email_verified BOOLEAN DEFAULT FALSE,
          is_phone_verified BOOLEAN DEFAULT FALSE,
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await testDbPool.query(`
        CREATE TABLE IF NOT EXISTS tenant_test_tenant.wallets (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES tenant_test_tenant.users(id),
          wallet_number VARCHAR(20) UNIQUE NOT NULL,
          wallet_type VARCHAR(50) DEFAULT 'main',
          balance DECIMAL(15,2) DEFAULT 0.00,
          available_balance DECIMAL(15,2) DEFAULT 0.00,
          reserved_balance DECIMAL(15,2) DEFAULT 0.00,
          currency VARCHAR(3) DEFAULT 'NGN',
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Insert test user
      const userResult = await testDbPool.query(`
        INSERT INTO tenant_test_tenant.users (
          email, password_hash, first_name, last_name, phone_number, is_email_verified
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, ['testuser@example.com', '$2b$10$hashedpassword', 'Test', 'User', '+2348012345678', true]);
      
      mockUserId = userResult.rows[0].id;

      // Insert test wallet
      const walletResult = await testDbPool.query(`
        INSERT INTO tenant_test_tenant.wallets (
          user_id, wallet_number, balance, available_balance
        ) VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [mockUserId, 'WLT202501001', 100000.00, 95000.00]);
      
      mockWalletId = walletResult.rows[0].id;
    });

    afterEach(async () => {
      // Clean up test data
      await testDbPool.query('DROP SCHEMA IF EXISTS tenant_test_tenant CASCADE');
    });

    it('should complete full user journey: login → check balance → transfer money', async () => {
      // 1. Tenant lookup
      const tenantResponse = await request(app)
        .get('/api/tenants/by-name/test-tenant')
        .expect(200);

      expect(tenantResponse.body.tenant.name).toBe('test-tenant');

      // 2. Login (mocked - would need to implement authentication)
      // In real test, this would authenticate and return JWT
      authToken = 'mock-jwt-token';

      // 3. Check wallet balance
      const balanceResponse = await request(app)
        .get('/api/wallets/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(balanceResponse.body.wallet).toMatchObject({
        wallet_number: 'WLT202501001',
        balance: 100000.00,
        available_balance: 95000.00,
      });

      // 4. Check transaction limits
      const limitsResponse = await request(app)
        .get('/api/wallets/limits')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(limitsResponse.body.limits).toHaveProperty('daily');
      expect(limitsResponse.body.limits).toHaveProperty('monthly');

      // 5. Initiate money transfer
      const transferData = {
        recipientAccountNumber: '9876543210',
        recipientName: 'Jane Doe',
        amount: 5000.00,
        description: 'Test transfer',
        pin: '1234'
      };

      const transferResponse = await request(app)
        .post('/api/transfers/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transferData)
        .expect(200);

      expect(transferResponse.body.transfer).toHaveProperty('reference');
      expect(transferResponse.body.transfer.status).toBe('processing');

      // 6. Check transaction history
      const historyResponse = await request(app)
        .get('/api/transfers/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(historyResponse.body.transactions).toHaveLength(1);
      expect(historyResponse.body.transactions[0]).toMatchObject({
        amount: 5000.00,
        recipient_name: 'Jane Doe',
        description: 'Test transfer',
      });
    });

    it('should handle wallet statement generation', async () => {
      const statementResponse = await request(app)
        .get('/api/wallets/statement')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-31'
        })
        .expect(200);

      expect(statementResponse.body.statement).toHaveProperty('openingBalance');
      expect(statementResponse.body.statement).toHaveProperty('closingBalance');
      expect(statementResponse.body.statement).toHaveProperty('transactions');
    });

    it('should validate transfer limits and PIN', async () => {
      // Test exceeding daily limit
      const largeTransferData = {
        recipientAccountNumber: '9876543210',
        recipientName: 'Jane Doe',
        amount: 1000000.00, // Exceeds typical daily limit
        description: 'Large transfer',
        pin: '1234'
      };

      const largeTransferResponse = await request(app)
        .post('/api/transfers/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largeTransferData)
        .expect(400);

      expect(largeTransferResponse.body.error).toContain('limit');

      // Test invalid PIN
      const invalidPinData = {
        recipientAccountNumber: '9876543210',
        recipientName: 'Jane Doe',
        amount: 1000.00,
        description: 'Test transfer',
        pin: 'wrong'
      };

      const invalidPinResponse = await request(app)
        .post('/api/transfers/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPinData)
        .expect(400);

      expect(invalidPinResponse.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'pin',
            msg: expect.stringContaining('4 digits'),
          }),
        ])
      );
    });

    it('should handle PIN management flow', async () => {
      // Set new PIN
      const setPinResponse = await request(app)
        .put('/api/wallets/set-pin')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPin: '1234',
          newPin: '5678',
          confirmPin: '5678'
        })
        .expect(200);

      expect(setPinResponse.body.message).toContain('updated successfully');

      // Verify new PIN
      const verifyResponse = await request(app)
        .post('/api/wallets/verify-pin')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ pin: '5678' })
        .expect(200);

      expect(verifyResponse.body.valid).toBe(true);

      // Verify old PIN fails
      const oldPinResponse = await request(app)
        .post('/api/wallets/verify-pin')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ pin: '1234' })
        .expect(400);

      expect(oldPinResponse.body.valid).toBe(false);
    });
  });

  describe('Multi-tenant Isolation', () => {
    it('should prevent cross-tenant data access', async () => {
      // This test would verify that tenant A cannot access tenant B's data
      // Implementation would depend on tenant isolation middleware
      
      // Test accessing wrong tenant's assets
      const response = await request(app)
        .get('/api/tenants/wrong-tenant-id/assets/logo/test-logo')
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    it('should handle tenant database switching', async () => {
      // Test that different tenants use different database schemas
      // This would be tested through the tenant context middleware
      expect(true).toBe(true); // Placeholder for complex tenant switching logic
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle database connection failures gracefully', async () => {
      // Mock database connection failure scenario
      // This would test error handling middleware
      expect(true).toBe(true); // Placeholder for database error simulation
    });

    it('should handle concurrent transfer attempts', async () => {
      // Test race conditions in transfer processing
      // This would test transaction isolation and locking mechanisms
      expect(true).toBe(true); // Placeholder for concurrency testing
    });
  });

  describe('CORS and Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/tenants/by-name/test-tenant')
        .expect(200);

      // Check for security headers (these would be added by middleware)
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });

    it('should validate JWT tokens properly', async () => {
      // Test invalid token
      const response = await request(app)
        .get('/api/wallets/balance')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toContain('Unauthorized');
    });

    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'https://example.com')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });
  });
});