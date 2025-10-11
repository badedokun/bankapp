/**
 * Multi-Tenant Middleware
 * Handles tenant detection and context setting
 */
/**
 * Extract tenant information from various sources
 * Priority order: JWT token > custom domain > subdomain > header > query param > default
 * @param {Object} req - Express request object
 * @returns {string|null|Promise<string>} Tenant identifier or 'CUSTOM_DOMAIN' for custom domain lookup
 */
declare function extractTenantId(req: any): any;
/**
 * Resolve tenant name to tenant UUID
 * @param {string} tenantIdentifier - Tenant name, UUID, or CUSTOM_DOMAIN:hostname
 * @returns {Promise<Object|null>} Tenant information
 */
declare function resolveTenant(tenantIdentifier: any): Promise<any>;
/**
 * Multi-tenant middleware
 * Detects tenant context and adds tenant information to request
 */
declare function tenantMiddleware(req: any, res: any, next: any): Promise<any>;
/**
 * Tenant validation middleware
 * Ensures user belongs to the current tenant context
 */
declare function validateTenantAccess(req: any, res: any, next: any): any;
/**
 * Tenant tier authorization middleware
 * @param {Array|string} requiredTiers - Required tenant tiers
 * @returns {Function} Middleware function
 */
declare function requireTenantTier(requiredTiers: any): (req: any, res: any, next: any) => any;
/**
 * Feature flag middleware
 * @param {string} featureName - Feature flag name to check
 * @returns {Function} Middleware function
 */
declare function requireFeature(featureName: any): (req: any, res: any, next: any) => any;
/**
 * Get tenant-specific configuration
 * @param {Object} req - Express request object
 * @param {string} configPath - Configuration path (e.g., 'branding.primaryColor'
 * @param {any} defaultValue - Default value if not found
 * @returns {any} Configuration value
 */
declare function getTenantConfig(req: any, configPath: any, defaultValue?: any): any;
export { extractTenantId, resolveTenant, tenantMiddleware, validateTenantAccess, requireTenantTier, requireFeature, getTenantConfig };
declare const _default: {
    extractTenantId: typeof extractTenantId;
    resolveTenant: typeof resolveTenant;
    tenantMiddleware: typeof tenantMiddleware;
    validateTenantAccess: typeof validateTenantAccess;
    requireTenantTier: typeof requireTenantTier;
    requireFeature: typeof requireFeature;
    getTenantConfig: typeof getTenantConfig;
};
export default _default;
//# sourceMappingURL=tenant.d.ts.map