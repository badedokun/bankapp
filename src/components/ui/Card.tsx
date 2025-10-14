/**
 * OrokiiPay Card Component
 * Reusable card component with design system integration
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { createCardStyles } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { getCurrencySymbol } from '../../utils/currency';
import { useTenantTheme } from '../../tenants/TenantContext';

interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  onPress?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  
  // Header props
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  
  // Footer props
  footer?: React.ReactNode;
  
  // Nigerian banking specific
  isTransaction?: boolean;
  status?: 'pending' | 'completed' | 'failed';
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  size = 'md',
  padding = 'md',
  onPress,
  disabled = false,
  children,
  style,
  title,
  subtitle,
  headerAction,
  footer,
  isTransaction = false,
  status,
}) => {
  const theme = useTheme();
  const cardStyles = createCardStyles(theme, {
    variant,
    size,
    interactive: !!onPress,
    disabled,
  });

  const Container = onPress ? TouchableOpacity : View;

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return theme.colors.success[600];
      case 'failed':
        return theme.colors.error[600];
      case 'pending':
        return theme.colors.warning[600];
      default:
        return theme.colors.neutral[600];
    }
  };

  const getPaddingValue = () => {
    const paddingMap = {
      none: 0,
      sm: theme.spacing.sm,
      md: theme.spacing.md,
      lg: theme.spacing.lg,
      xl: theme.spacing.xl,
    };
    return paddingMap[padding];
  };

  return (
    <Container
      style={[
        styles.container,
        cardStyles.container,
        { padding: getPaddingValue() },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {/* Header Section */}
      {(title || subtitle || headerAction) && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title && (
              <Text style={[styles.title, cardStyles.title]}>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text style={[styles.subtitle, cardStyles.subtitle]}>
                {subtitle}
              </Text>
            )}
          </View>
          {headerAction && (
            <View style={styles.headerAction}>{headerAction}</View>
          )}
        </View>
      )}

      {/* Status Indicator for Transactions */}
      {isTransaction && status && (
        <View style={[styles.statusBar, { backgroundColor: getStatusColor() }]} />
      )}

      {/* Main Content */}
      <View style={styles.content}>{children}</View>

      {/* Footer Section */}
      {footer && (
        <View style={[styles.footer, cardStyles.footer]}>
          {footer}
        </View>
      )}
    </Container>
  );
};

// Specialized Transaction Card
export const TransactionCard: React.FC<{
  amount: string;
  currency?: string;
  recipientName: string;
  recipientBank?: string;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  reference?: string;
  onPress?: () => void;
}> = ({
  amount,
  currency,
  recipientName,
  recipientBank,
  date,
  status,
  reference,
  onPress,
}) => {
  const theme = useTheme();
  const { theme: tenantTheme } = useTenantTheme();
  const currencySymbol = currency ? getCurrencySymbol(currency) : getCurrencySymbol(tenantTheme.currency);
  
  return (
    <Card
      variant="elevated"
      isTransaction={true}
      status={status}
      onPress={onPress}
      padding="md"
    >
      <View style={styles.transactionContent}>
        <View style={styles.transactionMain}>
          <Text style={styles.transactionAmount}>
            {currencySymbol}{amount}
          </Text>
          <Text style={styles.transactionRecipient}>
            {recipientName}
          </Text>
          {recipientBank && (
            <Text style={styles.transactionBank}>{recipientBank}</Text>
          )}
        </View>
        <View style={styles.transactionMeta}>
          <Text style={styles.transactionDate}>{date}</Text>
          {reference && (
            <Text style={styles.transactionRef}>Ref: {reference}</Text>
          )}
        </View>
      </View>
    </Card>
  );
};

// Account Balance Card
export const BalanceCard: React.FC<{
  balance: string;
  currency?: string;
  accountType?: string;
  accountNumber?: string;
  hideBalance?: boolean;
  onToggleVisibility?: () => void;
}> = ({
  balance,
  currency,
  accountType = 'Main Account',
  accountNumber,
  hideBalance = false,
  onToggleVisibility,
}) => {
  const { theme: tenantTheme } = useTenantTheme();
  const currencySymbol = currency ? getCurrencySymbol(currency) : getCurrencySymbol(tenantTheme.currency);
  return (
    <Card
      variant="filled"
      size="lg"
      padding="lg"
      style={styles.balanceCard}
    >
      <View style={styles.balanceContent}>
        <Text style={styles.balanceLabel}>{accountType}</Text>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceAmount}>
            {currencySymbol}
            {hideBalance ? '****' : balance}
          </Text>
          {onToggleVisibility && (
            <TouchableOpacity onPress={onToggleVisibility}>
              <Text style={styles.toggleIcon}>
                {hideBalance ? '👁️' : '👁️‍🗨️'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {accountNumber && (
          <Text style={styles.accountNumber}>
            Account: {accountNumber}
          </Text>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
  },
  headerAction: {
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  statusBar: {
    height: 3,
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 16,
  },
  content: {
    flex: 1,
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  
  // Transaction Card Styles
  transactionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionMain: {
    flex: 1,
  },
  transactionAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  transactionRecipient: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  transactionBank: {
    fontSize: 14,
    opacity: 0.7,
  },
  transactionMeta: {
    alignItems: 'flex-end',
  },
  transactionDate: {
    fontSize: 14,
    opacity: 0.7,
  },
  transactionRef: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  
  // Balance Card Styles
  balanceCard: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  balanceContent: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  toggleIcon: {
    fontSize: 24,
  },
  accountNumber: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 8,
  },
});

export default Card;