/**
 * Tenant Detection Service
 * Detects and manages tenant context based on various strategies
 */

import { Platform } from 'react-native';
import { Storage } from '../utils/storage';
import { TenantConfig, TenantID } from '../types/tenant';
import JWTManager from '../utils/jwt';
import DeploymentManager from '../config/deployment';

/**
 * React Native Compatibility Check
 * Determines if running in React Native environment
 */
const isReactNative = (): boolean => {
  return typeof window === 'undefined' && typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
};

export enum TenantDetectionMethod {
  JWT_TOKEN = 'jwt_token',
  SUBDOMAIN = 'subdomain',
  QUERY_PARAM = 'query',
  HEADER = 'header',
  PATH = 'path',
  STORAGE = 'storage',
  DEFAULT = 'default',
}

class TenantDetector {
  private static instance: TenantDetector;
  private currentTenantId: TenantID | null = null;
  private detectionMethod: TenantDetectionMethod = TenantDetectionMethod.JWT_TOKEN;

  private constructor() {}

  static getInstance(): TenantDetector {
    if (!TenantDetector.instance) {
      TenantDetector.instance = new TenantDetector();
    }
    return TenantDetector.instance;
  }

  /**
   * Detect tenant based on platform and configuration
   */
  async detectTenant(): Promise<TenantID> {
    try {
      // Try multiple detection methods in order of priority
      let tenantId: string | null = null;

      console.log('🔍 Starting tenant detection...');

      // 1. First priority: Deployment configuration override in development
      if (process.env.NODE_ENV === 'development') {
        const deploymentConfig = DeploymentManager.getConfig();
        console.log('🚀 Development mode - checking deployment config:', deploymentConfig);
        if (deploymentConfig.defaultTenant && this.isValidTenantId(deploymentConfig.defaultTenant)) {
          tenantId = deploymentConfig.defaultTenant;
          console.log(`✅ Using deployment default tenant: ${tenantId}`);
          // Force save this tenant to override any cached data
          this.currentTenantId = tenantId as TenantID;
          await this.saveTenantToStorage(this.currentTenantId);
          console.log(`🎯 Forced tenant to: ${this.currentTenantId}`);
          return this.currentTenantId;
        }
      }

      // 2. Second priority: JWT token (most secure)
      if (!tenantId) {
        tenantId = await this.detectFromJWT();
        if (tenantId) console.log(`🔐 Detected tenant from JWT: ${tenantId}`);
      }

      // 3. Third priority: Web environment detection
      if (!tenantId && Platform.OS === 'web') {
        tenantId = this.detectFromWeb();
        if (tenantId) console.log(`🌐 Detected tenant from web: ${tenantId}`);
      }

      // 4. Fourth priority: Stored tenant (for offline scenarios)
      if (!tenantId) {
        tenantId = await this.detectFromStorage();
        if (tenantId) console.log(`💾 Detected tenant from storage: ${tenantId}`);
      }

      // 5. Fifth priority: Configuration/environment
      if (!tenantId) {
        tenantId = await this.detectFromConfig();
        if (tenantId) console.log(`⚙️ Detected tenant from config: ${tenantId}`);
      }

      // 6. Last resort: Deployment-specific default (maintains multi-tenancy)
      if (!tenantId) {
        const deploymentConfig = DeploymentManager.getConfig();
        if (deploymentConfig.defaultTenant && this.isValidTenantId(deploymentConfig.defaultTenant)) {
          tenantId = deploymentConfig.defaultTenant;
          console.log(`🏗️ Using deployment fallback tenant: ${tenantId}`);
        }
      }

      // If no tenant detected, throw error instead of defaulting
      if (!tenantId) {
        console.error('❌ No valid tenant could be detected');
        throw new Error('No valid tenant could be detected. Please authenticate or provide tenant information.');
      }

      // Validate tenant is allowed in this deployment
      if (!DeploymentManager.isTenantAllowed(tenantId)) {
        console.error(`❌ Tenant '${tenantId}' is not allowed in this deployment`);
        throw new Error(`Tenant '${tenantId}' is not allowed in this deployment.`);
      }

      this.currentTenantId = tenantId as TenantID;
      await this.saveTenantToStorage(this.currentTenantId);

      console.log(`🎯 Final selected tenant: ${this.currentTenantId}`);
      return this.currentTenantId;
    } catch (error) {
      console.error('Error detecting tenant:', error);
      // Only fallback to deployment default in development mode
      if (process.env.NODE_ENV === 'development') {
        const deploymentConfig = DeploymentManager.getConfig();
        console.warn(`Development mode: Falling back to deployment default tenant: ${deploymentConfig.defaultTenant}`);
        this.currentTenantId = deploymentConfig.defaultTenant as TenantID;
        await this.saveTenantToStorage(this.currentTenantId);
        return this.currentTenantId;
      }
      throw error;
    }
  }

