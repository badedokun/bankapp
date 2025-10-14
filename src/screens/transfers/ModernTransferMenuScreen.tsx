/**
 * Modern Transfer Menu Screen
 * Implements glassmorphic design with tenant-aware theming
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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import LinearGradient from '../../components/common/LinearGradient';
import { GlassCard } from '../../components/ui/GlassCard';
import { triggerHaptic } from '../../utils/haptics';
import { useTenantTheme } from '../../context/TenantThemeContext';
import { useNotification } from '../../services/ModernNotificationService';
import APIService from '../../services/api';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const { width: screenWidth } = Dimensions.get('window');

interface TransferOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  fee: number;
  available: boolean;
  requiresVerification?: boolean;
  badge?: string;
}

export interface ModernTransferMenuScreenProps {
  navigation?: any;
  onBack?: () => void;
  onSelectTransfer?: (transferType: string) => void;
}

const ModernTransferMenuScreen: React.FC<ModernTransferMenuScreenProps> = ({
  navigation,
  onBack,
  onSelectTransfer,
}) => {
  const { theme } = useTenantTheme();
  const notify = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [userPermissions, setUserPermissions] = useState<any>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  // Use inverse color for text on primary gradient background
  const inverseColor = theme.colors.textInverse;

  // Update screen width on resize
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(Dimensions.get('window').width);
    };

    if (Platform.OS === 'web') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    } else {
      const subscription = Dimensions.addEventListener('change', handleResize);
      return () => subscription?.remove();
    }
  }, []);

  // Transfer options with modern icons and descriptions
  const transferOptions: TransferOption[] = [
    {
      id: 'internal',
      name: 'Same Bank Transfer',
      description: `Instant transfer within ${theme.brandName || 'this bank'}`,
      icon: '🏦',
      fee: 0,
      available: true,
      badge: 'FREE',
    },
    {
      id: 'external',
      name: 'Other Banks',
      description: 'Transfer to any Nigerian bank',
      icon: '🏛️',
      fee: 52.50,
      available: true,
    },
    {
      id: 'international',
      name: 'International',
      description: 'Send money abroad',
      icon: '🌍',
      fee: 2500,
      available: true,
      requiresVerification: true,
      badge: 'SWIFT',
    },
    {
      id: 'mobile',
      name: 'Mobile Money',
      description: 'Send to mobile wallets',
      icon: '📱',
      fee: 25,
      available: true,
    },
    {
      id: 'bulk',
      name: 'Bulk Transfer',
      description: 'Multiple transfers at once',
      icon: '📊',
      fee: 100,
      available: true,
      badge: 'BUSINESS',
    },
    {
      id: 'scheduled',
      name: 'Schedule Transfer',
      description: 'Set up future transfers',
      icon: '⏰',
      fee: 0,
      available: true,
      badge: 'NEW',
    },
  ];

  useEffect(() => {
    loadUserPermissions();
  }, []);

  const loadUserPermissions = async () => {
    try {
      const permissions = await APIService.getUserPermissions();
      setUserPermissions(permissions);
    } catch (error) {
      // Use default permissions
      setUserPermissions({
        internal_transfers: true,
        external_transfers: true,
        international_transfers: false,
      });
    }
  };

  const handleTransferSelect = async (transferType: string) => {
    triggerHaptic('impactMedium');
    setSelectedOption(transferType);
    setIsLoading(true);

    try {
      // Check permissions
      const option = transferOptions.find(opt => opt.id === transferType);

      if (option?.requiresVerification) {
        triggerHaptic('impactLight');
        notify.info(
          'International transfers require additional verification',
          'Verification Required'
        );
      }

      // Small delay for visual feedback
      setTimeout(() => {
        setIsLoading(false);
        if (onSelectTransfer) {
          onSelectTransfer(transferType);
        } else if (navigation) {
          // Navigate based on transfer type
          switch (transferType) {
            case 'internal':
              navigation.navigate('InternalTransfer');
              break;
            case 'external':
              navigation.navigate('ExternalTransfer');
              break;
            case 'bulk':
              navigation.navigate('BulkTransfer');
              break;
            case 'scheduled':
              navigation.navigate('ScheduledTransfer');
              break;
            default:
              navigation.navigate('CompleteTransferFlow', { transferType });
          }
        }
      }, 500);
    } catch (error) {
      setIsLoading(false);
      triggerHaptic('notificationError');
      notify.error('Unable to proceed with transfer', 'Error');
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
      
      marginLeft: 20,
      marginRight: 20,
      marginTop: 0,
      marginBottom: 0,
      borderRadius: 12,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${inverseColor}33`, // 20% opacity
      justifyContent: 'center',
      alignItems: 'center',
      ...Platform.select({
        web: {
          backdropFilter: 'blur(10px)',
        },
      }),
    },
    backButtonText: {
      fontSize: 20,
      color: inverseColor,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: inverseColor,
    },
    headerSpacer: {
      width: 40,
    },
    scrollContent: {
      paddingBottom: 100,
    },
    titleSection: {
      paddingHorizontal: 20,
      paddingVertical: 24,
      alignItems: 'center',
    },
    mainTitle: {
      fontSize: 32,
      fontWeight: '700',
      color: inverseColor,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: `${inverseColor}E6`, // 90% opacity
      textAlign: 'center',
    },
    optionsContainer: {
      marginLeft: 20,
      marginRight: 20,
      paddingTop: 8,
    },
    optionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    optionCard: {
      flex: screenWidth >= 768 ? 1 : undefined,
      width: screenWidth < 768 ? '100%' : undefined,
      backgroundColor: `${theme.colors.surface}F2`, // 95% opacity
      borderRadius: 20,
      padding: 20,
      marginHorizontal: screenWidth >= 768 ? 8 : 0,
      minHeight: 180,
      borderWidth: 1,
      borderColor: `${theme.colors.textInverse}4D`, // 30% opacity
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
    optionCardPressed: {
      transform: [{ scale: 0.98 }],
      opacity: 0.9,
    },
    optionCardSelected: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.primary,
      borderWidth: 2,
    },
    optionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    optionIcon: {
      fontSize: 32,
    },
    badge: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeText: {
      color: inverseColor,
      fontSize: 10,
      fontWeight: '700',
    },
    optionName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    optionDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 12,
    },
    optionFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 'auto',
    },
    feeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    feeLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginRight: 4,
    },
    feeAmount: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    freeBadge: {
      backgroundColor: theme.colors.success,
    },
    arrow: {
      fontSize: 16,
      color: theme.colors.primary,
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
      backgroundColor: `${theme.colors.surface}F2`, // 95% opacity
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
    infoCard: {
      marginLeft: 20,
      marginRight: 20,
      marginTop: 24,
    },
    infoCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    infoIcon: {
      fontSize: 24,
      marginRight: 12,
    },
    infoText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
    },
  });

  // Group options into rows - 1 per row on mobile, 2 per row on desktop
  const optionsPerRow = screenWidth >= 768 ? 2 : 1;
  const optionRows: TransferOption[][] = [];
  for (let i = 0; i < transferOptions.length; i += optionsPerRow) {
    optionRows.push(transferOptions.slice(i, i + optionsPerRow));
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primaryGradientStart, theme.colors.primaryGradientEnd]}
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
            <Text style={styles.headerTitle}>Transfer Money</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Title Section */}
            <Animated.View entering={FadeInUp.springify()} style={styles.titleSection}>
              <Text style={[styles.mainTitle, { fontFamily: theme.typography.fontFamily?.display || theme.typography.fontFamily?.primary }]}>
                Send Money
              </Text>
              <Text style={[styles.subtitle, { fontFamily: theme.typography.fontFamily?.primary }]}>
                Choose how you want to transfer funds
              </Text>
            </Animated.View>

            {/* Transfer Options Grid */}
            <View style={styles.optionsContainer}>
              {optionRows.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.optionRow}>
                  {row.map((option, optionIndex) => (
                    <Animated.View
                      key={option.id}
                      entering={FadeInDown.delay((rowIndex * row.length + optionIndex) * 100).springify()}
                      style={{ flex: 1 }}
                    >
                      <AnimatedTouchable
                        style={[
                          styles.optionCard,
                          selectedOption === option.id && styles.optionCardSelected,
                        ]}
                        onPress={() => handleTransferSelect(option.id)}
                        activeOpacity={0.8}
                      >
                      <View style={styles.optionHeader}>
                        <Text style={styles.optionIcon}>{option.icon}</Text>
                        {option.badge && (
                          <View style={[
                            styles.badge,
                            option.badge === 'FREE' && styles.freeBadge,
                          ]}>
                            <Text style={styles.badgeText}>{option.badge}</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.optionName}>{option.name}</Text>
                      <Text style={styles.optionDescription}>{option.description}</Text>

                      <View style={styles.optionFooter}>
                        <View style={styles.feeContainer}>
                          <Text style={[styles.feeLabel, { fontFamily: theme.typography.fontFamily?.primary }]}>Fee:</Text>
                          <Text style={[styles.feeAmount, { fontFamily: theme.typography.fontFamily?.mono }]}>
                            {option.fee === 0 ? 'FREE' : formatCurrency(option.fee, 'NGN', { locale: 'en-NG' })}
                          </Text>
                        </View>
                        <Text style={styles.arrow}>→</Text>
                      </View>
                    </AnimatedTouchable>
                    </Animated.View>
                  ))}
                  {row.length === 1 && <View style={{ flex: 1, marginHorizontal: 8 }} />}
                </View>
              ))}
            </View>

            {/* Info Card */}
            <Animated.View entering={FadeInUp.delay(600).springify()} style={styles.infoCard}>
              <GlassCard>
                <View style={styles.infoCardContent}>
                  <Text style={styles.infoIcon}>💡</Text>
                  <Text style={[styles.infoText, { fontFamily: theme.typography.fontFamily?.primary }]}>
                    Transfer limits apply based on your account type.
                    Upgrade to Premium for higher limits and reduced fees.
                  </Text>
                </View>
              </GlassCard>
            </Animated.View>
          </ScrollView>

          {/* Loading Overlay */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingContent}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Preparing transfer...</Text>
              </View>
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

export default ModernTransferMenuScreen;