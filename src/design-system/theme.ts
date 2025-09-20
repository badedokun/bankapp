/**
 * OrokiiPay Design System - Theme System
 * Unified theme system for multi-tenant banking platform
 */

import { baseTokens, bankingTokens, generateTenantColors, DesignTokens, BankingTokens } from './tokens';

export interface OrokiiPayTheme extends DesignTokens {
  banking: BankingTokens;
  
  // Computed theme properties for easy access
  computed: {
    // Background colors
    background: {
      primary: string;
      secondary: string;
      surface: string;
      overlay: string;
    };
    
    // Text colors
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
      onPrimary: string;
      onSecondary: string;
    };
    
    // Border colors
    border: {
      light: string;
      medium: string;
      dark: string;
      focus: string;
      error: string;
    };
    
    // Interactive states
    interactive: {
      hover: string;
      active: string;
      disabled: string;
      focus: string;
    };
    
    // Gradients (for backgrounds and effects)
    gradients: {
      primary: string;
      secondary: string;
      hero: string;
      card: string;
    };
  };
  
  // Tenant-specific overrides
  tenant?: {
    id: string;
    name: string;
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    customCSS?: string;
  };
}

// Create base theme
export function createBaseTheme(): OrokiiPayTheme {
  const theme: OrokiiPayTheme = {
    ...baseTokens,
    banking: bankingTokens,
    
    computed: {
      background: {
        primary: baseTokens.colors.neutral[0],
        secondary: baseTokens.colors.neutral[50],
        surface: baseTokens.colors.neutral[0],
        overlay: 'rgba(0, 0, 0, 0.5)',
      },
      
      text: {
        primary: baseTokens.colors.neutral[900],
        secondary: baseTokens.colors.neutral[600],
        tertiary: baseTokens.colors.neutral[400],
        inverse: baseTokens.colors.neutral[0],
        onPrimary: baseTokens.colors.neutral[0],
        onSecondary: baseTokens.colors.neutral[0],
      },
      
      border: {
        light: baseTokens.colors.neutral[200],
        medium: baseTokens.colors.neutral[300],
        dark: baseTokens.colors.neutral[400],
        focus: baseTokens.colors.primary[500],
        error: baseTokens.colors.semantic.error[500],
      },
      
      interactive: {
        hover: baseTokens.colors.neutral[100],
        active: baseTokens.colors.neutral[200],
        disabled: baseTokens.colors.neutral[300],
        focus: baseTokens.colors.primary[100],
      },
      
      gradients: {
        primary: `linear-gradient(135deg, ${baseTokens.colors.primary[500]} 0%, ${baseTokens.colors.secondary[500]} 100%)`,
        secondary: `linear-gradient(135deg, ${baseTokens.colors.secondary[400]} 0%, ${baseTokens.colors.secondary[600]} 100%)`,
        hero: `linear-gradient(135deg, ${baseTokens.colors.primary[500]}22 0%, ${baseTokens.colors.secondary[500]}22 100%)`,
        card: `linear-gradient(145deg, ${baseTokens.colors.neutral[0]} 0%, ${baseTokens.colors.neutral[50]} 100%)`,
      },
    },
  };
  
  return theme;
}

// Create tenant-specific theme
export function createTenantTheme(tenantConfig: {
  id: string;
  name: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  customCSS?: string;
}): OrokiiPayTheme {
  const baseTheme = createBaseTheme();
  
  // If no custom colors, return base theme with tenant info
  if (!tenantConfig.primaryColor) {
    return {
      ...baseTheme,
      tenant: tenantConfig,
    };
  }
  
  // Generate tenant color palette
  const tenantPrimary = generateTenantColors(tenantConfig.primaryColor);
  const tenantSecondary = tenantConfig.secondaryColor 
    ? generateTenantColors(tenantConfig.secondaryColor)
    : baseTheme.colors.secondary;
  
  // Override theme with tenant colors
  const tenantTheme: OrokiiPayTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: tenantPrimary,
      secondary: tenantSecondary,
    },
    
    computed: {
      ...baseTheme.computed,
      
      border: {
        ...baseTheme.computed.border,
        focus: tenantPrimary[500],
      },
      
      interactive: {
        ...baseTheme.computed.interactive,
        focus: tenantPrimary[100],
      },
      
      gradients: {
        primary: `linear-gradient(135deg, ${tenantPrimary[500]} 0%, ${tenantSecondary[500]} 100%)`,
        secondary: `linear-gradient(135deg, ${tenantSecondary[400]} 0%, ${tenantSecondary[600]} 100%)`,
        hero: `linear-gradient(135deg, ${tenantPrimary[500]}22 0%, ${tenantSecondary[500]}22 100%)`,
        card: `linear-gradient(145deg, ${baseTheme.colors.neutral[0]} 0%, ${baseTheme.colors.neutral[50]} 100%)`,
      },
    },
    
    tenant: tenantConfig,
  };
  
  return tenantTheme;
}

// Theme utilities for responsive design
export const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
};

