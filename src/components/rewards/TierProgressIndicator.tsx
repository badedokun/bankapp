/**
 * Tier Progress Indicator Component
 * Visual progress bar showing user's tier progression
 * Inspired by Nubank's tier system
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTenantTheme } from '../../context/TenantThemeContext';
import Typography from '../ui/Typography';

// ============================================================================
// Interfaces
// ============================================================================

interface TierProgressIndicatorProps {
  currentTier: {
    tierName: string;
    tierLevel: number;
    icon: string;
    color: string;
  };
  totalPoints: number;
  pointsToNextTier: number;
  nextTier?: {
    tierName: string;
    pointsRequired: number;
    icon: string;
  };
  compact?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const TierProgressIndicator: React.FC<TierProgressIndicatorProps> = ({
  currentTier,
  totalPoints,
  pointsToNextTier,
  nextTier,
  compact = false,
}) => {
  const { theme } = useTenantTheme();

  // Calculate progress percentage
  const progressPercentage = nextTier
    ? ((totalPoints - (nextTier.pointsRequired - pointsToNextTier)) / pointsToNextTier) * 100
    : 100;

  const clampedProgress = Math.min(Math.max(progressPercentage, 0), 100);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <View style={styles.tierBadgeSmall}>
            <Typography.BodyMedium>{currentTier.icon}</Typography.BodyMedium>
          </View>
          <Typography.LabelMedium color={currentTier.color} style={{ fontWeight: '600' }}>
            {currentTier.tierName}
          </Typography.LabelMedium>
        </View>

        {nextTier && (
          <View style={styles.compactProgress}>
            <View style={[styles.progressBarBackground, { backgroundColor: theme.colors.border }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${clampedProgress}%`,
                    backgroundColor: currentTier.color,
                  },
                ]}
              />
            </View>
            <Typography.Caption color={theme.colors.textLight}>
              {pointsToNextTier.toLocaleString()} to {nextTier.tierName}
            </Typography.Caption>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Current Tier Badge */}
      <View style={styles.tierBadge}>
        <View
          style={[
            styles.tierIconContainer,
            {
              backgroundColor: currentTier.color + '20',
              borderColor: currentTier.color,
            },
          ]}
        >
          <Typography.HeadlineMedium>{currentTier.icon}</Typography.HeadlineMedium>
        </View>
        <View style={styles.tierInfo}>
          <Typography.TitleMedium color={currentTier.color} style={{ fontWeight: '700' }}>
            {currentTier.tierName} Tier
          </Typography.TitleMedium>
          <Typography.BodySmall color={theme.colors.textSecondary}>
            Level {currentTier.tierLevel}
          </Typography.BodySmall>
        </View>
      </View>

      {/* Points Display */}
      <View style={styles.pointsContainer}>
        <Typography.BodyLarge style={{ fontWeight: '600' }}>
          {totalPoints.toLocaleString()}
        </Typography.BodyLarge>
        <Typography.LabelMedium color={theme.colors.textSecondary}>
          Total Points
        </Typography.LabelMedium>
      </View>

      {/* Progress to Next Tier */}
      {nextTier && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Typography.LabelMedium color={theme.colors.textSecondary}>
              Progress to {nextTier.icon} {nextTier.tierName}
            </Typography.LabelMedium>
            <Typography.LabelMedium color={currentTier.color} style={{ fontWeight: '600' }}>
              {Math.round(clampedProgress)}%
            </Typography.LabelMedium>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${clampedProgress}%`,
                  backgroundColor: currentTier.color,
                },
              ]}
            />
          </View>

          {/* Points Remaining */}
          <Typography.Caption color={theme.colors.textLight} style={{ marginTop: 8 }}>
            {pointsToNextTier.toLocaleString()} points to next tier
          </Typography.Caption>
        </View>
      )}

      {/* Max Tier Message */}
      {!nextTier && (
        <View style={[styles.maxTierContainer, { backgroundColor: currentTier.color + '15' }]}>
          <Typography.BodyMedium color={currentTier.color} style={{ fontWeight: '600' }}>
            🏆 You've reached the highest tier!
          </Typography.BodyMedium>
          <Typography.Caption color={theme.colors.textSecondary}>
            Keep earning points to maintain your status
          </Typography.Caption>
        </View>
      )}
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  compactContainer: {
    gap: 8,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierBadgeSmall: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactProgress: {
    gap: 4,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tierIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierInfo: {
    flex: 1,
    gap: 4,
  },
  pointsContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  progressContainer: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    ...Platform.select({
      web: {
        transition: 'width 0.3s ease-out',
      },
    }),
  },
  progressBarBackground: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  maxTierContainer: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
});

export default TierProgressIndicator;
