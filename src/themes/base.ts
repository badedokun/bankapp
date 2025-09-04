/**
 * Base Theme Definition
 * Provides the foundation for all tenant-specific themes
 */

import { TenantTheme } from '@/types/tenant';

export const createBaseTheme = (primaryColor: string = '#007bff'): TenantTheme => {
  // Generate color variations from primary color
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 123, b: 255 };
  };

  const adjustBrightness = (hex: string, factor: number): string => {
    const rgb = hexToRgb(hex);
    const adjusted = {
      r: Math.round(Math.max(0, Math.min(255, rgb.r * factor))),
      g: Math.round(Math.max(0, Math.min(255, rgb.g * factor))),
      b: Math.round(Math.max(0, Math.min(255, rgb.b * factor))),
    };
    return `#${adjusted.r.toString(16).padStart(2, '0')}${adjusted.g
      .toString(16)
      .padStart(2, '0')}${adjusted.b.toString(16).padStart(2, '0')}`;
  };

  const secondary = adjustBrightness(primaryColor, 0.8);
  const accent = adjustBrightness(primaryColor, 1.2);

  return {
    colors: {
      primary: primaryColor,
      secondary: secondary,
      accent: accent,
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1a1a1a',
      textSecondary: '#666666',
      error: '#dc3545',
      warning: '#ffc107',
      success: '#28a745',
      info: '#17a2b8',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      sizes: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
        xxl: 24,
        xxxl: 32,
      },
      weights: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
    },
    shadows: {
      sm: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
      md: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
      lg: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
      xl: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
    },
  };
};

export const lightTheme = createBaseTheme('#007bff');

export const darkTheme: TenantTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    background: '#121212',
    surface: '#1e1e1e',
    text: '#ffffff',
    textSecondary: '#b3b3b3',
  },
};