  /**
   * Detect tenant from JWT token (highest priority)
   */
  private async detectFromJWT(): Promise<TenantID | null> {
    try {
      // First, try to get tenant from stored JWT token
      const tenantFromToken = await JWTManager.getTenantFromStoredToken();
      if (tenantFromToken && this.isValidTenantId(tenantFromToken)) {
        return tenantFromToken as TenantID;
      }

      // Second, try to get from auth header (web only)
      if (Platform.OS === 'web') {
        const tenantFromHeader = JWTManager.extractTenantFromAuthHeader();
        if (tenantFromHeader && this.isValidTenantId(tenantFromHeader)) {
          return tenantFromHeader as TenantID;
        }
      }

      return null;
    } catch (error) {
      console.error('Error detecting tenant from JWT:', error);
      return null;
    }
  }

  /**
   * Detect tenant from web environment (subdomain, query params, etc.)
   */
  private detectFromWeb(): TenantID | null {
    // Skip web detection in React Native environment
    if (isReactNative() || typeof window === 'undefined') return null;

    try {
      // Check query parameter
      const urlParams = new URLSearchParams(window.location.search);
      const tenantParam = urlParams.get('tenant');
      if (tenantParam && this.isValidTenantId(tenantParam)) {
        return tenantParam as TenantID;
      }

      // Check subdomain
      const hostname = window.location.hostname;
      const subdomain = hostname.split('.')[0];
      
      if (subdomain && subdomain !== 'localhost' && subdomain !== 'www') {
        if (this.isValidTenantId(subdomain)) {
          return subdomain as TenantID;
        }
      }

      // Special case for FMFB production deployment
      if (hostname.includes('firstmidas') || hostname.includes('fmfb') || hostname === 'fmfb.orokii.com') {
        return 'fmfb';
      }

      // Check path
      const pathSegments = window.location.pathname.split('/');
      if (pathSegments[1] && this.isValidTenantId(pathSegments[1])) {
        return pathSegments[1] as TenantID;
      }

      // Check global variable (set by index.html)
      if ((window as any).__TENANT__ && this.isValidTenantId((window as any).__TENANT__)) {
        return (window as any).__TENANT__ as TenantID;
      }
    } catch (error) {
      console.error('Error detecting tenant from web:', error);
    }

    return null;
  }

  /**
   * Detect tenant from Storage
   */
  private async detectFromStorage(): Promise<TenantID | null> {
    try {
      const storedTenant = await Storage.getItem('currentTenant');
      if (storedTenant && this.isValidTenantId(storedTenant)) {
        return storedTenant as TenantID;
      }
    } catch (error) {
      console.error('Error reading tenant from storage:', error);
    }
    return null;
  }

  /**
   * Detect tenant from app configuration
   */
  private async detectFromConfig(): Promise<TenantID | null> {
    try {
      // In production, this might read from a config file or environment variable
      // For now, return null to fall back to default
      return null;
    } catch (error) {
      console.error('Error detecting tenant from config:', error);
      return null;
    }
  }

  /**
   * Save tenant to Storage for persistence
   */
  private async saveTenantToStorage(tenantId: TenantID): Promise<void> {
    try {
      await Storage.setItem('currentTenant', tenantId);
    } catch (error) {
      console.error('Error saving tenant to storage:', error);
    }
  }

  /**
   * Validate if a tenant ID is valid
   */
  private isValidTenantId(tenantId: string): boolean {
    const validTenants: TenantID[] = ['fmfb', 'bank-a', 'bank-b', 'bank-c', 'default'];
    return validTenants.includes(tenantId as TenantID);
  }

  /**
   * Get current tenant ID
   */
  getCurrentTenantId(): TenantID | null {
    return this.currentTenantId;
  }

  /**
   * Manually set tenant (for testing or user switching)
   */
  async setTenant(tenantId: TenantID): Promise<void> {
    if (this.isValidTenantId(tenantId)) {
      this.currentTenantId = tenantId;
      await this.saveTenantToStorage(tenantId);
    } else {
      throw new Error(`Invalid tenant ID: ${tenantId}`);
    }
  }

  /**
   * Clear tenant selection
   */
  async clearTenant(): Promise<void> {
    try {
      await Storage.removeItem('currentTenant');
      await JWTManager.clearTokens();
      this.currentTenantId = null;
    } catch (error) {
      console.error('Error clearing tenant:', error);
    }
  }
}

export default TenantDetector.getInstance();