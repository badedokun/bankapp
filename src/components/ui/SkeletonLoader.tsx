/**
 * SkeletonLoader Component
 * Animated skeleton loading states for better perceived performance
 * Based on WORLD_CLASS_UI_DESIGN_SYSTEM.md specifications
 *
 * Features:
 * - Shimmer animation effect
 * - Multiple shape variants (rectangle, circle, text)
 * - Composable skeleton patterns
 * - Multi-tenant theme support
 * - Responsive sizing
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle, StyleSheet, Easing } from 'react-native';
import { useTenantTheme } from '../../context/TenantThemeContext';

// ============================================================================
// Interfaces
// ============================================================================

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  variant?: 'rectangle' | 'circle' | 'text';
  animated?: boolean;
}

export interface SkeletonCardProps {
  lines?: number;
  style?: ViewStyle;
  showAvatar?: boolean;
}

export interface SkeletonTransactionProps {
  count?: number;
  style?: ViewStyle;
}

// ============================================================================
// Base Skeleton Component
// ============================================================================

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  variant = 'rectangle',
  animated = true,
}) => {
  const { theme } = useTenantTheme();
  const shimmerValue = useRef(new Animated.Value(0)).current;

  // Shimmer animation
  useEffect(() => {
    if (!animated) return;

    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );

    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerValue, animated]);

  // Shimmer opacity interpolation
  const opacity = shimmerValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  // Variant-specific styles
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'circle':
        const circleSize = typeof height === 'number' ? height : 40;
        return {
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
        };
      case 'text':
        return {
          width,
          height: typeof height === 'number' ? height : 16,
          borderRadius: 4,
        };
      case 'rectangle':
      default:
        return {
          width,
          height,
          borderRadius,
        };
    }
  };

  const baseStyle: ViewStyle = {
    backgroundColor: theme.colors.border || '#E5E7EB',
    overflow: 'hidden',
  };

  return (
    <View style={[baseStyle, getVariantStyle(), style]}>
      {animated && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#F9FAFB',
              opacity,
            },
          ]}
        />
      )}
    </View>
  );
};

// ============================================================================
// Skeleton Card Pattern
// ============================================================================

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  lines = 3,
  style,
  showAvatar = false,
}) => {
  const { theme } = useTenantTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          padding: 16,
          borderRadius: theme.layout.borderRadius,
          marginBottom: 12,
        },
        style,
      ]}
    >
      {/* Header with optional avatar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        {showAvatar && (
          <Skeleton
            variant="circle"
            height={40}
            style={{ marginRight: 12 }}
          />
        )}
        <View style={{ flex: 1 }}>
          <Skeleton width="70%" height={16} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>

      {/* Content lines */}
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '60%' : '100%'}
          height={14}
          style={{ marginBottom: 8 }}
        />
      ))}
    </View>
  );
};

// ============================================================================
// Skeleton Transaction List Pattern
// ============================================================================

export const SkeletonTransaction: React.FC = () => {
  const { theme } = useTenantTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      {/* Icon */}
      <Skeleton variant="circle" height={48} style={{ marginRight: 12 }} />

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Skeleton width="60%" height={16} style={{ marginBottom: 6 }} />
        <Skeleton width="40%" height={12} />
      </View>

      {/* Amount */}
      <View style={{ alignItems: 'flex-end' }}>
        <Skeleton width={80} height={18} style={{ marginBottom: 4 }} />
        <Skeleton width={60} height={12} />
      </View>
    </View>
  );
};

export const SkeletonTransactionList: React.FC<SkeletonTransactionProps> = ({
  count = 5,
  style,
}) => {
  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonTransaction key={index} />
      ))}
    </View>
  );
};

// ============================================================================
// Skeleton Dashboard Pattern
// ============================================================================

