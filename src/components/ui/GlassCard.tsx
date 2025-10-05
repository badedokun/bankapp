/**
 * GlassCard Component
 * Glassmorphic card with tenant theming
 * Based on MODERN_UI_DESIGN_SYSTEM.md specifications
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useTenantTheme } from '../../context/TenantThemeContext';

export interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  blur?: 'light' | 'medium' | 'strong';
  shadow?: 'none' | 'small' | 'medium' | 'large';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  borderRadius?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;

  // Header
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;

  // Footer
  footer?: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  blur = 'medium',
  shadow = 'medium',
  padding = 'md',
  borderRadius = 'lg',
  style,
  onPress,
  disabled = false,
  title,
  subtitle,
  headerAction,
  footer,
}) => {
  const { theme } = useTenantTheme();

  const getBackgroundColor = () => {
    switch (blur) {
      case 'light':
        return 'rgba(255, 255, 255, 0.7)';
      case 'medium':
        return 'rgba(255, 255, 255, 0.85)';
      case 'strong':
        return 'rgba(255, 255, 255, 0.95)';
      default:
        return 'rgba(255, 255, 255, 0.85)';
    }
  };

  const getBlurAmount = () => {
    switch (blur) {
      case 'light':
        return 'blur(5px)';
      case 'medium':
        return 'blur(10px)';
      case 'strong':
        return 'blur(20px)';
      default:
        return 'blur(10px)';
    }
  };

  const getShadowStyle = () => {
    if (shadow === 'none') return {};

    const shadowMap = {
      small: {
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
        web: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
      medium: {
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
        },
        android: {
          elevation: 4,
        },
        web: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
      },
      large: {
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 20,
        },
        android: {
          elevation: 8,
        },
        web: {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        },
      },
    };

    return Platform.select(shadowMap[shadow]);
  };

  const getPaddingValue = () => {
    const paddingMap = {
      none: 0,
      sm: 12,
      md: 16,
      lg: 20,
      xl: 24,
    };
    return paddingMap[padding];
  };

  const getBorderRadiusValue = () => {
    const radiusMap = {
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
    };
    return radiusMap[borderRadius];
  };

  const Container = onPress ? TouchableOpacity : View;

  const styles = StyleSheet.create({
    card: {
      backgroundColor: getBackgroundColor(),
      borderRadius: getBorderRadiusValue(),
      borderWidth: variant === 'outlined' ? 1 : 0,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      padding: getPaddingValue(),
      overflow: 'hidden',
      width: '100%',
      maxWidth: '100%',
      ...getShadowStyle(),
      ...Platform.select({
        web: {
          backdropFilter: getBlurAmount(),
        },
      }),
    },
    disabled: {
      opacity: 0.6,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerContent: {
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: '#1a1a2e',
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: '#6c757d',
    },
    headerAction: {
      marginLeft: 12,
    },
    content: {
      flex: 1,
    },
    footer: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: '#e2e8f0',
    },
  });

  return (
    <Container
      style={[styles.card, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Header */}
      {(title || subtitle || headerAction) && (
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {title && <RNText style={styles.title}>{title}</RNText>}
            {subtitle && <RNText style={styles.subtitle}>{subtitle}</RNText>}
          </View>
          {headerAction && <View style={styles.headerAction}>{headerAction}</View>}
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>{children}</View>

      {/* Footer */}
      {footer && <View style={styles.footer}>{footer}</View>}
    </Container>
  );
};

export default GlassCard;
