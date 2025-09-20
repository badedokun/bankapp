/**
 * OrokiiPay Badge Component
 * Status indicators and notification badges
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { createBadgeStyles } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';

interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  rounded?: boolean;
  dot?: boolean;
  count?: number;
  maxCount?: number;
  children?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  
  // Banking specific
  status?: 'active' | 'pending' | 'approved' | 'rejected' | 'suspended';
  kycLevel?: 1 | 2 | 3;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  rounded = false,
  dot = false,
  count,
  maxCount = 99,
  children,
  style,
  textStyle,
  status,
  kycLevel,
}) => {
  const theme = useTheme();
  const badgeStyles = createBadgeStyles(theme, {
    variant,
    size,
    rounded,
    dot,
  });

  // Handle count display
  const displayCount = count && count > maxCount ? `${maxCount}+` : count;

  // Get status variant
  const getStatusVariant = () => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'suspended':
        return 'error';
      default:
        return variant;
    }
  };

  // Get KYC level color
  const getKycColor = () => {
    switch (kycLevel) {
      case 1:
        return theme.colors.warning[500];
      case 2:
        return theme.colors.info[500];
      case 3:
        return theme.colors.success[500];
      default:
        return theme.colors.neutral[500];
    }
  };

  if (dot) {
    return (
      <View
        style={[
          styles.dot,
          badgeStyles.container,
          { width: 8, height: 8 },
          style,
        ]}
      />
    );
  }

  if (kycLevel) {
    return (
      <View
        style={[
          styles.kycBadge,
          { backgroundColor: getKycColor() },
          style,
        ]}
      >
        <Text style={[styles.kycText, textStyle]}>
          KYC {kycLevel}
        </Text>
      </View>
    );
  }

  const actualVariant = status ? getStatusVariant() : variant;
  const styles = createBadgeStyles(theme, {
    variant: actualVariant,
    size,
    rounded,
  });

  return (
    <View style={[styles.container, badgeStyles.container, style]}>
      <Text style={[styles.text, badgeStyles.text, textStyle]}>
        {status ? status.toUpperCase() : displayCount || children}
      </Text>
    </View>
  );
};

// Notification Badge
export const NotificationBadge: React.FC<{
  count: number;
  maxCount?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  children: React.ReactNode;
}> = ({
  count,
  maxCount = 99,
  position = 'top-right',
  children,
}) => {
  const getPositionStyles = (): ViewStyle => {
    switch (position) {
      case 'top-right':
        return { top: -8, right: -8 };
      case 'top-left':
        return { top: -8, left: -8 };
      case 'bottom-right':
        return { bottom: -8, right: -8 };
      case 'bottom-left':
        return { bottom: -8, left: -8 };
    }
  };

  if (count === 0) {
    return <>{children}</>;
  }

  return (
    <View style={styles.notificationContainer}>
      {children}
      <View style={[styles.notificationBadge, getPositionStyles()]}>
        <Badge
          variant="error"
          size="xs"
          rounded
          count={count}
          maxCount={maxCount}
        />
      </View>
    </View>
  );
};

// Transaction Status Badge
export const TransactionStatusBadge: React.FC<{
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  size?: 'xs' | 'sm' | 'md' | 'lg';
}> = ({ status, size = 'sm' }) => {
  const getVariant = () => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'processing':
        return '⚡';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      case 'cancelled':
        return '🚫';
      default:
        return '';
    }
  };

  return (
    <Badge variant={getVariant()} size={size}>
      {getIcon()} {status.toUpperCase()}
    </Badge>
  );
};

// Account Type Badge
export const AccountTypeBadge: React.FC<{
  type: 'savings' | 'current' | 'business' | 'student' | 'premium';
  size?: 'xs' | 'sm' | 'md' | 'lg';
}> = ({ type, size = 'sm' }) => {
  const getVariant = () => {
    switch (type) {
      case 'premium':
        return 'primary';
      case 'business':
        return 'info';
      case 'student':
        return 'success';
      default:
        return 'default';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'savings':
        return '💰';
      case 'current':
        return '💳';
      case 'business':
        return '💼';
      case 'student':
        return '🎓';
      case 'premium':
        return '⭐';
      default:
        return '';
    }
  };

  return (
    <Badge variant={getVariant()} size={size}>
      {getIcon()} {type.toUpperCase()}
    </Badge>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  dot: {
    borderRadius: 4,
  },
  kycBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  kycText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    zIndex: 1,
  },
});

export default Badge;