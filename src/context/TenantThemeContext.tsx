/**
 * Multi-Tenant Theme Context
 * Dynamically loads tenant theme configuration from JWT, subdomain, or API
 * Follows multi-tenancy principles - no hardcoded tenant data
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Default Platform Theme - No hardcoded tenant data
const DEFAULT_THEME = {
  tenantId: 'platform',
  tenantCode: 'orokiipay',
  brandName: 'OrokiiPay',
  brandTagline: 'AI-Enhanced Banking Platform',
  brandLogo: '',
  colors: {
    primary: '#6366F1',
    primaryGradientStart: '#6366F1',
    primaryGradientEnd: '#4F46E5',
    secondary: '#10B981',
    accent: '#F59E0B',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
    text: '#1F2937',
    textSecondary: '#6B7280',
    textLight: '#9CA3AF',
    background: '#F9FAFB',
    backgroundGradientStart: '#F3F4F6',
    backgroundGradientEnd: '#E5E7EB',
    surface: '#FFFFFF',
    border: '#E5E7EB',
    glassBackground: 'rgba(255, 255, 255, 0.85)',
    glassBorder: 'rgba(255, 255, 255, 0.2)',
  },
  typography: {
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'Roboto',
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      default: 'System',
    }),
  },
  layout: {
    borderRadius: 12,
    borderRadiusLarge: 20,
    spacing: 16,
    containerPadding: 20,
  }
};

export interface TenantTheme {
  tenantId: string;
  tenantCode: string;
  brandName: string;
  brandTagline: string;
  brandLogo: string;
  colors: {
    primary: string;
    primaryGradientStart: string;
    primaryGradientEnd: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
    text: string;
    textSecondary: string;
    textLight: string;
    background: string;
    backgroundGradientStart: string;
    backgroundGradientEnd: string;
    surface: string;
    border: string;
    glassBackground: string;
    glassBorder: string;
  };
  typography: {
    fontFamily: string;
  };
  layout: {
    borderRadius: number;
    borderRadiusLarge: number;
    spacing: number;
    containerPadding: number;
  };
}

interface TenantContextType {
  theme: TenantTheme;
  tenantInfo: {
    id: string;
    code: string;
    name: string;
    subdomain?: string;
  };
  isLoading: boolean;
  error: string | null;
  refreshTheme: () => Promise<void>;
}

const TenantThemeContext = createContext<TenantContextType | undefined>(undefined);

interface TenantThemeProviderProps {
  children: ReactNode;
}

// Utility functions for tenant detection
const getTenantFromJWT = (): string | null => {
  try {
    // Get JWT from AsyncStorage (React Native) or localStorage (Web)
    if (Platform.OS === 'web') {
      const token = localStorage.getItem('authToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.tenantCode || payload.tenant_code || null;
      }
    }
    // For React Native, this will be handled in useEffect with AsyncStorage
    return null;
  } catch (error) {
    console.warn('Failed to extract tenant from JWT:', error);
    return null;
  }
};

const getTenantFromSubdomain = (): string | null => {
  if (Platform.OS === 'web') {
    try {
      const hostname = window.location.hostname;
      // Extract subdomain from hostname (e.g., fmfb.orokiipay.com -> fmfb)
      const parts = hostname.split('.');
      if (parts.length > 2 && parts[0] !== 'www') {
        return parts[0];
      }
    } catch (error) {
      console.warn('Failed to extract tenant from subdomain:', error);
    }
  }
  return null;
};

const getTenantFromEnvironment = (): string | null => {
  // For development/testing purposes
  if (Platform.OS === 'web') {
    return process.env.REACT_APP_TENANT_CODE || null;
  }
  // React Native environment variables would be handled differently
  return null;
};

export const TenantThemeProvider: React.FC<TenantThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<TenantTheme>(DEFAULT_THEME);
  const [tenantInfo, setTenantInfo] = useState({
    id: 'platform',
    code: 'orokiipay',
    name: 'OrokiiPay',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenantTheme = async (tenantCode: string): Promise<TenantTheme | null> => {
    try {
      // API call to fetch tenant theme configuration
      const response = await fetch(`/api/tenants/theme/${tenantCode}`, {
        headers: {
          'Content-Type': 'application/json',
          // Include auth headers if needed
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch tenant theme: ${response.status}`);
      }

      const themeData = await response.json();
      return themeData;
    } catch (error) {
      return null;
    }
  };

  const loadTenantTheme = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try multiple sources to detect tenant
      let tenantCode: string | null = null;

      // 1. Check JWT token (from AsyncStorage for React Native)
      if (Platform.OS !== 'web') {
        try {
          const token = await AsyncStorage.getItem('authToken');
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            tenantCode = payload.tenantCode || payload.tenant_code;
          }
        } catch (error) {
          console.warn('Failed to read JWT from AsyncStorage:', error);
        }
      } else {
        tenantCode = getTenantFromJWT();
      }

      // 2. Check subdomain (Web only)
      if (!tenantCode) {
        tenantCode = getTenantFromSubdomain();
      }

      // 3. Check environment variables (Development)
      if (!tenantCode) {
        tenantCode = getTenantFromEnvironment();
      }

      // 4. If no tenant detected, use platform default
      if (!tenantCode) {
        setTheme(DEFAULT_THEME);
        setTenantInfo({
          id: 'platform',
          code: 'orokiipay',
          name: 'OrokiiPay',
        });
        setIsLoading(false);
        return;
      }

      // Fetch tenant-specific theme from API
      const tenantTheme = await fetchTenantTheme(tenantCode);

      if (tenantTheme) {
        setTheme(tenantTheme);
        setTenantInfo({
          id: tenantTheme.tenantId,
          code: tenantTheme.tenantCode,
          name: tenantTheme.brandName,
          subdomain: getTenantFromSubdomain() || undefined,
        });
      } else {
        // Fallback to default theme if tenant theme not found
        setTheme(DEFAULT_THEME);
        setTenantInfo({
          id: 'platform',
          code: 'orokiipay',
          name: 'OrokiiPay',
        });
        setError(`Theme not found for tenant: ${tenantCode}`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
      // Fallback to default theme on error
      setTheme(DEFAULT_THEME);
      setTenantInfo({
        id: 'platform',
        code: 'orokiipay',
        name: 'OrokiiPay',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTheme = async () => {
    await loadTenantTheme();
  };

  useEffect(() => {
    loadTenantTheme();
  }, []);

  const contextValue: TenantContextType = {
    theme,
    tenantInfo,
    isLoading,
    error,
    refreshTheme,
  };

  return (
    <TenantThemeContext.Provider value={contextValue}>
      {children}
    </TenantThemeContext.Provider>
  );
};

export const useTenantTheme = (): TenantContextType => {
  const context = useContext(TenantThemeContext);
  if (context === undefined) {
    throw new Error('useTenantTheme must be used within a TenantThemeProvider');
  }
  return context;
};

export default TenantThemeContext;