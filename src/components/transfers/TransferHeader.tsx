/**
 * Transfer Header Component
 * Shared header for transfer screens with step indicator
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useTenantTheme } from '../../tenants/TenantContext';
import { TransferStep } from '../../types/transfers';

interface TransferHeaderProps {
  title: string;
  subtitle?: string;
  currentStep?: TransferStep;
  totalSteps?: number;
  onBack?: () => void;
  showSteps?: boolean;
}

const stepLabels: Record<TransferStep, string> = {
  select: 'Select',
  details: 'Details',
  review: 'Review',
  verify: 'Verify',
  complete: 'Complete',
};

const stepOrder: TransferStep[] = ['select', 'details', 'review', 'verify', 'complete'];

export const TransferHeader: React.FC<TransferHeaderProps> = ({
  title,
  subtitle,
  currentStep,
  totalSteps = 5,
  onBack,
  showSteps = true,
}) => {
  const theme = useTenantTheme();

  const currentStepIndex = currentStep ? stepOrder.indexOf(currentStep) : 0;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.primary,
      paddingTop: Platform.OS === 'ios' ? 50 : 20,
      paddingBottom: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: showSteps ? theme.spacing.md : 0,
    },
    backButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      width: 40,
      height: 40,
      borderRadius: 20, // Circular button
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    backButtonText: {
      color: '#ffffff',
      fontSize: 20,
      fontWeight: '600',
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.bold as any,
      color: '#ffffff',
      marginBottom: subtitle ? theme.spacing.xs : 0,
    },
    subtitle: {
      fontSize: theme.typography.sizes.sm,
      color: 'rgba(255, 255, 255, 0.9)',
    },
    stepsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: theme.spacing.md,
    },
    stepItem: {
      alignItems: 'center',
      flex: 1,
    },
    stepCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    stepCircleActive: {
      backgroundColor: '#ffffff',
    },
    stepCircleCompleted: {
      backgroundColor: theme.colors.success || '#4CAF50',
    },
    stepNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: '#ffffff',
    },
    stepNumberActive: {
      color: theme.colors.primary,
    },
    stepLabel: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
    },
    stepLabelActive: {
      color: '#ffffff',
      fontWeight: '600',
    },
    stepConnector: {
      position: 'absolute',
      top: 16,
      left: '50%',
      right: '-50%',
      height: 2,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      zIndex: -1,
    },
    stepConnectorCompleted: {
      backgroundColor: '#ffffff',
    },
  });

  const renderStepIndicator = () => {
    if (!showSteps || !currentStep) return null;

    return (
      <View style={styles.stepsContainer}>
        {stepOrder.slice(0, totalSteps).map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;

          return (
            <View key={step} style={styles.stepItem}>
              {index > 0 && (
                <View
                  style={[
                    styles.stepConnector,
                    isCompleted && styles.stepConnectorCompleted,
                  ]}
                />
              )}
              <View
                style={[
                  styles.stepCircle,
                  isActive && styles.stepCircleActive,
                  isCompleted && styles.stepCircleCompleted,
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    isActive && styles.stepNumberActive,
                  ]}
                >
                  {isCompleted ? '✓' : index + 1}
                </Text>
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  isActive && styles.stepLabelActive,
                ]}
              >
                {stepLabels[step]}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {renderStepIndicator()}
    </View>
  );
};

export default TransferHeader;