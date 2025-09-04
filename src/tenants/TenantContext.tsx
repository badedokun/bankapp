/**
 * Tenant Context Provider
 * Provides tenant-aware context throughout the application
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { TenantConfig, TenantTheme, TenantContextValue, TenantID } from '@/types/tenant';
import TenantDetector from './TenantDetector';
import TenantConfigLoader from './TenantConfigLoader';
import TenantThemeManager from './TenantThemeManager';
import { createBaseTheme } from '@/themes/base';

// Create the context
const TenantContext = createContext<TenantContextValue | null>(null);

export interface TenantProviderProps {
  children: ReactNode;
  fallbackTenantId?: TenantID;
}

/**
 * Tenant Provider Component
 */
export const TenantProvider: React.FC<TenantProviderProps> = ({ 
  children, 
  fallbackTenantId = 'default' 
}) => {
  const [currentTenant, setCurrentTenant] = useState<TenantConfig | null>(null);
  const [theme, setTheme] = useState<TenantTheme>(createBaseTheme());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Initialize tenant detection and configuration
   */
  const initializeTenant = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Detect current tenant
      const detectedTenantId = await TenantDetector.detectTenant();
      console.log('Detected tenant:', detectedTenantId);

      // Load tenant configuration
      const tenantConfig = await TenantConfigLoader.loadConfig(detectedTenantId);
      
      // Generate and apply theme
      const tenantTheme = TenantThemeManager.generateThemeFromConfig(tenantConfig);
      TenantThemeManager.applyTheme(tenantTheme);

      // Update state
      setCurrentTenant(tenantConfig);
      setTheme(tenantTheme);

      console.log('Tenant initialized:', {
        id: tenantConfig.id,
        name: tenantConfig.displayName,
        primaryColor: tenantConfig.branding.primaryColor,
      });
    } catch (err) {
      console.error('Error initializing tenant:', err);
      setError(err as Error);

      // Fallback to default tenant
      try {
        const fallbackConfig = await TenantConfigLoader.loadConfig(fallbackTenantId);
        const fallbackTheme = TenantThemeManager.generateThemeFromConfig(fallbackConfig);
        
        TenantThemeManager.applyTheme(fallbackTheme);
        setCurrentTenant(fallbackConfig);
        setTheme(fallbackTheme);
      } catch (fallbackErr) {
        console.error('Error loading fallback tenant:', fallbackErr);
        setError(fallbackErr as Error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [fallbackTenantId]);

  /**
   * Switch to a different tenant
   */
  const switchTenant = useCallback(async (tenantId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate tenant ID
      const validTenantId = tenantId as TenantID;
      
      // Update tenant detector
      await TenantDetector.setTenant(validTenantId);
      
      // Load new tenant configuration
      const newTenantConfig = await TenantConfigLoader.loadConfig(validTenantId);
      
      // Generate and apply new theme
      const newTheme = TenantThemeManager.generateThemeFromConfig(newTenantConfig);
      TenantThemeManager.applyTheme(newTheme);

      // Update state
      setCurrentTenant(newTenantConfig);
      setTheme(newTheme);

      console.log('Switched to tenant:', {
        id: newTenantConfig.id,
        name: newTenantConfig.displayName,
      });
    } catch (err) {
      console.error('Error switching tenant:', err);
      setError(err as Error);
      throw err; // Re-throw for handling in components
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeTenant();
  }, [initializeTenant]);

  // Context value
  const contextValue: TenantContextValue = {
    currentTenant,
    theme,
    switchTenant,
    isLoading,
    error,
  };

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};

/**
 * Hook to use tenant context
 */
export const useTenant = (): TenantContextValue => {
  const context = useContext(TenantContext);
  
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  
  return context;
};

/**
 * Hook to use tenant theme
 */
export const useTenantTheme = (): TenantTheme => {
  const { theme } = useTenant();
  return theme;
};

/**
 * Hook to check if a feature is enabled
 */
export const useTenantFeature = (feature: keyof TenantConfig['features']): boolean => {
  const { currentTenant } = useTenant();
  return currentTenant?.features[feature] === true;
};

/**
 * Hook to get tenant branding
 */
export const useTenantBranding = () => {
  const { currentTenant } = useTenant();
  return currentTenant?.branding || null;
};

export default TenantContext;