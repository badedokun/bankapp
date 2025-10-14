/**
 * Beneficiary Selector Component
 * Shows saved beneficiaries with quick selection
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { useTenantTheme } from '../../tenants/TenantContext';
import { Beneficiary } from '../../types/transfers';

interface BeneficiarySelectorProps {
  beneficiaries: Beneficiary[];
  onBeneficiarySelect: (beneficiary: Beneficiary) => void;
  onAddNew?: () => void;
  showAddNew?: boolean;
  maxVisible?: number;
}

export const BeneficiarySelector: React.FC<BeneficiarySelectorProps> = ({
  beneficiaries,
  onBeneficiarySelect,
  onAddNew,
  showAddNew = true,
  maxVisible = 4,
}) => {
  const theme = useTenantTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  // Sort beneficiaries by frequency and recent usage
  const sortedBeneficiaries = [...beneficiaries].sort((a, b) => {
    if (a.isFrequent !== b.isFrequent) {
      return a.isFrequent ? -1 : 1;
    }
    return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
  });

  // Filter by search query
  const filteredBeneficiaries = sortedBeneficiaries.filter(beneficiary =>
    beneficiary.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    beneficiary.accountNumber.includes(searchQuery) ||
    (beneficiary.nickname && beneficiary.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Limit visible items
  const visibleBeneficiaries = showAll
    ? filteredBeneficiaries
    : filteredBeneficiaries.slice(0, maxVisible);

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.semibold as any,
      color: theme.colors.text,
    },
    addButton: {
      backgroundColor: theme.colors.primary + '20',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    addButtonText: {
      color: theme.colors.primary,
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.medium as any,
    },
    searchContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    searchInput: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.text,
      paddingVertical: theme.spacing.md,
    },
    beneficiariesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    beneficiaryCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      width: '48%',
      minHeight: 100,
      justifyContent: 'space-between',
    },
    frequentBeneficiary: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    beneficiaryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.xs,
    },
    beneficiaryName: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.medium as any,
      color: theme.colors.text,
      flex: 1,
      marginRight: theme.spacing.xs,
    },
    frequentBadge: {
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    frequentBadgeText: {
      color: '#ffffff',
      fontSize: 10,
      fontWeight: 'bold',
    },
    beneficiaryDetails: {
      marginBottom: theme.spacing.xs,
    },
    beneficiaryAccount: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    beneficiaryBank: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textSecondary,
    },
    beneficiaryNickname: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.primary,
      fontStyle: 'italic',
    },
    beneficiaryStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    transferCount: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textSecondary,
    },
    lastUsed: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textSecondary,
    },
    showMoreButton: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      alignItems: 'center',
      marginTop: theme.spacing.sm,
      width: '100%',
    },
    showMoreText: {
      color: theme.colors.primary,
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.medium as any,
    },
    emptyState: {
      alignItems: 'center',
      padding: theme.spacing.xl,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: theme.spacing.md,
      opacity: 0.5,
    },
    emptyTitle: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.medium as any,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    emptyDescription: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
  });

  const formatLastUsed = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}m ago`;
  };

  const renderBeneficiaryCard = (beneficiary: Beneficiary) => (
    <TouchableOpacity
      key={beneficiary.id}
      style={[
        styles.beneficiaryCard,
        beneficiary.isFrequent && styles.frequentBeneficiary,
      ]}
      onPress={() => onBeneficiarySelect(beneficiary)}
    >
      <View>
        <View style={styles.beneficiaryHeader}>
          <Text style={styles.beneficiaryName} numberOfLines={1}>
            {beneficiary.nickname || beneficiary.name}
          </Text>
          {beneficiary.isFrequent && (
            <View style={styles.frequentBadge}>
              <Text style={styles.frequentBadgeText}>★</Text>
            </View>
          )}
        </View>

        <View style={styles.beneficiaryDetails}>
          <Text style={styles.beneficiaryAccount}>
            {beneficiary.accountNumber}
          </Text>
          <Text style={styles.beneficiaryBank}>
            {beneficiary.bankName}
          </Text>
          {beneficiary.nickname && (
            <Text style={styles.beneficiaryNickname}>
              {beneficiary.name}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.beneficiaryStats}>
        <Text style={styles.transferCount}>
          {beneficiary.totalTransfers} transfers
        </Text>
        <Text style={styles.lastUsed}>
          {formatLastUsed(beneficiary.lastUsed)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (beneficiaries.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Saved Recipients</Text>
          {showAddNew && onAddNew && (
            <TouchableOpacity style={styles.addButton} onPress={onAddNew}>
              <Text style={styles.addButtonText}>+ Add New</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>No Saved Recipients</Text>
          <Text style={styles.emptyDescription}>
            Save recipients for quick and easy transfers. Your frequently used
            recipients will appear here.
          </Text>
          {showAddNew && onAddNew && (
            <TouchableOpacity style={styles.addButton} onPress={onAddNew}>
              <Text style={styles.addButtonText}>Add Your First Recipient</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Recipients</Text>
        {showAddNew && onAddNew && (
          <TouchableOpacity style={styles.addButton} onPress={onAddNew}>
            <Text style={styles.addButtonText}>+ Add New</Text>
          </TouchableOpacity>
        )}
      </View>

      {beneficiaries.length > maxVisible && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipients..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      <View style={styles.beneficiariesGrid}>
        {visibleBeneficiaries.map(renderBeneficiaryCard)}
      </View>

      {!showAll && filteredBeneficiaries.length > maxVisible && (
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={() => setShowAll(true)}
        >
          <Text style={styles.showMoreText}>
            Show {filteredBeneficiaries.length - maxVisible} More Recipients
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default BeneficiarySelector;