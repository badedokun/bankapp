/**
 * OrokiiPay Design System - Design Tokens
 * Unified design tokens for multi-tenant banking platform
 * Supports both React Native and Web implementations
 */

export interface ColorPalette {
  // Brand Colors (tenant-customizable)
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;  // Main brand color
    600: string;
    700: string;
    800: string;
    900: string;
  };
  secondary: {
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
  };

  // Neutral Colors (consistent across tenants)
  neutral: {
    0: string;    // Pure white
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
    1000: string; // Pure black
  };

  // Semantic Colors (consistent across tenants)
  semantic: {
    success: {
      50: string;
      500: string;
      700: string;
    };
    warning: {
      50: string;
      500: string;
      700: string;
    };
    error: {
      50: string;
      500: string;
      700: string;
    };
    info: {
      50: string;
      500: string;
      700: string;
    };
  };

  // Direct semantic color access (for backward compatibility)
  error?: {
    50: string;
    500: string;
    700: string;
  };
  success?: {
    50: string;
    500: string;
    700: string;
  };
  warning?: {
    50: string;
    500: string;
    700: string;
  };
  info?: {
    50: string;
    500: string;
    700: string;
  };
  danger?: {
    50: string;
    500: string;
    700: string;
  };
}

export interface Typography {
  fontFamily: {
    primary: string;
    secondary: string;
    mono: string;
    body?: string;  // Backward compatibility
  };
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
    '5xl': number;
  };
  fontWeight: {
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  letterSpacing: {
    tight: number;
    normal: number;
    wide: number;
  };
}

export interface Spacing {
  0: number;
  1: number;   // 4px
  2: number;   // 8px
  3: number;   // 12px
  4: number;   // 16px
  5: number;   // 20px
  6: number;   // 24px
  8: number;   // 32px
  10: number;  // 40px
  12: number;  // 48px
  16: number;  // 64px
  20: number;  // 80px
  24: number;  // 96px
  32: number;  // 128px

  // Named spacing (for backward compatibility)
  xs?: number;  // Extra small (4px)
  sm?: number;  // Small (8px)
  md?: number;  // Medium (16px)
  lg?: number;  // Large (24px)
  xl?: number;  // Extra large (32px)
  xxl?: number; // Extra extra large (48px)
}

export interface BorderRadius {
  none: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  full: number;
}

export interface Shadows {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

// Base Design Tokens (Foundation)
export const baseTokens = {
  colors: {
    // Default OrokiiPay brand colors (purple-blue gradient theme from mockups)
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#667eea',  // Main brand color from mockups
      600: '#5a6fd8',
      700: '#4f5dc9',
      800: '#4338ca',
      900: '#3730a3',
    },
    secondary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#764ba2',  // Secondary from gradient
      600: '#6d43a0',
      700: '#5b3999',
      800: '#4c2f82',
      900: '#3e256b',
    },
    neutral: {
      0: '#ffffff',
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      1000: '#000000',
    },
    semantic: {
      success: {
        50: '#f0fdf4',
        500: '#10b981',
        700: '#059669',
      },
      warning: {
        50: '#fef3c7',
        500: '#f59e0b',
        700: '#d97706',
      },
      error: {
        50: '#fef2f2',
        500: '#ef4444',
        700: '#dc2626',
      },
      info: {
        50: '#eff6ff',
        500: '#3b82f6',
        700: '#1d4ed8',
      },
    },
  } as ColorPalette,
  
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
      secondary: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
    letterSpacing: {
      tight: -0.025,
      normal: 0,
      wide: 0.025,
    },
  } as Typography,
  
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96,
    32: 128,
  } as Spacing,
  
  borderRadius: {
    none: 0,
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    full: 9999,
  } as BorderRadius,
  
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
  } as Shadows,
};

// Tenant-specific color generation utilities
export function generateTenantColors(primaryColor: string, secondaryColor?: string): ColorPalette['primary'] {
  // This would integrate with a color palette generator
  // For now, we'll provide a simplified version
  return {
    50: lighten(primaryColor, 0.4),
    100: lighten(primaryColor, 0.35),
    200: lighten(primaryColor, 0.25),
    300: lighten(primaryColor, 0.15),
    400: lighten(primaryColor, 0.05),
    500: primaryColor,
    600: darken(primaryColor, 0.05),
    700: darken(primaryColor, 0.15),
    800: darken(primaryColor, 0.25),
    900: darken(primaryColor, 0.35),
  };
}

// Utility functions for color manipulation
function lighten(color: string, amount: number): string {
  // Simplified color lightening - in production, use a proper color library
  return color; // Placeholder
}

function darken(color: string, amount: number): string {
  // Simplified color darkening - in production, use a proper color library
  return color; // Placeholder
}

// Banking-specific design constants
export const bankingTokens = {
  // Transaction status colors
  transactionStatus: {
    pending: '#f59e0b',
    completed: '#10b981',
    failed: '#ef4444',
    cancelled: '#6b7280',
  },
  
  // Account type colors
  accountTypes: {
    savings: '#10b981',
    current: '#3b82f6',
    fixed: '#8b5cf6',
    loan: '#f59e0b',
  },
  
  // Priority levels
  priority: {
    low: '#6b7280',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626',
  },
  
  // Component-specific sizing
  components: {
    button: {
      height: {
        sm: 32,
        md: 40,
        lg: 48,
        xl: 56,
      },
      padding: {
        sm: { x: 12, y: 8 },
        md: { x: 16, y: 12 },
        lg: { x: 20, y: 14 },
        xl: { x: 24, y: 16 },
      },
    },
    input: {
      height: {
        sm: 36,
        md: 44,
        lg: 52,
      },
      padding: {
        sm: { x: 12, y: 8 },
        md: { x: 16, y: 12 },
        lg: { x: 20, y: 14 },
      },
    },
    card: {
      padding: {
        sm: 16,
        md: 20,
        lg: 24,
        xl: 32,
      },
    },
  },
};

export type DesignTokens = typeof baseTokens;
export type BankingTokens = typeof bankingTokens;