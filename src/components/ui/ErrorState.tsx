/**
 * ErrorState Component
 * Beautiful error states with retry logic and troubleshooting
 * Based on WORLD_CLASS_UI_DESIGN_SYSTEM.md specifications
 *
 * Features:
 * - Pre-built error types (network, server, permission, validation)
 * - Retry logic with loading state
 * - Troubleshooting tips
 * - Multi-tenant theme support
 * - Optional action buttons
 */

import React, { useState } from 'react';
import { View, Text as RNText, ViewStyle, StyleSheet, ScrollView } from 'react-native';
import { useTenantTheme } from '../../context/TenantThemeContext';
import { ModernButton } from './ModernButton';

// ============================================================================
// Interfaces
// ============================================================================

export interface ErrorStateProps {
  // Content
  title: string;
  description?: string;
  errorCode?: string;
  errorType?: 'network' | 'server' | 'permission' | 'validation' | 'notfound' | 'custom';
  illustration?: React.ReactNode;

  // Actions
  onRetry?: () => void | Promise<void>;
  retryLabel?: string;
  onSupport?: () => void;
  supportLabel?: string;

  // Troubleshooting
  showTroubleshooting?: boolean;
  troubleshootingSteps?: string[];

  // Styling
  style?: ViewStyle;
  compact?: boolean;
}

// ============================================================================
// Error Type Configurations
// ============================================================================

const errorConfigs = {
  network: {
    emoji: '📡',
    title: 'Connection Problem',
    description: 'Unable to connect to the server. Please check your internet connection and try again.',
    troubleshooting: [
      'Check if you\'re connected to WiFi or mobile data',
      'Try turning airplane mode on and off',
      'Restart your device',
      'Contact your internet service provider',
    ],
  },
  server: {
    emoji: '🔧',
    title: 'Server Error',
    description: 'Something went wrong on our end. We\'re working to fix it. Please try again in a few moments.',
    troubleshooting: [
      'Wait a few minutes and try again',
      'Check our status page for updates',
      'Clear app cache and try again',
      'Contact support if the issue persists',
    ],
  },
  permission: {
    emoji: '🔒',
    title: 'Access Denied',
    description: 'You don\'t have permission to access this resource. Contact your administrator if you need access.',
    troubleshooting: [
      'Verify you\'re logged into the correct account',
      'Contact your account administrator',
      'Check if your subscription is active',
      'Review your account permissions',
    ],
  },
  validation: {
    emoji: '⚠️',
    title: 'Invalid Input',
    description: 'Please check the information you entered and try again.',
    troubleshooting: [
      'Review all required fields',
      'Check for formatting errors',
      'Ensure all data is within valid ranges',
      'Remove any special characters if not allowed',
    ],
  },
  notfound: {
    emoji: '🔍',
    title: 'Not Found',
    description: 'The page or resource you\'re looking for doesn\'t exist or has been moved.',
    troubleshooting: [
      'Check the URL for typos',
      'Go back to the previous page',
      'Return to the home screen',
      'Search for what you\'re looking for',
    ],
  },
};

// ============================================================================
// Illustration Component
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

