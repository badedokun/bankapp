/**
 * Custom Button Component
 * Tenant-aware button with consistent styling
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
} from 'react-native';
import { useTenantTheme } from '@/tenants/TenantContext';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  style,
  ...props
}) => {
  const theme = useTenantTheme();

  const getBackgroundColor = () => {
    if (disabled) return '#e0e0e0';
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.secondary;
      case 'outline':
        return 'transparent';
      case 'ghost':
        return 'transparent';
      default:
        return theme.colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return '#999';
    switch (variant) {
      case 'primary':
      case 'secondary':
        return '#ffffff';
      case 'outline':
      case 'ghost':
        return theme.colors.primary;
      default:
        return '#ffffff';
    }
  };

  const getBorderColor = () => {
    if (disabled) return '#e0e0e0';
    switch (variant) {
      case 'outline':
        return theme.colors.primary;
      default:
        return 'transparent';
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
        };
      case 'medium':
        return {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
        };
      case 'large':
        return {
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.lg,
        };
      default:
        return {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
        };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return theme.typography.sizes.sm;
      case 'medium':
        return theme.typography.sizes.md;
      case 'large':
        return theme.typography.sizes.lg;
      default:
        return theme.typography.sizes.md;
    }
  };

  const styles = StyleSheet.create({
    button: {
      backgroundColor: getBackgroundColor(),
      borderRadius: theme.borderRadius.md,
      borderWidth: variant === 'outline' ? 2 : 0,
      borderColor: getBorderColor(),
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      minHeight: 48,
      width: fullWidth ? '100%' : undefined,
      ...getPadding(),
    },
    buttonPressed: {
      opacity: 0.8,
      transform: [{ scale: 0.98 }],
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      fontSize: getFontSize(),
      fontWeight: theme.typography.weights.semibold as any,
      color: getTextColor(),
      textAlign: 'center',
    },
    leftIcon: {
      marginRight: theme.spacing.sm,
    },
    rightIcon: {
      marginLeft: theme.spacing.sm,
    },
    loader: {
      marginRight: theme.spacing.sm,
    },
  });

  return (
    <TouchableOpacity
      {...props}
      style={[styles.button, disabled && styles.buttonDisabled, style]}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {loading && (
          <ActivityIndicator
            size="small"
            color={getTextColor()}
            style={styles.loader}
          />
        )}
        {!loading && leftIcon && (
          <View style={styles.leftIcon}>{leftIcon}</View>
        )}
        <Text style={styles.text}>{title}</Text>
        {!loading && rightIcon && (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default Button;