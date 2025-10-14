/**
 * PostgreSQL Database Configuration
 * Multi-tenant database connection with connection pooling
 */

import { Pool } from 'pg';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  user: process.env.DB_USER || 'bisiadedokun',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bank_app_platform',
  
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  min: 2,  // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
  maxUses: 7500, // Close a connection after it's been used 7500 times
  
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
    ca: process.env.DB_SSL_CA,
    cert: process.env.DB_SSL_CERT,
    key: process.env.DB_SSL_KEY,
  } : false,
};

// Create connection pool
const pool = new Pool(dbConfig);

// Pool event handlers
pool.on('connect', (client: any) => {
  console.log(`🔗 New database connection established (PID: ${client.processID})`);
});

pool.on('error', (err: any, client?: any) => {
  console.error('❌ Unexpected error on idle database client:', err);
});

pool.on('acquire', (client: any) => {
  console.log(`📦 Database client acquired (PID: ${client.processID})`);
});

pool.on('remove', (client: any) => {
  console.log(`🗑️ Database client removed (PID: ${client.processID})`);
});

/**
 * Execute a query with automatic error handling
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @param {string} tenantId - Optional tenant ID for row-level security
 * @returns {Promise<Object>} Query result
 */
async function query(text: string, params: any[] = [], tenantId: string | null = null) {
  const client = await pool.connect();
  
  try {
    // Set tenant context for Row Level Security if provided
    if (tenantId) {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
    }
    
    const start = Date.now();
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries (>1000ms)
    if (duration > 1000) {
      console.warn(`🐌 Slow query detected (${duration}ms):`, text.substring(0, 100));
    }
    
    return result;
  } catch (error) {
    console.error('❌ Database query error:', {
      query: text.substring(0, 100),
      params: params.length,
      error: error.message
    });
    throw error;
  } finally {
    // Reset tenant context
    if (tenantId) {
      await client.query('RESET app.current_tenant_id');
    }
    client.release();
  }
}

/**
 * Execute a transaction with automatic rollback on error
 * @param {Function} callback - Transaction callback function
 * @param {string} tenantId - Optional tenant ID for row-level security
 * @returns {Promise<any>} Transaction result
 */
async function transaction(callback: (client: any) => Promise<any>, tenantId: string | null = null) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Set tenant context for Row Level Security if provided
    if (tenantId) {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
    }
    
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Transaction failed:', error.message);
    throw error;
  } finally {
    // Reset tenant context
    if (tenantId) {
      await client.query('RESET app.current_tenant_id');
    }
    client.release();
  }
}

/**
 * Get database pool statistics
 * @returns {Object} Pool statistics
 */
function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
    maxSize: pool.options.max,
    minSize: pool.options.min,
  };
}

/**
 * Close all database connections
 * @returns {Promise<void>}
 */
async function closePool() {
  try {
    await pool.end();
    console.log('🔌 Database connection pool closed');
  } catch (error) {
    console.error('❌ Error closing database pool:', error.message);
    throw error;
  }
}

/**
 * Test database connectivity
 * @returns {Promise<boolean>} Connection status
 */
async function testConnection() {
  try {
    const result = await query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Database connection test successful:', {
      time: result.rows[0]?.current_time,
      version: result.rows[0]?.pg_version?.split(' ')[0]
    });
    return true;
  } catch (error: any) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
}

// Test connection on startup
testConnection();

/**
 * Get tenant pool (currently returns platform pool with tenant isolation)
 * @param tenantId The tenant ID
 * @returns Pool instance for the tenant
 */
export function getTenantPool(tenantId: string): Pool {
  // Currently using single database with schema-based tenant isolation
  // In the future, this could return tenant-specific pools
  return pool;
}

export { query, transaction, pool, getPoolStats, closePool, testConnection };

export default {
  query,
  transaction,
  pool,
  getPoolStats,
  closePool,
  testConnection
};