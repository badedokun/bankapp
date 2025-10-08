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
  const theme = useTenantTheme();
  const tenantTheme = useTenantTheme();
  const { showAlert, showConfirm } = useBankingAlert();

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
          status: propTransaction.status === 'successful' ? 'completed' : (propTransaction.status || 'pending'),
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

  const styles = StyleSheet.create({
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading transaction details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Transaction not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <View style={styles.pageHeaderContent}>
          <TouchableOpacity style={styles.backButton} onPress={propOnBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.pageHeaderTitle}>
            <Text style={styles.pageHeaderTitleText}>Transaction Details</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={[styles.amount, { color: transaction.type === 'credit' ? theme.colors.success : theme.colors.error }]}>
              {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount, tenantTheme.currency)}
            </Text>
            <Text style={styles.description}>{transaction.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction Details</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Reference</Text>
              <Text style={styles.value}>{transaction.reference}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{new Date(transaction.date).toLocaleDateString()}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Time</Text>
              <Text style={styles.value}>{new Date(transaction.date).toLocaleTimeString()}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Status</Text>
              <Text style={[styles.value, {
                color: transaction.status === 'completed' ? theme.colors.success :
                       transaction.status === 'pending' ? theme.colors.warning : theme.colors.error
              }]}>
                {transaction.status ? transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1) : 'Unknown'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Transaction Type</Text>
              <Text style={styles.value}>{transaction.type === 'credit' ? 'Money Received' : 'Money Sent'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Transaction ID</Text>
              <Text style={styles.value}>{transaction.id}</Text>
            </View>
            {transaction.fee !== undefined && transaction.fee > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Transaction Fee</Text>
                <Text style={styles.value}>{formatCurrency(transaction.fee, tenantTheme.currency)}</Text>
              </View>
            )}
          </View>

          {transaction.recipient && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recipient</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>{transaction.recipient.name}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Account</Text>
                <Text style={styles.value}>{transaction.recipient.account}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Bank</Text>
                <Text style={styles.value}>{transaction.recipient.bank}</Text>
              </View>
            </View>
          )}

          {transaction.sender && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sender</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>{transaction.sender.name}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Account</Text>
                <Text style={styles.value}>{transaction.sender.account}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Bank</Text>
                <Text style={styles.value}>{transaction.sender.bank}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleDispute}>
          <Text style={styles.actionButtonText}>Dispute</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}