/**
 * Achievement Badge Component
 * Individual achievement card showing unlock status, icon, description, and points
 * Inspired by Nubank's achievement system
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTenantTheme } from '../../context/TenantThemeContext';
import Typography from '../ui/Typography';

// ============================================================================
// Interfaces
// ============================================================================

interface AchievementBadgeProps {
  achievement: {
    code: string;
    name: string;
    description: string;
    category: 'savings' | 'spending' | 'loyalty' | 'transactions' | 'referral' | 'special';
    icon: string;
    badgeColor: string;
    pointsReward: number;
    isSecret?: boolean;
  };
  unlocked: boolean;
  unlockedAt?: Date;
  compact?: boolean;
  onPress?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  unlocked,
  unlockedAt,
  compact = false,
  onPress,
}) => {
  const { theme } = useTenantTheme();

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      savings: 'Savings',
      spending: 'Spending',
      loyalty: 'Loyalty',
      transactions: 'Transactions',
      referral: 'Referral',
      special: 'Special',
    };
    return labels[category] || category;
  };

  if (compact) {
    return (
      <View
        style={[
          styles.compactContainer,
          {
            backgroundColor: unlocked
              ? achievement.badgeColor + '20'
              : theme.colors.surface,
            borderColor: unlocked ? achievement.badgeColor : theme.colors.border,
          },
        ]}
      >
        <View style={styles.compactIconContainer}>
          <Typography.HeadlineMedium
            style={{
              opacity: unlocked ? 1 : 0.3,
              filter: unlocked ? 'none' : 'grayscale(1)',
            }}
          >
            {achievement.icon}
          </Typography.HeadlineMedium>
        </View>
        <View style={styles.compactInfo}>
          <Typography.LabelMedium
            color={unlocked ? achievement.badgeColor : theme.colors.textSecondary}
            style={{ fontWeight: '600' }}
          >
            {achievement.name}
          </Typography.LabelMedium>
          <Typography.Caption color={theme.colors.textLight}>
            +{achievement.pointsReward} pts
          </Typography.Caption>
        </View>
        {unlocked && (
          <View style={styles.checkmark}>
            <Typography.BodyMedium>✓</Typography.BodyMedium>
          </View>
        )}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: unlocked ? achievement.badgeColor : theme.colors.border,
          borderWidth: unlocked ? 2 : 1,
        },
      ]}
    >
      {/* Badge Icon */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: unlocked
              ? achievement.badgeColor + '20'
              : theme.colors.background,
            borderColor: unlocked ? achievement.badgeColor : theme.colors.border,
          },
        ]}
      >
        <Typography.DisplaySmall
          style={{
            opacity: unlocked ? 1 : 0.3,
            filter: unlocked ? 'none' : 'grayscale(1)',
          }}
        >
          {achievement.icon}
        </Typography.DisplaySmall>
      </View>

      {/* Achievement Info */}
      <View style={styles.infoContainer}>
        {/* Category Badge */}
        <View
          style={[
            styles.categoryBadge,
            {
              backgroundColor: unlocked
                ? achievement.badgeColor + '15'
                : theme.colors.border + '30',
            },
          ]}
        >
          <Typography.Caption
            color={unlocked ? achievement.badgeColor : theme.colors.textSecondary}
            style={{ fontWeight: '600', textTransform: 'uppercase' }}
          >
            {getCategoryLabel(achievement.category)}
          </Typography.Caption>
        </View>

        {/* Achievement Name */}
        <Typography.TitleMedium
          color={unlocked ? theme.colors.text : theme.colors.textSecondary}
          style={{ fontWeight: '700', marginTop: 8 }}
        >
          {achievement.name}
        </Typography.TitleMedium>

        {/* Description */}
        <Typography.BodySmall
          color={theme.colors.textLight}
          style={{ marginTop: 4, lineHeight: 20 }}
        >
          {achievement.isSecret && !unlocked
            ? '??? Secret achievement - unlock to reveal'
            : achievement.description}
        </Typography.BodySmall>

        {/* Points Reward */}
        <View style={styles.rewardContainer}>
          <Typography.BodyLarge
            color={unlocked ? achievement.badgeColor : theme.colors.textSecondary}
            style={{ fontWeight: '700' }}
          >
            +{achievement.pointsReward}
          </Typography.BodyLarge>
          <Typography.LabelMedium color={theme.colors.textSecondary}>
            points
          </Typography.LabelMedium>
        </View>

        {/* Unlock Status */}
        {unlocked && unlockedAt && (
          <View style={styles.unlockedContainer}>
            <Typography.Caption color={theme.colors.success} style={{ fontWeight: '600' }}>
              ✓ Unlocked {new Date(unlockedAt).toLocaleDateString()}
            </Typography.Caption>
          </View>
        )}

        {/* Locked Status */}
        {!unlocked && (
          <View style={styles.lockedContainer}>
            <Typography.Caption color={theme.colors.textLight}>
              🔒 Locked - Complete the challenge to unlock
            </Typography.Caption>
          </View>
        )}
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  compactIconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    gap: 4,
  },
  compactInfo: {
    flex: 1,
    gap: 2,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 12,
  },
  unlockedContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  lockedContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AchievementBadge;
