/**
 * Modern Savings Menu Screen
 * Glassmorphic design with tenant-aware theming
 * React Native + React Native Web compatible
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from '../../components/common/LinearGradient';
import { useTenantTheme } from '../../context/TenantThemeContext';
import { useNotification } from '../../services/ModernNotificationService';
import APIService from '../../services/api';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const isMobile = screenWidth < 768;

interface SavingsProduct {
  id: string;
  name: string;
  description: string;
  rate: string;
  minAmount: number;
  icon: string;
  features: string[];
  badge?: string;
  color?: string;
  available: boolean;
  recommended?: boolean;
}

export interface ModernSavingsMenuScreenProps {
  navigation?: any;
  onBack?: () => void;
  onSelectProduct?: (productId: string) => void;
}

const ModernSavingsMenuScreen: React.FC<ModernSavingsMenuScreenProps> = ({
  navigation,
  onBack,
  onSelectProduct,
}) => {
  const { theme: tenantTheme } = useTenantTheme();
  const theme = tenantTheme;
  const notify = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [savingsSummary, setSavingsSummary] = useState({
    totalSaved: 750000,
    interestEarned: 37500,
    activeProducts: 3,
    nextPayout: '15 days',
  });

  // Comprehensive savings products
  const savingsProducts: SavingsProduct[] = [
    {
      id: 'flexible',
      name: 'Flexible Savings',
      description: 'Save and withdraw anytime',
      rate: '10%',
      minAmount: 1000,
      icon: '💰',
      features: ['Instant withdrawal', 'No lock period', 'Daily interest'],
      color: theme.colors.success,
      available: true,
      recommended: true,
    },
    {
      id: 'target',
      name: 'Target Savings',
      description: 'Save towards a specific goal',
      rate: '12%',
      minAmount: 5000,
      icon: '🎯',
      features: ['Goal tracking', 'Auto-save', 'Milestone rewards'],
      badge: 'POPULAR',
      available: true,
    },
    {
      id: 'locked',
      name: 'Fixed Deposit',
      description: 'Lock funds for higher returns',
      rate: '15%',
      minAmount: 50000,
      icon: '🔒',
      features: ['Highest returns', '3-12 months', 'Guaranteed rate'],
      badge: 'BEST RATE',
      color: theme.colors.warning,
      available: true,
    },
    {
      id: 'piggybank',
      name: 'Digital Piggybank',
      description: 'Automated daily savings',
      rate: '11%',
      minAmount: 500,
      icon: '🐷',
      features: ['Auto-debit', 'Round-up savings', 'Break only on target'],
      available: true,
    },
    {
      id: 'group',
      name: 'Group Savings',
      description: 'Save with friends & family',
      rate: '11%',
      minAmount: 10000,
      icon: '👥',
      features: ['Shared goals', 'Transparency', 'Group chat'],
      badge: 'SOCIAL',
      available: true,
    },
    {
      id: 'safelock',
      name: 'SafeLock',
      description: 'Ultra-secure long term savings',
      rate: '18%',
      minAmount: 100000,
      icon: '🛡️',
      features: ['1-5 years', 'Premium rates', 'Insurance backed'],
      badge: 'PREMIUM',
      color: theme.colors.primary,
      available: true,
    },
  ];

  useEffect(() => {
    loadSavingsSummary();
  }, []);

  const loadSavingsSummary = async () => {
    try {
      // Load actual savings data from API
      const data = await APIService.getSavingsSummary?.();
      if (data) {
        setSavingsSummary(data);
      }
    } catch (error) {
      // Use default values
    }
  };

  const handleProductSelect = async (productId: string) => {
    setSelectedProduct(productId);
    setIsLoading(true);

    try {
      const product = savingsProducts.find(p => p.id === productId);

      // Small delay for visual feedback
      setTimeout(() => {
        setIsLoading(false);
        if (onSelectProduct) {
          onSelectProduct(productId);
        } else if (navigation) {
          // Navigate based on product type
          switch (productId) {
            case 'flexible':
              navigation.navigate('FlexibleSavings');
              break;
            case 'target':
              navigation.navigate('TargetSavings');
              break;
            case 'locked':
              navigation.navigate('FixedDeposit');
              break;
            default:
              notify.info(
                `${product?.name} feature coming soon!`,
                'Feature in Development'
              );
          }
        }
      }, 500);
    } catch (error) {
      setIsLoading(false);
      notify.error('Unable to proceed', 'Error');
    }
  };


  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      ...Platform.select({
        web: {
          backdropFilter: 'blur(10px)',
        },
      }),
    },
    backButtonText: {
      fontSize: 20,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    headerSpacer: {
      width: 40,
    },
    scrollContent: {
      paddingBottom: 100,
    },
    heroSection: {
      paddingHorizontal: 20,
      paddingVertical: 24,
      alignItems: 'center',
    },
    heroTitle: {
      fontSize: 32,
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: 8,
    },
    heroSubtitle: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
    },
    summaryCard: {
      marginHorizontal: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: 20,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      ...Platform.select({
        web: {
          backdropFilter: 'blur(20px)',
        },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    summaryTitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 16,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -8,
    },
    summaryItem: {
      width: '50%',
      paddingHorizontal: 8,
      marginBottom: 16,
    },
    summaryLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
    },
    summaryValueSmall: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    productsSection: {
      paddingHorizontal: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
      marginBottom: 16,
    },
    productsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -8,
    },
    productCardWrapper: {
      width: isTablet ? '50%' : '100%', // 2 columns on desktop/tablet, 1 on mobile
      paddingHorizontal: 8,
      marginBottom: 16,
    },
    productCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      minHeight: 180,
      ...Platform.select({
        web: {
          backdropFilter: 'blur(20px)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
        },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    productCardSelected: {
      backgroundColor: 'rgba(255, 255, 255, 1)',
      borderColor: theme.colors.primary,
      borderWidth: 2,
    },
    productHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    productIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    productIcon: {
      fontSize: 24,
    },
    productBadge: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    productBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
    },
    productName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    productDescription: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginBottom: 12,
      minHeight: 36, // Ensure consistent height
    },
    productRate: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    productRateLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    productFeatures: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 12,
      marginBottom: -4,
    },
    featureChip: {
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      marginRight: 8,
      marginBottom: 8,
    },
    featureChipText: {
      fontSize: 12,
      color: theme.colors.text,
    },
    productFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginTop: 12,
    },
    minAmountContainer: {
      alignItems: 'flex-end',
    },
    minAmountLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    minAmountValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    selectButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
    },
    selectButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    recommendedBadge: {
      position: 'absolute',
      top: -8,
      right: 16,
      backgroundColor: theme.colors.success,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    recommendedText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,
    },
    loadingContent: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      padding: 24,
      borderRadius: 16,
      alignItems: 'center',
      ...Platform.select({
        web: {
          backdropFilter: 'blur(10px)',
        },
      }),
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: theme.colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack || (() => navigation?.goBack())}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Savings Products</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <Text style={styles.heroTitle}>Grow Your Money</Text>
              <Text style={styles.heroSubtitle}>
                Choose from our range of high-yield savings products
              </Text>
            </View>

            {/* Savings Summary Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Your Savings Overview</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Saved</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(savingsSummary.totalSaved, tenantTheme.currency, { locale: tenantTheme.locale })}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Interest Earned</Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
                    {formatCurrency(savingsSummary.interestEarned, tenantTheme.currency, { locale: tenantTheme.locale })}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Active Products</Text>
                  <Text style={styles.summaryValueSmall}>
                    {savingsSummary.activeProducts} products
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Next Payout</Text>
                  <Text style={styles.summaryValueSmall}>
                    {savingsSummary.nextPayout}
                  </Text>
                </View>
              </View>
            </View>

            {/* Products List */}
            <View style={styles.productsSection}>
              <Text style={styles.sectionTitle}>Available Products</Text>

              <View style={styles.productsGrid}>
                {savingsProducts.map((product) => (
                  <View key={product.id} style={styles.productCardWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.productCard,
                        selectedProduct === product.id && styles.productCardSelected,
                      ]}
                      onPress={() => handleProductSelect(product.id)}
                      activeOpacity={0.8}
                    >
                  {product.recommended && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>RECOMMENDED</Text>
                    </View>
                  )}

                  <View style={styles.productHeader}>
                    <View style={styles.productIconContainer}>
                      <Text style={styles.productIcon}>{product.icon}</Text>
                    </View>
                    {product.badge && (
                      <View style={[
                        styles.productBadge,
                        product.color && { backgroundColor: product.color },
                      ]}>
                        <Text style={styles.productBadgeText}>{product.badge}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productDescription}>{product.description}</Text>

                  <View style={styles.productFooter}>
                    <View>
                      <Text style={styles.productRateLabel}>Interest Rate</Text>
                      <Text style={styles.productRate}>{product.rate} p.a.</Text>
                    </View>
                    <View style={styles.minAmountContainer}>
                      <Text style={styles.minAmountLabel}>Min:</Text>
                      <Text style={styles.minAmountValue}>
                        {formatCurrency(product.minAmount, tenantTheme.currency, { locale: tenantTheme.locale })}
                      </Text>
                    </View>
                  </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Loading Overlay */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingContent}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading product details...</Text>
              </View>
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

export default ModernSavingsMenuScreen;