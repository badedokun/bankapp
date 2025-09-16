/**
 * Tenant Database Provisioning Script
 * Creates separate database for each tenant with proper isolation
 * Ensures regulatory compliance for banking operations
 */
/**
 * Create a new database for a tenant
 */
declare function createTenantDatabase(tenantName: string, tenantId: string): Promise<string>;
/**
 * Apply the tenant template schema to a tenant database
 */
declare function applyTenantSchema(dbName: string, tenantId: string, tenantName: string): Promise<void>;
/**
 * Update platform database with tenant database connection info
 */
declare function updateTenantRegistry(tenantName: string, tenantId: string, dbName: string): Promise<void>;
/**
 * Seed initial data for a tenant
 */
declare function seedTenantData(dbName: string, tenantId: string, tenantName: string): Promise<void>;
/**
 * Main provisioning function
 */
declare function provisionTenant(tenantName: string): Promise<{
    tenantId: any;
    tenantName: any;
    databaseName: string;
}>;
declare const _default: {
    provisionTenant: typeof provisionTenant;
    createTenantDatabase: typeof createTenantDatabase;
    applyTenantSchema: typeof applyTenantSchema;
    updateTenantRegistry: typeof updateTenantRegistry;
    seedTenantData: typeof seedTenantData;
};
export default _default;
//# sourceMappingURL=provision-tenant-database.d.ts.map