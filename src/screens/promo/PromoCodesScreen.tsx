/**
 * ============================================================================
 * PROMO CODES SCREEN - WORLD-CLASS UI
 * ============================================================================
 * Purpose: Browse and redeem promotional campaigns
 * Design System: Nubank-inspired glassmorphism + gamification
 * Features:
 * - Browse active promotional campaigns
 * - Enter and validate promo codes
 * - Redeem codes with deposit amount (if required)
 * - View redemption history
 * - Show campaign terms and conditions
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

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface PromotionalCampaign {
  id: string;
  campaignCode: string;
  campaignName: string;
  description: string;
  campaignType: 'signup_bonus' | 'deposit_match' | 'fixed_points' | 'percentage_bonus';
  bonusAmount?: number;
  bonusPoints?: number;
  bonusPercentage?: number;
  minimumDeposit?: number;
  maximumBonus?: number;
  userEligibility: 'new_users' | 'existing_users' | 'tier_based' | 'all_users';
  startDate: string;
  endDate: string;
  usageCount: number;
  usageLimit?: number;
  status: 'active' | 'paused' | 'expired';
  termsAndConditions?: string;
}

interface PromoCodeRedemption {
  id: string;
  campaignCode: string;
  campaignName: string;
  redemptionDate: string;
  bonusAmount?: number;
  bonusPoints?: number;
  depositAmount?: number;
  status: 'pending' | 'completed' | 'failed';
}

interface PromoCodesScreenProps {
  navigation?: any;
  userId: string;
}

export const PromoCodesScreen: React.FC<PromoCodesScreenProps> = ({
  navigation,
  userId,
}) => {
  const { theme } = useTenantTheme() as any;
  const [activeTab, setActiveTab] = useState<'browse' | 'redeem' | 'history'>('browse');
  const [campaigns, setCampaigns] = useState<PromotionalCampaign[]>([]);
  const [redemptions, setRedemptions] = useState<PromoCodeRedemption[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<PromotionalCampaign | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);

  // Animation values
  const tabScale = useSharedValue(1);

  // Load active campaigns
  const loadCampaigns = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await APIService.get('/api/promo-codes/active');
      if ((response as any).data.success) {
        setCampaigns((response as any).data.data);
      }
    } catch (error: any) {
      console.error('Failed to load campaigns:', error);
      Alert.alert('Error', 'Failed to load promotional campaigns');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Load redemption history
  const loadRedemptions = useCallback(async () => {
    try {
      const response = await APIService.get(`/api/promo-codes/redemptions/${userId}`);
      if ((response as any).data.success) {
        setRedemptions((response as any).data.data);
      }
    } catch (error: any) {
      console.error('Failed to load redemptions:', error);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    loadCampaigns();
    loadRedemptions();
  }, [loadCampaigns, loadRedemptions]);

  // Validate promo code
  const validatePromoCode = useCallback(async (code: string) => {
    if (!code || code.length < 4) {
      setValidationResult(null);
      return;
    }

    setIsValidating(true);
    triggerHaptic('light');

    try {
      const response = await APIService.post('/api/promo-codes/validate', {
        code,
        userId,
      });

      if ((response as any).data.success && (response as any).data.data.isValid) {
        setValidationResult({
          isValid: true,
          campaign: (response as any).data.data.campaign,
          message: (response as any).data.data.message,
        });
        triggerHaptic('medium');
      } else {
        setValidationResult({
          isValid: false,
          message: (response as any).data.data.message || 'Invalid promo code',
        });
        triggerHaptic('heavy');
      }
    } catch (error: any) {
      console.error('Promo validation error:', error);
      setValidationResult({
        isValid: false,
        message: (error as any).response?.data?.error || 'Unable to validate promo code',
      });
      triggerHaptic('heavy');
    } finally {
      setIsValidating(false);
    }
  }, [userId]);

  // Debounced validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (promoCode && promoCode.length >= 4) {
        validatePromoCode(promoCode);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [promoCode, validatePromoCode]);

  // Redeem promo code
  const handleRedeem = useCallback(async () => {
    if (!promoCode) {
      Alert.alert('Error', 'Please enter a promo code');
      return;
    }

    if (!validationResult?.isValid) {
      Alert.alert('Error', 'Please enter a valid promo code');
      return;
    }

    const campaign = validationResult.campaign;
    if (campaign.minimumDeposit && (!depositAmount || parseFloat(depositAmount) < campaign.minimumDeposit)) {
      Alert.alert(
        'Minimum Deposit Required',
        `This promo requires a minimum deposit of ₦${campaign.minimumDeposit.toLocaleString()}`
      );
      return;
    }

    setIsRedeeming(true);
    triggerHaptic('heavy');

    try {
      const response = await APIService.post('/api/promo-codes/redeem', {
        userId,
        code: promoCode,
        depositAmount: depositAmount ? parseFloat(depositAmount) : undefined,
      });

      if ((response as any).data.success) {
        triggerHaptic('medium');
        Alert.alert(
          '🎉 Promo Code Redeemed!',
          (response as any).data.message || 'Your bonus has been applied successfully!',
          [
            {
              text: 'View History',
              onPress: () => {
                setActiveTab('history');
                loadRedemptions();
              },
            },
            {
              text: 'OK',
              onPress: () => {
                setPromoCode('');
                setDepositAmount('');
                setValidationResult(null);
              },
            },
          ]
        );
      }
    } catch (error: any) {
      triggerHaptic('heavy');
      Alert.alert(
        'Redemption Failed',
        (error as any).response?.data?.error || 'Failed to redeem promo code. Please try again.'
      );
    } finally {
      setIsRedeeming(false);
    }
  }, [promoCode, depositAmount, validationResult, userId, loadRedemptions]);

  // Handle tab change
  const handleTabChange = useCallback((tab: 'browse' | 'redeem' | 'history') => {
    triggerHaptic('light');
    tabScale.value = withSpring(0.95, {}, () => {
      tabScale.value = withSpring(1);
    });
    setActiveTab(tab);
  }, []);

  const styles = createStyles(theme);

  // Render campaign card
  const renderCampaignCard = (campaign: PromotionalCampaign, index: number) => {
    const typeIcons = {
      signup_bonus: '🎁',
      deposit_match: '💰',
      fixed_points: '⭐',
      percentage_bonus: '📈',
    };

    const eligibilityLabels = {
      new_users: 'New Users Only',
      existing_users: 'Existing Users',
      tier_based: 'Tier-Based',
      all_users: 'All Users',
    };

    return (
      <Animated.View
        key={campaign.id}
        entering={FadeInDown.delay(index * 100).springify()}
      >
        <AnimatedTouchable
          onPress={() => {
            triggerHaptic('medium');
            setSelectedCampaign(campaign);
          }}
          activeOpacity={0.9}
        >
          <GlassCard style={styles.campaignCard}>
            <View style={styles.campaignHeader}>
              <Text style={styles.campaignIcon}>{typeIcons[campaign.campaignType]}</Text>
              <View style={styles.campaignHeaderText}>
                <Text style={styles.campaignName}>{campaign.campaignName}</Text>
                <Text style={styles.campaignEligibility}>
                  {eligibilityLabels[campaign.userEligibility]}
                </Text>
              </View>
              <View style={[styles.statusBadge, campaign.status === 'active' && styles.statusBadgeActive]}>
                <Text style={[styles.statusText, campaign.status === 'active' && styles.statusTextActive]}>
                  {campaign.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.campaignDescription}>{campaign.description}</Text>

            <View style={styles.campaignDetails}>
              {campaign.bonusPoints && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Bonus Points</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.success }]}>
                    +{campaign.bonusPoints}
                  </Text>
                </View>
              )}
              {campaign.bonusAmount && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Bonus Amount</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.success }]}>
                    ₦{campaign.bonusAmount.toLocaleString()}
                  </Text>
                </View>
              )}
              {campaign.bonusPercentage && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Bonus</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.success }]}>
                    {campaign.bonusPercentage}%
                  </Text>
                </View>
              )}
              {campaign.minimumDeposit && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Min. Deposit</Text>
                  <Text style={styles.detailValue}>
                    ₦{campaign.minimumDeposit.toLocaleString()}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.campaignFooter}>
              <Text style={styles.campaignCode}>Code: {campaign.campaignCode}</Text>
              <Text style={styles.campaignExpiry}>
                Valid until {new Date(campaign.endDate).toLocaleDateString()}
              </Text>
            </View>
          </GlassCard>
        </AnimatedTouchable>
      </Animated.View>
    );
  };

  // Render redemption history item
  const renderRedemptionItem = (redemption: PromoCodeRedemption, index: number) => {
    const statusColors = {
      pending: theme.colors.warning,
      completed: theme.colors.success,
      failed: theme.colors.error,
    };

    return (
      <Animated.View
        key={redemption.id}
        entering={FadeInDown.delay(index * 50).springify()}
      >
        <GlassCard style={styles.redemptionCard}>
          <View style={styles.redemptionHeader}>
            <Text style={styles.redemptionName}>{redemption.campaignName}</Text>
            <View style={[styles.statusDot, { backgroundColor: statusColors[redemption.status] }]} />
          </View>

          <View style={styles.redemptionDetails}>
            <Text style={styles.redemptionLabel}>Code: {redemption.campaignCode}</Text>
            <Text style={styles.redemptionDate}>
              {new Date(redemption.redemptionDate).toLocaleDateString()}
            </Text>
          </View>

          {redemption.bonusPoints && (
            <Text style={[styles.redemptionBonus, { color: theme.colors.success }]}>
              +{redemption.bonusPoints} points earned
            </Text>
          )}
          {redemption.bonusAmount && (
            <Text style={[styles.redemptionBonus, { color: theme.colors.success }]}>
              +₦{redemption.bonusAmount.toLocaleString()} bonus
            </Text>
          )}
        </GlassCard>
      </Animated.View>
    );
  };

  // Render content based on active tab
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <View style={{ height: 150, marginBottom: 16, backgroundColor: '#f0f0f0', borderRadius: 12 }} />
          <View style={{ height: 150, marginBottom: 16, backgroundColor: '#f0f0f0', borderRadius: 12 }} />
          <View style={{ height: 150, marginBottom: 16, backgroundColor: '#f0f0f0', borderRadius: 12 }} />
        </View>
      );
    }

    switch (activeTab) {
      case 'browse':
        return campaigns.length > 0 ? (
          <ScrollView
            style={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={() => loadCampaigns(true)} />
            }
          >
            {campaigns.map((campaign, index) => renderCampaignCard(campaign, index))}
          </ScrollView>
        ) : (
          <EmptyState
            title="No Active Campaigns"
            description="There are no promotional campaigns available at the moment. Check back soon!"
            illustration="custom"
            customIllustration={<Text style={{ fontSize: 64 }}>🎫</Text>}
            primaryAction={{
              label: "Refresh",
              onPress: () => loadCampaigns(true),
            }}
          />
        );

      case 'redeem':
        return (
          <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeInDown.springify()}>
              <GlassCard style={styles.redeemCard}>
                <Text style={styles.redeemTitle}>🎁 Enter Promo Code</Text>
                <Text style={styles.redeemSubtitle}>
                  Have a promo code? Enter it below to claim your bonus!
                </Text>

                <View style={styles.redeemForm}>
                  <Input
                    label="Promo Code"
                    value={promoCode}
                    onChangeText={(text) => {
                      setPromoCode(text.toUpperCase());
                      setValidationResult(null);
                    }}
                    placeholder="PROMO2025"
                    autoCapitalize="characters"
                    maxLength={20}
                  />

                  {isValidating && (
                    <Text style={styles.validatingText}>Validating code...</Text>
                  )}

                  {validationResult && (
                    <GlassCard
                      style={[
                        styles.validationCard,
                        validationResult.isValid ? styles.validCard : styles.invalidCard,
                      ] as any}
                    >
                      <Text style={styles.validationIcon}>
                        {validationResult.isValid ? '✅' : '❌'}
                      </Text>
                      <Text
                        style={[
                          styles.validationMessage,
                          { color: validationResult.isValid ? theme.colors.success : theme.colors.error },
                        ]}
                      >
                        {validationResult.message}
                      </Text>

                      {validationResult.isValid && validationResult.campaign && (
                        <View style={styles.validationDetails}>
                          <Text style={styles.validationCampaign}>
                            {validationResult.campaign.campaignName}
                          </Text>
                          {validationResult.campaign.minimumDeposit && (
                            <Text style={styles.validationNote}>
                              Min. deposit: ₦{validationResult.campaign.minimumDeposit.toLocaleString()}
                            </Text>
                          )}
                        </View>
                      )}
                    </GlassCard>
                  )}

                  {validationResult?.isValid && validationResult.campaign?.minimumDeposit && (
                    <Input
                      label="Deposit Amount (Optional)"
                      value={depositAmount}
                      onChangeText={setDepositAmount}
                      placeholder="0.00"
                      keyboardType="numeric"
                    />
                  )}

                  <Button
                    title={isRedeeming ? 'Redeeming...' : 'Redeem Promo Code'}
                    onPress={handleRedeem}
                    disabled={!validationResult?.isValid || isRedeeming}
                    style={styles.redeemButton}
                  />
                </View>
              </GlassCard>
            </Animated.View>
          </ScrollView>
        );

      case 'history':
        return redemptions.length > 0 ? (
          <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
            {redemptions.map((redemption, index) => renderRedemptionItem(redemption, index))}
          </ScrollView>
        ) : (
          <EmptyState
            title="No Redemptions Yet"
            description="You haven't redeemed any promo codes yet. Browse available campaigns to get started!"
            illustration="custom"
            customIllustration={<Text style={{ fontSize: 64 }}>📜</Text>}
            primaryAction={{
              label: "Browse Campaigns",
              onPress: () => handleTabChange('browse'),
            }}
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
        <Text style={styles.headerTitle}>Promo Codes</Text>
        <Text style={styles.headerSubtitle}>Claim exclusive bonuses and rewards</Text>
      </Animated.View>

      {/* Tabs */}
      <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.tabContainer}>
        <AnimatedTouchable
          style={[styles.tab, activeTab === 'browse' && styles.tabActive]}
          onPress={() => handleTabChange('browse')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'browse' && styles.tabTextActive]}>
            Browse
          </Text>
        </AnimatedTouchable>

        <AnimatedTouchable
          style={[styles.tab, activeTab === 'redeem' && styles.tabActive]}
          onPress={() => handleTabChange('redeem')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'redeem' && styles.tabTextActive]}>
            Redeem
          </Text>
        </AnimatedTouchable>

        <AnimatedTouchable
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => handleTabChange('history')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History
          </Text>
        </AnimatedTouchable>
      </Animated.View>

      {/* Content */}
      {renderContent()}

      {/* Selected Campaign Modal would go here */}
    </LinearGradient>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    
      marginLeft: 20,
      marginRight: 20,
      marginTop: 0,
      marginBottom: 0,
      borderRadius: 12,
    paddingBottom: theme.layout.spacing * 2,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.textInverse,
    fontFamily: theme.typography.fontFamily?.display || theme.typography.fontFamily?.primary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: theme.typography.fontFamily?.primary,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.layout.spacing * 2,
    marginBottom: theme.layout.spacing * 2,
    gap: theme.layout.spacing,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.layout.spacing,
    borderRadius: theme.layout.borderRadius,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: theme.colors.surface,
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
  loadingContainer: {
    flex: 1,
    paddingHorizontal: theme.layout.spacing * 2,
  },
  campaignCard: {
    padding: theme.layout.spacing * 1.5,
    marginBottom: theme.layout.spacing * 1.5,
  },
  campaignHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.layout.spacing,
  },
  campaignIcon: {
    fontSize: 32,
    marginRight: theme.layout.spacing,
  },
  campaignHeaderText: {
    flex: 1,
  },
  campaignName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily?.primary,
    marginBottom: 4,
  },
  campaignEligibility: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: theme.colors.background.secondary,
  },
  statusBadgeActive: {
    backgroundColor: `${theme.colors.success}20`,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily?.mono,
  },
  statusTextActive: {
    color: theme.colors.success,
  },
  campaignDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.layout.spacing,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  campaignDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.layout.spacing,
    marginBottom: theme.layout.spacing,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 4,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily?.mono,
  },
  campaignFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.layout.spacing,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  campaignCode: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily?.mono,
  },
  campaignExpiry: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  redeemCard: {
    padding: theme.layout.spacing * 2,
  },
  redeemTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily?.primary,
    marginBottom: 8,
  },
  redeemSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.layout.spacing * 2,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  redeemForm: {
    gap: theme.layout.spacing,
  },
  validatingText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily?.primary,
  },
  validationCard: {
    padding: theme.layout.spacing,
    alignItems: 'center',
  },
  validCard: {
    borderColor: theme.colors.success,
    borderWidth: 1,
  },
  invalidCard: {
    borderColor: theme.colors.error,
    borderWidth: 1,
  },
  validationIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  validationMessage: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  validationDetails: {
    alignItems: 'center',
  },
  validationCampaign: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  validationNote: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  redeemButton: {
    marginTop: theme.layout.spacing,
  },
  redemptionCard: {
    padding: theme.layout.spacing * 1.5,
    marginBottom: theme.layout.spacing,
  },
  redemptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.layout.spacing * 0.5,
  },
  redemptionName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  redemptionDetails: {
    marginBottom: theme.layout.spacing * 0.5,
  },
  redemptionLabel: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  redemptionDate: {
    fontSize: 12,
    color: theme.colors.text.light,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  redemptionBonus: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: theme.typography.fontFamily?.mono,
  },
});

export default PromoCodesScreen;
