/**
 * Multi-Tenant Database Connection Manager
 * Manages isolated database connections for each tenant
 * Ensures regulatory compliance with complete data isolation
 */

import { Pool } from 'pg';

class MultiTenantDatabaseManager {
  private platformPool: Pool;
  private tenantPools: Map<string, Pool>;
  private tenantConnectionCache: Map<string, any>;
  private cacheExpiryMs: number;

  constructor() {
    // Platform database pool (for tenant registry and shared data)
    this.platformPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'bisiadedokun',
      password: process.env.DB_PASSWORD || '',
      database: 'bank_app_platform',
      max: 20, // Maximum connections in pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Cache of tenant-specific connection pools
    this.tenantPools = new Map();
    
    // Cache of tenant connection info
    this.tenantConnectionCache = new Map();
    
    // Cache expiry time (5 minutes)
    this.cacheExpiryMs = 5 * 60 * 1000;
  }

  /**
   * Get platform database connection
   */
  getPlatformPool() {
    return this.platformPool;
  }

  /**
   * Get tenant-specific database connection info
   */
  async getTenantConnectionInfo(tenantId: string) {
    // Check cache first
    const cached = this.tenantConnectionCache.get(tenantId);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    try {
      // Query platform database for tenant connection info
      const result = await this.platformPool.query(`
        SELECT 
          id,
          name,
          database_name,
          database_host,
          database_port,
          database_status,
          connection_string
        FROM platform.tenants
        WHERE id = $1 AND status = 'active'
      `, [tenantId]);

      if (result.rows.length === 0) {
        throw new Error(`Tenant not found or inactive: ${tenantId}`);
      }

      const tenantInfo = result.rows[0];

      if (!tenantInfo.database_name) {
        throw new Error(`Tenant database not provisioned: ${tenantId}`);
      }

      if (tenantInfo.database_status !== 'active' && tenantInfo.database_status !== 'pending') {
        throw new Error(`Tenant database not available: ${tenantInfo.database_status}`);
      }

      // Cache the connection info
      this.tenantConnectionCache.set(tenantId, {
        data: tenantInfo,
        expires: Date.now() + this.cacheExpiryMs
      });

      return tenantInfo;
    } catch (error) {
      console.error(`Error getting tenant connection info for ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Get or create a connection pool for a specific tenant
   */
  async getTenantPool(tenantId: string): Promise<Pool> {
    // Check if pool already exists
    const existingPool = this.tenantPools.get(tenantId);
    if (existingPool) {
      return existingPool;
    }

    try {
      // Get tenant connection info
      const tenantInfo = await this.getTenantConnectionInfo(tenantId);

      // Create new pool for tenant
      const tenantPool = new Pool({
        host: tenantInfo.database_host || 'localhost',
        port: parseInt(tenantInfo.database_port || '5433'),
        user: process.env.DB_USER || 'bisiadedokun',
        password: process.env.DB_PASSWORD || '',
        database: tenantInfo.database_name,
        max: 10, // Smaller pool per tenant
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test the connection
      try {
        await tenantPool.query('SELECT 1');
      } catch (error) {
        console.error(`Failed to connect to tenant database ${tenantInfo.database_name}:`, error);
        throw new Error(`Tenant database connection failed: ${tenantInfo.name}`);
      }

      // Store in cache
      this.tenantPools.set(tenantId, tenantPool);

      console.log(`Created database pool for tenant: ${tenantInfo.name} (${tenantInfo.database_name})`);
      
      return tenantPool;
    } catch (error) {
      console.error(`Error creating tenant pool for ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Execute a query on a tenant's database
   */
  async queryTenant(tenantId: string, text: string, params: any[] = []) {
    const pool = await this.getTenantPool(tenantId);
    return pool.query(text, params);
  }

  /**
   * Execute a query on the platform database
   */
  async queryPlatform(text: string, params: any[] = []) {
    return this.platformPool.query(text, params);
  }

  /**
   * Get a client for transaction handling
   */
  async getTenantClient(tenantId: string) {
    const pool = await this.getTenantPool(tenantId);
    return pool.connect();
  }

  /**
   * Get platform client for transaction handling
   */
  async getPlatformClient() {
    return this.platformPool.connect();
  }

  /**
   * Close a specific tenant's connection pool
   */
  async closeTenantPool(tenantId: string) {
    const pool = this.tenantPools.get(tenantId);
    if (pool) {
      await pool.end();
      this.tenantPools.delete(tenantId);
      this.tenantConnectionCache.delete(tenantId);
      console.log(`Closed database pool for tenant: ${tenantId}`);
    }
  }

  /**
   * Close all connection pools
   */
  async closeAll() {
    // Close all tenant pools
    for (const [tenantId, pool] of this.tenantPools) {
      await pool.end();
      console.log(`Closed tenant pool: ${tenantId}`);
    }
    this.tenantPools.clear();
    this.tenantConnectionCache.clear();

    // Close platform pool
    await this.platformPool.end();
    console.log('Closed platform database pool');
  }

  /**
   * Get pool statistics
   */
  getPoolStats() {
    const stats: {
      platform: {
        totalCount: number;
        idleCount: number;
        waitingCount: number;
      };
      tenants: Record<string, {
        totalCount: number;
        idleCount: number;
        waitingCount: number;
      }>;
    } = {
      platform: {
        totalCount: this.platformPool.totalCount,
        idleCount: this.platformPool.idleCount,
        waitingCount: this.platformPool.waitingCount
      },
      tenants: {}
    };

    for (const [tenantId, pool] of this.tenantPools) {
      stats.tenants[tenantId] = {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      };
    }

    return stats;
  }

  /**
   * Clean up idle tenant pools
   */
  async cleanupIdlePools() {
    // Cleanup idle pools based on activity
    for (const [tenantId, pool] of this.tenantPools) {
      // Check if pool has been idle
      if (pool.idleCount === pool.totalCount) {
        // Close idle pools
        await this.closeTenantPool(tenantId);
      }
    }
  }
}

// Create singleton instance
const dbManager = new MultiTenantDatabaseManager();

// Clean up idle pools periodically
setInterval(() => {
  dbManager.cleanupIdlePools().catch(console.error);
}, 60000); // Every minute

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database connections...');
  await dbManager.closeAll();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing database connections...');
  await dbManager.closeAll();
  process.exit(0);
});

export default dbManager;