export const SkeletonDashboard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { theme } = useTenantTheme();

  return (
    <View style={[{ padding: 20 }, style]}>
      {/* Header */}
      <View style={{ marginBottom: 24 }}>
        <Skeleton width="50%" height={24} style={{ marginBottom: 8 }} />
        <Skeleton width="30%" height={16} />
      </View>

      {/* Balance Card */}
      <View
        style={{
          backgroundColor: theme.colors.surface,
          padding: 20,
          borderRadius: theme.layout.borderRadiusLarge,
          marginBottom: 24,
        }}
      >
        <Skeleton width="40%" height={14} style={{ marginBottom: 12 }} />
        <Skeleton width="60%" height={40} style={{ marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Skeleton width={100} height={36} borderRadius={8} />
          <Skeleton width={100} height={36} borderRadius={8} />
        </View>
      </View>

      {/* Quick Stats Grid */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[1, 2, 3, 4].map((item) => (
          <View
            key={item}
            style={{
              flex: 1,
              minWidth: '45%',
              backgroundColor: theme.colors.surface,
              padding: 16,
              borderRadius: theme.layout.borderRadius,
            }}
          >
            <Skeleton width="50%" height={12} style={{ marginBottom: 8 }} />
            <Skeleton width="70%" height={24} />
          </View>
        ))}
      </View>

      {/* Transactions */}
      <Skeleton width="40%" height={20} style={{ marginBottom: 16 }} />
      <SkeletonTransactionList count={4} />
    </View>
  );
};

// ============================================================================
// Skeleton Form Pattern
// ============================================================================

export const SkeletonForm: React.FC<{ fields?: number; style?: ViewStyle }> = ({
  fields = 4,
  style,
}) => {
  const { theme } = useTenantTheme();

  return (
    <View style={[{ padding: 20 }, style]}>
      {Array.from({ length: fields }).map((_, index) => (
        <View key={index} style={{ marginBottom: 20 }}>
          {/* Label */}
          <Skeleton width="30%" height={14} style={{ marginBottom: 8 }} />
          {/* Input */}
          <Skeleton
            width="100%"
            height={52}
            borderRadius={theme.layout.borderRadius}
          />
        </View>
      ))}

      {/* Submit Button */}
      <Skeleton
        width="100%"
        height={52}
        borderRadius={theme.layout.borderRadius}
        style={{ marginTop: 8 }}
      />
    </View>
  );
};

// ============================================================================
// Skeleton Profile Pattern
// ============================================================================

export const SkeletonProfile: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { theme } = useTenantTheme();

  return (
    <View style={[{ padding: 20, alignItems: 'center' }, style]}>
      {/* Avatar */}
      <Skeleton variant="circle" height={100} style={{ marginBottom: 16 }} />

      {/* Name */}
      <Skeleton width={200} height={24} style={{ marginBottom: 8 }} />

      {/* Email */}
      <Skeleton width={150} height={16} style={{ marginBottom: 24 }} />

      {/* Info Cards */}
      <View style={{ width: '100%' }}>
        {[1, 2, 3].map((item) => (
          <View
            key={item}
            style={{
              backgroundColor: theme.colors.surface,
              padding: 16,
              borderRadius: theme.layout.borderRadius,
              marginBottom: 12,
            }}
          >
            <Skeleton width="40%" height={14} style={{ marginBottom: 8 }} />
            <Skeleton width="60%" height={18} />
          </View>
        ))}
      </View>
    </View>
  );
};

// ============================================================================
// Skeleton Chart Pattern
// ============================================================================

export const SkeletonChart: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { theme } = useTenantTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          padding: 20,
          borderRadius: theme.layout.borderRadiusLarge,
        },
        style,
      ]}
    >
      {/* Header */}
      <Skeleton width="50%" height={20} style={{ marginBottom: 16 }} />

      {/* Chart Bars */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          height: 200,
          marginBottom: 12,
        }}
      >
        {[60, 80, 100, 70, 90, 85, 95].map((height, index) => (
          <Skeleton
            key={index}
            width={30}
            height={`${height}%`}
            borderRadius={4}
          />
        ))}
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <Skeleton width={80} height={12} />
        <Skeleton width={80} height={12} />
        <Skeleton width={80} height={12} />
      </View>
    </View>
  );
};

// ============================================================================
// Default Export
// ============================================================================

export default {
  Skeleton,
  SkeletonCard,
  SkeletonTransaction,
  SkeletonTransactionList,
  SkeletonDashboard,
  SkeletonForm,
  SkeletonProfile,
  SkeletonChart,
};
