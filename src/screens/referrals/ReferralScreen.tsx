/**
 * ============================================================================
 * REFERRAL SCREEN
 * ============================================================================
 * Purpose: Main screen for referring friends and tracking referral rewards
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
import { Text } from '../../components/ui';
import { useTenantTheme } from '../../context/TenantThemeContext';
import { apiRequest } from '../../services/api';

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

const ReferralScreen: React.FC = () => {
  const { theme } = useTenantTheme();
  const [referralCode, setReferralCode] = useState<string>('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [shareAnalytics, setShareAnalytics] = useState<ShareAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'history' | 'analytics'>('overview');

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
    Clipboard.setString(referralCode);
    Alert.alert('Copied!', `Referral code ${referralCode} copied to clipboard`);

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
        return theme.colors.textSecondary;
      case 'fraud_flagged':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
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

  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Referral Code Card */}
      <View style={[styles.card, { backgroundColor: theme.colors.primary }]}>
        <Text style={[styles.cardTitle, { color: '#FFFFFF' }]}>Your Referral Code</Text>
        <Text style={[styles.referralCode, { color: '#FFFFFF' }]}>{referralCode}</Text>
        <TouchableOpacity
          style={[styles.copyButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
          onPress={handleCopyCode}
        >
          <Text style={[styles.copyButtonText, { color: '#FFFFFF' }]}>Copy Code</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {stats?.totalReferrals || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Total Referrals
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statValue, { color: theme.colors.success }]}>
            {stats?.awardedReferrals || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Rewarded
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statValue, { color: theme.colors.warning }]}>
            {stats?.pendingReferrals || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Pending
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {stats?.totalPointsEarned || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Points Earned
          </Text>
        </View>
      </View>

      {/* Share Options */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Share Your Code</Text>
        <View style={styles.shareButtons}>
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => handleShareVia('whatsapp')}
          >
            <Text style={[styles.shareButtonText, { color: '#FFFFFF' }]}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => handleShareVia('sms')}
          >
            <Text style={[styles.shareButtonText, { color: '#FFFFFF' }]}>SMS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => handleShareVia('email')}
          >
            <Text style={[styles.shareButtonText, { color: '#FFFFFF' }]}>Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => handleShareVia('social')}
          >
            <Text style={[styles.shareButtonText, { color: '#FFFFFF' }]}>More</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* How It Works */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>How It Works</Text>
        <View style={styles.stepsList}>
          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.stepNumberText, { color: '#FFFFFF' }]}>1</Text>
            </View>
            <Text style={[styles.stepText, { color: theme.colors.text }]}>
              Share your referral code with friends
            </Text>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.stepNumberText, { color: '#FFFFFF' }]}>2</Text>
            </View>
            <Text style={[styles.stepText, { color: theme.colors.text }]}>
              They sign up and complete KYC verification
            </Text>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.stepNumberText, { color: '#FFFFFF' }]}>3</Text>
            </View>
            <Text style={[styles.stepText, { color: theme.colors.text }]}>
              They make their first deposit (minimum ₦5,000)
            </Text>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.stepNumberText, { color: '#FFFFFF' }]}>4</Text>
            </View>
            <Text style={[styles.stepText, { color: theme.colors.text }]}>
              You both get rewarded with points!
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderHistory = () => (
    <View style={styles.tabContent}>
      {referrals.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No referrals yet. Start sharing your code!
          </Text>
        </View>
      ) : (
        referrals.map((referral) => (
          <View key={referral.id} style={[styles.referralCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.referralHeader}>
              <Text style={[styles.referralId, { color: theme.colors.text }]}>
                Referral #{referral.id.substring(0, 8)}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getBonusStatusColor(referral.bonusStatus) }]}>
                <Text style={[styles.statusText, { color: '#FFFFFF' }]}>
                  {getBonusStatusText(referral.bonusStatus)}
                </Text>
              </View>
            </View>

            <View style={styles.referralDetails}>
              <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                Bonus: {Math.round(referral.bonusPoints * referral.bonusMultiplier)} points
              </Text>
              <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                KYC: {referral.refereeKycCompleted ? '✓ Complete' : '✗ Pending'}
              </Text>
              <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                Funded: {referral.refereeFunded ? '✓ Yes' : '✗ No'}
              </Text>
              <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                Date: {new Date(referral.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderAnalytics = () => (
    <View style={styles.tabContent}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Share Performance</Text>

        <View style={styles.analyticsGrid}>
          <View style={styles.analyticsItem}>
            <Text style={[styles.analyticsValue, { color: theme.colors.primary }]}>
              {shareAnalytics?.totalShares || 0}
            </Text>
            <Text style={[styles.analyticsLabel, { color: theme.colors.textSecondary }]}>
              Total Shares
            </Text>
          </View>

          <View style={styles.analyticsItem}>
            <Text style={[styles.analyticsValue, { color: theme.colors.primary }]}>
              {shareAnalytics?.totalClicks || 0}
            </Text>
            <Text style={[styles.analyticsLabel, { color: theme.colors.textSecondary }]}>
              Link Clicks
            </Text>
          </View>

          <View style={styles.analyticsItem}>
            <Text style={[styles.analyticsValue, { color: theme.colors.success }]}>
              {shareAnalytics?.totalConversions || 0}
            </Text>
            <Text style={[styles.analyticsLabel, { color: theme.colors.textSecondary }]}>
              Sign-ups
            </Text>
          </View>

          <View style={styles.analyticsItem}>
            <Text style={[styles.analyticsValue, { color: theme.colors.warning }]}>
              {shareAnalytics?.conversionRate.toFixed(1) || 0}%
            </Text>
            <Text style={[styles.analyticsLabel, { color: theme.colors.textSecondary }]}>
              Conversion
            </Text>
          </View>
        </View>

        {shareAnalytics?.topShareMethod && (
          <View style={styles.topMethod}>
            <Text style={[styles.topMethodLabel, { color: theme.colors.textSecondary }]}>
              Top Channel:
            </Text>
            <Text style={[styles.topMethodValue, { color: theme.colors.primary }]}>
              {shareAnalytics.topShareMethod}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'overview' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={[styles.tabText, { color: selectedTab === 'overview' ? theme.colors.primary : theme.colors.textSecondary }]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'history' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setSelectedTab('history')}
        >
          <Text style={[styles.tabText, { color: selectedTab === 'history' ? theme.colors.primary : theme.colors.textSecondary }]}>
            History
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'analytics' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setSelectedTab('analytics')}
        >
          <Text style={[styles.tabText, { color: selectedTab === 'analytics' ? theme.colors.primary : theme.colors.textSecondary }]}>
            Analytics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'history' && renderHistory()}
        {selectedTab === 'analytics' && renderAnalytics()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
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
  card: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  referralCode: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    letterSpacing: 4,
  },
  copyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  shareButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepsList: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 6,
  },
  emptyState: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  referralCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  referralHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  referralId: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  referralDetails: {
    gap: 4,
  },
  detailText: {
    fontSize: 13,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  analyticsItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 12,
  },
  topMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  topMethodLabel: {
    fontSize: 14,
  },
  topMethodValue: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

export default ReferralScreen;
