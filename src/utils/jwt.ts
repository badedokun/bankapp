/**
 * JWT Token Utilities
 * Handles JWT token parsing and tenant extraction
 */

import { Storage } from './storage';

export interface JWTPayload {
  sub: string;
  tenant?: string;
  tenantId?: string;
  iss?: string;
  exp?: number;
  iat?: number;
  roles?: string[];
  permissions?: string[];
}

class JWTManager {
  private static instance: JWTManager;

  private constructor() {}

  static getInstance(): JWTManager {
    if (!JWTManager.instance) {
      JWTManager.instance = new JWTManager();
    }
    return JWTManager.instance;
  }

  /**
   * Parse JWT token without verification (client-side)
   * Note: This is for tenant detection only, not security validation
   */
  parseToken(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid JWT token format');
        return null;
      }

      const payload = parts[1];
      const decoded = this.base64UrlDecode(payload);
      return JSON.parse(decoded) as JWTPayload;
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return null;
    }
  }

  /**
   * Extract tenant ID from JWT token
   */
  extractTenantFromToken(token: string): string | null {
    const payload = this.parseToken(token);
    if (!payload) return null;

    // Try different common tenant fields
    return payload.tenant || payload.tenantId || null;
  }

  /**
   * Get current access token from storage
   */
  async getCurrentToken(): Promise<string | null> {
    try {
      const token = await Storage.getItem('access_token') || 
                   await Storage.getItem('jwt_token') ||
                   await Storage.getItem('authToken');
      return token;
    } catch (error) {
      console.error('Error retrieving token from storage:', error);
      return null;
    }
  }

  /**
   * Get tenant from current stored token
   */
  async getTenantFromStoredToken(): Promise<string | null> {
    const token = await this.getCurrentToken();
    if (!token) return null;

    return this.extractTenantFromToken(token);
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    const payload = this.parseToken(token);
    if (!payload || !payload.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  }

  /**
   * Extract tenant from Authorization header
   */
  extractTenantFromAuthHeader(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      // In a real app, this would come from the API response headers
      // or be set by the authentication service
      const authHeader = (window as any).__AUTH_HEADER__;
      if (!authHeader) return null;

      const token = authHeader.replace('Bearer ', '');
      return this.extractTenantFromToken(token);
    } catch (error) {
      console.error('Error extracting tenant from auth header:', error);
      return null;
    }
  }

  /**
   * Base64 URL decode
   */
  private base64UrlDecode(str: string): string {
    // Add padding if needed
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    
    try {
      return atob(str);
    } catch (error) {
      throw new Error('Invalid base64 string');
    }
  }

  /**
   * Clear all authentication tokens
   */
  async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        Storage.removeItem('access_token'),
        Storage.removeItem('jwt_token'),
        Storage.removeItem('authToken'),
        Storage.removeItem('refresh_token')
      ]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }
}

export default JWTManager.getInstance();