// ============================================================================
// ErrorState Component
// ============================================================================

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  description,
  errorCode,
  errorType = 'custom',
  illustration,
  onRetry,
  retryLabel = 'Try Again',
  onSupport,
  supportLabel = 'Contact Support',
  showTroubleshooting = false,
  troubleshootingSteps,
  style,
  compact = false,
}) => {
  const { theme } = useTenantTheme();
  const [isRetrying, setIsRetrying] = useState(false);

  // Get error config
  const config = errorType !== 'custom' ? errorConfigs[errorType] : null;
  const finalTitle = title || config?.title || 'Error';
  const finalDescription = description || config?.description;
  const finalTroubleshooting = troubleshootingSteps || config?.troubleshooting;
  const finalIllustration = illustration || (config ? <IllustrationEmoji emoji={config.emoji} size={compact ? 60 : 80} /> : null);

  const containerPadding = compact ? 24 : 40;
  const titleSize = compact ? 18 : 24;
  const descriptionSize = compact ? 14 : 16;

  // Retry handler
  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;

    setIsRetrying(true);
    try {
      await onRetry();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

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
      color: theme.colors.danger,
      textAlign: 'center',
      marginBottom: 8,
      fontFamily: theme.typography.fontFamily,
    },
    description: {
      fontSize: descriptionSize,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: descriptionSize * 1.5,
      marginBottom: 12,
      maxWidth: 400,
      fontFamily: theme.typography.fontFamily,
    },
    errorCode: {
      fontSize: 12,
      color: theme.colors.textLight,
      fontFamily: 'monospace',
      marginBottom: 24,
      padding: 8,
      backgroundColor: theme.colors.background,
      borderRadius: 4,
    },
    actionsContainer: {
      flexDirection: compact ? 'column' : 'row',
      gap: 12,
      width: '100%',
      maxWidth: 400,
      marginBottom: showTroubleshooting ? 24 : 0,
    },
    actionButton: {
      flex: compact ? undefined : 1,
      minWidth: compact ? 200 : undefined,
    },
    troubleshootingContainer: {
      width: '100%',
      maxWidth: 500,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.layout.borderRadius,
      padding: 20,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.warning,
    },
    troubleshootingTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
      fontFamily: theme.typography.fontFamily,
    },
    troubleshootingStep: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 22,
      marginBottom: 8,
      paddingLeft: 20,
      fontFamily: theme.typography.fontFamily,
    },
    stepNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
      marginRight: 8,
    },
  });

  return (
    <ScrollView contentContainerStyle={[styles.container, style]}>
      {/* Illustration */}
      {finalIllustration && (
        <View style={styles.illustrationContainer}>
          {finalIllustration}
        </View>
      )}

      {/* Title */}
      <RNText style={styles.title}>{finalTitle}</RNText>

      {/* Description */}
      {finalDescription && (
        <RNText style={styles.description}>{finalDescription}</RNText>
      )}

      {/* Error Code */}
      {errorCode && (
        <RNText style={styles.errorCode}>Error Code: {errorCode}</RNText>
      )}

      {/* Actions */}
      {(onRetry || onSupport) && (
        <View style={styles.actionsContainer}>
          {onRetry && (
            <ModernButton
              variant="primary"
              size={compact ? 'small' : 'medium'}
              onPress={handleRetry}
              loading={isRetrying}
              style={styles.actionButton}
            >
              {retryLabel}
            </ModernButton>
          )}
          {onSupport && (
            <ModernButton
              variant="outline"
              size={compact ? 'small' : 'medium'}
              onPress={onSupport}
              disabled={isRetrying}
              style={styles.actionButton}
            >
              {supportLabel}
            </ModernButton>
          )}
        </View>
      )}

      {/* Troubleshooting Steps */}
      {showTroubleshooting && finalTroubleshooting && (
        <View style={styles.troubleshootingContainer}>
          <RNText style={styles.troubleshootingTitle}>
            💡 Troubleshooting Tips
          </RNText>
          {finalTroubleshooting.map((step, index) => (
            <View key={index} style={{ flexDirection: 'row', marginBottom: 8 }}>
              <RNText style={styles.stepNumber}>{index + 1}.</RNText>
              <RNText style={[styles.troubleshootingStep, { flex: 1, paddingLeft: 0 }]}>
                {step}
              </RNText>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

// ============================================================================
// Pre-built Error State Variants
// ============================================================================

export const NetworkError: React.FC<Omit<ErrorStateProps, 'errorType'>> = (props) => (
  <ErrorState errorType="network" {...props} />
);

export const ServerError: React.FC<Omit<ErrorStateProps, 'errorType'>> = (props) => (
  <ErrorState errorType="server" {...props} />
);

export const PermissionError: React.FC<Omit<ErrorStateProps, 'errorType'>> = (props) => (
  <ErrorState errorType="permission" {...props} />
);

export const ValidationError: React.FC<Omit<ErrorStateProps, 'errorType'>> = (props) => (
  <ErrorState errorType="validation" {...props} />
);

export const NotFoundError: React.FC<Omit<ErrorStateProps, 'errorType'>> = (props) => (
  <ErrorState errorType="notfound" {...props} />
);

// ============================================================================
// Banking-Specific Error States
// ============================================================================

export const TransactionError: React.FC<Omit<ErrorStateProps, 'title' | 'description' | 'errorType'>> = (props) => (
  <ErrorState
    title="Transaction Failed"
    description="We couldn't process your transaction. Your funds are safe. Please try again or contact support if the problem persists."
    errorType="server"
    showTroubleshooting
    troubleshootingSteps={[
      'Verify you have sufficient balance',
      'Check if the recipient details are correct',
      'Ensure you\'re within your daily transfer limit',
      'Try the transaction again in a few minutes',
    ]}
    {...props}
  />
);

export const InsufficientFundsError: React.FC<Omit<ErrorStateProps, 'title' | 'description'>> = (props) => (
  <ErrorState
    title="Insufficient Balance"
    description="You don't have enough funds in your account to complete this transaction. Please add money and try again."
    illustration={<IllustrationEmoji emoji="💰" />}
    {...props}
  />
);

export const AccountSuspendedError: React.FC<Omit<ErrorStateProps, 'title' | 'description'>> = (props) => (
  <ErrorState
    title="Account Suspended"
    description="Your account has been temporarily suspended. Please contact customer support for assistance."
    errorType="permission"
    illustration={<IllustrationEmoji emoji="🚫" />}
    showTroubleshooting
    troubleshootingSteps={[
      'Check your email for notifications',
      'Verify your account information is up to date',
      'Complete any pending verification steps',
      'Contact support for immediate assistance',
    ]}
    {...props}
  />
);

export const RateLimitError: React.FC<Omit<ErrorStateProps, 'title' | 'description'>> = (props) => (
  <ErrorState
    title="Too Many Requests"
    description="You've made too many requests in a short time. Please wait a few minutes and try again."
    illustration={<IllustrationEmoji emoji="⏱️" />}
    {...props}
  />
);

// ============================================================================
// Default Export
// ============================================================================

export default {
  ErrorState,
  NetworkError,
  ServerError,
  PermissionError,
  ValidationError,
  NotFoundError,
  TransactionError,
  InsufficientFundsError,
  AccountSuspendedError,
  RateLimitError,
};
