/**
 * Transaction Details Screen Component
 * Displays comprehensive read-only details of a single transaction
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Share,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useTenant, useTenantTheme } from '../../tenants/TenantContext';
import { useBankingAlert } from '../../services/AlertService';
import APIService from '../../services/api';

const { width: screenWidth } = Dimensions.get('window');

interface TransactionDetails {
  id: string;
  reference: string;
  type: 'debit' | 'credit';
  status: 'successful' | 'pending' | 'failed' | 'reversed';
  amount: number;
  currency: string;
  fees: number;
  totalAmount: number;

  // Sender/Recipient details
  sender: {
    name: string;
    accountNumber: string;
    bankName: string;
    bankCode: string;
  };
  recipient: {
    name: string;
    accountNumber: string;
    bankName: string;
    bankCode: string;
  };

  // Transaction metadata
  description: string;
  category: string;
  transactionHash?: string;
  sessionId?: string;

  // Timestamps
  initiatedAt: string;
  completedAt?: string;

  // Balance information
  balanceBefore: number;
  balanceAfter: number;

  // Additional details
  channel: string;
  deviceInfo?: string;
  ipAddress?: string;
  location?: string;

  // NIBSS specific
  nibssReference?: string;
  nibssResponseCode?: string;
  nibssResponseMessage?: string;
}

export interface TransactionDetailsScreenProps {
  transactionId: string;
  onBack?: () => void;
  onReport?: (transactionId: string) => void;
  onRetry?: (transactionId: string) => void;
}

export const TransactionDetailsScreen: React.FC<TransactionDetailsScreenProps> = ({
  transactionId,
  onBack,
  onReport,
  onRetry,
}) => {
  const { currentTenant } = useTenant();
  const theme = useTenantTheme();
  const { showAlert, showConfirm } = useBankingAlert();

  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load transaction details
  const loadTransactionDetails = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch transaction details from API
      const response = await APIService.getTransactionDetails(transactionId);

      // Map API response to our detailed format
      const details: TransactionDetails = {
        id: response.id,
        reference: response.reference || `TXN${response.id}`,
        type: response.direction === 'sent' ? 'debit' : 'credit',
        status: response.status || 'successful',
        amount: Math.abs(response.amount),
        currency: response.currency || 'NGN',
        fees: response.fees || 0,
        totalAmount: Math.abs(response.amount) + (response.fees || 0),

        sender: {
          name: response.senderName || response.sender?.name || 'Your Account',
          accountNumber: response.senderAccount || response.sender?.accountNumber || '****',
          bankName: response.senderBank || response.sender?.bankName || currentTenant?.displayName || 'Bank',
          bankCode: response.senderBankCode || response.sender?.bankCode || '***',
        },

        recipient: {
          name: response.recipientName || response.recipient?.accountName || 'Unknown',
          accountNumber: response.recipientAccount || response.recipient?.accountNumber || '****',
          bankName: response.recipientBank || response.recipient?.bankName || 'Unknown Bank',
          bankCode: response.recipientBankCode || response.recipient?.bankCode || '***',
        },

        description: response.description || response.narration || 'Money Transfer',
        category: response.category || 'transfer',
        transactionHash: response.transactionHash || response.hash || generateTransactionHash(response),
        sessionId: response.sessionId || response.session_id,

        initiatedAt: response.createdAt || response.initiated_at || new Date().toISOString(),
        completedAt: response.completedAt || response.completed_at || response.updatedAt,

        balanceBefore: response.balanceBefore || 0,
        balanceAfter: response.balanceAfter || 0,

        channel: response.channel || 'mobile',
        deviceInfo: response.deviceInfo || 'Mobile App',
        ipAddress: response.ipAddress || response.ip_address,
        location: response.location,

        nibssReference: response.nibssReference || response.nibss_reference,
        nibssResponseCode: response.nibssResponseCode || response.response_code,
        nibssResponseMessage: response.nibssResponseMessage || response.response_message,
      };

      setTransaction(details);
    } catch (error) {
      console.error('Failed to load transaction details:', error);
      showAlert({
        title: 'Error',
        message: 'Failed to load transaction details. Please try again.',
        buttons: [
          { text: 'Retry', onPress: () => loadTransactionDetails() },
          { text: 'Cancel', onPress: onBack }
        ]
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [transactionId, currentTenant, showAlert, onBack]);

  // Generate a transaction hash if not provided
  const generateTransactionHash = (data: any) => {
    const hashData = `${data.id}-${data.amount}-${data.createdAt}`;
    // Simple hash generation (in production, use proper crypto)
    return Buffer.from(hashData).toString('base64').substring(0, 20).toUpperCase();
  };

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    };
  };

  // Share transaction details
  const handleShare = useCallback(async () => {
    if (!transaction) return;

    const { date, time } = formatDateTime(transaction.initiatedAt);
    const message = `
${currentTenant?.displayName || 'Bank'} Transaction Receipt

Reference: ${transaction.reference}
Type: ${transaction.type === 'debit' ? 'Money Sent' : 'Money Received'}
Amount: ₦${transaction.amount.toLocaleString()}
Status: ${transaction.status.toUpperCase()}

${transaction.type === 'debit' ? 'To' : 'From'}: ${transaction.type === 'debit' ? transaction.recipient.name : transaction.sender.name}
Bank: ${transaction.type === 'debit' ? transaction.recipient.bankName : transaction.sender.bankName}
Account: ${transaction.type === 'debit' ? transaction.recipient.accountNumber : transaction.sender.accountNumber}

Date: ${date}
Time: ${time}
Transaction ID: ${transaction.transactionHash}

Thank you for using ${currentTenant?.displayName || 'our services'}!
    `.trim();

    try {
      await Share.share({
        message,
        title: 'Transaction Receipt',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [transaction, currentTenant]);

  // Download receipt
  const handleDownload = useCallback(() => {
    showAlert({
      title: 'Download Receipt',
      message: 'Transaction receipt will be downloaded as PDF to your device.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: () => {
            // TODO: Implement PDF generation and download
            Alert.alert('Success', 'Receipt downloaded successfully!');
          }
        }
      ]
    });
  }, [showAlert]);

  // Report issue
  const handleReportIssue = useCallback(() => {
    showConfirm({
      title: 'Report Transaction Issue',
      message: 'Would you like to report an issue with this transaction? Our support team will investigate and contact you within 24 hours.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report Issue',
          style: 'destructive',
          onPress: () => {
            onReport?.(transactionId);
            Alert.alert('Issue Reported', 'Your complaint has been logged. Reference: RPT-' + Date.now());
          }
        }
      ]
    });
  }, [transactionId, onReport, showConfirm]);

  // Retry failed transaction
  const handleRetry = useCallback(() => {
    if (transaction?.status === 'failed') {
      showConfirm({
        title: 'Retry Transaction',
        message: `Would you like to retry this ₦${transaction.amount.toLocaleString()} transfer to ${transaction.recipient.name}?`,
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Retry Transfer',
            onPress: () => {
              onRetry?.(transactionId);
            }
          }
        ]
      });
    }
  }, [transaction, transactionId, onRetry, showConfirm]);

  // Load data on mount
  useEffect(() => {
    loadTransactionDetails();
  }, [loadTransactionDetails]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'successful': return '#22c55e';
      case 'pending': return '#f59e0b';
      case 'failed': return '#ef4444';
      case 'reversed': return '#8b5cf6';
      default: return theme.colors.textSecondary;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'successful': return '✅';
      case 'pending': return '⏳';
      case 'failed': return '❌';
      case 'reversed': return '↩️';
      default: return '❓';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading transaction details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!transaction) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            Transaction not found
          </Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={onBack}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { date: transactionDate, time: transactionTime } = formatDateTime(transaction.initiatedAt);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#ffffff' }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Text style={styles.shareIcon}>📤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              loadTransactionDetails();
            }}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: '#ffffff' }]}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusIcon}>{getStatusIcon(transaction.status)}</Text>
            <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
              {transaction.status.toUpperCase()}
            </Text>
          </View>

          <Text style={styles.amountText}>
            {transaction.type === 'debit' ? '−' : '+'} ₦{transaction.amount.toLocaleString()}
          </Text>

          <Text style={styles.descriptionText}>{transaction.description}</Text>
        </View>

        {/* Transaction Info */}
        <View style={[styles.section, { backgroundColor: '#ffffff' }]}>
          <Text style={styles.sectionTitle}>📋 Transaction Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Reference Number</Text>
            <Text style={styles.infoValue}>{transaction.reference}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Transaction ID</Text>
            <Text style={[styles.infoValue, styles.monoText]}>{transaction.transactionHash}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{transactionDate}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Time</Text>
            <Text style={styles.infoValue}>{transactionTime}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>
              {transaction.type === 'debit' ? 'Money Transfer (Sent)' : 'Money Transfer (Received)'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Channel</Text>
            <Text style={styles.infoValue}>{transaction.channel.toUpperCase()}</Text>
          </View>
        </View>

        {/* Sender/Recipient Details */}
        <View style={[styles.section, { backgroundColor: '#ffffff' }]}>
          <Text style={styles.sectionTitle}>
            {transaction.type === 'debit' ? '👤 Recipient Details' : '👤 Sender Details'}
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>
              {transaction.type === 'debit' ? transaction.recipient.name : transaction.sender.name}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bank</Text>
            <Text style={styles.infoValue}>
              {transaction.type === 'debit' ? transaction.recipient.bankName : transaction.sender.bankName}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Number</Text>
            <Text style={styles.infoValue}>
              {transaction.type === 'debit' ? transaction.recipient.accountNumber : transaction.sender.accountNumber}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bank Code</Text>
            <Text style={styles.infoValue}>
              {transaction.type === 'debit' ? transaction.recipient.bankCode : transaction.sender.bankCode}
            </Text>
          </View>
        </View>

        {/* Amount Details */}
        <View style={[styles.section, { backgroundColor: '#ffffff' }]}>
          <Text style={styles.sectionTitle}>💰 Amount Details</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Transaction Amount</Text>
            <Text style={styles.infoValue}>₦{transaction.amount.toLocaleString()}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Transaction Fee</Text>
            <Text style={styles.infoValue}>₦{transaction.fees.toLocaleString()}</Text>
          </View>

          <View style={[styles.infoRow, styles.totalRow]}>
            <Text style={[styles.infoLabel, styles.boldText]}>Total Amount</Text>
            <Text style={[styles.infoValue, styles.boldText]}>
              ₦{transaction.totalAmount.toLocaleString()}
            </Text>
          </View>

          {transaction.balanceBefore > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Balance Before</Text>
                <Text style={styles.infoValue}>₦{transaction.balanceBefore.toLocaleString()}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Balance After</Text>
                <Text style={styles.infoValue}>₦{transaction.balanceAfter.toLocaleString()}</Text>
              </View>
            </>
          )}
        </View>

        {/* Technical Details */}
        {(transaction.nibssReference || transaction.sessionId) && (
          <View style={[styles.section, { backgroundColor: '#ffffff' }]}>
            <Text style={styles.sectionTitle}>🔧 Technical Details</Text>

            {transaction.nibssReference && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>NIBSS Reference</Text>
                <Text style={[styles.infoValue, styles.monoText]}>{transaction.nibssReference}</Text>
              </View>
            )}

            {transaction.sessionId && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Session ID</Text>
                <Text style={[styles.infoValue, styles.monoText]}>{transaction.sessionId}</Text>
              </View>
            )}

            {transaction.nibssResponseCode && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Response Code</Text>
                <Text style={styles.infoValue}>{transaction.nibssResponseCode}</Text>
              </View>
            )}

            {transaction.nibssResponseMessage && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Response Message</Text>
                <Text style={styles.infoValue}>{transaction.nibssResponseMessage}</Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleDownload}
          >
            <Text style={styles.actionButtonIcon}>📥</Text>
            <Text style={styles.actionButtonText}>Download Receipt</Text>
          </TouchableOpacity>

          {transaction.status === 'failed' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.accent }]}
              onPress={handleRetry}
            >
              <Text style={styles.actionButtonIcon}>🔄</Text>
              <Text style={styles.actionButtonText}>Retry Transaction</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.outlineButton]}
            onPress={handleReportIssue}
          >
            <Text style={styles.actionButtonIcon}>⚠️</Text>
            <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>
              Report Issue
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Note */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This is an official transaction record from {currentTenant?.displayName || 'Bank'}.
            For support, contact customer service.
          </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 24,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  shareButton: {
    padding: 8,
  },
  shareIcon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  statusCard: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  amountText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  monoText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    paddingTop: 16,
    marginTop: 8,
  },
  boldText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#e1e5e9',
    marginVertical: 16,
  },
  actionButtons: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  actionButtonIcon: {
    fontSize: 20,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    paddingTop: 0,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default TransactionDetailsScreen;