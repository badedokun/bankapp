/**
 * Modern Loans Menu Screen
 * Glassmorphic design with tenant-aware theming
 * React Native + React Native Web compatible
 * Follows standardized card dimensions and 2-column grid layout
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

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

interface LoanProduct {
  id: string;
  name: string;
  description: string;
  maxAmount: string;
  rate: string;
  duration: string;
  icon: string;
  badge?: string;
  available: boolean;
  recommended?: boolean;
}

export interface ModernLoansMenuScreenProps {
  navigation?: any;
  onBack?: () => void;
  onSelectProduct?: (productId: string) => void;
}

const ModernLoansMenuScreen: React.FC<ModernLoansMenuScreenProps> = ({
  navigation,
  onBack,
  onSelectProduct,
}) => {
  const { theme } = useTenantTheme();
  const notify = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [loanEligibility, setLoanEligibility] = useState({
    maxAmount: 2000000,
    creditScore: 750,
    rating: 'Excellent',
    preApproved: true,
  });

  // Comprehensive loan products
  const loanProducts: LoanProduct[] = [
    {
      id: 'personal',
      name: 'Personal Loan',
      description: 'Quick funds for personal needs',
      maxAmount: '₦5M',
      rate: '15%',
      duration: '1-36 months',
      icon: '💵',
      available: true,
      recommended: true,
    },
    {
      id: 'business',
      name: 'Business Loan',
      description: 'Grow your business capital',
      maxAmount: '₦50M',
      rate: '12%',
      duration: '3-60 months',
      icon: '💼',
      badge: 'SME',
      available: true,
    },
    {
      id: 'quick',
      name: 'Quick Cash',
      description: 'Instant approval, same day',
      maxAmount: '₦100K',
      rate: '20%',
      duration: '7-30 days',
      icon: '⚡',
      badge: 'INSTANT',
      available: true,
    },
    {
      id: 'asset',
      name: 'Asset Finance',
      description: 'Purchase equipment & vehicles',
      maxAmount: '₦100M',
      rate: '10%',
      duration: '12-84 months',
      icon: '🚗',
      available: true,
    },
    {
      id: 'mortgage',
      name: 'Home Mortgage',
      description: 'Own your dream home',
      maxAmount: '₦200M',
      rate: '9%',
      duration: '5-30 years',
      icon: '🏠',
      badge: 'BEST RATE',
      available: true,
    },
    {
      id: 'salary',
      name: 'Salary Advance',
      description: 'Get paid before payday',
      maxAmount: '₦500K',
      rate: '5%',
      duration: '1 month',
      icon: '💰',
      badge: 'LOW RATE',
      available: true,
    },
  ];

  useEffect(() => {
    loadLoanEligibility();
  }, []);

  const loadLoanEligibility = async () => {
    try {
      // Load actual eligibility data from API
      const data = await APIService.getLoanEligibility?.();
      if (data) {
        setLoanEligibility(data);
      }
    } catch (error) {
      // Use default values
    }
  };

  const handleProductSelect = async (productId: string) => {
    setSelectedProduct(productId);
    setIsLoading(true);

    try {
      const product = loanProducts.find(p => p.id === productId);

      // Small delay for visual feedback
      setTimeout(() => {
        setIsLoading(false);
        if (onSelectProduct) {
          onSelectProduct(productId);
        } else if (navigation) {
          // Navigate based on product type
          switch (productId) {
            case 'personal':
              navigation.navigate('PersonalLoan');
              break;
            case 'business':
              navigation.navigate('BusinessLoan');
              break;
            case 'quick':
              navigation.navigate('QuickLoan');
              break;
            default:
              notify.info(
                `${product?.name} application coming soon!`,
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

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG')}`;
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
    eligibilityCard: {
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
    eligibilityHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    eligibilityTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    preApprovedBadge: {
      backgroundColor: theme.colors.success,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    preApprovedText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
    },
    eligibilityGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -8,
    },
    eligibilityItem: {
      width: '50%',
      paddingHorizontal: 8,
      marginBottom: 12,
    },
    eligibilityLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    eligibilityValue: {
      fontSize: 18,
      fontWeight: '700',
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
      minHeight: 180, // CRITICAL: Standardized card height
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
    productFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginTop: 12,
    },
    productRateContainer: {
      flex: 1,
    },
    productRateLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    productRate: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    productAmountContainer: {
      alignItems: 'flex-end',
    },
    productAmountLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    productAmount: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
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
            <Text style={styles.headerTitle}>Loan Products</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <Text style={styles.heroTitle}>Get Funded Today</Text>
              <Text style={styles.heroSubtitle}>
                Competitive rates, quick approval, flexible terms
              </Text>
            </View>

            {/* Eligibility Card */}
            <View style={styles.eligibilityCard}>
              <View style={styles.eligibilityHeader}>
                <Text style={styles.eligibilityTitle}>Your Loan Eligibility</Text>
                {loanEligibility.preApproved && (
                  <View style={styles.preApprovedBadge}>
                    <Text style={styles.preApprovedText}>PRE-APPROVED</Text>
                  </View>
                )}
              </View>
              <View style={styles.eligibilityGrid}>
                <View style={styles.eligibilityItem}>
                  <Text style={styles.eligibilityLabel}>Max Amount</Text>
                  <Text style={styles.eligibilityValue}>
                    {formatCurrency(loanEligibility.maxAmount)}
                  </Text>
                </View>
                <View style={styles.eligibilityItem}>
                  <Text style={styles.eligibilityLabel}>Credit Score</Text>
                  <Text style={[styles.eligibilityValue, { color: theme.colors.success }]}>
                    {loanEligibility.creditScore}
                  </Text>
                </View>
              </View>
            </View>

            {/* Products Grid */}
            <View style={styles.productsSection}>
              <Text style={styles.sectionTitle}>Available Loans</Text>

              <View style={styles.productsGrid}>
                {loanProducts.map((product) => (
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
                          <View style={styles.productBadge}>
                            <Text style={styles.productBadgeText}>{product.badge}</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productDescription}>{product.description}</Text>

                      <View style={styles.productFooter}>
                        <View style={styles.productRateContainer}>
                          <Text style={styles.productRateLabel}>Interest Rate</Text>
                          <Text style={styles.productRate}>{product.rate}</Text>
                        </View>
                        <View style={styles.productAmountContainer}>
                          <Text style={styles.productAmountLabel}>Up to</Text>
                          <Text style={styles.productAmount}>{product.maxAmount}</Text>
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
                <Text style={styles.loadingText}>Loading loan details...</Text>
              </View>
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

export default ModernLoansMenuScreen;