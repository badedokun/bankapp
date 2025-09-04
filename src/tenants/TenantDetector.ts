/**
 * Tenant Detection Service
 * Detects and manages tenant context based on various strategies
 */

import { Platform } from 'react-native';
import { Storage } from '@/utils/storage';
import { TenantConfig, TenantID } from '@/types/tenant';

export enum TenantDetectionMethod {
  SUBDOMAIN = 'subdomain',
  QUERY_PARAM = 'query',
  HEADER = 'header',
  PATH = 'path',
  STORAGE = 'storage',
  DEFAULT = 'default',
}

class TenantDetector {
  private static instance: TenantDetector;
  private currentTenantId: TenantID = 'default';
  private detectionMethod: TenantDetectionMethod = TenantDetectionMethod.SUBDOMAIN;

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
      let tenantId = await this.detectFromStorage();
      
      if (!tenantId && Platform.OS === 'web') {
        tenantId = this.detectFromWeb();
      }
      
      if (!tenantId) {
        tenantId = await this.detectFromConfig();
      }
      
      if (!tenantId) {
        tenantId = 'default';
      }
      
      this.currentTenantId = tenantId as TenantID;
      await this.saveTenantToStorage(this.currentTenantId);
      
      return this.currentTenantId;
    } catch (error) {
      console.error('Error detecting tenant:', error);
      return 'default';
    }
  }

  /**
   * Detect tenant from web environment (subdomain, query params, etc.)
   */
  private detectFromWeb(): TenantID | null {
    if (typeof window === 'undefined') return null;

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
    const validTenants: TenantID[] = ['bank-a', 'bank-b', 'bank-c', 'default'];
    return validTenants.includes(tenantId as TenantID);
  }

  /**
   * Get current tenant ID
   */
  getCurrentTenantId(): TenantID {
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
      this.currentTenantId = 'default';
    } catch (error) {
      console.error('Error clearing tenant:', error);
    }
  }
}

export default TenantDetector.getInstance();