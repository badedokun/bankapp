/**
 * ModernButton Component
 * World-class button with micro-interactions and haptic feedback
 * Based on WORLD_CLASS_UI_DESIGN_SYSTEM.md specifications
 *
 * Features:
 * - Multi-tenant theme support
 * - Haptic feedback on press
 * - Loading states with spinner
 * - Icon support (left/right)
 * - Multiple variants (primary, secondary, outline, ghost, danger)
 * - Multiple sizes (small, medium, large)
 * - Glassmorphic variant
 * - Accessibility support
 */

import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
  StyleSheet,
  Animated,
} from 'react-native';
import { useTenantTheme } from '../../context/TenantThemeContext';

// ============================================================================
// Interfaces
// ============================================================================

export interface ModernButtonProps {
  // Content
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;

  // Behavior
  onPress?: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  hapticFeedback?: boolean; // Enable haptic feedback on press

  // Styling
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'glass';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;

  // Accessibility
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

// ============================================================================
// ModernButton Component
// ============================================================================

export const ModernButton: React.FC<ModernButtonProps> = ({
  children,
  leftIcon,
  rightIcon,
  onPress,
  disabled = false,
  loading = false,
  hapticFeedback = true,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  style,
  textStyle,
  testID,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { theme } = useTenantTheme();
  const [isPressed, setIsPressed] = useState(false);
  const [scaleValue] = useState(new Animated.Value(1));

  // ============================================================================
  // Haptic Feedback (requires expo-haptics)
  // ============================================================================
  const triggerHaptic = async () => {
    if (!hapticFeedback || Platform.OS === 'web') return;

    try {
      // Dynamically import haptics for React Native only
      const Haptics = await import('expo-haptics');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics not available or not installed
    }
  };

  // ============================================================================
  // Press Handlers with Animation
  // ============================================================================
  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePress = async () => {
    if (disabled || loading || !onPress) return;

    await triggerHaptic();
    await onPress();
  };

  // ============================================================================
  // Size Configuration
  // ============================================================================
  const sizeConfig = {
    small: {
      height: 40,
      paddingHorizontal: 16,
      fontSize: 14,
      iconSize: 16,
      borderRadius: 8,
    },
    medium: {
      height: 52,
      paddingHorizontal: 20,
      fontSize: 16,
      iconSize: 20,
      borderRadius: 12,
    },
    large: {
      height: 60,
      paddingHorizontal: 24,
      fontSize: 18,
      iconSize: 24,
      borderRadius: 14,
    },
  };

  const config = sizeConfig[size];

  // ============================================================================
  // Variant Styles
  // ============================================================================
  const getVariantStyles = (): {
    container: ViewStyle;
    text: TextStyle;
    loader: string;
  } => {
    const baseContainer: ViewStyle = {
      height: config.height,
      paddingHorizontal: config.paddingHorizontal,
      borderRadius: config.borderRadius,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    };

    const baseText: TextStyle = {
      fontSize: config.fontSize,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily,
    };

    switch (variant) {
      case 'primary':
        return {
          container: {
            ...baseContainer,
            backgroundColor: theme.colors.primary,
            ...Platform.select({
              ios: {
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              },
              android: { elevation: 4 },
              web: { boxShadow: `0 4px 12px ${theme.colors.primary}40` },
            }),
          },
          text: { ...baseText, color: '#FFFFFF' },
          loader: '#FFFFFF',
        };

      case 'secondary':
        return {
          container: {
            ...baseContainer,
            backgroundColor: theme.colors.secondary,
            ...Platform.select({
              ios: {
                shadowColor: theme.colors.secondary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              },
              android: { elevation: 4 },
              web: { boxShadow: `0 4px 12px ${theme.colors.secondary}40` },
            }),
          },
          text: { ...baseText, color: '#FFFFFF' },
          loader: '#FFFFFF',
        };

      case 'outline':
        return {
          container: {
            ...baseContainer,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: theme.colors.primary,
          },
          text: { ...baseText, color: theme.colors.primary },
          loader: theme.colors.primary,
        };

      case 'ghost':
        return {
          container: {
            ...baseContainer,
            backgroundColor: 'transparent',
          },
          text: { ...baseText, color: theme.colors.primary },
          loader: theme.colors.primary,
        };

      case 'danger':
        return {
          container: {
            ...baseContainer,
            backgroundColor: theme.colors.danger,
            ...Platform.select({
              ios: {
                shadowColor: theme.colors.danger,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              },
              android: { elevation: 4 },
              web: { boxShadow: `0 4px 12px ${theme.colors.danger}40` },
            }),
          },
          text: { ...baseText, color: '#FFFFFF' },
          loader: '#FFFFFF',
        };

      case 'success':
        return {
          container: {
            ...baseContainer,
            backgroundColor: theme.colors.success,
            ...Platform.select({
              ios: {
                shadowColor: theme.colors.success,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              },
              android: { elevation: 4 },
              web: { boxShadow: `0 4px 12px ${theme.colors.success}40` },
            }),
          },
          text: { ...baseText, color: '#FFFFFF' },
          loader: '#FFFFFF',
        };

      case 'glass':
        return {
          container: {
            ...baseContainer,
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.3)',
            ...Platform.select({
              web: {
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              },
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
              },
              android: { elevation: 2 },
            }),
          },
          text: { ...baseText, color: theme.colors.text },
          loader: theme.colors.primary,
        };

      default:
        return {
          container: {
            ...baseContainer,
            backgroundColor: theme.colors.primary,
          },
          text: { ...baseText, color: '#FFFFFF' },
          loader: '#FFFFFF',
        };
    }
  };

