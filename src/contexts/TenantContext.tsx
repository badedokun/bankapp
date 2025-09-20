import React, { createContext, useContext, useState, ReactNode } from 'react';
import TenantConfigLoader from '../tenants/TenantConfigLoader';

interface TenantConfig {
  id: string;
  displayName: string;
  defaultLanguage: string;
  theme?: {
    primaryColor: string;
    logo?: string;
  };
}

interface TenantContextType {
  currentTenant: TenantConfig | null;
  setCurrentTenant: (tenant: TenantConfig) => void;
}

// Load FMFB as the default tenant
const defaultTenant: TenantConfig = {
  id: 'fmfb',
  displayName: 'Firstmidas Microfinance Bank',
  defaultLanguage: 'en',
  theme: {
    primaryColor: '#010080'
  }
};

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<TenantConfig | null>(defaultTenant);

  return (
    <TenantContext.Provider value={{ currentTenant, setCurrentTenant }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenantConfig = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    // Return default values when context is not available
    return { 
      currentTenant: defaultTenant,
      setCurrentTenant: () => {}
    };
  }
  return context;
};

export default TenantContext;