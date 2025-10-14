/**
 * Multi-Tenant Theme Context
 * Dynamically loads tenant theme configuration from JWT, subdomain, or API
 * Follows multi-tenancy principles - no hardcoded tenant data
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { buildApiUrl } from '../config/environment';

// Generic Theme Defaults - NO tenant-specific data
// Only styling defaults, tenant info comes from dynamic sources (JWT, .env, subdomain, API)
const DEFAULT_STYLING = {
  currency: 'NGN',
  locale: 'en-NG',
  timezone: 'Africa/Lagos',
  dateFormat: 'DD/MM/YYYY',
  numberFormat: {
    decimal: '.',
    thousands: ',',
    precision: 2,
  },
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
    textInverse: '#FFFFFF',
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
  currency: string;
  locale: string;
  timezone: string;
  dateFormat: string;
  numberFormat: {
    decimal: string;
    thousands: string;
    precision: number;
  };
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
    textInverse: string;
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
  // Initialize with generic styling only, tenant info will be loaded dynamically
  const [theme, setTheme] = useState<TenantTheme>({
    tenantId: '',
    tenantCode: '',
    brandName: 'Banking Platform',
    brandTagline: 'Secure Banking',
    brandLogo: '',
    ...DEFAULT_STYLING,
  });
  const [tenantInfo, setTenantInfo] = useState({
    id: '',
    code: '',
    name: 'Banking Platform',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenantTheme = async (tenantCode: string): Promise<TenantTheme | null> => {
    try {
      // API call to fetch tenant theme configuration
      const apiUrl = buildApiUrl(`tenants/theme/${tenantCode}`);
      console.log(`🔍 Fetching tenant theme from: ${apiUrl}`);
      const response = await fetch(apiUrl, {
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

      console.log('🎨 API Theme Data:', themeData);

      // Convert relative logo URL to absolute URL
      const brandLogo = themeData.brandLogo?.startsWith('/')
        ? buildApiUrl(themeData.brandLogo.replace(/^\/api\//, ''))
        : themeData.brandLogo;

      console.log('🔍 Logo URL transformation:', {
        original: themeData.brandLogo,
        transformed: brandLogo
      });

      // Merge with DEFAULT_STYLING to ensure all required properties exist
      // API data overrides default styling
      const mergedTheme = {
        ...DEFAULT_STYLING,
        ...themeData,
        brandLogo, // Use transformed logo URL
        colors: {
          ...DEFAULT_STYLING.colors,
          ...(themeData.colors || {}),
          // Ensure critical colors always exist - these MUST come from API or fallback to default
          textInverse: themeData.colors?.textInverse || DEFAULT_STYLING.colors.textInverse,
          primaryGradientStart: themeData.colors?.primaryGradientStart || themeData.colors?.primary || DEFAULT_STYLING.colors.primaryGradientStart,
          primaryGradientEnd: themeData.colors?.primaryGradientEnd || themeData.colors?.secondary || DEFAULT_STYLING.colors.primaryGradientEnd,
        },
        typography: {
          ...DEFAULT_STYLING.typography,
          ...(themeData.typography || {}),
        },
        numberFormat: {
          ...DEFAULT_STYLING.numberFormat,
          ...(themeData.numberFormat || {}),
        },
        layout: {
          ...DEFAULT_STYLING.layout,
          ...(themeData.layout || {}),
        },
      };

      console.log('🎨 Merged Theme Colors:', {
        primary: mergedTheme.colors.primary,
        secondary: mergedTheme.colors.secondary,
        primaryGradientStart: mergedTheme.colors.primaryGradientStart,
        primaryGradientEnd: mergedTheme.colors.primaryGradientEnd,
        textInverse: mergedTheme.colors.textInverse,
      });

      return mergedTheme;
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

      // 4. If no tenant detected, show error - all deployments must have tenant configured
      if (!tenantCode) {
        setError('No tenant configuration found. Please check deployment settings.');
        setIsLoading(false);
        return;
      }

      // Fetch tenant-specific theme from API
      const tenantTheme = await fetchTenantTheme(tenantCode);

      if (tenantTheme) {
        // API succeeded - use tenant data from API
        setTheme(tenantTheme);
        setTenantInfo({
          id: tenantTheme.tenantId,
          code: tenantTheme.tenantCode,
          name: tenantTheme.brandName,
          subdomain: getTenantFromSubdomain() || undefined,
        });
      } else {
        // API failed - use generic styling with dynamically detected tenant code
        // Tenant branding will be loaded when API becomes available
        setTheme({
          tenantId: tenantCode,
          tenantCode: tenantCode,
          brandName: 'Banking Platform',
          brandTagline: 'Secure Banking',
          brandLogo: '',
          ...DEFAULT_STYLING,
        });
        setTenantInfo({
          id: tenantCode,
          code: tenantCode,
          name: 'Banking Platform',
        });
        console.warn(`Theme API unavailable for tenant: ${tenantCode}. Using generic styling.`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
      // On error, use generic styling with dynamically detected tenant code if available
      const storedTenant = Platform.OS === 'web' && typeof localStorage !== 'undefined'
        ? localStorage.getItem('currentTenant')
        : null;

      if (storedTenant) {
        setTheme({
          tenantId: storedTenant,
          tenantCode: storedTenant,
          brandName: 'Banking Platform',
          brandTagline: 'Secure Banking',
          brandLogo: '',
          ...DEFAULT_STYLING,
        });
        setTenantInfo({
          id: storedTenant,
          code: storedTenant,
          name: 'Banking Platform',
        });
        console.warn(`Error loading theme for tenant: ${storedTenant}. Using generic styling.`);
      }
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