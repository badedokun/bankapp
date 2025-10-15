/**
 * Bank Selector Picker Component
 * Modern glassmorphic dropdown picker for Nigerian banks
 * Follows Modern UI Design System guidelines
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTenantTheme } from '../../context/TenantThemeContext';
import APIService from '../../services/api';

export interface Bank {
  code: string;
  name: string;
}

interface BankSelectorPickerProps {
  selectedBank?: Bank;
  onSelectBank: (bank: Bank) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

const BankSelectorPicker: React.FC<BankSelectorPickerProps> = ({
  selectedBank,
  onSelectBank,
  label = 'Bank',
  placeholder = 'Select Bank',
  disabled = false,
}) => {
  const { theme } = useTenantTheme() as any;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allBanks, setAllBanks] = useState<Bank[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);

  // Default Nigerian Banks List (fallback)
  const defaultBanks: Bank[] = [
    { code: 'GTB', name: 'Guaranty Trust Bank (GTB)' },
    { code: 'UBA', name: 'United Bank for Africa (UBA)' },
    { code: 'FBN', name: 'First Bank of Nigeria (FBN)' },
    { code: 'ZEN', name: 'Zenith Bank' },
    { code: 'ACC', name: 'Access Bank' },
    { code: 'ECO', name: 'Ecobank Nigeria' },
    { code: 'STB', name: 'Stanbic IBTC Bank' },
    { code: 'UNI', name: 'Union Bank' },
    { code: 'POL', name: 'Polaris Bank' },
    { code: 'FID', name: 'Fidelity Bank' },
    { code: 'WEM', name: 'Wema Bank' },
    { code: 'UNT', name: 'Unity Bank' },
    { code: 'STR', name: 'Sterling Bank' },
    { code: 'KUD', name: 'Keystone Bank' },
    { code: 'JAI', name: 'Jaiz Bank' },
    { code: 'HER', name: 'Heritage Bank' },
    { code: 'FCM', name: 'FCMB' },
  ];

  // Load banks from API on mount
  useEffect(() => {
    loadBanksFromAPI();
  }, []);

  const loadBanksFromAPI = async () => {
    setIsLoadingBanks(true);
    try {
      const banksData = await APIService.getBanks();
      if (banksData.banks && banksData.banks.length > 0) {
        // Transform API banks to match our Bank interface
        const transformedBanks: Bank[] = banksData.banks.map((bank) => ({
          code: bank.code,
          name: bank.name,
        }));
        setAllBanks(transformedBanks);
      } else {
        // Use default banks if API returns empty
        setAllBanks(defaultBanks);
      }
    } catch (error) {
      console.error('Error loading banks from API:', error);
      // Fallback to default banks on error
      setAllBanks(defaultBanks);
    } finally {
      setIsLoadingBanks(false);
    }
  };

  // Filter banks based on search
  const filteredBanks = allBanks.filter(bank =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bank.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectBank = (bank: Bank) => {
    onSelectBank(bank);
    setIsModalVisible(false);
    setSearchQuery('');
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: '#FFFFFF',
      marginBottom: 8,
    },
    pickerButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 8,
      backgroundColor: '#FFFFFF',
    },
    pickerButtonDisabled: {
      backgroundColor: '#f3f4f6',
      opacity: 0.6,
    },
    pickerText: {
      fontSize: 16,
      color: '#1a1a2e',
    },
    pickerPlaceholder: {
      color: '#94a3b8',
    },
    pickerIcon: {
      fontSize: 16,
      color: '#6c757d',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '80%',
      ...Platform.select({
        web: {
          backdropFilter: 'blur(20px)',
        },
      }),
    },
    modalHeader: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#1a1a2e',
      textAlign: 'center',
      marginBottom: 16,
    },
    searchInput: {
      backgroundColor: '#f3f4f6',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: '#1a1a2e',
    },
    bankList: {
      maxHeight: 400,
    },
    bankItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
    },
    bankItemSelected: {
      backgroundColor: 'rgba(37, 99, 235, 0.05)',
    },
    bankName: {
      fontSize: 16,
      fontWeight: '500',
      color: '#1a1a2e',
    },
    bankCode: {
      fontSize: 12,
      color: '#6c757d',
      marginTop: 2,
    },
    closeButton: {
      padding: 16,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: '#e2e8f0',
    },
    closeButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
    },
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.pickerButton, disabled && styles.pickerButtonDisabled]}
        onPress={() => !disabled && setIsModalVisible(true)}
        disabled={disabled}
      >
        <Text
          style={[
            styles.pickerText,
            !selectedBank && styles.pickerPlaceholder,
          ]}
        >
          {selectedBank ? selectedBank.name : placeholder}
        </Text>
        <Text style={styles.pickerIcon}>▼</Text>
      </TouchableOpacity>

      {/* Bank Selection Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Bank</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search banks..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
              </View>

              <ScrollView style={styles.bankList}>
                {isLoadingBanks ? (
                  <View style={{ padding: 40, alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={{ marginTop: 12, color: '#6c757d' }}>Loading banks...</Text>
                  </View>
                ) : filteredBanks.length === 0 ? (
                  <View style={{ padding: 40, alignItems: 'center' }}>
                    <Text style={{ color: '#6c757d' }}>No banks found</Text>
                  </View>
                ) : (
                  filteredBanks.map((bank) => (
                    <TouchableOpacity
                      key={bank.code}
                      style={[
                        styles.bankItem,
                        selectedBank?.code === bank.code && styles.bankItemSelected,
                      ]}
                      onPress={() => handleSelectBank(bank)}
                    >
                      <Text style={styles.bankName}>{bank.name}</Text>
                      <Text style={styles.bankCode}>{bank.code}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default BankSelectorPicker;