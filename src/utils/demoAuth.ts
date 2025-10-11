/**
 * Demo Authentication Utilities
 * For development and testing purposes only
 * Now integrated with real API service
 */

import { Storage } from './storage';
import JWTManager from './jwt';
import APIService from '../services/api';

interface DemoAuthOptions {
  tenantId: string;
  userId: string;
  roles?: string[];
  permissions?: string[];
  expiresInMinutes?: number;
}

class DemoAuthManager {
  private static instance: DemoAuthManager;

  private constructor() {}

  static getInstance(): DemoAuthManager {
    if (!DemoAuthManager.instance) {
      DemoAuthManager.instance = new DemoAuthManager();
    }
    return DemoAuthManager.instance;
  }

  /**
   * Create a demo JWT token for testing
   * Note: This is for demo purposes only - in production, tokens come from secure auth server
   */
  createDemoToken(options: DemoAuthOptions): string {
    const {
      tenantId,
      userId,
      roles = ['user'],
      permissions = ['read'],
      expiresInMinutes = 60
    } = options;

    const now = Math.floor(Date.now() / 1000);
    const exp = now + (expiresInMinutes * 60);

    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const payload = {
      sub: userId,
      tenant: tenantId,
      tenantId: tenantId,
      iss: 'orokiipay-demo',
      iat: now,
      exp: exp,
      roles: roles,
      permissions: permissions
    };

    const headerEncoded = this.base64UrlEncode(JSON.stringify(header));
    const payloadEncoded = this.base64UrlEncode(JSON.stringify(payload));
    
    // Demo signature (not secure - just for testing)
    const signature = this.base64UrlEncode('demo-signature');

    return `${headerEncoded}.${payloadEncoded}.${signature}`;
  }

  /**
   * Set demo authentication for a tenant
   */
  async setDemoAuth(tenantId: string, userId: string = 'demo-user'): Promise<string> {
    const token = this.createDemoToken({
      tenantId,
      userId,
      roles: ['user', 'customer'],
      permissions: ['transfer', 'read', 'voice_assistant']
    });

    await Storage.setItem('access_token', token);
    await Storage.setItem('demo_mode', 'true');

    return token;
  }

  /**
   * Simulate authentication flow using real API
   */
  async simulateLogin(tenantId: string, username: string, password: string): Promise<{
    success: boolean;
    token?: string;
    user?: any;
    error?: string;
  }> {
    try {
      // Use real API service for authentication
      const loginResponse = await APIService.login({
        email: username,
        password: password,
        tenantId: tenantId,
        deviceInfo: {
          demo: true,
          platform: 'web',
          timestamp: new Date().toISOString()
        }
      });

      return {
        success: true,
        token: loginResponse.tokens.access,
        user: {
          id: loginResponse.user.id,
          name: `${loginResponse.user.firstName} ${loginResponse.user.lastName}`,
          tenant: loginResponse.user.tenant.name,
          email: loginResponse.user.email,
          role: loginResponse.user.role,
          balance: loginResponse.user.wallet?.availableBalance
        }
      };
    } catch (error: any) {
      console.error('API login failed, falling back to demo mode:', error);
      
      // API is not available - this is a development/demo scenario only
      // For production, authentication should ALWAYS go through the API
      console.warn('API authentication failed - this should not happen in production');
      
      return {
        success: false,
        error: 'Authentication service unavailable. Please contact support.'
      };
    }
  }

  /**
   * Check if we're in demo mode
   */
  async isDemoMode(): Promise<boolean> {
    try {
      const demoMode = await Storage.getItem('demo_mode');
      return demoMode === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Clear demo authentication
   */
  async clearDemoAuth(): Promise<void> {
    await Storage.removeItem('access_token');
    await Storage.removeItem('demo_mode');
  }

  /**
   * Get available demo tenants
   * Note: Credentials are stored in the database for security
   */
  getDemoTenants() {
    return [
      {
        id: 'fmfb',
        name: 'Firstmidas Microfinance Bank',
        description: 'Use your database-stored credentials to login'
      },
      {
        id: 'default',
        name: 'Default Tenant',
        description: 'Use your database-stored credentials to login'
      }
    ];
  }

  /**
   * Base64 URL encode
   */
  private base64UrlEncode(str: string): string {
    const base64 = btoa(str);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
}

export default DemoAuthManager.getInstance();