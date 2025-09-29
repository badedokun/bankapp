"use strict";
/**
 * PostgreSQL Database Configuration
 * Multi-tenant database connection with connection pooling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.query = query;
exports.transaction = transaction;
exports.getPoolStats = getPoolStats;
exports.closePool = closePool;
exports.testConnection = testConnection;
const pg_1 = require("pg");
// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    user: process.env.DB_USER || 'bisiadedokun',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bank_app_platform',
    // Connection pool settings
    max: 20, // Maximum number of clients in the pool
    min: 2, // Minimum number of clients in the pool
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
const pool = new pg_1.Pool(dbConfig);
exports.pool = pool;
// Pool event handlers
pool.on('connect', (client) => {
    console.log(`🔗 New database connection established (PID: ${client.processID})`);
});
pool.on('error', (err, client) => {
    console.error('❌ Unexpected error on idle database client:', err);
});
pool.on('acquire', (client) => {
    console.log(`📦 Database client acquired (PID: ${client.processID})`);
});
pool.on('remove', (client) => {
    console.log(`🗑️ Database client removed (PID: ${client.processID})`);
});
/**
 * Execute a query with automatic error handling
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @param {string} tenantId - Optional tenant ID for row-level security
 * @returns {Promise<Object>} Query result
 */
async function query(text, params = [], tenantId = null) {
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
    }
    catch (error) {
        console.error('❌ Database query error:', {
            query: text.substring(0, 100),
            params: params.length,
            error: error.message
        });
        throw error;
    }
    finally {
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
async function transaction(callback, tenantId = null) {
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
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Transaction failed:', error.message);
        throw error;
    }
    finally {
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
    }
    catch (error) {
        console.error('❌ Error closing database pool:', error.message);
        throw error;
    }
}
/**
 * Test database connectivity
 * @returns {Promise<boolean>} Connection status
 */
async function testConnection() {
    var _a, _b, _c;
    try {
        const result = await query('SELECT NOW() as current_time, version() as pg_version');
        console.log('✅ Database connection test successful:', {
            time: (_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.current_time,
            version: (_c = (_b = result.rows[0]) === null || _b === void 0 ? void 0 : _b.pg_version) === null || _c === void 0 ? void 0 : _c.split(' ')[0]
        });
        return true;
    }
    catch (error) {
        console.error('❌ Database connection test failed:', error.message);
        return false;
    }
}
// Test connection on startup
testConnection();
exports.default = {
    query,
    transaction,
    pool,
    getPoolStats,
    closePool,
    testConnection
};
