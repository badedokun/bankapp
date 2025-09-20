/**
 * PostgreSQL Database Configuration
 * Multi-tenant database connection with connection pooling
 */
import { Pool } from 'pg';
declare const pool: Pool;
/**
 * Execute a query with automatic error handling
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @param {string} tenantId - Optional tenant ID for row-level security
 * @returns {Promise<Object>} Query result
 */
declare function query(text: string, params?: any[], tenantId?: string | null): Promise<import("pg").QueryResult<any>>;
/**
 * Execute a transaction with automatic rollback on error
 * @param {Function} callback - Transaction callback function
 * @param {string} tenantId - Optional tenant ID for row-level security
 * @returns {Promise<any>} Transaction result
 */
declare function transaction(callback: (client: any) => Promise<any>, tenantId?: string | null): Promise<any>;
/**
 * Get database pool statistics
 * @returns {Object} Pool statistics
 */
declare function getPoolStats(): {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
    maxSize: number;
    minSize: number;
};
/**
 * Close all database connections
 * @returns {Promise<void>}
 */
declare function closePool(): Promise<void>;
/**
 * Test database connectivity
 * @returns {Promise<boolean>} Connection status
 */
declare function testConnection(): Promise<boolean>;
export { query, transaction, pool, getPoolStats, closePool, testConnection };
declare const _default: {
    query: typeof query;
    transaction: typeof transaction;
    pool: Pool;
    getPoolStats: typeof getPoolStats;
    closePool: typeof closePool;
    testConnection: typeof testConnection;
};
export default _default;
//# sourceMappingURL=database.d.ts.map