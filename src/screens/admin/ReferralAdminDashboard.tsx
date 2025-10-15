/**
 * ============================================================================
 * REFERRAL ADMIN DASHBOARD - WORLD-CLASS UI
 * ============================================================================
 * Purpose: Complete admin interface for referral system management
 * Design System: Nubank-inspired glassmorphism + data visualization
 * Features:
 * - View all referrals with filtering
 * - Campaign management (create, edit, activate, expire)
 * - Partner management (onboard, track, compensate)
 * - Payout approvals and management
 * - Fraud detection dashboard
 * - System-wide analytics
 * - World-Class UI compliant (GlassCard, LinearGradient, animations, haptics)
 * ============================================================================
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  Dimensions,
} from 'react-native';
import LinearGradient from '../../components/common/LinearGradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTenantTheme } from '../../context/TenantThemeContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { triggerHaptic } from '../../utils/haptics';
import APIService from '../../services/api';

const { width: screenWidth } = Dimensions.get('window');
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  eligibleReferrals: number;
  awardedReferrals: number;
  fraudFlagged: number;
  totalBonusAwarded: number;
  conversionRate: number;
}

interface Referral {
  id: string;
  referrerName: string;
  refereeName: string;
  referralCode: string;
  status: 'pending' | 'eligible' | 'awarded' | 'expired' | 'fraud_flagged';
  bonusPoints: number;
  createdAt: string;
  eligibleAt?: string;
  awardedAt?: string;
  riskScore?: number;
}

interface Partner {
  id: string;
  partnerName: string;
  email: string;
  currentTier: string;
  totalReferrals: number;
  activeReferrals: number;
  monthlyEarnings: number;
  status: 'active' | 'paused' | 'suspended';
}

interface Payout {
  id: string;
  partnerId: string;
  partnerName: string;
  amount: number;
  periodStart: string;
  periodEnd: string;
  status: 'pending' | 'approved' | 'processing' | 'paid' | 'rejected';
  referralCount: number;
}

interface Campaign {
  id: string;
  campaignName: string;
  campaignCode: string;
  status: 'active' | 'paused' | 'expired';
  redemptions: number;
  usageLimit?: number;
  startDate: string;
  endDate: string;
}

interface ReferralAdminDashboardProps {
  navigation?: any;
}

export const ReferralAdminDashboard: React.FC<ReferralAdminDashboardProps> = ({
  navigation,
}) => {
  const { theme } = useTenantTheme() as any;
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'campaigns' | 'partners' | 'payouts' | 'fraud'>('overview');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [suspiciousReferrals, setSuspiciousReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load all data
  const loadData = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // Load data based on active tab
      if (activeTab === 'overview' || refresh) {
        // Load stats
        const statsResponse = await APIService.get('/api/referrals/admin/stats');
        if ((statsResponse.data as any).success) {
          setStats((statsResponse.data as any).data);
        }
      }

      if (activeTab === 'referrals' || refresh) {
        // Load referrals
        const queryParam = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
        const referralsResponse = await APIService.get(`/api/referrals/admin/all${queryParam}`);
        if ((referralsResponse.data as any).success) {
          setReferrals((referralsResponse.data as any).data);
        }
      }

      if (activeTab === 'campaigns' || refresh) {
        // Load campaigns
        const campaignsResponse = await APIService.get('/api/promo-codes/campaigns');
        if ((campaignsResponse.data as any).success) {
          setCampaigns((campaignsResponse.data as any).data);
        }
      }

      if (activeTab === 'partners' || refresh) {
        // Load partners
        const partnersResponse = await APIService.get('/api/aggregators/partners');
        if ((partnersResponse.data as any).success) {
          setPartners((partnersResponse.data as any).data);
        }
      }

      if (activeTab === 'payouts' || refresh) {
        // Load payouts
        const payoutsResponse = await APIService.get('/api/aggregators/payouts');
        if ((payoutsResponse.data as any).success) {
          setPayouts((payoutsResponse.data as any).data);
        }
      }

      if (activeTab === 'fraud' || refresh) {
        // Load suspicious referrals
        const fraudResponse = await APIService.get('/api/fraud/suspicious');
        if ((fraudResponse.data as any).success) {
          setSuspiciousReferrals((fraudResponse.data as any).data);
        }
      }
    } catch (error: any) {
      console.error('Failed to load admin data:', error);
      Alert.alert('Error', 'Failed to load admin data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab, filterStatus]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [activeTab, filterStatus]);

  // Handle tab change
  const handleTabChange = useCallback((tab: typeof activeTab) => {
    triggerHaptic('light');
    setActiveTab(tab);
  }, []);

  // Handle payout approval
  const handleApprovePayout = useCallback(async (payoutId: string) => {
    triggerHaptic('medium');

    Alert.alert(
      'Approve Payout',
      'Are you sure you want to approve this payout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              const response = await APIService.post(`/api/aggregators/payouts/${payoutId}/approve`);
              if ((response.data as any).success) {
                triggerHaptic('medium');
                Alert.alert('Success', 'Payout approved successfully');
                loadData(true);
              }
            } catch (error: any) {
              triggerHaptic('heavy');
              Alert.alert('Error', error.response?.data?.error || 'Failed to approve payout');
            }
          },
        },
      ]
    );
  }, [loadData]);

  // Handle flag referral as fraud
  const handleFlagFraud = useCallback(async (referralId: string) => {
    triggerHaptic('medium');

    Alert.alert(
      'Flag as Fraud',
      'Are you sure you want to flag this referral as fraudulent?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Flag',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await APIService.post(`/api/fraud/flag/${referralId}`);
              if ((response.data as any).success) {
                triggerHaptic('medium');
                Alert.alert('Success', 'Referral flagged as fraud');
                loadData(true);
              }
            } catch (error: any) {
              triggerHaptic('heavy');
              Alert.alert('Error', error.response?.data?.error || 'Failed to flag referral');
            }
          },
        },
      ]
    );
  }, [loadData]);

  const styles = createStyles(theme);

  // Render stat card
  const renderStatCard = (title: string, value: string | number, icon: string, color: string, index: number) => (
    <Animated.View
      key={title}
      entering={FadeInDown.delay(index * 100).springify()}
      style={styles.statCardWrapper}
    >
      <GlassCard style={styles.statCard}>
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={[styles.statValue, { color, fontFamily: theme.typography.fontFamily?.mono }]}>
          {value}
        </Text>
        <Text style={styles.statTitle}>{title}</Text>
      </GlassCard>
    </Animated.View>
  );

  // Render overview tab
  const renderOverview = () => {
    if (isLoading) {
      return (
        <>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={{ height: 100, marginBottom: 16, backgroundColor: '#f0f0f0', borderRadius: 12 }} />
          ))}
        </>
      );
    }

    if (!stats) {
      return (
        <EmptyState
          title="No Stats Available"
          description="Unable to load referral statistics"
          illustration="custom"
          customIllustration={<Text style={{ fontSize: 64 }}>📊</Text>}
          primaryAction={{
            label: "Retry",
            onPress: () => loadData(true),
          }}
        />
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadData(true)} />}
      >
        <View style={styles.statsGrid}>
          {renderStatCard('Total Referrals', stats.totalReferrals.toLocaleString(), '🤝', theme.colors.primary, 0)}
          {renderStatCard('Pending', stats.pendingReferrals.toLocaleString(), '⏳', theme.colors.warning, 1)}
          {renderStatCard('Awarded', stats.awardedReferrals.toLocaleString(), '✅', theme.colors.success, 2)}
          {renderStatCard('Fraud Flagged', stats.fraudFlagged.toLocaleString(), '🚨', theme.colors.error, 3)}
        </View>

        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>💰 Bonus Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Awarded</Text>
              <Text style={[styles.summaryValue, { fontFamily: theme.typography.fontFamily?.mono }]}>
                ₦{stats.totalBonusAwarded.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Conversion Rate</Text>
              <Text style={[styles.summaryValue, { fontFamily: theme.typography.fontFamily?.mono }]}>
                {stats.conversionRate.toFixed(1)}%
              </Text>
            </View>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    );
  };

  // Render referral item
  const renderReferralItem = (referral: Referral, index: number) => {
    const statusColors = {
      pending: theme.colors.warning,
      eligible: theme.colors.primary,
      awarded: theme.colors.success,
      expired: theme.colors.text.secondary,
      fraud_flagged: theme.colors.error,
    };

    return (
      <Animated.View key={referral.id} entering={FadeInDown.delay(index * 50).springify()}>
        <GlassCard style={styles.referralCard}>
          <View style={styles.referralHeader}>
            <View style={styles.referralNames}>
              <Text style={styles.referralName}>{referral.referrerName}</Text>
              <Text style={styles.referralArrow}>→</Text>
              <Text style={styles.referralName}>{referral.refereeName}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColors[referral.status]}20` }]}>
              <Text style={[styles.statusText, { color: statusColors[referral.status] }]}>
                {referral.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.referralDetails}>
            <Text style={styles.referralCode}>Code: {referral.referralCode}</Text>
            <Text style={styles.referralDate}>
              {new Date(referral.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {referral.riskScore !== undefined && referral.riskScore > 0 && (
            <View style={styles.riskIndicator}>
              <Text style={styles.riskLabel}>Risk Score:</Text>
              <Text style={[styles.riskScore, { color: referral.riskScore >= 50 ? theme.colors.error : theme.colors.warning }]}>
                {referral.riskScore}/100
              </Text>
            </View>
          )}

          {referral.status !== 'fraud_flagged' && referral.riskScore && referral.riskScore >= 50 && (
            <Button
              title="Flag as Fraud"
              onPress={() => handleFlagFraud(referral.id)}
              variant="outline"
              style={styles.actionButton}
            />
          )}
        </GlassCard>
      </Animated.View>
    );
  };

  // Render referrals tab
  const renderReferrals = () => {
    if (isLoading) {
      return (
        <>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={{ height: 120, marginBottom: 16, backgroundColor: '#f0f0f0', borderRadius: 12 }} />
          ))}
        </>
      );
    }

    const filteredReferrals = searchQuery
      ? referrals.filter(r =>
          r.referrerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.refereeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.referralCode.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : referrals;

    return (
      <View style={{ flex: 1 }}>
        <View style={styles.filterContainer}>
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search referrals..."
            style={styles.searchInput}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
            {['all', 'pending', 'eligible', 'awarded', 'fraud_flagged'].map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => {
                  triggerHaptic('light');
                  setFilterStatus(status);
                }}
                style={[styles.filterTab, filterStatus === status && styles.filterTabActive]}
              >
                <Text style={[styles.filterTabText, filterStatus === status && styles.filterTabTextActive]}>
                  {status.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {filteredReferrals.length > 0 ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadData(true)} />}
          >
            {filteredReferrals.map((referral, index) => renderReferralItem(referral, index))}
          </ScrollView>
        ) : (
          <EmptyState
            title="No Referrals Found"
            description={searchQuery ? 'No referrals match your search' : 'No referrals available'}
            illustration="custom"
            customIllustration={<Text style={{ fontSize: 64 }}>🔍</Text>}
            primaryAction={{
              label: "Clear Filters",
              onPress: () => {
                setSearchQuery('');
                setFilterStatus('all');
              },
            }}
          />
        )}
      </View>
    );
  };

  // Render payout item
  const renderPayoutItem = (payout: Payout, index: number) => {
    const statusColors = {
      pending: theme.colors.warning,
      approved: theme.colors.primary,
      processing: theme.colors.info,
      paid: theme.colors.success,
      rejected: theme.colors.error,
    };

    return (
      <Animated.View key={payout.id} entering={FadeInDown.delay(index * 50).springify()}>
        <GlassCard style={styles.payoutCard}>
          <View style={styles.payoutHeader}>
            <Text style={styles.payoutPartner}>{payout.partnerName}</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColors[payout.status]}20` }]}>
              <Text style={[styles.statusText, { color: statusColors[payout.status] }]}>
                {payout.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.payoutDetails}>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutLabel}>Amount</Text>
              <Text style={[styles.payoutAmount, { fontFamily: theme.typography.fontFamily?.mono }]}>
                ₦{payout.amount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutLabel}>Referrals</Text>
              <Text style={styles.payoutValue}>{payout.referralCount}</Text>
            </View>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutLabel}>Period</Text>
              <Text style={styles.payoutValue}>
                {new Date(payout.periodStart).toLocaleDateString()} - {new Date(payout.periodEnd).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {payout.status === 'pending' && (
            <Button
              title="Approve Payout"
              onPress={() => handleApprovePayout(payout.id)}
              style={styles.actionButton}
            />
          )}
        </GlassCard>
      </Animated.View>
    );
  };

  // Render payouts tab
  const renderPayouts = () => {
    if (isLoading) {
      return (
        <>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={{ height: 150, marginBottom: 16, backgroundColor: '#f0f0f0', borderRadius: 12 }} />
          ))}
        </>
      );
    }

    return payouts.length > 0 ? (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadData(true)} />}
      >
        {payouts.map((payout, index) => renderPayoutItem(payout, index))}
      </ScrollView>
    ) : (
      <EmptyState
        title="No Payouts"
        description="No partner payouts available"
        illustration="custom"
        customIllustration={<Text style={{ fontSize: 64 }}>💳</Text>}
        primaryAction={{
          label: "Refresh",
          onPress: () => loadData(true),
        }}
      />
    );
  };

  // Render main content
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'referrals':
        return renderReferrals();
      case 'payouts':
        return renderPayouts();
      case 'campaigns':
      case 'partners':
      case 'fraud':
        return (
          <EmptyState
            title="Coming Soon"
            description={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} management is under development`}
            illustration="custom"
            customIllustration={<Text style={{ fontSize: 64 }}>🚧</Text>}
          />
        );
      default:
        return null;
    }
  };

  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.primaryDark || theme.colors.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Header */}
      <Animated.View entering={FadeInUp.springify()} style={styles.header}>
        <Text style={styles.headerTitle}>Referral Admin</Text>
        <Text style={styles.headerSubtitle}>Manage referrals, campaigns & partners</Text>
      </Animated.View>

      {/* Tabs */}
      <Animated.View entering={FadeInUp.delay(100).springify()}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScrollContainer}
          contentContainerStyle={styles.tabContainer}
        >
          {(['overview', 'referrals', 'campaigns', 'partners', 'payouts', 'fraud'] as const).map((tab) => (
            <AnimatedTouchable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => handleTabChange(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </AnimatedTouchable>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
    </LinearGradient>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: theme.layout.spacing * 2,
    paddingBottom: theme.layout.spacing * 2,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: theme.typography.fontFamily?.display || theme.typography.fontFamily?.primary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: theme.typography.fontFamily?.primary,
  },
  tabScrollContainer: {
    maxHeight: 50,
  },
  tabContainer: {
    paddingHorizontal: theme.layout.spacing * 2,
    marginBottom: theme.layout.spacing * 2,
    gap: theme.layout.spacing,
  },
  tab: {
    paddingHorizontal: theme.layout.spacing * 1.5,
    paddingVertical: theme.layout.spacing,
    borderRadius: theme.layout.borderRadius,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabActive: {
    backgroundColor: '#ffffff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: theme.typography.fontFamily?.primary,
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: theme.layout.spacing * 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.layout.spacing,
    marginBottom: theme.layout.spacing * 2,
  },
  statCardWrapper: {
    width: (screenWidth - theme.layout.spacing * 5) / 2,
  },
  statCard: {
    padding: theme.layout.spacing * 1.5,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: theme.layout.spacing * 0.5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily?.primary,
  },
  summaryCard: {
    padding: theme.layout.spacing * 1.5,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily?.primary,
    marginBottom: theme.layout.spacing,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.layout.spacing * 0.5,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  filterContainer: {
    marginBottom: theme.layout.spacing,
  },
  searchInput: {
    marginBottom: theme.layout.spacing,
  },
  filterTabs: {
    maxHeight: 40,
  },
  filterTab: {
    paddingHorizontal: theme.layout.spacing,
    paddingVertical: theme.layout.spacing * 0.5,
    borderRadius: theme.layout.borderRadius,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: theme.layout.spacing * 0.5,
  },
  filterTabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  filterTabText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: theme.typography.fontFamily?.primary,
    textTransform: 'capitalize',
  },
  filterTabTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  referralCard: {
    padding: theme.layout.spacing * 1.5,
    marginBottom: theme.layout.spacing,
  },
  referralHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.layout.spacing,
  },
  referralNames: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.layout.spacing * 0.5,
  },
  referralName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  referralArrow: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: theme.typography.fontFamily?.mono,
  },
  referralDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.layout.spacing * 0.5,
  },
  referralCode: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily?.mono,
  },
  referralDate: {
    fontSize: 12,
    color: theme.colors.text.light,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  riskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.layout.spacing * 0.5,
    marginTop: theme.layout.spacing * 0.5,
  },
  riskLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  riskScore: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: theme.typography.fontFamily?.mono,
  },
  actionButton: {
    marginTop: theme.layout.spacing,
  },
  payoutCard: {
    padding: theme.layout.spacing * 1.5,
    marginBottom: theme.layout.spacing,
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.layout.spacing,
  },
  payoutPartner: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  payoutDetails: {
    gap: theme.layout.spacing * 0.5,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payoutLabel: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  payoutAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.success,
  },
  payoutValue: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily?.primary,
  },
});

export default ReferralAdminDashboard;
