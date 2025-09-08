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
const deploymentConfigs: Record<string, DeploymentConfig> = {
  // FMFB Production Deployment
  fmfb_production: {
    defaultTenant: 'fmfb',
    allowTenantSwitching: false,
    customDomain: 'fmfb.orokii.com',
    whitelistedTenants: ['fmfb'],
    environment: 'production'
  },

  // Multi-tenant SaaS Production
  saas_production: {
    defaultTenant: 'default',
    allowTenantSwitching: true,
    customDomain: 'orokii.com',
    whitelistedTenants: ['fmfb', 'bank-a', 'bank-b', 'bank-c', 'default'],
    environment: 'production'
  },

  // Development Environment
  development: {
    defaultTenant: 'fmfb',
    allowTenantSwitching: true,
    customDomain: null,
    whitelistedTenants: ['fmfb', 'bank-a', 'bank-b', 'bank-c', 'default'],
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

    // Check domain-based detection
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      // FMFB subdomain detection
      if (hostname === 'fmfb.orokii.com' || hostname.includes('fmfb.orokii')) {
        return deploymentConfigs.fmfb_production;
      }
      
      // Main domain detection
      if (hostname === 'orokii.com' || hostname.includes('orokii.com')) {
        return deploymentConfigs.saas_production;
      }

      // Legacy/alternative domain detection
      if (hostname.includes('firstmidas') || hostname.includes('fmfb')) {
        return deploymentConfigs.fmfb_production;
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
   */
  getDeploymentBranding() {
    if (this.config.defaultTenant === 'fmfb') {
      return {
        showTenantSwitching: this.config.allowTenantSwitching,
        showMultiTenantFeatures: this.config.allowTenantSwitching,
        loginPageTitle: 'Firstmidas Microfinance Bank',
        appTitle: 'FMFB Banking Platform'
      };
    }

    return {
      showTenantSwitching: true,
      showMultiTenantFeatures: true,
      loginPageTitle: 'Banking Platform',
      appTitle: 'Multi-Tenant Banking'
    };
  }
}

export default DeploymentManager.getInstance();