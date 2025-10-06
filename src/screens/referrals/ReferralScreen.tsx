/**
 * ============================================================================
 * REFERRAL SCREEN (WORLD-CLASS UI)
 * ============================================================================
 * Purpose: Main screen for referring friends and tracking referral rewards
 * Design: Nubank-inspired glassmorphism + gamification
 * Created: October 5, 2025
 * Phase: 3 - Frontend Integration
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Share,
  Alert,
  TouchableOpacity,
  Linking,
  Clipboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  BounceIn,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { Text } from '../../components/ui';
import { GlassCard } from '../../components/ui/GlassCard';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { useTenantTheme } from '../../context/TenantThemeContext';
import { apiRequest } from '../../services/api';
import { triggerHaptic } from '../../utils/haptics';

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  eligibleReferrals: number;
  awardedReferrals: number;
  expiredReferrals: number;
  totalPointsEarned: number;
  totalCashEarned: number;
}

interface Referral {
  id: string;
  refereeId: string;
  bonusStatus: string;
  bonusPoints: number;
  bonusMultiplier: number;
  refereeKycCompleted: boolean;
  refereeFunded: boolean;
  eligibleForBonus: boolean;
  createdAt: string;
}

interface ShareAnalytics {
  totalShares: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  topShareMethod: string;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const ReferralScreen: React.FC = () => {
  const { theme } = useTenantTheme();
  const [referralCode, setReferralCode] = useState<string>('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [shareAnalytics, setShareAnalytics] = useState<ShareAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'history' | 'analytics'>('overview');

  const codeScale = useSharedValue(1);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setLoading(true);

      // Get user ID from auth context (you'll need to implement this)
      const userId = 'current-user-id'; // TODO: Get from auth context

      const [referralData, analytics] = await Promise.all([
        apiRequest(`/referrals/user/${userId}`),
        apiRequest(`/referrals/share-analytics/${userId}`),
      ]);

      setReferralCode(referralData.code);
      setStats(referralData.stats);
      setReferrals(referralData.referrals);
      setShareAnalytics(analytics);
    } catch (error) {
      console.error('Error loading referral data:', error);
      Alert.alert('Error', 'Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    // Haptic feedback
    triggerHaptic('impactMedium');

    // Scale animation
    codeScale.value = withSpring(0.95, {}, () => {
      codeScale.value = withSpring(1);
    });

    Clipboard.setString(referralCode);
    Alert.alert('Copied! ✅', `Referral code ${referralCode} copied to clipboard`);

    // Track share event
    try {
      await apiRequest('/referrals/share', {
        method: 'POST',
        body: JSON.stringify({
          shareMethod: 'copy_link',
          deviceType: 'mobile',
          platform: 'ios', // or 'android'
        }),
      });
    } catch (error) {
      console.error('Error tracking share:', error);
    }
  };

  const handleShareVia = async (method: string) => {
    triggerHaptic('impactLight');

    try {
      const response = await apiRequest('/referrals/share', {
        method: 'POST',
        body: JSON.stringify({
          shareMethod: method,
          deviceType: 'mobile',
          platform: 'ios', // or 'android'
        }),
      });

      const { trackingUrl } = response;

      const message = `Join ${theme.branding.appTitle} using my referral code ${referralCode} and get ${stats?.totalPointsEarned || 100} points! ${trackingUrl}`;

      if (method === 'sms') {
        Linking.openURL(`sms:?body=${encodeURIComponent(message)}`);
      } else if (method === 'email') {
        Linking.openURL(`mailto:?subject=Join ${theme.branding.appTitle}&body=${encodeURIComponent(message)}`);
      } else if (method === 'whatsapp') {
        Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
      } else {
        // Generic share
        Share.share({
          message,
          title: `Join ${theme.branding.appTitle}`,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share referral code');
    }
  };

  const getBonusStatusColor = (status: string) => {
    switch (status) {
      case 'awarded':
        return theme.colors.success;
      case 'eligible':
        return theme.colors.primary;
      case 'pending':
        return theme.colors.warning;
      case 'expired':
      case 'cancelled':
        return theme.colors.text.secondary;
      case 'fraud_flagged':
        return theme.colors.error;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getBonusStatusText = (status: string) => {
    switch (status) {
      case 'awarded':
        return 'Bonus Awarded';
      case 'eligible':
        return 'Eligible for Bonus';
      case 'pending':
        return 'Pending';
      case 'expired':
        return 'Expired';
      case 'cancelled':
        return 'Cancelled';
      case 'fraud_flagged':
        return 'Flagged';
      default:
        return status;
    }
  };

  const codeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: codeScale.value }],
  }));

  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Referral Code Card - Glassmorphic Hero */}
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark || theme.colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <GlassCard style={styles.heroCard}>
            <Text style={[styles.heroTitle, { fontFamily: theme.typography.fontFamily.primary }]}>
              Your Referral Code
            </Text>
            <AnimatedTouchable
              style={[styles.codeContainer, codeAnimatedStyle]}
              onPress={handleCopyCode}
              activeOpacity={0.9}
            >
              <Text style={[styles.referralCode, { fontFamily: theme.typography.fontFamily.mono }]}>
                {referralCode}
              </Text>
            </AnimatedTouchable>
            <TouchableOpacity
              style={[styles.copyButton, { backgroundColor: 'rgba(255,255,255,0.25)' }]}
              onPress={handleCopyCode}
            >
              <Text style={[styles.copyButtonText, { fontFamily: theme.typography.fontFamily.primary }]}>
                📋 Tap to Copy
              </Text>
            </TouchableOpacity>
          </GlassCard>
        </LinearGradient>
      </Animated.View>

      {/* Stats Grid - With Celebration Animation */}
      <Animated.View entering={FadeInUp.delay(200).springify()}>
        <View style={styles.statsGrid}>
          <GlassCard style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.colors.primary, fontFamily: theme.typography.fontFamily.mono }]}>
              {stats?.totalReferrals || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
              Total Referrals
            </Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.colors.success, fontFamily: theme.typography.fontFamily.mono }]}>
              {stats?.awardedReferrals || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
              🎉 Rewarded
            </Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.colors.warning, fontFamily: theme.typography.fontFamily.mono }]}>
              {stats?.pendingReferrals || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
              ⏳ Pending
            </Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.colors.reward?.gold || theme.colors.primary, fontFamily: theme.typography.fontFamily.mono }]}>
              {stats?.totalPointsEarned || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
              ⭐ Points Earned
            </Text>
          </GlassCard>
        </View>
      </Animated.View>

      {/* Share Options */}
      <Animated.View entering={FadeInUp.delay(300).springify()}>
        <GlassCard>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamily.primary }]}>
            Share Your Code
          </Text>
          <View style={styles.shareButtons}>
            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: '#25D366' }]}
              onPress={() => handleShareVia('whatsapp')}
            >
              <Text style={styles.shareButtonEmoji}>💬</Text>
              <Text style={[styles.shareButtonText, { fontFamily: theme.typography.fontFamily.primary }]}>
                WhatsApp
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: '#007AFF' }]}
              onPress={() => handleShareVia('sms')}
            >
              <Text style={styles.shareButtonEmoji}>💬</Text>
              <Text style={[styles.shareButtonText, { fontFamily: theme.typography.fontFamily.primary }]}>
                SMS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: '#EA4335' }]}
              onPress={() => handleShareVia('email')}
            >
              <Text style={styles.shareButtonEmoji}>📧</Text>
              <Text style={[styles.shareButtonText, { fontFamily: theme.typography.fontFamily.primary }]}>
                Email
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => handleShareVia('social')}
            >
              <Text style={styles.shareButtonEmoji}>📱</Text>
              <Text style={[styles.shareButtonText, { fontFamily: theme.typography.fontFamily.primary }]}>
                More
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </Animated.View>

      {/* How It Works */}
      <Animated.View entering={FadeInUp.delay(400).springify()}>
        <GlassCard>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamily.primary }]}>
            How It Works
          </Text>
          <View style={styles.stepsList}>
            {[
              { emoji: '1️⃣', text: 'Share your referral code with friends' },
              { emoji: '2️⃣', text: 'They sign up and complete KYC verification' },
              { emoji: '3️⃣', text: 'They make their first deposit (minimum ₦5,000)' },
              { emoji: '4️⃣', text: 'You both get rewarded with points! 🎉' },
            ].map((step, index) => (
              <View key={index} style={styles.step}>
                <Text style={styles.stepEmoji}>{step.emoji}</Text>
                <Text style={[styles.stepText, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamily.primary }]}>
                  {step.text}
                </Text>
              </View>
            ))}
          </View>
        </GlassCard>
      </Animated.View>
    </View>
  );

  const renderHistory = () => (
    <View style={styles.tabContent}>
      {referrals.length === 0 ? (
        <EmptyState
          icon="🤝"
          title="No referrals yet"
          message="Start sharing your code to see your referrals here!"
          actionLabel="Copy Code"
          onAction={handleCopyCode}
        />
      ) : (
        referrals.map((referral, index) => (
          <Animated.View
            key={referral.id}
            entering={FadeInDown.delay(index * 100).springify()}
          >
            <GlassCard style={styles.referralCard}>
              <View style={styles.referralHeader}>
                <Text style={[styles.referralId, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamily.primary }]}>
                  Referral #{referral.id.substring(0, 8)}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getBonusStatusColor(referral.bonusStatus) }]}>
                  <Text style={[styles.statusText, { fontFamily: theme.typography.fontFamily.primary }]}>
                    {getBonusStatusText(referral.bonusStatus)}
                  </Text>
                </View>
              </View>

              <View style={styles.referralDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailEmoji}>⭐</Text>
                  <Text style={[styles.detailText, { color: theme.colors.text.secondary }]}>
                    Bonus: {Math.round(referral.bonusPoints * referral.bonusMultiplier)} points
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailEmoji}>{referral.refereeKycCompleted ? '✅' : '⏳'}</Text>
                  <Text style={[styles.detailText, { color: theme.colors.text.secondary }]}>
                    KYC: {referral.refereeKycCompleted ? 'Complete' : 'Pending'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailEmoji}>{referral.refereeFunded ? '💰' : '⏳'}</Text>
                  <Text style={[styles.detailText, { color: theme.colors.text.secondary }]}>
                    Funded: {referral.refereeFunded ? 'Yes' : 'No'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailEmoji}>📅</Text>
                  <Text style={[styles.detailText, { color: theme.colors.text.secondary }]}>
                    {new Date(referral.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>
        ))
      )}
    </View>
  );

  const renderAnalytics = () => (
    <View style={styles.tabContent}>
      <Animated.View entering={FadeInUp.delay(100).springify()}>
        <GlassCard>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamily.primary }]}>
            📊 Share Performance
          </Text>

          <View style={styles.analyticsGrid}>
            <View style={styles.analyticsItem}>
              <Text style={[styles.analyticsValue, { color: theme.colors.primary, fontFamily: theme.typography.fontFamily.mono }]}>
                {shareAnalytics?.totalShares || 0}
              </Text>
              <Text style={[styles.analyticsLabel, { color: theme.colors.text.secondary }]}>
                Total Shares
              </Text>
            </View>

            <View style={styles.analyticsItem}>
              <Text style={[styles.analyticsValue, { color: theme.colors.info, fontFamily: theme.typography.fontFamily.mono }]}>
                {shareAnalytics?.totalClicks || 0}
              </Text>
              <Text style={[styles.analyticsLabel, { color: theme.colors.text.secondary }]}>
                Link Clicks
              </Text>
            </View>

            <View style={styles.analyticsItem}>
              <Text style={[styles.analyticsValue, { color: theme.colors.success, fontFamily: theme.typography.fontFamily.mono }]}>
                {shareAnalytics?.totalConversions || 0}
              </Text>
              <Text style={[styles.analyticsLabel, { color: theme.colors.text.secondary }]}>
                Sign-ups
              </Text>
            </View>

            <View style={styles.analyticsItem}>
              <Text style={[styles.analyticsValue, { color: theme.colors.warning, fontFamily: theme.typography.fontFamily.mono }]}>
                {shareAnalytics?.conversionRate.toFixed(1) || 0}%
              </Text>
              <Text style={[styles.analyticsLabel, { color: theme.colors.text.secondary }]}>
                Conversion
              </Text>
            </View>
          </View>

          {shareAnalytics?.topShareMethod && (
            <View style={styles.topMethodContainer}>
              <View style={[styles.topMethodBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                <Text style={styles.topMethodEmoji}>🏆</Text>
                <View>
                  <Text style={[styles.topMethodLabel, { color: theme.colors.text.secondary }]}>
                    Top Channel
                  </Text>
                  <Text style={[styles.topMethodValue, { color: theme.colors.primary, fontFamily: theme.typography.fontFamily.primary }]}>
                    {shareAnalytics.topShareMethod}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </GlassCard>
      </Animated.View>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.background.secondary]}
        style={styles.container}
      >
        <SkeletonLoader count={5} height={120} style={{ marginBottom: 16 }} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[theme.colors.background.primary, theme.colors.background.secondary]}
      style={styles.container}
    >
      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: theme.colors.surface }]}>
        {(['overview', 'history', 'analytics'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              selectedTab === tab && { borderBottomColor: theme.colors.primary, borderBottomWidth: 3 },
            ]}
            onPress={() => {
              triggerHaptic('impactLight');
              setSelectedTab(tab);
            }}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: selectedTab === tab ? theme.colors.primary : theme.colors.text.secondary,
                  fontFamily: theme.typography.fontFamily.primary,
                  fontWeight: selectedTab === tab ? '600' : '400',
                },
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'history' && renderHistory()}
        {selectedTab === 'analytics' && renderAnalytics()}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  tabContent: {
    gap: 16,
  },
  heroGradient: {
    borderRadius: 20,
    padding: 2,
  },
  heroCard: {
    padding: 24,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    opacity: 0.9,
  },
  codeContainer: {
    paddingVertical: 16,
  },
  referralCode: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 6,
  },
  copyButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 16,
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 13,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  shareButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    minWidth: '47%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  shareButtonEmoji: {
    fontSize: 24,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepsList: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepEmoji: {
    fontSize: 24,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    paddingTop: 2,
  },
  referralCard: {
    padding: 16,
    marginBottom: 12,
  },
  referralHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  referralId: {
    fontSize: 15,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  referralDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailEmoji: {
    fontSize: 16,
  },
  detailText: {
    fontSize: 14,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 20,
  },
  analyticsItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  analyticsValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 13,
  },
  topMethodContainer: {
    marginTop: 8,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  topMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  topMethodEmoji: {
    fontSize: 32,
  },
  topMethodLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  topMethodValue: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

export default ReferralScreen;
