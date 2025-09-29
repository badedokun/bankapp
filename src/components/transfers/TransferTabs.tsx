/**
 * Transfer Tabs Component
 * Tab navigation for different transfer types (Internal/External)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTenantTheme } from '../../tenants/TenantContext';
import { TransferType } from '../../types/transfers';

interface TransferTab {
  id: TransferType;
  label: string;
  icon: string;
  description: string;
}

interface TransferTabsProps {
  activeTab: TransferType;
  onTabChange: (tab: TransferType) => void;
  availableTabs?: TransferType[];
}

const transferTabs: TransferTab[] = [
  {
    id: 'internal',
    label: 'Internal',
    icon: '🏦',
    description: 'Same bank transfers',
  },
  {
    id: 'external',
    label: 'External',
    icon: '🏛️',
    description: 'Other banks (NIBSS)',
  },
  {
    id: 'bill_payment',
    label: 'Bills',
    icon: '💡',
    description: 'Pay bills & utilities',
  },
  {
    id: 'international',
    label: 'International',
    icon: '🌍',
    description: 'Global transfers',
  },
  {
    id: 'scheduled',
    label: 'Scheduled',
    icon: '⏰',
    description: 'Future & recurring',
  },
];

export const TransferTabs: React.FC<TransferTabsProps> = ({
  activeTab,
  onTabChange,
  availableTabs = ['internal', 'external', 'bill_payment'],
}) => {
  const theme = useTenantTheme();

  const filteredTabs = transferTabs.filter(tab =>
    availableTabs.includes(tab.id)
  );

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    scrollContainer: {
      paddingHorizontal: theme.spacing.md,
    },
    tabsRow: {
      flexDirection: 'row',
      paddingVertical: theme.spacing.sm,
    },
    tab: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      marginRight: theme.spacing.sm,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: 'transparent',
      minWidth: 120,
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: theme.colors.primary + '20',
      borderColor: theme.colors.primary,
    },
    tabIcon: {
      fontSize: 24,
      marginBottom: theme.spacing.xs,
    },
    tabLabel: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.medium as any,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 2,
    },
    activeTabLabel: {
      color: theme.colors.primary,
      fontWeight: theme.typography.weights.semibold as any,
    },
    tabDescription: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      opacity: 0.8,
    },
    activeTabDescription: {
      color: theme.colors.primary,
      opacity: 1,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.tabsRow}>
          {filteredTabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, isActive && styles.activeTab]}
                onPress={() => onTabChange(tab.id)}
              >
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                  {tab.label}
                </Text>
                <Text style={[styles.tabDescription, isActive && styles.activeTabDescription]}>
                  {tab.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default TransferTabs;