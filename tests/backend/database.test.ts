import database from '../../server/config/database';

const { query, transaction, getPoolStats, testConnection } = database;

// Mock pg module
jest.mock('pg', () => {
  const mockClient = {
    connect: jest.fn(),
    query: jest.fn(),
    release: jest.fn(),
    processID: 12345,
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

import { Pool } from 'pg';

const MockedPool = Pool as jest.MockedClass<typeof Pool>;

describe('Database Configuration', () => {
  let mockPool: any;
  let mockClient: any;

  beforeEach(() => {
    mockPool = new (MockedPool as any)();
    mockClient = {
      connect: jest.fn(),
      query: jest.fn(),
      release: jest.fn(),
      processID: 12345,
    };
    mockPool.connect.mockResolvedValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('query function', () => {
    it('should execute query successfully', async () => {
      const mockResult = { rows: [{ id: 1, name: 'test' }] };
      mockClient.query.mockResolvedValueOnce(mockResult);

      const result = await query('SELECT * FROM users', ['param1']);

      expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM users', ['param1']);
      expect(result).toEqual(mockResult);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should set tenant context when tenantId provided', async () => {
      const mockResult = { rows: [{ id: 1 }] };
      mockClient.query.mockResolvedValueOnce(mockResult);

      await query('SELECT * FROM users', [], 'tenant-123');

      expect(mockClient.query).toHaveBeenCalledWith(
        'SET app.current_tenant_id = $1',
        ['tenant-123']
      );
      expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM users', []);
      expect(mockClient.query).toHaveBeenCalledWith('RESET app.current_tenant_id');
    });

    it('should handle query errors and release connection', async () => {
      const mockError = new Error('Query failed');
      mockClient.query.mockRejectedValueOnce(mockError);

      await expect(query('INVALID SQL')).rejects.toThrow('Query failed');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should log slow queries', async () => {
      const mockResult = { rows: [] };
      mockClient.query.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve(mockResult), 1100))
      );

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await query('SLOW SELECT');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow query detected'),
        expect.any(String)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('transaction function', () => {
    it('should execute transaction successfully', async () => {
      const mockCallback = jest.fn().mockResolvedValue({ success: true });
      mockClient.query.mockResolvedValue({ rows: [] });

      const result = await transaction(mockCallback);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockCallback).toHaveBeenCalledWith(mockClient);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(result).toEqual({ success: true });
    });

    it('should rollback on callback error', async () => {
      const mockError = new Error('Transaction failed');
      const mockCallback = jest.fn().mockRejectedValue(mockError);
      mockClient.query.mockResolvedValue({ rows: [] });

      await expect(transaction(mockCallback)).rejects.toThrow('Transaction failed');

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.query).not.toHaveBeenCalledWith('COMMIT');
    });

    it('should handle tenant context in transactions', async () => {
      const mockCallback = jest.fn().mockResolvedValue({ result: 'ok' });
      mockClient.query.mockResolvedValue({ rows: [] });

      await transaction(mockCallback, 'tenant-456');

      expect(mockClient.query).toHaveBeenCalledWith(
        'SET app.current_tenant_id = $1',
        ['tenant-456']
      );
      expect(mockClient.query).toHaveBeenCalledWith('RESET app.current_tenant_id');
    });
  });

  describe('getPoolStats function', () => {
    it('should return pool statistics', () => {
      const stats = getPoolStats();

      expect(stats).toEqual({
        totalCount: 5,
        idleCount: 3,
        waitingCount: 0,
        maxSize: 20,
        minSize: 2,
      });
    });
  });

  describe('testConnection function', () => {
    it('should test connection successfully', async () => {
      const mockResult = {
        rows: [{
          current_time: new Date(),
          pg_version: 'PostgreSQL 14.0',
        }]
      };
      
      // Mock the query function for this test
      jest.doMock('../../server/config/database', () => ({
        ...jest.requireActual('../../server/config/database'),
        query: jest.fn().mockResolvedValue(mockResult),
      }));

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await testConnection();

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Database connection test successful'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    it('should handle connection test failure', async () => {
      // Mock the query function to fail
      jest.doMock('../../server/config/database', () => ({
        ...jest.requireActual('../../server/config/database'),
        query: jest.fn().mockRejectedValue(new Error('Connection failed')),
      }));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await testConnection();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Database connection test failed'),
        'Connection failed'
      );

      consoleSpy.mockRestore();
    });
  });
});