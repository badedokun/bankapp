/**
 * OrokiiPay Enhanced Button Component
 * Banking-specific button variants with design system integration
 * Enhanced version of existing Button component with additional banking features
 */

import React from 'react';
import {
  TouchableOpacity,
  TouchableHighlight,
  Text,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { createButtonStyles } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';

interface EnhancedButtonProps {
  onPress: () => void;
  title?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  
  // Banking specific
  secure?: boolean; // For transaction buttons
  amount?: string; // Show amount in button
  currency?: string;
  requiresConfirmation?: boolean;
}

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  style,
  textStyle,
  secure = false,
  amount,
  currency = '₦',
  requiresConfirmation = false,
}) => {
  const theme = useTheme();
  const buttonStyles = createButtonStyles(theme, {
    variant,
    size,
    disabled: disabled || loading,
    fullWidth,
    secure,
  });

  const getLoadingColor = () => {
    switch (variant) {
      case 'outline':
      case 'ghost':
      case 'link':
        return theme.colors.primary[500];
      default:
        return '#ffffff';
    }
  };

  const handlePress = () => {
    if (disabled || loading) return;
    
    if (requiresConfirmation) {
      // Here you could integrate with a confirmation dialog
      // For now, just call onPress
      onPress();
    } else {
      onPress();
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={getLoadingColor()}
            style={styles.loadingIndicator}
          />
          <Text style={[styles.text, buttonStyles.text, textStyle]}>
            Processing...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        {leftIcon && (
          <View style={[styles.icon, styles.leftIcon]}>
            {leftIcon}
          </View>
        )}
        
        <View style={styles.textContainer}>
          {amount && (
            <Text style={[styles.amount, buttonStyles.text, textStyle]}>
              {currency}{amount}
            </Text>
          )}
          
          <Text style={[styles.text, buttonStyles.text, textStyle]}>
            {children || title}
          </Text>
        </View>
        
        {rightIcon && (
          <View style={[styles.icon, styles.rightIcon]}>
            {rightIcon}
          </View>
        )}
        
        {secure && (
          <View style={[styles.icon, styles.rightIcon]}>
            <Text style={[styles.secureIcon, buttonStyles.text]}>🔒</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        buttonStyles.container,
        fullWidth && styles.fullWidth,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

// Icon Button
export const IconButton: React.FC<{
  onPress: () => void;
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  style?: ViewStyle;
}> = ({
  onPress,
  icon,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  style,
}) => {
  const theme = useTheme();
  const buttonStyles = createButtonStyles(theme, {
    variant,
    size,
    disabled,
    iconOnly: true,
  });

  return (
    <TouchableOpacity
      style={[
        styles.iconButton,
        buttonStyles.container,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon}
    </TouchableOpacity>
  );
};

// Floating Action Button
export const FloatingActionButton: React.FC<{
  onPress: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'md' | 'lg';
  style?: ViewStyle;
}> = ({
  onPress,
  icon,
  variant = 'primary',
  size = 'md',
  style,
}) => {
  const theme = useTheme();
  
  const getBackgroundColor = () => {
    switch (variant) {
      case 'secondary':
        return theme.colors.secondary[500];
      case 'success':
        return theme.colors.semantic.success[500];
      case 'danger':
        return theme.colors.semantic.error[500];
      default:
        return theme.colors.primary[500];
    }
  };

  const fabSize = size === 'lg' ? 64 : 56;

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        {
          width: fabSize,
          height: fabSize,
          borderRadius: fabSize / 2,
          backgroundColor: getBackgroundColor(),
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon || <Text style={styles.fabIcon}>+</Text>}
    </TouchableOpacity>
  );
};

// Transaction Button (specialized for banking)
export const TransactionButton: React.FC<{
  onPress: () => void;
  type: 'transfer' | 'deposit' | 'withdraw' | 'pay' | 'request';
  amount?: string;
  currency?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}> = ({
  onPress,
  type,
  amount,
  currency = '₦',
  loading = false,
  disabled = false,
  style,
}) => {
  const getButtonConfig = () => {
    switch (type) {
      case 'transfer':
        return {
          title: 'Send Money',
          icon: '📤',
          variant: 'primary' as const,
        };
      case 'deposit':
        return {
          title: 'Deposit',
          icon: '💰',
          variant: 'success' as const,
        };
      case 'withdraw':
        return {
          title: 'Withdraw',
          icon: '💳',
          variant: 'secondary' as const,
        };
      case 'pay':
        return {
          title: 'Pay Bill',
          icon: '💸',
          variant: 'primary' as const,
        };
      case 'request':
        return {
          title: 'Request Money',
          icon: '📥',
          variant: 'outline' as const,
        };
    }
  };

  const config = getButtonConfig();

  return (
    <EnhancedButton
      onPress={onPress}
      title={config.title}
      variant={config.variant}
      leftIcon={<Text style={styles.transactionIcon}>{config.icon}</Text>}
      amount={amount}
      currency={currency}
      loading={loading}
      disabled={disabled}
      secure={type === 'transfer' || type === 'withdraw'}
      requiresConfirmation={!!amount}
      style={style}
    />
  );
};

// Button Group
export const ButtonGroup: React.FC<{
  buttons: Array<{
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    disabled?: boolean;
    flex?: number;
  }>;
  orientation?: 'horizontal' | 'vertical';
  spacing?: number;
  style?: ViewStyle;
}> = ({
  buttons,
  orientation = 'horizontal',
  spacing = 8,
  style,
}) => {
  return (
    <View style={[
      styles.buttonGroup,
      orientation === 'vertical' && styles.buttonGroupVertical,
      { gap: spacing },
      style,
    ]}>
      {buttons.map((button, index) => (
        <EnhancedButton
          key={index}
          onPress={button.onPress}
          title={button.title}
          variant={button.variant || 'outline'}
          disabled={button.disabled}
          style={[
            orientation === 'horizontal' && { flex: button.flex || 1 },
          ]}
        />
      ))}
    </View>
  );
};

// Quick Action Button
export const QuickActionButton: React.FC<{
  onPress: () => void;
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  badge?: number;
  style?: ViewStyle;
}> = ({
  onPress,
  icon,
  label,
  subtitle,
  badge,
  style,
}) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[styles.quickAction, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.quickActionIconContainer}>
        {icon}
        {badge && badge > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.colors.semantic.error[500] }]}>
            <Text style={styles.badgeText}>
              {badge > 99 ? '99+' : badge.toString()}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.quickActionLabel, { color: theme.computed.text.primary }]}>
        {label}
      </Text>
      {subtitle && (
        <Text style={[styles.quickActionSubtitle, { color: theme.computed.text.secondary }]}>
          {subtitle}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  fullWidth: {
    width: '100%',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  icon: {
    marginHorizontal: 4,
  },
  leftIcon: {
    marginRight: 8,
    marginLeft: 0,
  },
  rightIcon: {
    marginLeft: 8,
    marginRight: 0,
  },
  secureIcon: {
    fontSize: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    marginRight: 8,
  },
  
  // Icon Button
  iconButton: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    minWidth: 44,
    minHeight: 44,
  },
  
  // Floating Action Button
  fab: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fabIcon: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  
  // Transaction Button
  transactionIcon: {
    fontSize: 18,
  },
  
  // Button Group
  buttonGroup: {
    flexDirection: 'row',
  },
  buttonGroupVertical: {
    flexDirection: 'column',
  },
  
  // Quick Action Button
  quickAction: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    minWidth: 80,
  },
  quickActionIconContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 10,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default EnhancedButton;