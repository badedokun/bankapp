/**
 * Custom Button Component
 * Tenant-aware button with consistent styling
 */

import React from 'react';
import {
  TouchableOpacity,
  Text as RNText,
  StyleSheet,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
} from 'react-native';
import { useTenantTheme } from '../../context/TenantThemeContext';

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
  const { theme } = useTenantTheme();

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
          paddingHorizontal: 12,
          paddingVertical: 8,
        };
      case 'medium':
        return {
          paddingHorizontal: 16,
          paddingVertical: 12,
        };
      case 'large':
        return {
          paddingHorizontal: 20,
          paddingVertical: 16,
        };
      default:
        return {
          paddingHorizontal: 16,
          paddingVertical: 12,
        };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'medium':
        return 16;
      case 'large':
        return 18;
      default:
        return 16;
    }
  };

  const styles = StyleSheet.create({
    button: {
      backgroundColor: getBackgroundColor(),
      borderRadius: 8,
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
      fontWeight: '600' as any,
      color: getTextColor(),
      textAlign: 'center',
    },
    leftIcon: {
      marginRight: 8,
    },
    rightIcon: {
      marginLeft: 8,
    },
    loader: {
      marginRight: 8,
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
        <RNText style={styles.text}>{title}</RNText>
        {!loading && rightIcon && (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default Button;