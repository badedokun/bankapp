/**
 * Daily Challenge Card Component
 * Challenge card with progress bar, description, and claim button
 * Inspired by Nubank's daily challenge system
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useTenantTheme } from '../../context/TenantThemeContext';
import Typography from '../ui/Typography';
import * as Haptics from 'expo-haptics';

// ============================================================================
// Interfaces
// ============================================================================

interface DailyChallengeCardProps {
  challenge: {
    code: string;
    name: string;
    description: string;
    challengeType: 'daily' | 'weekly' | 'monthly' | 'special';
    category: 'transactional' | 'behavioral' | 'educational' | 'social';
    icon: string;
    pointsReward: number;
    validUntil?: Date;
  };
  progress: number;
  maxProgress: number;
  status: 'active' | 'completed' | 'expired' | 'claimed';
  onClaim?: () => void;
  compact?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const DailyChallengeCard: React.FC<DailyChallengeCardProps> = ({
  challenge,
  progress,
  maxProgress,
  status,
  onClaim,
  compact = false,
}) => {
  const { theme } = useTenantTheme() as any;

  const progressPercentage = Math.min((progress / maxProgress) * 100, 100);
  const isCompleted = status === 'completed';
  const isClaimed = status === 'claimed';
  const isExpired = status === 'expired';

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      daily: '#3B82F6',
      weekly: '#8B5CF6',
      monthly: '#F59E0B',
      special: '#EC4899',
    };
    return colors[type] || theme.colors.primary;
  };

  const getTimeRemaining = (validUntil?: Date): string => {
    if (!validUntil) return '';
    const now = new Date();
    const diff = new Date(validUntil).getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d left`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  };

  const handleClaim = () => {
    if (onClaim && isCompleted && !isClaimed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClaim();
    }
  };

  const typeColor = getTypeColor(challenge.challengeType);

  if (compact) {
    return (
      <View
        style={[
          styles.compactContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: isClaimed ? theme.colors.success : theme.colors.border,
            opacity: isExpired ? 0.5 : 1,
          },
        ]}
      >
        <View style={styles.compactHeader}>
          <Typography.HeadlineMedium>{challenge.icon}</Typography.HeadlineMedium>
          <View style={{ flex: 1 }}>
            <Typography.LabelMedium color={typeColor} style={{ fontWeight: '600' }}>
              {challenge.name}
            </Typography.LabelMedium>
            <Typography.Caption color={theme.colors.textLight}>
              +{challenge.pointsReward} pts
            </Typography.Caption>
          </View>
          {isClaimed && (
            <Typography.BodyMedium color={theme.colors.success}>✓</Typography.BodyMedium>
          )}
        </View>
        <View style={[styles.progressBarSmall, { backgroundColor: theme.colors.border }]}>
          <View
            style={[
              styles.progressFillSmall,
              {
                width: `${progressPercentage}%`,
                backgroundColor: typeColor,
              },
            ]}
          />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: isClaimed ? theme.colors.success : isExpired ? theme.colors.danger : theme.colors.border,
          borderWidth: isClaimed || isExpired ? 2 : 1,
          opacity: isExpired ? 0.7 : 1,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Typography.DisplaySmall>{challenge.icon}</Typography.DisplaySmall>
        </View>
        <View style={{ flex: 1 }}>
          {/* Type Badge */}
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: typeColor + '20',
              },
            ]}
          >
            <Typography.Caption
              color={typeColor}
              style={{ fontWeight: '600', textTransform: 'uppercase' }}
            >
              {challenge.challengeType}
            </Typography.Caption>
          </View>
          {/* Challenge Name */}
          <Typography.TitleMedium style={{ fontWeight: '700', marginTop: 8 }}>
            {challenge.name}
          </Typography.TitleMedium>
        </View>
      </View>

      {/* Description */}
      <Typography.BodySmall color={theme.colors.textLight} style={{ lineHeight: 20 }}>
        {challenge.description}
      </Typography.BodySmall>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Typography.LabelMedium color={theme.colors.textSecondary}>
            Progress
          </Typography.LabelMedium>
          <Typography.LabelMedium color={typeColor} style={{ fontWeight: '600' }}>
            {progress}/{maxProgress}
          </Typography.LabelMedium>
        </View>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPercentage}%`,
                backgroundColor: typeColor,
              },
            ]}
          />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.rewardInfo}>
          <Typography.BodyLarge color={typeColor} style={{ fontWeight: '700' }}>
            +{challenge.pointsReward}
          </Typography.BodyLarge>
          <Typography.LabelMedium color={theme.colors.textSecondary}>
            points
          </Typography.LabelMedium>
        </View>

        {/* Time Remaining */}
        {challenge.validUntil && !isClaimed && !isExpired && (
          <Typography.Caption color={theme.colors.textLight}>
            ⏱️ {getTimeRemaining(challenge.validUntil)}
          </Typography.Caption>
        )}

        {/* Expired Badge */}
        {isExpired && (
          <Typography.Caption color={theme.colors.danger} style={{ fontWeight: '600' }}>
            ⏰ Expired
          </Typography.Caption>
        )}
      </View>

      {/* Claim Button */}
      {isCompleted && !isClaimed && !isExpired && (
        <TouchableOpacity
          style={[
            styles.claimButton,
            {
              backgroundColor: typeColor,
            },
          ]}
          onPress={handleClaim}
          activeOpacity={0.8}
        >
          <Typography.LabelLarge style={{ color: '#FFFFFF', fontWeight: '700' }}>
            🎉 Claim Reward
          </Typography.LabelLarge>
        </TouchableOpacity>
      )}

      {/* Claimed Badge */}
      {isClaimed && (
        <View
          style={[
            styles.claimedBadge,
            {
              backgroundColor: theme.colors.success + '20',
            },
          ]}
        >
          <Typography.LabelMedium color={theme.colors.success} style={{ fontWeight: '600' }}>
            ✓ Reward Claimed
          </Typography.LabelMedium>
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
    borderRadius: 16,
    padding: 20,
    gap: 16,
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  compactContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  progressSection: {
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
  progressBarSmall: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFillSmall: {
    height: '100%',
    borderRadius: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  claimButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      },
    }),
  },
  claimedBadge: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
});

export default DailyChallengeCard;
