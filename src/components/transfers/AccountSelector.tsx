/**
 * Account Selector Component
 * Dropdown for selecting user accounts with balance display
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
} from 'react-native';
import { useTenantTheme } from '../../tenants/TenantContext';
import { UserAccount } from '../../types/transfers';

interface AccountSelectorProps {
  accounts: UserAccount[];
  selectedAccount?: UserAccount;
  onAccountSelect: (account: UserAccount) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const AccountSelector: React.FC<AccountSelectorProps> = ({
  accounts,
  selectedAccount,
  onAccountSelect,
  label = 'From Account',
  placeholder = 'Select account',
  disabled = false,
}) => {
  const theme = useTenantTheme();
  const [isVisible, setIsVisible] = useState(false);

  const formatCurrency = (amount: number, currency = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleAccountSelect = (account: UserAccount) => {
    onAccountSelect(account);
    setIsVisible(false);
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    label: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.medium as any,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    selector: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      minHeight: 56,
      justifyContent: 'center',
    },
    selectorDisabled: {
      backgroundColor: theme.colors.disabled,
      opacity: 0.6,
    },
    selectorContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    accountInfo: {
      flex: 1,
    },
    accountName: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.medium as any,
      color: theme.colors.text,
      marginBottom: 2,
    },
    accountDetails: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    accountNumber: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
    },
    accountBalance: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold as any,
      color: theme.colors.success || '#4CAF50',
    },
    chevron: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    placeholder: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.textSecondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      width: '100%',
      maxHeight: '80%',
      padding: theme.spacing.lg,
    },
    modalTitle: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.semibold as any,
      color: theme.colors.text,
      marginBottom: theme.spacing.lg,
      textAlign: 'center',
    },
    accountItem: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    selectedAccountItem: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    accountItemName: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.medium as any,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    accountItemDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    accountItemNumber: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
    },
    accountItemBalance: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold as any,
      color: theme.colors.success || '#4CAF50',
    },
    accountType: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    closeButton: {
      marginTop: theme.spacing.lg,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      alignItems: 'center',
    },
    closeButtonText: {
      color: '#ffffff',
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.medium as any,
    },
  });

  const renderAccountItem = ({ item }: { item: UserAccount }) => {
    const isSelected = selectedAccount?.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.accountItem, isSelected && styles.selectedAccountItem]}
        onPress={() => handleAccountSelect(item)}
      >
        <Text style={styles.accountItemName}>
          {item.accountName}
          {item.isDefault && ' (Default)'}
        </Text>
        <View style={styles.accountItemDetails}>
          <View>
            <Text style={styles.accountItemNumber}>
              {item.accountNumber}
            </Text>
            <Text style={styles.accountType}>
              {item.accountType}
            </Text>
          </View>
          <Text style={styles.accountItemBalance}>
            {formatCurrency(item.balance, item.currency)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={[
          styles.selector,
          disabled && styles.selectorDisabled,
        ]}
        onPress={() => !disabled && setIsVisible(true)}
        disabled={disabled}
      >
        <View style={styles.selectorContent}>
          {selectedAccount ? (
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>
                {selectedAccount.accountName}
                {selectedAccount.isDefault && ' (Default)'}
              </Text>
              <View style={styles.accountDetails}>
                <Text style={styles.accountNumber}>
                  {selectedAccount.accountNumber}
                </Text>
                <Text style={styles.accountBalance}>
                  {formatCurrency(selectedAccount.balance, selectedAccount.currency)}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.placeholder}>{placeholder}</Text>
          )}

          {!disabled && (
            <Text style={styles.chevron}>▼</Text>
          )}
        </View>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Select Account</Text>

            <FlatList
              data={accounts}
              renderItem={renderAccountItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default AccountSelector;