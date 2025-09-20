/**
 * Tenant Theme Manager
 * Manages and applies tenant-specific themes dynamically
 */

import { TenantTheme, TenantConfig, TenantID } from '../types/tenant';
import { createBaseTheme } from '../themes/base';
import { Platform } from 'react-native';

class TenantThemeManager {
  private static instance: TenantThemeManager;
  private currentTheme: TenantTheme;
  private themeCache: Map<TenantID, TenantTheme> = new Map();

  private constructor() {
    this.currentTheme = createBaseTheme();
  }

  static getInstance(): TenantThemeManager {
    if (!TenantThemeManager.instance) {
      TenantThemeManager.instance = new TenantThemeManager();
    }
    return TenantThemeManager.instance;
  }

  /**
   * Generate theme from tenant configuration
   */
  generateThemeFromConfig(config: TenantConfig): TenantTheme {
    // Check cache first
    if (this.themeCache.has(config.id as TenantID)) {
      return this.themeCache.get(config.id as TenantID)!;
    }

    const baseTheme = createBaseTheme(config.branding.primaryColor);
    
    // Customize theme based on tenant branding
    const customTheme: TenantTheme = {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: config.branding.primaryColor,
        secondary: config.branding.secondaryColor,
        accent: config.branding.accentColor,
      },
      typography: {
        ...baseTheme.typography,
        fontFamily: config.branding.fonts.primary || baseTheme.typography.fontFamily,
      },
      borderRadius: {
        sm: config.branding.borderRadius * 0.4,
        md: config.branding.borderRadius,
        lg: config.branding.borderRadius * 1.5,
        xl: config.branding.borderRadius * 2,
      },
      shadows: this.generateShadows(config.branding.shadowIntensity),
    };

    // Cache the theme
    this.themeCache.set(config.id as TenantID, customTheme);
    
    return customTheme;
  }

  /**
   * Generate shadows based on intensity
   */
  private generateShadows(intensity: number): TenantTheme['shadows'] {
    const alpha = Math.max(0.1, Math.min(0.3, intensity));
    
    return {
      sm: `0 1px 3px rgba(0, 0, 0, ${alpha * 0.4}), 0 1px 2px rgba(0, 0, 0, ${alpha * 0.8})`,
      md: `0 3px 6px rgba(0, 0, 0, ${alpha * 0.6}), 0 3px 6px rgba(0, 0, 0, ${alpha * 0.9})`,
      lg: `0 10px 20px rgba(0, 0, 0, ${alpha * 0.8}), 0 6px 6px rgba(0, 0, 0, ${alpha})`,
      xl: `0 14px 28px rgba(0, 0, 0, ${alpha}), 0 10px 10px rgba(0, 0, 0, ${alpha * 0.9})`,
    };
  }

  /**
   * Apply theme for current tenant
   */
  applyTheme(theme: TenantTheme): void {
    this.currentTheme = theme;
    
    // Apply theme to web environment
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      this.applyWebTheme(theme);
    }
  }

  /**
   * Apply theme to web environment (CSS variables)
   */
  private applyWebTheme(theme: TenantTheme): void {
    const root = document.documentElement;
    
    // Set CSS custom properties
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-background', theme.colors.background);
    root.style.setProperty('--color-surface', theme.colors.surface);
    root.style.setProperty('--color-text', theme.colors.text);
    root.style.setProperty('--color-text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--color-error', theme.colors.error);
    root.style.setProperty('--color-warning', theme.colors.warning);
    root.style.setProperty('--color-success', theme.colors.success);
    root.style.setProperty('--color-info', theme.colors.info);
    
    // Typography
    root.style.setProperty('--font-family', theme.typography.fontFamily);
    root.style.setProperty('--font-size-base', `${theme.typography.sizes.md}px`);
    
    // Spacing
    root.style.setProperty('--spacing-xs', `${theme.spacing.xs}px`);
    root.style.setProperty('--spacing-sm', `${theme.spacing.sm}px`);
    root.style.setProperty('--spacing-md', `${theme.spacing.md}px`);
    root.style.setProperty('--spacing-lg', `${theme.spacing.lg}px`);
    root.style.setProperty('--spacing-xl', `${theme.spacing.xl}px`);
    root.style.setProperty('--spacing-xxl', `${theme.spacing.xxl}px`);
    
    // Border radius
    root.style.setProperty('--border-radius-sm', `${theme.borderRadius.sm}px`);
    root.style.setProperty('--border-radius-md', `${theme.borderRadius.md}px`);
    root.style.setProperty('--border-radius-lg', `${theme.borderRadius.lg}px`);
    root.style.setProperty('--border-radius-xl', `${theme.borderRadius.xl}px`);
    
    // Update theme-color meta tag
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', theme.colors.primary);
    }
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): TenantTheme {
    return this.currentTheme;
  }

  /**
   * Clear theme cache
   */
  clearCache(): void {
    this.themeCache.clear();
  }

  /**
   * Get theme for specific tenant ID
   */
  getThemeById(tenantId: TenantID): TenantTheme | null {
    return this.themeCache.get(tenantId) || null;
  }

  /**
   * Preload themes for better performance
   */
  async preloadThemes(configs: TenantConfig[]): Promise<void> {
    configs.forEach(config => {
      this.generateThemeFromConfig(config);
    });
  }
}

export default TenantThemeManager.getInstance();