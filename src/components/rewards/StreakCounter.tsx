/**
 * Streak Counter Component
 * Displays user activity streaks with fire emoji and count
 * Inspired by Duolingo and Nubank's streak tracking
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTenantTheme } from '../../context/TenantThemeContext';
import Typography from '../ui/Typography';

// ============================================================================
// Interfaces
// ============================================================================

interface StreakCounterProps {
  streakType: 'login' | 'savings' | 'budget' | 'transaction';
  currentCount: number;
  longestCount: number;
  lastActivityDate?: Date;
  compact?: boolean;
  showLongest?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const StreakCounter: React.FC<StreakCounterProps> = ({
  streakType,
  currentCount,
  longestCount,
  lastActivityDate,
  compact = false,
  showLongest = true,
}) => {
  const { theme } = useTenantTheme();

  const getStreakInfo = (type: string) => {
    const info: Record<
      string,
      { icon: string; label: string; color: string; description: string }
    > = {
      login: {
        icon: '🔥',
        label: 'Login Streak',
        color: '#F59E0B',
        description: 'Consecutive days logging in',
      },
      savings: {
        icon: '💰',
        label: 'Savings Streak',
        color: '#10B981',
        description: 'Consecutive days adding to savings',
      },
      budget: {
        icon: '🎯',
        label: 'Budget Streak',
        color: '#6366F1',
        description: 'Consecutive months within budget',
      },
      transaction: {
        icon: '⚡',
        label: 'Activity Streak',
        color: '#3B82F6',
        description: 'Consecutive days with transactions',
      },
    };
    return info[type] || info.login;
  };

  const streakInfo = getStreakInfo(streakType);
  const isActive = currentCount > 0;
  const isPersonalBest = currentCount === longestCount && currentCount > 0;

  const getStreakEmoji = (count: number): string => {
    if (count === 0) return '❄️';
    if (count >= 30) return '🌟';
    if (count >= 14) return '💪';
    if (count >= 7) return '🚀';
    return streakInfo.icon;
  };

  const getStreakMessage = (count: number): string => {
    if (count === 0) return 'Start your streak today!';
    if (count === 1) return 'Great start! Keep it going!';
    if (count >= 30) return 'Legendary streak! 🏆';
    if (count >= 14) return 'Amazing consistency! 💎';
    if (count >= 7) return 'One week strong! 🎉';
    return `${count} day${count !== 1 ? 's' : ''} in a row!`;
  };

  if (compact) {
    return (
      <View
        style={[
          styles.compactContainer,
          {
            backgroundColor: isActive ? streakInfo.color + '20' : theme.colors.surface,
            borderColor: isActive ? streakInfo.color : theme.colors.border,
          },
        ]}
      >
        <View style={styles.compactIconContainer}>
          <Typography.HeadlineMedium>{getStreakEmoji(currentCount)}</Typography.HeadlineMedium>
        </View>
        <View style={styles.compactInfo}>
          <Typography.LabelMedium
            color={isActive ? streakInfo.color : theme.colors.textSecondary}
            style={{ fontWeight: '600' }}
          >
            {currentCount} {streakType === 'budget' ? 'month' : 'day'}
            {currentCount !== 1 ? 's' : ''}
          </Typography.LabelMedium>
          <Typography.Caption color={theme.colors.textLight}>
            {streakInfo.label}
          </Typography.Caption>
        </View>
        {isPersonalBest && currentCount > 1 && (
          <Typography.BodyMedium>🏆</Typography.BodyMedium>
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
          borderColor: isActive ? streakInfo.color : theme.colors.border,
          borderWidth: isActive ? 2 : 1,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isActive ? streakInfo.color + '20' : theme.colors.background,
              borderColor: isActive ? streakInfo.color : theme.colors.border,
            },
          ]}
        >
          <Typography.DisplaySmall>{getStreakEmoji(currentCount)}</Typography.DisplaySmall>
        </View>
        <View style={{ flex: 1 }}>
          <Typography.TitleMedium style={{ fontWeight: '700' }}>
            {streakInfo.label}
          </Typography.TitleMedium>
          <Typography.BodySmall color={theme.colors.textLight}>
            {streakInfo.description}
          </Typography.BodySmall>
        </View>
      </View>

      {/* Current Streak */}
      <View style={styles.streakDisplay}>
        <View style={styles.streakNumber}>
          <Typography.DisplayLarge
            color={isActive ? streakInfo.color : theme.colors.textSecondary}
            style={{ fontWeight: '800', lineHeight: 60 }}
          >
            {currentCount}
          </Typography.DisplayLarge>
          <Typography.LabelMedium color={theme.colors.textSecondary}>
            {streakType === 'budget' ? 'month' : 'day'}
            {currentCount !== 1 ? 's' : ''}
          </Typography.LabelMedium>
        </View>
        <Typography.BodyMedium
          color={isActive ? streakInfo.color : theme.colors.textSecondary}
          style={{ fontWeight: '600', textAlign: 'center' }}
        >
          {getStreakMessage(currentCount)}
        </Typography.BodyMedium>
      </View>

      {/* Personal Best Badge */}
      {isPersonalBest && currentCount > 1 && (
        <View
          style={[
            styles.personalBestBadge,
            {
              backgroundColor: '#F59E0B' + '20',
            },
          ]}
        >
          <Typography.LabelMedium color="#F59E0B" style={{ fontWeight: '600' }}>
            🏆 Personal Best!
          </Typography.LabelMedium>
        </View>
      )}

      {/* Longest Streak */}
      {showLongest && longestCount > 0 && !isPersonalBest && (
        <View style={styles.longestStreak}>
          <Typography.Caption color={theme.colors.textLight}>
            Longest streak: {longestCount} {streakType === 'budget' ? 'month' : 'day'}
            {longestCount !== 1 ? 's' : ''}
          </Typography.Caption>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((currentCount / longestCount) * 100, 100)}%`,
                  backgroundColor: streakInfo.color,
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Last Activity */}
      {lastActivityDate && currentCount > 0 && (
        <Typography.Caption
          color={theme.colors.textLight}
          style={{ textAlign: 'center', marginTop: 8 }}
        >
          Last activity: {new Date(lastActivityDate).toLocaleDateString()}
        </Typography.Caption>
      )}

      {/* Motivational Message */}
      {currentCount === 0 && (
        <View
          style={[
            styles.motivationContainer,
            {
              backgroundColor: theme.colors.background,
            },
          ]}
        >
          <Typography.BodySmall color={theme.colors.textLight} style={{ textAlign: 'center' }}>
            💡 Start your streak today and earn bonus points!
          </Typography.BodySmall>
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
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactInfo: {
    flex: 1,
    gap: 2,
  },
  streakDisplay: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  streakNumber: {
    alignItems: 'center',
    gap: 4,
  },
  personalBestBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  longestStreak: {
    gap: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    ...Platform.select({
      web: {
        transition: 'width 0.3s ease-out',
      },
    }),
  },
  motivationContainer: {
    padding: 12,
    borderRadius: 12,
  },
});

export default StreakCounter;
