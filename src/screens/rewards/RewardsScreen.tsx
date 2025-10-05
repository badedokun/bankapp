/**
 * Rewards Screen
 * Full-screen rewards and gamification experience
 * Wrapper for RewardsDashboard component with navigation integration
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTenantTheme } from '../../context/TenantThemeContext';
import { RewardsDashboard } from '../../components/rewards';
import { SkeletonDashboard } from '../../components/ui/SkeletonLoader';
import Typography from '../../components/ui/Typography';
import APIService from '../../services/api';

// ============================================================================
// Interfaces
// ============================================================================

export interface RewardsScreenProps {
  navigation?: any;
  route?: any;
  onNavigateBack?: () => void;
}

// ============================================================================
// Component
// ============================================================================

const RewardsScreen: React.FC<RewardsScreenProps> = ({
  navigation,
  route,
  onNavigateBack,
}) => {
  const { theme } = useTenantTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const user = await APIService.getCurrentUser();

      if (user?.id) {
        setUserId(user.id);
      } else {
        setError('Unable to load user information');
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
      setError('Failed to load rewards data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadUserData();
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <SkeletonDashboard />
      </View>
    );
  }

  // Error state
  if (error || !userId) {
    return (
      <View style={[styles.container, styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Typography.DisplaySmall style={{ marginBottom: 16 }}>🎮</Typography.DisplaySmall>
        <Typography.HeadlineMedium
          color={theme.colors.danger}
          style={{ marginBottom: 16, textAlign: 'center' }}
        >
          Unable to Load Rewards
        </Typography.HeadlineMedium>
        <Typography.BodyMedium
          color={theme.colors.textSecondary}
          style={{ textAlign: 'center', lineHeight: 24 }}
        >
          {error || 'Please check your connection and try again.'}
        </Typography.BodyMedium>
      </View>
    );
  }

  // Success state
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <RewardsDashboard
        userId={userId}
        onRefresh={handleRefresh}
      />
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
});

export default RewardsScreen;
