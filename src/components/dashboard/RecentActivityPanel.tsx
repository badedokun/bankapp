/**
 * Recent Activity Panel Component
 * Enhanced recent activity with role-based filtering and Nigerian banking context
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface Transaction {
  id: string;
  type: 'sent' | 'received' | 'pending';
  title: string;
  subtitle: string;
  amount: number;
  time: string;
  icon: string;
  originalTransaction?: any;
  requiresApproval?: boolean;
  approvedBy?: string;
}

interface RecentActivityPanelProps {
  recentTransactions: Transaction[];
  userRole: string;
  userPermissions: Record<string, string>;
  onTransactionPress: (transactionId: string, transaction?: any) => void;
  onViewAllPress: () => void;
  theme: any;
}

export const RecentActivityPanel: React.FC<RecentActivityPanelProps> = ({
  recentTransactions,
  userRole,
  userPermissions,
  onTransactionPress,
  onViewAllPress,
  theme
}) => {
  // Filter transactions based on user role and permissions
  const getFilteredTransactions = () => {
    // Admin roles see all transactions
    const adminRoles = ['platform_admin', 'ceo', 'deputy_md', 'branch_manager', 'operations_manager'];
    if (adminRoles.includes(userRole)) {
      return recentTransactions;
    }

    // Compliance and audit see all for monitoring
    if (userRole === 'compliance_officer' || userRole === 'audit_officer') {
      return recentTransactions;
    }

    // Other roles see limited view based on permissions
    return recentTransactions.filter(transaction => {
      // Check if user has permission to view transactions
      const hasViewPermission = userPermissions['view_customer_accounts'] ||
                               userPermissions['internal_transfers'] ||
                               userPermissions['external_transfers'];

      return hasViewPermission !== 'none';
    });
  };

  const getTransactionIcon = (transaction: Transaction) => {
    const iconMap = {
      sent: '↗️',
      received: '↙️',
      pending: '⏳'
    };

    // Add approval status indicator
    if (transaction.requiresApproval) {
      return '⏳'; // Pending approval
    }

    if (transaction.approvedBy) {
      return '✅'; // Approved
    }

    return iconMap[transaction.type] || '💳';
  };

  const getTransactionColor = (transaction: Transaction) => {
    if (transaction.requiresApproval) {
      return '#f59e0b'; // Orange for pending approval
    }

    const colorMap = {
      sent: '#ef4444',     // Red for outgoing
      received: '#22c55e', // Green for incoming
      pending: '#f59e0b'   // Orange for pending
    };

    return colorMap[transaction.type] || '#6b7280';
  };

  const getAmountDisplay = (transaction: Transaction) => {
    const amount = Math.abs(transaction.amount || 0);
    const sign = transaction.type === 'received' ? '+' : transaction.type === 'sent' ? '-' : '';

    return `${sign}₦${amount.toLocaleString()}`;
  };

  const getRoleSpecificLabel = (transaction: Transaction) => {
    // Add role-specific context to transaction display
    if (userRole === 'compliance_officer' && transaction.amount > 1000000) {
      return '🔍 High-value transaction';
    }

    if (userRole === 'credit_manager' && transaction.subtitle.includes('Loan')) {
      return '💳 Credit operation';
    }

    if (userRole === 'head_teller' || userRole === 'bank_teller') {
      return '💰 Teller transaction';
    }

    return transaction.subtitle;
  };

  const filteredTransactions = getFilteredTransactions();

  if (filteredTransactions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            📝 Recent Activity
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No recent activity to display
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          📝 Recent Banking Activity
        </Text>
        <TouchableOpacity onPress={onViewAllPress}>
          <Text style={[styles.viewAllButton, { color: theme.colors.primary }]}>
            View All
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.transactionsList}>
        {filteredTransactions.map((transaction) => (
          <TouchableOpacity
            key={transaction.id}
            style={[
              styles.transactionItem,
              {
                borderBottomColor: theme.colors.border || '#f1f5f9'
              }
            ]}
            onPress={() => onTransactionPress(transaction.id, transaction.originalTransaction)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.transactionIcon,
              {
                backgroundColor: `${getTransactionColor(transaction)}20` // 20% opacity
              }
            ]}>
              <Text style={styles.transactionIconText}>
                {getTransactionIcon(transaction)}
              </Text>
            </View>

            <View style={styles.transactionDetails}>
              <Text style={[styles.transactionTitle, { color: theme.colors.text }]}>
                {transaction.title}
              </Text>
              <Text style={[styles.transactionSubtitle, { color: theme.colors.textSecondary }]}>
                {getRoleSpecificLabel(transaction)}
              </Text>
              <Text style={[styles.transactionTime, { color: theme.colors.textSecondary }]}>
                {transaction.time}
              </Text>

              {/* Role-specific additional info */}
              {(userRole === 'compliance_officer' || userRole === 'audit_officer') && (
                <View style={styles.complianceInfo}>
                  {transaction.requiresApproval && (
                    <Text style={[styles.statusText, { color: '#f59e0b' }]}>
                      ⏳ Pending Approval
                    </Text>
                  )}
                  {transaction.approvedBy && (
                    <Text style={[styles.statusText, { color: '#22c55e' }]}>
                      ✅ Approved by {transaction.approvedBy}
                    </Text>
                  )}
                </View>
              )}
            </View>

            <View style={styles.transactionAmount}>
              <Text style={[
                styles.amountText,
                { color: getTransactionColor(transaction) }
              ]}>
                {getAmountDisplay(transaction)}
              </Text>

              {/* High-value indicator for certain roles */}
              {(userRole === 'ceo' || userRole === 'compliance_officer') &&
               Math.abs(transaction.amount) > 1000000 && (
                <Text style={[styles.highValueIndicator, { color: '#f59e0b' }]}>
                  🔥 High Value
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Role-specific activity summary */}
      <View style={[styles.summaryContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>
          📊 Activity Summary
        </Text>
        <Text style={[styles.summaryText, { color: theme.colors.textSecondary }]}>
          {getRoleSpecificSummary(userRole, filteredTransactions)}
        </Text>
      </View>
    </View>
  );
};

// Generate role-specific activity summary
const getRoleSpecificSummary = (role: string, transactions: Transaction[]): string => {
  const totalAmount = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
  const pendingApprovals = transactions.filter(tx => tx.requiresApproval).length;
  const highValueCount = transactions.filter(tx => Math.abs(tx.amount) > 1000000).length;

  const summaries = {
    platform_admin: `Platform activity: ₦${(totalAmount / 1000000).toFixed(1)}M total volume across tenant banks.`,
    ceo: `Bank oversight: ${transactions.length} transactions, ${highValueCount} high-value items, ₦${(totalAmount / 1000000).toFixed(1)}M total.`,
    deputy_md: `Operations review: ${pendingApprovals} items need approval, ${transactions.length} recent activities.`,
    branch_manager: `Branch activity: ${transactions.length} transactions processed, performance tracking active.`,
    operations_manager: `Operations: ${transactions.length} transactions monitored, ${pendingApprovals} pending approvals.`,
    credit_manager: `Credit operations: Monitoring loan-related transactions and high-value transfers.`,
    compliance_officer: `Compliance monitoring: ${highValueCount} high-value transactions reviewed for AML compliance.`,
    audit_officer: `Audit trail: ${transactions.length} transactions logged with complete audit information.`,
    relationship_manager: `Customer activity: Recent transactions from your customer portfolio.`,
    loan_officer: `Loan processing: Transaction history related to loan disbursements and payments.`,
    customer_service: `Customer support: Recent customer transaction activities for support reference.`,
    head_teller: `Teller oversight: ${transactions.length} transactions processed through teller operations.`,
    bank_teller: `Teller activity: Your processed transactions and customer service interactions.`,
    credit_analyst: `Credit analysis: Transaction patterns relevant to credit risk assessment.`
  };

  return summaries[role] || `Recent banking activity: ${transactions.length} transactions totaling ₦${(totalAmount / 1000000).toFixed(1)}M.`;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  viewAllButton: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionsList: {
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  transactionIconText: {
    fontSize: 16,
  },
  transactionDetails: {
    flex: 1,
    minWidth: 0,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionSubtitle: {
    fontSize: 12,
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: 11,
    marginBottom: 4,
  },
  complianceInfo: {
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  transactionAmount: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  highValueIndicator: {
    fontSize: 9,
    fontWeight: '600',
  },
  summaryContainer: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 11,
    lineHeight: 15,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default RecentActivityPanel;