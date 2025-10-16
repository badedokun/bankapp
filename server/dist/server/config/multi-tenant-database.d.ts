/**
 * Multi-Tenant Database Connection Manager
 * Manages isolated database connections for each tenant
 * Ensures regulatory compliance with complete data isolation
 */
import { Pool } from 'pg';
declare class MultiTenantDatabaseManager {
    private platformPool;
    private tenantPools;
    private tenantConnectionCache;
    private cacheExpiryMs;
    constructor();
    /**
     * Get platform database connection
     */
    getPlatformPool(): Pool;
    /**
     * Get tenant-specific database connection info
     */
    getTenantConnectionInfo(tenantId: string): Promise<any>;
    /**
     * Get or create a connection pool for a specific tenant
     */
    getTenantPool(tenantId: string): Promise<Pool>;
    /**
     * Execute a query on a tenant's database
     */
    queryTenant(tenantId: string, text: string, params?: any[]): Promise<import("pg").QueryResult<any>>;
    /**
     * Execute a query on the platform database
     */
    queryPlatform(text: string, params?: any[]): Promise<import("pg").QueryResult<any>>;
    /**
     * Get a client for transaction handling
     */
    getTenantClient(tenantId: string): Promise<import("pg").PoolClient>;
    /**
     * Get platform client for transaction handling
     */
    getPlatformClient(): Promise<import("pg").PoolClient>;
    /**
     * Close a specific tenant's connection pool
     */
    closeTenantPool(tenantId: string): Promise<void>;
    /**
     * Close all connection pools
     */
    closeAll(): Promise<void>;
    /**
     * Get pool statistics
     */
    getPoolStats(): {
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
    };
    /**
     * Clean up idle tenant pools
     */
    cleanupIdlePools(): Promise<void>;
}
declare const dbManager: MultiTenantDatabaseManager;
export default dbManager;
//# sourceMappingURL=multi-tenant-database.d.ts.map