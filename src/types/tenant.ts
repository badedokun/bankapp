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
  security?: TenantSecurityConfig;
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

  // Additional branding fields
  appTitle?: string;
  name?: string;
  tagline?: string;
  code?: string;
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
  fallbackToOpenAI?: boolean; // Only for general banking questions when provider is 'custom'
}

export interface TenantSecurityConfig {
  pinLength: 4 | 6; // Transaction PIN length - supports 4 or 6 digits
  minPasswordLength?: number;
  requireBiometric?: boolean;
  sessionTimeout?: number; // in minutes
  maxLoginAttempts?: number;
}

// Color scale type for theme colors
export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

// Helper type to extract string color from ColorScale or string
export type ColorValue = string;

export interface TenantTheme {
  colors: {
    // Primary color scales (for compatibility with design system)
    primary: ColorValue;
    secondary: ColorValue;
    accent: ColorValue;
    error: ColorValue;
    warning: ColorValue;
    success: ColorValue;
    info: ColorValue;
    neutral?: ColorValue;

    // Simple color values (backward compatibility)
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    textInverse: string;
    border?: string;

    // UI element colors
    card?: string;
    disabled?: string;
    primaryLight?: string;
    primaryDark?: string;

    // Semantic colors for backward compatibility
    semantic?: {
      error: ColorValue;
      warning: ColorValue;
      success: ColorValue;
      info: ColorValue;
    };
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

  // Layout properties
  layout?: {
    borderRadius: number;
    borderRadiusLarge: number;
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