  const variantStyles = getVariantStyles();

  // ============================================================================
  // Disabled State
  // ============================================================================
  const disabledStyles: ViewStyle = disabled
    ? {
        opacity: 0.5,
      }
    : {};

  // ============================================================================
  // Pressed State
  // ============================================================================
  const pressedStyles: ViewStyle = isPressed && !disabled && !loading
    ? {
        opacity: 0.8,
      }
    : {};

  // ============================================================================
  // Full Width
  // ============================================================================
  const fullWidthStyle: ViewStyle = fullWidth ? { width: '100%' } : {};

  // ============================================================================
  // Render
  // ============================================================================
  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleValue }] },
        fullWidthStyle,
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
        testID={testID}
        accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
        style={[
          variantStyles.container,
          disabledStyles,
          pressedStyles,
          style,
        ]}
      >
        {/* Left Icon */}
        {leftIcon && !loading && (
          <View style={{ marginRight: 8 }}>{leftIcon}</View>
        )}

        {/* Loading Spinner */}
        {loading && (
          <View style={{ marginRight: 8 }}>
            <ActivityIndicator size="small" color={variantStyles.loader} />
          </View>
        )}

        {/* Text */}
        <RNText style={[variantStyles.text, textStyle]}>
          {children}
        </RNText>

        {/* Right Icon */}
        {rightIcon && !loading && (
          <View style={{ marginLeft: 8 }}>{rightIcon}</View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============================================================================
// Specialized Button Variants (Convenience Components)
// ============================================================================

export const PrimaryButton: React.FC<Omit<ModernButtonProps, 'variant'>> = (props) => (
  <ModernButton variant="primary" {...props} />
);

export const SecondaryButton: React.FC<Omit<ModernButtonProps, 'variant'>> = (props) => (
  <ModernButton variant="secondary" {...props} />
);

export const OutlineButton: React.FC<Omit<ModernButtonProps, 'variant'>> = (props) => (
  <ModernButton variant="outline" {...props} />
);

export const GhostButton: React.FC<Omit<ModernButtonProps, 'variant'>> = (props) => (
  <ModernButton variant="ghost" {...props} />
);

export const DangerButton: React.FC<Omit<ModernButtonProps, 'variant'>> = (props) => (
  <ModernButton variant="danger" {...props} />
);

export const SuccessButton: React.FC<Omit<ModernButtonProps, 'variant'>> = (props) => (
  <ModernButton variant="success" {...props} />
);

export const GlassButton: React.FC<Omit<ModernButtonProps, 'variant'>> = (props) => (
  <ModernButton variant="glass" {...props} />
);

// ============================================================================
// Default Export
// ============================================================================

export default ModernButton;
