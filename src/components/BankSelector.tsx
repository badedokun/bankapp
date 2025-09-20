/**
 * Bank Selector Component
 * Multi-tenant aware bank selection with search and filtering
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useBankingAlert } from '../services/AlertService';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTenant, useTenantTheme } from '../tenants/TenantContext';
import APIService from '../services/api';
import { Bank } from '../types/banking';

export interface BankSelectorProps {
  selectedBank?: Bank | null;
  onBankSelect: (bank: Bank) => void;
  placeholder?: string;
  disabled?: boolean;
  showFullBankName?: boolean;
  testID?: string;
}

export const BankSelector: React.FC<BankSelectorProps> = ({
  selectedBank,
  onBankSelect,
  placeholder = "Select Bank",
  disabled = false,
  showFullBankName = true,
  testID = "bank-selector",
}) => {
  const { currentTenant } = useTenant();
  const theme = useTenantTheme();
  const { showAlert } = useBankingAlert();

  // State management
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load banks from API
   */
  const loadBanks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🏛️ Loading banks for tenant:', currentTenant?.id);

      const response = await APIService.getBanks();

      if (response?.banks) {
        // Filter only active banks and sort alphabetically
        const activeBanks = response.banks
          .filter((bank: Bank) => bank.active !== false)
          .sort((a: Bank, b: Bank) => a.name.localeCompare(b.name));

        setBanks(activeBanks);
        console.log(`✅ Loaded ${activeBanks.length} banks successfully`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Failed to load banks:', error);
      const errorMessage = `Unable to load bank list from ${currentTenant?.displayName || 'bank'} servers. Please check your connection and try again.`;
      setError(errorMessage);

      // Show user-friendly error using banking alert service
      showAlert('Connection Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentTenant, showAlert]);

  /**
   * Filter banks based on search query
   */
  const filteredBanks = useMemo(() => {
    if (!searchQuery.trim()) {
      return banks;
    }

    const query = searchQuery.toLowerCase();
    return banks.filter(bank =>
      bank.name.toLowerCase().includes(query) ||
      bank.code.toLowerCase().includes(query) ||
      (bank.slug && bank.slug.toLowerCase().includes(query))
    );
  }, [banks, searchQuery]);

  /**
   * Handle bank selection
   */
  const handleBankSelect = useCallback((bank: Bank) => {
    console.log('🏦 Bank selected:', { code: bank.code, name: bank.name });
    onBankSelect(bank);
    setIsModalVisible(false);
    setSearchQuery(''); // Reset search when closing
  }, [onBankSelect]);

  /**
   * Open bank selector modal
   */
  const openSelector = useCallback(() => {
    if (disabled) return;

    setIsModalVisible(true);

    // Load banks if not already loaded
    if (banks.length === 0) {
      loadBanks();
    }
  }, [disabled, banks.length, loadBanks]);

  /**
   * Close bank selector modal
   */
  const closeSelector = useCallback(() => {
    setIsModalVisible(false);
    setSearchQuery('');
  }, []);

  /**
   * Format display text for selected bank
   */
  const getDisplayText = useCallback(() => {
    if (!selectedBank) {
      return placeholder;
    }

    if (showFullBankName) {
      return `${selectedBank.name} (${selectedBank.code})`;
    }

    return selectedBank.name;
  }, [selectedBank, placeholder, showFullBankName]);

  // Load banks on mount if needed
  useEffect(() => {
    if (currentTenant && banks.length === 0) {
      loadBanks();
    }
  }, [currentTenant, banks.length, loadBanks]);

  const styles = StyleSheet.create({
    container: {
      marginVertical: theme.spacing.sm,
    },
    label: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.medium as any,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    selector: {
      borderWidth: 2,
      borderColor: selectedBank ? theme.colors.primary : '#e1e5e9',
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: disabled ? '#f5f5f5' : theme.colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 48,
    },
    selectorDisabled: {
      opacity: 0.6,
    },
    selectorText: {
      fontSize: theme.typography.sizes.md,
      color: selectedBank ? theme.colors.text : theme.colors.textSecondary,
      flex: 1,
    },
    arrow: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.sm,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.borderRadius.lg,
      borderTopRightRadius: theme.borderRadius.lg,
      maxHeight: '80%',
      paddingTop: theme.spacing.md,
    },
    modalHeader: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#e1e5e9',
    },
    modalTitle: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.bold as any,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    searchContainer: {
      position: 'relative',
    },
    searchInput: {
      borderWidth: 1,
      borderColor: '#e1e5e9',
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: theme.typography.sizes.md,
      backgroundColor: theme.colors.background,
      paddingLeft: 40, // Space for search icon
    },
    searchIcon: {
      position: 'absolute',
      left: theme.spacing.md,
      top: theme.spacing.sm + 2,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    banksList: {
      flex: 1,
    },
    bankItem: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    bankItemSelected: {
      backgroundColor: `${theme.colors.primary}10`,
    },
    bankInfo: {
      flex: 1,
    },
    bankName: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.medium as any,
      color: theme.colors.text,
      marginBottom: 2,
    },
    bankCode: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
    },
    selectedIndicator: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkmark: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    loadingContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    loadingText: {
      marginTop: theme.spacing.md,
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
    },
    errorContainer: {
      padding: theme.spacing.lg,
      alignItems: 'center',
    },
    errorText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
    },
    retryButtonText: {
      color: '#ffffff',
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.medium as any,
    },
    emptyState: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    closeButton: {
      alignSelf: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.sm,
    },
    closeButtonText: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.primary,
      fontWeight: theme.typography.weights.medium as any,
    },
  });

  return (
    <View style={styles.container}>
      {/* Bank Selector Trigger */}
      <TouchableOpacity
        style={[
          styles.selector,
          disabled && styles.selectorDisabled,
        ]}
        onPress={openSelector}
        disabled={disabled}
        testID={testID}
      >
        <Text style={styles.selectorText}>
          {getDisplayText()}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      {/* Bank Selection Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeSelector}
        testID={`${testID}-modal`}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select Bank
              </Text>

              {/* Search Input */}
              <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search banks..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                  autoCapitalize="words"
                  testID={`${testID}-search`}
                />
              </View>
            </View>

            {/* Banks List */}
            <ScrollView style={styles.banksList} showsVerticalScrollIndicator={false}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.loadingText}>
                    Loading banks from {currentTenant?.displayName || 'server'}...
                  </Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={loadBanks}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : filteredBanks.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    {searchQuery.trim()
                      ? `No banks found matching "${searchQuery}"`
                      : 'No banks available'
                    }
                  </Text>
                </View>
              ) : (
                filteredBanks.map((bank) => (
                  <TouchableOpacity
                    key={bank.code}
                    style={[
                      styles.bankItem,
                      selectedBank?.code === bank.code && styles.bankItemSelected,
                    ]}
                    onPress={() => handleBankSelect(bank)}
                    testID={`${testID}-bank-${bank.code}`}
                  >
                    <View style={styles.bankInfo}>
                      <Text style={styles.bankName}>{bank.name}</Text>
                      <Text style={styles.bankCode}>Code: {bank.code}</Text>
                    </View>

                    {selectedBank?.code === bank.code && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.checkmark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={closeSelector}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default BankSelector;