/**
 * Modern Dashboard Styles
 * Implements glassmorphism, gradients, and modern design patterns
 * Based on the approved HTML mockup design
 */

import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Modern color palette
export const MODERN_COLORS = {
  // Primary gradients
  primaryGradient: ['#667eea', '#764ba2'],
  secondaryGradient: ['#4facfe', '#00f2fe'],
  successGradient: ['#43e97b', '#38f9d7'],
  warningGradient: ['#f093fb', '#f5576c'],
  infoGradient: ['#ffa726', '#ff7043'],

  // Glassmorphism colors
  glassWhite: 'rgba(255, 255, 255, 0.95)',
  glassLight: 'rgba(255, 255, 255, 0.85)',
  glassDark: 'rgba(255, 255, 255, 0.1)',
  glassBlur: 'rgba(255, 255, 255, 0.2)',

  // Text colors
  textPrimary: '#1a1a2e',
  textSecondary: '#6c757d',
  textLight: '#94a3b8',
  textWhite: '#ffffff',

  // Background colors
  bgGradientStart: '#f8f9fa',
  bgGradientEnd: '#e9ecef',
  bgOverlay: 'rgba(0, 0, 0, 0.05)',

  // Shadow and border
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowLight: 'rgba(0, 0, 0, 0.05)',
  borderLight: 'rgba(255, 255, 255, 0.3)',
  borderGlass: 'rgba(255, 255, 255, 0.18)',
};

// Platform-specific shadow styles
export const modernShadow = (intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
  const shadows = {
    light: {
      ...Platform.select({
        ios: {
          shadowColor: MODERN_COLORS.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: { elevation: 2 },
        web: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      }),
    },
    medium: {
      ...Platform.select({
        ios: {
          shadowColor: MODERN_COLORS.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
        },
        android: { elevation: 4 },
        web: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
      }),
    },
    heavy: {
      ...Platform.select({
        ios: {
          shadowColor: MODERN_COLORS.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 20,
        },
        android: { elevation: 8 },
        web: {
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
        },
      }),
    },
  };

  return shadows[intensity];
};

// Glassmorphism effect
export const glassEffect = (blur: 'light' | 'medium' | 'heavy' = 'medium') => {
  const blurValues = {
    light: 10,
    medium: 20,
    heavy: 30,
  };

  return {
    backgroundColor: MODERN_COLORS.glassWhite,
    ...Platform.select({
      ios: {
        // iOS supports backdrop-filter through native blur views
        backgroundColor: MODERN_COLORS.glassLight,
      },
      android: {
        // Android fallback with opacity
        backgroundColor: MODERN_COLORS.glassWhite,
      },
      web: {
        // Web supports backdrop-filter
        backdropFilter: `blur(${blurValues[blur]}px)`,
        WebkitBackdropFilter: `blur(${blurValues[blur]}px)`,
        backgroundColor: MODERN_COLORS.glassLight,
      } as any,
    }),
    borderWidth: 1,
    borderColor: MODERN_COLORS.borderGlass,
  };
};

export const modernDashboardStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: MODERN_COLORS.bgGradientStart,
  },

  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: MODERN_COLORS.bgGradientStart,
  },

  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },

  // Hero section with glassmorphism
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    ...glassEffect('light'),
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...modernShadow('medium'),
  },

  heroGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    opacity: 0.1,
  },

  // Welcome section
  welcomeSection: {
    marginBottom: 24,
  },

  welcomeText: {
    fontSize: 16,
    color: MODERN_COLORS.textLight,
    marginBottom: 4,
  },

  userNameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: MODERN_COLORS.textPrimary,
    marginBottom: 8,
  },

  roleText: {
    fontSize: 14,
    color: MODERN_COLORS.textSecondary,
    textTransform: 'capitalize',
  },

  // Quick stats grid
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginTop: 20,
  },

  quickStatCard: {
    width: '48%',
    margin: '1%',
    padding: 16,
    borderRadius: 16,
    ...glassEffect('medium'),
    ...modernShadow('light'),
  },

  quickStatLabel: {
    fontSize: 12,
    color: MODERN_COLORS.textLight,
    marginBottom: 4,
  },

  quickStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: MODERN_COLORS.textPrimary,
  },

  quickStatChange: {
    fontSize: 11,
    marginTop: 4,
  },

  quickStatChangePositive: {
    color: '#10b981',
  },

  quickStatChangeNegative: {
    color: '#ef4444',
  },

  // Feature cards with modern styling
  featureSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: MODERN_COLORS.textPrimary,
    marginBottom: 16,
  },

  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },

  modernFeatureCard: {
    width: '48%',
    margin: '1%',
    padding: 20,
    borderRadius: 20,
    minHeight: 140,
    ...glassEffect('light'),
    ...modernShadow('medium'),
    overflow: 'hidden',
  },

  featureCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    borderRadius: 20,
  },

  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...glassEffect('heavy'),
  },

  featureIcon: {
    fontSize: 24,
  },

  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: MODERN_COLORS.textPrimary,
    marginBottom: 4,
  },

  featureDescription: {
    fontSize: 12,
    color: MODERN_COLORS.textSecondary,
    lineHeight: 16,
  },

  // Activity feed with glassmorphism
  activitySection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },

  activityCard: {
    borderRadius: 20,
    padding: 20,
    ...glassEffect('medium'),
    ...modernShadow('medium'),
  },

  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.borderLight,
  },

  activityItemLast: {
    borderBottomWidth: 0,
  },

  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    ...glassEffect('light'),
  },

  activityIcon: {
    fontSize: 18,
  },

  activityContent: {
    flex: 1,
  },

  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: MODERN_COLORS.textPrimary,
    marginBottom: 2,
  },

  activityTime: {
    fontSize: 11,
    color: MODERN_COLORS.textLight,
  },

  activityAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: MODERN_COLORS.textPrimary,
    textAlign: 'right',
  },

  // Floating action button
  floatingButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...glassEffect('heavy'),
    ...modernShadow('heavy'),
  },

  floatingButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  floatingButtonIcon: {
    fontSize: 24,
    color: MODERN_COLORS.textWhite,
  },

  // Loading states with shimmer effect
  shimmerContainer: {
    overflow: 'hidden',
    backgroundColor: MODERN_COLORS.glassLight,
    borderRadius: 12,
  },

  shimmer: {
    width: '100%',
    height: '100%',
    ...Platform.select({
      web: {
        background: `linear-gradient(
          90deg,
          ${MODERN_COLORS.glassLight} 0%,
          ${MODERN_COLORS.glassWhite} 50%,
          ${MODERN_COLORS.glassLight} 100%
        )`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      } as any,
    }),
  },

  // Responsive adjustments
  tabletAdjustment: {
    ...(SCREEN_WIDTH >= 768 && {
      maxWidth: 1200,
      alignSelf: 'center',
      width: '100%',
    }),
  },
});

// Animation keyframes for web
// Note: CSS injection is disabled to prevent React Native Web touch event conflicts
// This can be enabled by calling injectModernDashboardStyles() when needed
export const injectModernDashboardStyles = () => {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    // Check if styles are already injected
    if (!document.getElementById('modern-dashboard-styles')) {
      const style = document.createElement('style');
      style.id = 'modern-dashboard-styles';
      style.textContent = `
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .modern-card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .modern-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
        }
      `;
      document.head.appendChild(style);
    }
  }
};

export default modernDashboardStyles;