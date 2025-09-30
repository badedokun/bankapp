/**
 * Reusable Back Button Component
 * Provides consistent navigation behavior across all screens
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  TouchableOpacityProps,
} from 'react-native';
import { useTenantTheme } from '../../tenants/TenantContext';

export interface BackButtonProps extends TouchableOpacityProps {
  onPress: () => void;
  title?: string;
  variant?: 'primary' | 'transparent' | 'light';
  showArrow?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  title = '', // Modern design: no text by default
  variant = 'transparent',
  showArrow = true,
  size = 'medium',
  style,
  ...props
}) => {
  const theme = useTenantTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'transparent':
        return 'rgba(255, 255, 255, 0.2)';
      case 'light':
        return theme.colors.surface;
      default:
        return 'rgba(255, 255, 255, 0.2)';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return '#ffffff';
      case 'transparent':
        return '#ffffff';
      case 'light':
        return theme.colors.text;
      default:
        return '#ffffff';
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
        };
      case 'medium':
        return {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
        };
      case 'large':
        return {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
        };
      default:
        return {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
        };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return theme.typography.sizes.sm;
      case 'medium':
        return 16;
      case 'large':
        return theme.typography.sizes.lg;
      default:
        return 16;
    }
  };

  const styles = StyleSheet.create({
    button: {
      backgroundColor: getBackgroundColor(),
      borderRadius: title ? 12 : 20, // Circular when no text
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      ...getPadding(),
      // Make it square when no title
      ...((!title && size === 'medium') ? {
        width: 40,
        height: 40,
        paddingHorizontal: 0,
        paddingVertical: 0,
      } : {}),
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    text: {
      color: getTextColor(),
      fontSize: getFontSize(),
      fontWeight: '500',
    },
    arrow: {
      color: getTextColor(),
      fontSize: getFontSize(),
      fontWeight: '500',
    },
  });

  return (
    <TouchableOpacity
      {...props}
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {showArrow && <Text style={styles.arrow}>←</Text>}
        {title ? <Text style={styles.text}>{title}</Text> : null}
      </View>
    </TouchableOpacity>
  );
};

export default BackButton;