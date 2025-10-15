/**
 * Rewards Dashboard Component
 * Main container for the complete rewards and gamification system
 * Combines tier progress, achievements, challenges, and streaks
 * Inspired by Nubank's rewards experience
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Platform, TouchableOpacity, RefreshControl } from 'react-native';
import { useTenantTheme } from '../../context/TenantThemeContext';
import Typography from '../ui/Typography';
import TierProgressIndicator from './TierProgressIndicator';
import AchievementBadge from './AchievementBadge';
import DailyChallengeCard from './DailyChallengeCard';
import StreakCounter from './StreakCounter';
import * as Haptics from 'expo-haptics';

// ============================================================================
// Interfaces
// ============================================================================

interface RewardsDashboardProps {
  userId: string;
  onRefresh?: () => void;
  compact?: boolean;
}

interface UserRewardsData {
  tier: {
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
  achievements: Array<{
    code: string;
    name: string;
    description: string;
    category: 'savings' | 'spending' | 'loyalty' | 'transactions' | 'referral' | 'special';
    icon: string;
    badgeColor: string;
    pointsReward: number;
    isSecret?: boolean;
    unlocked: boolean;
    unlockedAt?: Date;
  }>;
  challenges: Array<{
    code: string;
    name: string;
    description: string;
    challengeType: 'daily' | 'weekly' | 'monthly' | 'special';
    category: 'transactional' | 'behavioral' | 'educational' | 'social';
    icon: string;
    pointsReward: number;
    validUntil?: Date;
    progress: number;
    maxProgress: number;
    status: 'active' | 'completed' | 'expired' | 'claimed';
  }>;
  streaks: Array<{
    streakType: 'login' | 'savings' | 'budget' | 'transaction';
    currentCount: number;
    longestCount: number;
    lastActivityDate?: Date;
  }>;
}

// ============================================================================
// Component
// ============================================================================

export const RewardsDashboard: React.FC<RewardsDashboardProps> = ({
  userId,
  onRefresh,
  compact = false,
}) => {
  const { theme } = useTenantTheme() as any;
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'achievements' | 'challenges' | 'streaks'>('achievements');
  const [rewardsData, setRewardsData] = useState<UserRewardsData | null>(null);

  // Load rewards data from API
  useEffect(() => {
    loadRewardsData();
  }, [userId]);

  const loadRewardsData = async () => {
    setLoading(true);
    try {
      // Fetch rewards data from API
      const response = await fetch(`/api/rewards/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch rewards data');
      }

      const result = await response.json();

      if (result.success && result.data) {
        const { userRewards, achievements, challenges, streaks } = result.data;

        // For now, using mock data until API is fully tested
        setRewardsData({
          tier: {
          tierName: 'Silver',
          tierLevel: 2,
          icon: '🥈',
          color: '#C0C0C0',
        },
        totalPoints: 1500,
        pointsToNextTier: 3500,
        nextTier: {
          tierName: 'Gold',
          pointsRequired: 5000,
          icon: '🥇',
        },
        achievements: [
          {
            code: 'first_transfer',
            name: 'First Transfer',
            description: 'Complete your first money transfer',
            category: 'transactions',
            icon: '💸',
            badgeColor: '#3B82F6',
            pointsReward: 50,
            unlocked: true,
            unlockedAt: new Date('2025-09-15'),
          },
          {
            code: 'savings_starter',
            name: 'Savings Starter',
            description: 'Save your first ₦10,000',
            category: 'savings',
            icon: '🌱',
            badgeColor: '#10B981',
            pointsReward: 100,
            unlocked: true,
            unlockedAt: new Date('2025-09-20'),
          },
          {
            code: 'transfer_master',
            name: 'Transfer Master',
            description: 'Complete 100 transfers',
            category: 'transactions',
            icon: '🚀',
            badgeColor: '#8B5CF6',
            pointsReward: 500,
            unlocked: false,
          },
        ],
        challenges: [
          {
            code: 'daily_login',
            name: 'Daily Login',
            description: 'Log in to your account today',
            challengeType: 'daily',
            category: 'behavioral',
            icon: '🌅',
            pointsReward: 10,
            validUntil: new Date(Date.now() + 8 * 60 * 60 * 1000),
            progress: 1,
            maxProgress: 1,
            status: 'completed',
          },
          {
            code: 'make_transfer',
            name: 'Make a Transfer',
            description: 'Complete at least one transfer today',
            challengeType: 'daily',
            category: 'transactional',
            icon: '💰',
            pointsReward: 25,
            validUntil: new Date(Date.now() + 8 * 60 * 60 * 1000),
            progress: 0,
            maxProgress: 1,
            status: 'active',
          },
        ],
        streaks: [
          {
            streakType: 'login',
            currentCount: 7,
            longestCount: 12,
            lastActivityDate: new Date(),
          },
          {
            streakType: 'savings',
            currentCount: 3,
            longestCount: 5,
            lastActivityDate: new Date(),
          },
        ],
        });
      }
    } catch (error) {
      console.error('Failed to load rewards data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadRewardsData();
    onRefresh?.();
  };

  const handleTabChange = (tab: 'achievements' | 'challenges' | 'streaks') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTab(tab);
  };

  const handleClaimChallenge = async (challengeCode: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: Implement challenge claim API call
    await loadRewardsData();
  };

  if (!rewardsData) {
    return (
      <View style={styles.loadingContainer}>
        <Typography.BodyLarge color={theme.colors.textSecondary}>
          Loading rewards...
        </Typography.BodyLarge>
      </View>
    );
  }

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <TierProgressIndicator
          currentTier={rewardsData.tier}
          totalPoints={rewardsData.totalPoints}
          pointsToNextTier={rewardsData.pointsToNextTier}
          nextTier={rewardsData.nextTier}
          compact={true}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Typography.HeadlineLarge style={{ fontWeight: '800' }}>
          Rewards 🎉
        </Typography.HeadlineLarge>
        <Typography.BodyMedium color={theme.colors.textSecondary}>
          Track your progress and earn rewards
        </Typography.BodyMedium>
      </View>

      {/* Tier Progress */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <TierProgressIndicator
          currentTier={rewardsData.tier}
          totalPoints={rewardsData.totalPoints}
          pointsToNextTier={rewardsData.pointsToNextTier}
          nextTier={rewardsData.nextTier}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'achievements' && [
              styles.activeTab,
              { borderBottomColor: theme.colors.primary },
            ],
          ]}
          onPress={() => handleTabChange('achievements')}
        >
          <Typography.LabelLarge
            color={selectedTab === 'achievements' ? theme.colors.primary : theme.colors.textSecondary}
            style={{ fontWeight: selectedTab === 'achievements' ? '700' : '500' }}
          >
            Achievements
          </Typography.LabelLarge>
          <View
            style={[
              styles.badge,
              { backgroundColor: selectedTab === 'achievements' ? theme.colors.primary : theme.colors.border },
            ]}
          >
            <Typography.Caption
              style={{ color: selectedTab === 'achievements' ? '#FFFFFF' : theme.colors.textSecondary }}
            >
              {rewardsData.achievements.filter(a => a.unlocked).length}/{rewardsData.achievements.length}
            </Typography.Caption>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'challenges' && [
              styles.activeTab,
              { borderBottomColor: theme.colors.primary },
            ],
          ]}
          onPress={() => handleTabChange('challenges')}
        >
          <Typography.LabelLarge
            color={selectedTab === 'challenges' ? theme.colors.primary : theme.colors.textSecondary}
            style={{ fontWeight: selectedTab === 'challenges' ? '700' : '500' }}
          >
            Challenges
          </Typography.LabelLarge>
          <View
            style={[
              styles.badge,
              { backgroundColor: selectedTab === 'challenges' ? theme.colors.primary : theme.colors.border },
            ]}
          >
            <Typography.Caption
              style={{ color: selectedTab === 'challenges' ? '#FFFFFF' : theme.colors.textSecondary }}
            >
              {rewardsData.challenges.filter(c => c.status === 'active').length}
            </Typography.Caption>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'streaks' && [
              styles.activeTab,
              { borderBottomColor: theme.colors.primary },
            ],
          ]}
          onPress={() => handleTabChange('streaks')}
        >
          <Typography.LabelLarge
            color={selectedTab === 'streaks' ? theme.colors.primary : theme.colors.textSecondary}
            style={{ fontWeight: selectedTab === 'streaks' ? '700' : '500' }}
          >
            Streaks
          </Typography.LabelLarge>
          <View
            style={[
              styles.badge,
              { backgroundColor: selectedTab === 'streaks' ? theme.colors.primary : theme.colors.border },
            ]}
          >
            <Typography.Caption
              style={{ color: selectedTab === 'streaks' ? '#FFFFFF' : theme.colors.textSecondary }}
            >
              {rewardsData.streaks.filter(s => s.currentCount > 0).length}
            </Typography.Caption>
          </View>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {selectedTab === 'achievements' && (
          <View style={styles.achievementsGrid}>
            {rewardsData.achievements.map((achievement) => (
              <AchievementBadge
                key={achievement.code}
                achievement={achievement}
                unlocked={achievement.unlocked}
                unlockedAt={achievement.unlockedAt}
              />
            ))}
          </View>
        )}

        {selectedTab === 'challenges' && (
          <View style={styles.challengesList}>
            {rewardsData.challenges.length === 0 ? (
              <View style={styles.emptyState}>
                <Typography.HeadlineMedium>🎯</Typography.HeadlineMedium>
                <Typography.BodyLarge color={theme.colors.textSecondary} style={{ textAlign: 'center' }}>
                  No challenges available
                </Typography.BodyLarge>
                <Typography.BodySmall color={theme.colors.textLight} style={{ textAlign: 'center' }}>
                  Check back tomorrow for new daily challenges
                </Typography.BodySmall>
              </View>
            ) : (
              rewardsData.challenges.map((challenge) => (
                <DailyChallengeCard
                  key={challenge.code}
                  challenge={challenge}
                  progress={challenge.progress}
                  maxProgress={challenge.maxProgress}
                  status={challenge.status}
                  onClaim={() => handleClaimChallenge(challenge.code)}
                />
              ))
            )}
          </View>
        )}

        {selectedTab === 'streaks' && (
          <View style={styles.streaksList}>
            {rewardsData.streaks.map((streak) => (
              <StreakCounter
                key={streak.streakType}
                streakType={streak.streakType}
                currentCount={streak.currentCount}
                longestCount={streak.longestCount}
                lastActivityDate={streak.lastActivityDate}
                showLongest={true}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  compactContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  header: {
    padding: 20,
    gap: 8,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  achievementsGrid: {
    gap: 16,
  },
  challengesList: {
    gap: 16,
  },
  streaksList: {
    gap: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    gap: 12,
  },
});

export default RewardsDashboard;
