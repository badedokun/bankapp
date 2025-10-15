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
  Modal,
} from 'react-native';
import { useTenant, useTenantTheme } from '../../tenants/TenantContext';
import { useBankingAlert } from '../../services/AlertService';
import APIService from '../../services/api';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';
import TransactionAnalyticsScreen from '../analytics/TransactionAnalyticsScreen';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  description?: string; // Transaction description
  recipient?: string; // Recipient name
  currency?: string; // Currency code (e.g., NGN, USD)
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
  const { theme: tenantTheme } = useTenantTheme() as any;
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
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

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
          totalVolume: `${formatCurrency(totalVolume / 1000000)}M`,
          avgFees: formatCurrency(avgFees),
          monthlyChange: '+0%', // Would need historical data to calculate
        },
        aiInsights: {
          message: `You have ${detailedTransactions.length} transactions with a total volume of ${formatCurrency(totalVolume)}. Your average transaction fee is ${formatCurrency(avgFees)}.`,
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

  // Export transactions to CSV
  const exportToCSV = useCallback(() => {
    try {
      // Create CSV header
      const headers = ['Date', 'Transaction ID', 'Type', 'Description', 'Recipient', 'Amount', 'Status', 'Balance'];

      // Create CSV rows
      const rows = filteredTransactions.map(transaction => [
        new Date(transaction.date).toLocaleString(),
        transaction.id,
        transaction.type,
        transaction.description,
        transaction.recipient || 'N/A',
        `${getCurrencySymbol(transaction.currency)}${formatCurrency(transaction.amount, transaction.currency)}`,
        transaction.status,
        `${getCurrencySymbol(transaction.currency)}${formatCurrency(transaction.balance, transaction.currency)}`
      ]);

      // Combine header and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // For web platform, trigger download
      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showAlert('Export Successful', `${filteredTransactions.length} transactions exported to CSV`, [{ text: 'OK' }]);
      } else {
        // For mobile, show the content (in real app, would use Share API)
        console.log('CSV Content:', csvContent);
        showAlert(
          'Export Ready',
          `${filteredTransactions.length} transactions ready for export. In a production app, this would share the CSV file.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Export error:', error);
      showAlert('Export Failed', 'There was an error exporting your transactions. Please try again.', [{ text: 'OK' }]);
    }
  }, [filteredTransactions, showAlert]);

  // Export transactions to PDF
  const exportToPDF = useCallback(() => {
    try {
      if (Platform.OS !== 'web') {
        showAlert(
          'PDF Export',
          'PDF export is currently available on web only. Please use CSV export on mobile.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Create new PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Add header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Transaction History', pageWidth / 2, 20, { align: 'center' });

      // Add generation date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.text(`Generated on: ${dateStr}`, pageWidth / 2, 28, { align: 'center' });

      // Add summary info
      doc.setFontSize(9);
      doc.text(`Total Transactions: ${filteredTransactions.length}`, 14, 38);

      // Prepare table data
      const tableData = filteredTransactions.map(transaction => {
        // Safe substring helper
        const safeTruncate = (str: string | undefined, maxLen: number): string => {
          if (!str) return 'N/A';
          return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
        };

        return [
          transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A',
          safeTruncate(transaction.id, 12),
          transaction.type || 'N/A',
          safeTruncate(transaction.description, 25),
          safeTruncate(transaction.recipient, 20),
          formatCurrency(transaction.amount || 0, transaction.currency || 'NGN'),
          transaction.status || 'N/A',
          formatCurrency(transaction.balance || 0, transaction.currency || 'NGN')
        ];
      });

      // Add table
      autoTable(doc, {
        head: [['Date', 'Transaction ID', 'Type', 'Description', 'Recipient', 'Amount', 'Status', 'Balance']],
        body: tableData,
        startY: 45,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [30, 58, 138], // FMFB primary color
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 20 },  // Date
          1: { cellWidth: 25 },  // Transaction ID
          2: { cellWidth: 15 },  // Type
          3: { cellWidth: 35 },  // Description
          4: { cellWidth: 30 },  // Recipient
          5: { cellWidth: 25 },  // Amount
          6: { cellWidth: 20 },  // Status
          7: { cellWidth: 25 },  // Balance
        },
        margin: { top: 45, left: 7, right: 7 },
      });

      // Add footer
      const pageCount = doc.internal.pages.length - 1;
      doc.setFontSize(8);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save the PDF
      doc.save(`transactions_${new Date().toISOString().split('T')[0]}.pdf`);

      showAlert(
        'Export Successful',
        `${filteredTransactions.length} transactions exported to PDF`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('PDF Export error:', error);
      showAlert(
        'Export Failed',
        'There was an error generating the PDF. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [filteredTransactions, showAlert]);

  // Export handler with format selection
  const handleExport = useCallback((format: string) => {
    setShowExportDropdown(false);

    if (format === 'csv') {
      exportToCSV();
    } else if (format === 'pdf') {
      exportToPDF();
    } else if (format === 'excel') {
      showAlert(
        'Coming Soon',
        'Excel export will be available in the next update. For now, please use CSV or PDF export.',
        [{ text: 'OK' }]
      );
    }
  }, [exportToCSV, exportToPDF, showAlert]);

  // Analytics
  const handleAnalytics = useCallback(() => {
    setShowAnalytics(true);
  }, []);

  // Show Analytics screen if requested
  if (showAnalytics) {
    return <TransactionAnalyticsScreen onBack={() => setShowAnalytics(false)} />;
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tenantTheme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: tenantTheme.colors.text }]}>Loading transaction history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tenantTheme.colors.background,
    },
    header: {
      backgroundColor: tenantTheme.colors.primary,
      marginLeft: 20,
      marginRight: 20,
      marginTop: 0,
      marginBottom: 0,
      borderRadius: 12,
      paddingTop: tenantTheme.spacing.lg,
      paddingBottom: tenantTheme.spacing.lg,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: tenantTheme.spacing.md,
      paddingVertical: tenantTheme.spacing.sm,
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
      paddingHorizontal: tenantTheme.spacing.md,
      paddingVertical: tenantTheme.spacing.sm,
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
      padding: tenantTheme.spacing.lg,
      overflow: 'visible',
      position: 'relative',
      zIndex: 100,
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
      marginBottom: tenantTheme.spacing.md,
    },
    filtersTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: tenantTheme.colors.text,
      letterSpacing: 0.3,
    },
    clearFilters: {
      color: tenantTheme.colors.primary,
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    filtersGrid: {
      gap: tenantTheme.spacing.md,
      overflow: 'visible',
    },
    filterRow: {
      flexDirection: 'row',
      gap: tenantTheme.spacing.md,
      position: 'relative',
      zIndex: 200,
    },
    filterGroup: {
      flex: 1,
      position: 'relative',
      zIndex: 300,
    },
    filterLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: tenantTheme.colors.textSecondary,
      marginBottom: tenantTheme.spacing.xs,
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
      paddingRight: tenantTheme.spacing.md,
      paddingVertical: tenantTheme.spacing.sm,
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      backgroundColor: tenantTheme.colors.background,
    },
    searchIcon: {
      position: 'absolute',
      left: tenantTheme.spacing.md,
      top: tenantTheme.spacing.sm + 2,
      fontSize: 16,
    },
    filterPicker: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 2,
      borderColor: tenantTheme.colors.border,
      borderRadius: 12,
      paddingHorizontal: tenantTheme.spacing.md,
      paddingVertical: tenantTheme.spacing.sm,
      backgroundColor: tenantTheme.colors.background,
    },
    filterPickerText: {
      flex: 1,
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      color: tenantTheme.colors.text,
    },
    filterPickerArrow: {
      fontSize: 12,
      color: tenantTheme.colors.textSecondary,
      marginLeft: 8,
    },
    dropdownMenu: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      marginTop: 8,
      backgroundColor: tenantTheme.colors.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: tenantTheme.colors.border,
      zIndex: 9999,
      ...Platform.select({
        ios: {
          shadowColor: tenantTheme.colors.text,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
        },
        android: {
          elevation: 8,
        },
        web: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
      }),
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: tenantTheme.spacing.md,
      paddingVertical: 12,
    },
    dropdownItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: tenantTheme.colors.border,
    },
    dropdownItemActive: {
      backgroundColor: `${tenantTheme.colors.primary}10`,
    },
    dropdownItemIcon: {
      fontSize: 18,
      marginRight: 12,
    },
    dropdownItemText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '400',
      color: tenantTheme.colors.text,
      letterSpacing: 0.1,
    },
    dropdownItemTextActive: {
      fontWeight: '600',
      color: tenantTheme.colors.primary,
    },
    dropdownItemCheck: {
      fontSize: 18,
      color: tenantTheme.colors.primary,
      fontWeight: '700',
    },
    summaryGrid: {
      flexDirection: 'row',
      padding: tenantTheme.spacing.lg,
      gap: tenantTheme.spacing.sm,
      position: 'relative',
      zIndex: 1,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: tenantTheme.colors.surface,
      borderRadius: 16,
      padding: tenantTheme.spacing.md,
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
      marginBottom: tenantTheme.spacing.xs,
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: '700',
      color: tenantTheme.colors.text,
      marginBottom: tenantTheme.spacing.xs,
      letterSpacing: -0.3,
    },
    summaryLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: tenantTheme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: tenantTheme.spacing.xs,
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
      marginHorizontal: tenantTheme.spacing.lg,
      borderRadius: 20,
      marginBottom: tenantTheme.spacing.lg,
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
      padding: tenantTheme.spacing.lg,
      paddingBottom: tenantTheme.spacing.md,
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
      paddingHorizontal: tenantTheme.spacing.md,
      paddingVertical: tenantTheme.spacing.xs,
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
      margin: tenantTheme.spacing.lg,
      marginTop: 0,
      borderRadius: 16,
      padding: tenantTheme.spacing.lg,
      borderLeftWidth: 4,
      borderLeftColor: tenantTheme.colors.primary,
    },
    aiInsightsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: tenantTheme.spacing.sm,
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
      marginBottom: tenantTheme.spacing.md,
      letterSpacing: 0.1,
    },
    aiSuggestions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: tenantTheme.spacing.sm,
    },
    aiSuggestion: {
      backgroundColor: 'rgba(30, 64, 175, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(30, 64, 175, 0.3)',
      paddingHorizontal: tenantTheme.spacing.md,
      paddingVertical: tenantTheme.spacing.sm,
      borderRadius: 20,
    },
    aiSuggestionText: {
      color: tenantTheme.colors.primary,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    transactionItem: {
      paddingHorizontal: tenantTheme.spacing.lg,
      paddingVertical: tenantTheme.spacing.md,
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
      marginRight: tenantTheme.spacing.md,
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
      paddingVertical: tenantTheme.spacing.xl * 2,
    },
    emptyStateIcon: {
      fontSize: 48,
      marginBottom: tenantTheme.spacing.md,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: tenantTheme.colors.textSecondary,
      marginBottom: tenantTheme.spacing.sm,
      letterSpacing: 0.2,
    },
    emptyStateText: {
      fontSize: 14,
      fontWeight: '400',
      color: tenantTheme.colors.textSecondary,
      textAlign: 'center',
      letterSpacing: 0.1,
    },
    // Export Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    exportModal: {
      backgroundColor: tenantTheme.colors.surface,
      borderRadius: 20,
      padding: 24,
      width: Platform.OS === 'web' ? 480 : screenWidth - 40,
      maxWidth: 480,
      ...Platform.select({
        ios: {
          shadowColor: tenantTheme.colors.text,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 24,
        },
        android: {
          elevation: 16,
        },
        web: {
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        },
      }),
    },
    exportModalTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: tenantTheme.colors.text,
      marginBottom: 8,
      letterSpacing: 0.3,
      textAlign: 'center',
    },
    exportModalSubtitle: {
      fontSize: 15,
      fontWeight: '400',
      color: tenantTheme.colors.textSecondary,
      marginBottom: 24,
      letterSpacing: 0.1,
      textAlign: 'center',
      lineHeight: 22,
    },
    exportOptions: {
      gap: 12,
      marginBottom: 20,
    },
    exportOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tenantTheme.colors.background,
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: tenantTheme.colors.border,
      ...Platform.select({
        ios: {
          shadowColor: tenantTheme.colors.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        android: {
          elevation: 3,
        },
        web: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
      }),
    },
    exportOptionIcon: {
      fontSize: 32,
      marginRight: 16,
    },
    exportOptionContent: {
      flex: 1,
    },
    exportOptionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: tenantTheme.colors.text,
      marginBottom: 4,
      letterSpacing: 0.2,
    },
    exportOptionDescription: {
      fontSize: 13,
      fontWeight: '400',
      color: tenantTheme.colors.textSecondary,
      lineHeight: 18,
      letterSpacing: 0.1,
    },
    exportOptionArrow: {
      fontSize: 20,
      color: tenantTheme.colors.primary,
      fontWeight: '700',
    },
    exportModalCancel: {
      backgroundColor: tenantTheme.colors.background,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: tenantTheme.colors.border,
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: tenantTheme.colors.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
        web: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      }),
    },
    exportModalCancelText: {
      fontSize: 16,
      fontWeight: '600',
      color: tenantTheme.colors.text,
      letterSpacing: 0.2,
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
      <StatusBar barStyle="light-content" backgroundColor={tenantTheme.colors.primary} />
      
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
            <TouchableOpacity style={dynamicStyles.headerButton} onPress={() => setShowExportDropdown(!showExportDropdown)}>
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
            colors={[tenantTheme.colors.primary]}
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
                <View>
                  <TouchableOpacity
                    style={dynamicStyles.filterPicker}
                    onPress={() => {
                      setShowStatusDropdown(!showStatusDropdown);
                      setShowTypeDropdown(false);
                    }}
                  >
                    <Text style={dynamicStyles.filterPickerText}>
                      {statusFilter === 'all' ? 'All Statuses' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                    </Text>
                    <Text style={dynamicStyles.filterPickerArrow}>▼</Text>
                  </TouchableOpacity>
                  {showStatusDropdown && (
                    <View style={dynamicStyles.dropdownMenu}>
                      {[
                        { value: 'all', label: 'All Statuses', icon: '📋' },
                        { value: 'successful', label: 'Successful', icon: '✅' },
                        { value: 'pending', label: 'Pending', icon: '⏳' },
                        { value: 'failed', label: 'Failed', icon: '❌' },
                      ].map((option, index, array) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            dynamicStyles.dropdownItem,
                            index < array.length - 1 && dynamicStyles.dropdownItemBorder,
                            statusFilter === option.value && dynamicStyles.dropdownItemActive
                          ]}
                          onPress={() => {
                            setStatusFilter(option.value);
                            setShowStatusDropdown(false);
                          }}
                        >
                          <Text style={dynamicStyles.dropdownItemIcon}>{option.icon}</Text>
                          <Text style={[
                            dynamicStyles.dropdownItemText,
                            statusFilter === option.value && dynamicStyles.dropdownItemTextActive
                          ]}>
                            {option.label}
                          </Text>
                          {statusFilter === option.value && (
                            <Text style={dynamicStyles.dropdownItemCheck}>✓</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              <View style={dynamicStyles.filterGroup}>
                <Text style={dynamicStyles.filterLabel}>Type</Text>
                <View>
                  <TouchableOpacity
                    style={dynamicStyles.filterPicker}
                    onPress={() => {
                      setShowTypeDropdown(!showTypeDropdown);
                      setShowStatusDropdown(false);
                    }}
                  >
                    <Text style={dynamicStyles.filterPickerText}>
                      {typeFilter === 'all' ? 'All Types' : typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}
                    </Text>
                    <Text style={dynamicStyles.filterPickerArrow}>▼</Text>
                  </TouchableOpacity>
                  {showTypeDropdown && (
                    <View style={dynamicStyles.dropdownMenu}>
                      {[
                        { value: 'all', label: 'All Types', icon: '📋' },
                        { value: 'sent', label: 'Sent', icon: '📤' },
                        { value: 'received', label: 'Received', icon: '📥' },
                        { value: 'bills', label: 'Bills', icon: '💡' },
                      ].map((option, index, array) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            dynamicStyles.dropdownItem,
                            index < array.length - 1 && dynamicStyles.dropdownItemBorder,
                            typeFilter === option.value && dynamicStyles.dropdownItemActive
                          ]}
                          onPress={() => {
                            setTypeFilter(option.value);
                            setShowTypeDropdown(false);
                          }}
                        >
                          <Text style={dynamicStyles.dropdownItemIcon}>{option.icon}</Text>
                          <Text style={[
                            dynamicStyles.dropdownItemText,
                            typeFilter === option.value && dynamicStyles.dropdownItemTextActive
                          ]}>
                            {option.label}
                          </Text>
                          {typeFilter === option.value && (
                            <Text style={dynamicStyles.dropdownItemCheck}>✓</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
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
                        ⚡ {transaction.fees > 0 ? formatCurrency(transaction.fees) : 'No fee'}
                      </Text>
                    </View>
                  </View>

                  <View style={dynamicStyles.transactionAmountContainer}>
                    <Text style={[dynamicStyles.transactionAmount, getAmountStyle(transaction.type)]}>
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                    </Text>
                    <Text style={dynamicStyles.balanceText}>
                      Balance: {formatCurrency(transaction.balance)}
                    </Text>
                  </View>
                </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Export Format Selection Modal */}
      <Modal
        visible={showExportDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExportDropdown(false)}
      >
        <TouchableOpacity
          style={dynamicStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowExportDropdown(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={dynamicStyles.exportModal}>
              <Text style={dynamicStyles.exportModalTitle}>Export Transactions</Text>
              <Text style={dynamicStyles.exportModalSubtitle}>
                Choose your preferred export format
              </Text>

              <View style={dynamicStyles.exportOptions}>
                <TouchableOpacity
                  style={dynamicStyles.exportOption}
                  onPress={() => handleExport('csv')}
                >
                  <Text style={dynamicStyles.exportOptionIcon}>📄</Text>
                  <View style={dynamicStyles.exportOptionContent}>
                    <Text style={dynamicStyles.exportOptionTitle}>CSV Format</Text>
                    <Text style={dynamicStyles.exportOptionDescription}>
                      Comma-separated values, works with Excel & Google Sheets
                    </Text>
                  </View>
                  <Text style={dynamicStyles.exportOptionArrow}>→</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={dynamicStyles.exportOption}
                  onPress={() => handleExport('pdf')}
                >
                  <Text style={dynamicStyles.exportOptionIcon}>📑</Text>
                  <View style={dynamicStyles.exportOptionContent}>
                    <Text style={dynamicStyles.exportOptionTitle}>PDF Document</Text>
                    <Text style={dynamicStyles.exportOptionDescription}>
                      Professional format for printing and sharing
                    </Text>
                  </View>
                  <Text style={dynamicStyles.exportOptionArrow}>→</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={dynamicStyles.exportOption}
                  onPress={() => handleExport('excel')}
                >
                  <Text style={dynamicStyles.exportOptionIcon}>📊</Text>
                  <View style={dynamicStyles.exportOptionContent}>
                    <Text style={dynamicStyles.exportOptionTitle}>Excel Spreadsheet</Text>
                    <Text style={dynamicStyles.exportOptionDescription}>
                      Native Excel format with formulas and formatting
                    </Text>
                  </View>
                  <Text style={dynamicStyles.exportOptionArrow}>→</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={dynamicStyles.exportModalCancel}
                onPress={() => setShowExportDropdown(false)}
              >
                <Text style={dynamicStyles.exportModalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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