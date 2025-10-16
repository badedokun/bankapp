/**
 * Transaction Details Screen Component
 * Shows detailed information about a specific transaction
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useTenant, useTenantTheme } from '../../tenants/TenantContext';
import { useBankingAlert } from '../../services/AlertService';
import APIService from '../../services/api';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';
import { defaultThemes, themeToReactNativeStyles } from '../../design-system/theme';

export interface TransactionDetailsScreenProps {
  route?: {
    params?: {
      transactionId?: string;
      transaction?: any;
    };
  };
  navigation?: any;
  // Direct props for web navigation
  transactionId?: string;
  transaction?: any;
  onBack?: () => void;
  onReport?: (transactionId: string) => void;
  onRetry?: (transactionId: string) => void;
}

interface TransactionDetails {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
  fee?: number;
  recipient?: {
    name: string;
    account: string;
    bank: string;
  };
  sender?: {
    name: string;
    account: string;
    bank: string;
  };
}

export default function TransactionDetailsScreen({
  route,
  navigation,
  transactionId: propTransactionId,
  transaction: propTransaction,
  onBack: propOnBack,
  onReport,
  onRetry
}: TransactionDetailsScreenProps) {
  const tenant = useTenant();
  const tenantTheme = useTenantTheme();
  const { showAlert, showConfirm } = useBankingAlert();

  // Use tenant theme or fallback to default FMFB theme
  const fallbackTheme = themeToReactNativeStyles(defaultThemes.fmfb);
  const theme = (tenantTheme as any)?.theme || fallbackTheme;

  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const transactionId = propTransactionId || route?.params?.transactionId;
  const initialTransaction = propTransaction || route?.params?.transaction;

  useEffect(() => {
    // Use propTransaction directly if provided (highest priority)
    if (propTransaction) {
      try {
        // Convert transaction history format to details format

        const convertedTransaction: TransactionDetails = {
          id: propTransaction.id || 'unknown',
          type: propTransaction.direction === 'sent' ? 'debit' : 'credit',
          amount: Math.abs(propTransaction.amount || 0),
          currency: 'NGN',
          description: propTransaction.description || 'Transaction',
          date: propTransaction.createdAt || new Date().toISOString(),
          status: propTransaction.status === 'successful' ? 'completed' : propTransaction.status,
          reference: propTransaction.reference || propTransaction.id || 'N/A',
          fee: propTransaction.fee || 0,
          recipient: propTransaction.direction === 'sent' && propTransaction.recipient ? {
            name: propTransaction.recipient.accountName || 'Unknown',
            account: propTransaction.recipient.accountNumber || '****' + (propTransaction.id || '0000').slice(-4),
            bank: 'First Midas Microfinance Bank'
          } : undefined,
          sender: propTransaction.direction === 'received' ? {
            name: propTransaction.senderName || 'Sender',
            account: '****' + (propTransaction.id || '0000').slice(-4),
            bank: 'First Midas Microfinance Bank'
          } : undefined,
        };

        setTransaction(convertedTransaction);
        setLoading(false);
      } catch (error) {
        console.error('Error converting transaction data:', error);
        showAlert('Error', 'Failed to process transaction data');
        if (propOnBack) {
          propOnBack();
        } else {
          navigation?.goBack();
        }
      }
    } else if (transactionId) {
      fetchTransactionDetails();
    } else {
      showAlert('Error', 'No transaction information provided');
      if (propOnBack) {
        propOnBack();
      } else {
        navigation?.goBack();
      }
    }
  }, [transactionId, initialTransaction, propTransaction, propOnBack, navigation, showAlert]);

  const fetchTransactionDetails = async () => {
    try {
      setLoading(true);
      const response = await APIService.getTransactionDetails(transactionId!);
      setTransaction(response);
    } catch (error) {
      console.error('Error fetching transaction details via API:', error);
      showAlert('Error', 'Failed to load transaction details');
      if (propOnBack) {
        propOnBack();
      } else {
        navigation?.goBack();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (!transaction) return;

    showAlert('Share', 'Transaction details will be shared securely');
  };

  const handleDispute = () => {
    if (!transaction) return;

    showConfirm(
      'Dispute Transaction',
      'Are you sure you want to dispute this transaction?',
      () => {
        showAlert('Dispute Submitted', 'Your dispute has been submitted for review');
      }
    );
  };

  // Create dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    pageHeader: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
    },
    pageHeaderContent: {
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
      color: theme.colors.textInverse,
      fontSize: 16,
      fontWeight: '500',
    },
    pageHeaderTitle: {
      flex: 1,
      alignItems: 'center',
      marginLeft: theme.spacing.md,
    },
    pageHeaderTitleText: {
      color: theme.colors.textInverse,
      fontSize: 18,
      fontWeight: '600',
    },
    content: {
      flex: 1,
      padding: theme.spacing.md,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    header: {
      marginLeft: 20,
      marginRight: 20,
      marginTop: 0,
      marginBottom: theme.spacing.lg,
      borderRadius: 12,
      alignItems: 'center',
    },
    amount: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    description: {
      fontSize: theme.typography.sizes.lg,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: theme.typography.sizes.md,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.xs,
    },
    label: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
    },
    value: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text,
      fontWeight: '500',
    },
    actionButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      marginHorizontal: theme.spacing.xs,
      flex: 1,
    },
    actionButtonText: {
      color: 'white',
      fontSize: theme.typography.sizes.md,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    actions: {
      flexDirection: 'row',
      padding: theme.spacing.md,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.textSecondary,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.loadingContainer}>
          <Text style={dynamicStyles.loadingText}>Loading transaction details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!transaction) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.loadingContainer}>
          <Text style={dynamicStyles.loadingText}>Transaction not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.pageHeader}>
        <View style={dynamicStyles.pageHeaderContent}>
          <TouchableOpacity style={dynamicStyles.backButton} onPress={propOnBack}>
            <Text style={dynamicStyles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <View style={dynamicStyles.pageHeaderTitle}>
            <Text style={dynamicStyles.pageHeaderTitleText}>Transaction Details</Text>
          </View>
        </View>
      </View>

      <ScrollView style={dynamicStyles.content}>
        <View style={dynamicStyles.card}>
          <View style={dynamicStyles.header}>
            <Text style={[dynamicStyles.amount, { color: transaction.type === 'credit' ? theme.colors.success : theme.colors.error }]}>
              {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
            </Text>
            <Text style={dynamicStyles.description}>{transaction.description}</Text>
          </View>

          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Transaction Details</Text>
            <View style={dynamicStyles.row}>
              <Text style={dynamicStyles.label}>Reference</Text>
              <Text style={dynamicStyles.value}>{transaction.reference}</Text>
            </View>
            <View style={dynamicStyles.row}>
              <Text style={dynamicStyles.label}>Date</Text>
              <Text style={dynamicStyles.value}>{new Date(transaction.date).toLocaleDateString()}</Text>
            </View>
            <View style={dynamicStyles.row}>
              <Text style={dynamicStyles.label}>Time</Text>
              <Text style={dynamicStyles.value}>{new Date(transaction.date).toLocaleTimeString()}</Text>
            </View>
            <View style={dynamicStyles.row}>
              <Text style={dynamicStyles.label}>Status</Text>
              <Text style={[dynamicStyles.value, {
                color: transaction.status === 'completed' ? theme.colors.success :
                       transaction.status === 'pending' ? theme.colors.warning : theme.colors.error
              }]}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </Text>
            </View>
            <View style={dynamicStyles.row}>
              <Text style={dynamicStyles.label}>Transaction Type</Text>
              <Text style={dynamicStyles.value}>{transaction.type === 'credit' ? 'Money Received' : 'Money Sent'}</Text>
            </View>
            <View style={dynamicStyles.row}>
              <Text style={dynamicStyles.label}>Transaction ID</Text>
              <Text style={dynamicStyles.value}>{transaction.id}</Text>
            </View>
            {transaction.fee !== undefined && transaction.fee > 0 && (
              <View style={dynamicStyles.row}>
                <Text style={dynamicStyles.label}>Transaction Fee</Text>
                <Text style={dynamicStyles.value}>{formatCurrency(transaction.fee)}</Text>
              </View>
            )}
          </View>

          {transaction.recipient && (
            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Recipient</Text>
              <View style={dynamicStyles.row}>
                <Text style={dynamicStyles.label}>Name</Text>
                <Text style={dynamicStyles.value}>{transaction.recipient.name}</Text>
              </View>
              <View style={dynamicStyles.row}>
                <Text style={dynamicStyles.label}>Account</Text>
                <Text style={dynamicStyles.value}>{transaction.recipient.account}</Text>
              </View>
              <View style={dynamicStyles.row}>
                <Text style={dynamicStyles.label}>Bank</Text>
                <Text style={dynamicStyles.value}>{transaction.recipient.bank}</Text>
              </View>
            </View>
          )}

          {transaction.sender && (
            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Sender</Text>
              <View style={dynamicStyles.row}>
                <Text style={dynamicStyles.label}>Name</Text>
                <Text style={dynamicStyles.value}>{transaction.sender.name}</Text>
              </View>
              <View style={dynamicStyles.row}>
                <Text style={dynamicStyles.label}>Account</Text>
                <Text style={dynamicStyles.value}>{transaction.sender.account}</Text>
              </View>
              <View style={dynamicStyles.row}>
                <Text style={dynamicStyles.label}>Bank</Text>
                <Text style={dynamicStyles.value}>{transaction.sender.bank}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={dynamicStyles.actions}>
        <TouchableOpacity style={dynamicStyles.actionButton} onPress={handleShare}>
          <Text style={dynamicStyles.actionButtonText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={dynamicStyles.actionButton} onPress={handleDispute}>
          <Text style={dynamicStyles.actionButtonText}>Dispute</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}