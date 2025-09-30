/**
 * Modern Back Button Component
 * Glassmorphic design with icon-only approach
 * Follows Modern UI Design System
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { useTenantTheme } from '../../context/TenantThemeContext';

export interface ModernBackButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  onPress: () => void;
  variant?: 'glass' | 'solid' | 'minimal';
  size?: 'small' | 'medium' | 'large';
  color?: 'light' | 'dark' | 'auto';
  style?: any;
}

const ModernBackButton: React.FC<ModernBackButtonProps> = ({
  onPress,
  variant = 'glass',
  size = 'medium',
  color = 'light',
  style,
  ...props
}) => {
  const { theme } = useTenantTheme();

  // Size configurations
  const sizeConfig = {
    small: {
      width: 32,
      height: 32,
      borderRadius: 16,
      iconSize: 16,
    },
    medium: {
      width: 40,
      height: 40,
      borderRadius: 20,
      iconSize: 20,
    },
    large: {
      width: 48,
      height: 48,
      borderRadius: 24,
      iconSize: 24,
    },
  };

  const currentSize = sizeConfig[size];

  // Color configurations
  const getIconColor = () => {
    switch (color) {
      case 'light':
        return '#FFFFFF';
      case 'dark':
        return theme.colors.text;
      case 'auto':
        return variant === 'solid' ? '#FFFFFF' : '#FFFFFF';
      default:
        return '#FFFFFF';
    }
  };

  // Background configurations
  const getBackgroundStyle = () => {
    switch (variant) {
      case 'glass':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.3)',
          ...Platform.select({
            web: {
              backdropFilter: 'blur(10px)',
            },
          }),
        };
      case 'solid':
        return {
          backgroundColor: theme.colors.primary,
          borderWidth: 0,
        };
      case 'minimal':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
        };
    }
  };

  const styles = StyleSheet.create({
    button: {
      width: currentSize.width,
      height: currentSize.height,
      borderRadius: currentSize.borderRadius,
      justifyContent: 'center',
      alignItems: 'center',
      ...getBackgroundStyle(),
      ...Platform.select({
        web: {
          transition: 'all 0.2s ease',
          cursor: 'pointer',
        },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: variant === 'minimal' ? 0 : 4,
        },
      }),
    },
    buttonPressed: {
      transform: [{ scale: 0.95 }],
      opacity: 0.8,
    },
    icon: {
      fontSize: currentSize.iconSize,
      color: getIconColor(),
      fontWeight: '600',
    },
    // For web hover effect
    buttonHover: Platform.select({
      web: {
        transform: [{ scale: 1.05 }],
        backgroundColor: variant === 'glass'
          ? 'rgba(255, 255, 255, 0.3)'
          : variant === 'solid'
            ? theme.colors.primaryDark || theme.colors.primary
            : 'transparent',
      },
      default: {},
    }),
  });

  const [isPressed, setIsPressed] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <TouchableOpacity
      {...props}
      style={[
        styles.button,
        isPressed && styles.buttonPressed,
        isHovered && styles.buttonHover,
        style,
      ]}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onMouseEnter={() => Platform.OS === 'web' && setIsHovered(true)}
      onMouseLeave={() => Platform.OS === 'web' && setIsHovered(false)}
      activeOpacity={0.8}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Text style={styles.icon}>←</Text>
    </TouchableOpacity>
  );
};

export default ModernBackButton;