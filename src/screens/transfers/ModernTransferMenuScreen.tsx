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
import LinearGradient from '../../components/common/LinearGradient';
import { useTenantTheme } from '../../context/TenantThemeContext';
import { useNotification } from '../../services/ModernNotificationService';
import APIService from '../../services/api';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';

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
  const { theme, theme: tenantTheme } = useTenantTheme();
  const notify = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [userPermissions, setUserPermissions] = useState<any>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Transfer options with modern icons and descriptions
  const transferOptions: TransferOption[] = [
    {
      id: 'internal',
      name: 'Same Bank Transfer',
      description: 'Instant transfer within FMFB',
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
    setSelectedOption(transferType);
    setIsLoading(true);

    try {
      // Check permissions
      const option = transferOptions.find(opt => opt.id === transferType);

      if (option?.requiresVerification) {
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
      ...Platform.select({
        web: {
          backdropFilter: 'blur(10px)',
        },
      }),
    },
    backButtonText: {
      fontSize: 20,
      color: '#FFFFFF',
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
    titleSection: {
      paddingHorizontal: 20,
      paddingVertical: 24,
      alignItems: 'center',
    },
    mainTitle: {
      fontSize: 32,
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
    },
    optionsContainer: {
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    optionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    optionCard: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: 20,
      padding: 20,
      marginHorizontal: 8,
      minHeight: 180,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
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
      backgroundColor: 'rgba(255, 255, 255, 1)',
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
      color: '#FFFFFF',
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
    infoCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 20,
      marginTop: 24,
      flexDirection: 'row',
      alignItems: 'center',
      ...Platform.select({
        web: {
          backdropFilter: 'blur(10px)',
        },
      }),
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

  // Group options into rows of 2
  const optionRows: TransferOption[][] = [];
  for (let i = 0; i < transferOptions.length; i += 2) {
    optionRows.push(transferOptions.slice(i, i + 2));
  }

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
            <Text style={styles.headerTitle}>Transfer Money</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.mainTitle}>Send Money</Text>
              <Text style={styles.subtitle}>
                Choose how you want to transfer funds
              </Text>
            </View>

            {/* Transfer Options Grid */}
            <View style={styles.optionsContainer}>
              {optionRows.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.optionRow}>
                  {row.map((option) => (
                    <TouchableOpacity
                      key={option.id}
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
                          <Text style={styles.feeLabel}>Fee:</Text>
                          <Text style={styles.feeAmount}>
                            {option.fee === 0 ? 'FREE' : formatCurrency(option.fee, tenantTheme.currency, { locale: tenantTheme.locale })}
                          </Text>
                        </View>
                        <Text style={styles.arrow}>→</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {row.length === 1 && <View style={{ flex: 1, marginHorizontal: 8 }} />}
                </View>
              ))}
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>💡</Text>
              <Text style={styles.infoText}>
                Transfer limits apply based on your account type.
                Upgrade to Premium for higher limits and reduced fees.
              </Text>
            </View>
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