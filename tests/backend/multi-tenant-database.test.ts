import { Pool } from 'pg';
import dbManager from '../../server/config/multi-tenant-database';

// Mock pg module
jest.mock('pg', () => {
  const mockClient = {
    connect: jest.fn(),
    query: jest.fn(),
    release: jest.fn(),
    end: jest.fn(),
  };

  const mockPool = {
    connect: jest.fn().mockResolvedValue(mockClient),
    query: jest.fn(),
    end: jest.fn(),
    totalCount: 5,
    idleCount: 3,
    waitingCount: 0,
    options: { max: 20, min: 2 },
    on: jest.fn(),
  };

  return {
    Pool: jest.fn(() => mockPool),
    Client: jest.fn(() => mockClient),
  };
});

describe('Multi-tenant Database Manager', () => {
  let mockPool: any;

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
      connect: jest.fn(),
      end: jest.fn(),
      totalCount: 5,
      idleCount: 3,
      waitingCount: 0,
    };

    // Reset the module to clear any cached pools
    jest.resetModules();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTenantPool', () => {
    it('should create and cache tenant connection pool', async () => {
      // Mock tenant lookup
      const mockTenantData = {
        id: 'tenant-123',
        name: 'test-tenant',
        database_name: 'tenant_test_db',
        database_host: 'localhost',
        database_port: 5433,
      };

      // Mock platform database query
      const platformQuery = jest.spyOn(dbManager as any, 'queryPlatform');
      platformQuery.mockResolvedValueOnce({
        rows: [mockTenantData]
      });

      const pool = await (dbManager as any).getTenantPool('tenant-123');

      expect(pool).toBeDefined();
      expect(platformQuery).toHaveBeenCalledWith(
        'SELECT * FROM platform.tenants WHERE id = $1',
        ['tenant-123']
      );
    });

    it('should reuse cached tenant pool', async () => {
      const tenantId = 'tenant-123';
      
      // Mock tenant data
      const mockTenantData = {
        id: tenantId,
        database_name: 'tenant_test_db',
        database_host: 'localhost',
        database_port: 5433,
      };

      const platformQuery = jest.spyOn(dbManager as any, 'queryPlatform');
      platformQuery.mockResolvedValueOnce({
        rows: [mockTenantData]
      });

      // First call should create pool
      const pool1 = await (dbManager as any).getTenantPool(tenantId);
      
      // Second call should reuse cached pool
      const pool2 = await (dbManager as any).getTenantPool(tenantId);

      expect(pool1).toBe(pool2);
      expect(platformQuery).toHaveBeenCalledTimes(1); // Should only query once
    });

    it('should throw error for non-existent tenant', async () => {
      const platformQuery = jest.spyOn(dbManager as any, 'queryPlatform');
      platformQuery.mockResolvedValueOnce({ rows: [] });

      await expect((dbManager as any).getTenantPool('non-existent-tenant'))
        .rejects.toThrow('Tenant not found: non-existent-tenant');
    });

    it('should handle database connection errors', async () => {
      const mockTenantData = {
        id: 'tenant-123',
        database_name: 'tenant_test_db',
        database_host: 'localhost',
        database_port: 5433,
      };

      const platformQuery = jest.spyOn(dbManager as any, 'queryPlatform');
      platformQuery.mockResolvedValueOnce({
        rows: [mockTenantData]
      });

      // Mock Pool constructor to throw error
      const PoolMock = Pool as jest.MockedClass<typeof Pool>;
      PoolMock.mockImplementationOnce(() => {
        throw new Error('Connection failed');
      });

      await expect((dbManager as any).getTenantPool('tenant-123'))
        .rejects.toThrow('Connection failed');
    });
  });

  describe('queryTenant', () => {
    it('should execute query on tenant database', async () => {
      const mockResult = { rows: [{ id: 1, name: 'test' }] };
      
      // Mock getTenantPool to return a mock pool
      jest.spyOn(dbManager as any, 'getTenantPool').mockResolvedValue(mockPool);
      mockPool.query.mockResolvedValue(mockResult);

      const result = await dbManager.queryTenant(
        'tenant-123',
        'SELECT * FROM users WHERE id = $1',
        ['user-123']
      );

      expect(result).toEqual(mockResult);
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = $1',
        ['user-123']
      );
    });

    it('should handle query errors', async () => {
      const mockError = new Error('Query failed');
      
      jest.spyOn(dbManager as any, 'getTenantPool').mockResolvedValue(mockPool);
      mockPool.query.mockRejectedValue(mockError);

      await expect(dbManager.queryTenant('tenant-123', 'INVALID SQL'))
        .rejects.toThrow('Query failed');
    });

    it('should log slow queries', async () => {
      const mockResult = { rows: [] };
      
      jest.spyOn(dbManager as any, 'getTenantPool').mockResolvedValue(mockPool);
      
      // Mock slow query
      mockPool.query.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockResult), 1100))
      );

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await dbManager.queryTenant('tenant-123', 'SLOW SELECT');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow tenant query detected'),
        expect.any(String)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('transactionTenant', () => {
    it('should execute transaction on tenant database', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };

      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [] });

      jest.spyOn(dbManager as any, 'getTenantPool').mockResolvedValue(mockPool);

      const mockCallback = jest.fn().mockResolvedValue({ success: true });

      const result = await dbManager.transactionTenant('tenant-123', mockCallback);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockCallback).toHaveBeenCalledWith(mockClient);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should rollback on callback error', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };

      const mockError = new Error('Transaction failed');
      const mockCallback = jest.fn().mockRejectedValue(mockError);

      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [] });

      jest.spyOn(dbManager as any, 'getTenantPool').mockResolvedValue(mockPool);

      await expect(dbManager.transactionTenant('tenant-123', mockCallback))
        .rejects.toThrow('Transaction failed');

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.query).not.toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle client connection errors', async () => {
      jest.spyOn(dbManager as any, 'getTenantPool').mockResolvedValue(mockPool);
      mockPool.connect.mockRejectedValue(new Error('Connection failed'));

      const mockCallback = jest.fn();

      await expect(dbManager.transactionTenant('tenant-123', mockCallback))
        .rejects.toThrow('Connection failed');
    });
  });

  describe('closeTenantPool', () => {
    it('should close and remove tenant pool from cache', async () => {
      const tenantId = 'tenant-123';
      
      // First, create a cached pool
      const mockTenantData = {
        id: tenantId,
        database_name: 'tenant_test_db',
        database_host: 'localhost',
        database_port: 5433,
      };

      const platformQuery = jest.spyOn(dbManager as any, 'queryPlatform');
      platformQuery.mockResolvedValueOnce({ rows: [mockTenantData] });

      await (dbManager as any).getTenantPool(tenantId);

      // Now close the pool
      await (dbManager as any).closeTenantPool(tenantId);

      expect(mockPool.end).toHaveBeenCalled();

      // Verify pool is removed from cache by checking if new query creates new pool
      platformQuery.mockResolvedValueOnce({ rows: [mockTenantData] });
      await (dbManager as any).getTenantPool(tenantId);

      expect(platformQuery).toHaveBeenCalledTimes(2); // Should query again since pool was removed
    });

    it('should handle closing non-existent pool gracefully', async () => {
      await expect((dbManager as any).closeTenantPool('non-existent-tenant'))
        .resolves.toBeUndefined();
    });
  });

  describe('closeAllTenantPools', () => {
    it('should close all cached tenant pools', async () => {
      const tenant1Data = {
        id: 'tenant-1',
        database_name: 'tenant_1_db',
        database_host: 'localhost',
        database_port: 5433,
      };

      const tenant2Data = {
        id: 'tenant-2',
        database_name: 'tenant_2_db',
        database_host: 'localhost',
        database_port: 5433,
      };

      const platformQuery = jest.spyOn(dbManager as any, 'queryPlatform');
      platformQuery
        .mockResolvedValueOnce({ rows: [tenant1Data] })
        .mockResolvedValueOnce({ rows: [tenant2Data] });

      // Create cached pools
      await (dbManager as any).getTenantPool('tenant-1');
      await (dbManager as any).getTenantPool('tenant-2');

      // Close all pools
      await (dbManager as any).closeAllTenantPools();

      expect(mockPool.end).toHaveBeenCalledTimes(2);
    });
  });

  describe('getTenantPoolStats', () => {
    it('should return pool statistics for a tenant', async () => {
      const tenantId = 'tenant-123';
      
      const mockTenantData = {
        id: tenantId,
        database_name: 'tenant_test_db',
        database_host: 'localhost',
        database_port: 5433,
      };

      const platformQuery = jest.spyOn(dbManager as any, 'queryPlatform');
      platformQuery.mockResolvedValueOnce({ rows: [mockTenantData] });

      await (dbManager as any).getTenantPool(tenantId);

      const stats = await (dbManager as any).getTenantPoolStats(tenantId);

      expect(stats).toEqual({
        totalCount: 5,
        idleCount: 3,
        waitingCount: 0,
      });
    });

    it('should return null for non-existent pool', async () => {
      const stats = await (dbManager as any).getTenantPoolStats('non-existent-tenant');
      expect(stats).toBeNull();
    });
  });

  describe('queryPlatform', () => {
    it('should execute query on platform database', async () => {
      const mockResult = { rows: [{ id: 1, name: 'platform-test' }] };
      
      const platformPool = {
        query: jest.fn().mockResolvedValue(mockResult)
      };

      // Mock the platform pool
      jest.spyOn(dbManager as any, 'platformPool', 'get').mockReturnValue(platformPool);

      const result = await (dbManager as any).queryPlatform(
        'SELECT * FROM platform.tenants WHERE id = $1',
        ['tenant-123']
      );

      expect(result).toEqual(mockResult);
      expect(platformPool.query).toHaveBeenCalledWith(
        'SELECT * FROM platform.tenants WHERE id = $1',
        ['tenant-123']
      );
    });

    it('should handle platform query errors', async () => {
      const mockError = new Error('Platform query failed');
      
      const platformPool = {
        query: jest.fn().mockRejectedValue(mockError)
      };

      jest.spyOn(dbManager as any, 'platformPool', 'get').mockReturnValue(platformPool);

      await expect((dbManager as any).queryPlatform('INVALID SQL'))
        .rejects.toThrow('Platform query failed');
    });
  });
});