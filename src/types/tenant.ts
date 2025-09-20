/**
 * Multi-Tenant Type Definitions
 */

export interface TenantConfig {
  id: string;
  name: string;
  displayName: string;
  domain: string;
  apiEndpoint: string;
  features: TenantFeatures;
  branding: TenantBranding;
  aiConfig: TenantAIConfig;
  languages: string[];
  defaultLanguage: string;
}

export interface TenantFeatures {
  aiAssistant: boolean;
  voiceTransfer: boolean;
  biometricAuth: boolean;
  offlineMode: boolean;
  multiCurrency: boolean;
  internationalTransfers: boolean;
  bulkTransfers: boolean;
  scheduledTransfers: boolean;
  fraudDetection: boolean;
}

export interface TenantBranding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logo: string;
  favicon: string;
  fonts: {
    primary: string;
    secondary: string;
  };
  borderRadius: number;
  shadowIntensity: number;
}

export interface TenantAIConfig {
  provider: 'openai' | 'azure' | 'custom';
  apiKey?: string;
  endpoint?: string;
  models: {
    conversational: string;
    fraud: string;
    prediction: string;
  };
  voiceSettings: {
    enabled: boolean;
    language: string;
    accent: string;
  };
}

export interface TenantTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  typography: {
    fontFamily: string;
    sizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
      xxxl: number;
    };
    weights: {
      regular: string;
      medium: string;
      semibold: string;
      bold: string;
    };
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export type TenantID = 'fmfb' | 'bank-a' | 'bank-b' | 'bank-c' | 'default';

export interface TenantContextValue {
  currentTenant: TenantConfig | null;
  theme: TenantTheme;
  switchTenant: (tenantId: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}