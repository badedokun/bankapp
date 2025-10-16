/**
 * Tenant Security Configuration Hook
 * Provides access to tenant-specific security settings like PIN length
 */

import { useTenant } from '../tenants/TenantContext';
import { TenantSecurityConfig } from '../types/tenant';

// Default security configuration
const DEFAULT_SECURITY_CONFIG: TenantSecurityConfig = {
  pinLength: 4,
  minPasswordLength: 8,
  requireBiometric: false,
  sessionTimeout: 15,
  maxLoginAttempts: 3,
};

export interface UseTenantSecurityReturn {
  pinLength: 4 | 6;
  minPasswordLength: number;
  requireBiometric: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  securityConfig: TenantSecurityConfig;
}

/**
 * Hook to access tenant security configuration
 * @returns Security configuration with PIN length and other security settings
 */
export function useTenantSecurity(): UseTenantSecurityReturn {
  const tenant = useTenant();

  const securityConfig = tenant?.security || DEFAULT_SECURITY_CONFIG;

  return {
    pinLength: securityConfig.pinLength,
    minPasswordLength: securityConfig.minPasswordLength || DEFAULT_SECURITY_CONFIG.minPasswordLength!,
    requireBiometric: securityConfig.requireBiometric !== undefined
      ? securityConfig.requireBiometric
      : DEFAULT_SECURITY_CONFIG.requireBiometric!,
    sessionTimeout: securityConfig.sessionTimeout || DEFAULT_SECURITY_CONFIG.sessionTimeout!,
    maxLoginAttempts: securityConfig.maxLoginAttempts || DEFAULT_SECURITY_CONFIG.maxLoginAttempts!,
    securityConfig,
  };
}

export default useTenantSecurity;
