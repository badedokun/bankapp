/**
 * Deployment Configuration
 * Handles environment-specific settings while maintaining multi-tenancy
 */

export interface DeploymentConfig {
  defaultTenant: string;
  allowTenantSwitching: boolean;
  customDomain: string | null;
  whitelistedTenants: string[];
  environment: 'development' | 'staging' | 'production';
}

// Different deployment configurations
// Use environment variables for tenant-specific deployments
const deploymentConfigs: Record<string, DeploymentConfig> = {
  // Single-tenant production deployment
  single_tenant_production: {
    defaultTenant: process.env.DEFAULT_TENANT || 'default',
    allowTenantSwitching: false,
    customDomain: process.env.CUSTOM_DOMAIN || null,
    whitelistedTenants: process.env.WHITELISTED_TENANTS?.split(',') || [process.env.DEFAULT_TENANT || 'default'],
    environment: 'production'
  },

  // Multi-tenant SaaS Production
  saas_production: {
    defaultTenant: process.env.DEFAULT_TENANT || 'default',
    allowTenantSwitching: true,
    customDomain: process.env.CUSTOM_DOMAIN || null,
    whitelistedTenants: process.env.WHITELISTED_TENANTS?.split(',') || [],
    environment: 'production'
  },

  // Development Environment
  development: {
    defaultTenant: process.env.DEFAULT_TENANT || 'default',
    allowTenantSwitching: true,
    customDomain: null,
    whitelistedTenants: process.env.WHITELISTED_TENANTS?.split(',') || [],
    environment: 'development'
  }
};

class DeploymentManager {
  private static instance: DeploymentManager;
  private config: DeploymentConfig;

  private constructor() {
    this.config = this.detectDeploymentConfig();
  }

  static getInstance(): DeploymentManager {
    if (!DeploymentManager.instance) {
      DeploymentManager.instance = new DeploymentManager();
    }
    return DeploymentManager.instance;
  }

  /**
   * Detect deployment configuration based on environment and domain
   */
  private detectDeploymentConfig(): DeploymentConfig {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const deploymentType = process.env.DEPLOYMENT_TYPE || 'development';

    // Check domain-based detection if CUSTOM_DOMAIN is configured
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      const hostname = window.location.hostname;
      const customDomain = process.env.CUSTOM_DOMAIN;

      // If custom domain matches, use single tenant production config
      if (customDomain && hostname.includes(customDomain)) {
        return deploymentConfigs.single_tenant_production;
      }

      // If hostname indicates production (not localhost/dev), use SaaS production
      if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1') && !hostname.includes('dev')) {
        return deploymentConfigs.saas_production;
      }
    }

    // Use environment variable or default
    return deploymentConfigs[deploymentType] || deploymentConfigs.development;
  }

  /**
   * Get current deployment configuration
   */
  getConfig(): DeploymentConfig {
    return this.config;
  }

  /**
   * Check if tenant switching is allowed
   */
  isTenantSwitchingAllowed(): boolean {
    return this.config.allowTenantSwitching;
  }

  /**
   * Get default tenant for this deployment
   */
  getDefaultTenant(): string {
    return this.config.defaultTenant;
  }

  /**
   * Check if tenant is allowed in this deployment
   */
  isTenantAllowed(tenantId: string): boolean {
    return this.config.whitelistedTenants.includes(tenantId);
  }

  /**
   * Get deployment-specific branding
   * Falls back to generic branding for multi-tenant deployments
   */
  getDeploymentBranding() {
    // Use environment variables for deployment-specific branding
    const loginPageTitle = process.env.APP_LOGIN_TITLE || 'Banking Platform';
    const appTitle = process.env.APP_TITLE || 'Multi-Tenant Banking';

    return {
      showTenantSwitching: this.config.allowTenantSwitching,
      showMultiTenantFeatures: this.config.allowTenantSwitching,
      loginPageTitle,
      appTitle
    };
  }
}

export default DeploymentManager.getInstance();