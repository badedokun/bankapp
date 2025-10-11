/**
 * Tenant Configuration Loader
 * Loads and manages tenant-specific configurations
 */
import { TenantConfig, TenantID } from '../types/tenant';
declare class TenantConfigLoader {
    private static instance;
    private currentConfig;
    private configCache;
    private constructor();
    static getInstance(): TenantConfigLoader;
    /**
     * Load tenant configuration
     */
    loadConfig(tenantId: TenantID): Promise<TenantConfig>;
    /**
     * Get current configuration
     */
    getCurrentConfig(): TenantConfig | null;
    /**
     * Update tenant configuration (for dynamic updates)
     */
    updateConfig(tenantId: TenantID, updates: Partial<TenantConfig>): Promise<TenantConfig>;
    /**
     * Clear configuration cache
     */
    clearCache(): void;
    /**
     * Get all available tenant configurations
     */
    getAllConfigs(): TenantConfig[];
    /**
     * Check if a feature is enabled for current tenant
     */
    isFeatureEnabled(feature: keyof TenantConfig['features']): boolean;
}
declare const _default: TenantConfigLoader;
export default _default;
//# sourceMappingURL=TenantConfigLoader.d.ts.map