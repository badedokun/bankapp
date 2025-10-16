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
    fallbackToOpenAI?: boolean;
}
export interface TenantSecurityConfig {
    pinLength: 4 | 6;
    minPasswordLength?: number;
    requireBiometric?: boolean;
    sessionTimeout?: number;
    maxLoginAttempts?: number;
}
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
export type ColorValue = string;
export interface TenantTheme {
    colors: {
        primary: ColorValue;
        secondary: ColorValue;
        accent: ColorValue;
        error: ColorValue;
        warning: ColorValue;
        success: ColorValue;
        info: ColorValue;
        neutral?: ColorValue;
        background: string;
        surface: string;
        text: string;
        textSecondary: string;
        textInverse: string;
        border?: string;
        card?: string;
        disabled?: string;
        primaryLight?: string;
        primaryDark?: string;
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
//# sourceMappingURL=tenant.d.ts.map