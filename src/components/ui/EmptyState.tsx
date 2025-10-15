/**
 * EmptyState Component
 * Beautiful empty states with illustrations and actions
 * Based on WORLD_CLASS_UI_DESIGN_SYSTEM.md specifications
 *
 * Features:
 * - Pre-built illustrations for common scenarios
 * - Customizable title, description, and actions
 * - Multi-tenant theme support
 * - Optional action buttons
 * - Responsive design
 */

import React from 'react';
import { View, Text as RNText, ViewStyle, StyleSheet } from 'react-native';
import { useTenantTheme } from '../../context/TenantThemeContext';
import { ModernButton } from './ModernButton';

// ============================================================================
// Interfaces
// ============================================================================

export interface EmptyStateProps {
  // Content
  title: string;
  description?: string;
  illustration?: 'transactions' | 'search' | 'notifications' | 'savings' | 'cards' | 'custom' | 'bills' | 'rewards' | 'referrals' | 'analytics';
  customIllustration?: React.ReactNode;

  // Actions
  primaryAction?: {
    label: string;
    onPress: () => void;
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };

  // Styling
  style?: ViewStyle;
  compact?: boolean; // Smaller version for inline use
}

// ============================================================================
// Illustration Components
// ============================================================================

const IllustrationEmoji: React.FC<{ emoji: string; size?: number }> = ({
  emoji,
  size = 80,
}) => {
  return (
    <RNText style={{ fontSize: size, textAlign: 'center', marginBottom: 24 }}>
      {emoji}
    </RNText>
  );
};

const getIllustration = (type: string, size: number = 80): React.ReactNode => {
  const illustrations: Record<string, string> = {
    transactions: '💸',
    search: '🔍',
    notifications: '🔔',
    savings: '🐷',
    cards: '💳',
    bills: '📄',
    rewards: '🎁',
    referrals: '👥',
    analytics: '📊',
    settings: '⚙️',
    security: '🔐',
    support: '💬',
    empty: '📭',
    error: '⚠️',
    success: '✅',
  };

  return <IllustrationEmoji emoji={illustrations[type] || '📭'} size={size} />;
};

// ============================================================================
// EmptyState Component
// ============================================================================

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  illustration = 'empty',
  customIllustration,
  primaryAction,
  secondaryAction,
  style,
  compact = false,
}) => {
  const { theme } = useTenantTheme() as any;

  const containerPadding = compact ? 24 : 40;
  const illustrationSize = compact ? 60 : 80;
  const titleSize = compact ? 18 : 24;
  const descriptionSize = compact ? 14 : 16;

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: containerPadding,
      paddingHorizontal: 20,
    },
    illustrationContainer: {
      marginBottom: compact ? 16 : 24,
    },
    title: {
      fontSize: titleSize,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 8,
      fontFamily: theme.typography.fontFamily,
    },
    description: {
      fontSize: descriptionSize,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: descriptionSize * 1.5,
      marginBottom: 24,
      maxWidth: 400,
      fontFamily: theme.typography.fontFamily,
    },
    actionsContainer: {
      flexDirection: compact ? 'column' : 'row',
      gap: 12,
      width: '100%',
      maxWidth: 400,
    },
    actionButton: {
      flex: compact ? undefined : 1,
      minWidth: compact ? 200 : undefined,
    },
  });

  return (
    <View style={[styles.container, style]}>
      {/* Illustration */}
      <View style={styles.illustrationContainer}>
        {customIllustration || getIllustration(illustration, illustrationSize)}
      </View>

      {/* Title */}
      <RNText style={styles.title}>{title}</RNText>

      {/* Description */}
      {description && <RNText style={styles.description}>{description}</RNText>}

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <View style={styles.actionsContainer}>
          {primaryAction && (
            <ModernButton
              variant="primary"
              size={compact ? 'small' : 'medium'}
              onPress={primaryAction.onPress}
              loading={primaryAction.loading}
              style={styles.actionButton}
            >
              {primaryAction.label}
            </ModernButton>
          )}
          {secondaryAction && (
            <ModernButton
              variant="outline"
              size={compact ? 'small' : 'medium'}
              onPress={secondaryAction.onPress}
              style={styles.actionButton}
            >
              {secondaryAction.label}
            </ModernButton>
          )}
        </View>
      )}
    </View>
  );
};

// ============================================================================
// Pre-built Empty State Variants
// ============================================================================

export const EmptyTransactions: React.FC<Omit<EmptyStateProps, 'title' | 'description' | 'illustration'>> = (props) => (
  <EmptyState
    title="No Transactions Yet"
    description="Your transaction history will appear here once you start making transfers or payments."
    illustration="transactions"
    {...props}
  />
);

export const EmptySearch: React.FC<Omit<EmptyStateProps, 'title' | 'description' | 'illustration'>> = (props) => (
  <EmptyState
    title="No Results Found"
    description="We couldn't find what you're looking for. Try adjusting your search terms or filters."
    illustration="search"
    {...props}
  />
);

export const EmptyNotifications: React.FC<Omit<EmptyStateProps, 'title' | 'description' | 'illustration'>> = (props) => (
  <EmptyState
    title="No Notifications"
    description="You're all caught up! We'll notify you when there's something new."
    illustration="notifications"
    {...props}
  />
);

export const EmptySavings: React.FC<Omit<EmptyStateProps, 'title' | 'description' | 'illustration'>> = (props) => (
  <EmptyState
    title="Start Saving Today"
    description="Create your first savings goal and watch your money grow with competitive interest rates."
    illustration="savings"
    {...props}
  />
);

export const EmptyCards: React.FC<Omit<EmptyStateProps, 'title' | 'description' | 'illustration'>> = (props) => (
  <EmptyState
    title="No Cards Yet"
    description="Request your first virtual or physical card to start shopping online and in stores."
    illustration="cards"
    {...props}
  />
);

export const EmptyBills: React.FC<Omit<EmptyStateProps, 'title' | 'description' | 'illustration'>> = (props) => (
  <EmptyState
    title="No Bills to Pay"
    description="You have no pending bills. Set up recurring payments to never miss a due date."
    illustration="bills"
    {...props}
  />
);

export const EmptyRewards: React.FC<Omit<EmptyStateProps, 'title' | 'description' | 'illustration'>> = (props) => (
  <EmptyState
    title="Start Earning Rewards"
    description="Complete transactions, save money, and refer friends to earn points and unlock exclusive rewards."
    illustration="rewards"
    {...props}
  />
);

export const EmptyReferrals: React.FC<Omit<EmptyStateProps, 'title' | 'description' | 'illustration'>> = (props) => (
  <EmptyState
    title="Invite Your Friends"
    description="Share your referral code and earn rewards when your friends sign up and make their first transaction."
    illustration="referrals"
    {...props}
  />
);

export const EmptyAnalytics: React.FC<Omit<EmptyStateProps, 'title' | 'description' | 'illustration'>> = (props) => (
  <EmptyState
    title="Not Enough Data"
    description="We need more transaction history to generate insights. Keep using your account and check back soon!"
    illustration="analytics"
    {...props}
  />
);

// ============================================================================
// Default Export
// ============================================================================

export default {
  EmptyState,
  EmptyTransactions,
  EmptySearch,
  EmptyNotifications,
  EmptySavings,
  EmptyCards,
  EmptyBills,
  EmptyRewards,
  EmptyReferrals,
  EmptyAnalytics,
};
