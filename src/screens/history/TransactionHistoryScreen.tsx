/**
 * Transaction History Screen Component
 * Complete transaction history with filtering, search, and AI insights
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  TextInput,
  Platform,
} from 'react-native';
import { useTenant, useTenantTheme } from '../../tenants/TenantContext';
import { useBankingAlert } from '../../services/AlertService';
import APIService from '../../services/api';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';

const { width: screenWidth } = Dimensions.get('window');

interface TransactionHistoryData {
  transactions: DetailedTransaction[];
  summary: {
    totalTransactions: number;
    totalVolume: string;
    avgFees: string;
    monthlyChange: string;
  };
  aiInsights: {
    message: string;
    suggestions: string[];
  };
}

interface DetailedTransaction {
  id: string;
  referenceNumber: string;
  type: 'sent' | 'received' | 'pending' | 'bills';
  status: 'completed' | 'pending' | 'failed';
  title: string;
  subtitle: string;
  amount: number;
  fees: number;
  balance: number;
  timestamp: string;
  date: string;
  icon: string;
  originalTransaction?: any; // Store the original API transaction data
}

export interface TransactionHistoryScreenProps {
  onBack?: () => void;
  onTransactionDetails?: (transactionId: string, transaction?: any) => void;
}

export const TransactionHistoryScreen: React.FC<TransactionHistoryScreenProps> = ({
  onBack,
  onTransactionDetails,
}) => {
  const { currentTenant } = useTenant();
  const theme = useTenantTheme();
  const tenantTheme = useTenantTheme();
  const { showAlert } = useBankingAlert();
  
  // State
  const [historyData, setHistoryData] = useState<TransactionHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('this-month');
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const [filteredTransactions, setFilteredTransactions] = useState<DetailedTransaction[]>([]);

  // Load transaction history
  const loadHistoryData = useCallback(async () => {
    try {
      console.log('🔍 Loading transfer history data...');
      const [transactionsData, walletData] = await Promise.all([
        APIService.getTransferHistory({ 
          page: 1, 
          limit: 50,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined,
        }),
        APIService.getWalletBalance()
      ]);

      console.log('📊 Transfer history response:', transactionsData);
      console.log('📋 Transactions array:', transactionsData.transactions);

      // Calculate progressive balances starting from current balance
      let runningBalance = walletData.balance;
      
      // Convert API transactions to detailed format with progressive balance calculation
      const detailedTransactions: DetailedTransaction[] = (transactionsData.transactions || [])
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Most recent first
        .map((tx: any, index: number) => {
          // For balance calculation: sent transactions reduce balance, received increase it
          const transactionAmount = tx.direction === 'sent' ? -Math.abs(tx.amount) : Math.abs(tx.amount);
          const balanceAfterTransaction = index === 0 ? runningBalance : runningBalance;
          
          // Update running balance for next transaction (going backwards in time)
          if (index > 0) {
            runningBalance = runningBalance - transactionAmount;
          }
          
          return {
            id: tx.id,
            referenceNumber: tx.reference,
            type: tx.direction === 'sent' ? 'sent' : 'received',
            status: tx.status === 'successful' ? 'completed' : tx.status,
            title: tx.description || 'Money Transfer',
            subtitle: tx.recipient ? `Bank Transfer • ${tx.recipient.accountName}` : 'Banking Transaction',
            amount: transactionAmount,
            fees: tx.fee || 0,
            balance: balanceAfterTransaction,
            timestamp: new Date(tx.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            date: tx.createdAt,
            icon: tx.direction === 'sent' ? '↗️' : '↙️',
            originalTransaction: tx, // Store the complete original transaction data
          };
        });

      const totalFees = detailedTransactions.reduce((sum, tx) => sum + tx.fees, 0);
      const totalVolume = detailedTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      const avgFees = detailedTransactions.length > 0 ? totalFees / detailedTransactions.length : 0;

      setHistoryData({
        transactions: detailedTransactions,
        summary: {
          totalTransactions: detailedTransactions.length,
          totalVolume: `${formatCurrency(totalVolume / 1000000, tenantTheme.currency)}M`,
          avgFees: formatCurrency(avgFees, tenantTheme.currency),
          monthlyChange: '+0%', // Would need historical data to calculate
        },
        aiInsights: {
          message: `You have ${detailedTransactions.length} transactions with a total volume of ${formatCurrency(totalVolume, tenantTheme.currency)}. Your average transaction fee is ${formatCurrency(avgFees, tenantTheme.currency)}.`,
          suggestions: ['View spending patterns', 'Download transaction history', 'Set up transfer limits'],
        },
      });

      setFilteredTransactions(detailedTransactions);
    } catch (error) {
      console.error('Failed to load transaction history:', error);
      showAlert('Error', 'Failed to load transaction history. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [statusFilter, typeFilter]);

  // Filter transactions based on search and filters
  useEffect(() => {
    if (!historyData) return;

    let filtered = historyData.transactions;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.title.toLowerCase().includes(query) ||
        tx.subtitle.toLowerCase().includes(query) ||
        tx.referenceNumber.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(tx => tx.type === typeFilter);
    }

    setFilteredTransactions(filtered);
  }, [historyData, searchQuery, statusFilter, typeFilter]);

  // Load data on mount
  useEffect(() => {
    loadHistoryData();
  }, [loadHistoryData]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadHistoryData();
  }, [loadHistoryData]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setDateRange('this-month');
  }, []);

  // Handle AI suggestion
  const handleAISuggestion = useCallback((suggestion: string) => {
    showAlert('AI Assistant', `I'll help you ${suggestion.toLowerCase()}. This feature is coming soon!`);
  }, []);

  // Export transactions
  const handleExport = useCallback(() => {
    showAlert('Export', 'Exporting transaction history... This feature is coming soon!');
  }, []);

  // Analytics
  const handleAnalytics = useCallback(() => {
    showAlert('Analytics', 'Opening transaction analytics... This feature is coming soon!');
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading transaction history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    backButtonText: {
      color: tenantTheme.colors.textInverse,
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    headerTitle: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitleText: {
      fontSize: 30,
      fontWeight: '700',
      color: tenantTheme.colors.textInverse,
      marginBottom: 5,
      letterSpacing: 0.3,
    },
    headerSubtitle: {
      fontSize: 16,
      fontWeight: '400',
      color: 'rgba(255, 255, 255, 0.9)',
      letterSpacing: 0.2,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 10,
    },
    headerButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: 20,
    },
    headerButtonText: {
      color: tenantTheme.colors.textInverse,
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    filtersSection: {
      backgroundColor: tenantTheme.colors.surface,
      padding: theme.spacing.lg,
      ...Platform.select({
        ios: {
          shadowColor: tenantTheme.colors.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
        android: {
          elevation: 4,
        },
        web: {
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        },
      }),
    },
    filtersHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    filtersTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: tenantTheme.colors.text,
      letterSpacing: 0.3,
    },
    clearFilters: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    filtersGrid: {
      gap: theme.spacing.md,
    },
    filterRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    filterGroup: {
      flex: 1,
    },
    filterLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: tenantTheme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
      letterSpacing: 0.2,
    },
    searchContainer: {
      position: 'relative',
    },
    searchInput: {
      borderWidth: 2,
      borderColor: tenantTheme.colors.border,
      borderRadius: 12,
      paddingLeft: 40,
      paddingRight: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      backgroundColor: tenantTheme.colors.background,
    },
    searchIcon: {
      position: 'absolute',
      left: theme.spacing.md,
      top: theme.spacing.sm + 2,
      fontSize: 16,
    },
    filterPicker: {
      borderWidth: 2,
      borderColor: tenantTheme.colors.border,
      borderRadius: 12,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      backgroundColor: tenantTheme.colors.background,
      color: tenantTheme.colors.text,
    },
    summaryGrid: {
      flexDirection: 'row',
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: tenantTheme.colors.surface,
      borderRadius: 16,
      padding: theme.spacing.md,
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: tenantTheme.colors.text,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        android: {
          elevation: 6,
        },
        web: {
          boxShadow: '0 3px 12px rgba(0, 0, 0, 0.1)',
        },
      }),
    },
    summaryIcon: {
      fontSize: 24,
      marginBottom: theme.spacing.xs,
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: '700',
      color: tenantTheme.colors.text,
      marginBottom: theme.spacing.xs,
      letterSpacing: -0.3,
    },
    summaryLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: tenantTheme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.xs,
      letterSpacing: 0.1,
    },
    summaryChange: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.1,
    },
    positiveChange: {
      color: tenantTheme.colors.success,
    },
    negativeChange: {
      color: tenantTheme.colors.danger,
    },
    transactionsSection: {
      backgroundColor: tenantTheme.colors.surface,
      marginHorizontal: theme.spacing.lg,
      borderRadius: 20,
      marginBottom: theme.spacing.lg,
      ...Platform.select({
        ios: {
          shadowColor: tenantTheme.colors.text,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 20,
        },
        android: {
          elevation: 8,
        },
        web: {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
        },
      }),
    },
    transactionsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: tenantTheme.colors.text,
      letterSpacing: 0.3,
    },
    viewOptions: {
      flexDirection: 'row',
      backgroundColor: tenantTheme.colors.background,
      borderRadius: 12,
      padding: 4,
    },
    viewToggle: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: 8,
    },
    activeViewToggle: {
      backgroundColor: tenantTheme.colors.surface,
      ...Platform.select({
        ios: {
          shadowColor: tenantTheme.colors.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
        web: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
        },
      }),
    },
    viewToggleText: {
      fontSize: 14,
      fontWeight: '500',
      color: tenantTheme.colors.textSecondary,
      letterSpacing: 0.2,
    },
    activeViewToggleText: {
      color: tenantTheme.colors.text,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    aiInsights: {
      backgroundColor: `${tenantTheme.colors.primary}10`,
      margin: theme.spacing.lg,
      marginTop: 0,
      borderRadius: 16,
      padding: theme.spacing.lg,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    aiInsightsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: theme.spacing.sm,
    },
    aiInsightsTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: tenantTheme.colors.primary,
      letterSpacing: 0.2,
    },
    aiInsightsContent: {
      fontSize: 14,
      fontWeight: '400',
      color: tenantTheme.colors.primary,
      lineHeight: 20,
      marginBottom: theme.spacing.md,
      letterSpacing: 0.1,
    },
    aiSuggestions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    aiSuggestion: {
      backgroundColor: 'rgba(30, 64, 175, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(30, 64, 175, 0.3)',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: 20,
    },
    aiSuggestionText: {
      color: tenantTheme.colors.primary,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    transactionItem: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: tenantTheme.colors.border,
    },
    transactionMain: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    transactionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    sentIcon: {
      backgroundColor: `${tenantTheme.colors.danger}15`,
    },
    receivedIcon: {
      backgroundColor: `${tenantTheme.colors.success}15`,
    },
    pendingIcon: {
      backgroundColor: `${tenantTheme.colors.warning}15`,
    },
    billsIcon: {
      backgroundColor: `${tenantTheme.colors.primary}10`,
    },
    transactionDetails: {
      flex: 1,
    },
    transactionPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    transactionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: tenantTheme.colors.text,
      flex: 1,
      letterSpacing: 0.1,
    },
    transactionStatus: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    completedStatus: {
      backgroundColor: `${tenantTheme.colors.success}15`,
      color: tenantTheme.colors.success,
    },
    pendingStatus: {
      backgroundColor: `${tenantTheme.colors.warning}15`,
      color: tenantTheme.colors.warning,
    },
    failedStatus: {
      backgroundColor: `${tenantTheme.colors.danger}15`,
      color: tenantTheme.colors.danger,
    },
    transactionSecondary: {
      fontSize: 14,
      fontWeight: '400',
      color: tenantTheme.colors.textSecondary,
      marginBottom: 6,
      letterSpacing: 0.1,
    },
    transactionMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    metaItem: {
      fontSize: 12,
      fontWeight: '400',
      color: tenantTheme.colors.textSecondary,
      letterSpacing: 0.1,
    },
    transactionAmountContainer: {
      alignItems: 'flex-end',
    },
    transactionAmount: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 2,
      letterSpacing: -0.3,
    },
    amountSent: {
      color: tenantTheme.colors.danger,
    },
    amountReceived: {
      color: tenantTheme.colors.success,
    },
    amountPending: {
      color: tenantTheme.colors.warning,
    },
    balanceText: {
      fontSize: 12,
      fontWeight: '400',
      color: tenantTheme.colors.textSecondary,
      letterSpacing: 0.1,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xl * 2,
    },
    emptyStateIcon: {
      fontSize: 48,
      marginBottom: theme.spacing.md,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: tenantTheme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
      letterSpacing: 0.2,
    },
    emptyStateText: {
      fontSize: 14,
      fontWeight: '400',
      color: tenantTheme.colors.textSecondary,
      textAlign: 'center',
      letterSpacing: 0.1,
    },
  });

  const getTransactionIconStyle = (type: string) => {
    switch (type) {
      case 'sent':
        return dynamicStyles.sentIcon;
      case 'received':
        return dynamicStyles.receivedIcon;
      case 'pending':
        return dynamicStyles.pendingIcon;
      case 'bills':
        return dynamicStyles.billsIcon;
      default:
        return dynamicStyles.sentIcon;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return dynamicStyles.completedStatus;
      case 'pending':
        return dynamicStyles.pendingStatus;
      case 'failed':
        return dynamicStyles.failedStatus;
      default:
        return dynamicStyles.completedStatus;
    }
  };

  const getAmountStyle = (type: string) => {
    switch (type) {
      case 'sent':
      case 'bills':
        return dynamicStyles.amountSent;
      case 'received':
        return dynamicStyles.amountReceived;
      case 'pending':
        return dynamicStyles.amountPending;
      default:
        return dynamicStyles.amountSent;
    }
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <View style={dynamicStyles.header}>
        <View style={dynamicStyles.headerContent}>
          <TouchableOpacity style={dynamicStyles.backButton} onPress={onBack}>
            <Text style={dynamicStyles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <View style={dynamicStyles.headerTitle}>
            <Text style={dynamicStyles.headerTitleText}>Transaction History</Text>
            <Text style={dynamicStyles.headerSubtitle}>All your financial activities</Text>
          </View>

          <View style={dynamicStyles.headerActions}>
            <TouchableOpacity style={dynamicStyles.headerButton} onPress={handleAnalytics}>
              <Text style={dynamicStyles.headerButtonText}>📊 Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dynamicStyles.headerButton} onPress={handleExport}>
              <Text style={dynamicStyles.headerButtonText}>📄 Export</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Filters Section */}
        <View style={dynamicStyles.filtersSection}>
          <View style={dynamicStyles.filtersHeader}>
            <Text style={dynamicStyles.filtersTitle}>🔍 Filters & Search</Text>
            <TouchableOpacity onPress={clearAllFilters}>
              <Text style={dynamicStyles.clearFilters}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <View style={dynamicStyles.filtersGrid}>
            {/* Search */}
            <View style={dynamicStyles.filterGroup}>
              <Text style={dynamicStyles.filterLabel}>Search</Text>
              <View style={dynamicStyles.searchContainer}>
                <Text style={dynamicStyles.searchIcon}>🔍</Text>
                <TextInput
                  style={dynamicStyles.searchInput}
                  placeholder="Transaction ID, recipient, description..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor={tenantTheme.colors.textSecondary}
                />
              </View>
            </View>

            {/* Filter Row */}
            <View style={dynamicStyles.filterRow}>
              <View style={dynamicStyles.filterGroup}>
                <Text style={dynamicStyles.filterLabel}>Status</Text>
                <TextInput
                  style={dynamicStyles.filterPicker}
                  placeholder="All Statuses"
                  value={statusFilter === 'all' ? 'All Statuses' : statusFilter}
                  editable={false}
                />
              </View>

              <View style={dynamicStyles.filterGroup}>
                <Text style={dynamicStyles.filterLabel}>Type</Text>
                <TextInput
                  style={dynamicStyles.filterPicker}
                  placeholder="All Types"
                  value={typeFilter === 'all' ? 'All Types' : typeFilter}
                  editable={false}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Summary Cards */}
        {historyData && (
          <View style={dynamicStyles.summaryGrid}>
            <View style={dynamicStyles.summaryCard}>
              <Text style={dynamicStyles.summaryIcon}>📊</Text>
              <Text style={dynamicStyles.summaryValue}>{historyData.summary.totalTransactions}</Text>
              <Text style={dynamicStyles.summaryLabel}>Total Transactions</Text>
              <Text style={[dynamicStyles.summaryChange, dynamicStyles.positiveChange]}>
                {historyData.summary.monthlyChange} vs last month
              </Text>
            </View>

            <View style={dynamicStyles.summaryCard}>
              <Text style={dynamicStyles.summaryIcon}>💰</Text>
              <Text style={dynamicStyles.summaryValue}>{historyData.summary.totalVolume}</Text>
              <Text style={dynamicStyles.summaryLabel}>Total Volume</Text>
              <Text style={[dynamicStyles.summaryChange, dynamicStyles.positiveChange]}>+23% vs last month</Text>
            </View>

            <View style={dynamicStyles.summaryCard}>
              <Text style={dynamicStyles.summaryIcon}>⚡</Text>
              <Text style={dynamicStyles.summaryValue}>{historyData.summary.avgFees}</Text>
              <Text style={dynamicStyles.summaryLabel}>Avg. Fees</Text>
              <Text style={[dynamicStyles.summaryChange, dynamicStyles.negativeChange]}>+2% vs last month</Text>
            </View>
          </View>
        )}

        {/* Transactions Section */}
        <View style={dynamicStyles.transactionsSection}>
          <View style={dynamicStyles.transactionsHeader}>
            <Text style={dynamicStyles.sectionTitle}>📝 All Transactions</Text>
            <View style={dynamicStyles.viewOptions}>
              <TouchableOpacity
                style={[dynamicStyles.viewToggle, viewMode === 'list' && dynamicStyles.activeViewToggle]}
                onPress={() => setViewMode('list')}
              >
                <Text style={[
                  dynamicStyles.viewToggleText,
                  viewMode === 'list' && dynamicStyles.activeViewToggleText
                ]}>
                  List
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.viewToggle, viewMode === 'table' && dynamicStyles.activeViewToggle]}
                onPress={() => setViewMode('table')}
              >
                <Text style={[
                  dynamicStyles.viewToggleText,
                  viewMode === 'table' && dynamicStyles.activeViewToggleText
                ]}>
                  Table
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* AI Insights */}
          {historyData && (
            <View style={dynamicStyles.aiInsights}>
              <View style={dynamicStyles.aiInsightsHeader}>
                <Text style={{ fontSize: 20 }}>🤖</Text>
                <Text style={dynamicStyles.aiInsightsTitle}>AI Insights</Text>
              </View>
              <Text style={dynamicStyles.aiInsightsContent}>
                {historyData.aiInsights.message}
              </Text>
              <View style={dynamicStyles.aiSuggestions}>
                {historyData.aiInsights.suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={dynamicStyles.aiSuggestion}
                    onPress={() => handleAISuggestion(suggestion)}
                  >
                    <Text style={dynamicStyles.aiSuggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Transactions List */}
          {filteredTransactions.length === 0 ? (
            <View style={dynamicStyles.emptyState}>
              <Text style={dynamicStyles.emptyStateIcon}>📭</Text>
              <Text style={dynamicStyles.emptyStateTitle}>No transactions found</Text>
              <Text style={dynamicStyles.emptyStateText}>
                Try adjusting your filters or search terms
              </Text>
            </View>
          ) : (
            <View testID="transaction-list">
              {filteredTransactions.map((transaction) => (
                <TouchableOpacity
                  key={transaction.id}
                  style={dynamicStyles.transactionItem}
                  onPress={() => onTransactionDetails?.(transaction.id, transaction.originalTransaction)}
                  testID="transaction-item"
                >
                <View style={dynamicStyles.transactionMain}>
                  <View style={[dynamicStyles.transactionIcon, getTransactionIconStyle(transaction.type)]}>
                    <Text style={{ fontSize: 20 }}>{transaction.icon}</Text>
                  </View>

                  <View style={dynamicStyles.transactionDetails}>
                    <View style={dynamicStyles.transactionPrimary}>
                      <Text style={dynamicStyles.transactionTitle}>{transaction.title}</Text>
                      <Text style={[dynamicStyles.transactionStatus, getStatusStyle(transaction.status)]}>
                        {transaction.status}
                      </Text>
                    </View>
                    <Text style={dynamicStyles.transactionSecondary}>{transaction.subtitle}</Text>
                    <View style={dynamicStyles.transactionMeta}>
                      <Text style={dynamicStyles.metaItem}>📅 {transaction.timestamp}</Text>
                      <Text style={dynamicStyles.metaItem}>🔍 {transaction.referenceNumber}</Text>
                      <Text style={dynamicStyles.metaItem}>
                        ⚡ {transaction.fees > 0 ? formatCurrency(transaction.fees, tenantTheme.currency) : 'No fee'}
                      </Text>
                    </View>
                  </View>

                  <View style={dynamicStyles.transactionAmountContainer}>
                    <Text style={[dynamicStyles.transactionAmount, getAmountStyle(transaction.type)]}>
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount), tenantTheme.currency)}
                    </Text>
                    <Text style={dynamicStyles.balanceText}>
                      Balance: {formatCurrency(transaction.balance, tenantTheme.currency)}
                    </Text>
                  </View>
                </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default TransactionHistoryScreen;