export const mediaQueries = {
  xs: `@media (min-width: ${breakpoints.xs}px)`,
  sm: `@media (min-width: ${breakpoints.sm}px)`,
  md: `@media (min-width: ${breakpoints.md}px)`,
  lg: `@media (min-width: ${breakpoints.lg}px)`,
  xl: `@media (min-width: ${breakpoints.xl}px)`,
  xxl: `@media (min-width: ${breakpoints.xxl}px)`,
};

// Convert theme to CSS custom properties (for web)
export function themeToCSSProperties(theme: OrokiiPayTheme): Record<string, string> {
  const cssProperties: Record<string, string> = {};
  
  // Colors
  Object.entries(theme.colors.primary).forEach(([key, value]) => {
    cssProperties[`--color-primary-${key}`] = value;
  });
  
  Object.entries(theme.colors.secondary).forEach(([key, value]) => {
    cssProperties[`--color-secondary-${key}`] = value;
  });
  
  Object.entries(theme.colors.neutral).forEach(([key, value]) => {
    cssProperties[`--color-neutral-${key}`] = value;
  });
  
  // Semantic colors
  Object.entries(theme.colors.semantic).forEach(([category, colors]) => {
    Object.entries(colors).forEach(([key, value]) => {
      cssProperties[`--color-${category}-${key}`] = value;
    });
  });
  
  // Spacing
  Object.entries(theme.spacing).forEach(([key, value]) => {
    cssProperties[`--spacing-${key}`] = `${value}px`;
  });
  
  // Typography
  cssProperties['--font-family-primary'] = theme.typography.fontFamily.primary;
  cssProperties['--font-family-secondary'] = theme.typography.fontFamily.secondary;
  cssProperties['--font-family-mono'] = theme.typography.fontFamily.mono;
  
  Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
    cssProperties[`--font-size-${key}`] = `${value}px`;
  });
  
  Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
    cssProperties[`--font-weight-${key}`] = value;
  });
  
  // Border radius
  Object.entries(theme.borderRadius).forEach(([key, value]) => {
    cssProperties[`--border-radius-${key}`] = `${value}px`;
  });
  
  // Shadows
  Object.entries(theme.shadows).forEach(([key, value]) => {
    cssProperties[`--shadow-${key}`] = value;
  });
  
  // Computed values
  Object.entries(theme.computed.background).forEach(([key, value]) => {
    cssProperties[`--bg-${key}`] = value;
  });
  
  Object.entries(theme.computed.text).forEach(([key, value]) => {
    cssProperties[`--text-${key}`] = value;
  });
  
  Object.entries(theme.computed.border).forEach(([key, value]) => {
    cssProperties[`--border-${key}`] = value;
  });
  
  Object.entries(theme.computed.gradients).forEach(([key, value]) => {
    cssProperties[`--gradient-${key}`] = value;
  });
  
  // Banking-specific tokens
  Object.entries(theme.banking.transactionStatus).forEach(([key, value]) => {
    cssProperties[`--transaction-${key}`] = value;
  });
  
  return cssProperties;
}

// Convert theme to React Native StyleSheet values
export function themeToReactNativeStyles(theme: OrokiiPayTheme) {
  return {
    colors: {
      // Primary colors
      primary: theme.colors.primary[500],
      primaryLight: theme.colors.primary[100],
      primaryDark: theme.colors.primary[700],
      
      // Secondary colors
      secondary: theme.colors.secondary[500],
      secondaryLight: theme.colors.secondary[100],
      secondaryDark: theme.colors.secondary[700],
      
      // Background colors
      background: theme.computed.background.primary,
      surface: theme.computed.background.surface,
      
      // Text colors
      text: theme.computed.text.primary,
      textSecondary: theme.computed.text.secondary,
      textInverse: theme.computed.text.inverse,
      
      // Interactive states
      hover: theme.computed.interactive.hover,
      active: theme.computed.interactive.active,
      disabled: theme.computed.interactive.disabled,
      
      // Semantic colors
      success: theme.colors.semantic.success[500],
      warning: theme.colors.semantic.warning[500],
      error: theme.colors.semantic.error[500],
      info: theme.colors.semantic.info[500],
    },
    
    spacing: theme.spacing,
    
    typography: {
      fontFamily: theme.typography.fontFamily.primary,
      sizes: theme.typography.fontSize,
      weights: {
        normal: theme.typography.fontWeight.normal as any,
        medium: theme.typography.fontWeight.medium as any,
        semibold: theme.typography.fontWeight.semibold as any,
        bold: theme.typography.fontWeight.bold as any,
      },
    },
    
    borderRadius: theme.borderRadius,
    
    // Banking-specific
    banking: theme.banking,
  };
}

// Default themes for common tenants
export const defaultThemes = {
  orokiiPay: createBaseTheme(),
  
  fmfb: createTenantTheme({
    id: 'fmfb',
    name: 'First Midas Microfinance Bank',
    primaryColor: '#1a365d', // Navy blue for financial institution
    secondaryColor: '#2d5a87',
    logoUrl: '/api/tenants/by-name/fmfb/assets/logo/default',
  }),
  
  demo: createTenantTheme({
    id: 'demo',
    name: 'Demo Bank',
    primaryColor: '#059669', // Green for demo
    secondaryColor: '#047857',
  }),
};

export type ThemeName = keyof typeof defaultThemes;