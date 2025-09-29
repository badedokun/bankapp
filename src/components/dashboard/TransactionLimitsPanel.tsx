/**
 * Transaction Limits Panel Component
 * Displays role-based transaction limits for Nigerian banking compliance
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTenantTheme } from '../../context/TenantThemeContext';

interface TransactionLimit {
  type: string;
  dailyLimit: number;
  weeklyLimit: number;
  monthlyLimit: number;
  singleTransactionLimit: number;
  requiresApproval: number;
  currency: string;
  icon: string;
}

interface TransactionLimitsPanelProps {
  userRole: string;
  userPermissions: Record<string, string>;
  onLimitPress: (limitType: string) => void;
  onRequestIncrease: (limitType: string) => void;
}

export const TransactionLimitsPanel: React.FC<TransactionLimitsPanelProps> = ({
  userRole,
  userPermissions,
  onLimitPress,
  onRequestIncrease,
}) => {
  const { theme } = useTenantTheme();
  // CBN-compliant transaction limits based on role
  const getRoleLimits = (): TransactionLimit[] => {
    const baseLimits: Record<string, TransactionLimit[]> = {
      // Platform admin - full access, highest limits
      platform_admin: [
        {
          type: 'Platform Transfers',
          dailyLimit: 100000000, // ₦100M
          weeklyLimit: 500000000, // ₦500M
          monthlyLimit: 2000000000, // ₦2B
          singleTransactionLimit: 50000000, // ₦50M
          requiresApproval: 10000000, // ₦10M
          currency: 'NGN',
          icon: '🏦'
        }
      ],

      // CEO - highest banking limits
      ceo: [
        {
          type: 'High-Value Transfers',
          dailyLimit: 50000000, // ₦50M
          weeklyLimit: 200000000, // ₦200M
          monthlyLimit: 800000000, // ₦800M
          singleTransactionLimit: 25000000, // ₦25M
          requiresApproval: 5000000, // ₦5M
          currency: 'NGN',
          icon: '👑'
        },
        {
          type: 'Internal Operations',
          dailyLimit: 10000000, // ₦10M
          weeklyLimit: 50000000, // ₦50M
          monthlyLimit: 200000000, // ₦200M
          singleTransactionLimit: 5000000, // ₦5M
          requiresApproval: 1000000, // ₦1M
          currency: 'NGN',
          icon: '🏢'
        }
      ],

      // Deputy MD - senior management limits
      deputy_md: [
        {
          type: 'Management Transfers',
          dailyLimit: 25000000, // ₦25M
          weeklyLimit: 100000000, // ₦100M
          monthlyLimit: 400000000, // ₦400M
          singleTransactionLimit: 10000000, // ₦10M
          requiresApproval: 2000000, // ₦2M
          currency: 'NGN',
          icon: '🎯'
        }
      ],

      // Branch Manager - branch operation limits
      branch_manager: [
        {
          type: 'Branch Transfers',
          dailyLimit: 10000000, // ₦10M
          weeklyLimit: 50000000, // ₦50M
          monthlyLimit: 200000000, // ₦200M
          singleTransactionLimit: 5000000, // ₦5M
          requiresApproval: 1000000, // ₦1M
          currency: 'NGN',
          icon: '🏪'
        },
        {
          type: 'Customer Transactions',
          dailyLimit: 2000000, // ₦2M
          weeklyLimit: 10000000, // ₦10M
          monthlyLimit: 40000000, // ₦40M
          singleTransactionLimit: 1000000, // ₦1M
          requiresApproval: 500000, // ₦500K
          currency: 'NGN',
          icon: '👥'
        }
      ],

      // Operations Manager - operational limits
      operations_manager: [
        {
          type: 'Operations Transfers',
          dailyLimit: 5000000, // ₦5M
          weeklyLimit: 25000000, // ₦25M
          monthlyLimit: 100000000, // ₦100M
          singleTransactionLimit: 2000000, // ₦2M
          requiresApproval: 500000, // ₦500K
          currency: 'NGN',
          icon: '⚙️'
        }
      ],

      // Head Teller - teller supervision limits
      head_teller: [
        {
          type: 'Teller Operations',
          dailyLimit: 2000000, // ₦2M
          weeklyLimit: 10000000, // ₦10M
          monthlyLimit: 40000000, // ₦40M
          singleTransactionLimit: 500000, // ₦500K
          requiresApproval: 200000, // ₦200K
          currency: 'NGN',
          icon: '💰'
        }
      ],

      // Bank Teller - basic teller limits
      bank_teller: [
        {
          type: 'Customer Transactions',
          dailyLimit: 1000000, // ₦1M
          weeklyLimit: 5000000, // ₦5M
          monthlyLimit: 20000000, // ₦20M
          singleTransactionLimit: 200000, // ₦200K
          requiresApproval: 100000, // ₦100K
          currency: 'NGN',
          icon: '💳'
        }
      ],

      // Default for other roles
      default: [
        {
          type: 'Standard Transactions',
          dailyLimit: 500000, // ₦500K
          weeklyLimit: 2500000, // ₦2.5M
          monthlyLimit: 10000000, // ₦10M
          singleTransactionLimit: 100000, // ₦100K
          requiresApproval: 50000, // ₦50K
          currency: 'NGN',
          icon: '📱'
        }
      ]
    };

    return baseLimits[userRole] || baseLimits.default;
  };

  const formatAmount = (amount: number): string => {
    if (amount >= 1000000000) {
      return `₦${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
      return `₦${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `₦${(amount / 1000).toFixed(0)}K`;
    } else {
      return `₦${amount.toLocaleString()}`;
    }
  };

  const getLimitStatus = (limit: TransactionLimit) => {
    // In a real implementation, this would check actual usage
    const mockUsagePercentage = Math.floor(Math.random() * 80) + 10; // 10-90%

    if (mockUsagePercentage > 80) {
      return { color: '#ef4444', status: 'High Usage', percentage: mockUsagePercentage };
    } else if (mockUsagePercentage > 60) {
      return { color: '#f59e0b', status: 'Moderate', percentage: mockUsagePercentage };
    } else {
      return { color: '#22c55e', status: 'Available', percentage: mockUsagePercentage };
    }
  };

  const canRequestIncrease = (): boolean => {
    // Senior roles can request increases
    const eligibleRoles = [
      'ceo', 'deputy_md', 'branch_manager', 'operations_manager',
      'compliance_officer', 'head_teller'
    ];
    return eligibleRoles.includes(userRole);
  };

  const getRoleSpecificTitle = (): string => {
    const titles = {
      platform_admin: '🏦 Platform Transaction Limits',
      ceo: '👑 Executive Transaction Limits',
      deputy_md: '🎯 Senior Management Limits',
      branch_manager: '🏪 Branch Operation Limits',
      operations_manager: '⚙️ Operations Limits',
      compliance_officer: '📋 Compliance Monitoring Limits',
      audit_officer: '🔍 Audit Access Limits',
      credit_manager: '💳 Credit Operation Limits',
      relationship_manager: '🤝 Customer Relationship Limits',
      loan_officer: '📊 Loan Processing Limits',
      customer_service: '📞 Customer Service Limits',
      head_teller: '💰 Teller Supervision Limits',
      bank_teller: '💳 Teller Transaction Limits',
      credit_analyst: '📈 Analysis Operation Limits'
    };

    return titles[userRole] || '📱 Transaction Limits';
  };

  const limits = getRoleLimits();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {getRoleSpecificTitle()}
        </Text>
        {canRequestIncrease() && (
          <TouchableOpacity
            style={[styles.requestButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => onRequestIncrease('general')}
          >
            <Text style={styles.requestButtonText}>Request Increase</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.limitsGrid}>
        {limits.map((limit, index) => {
          const status = getLimitStatus(limit);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.limitCard,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: status.color + '20'
                }
              ]}
              onPress={() => onLimitPress(limit.type)}
              activeOpacity={0.7}
            >
              <View style={styles.limitHeader}>
                <View style={styles.limitTitleRow}>
                  <Text style={styles.limitIcon}>{limit.icon}</Text>
                  <Text style={[styles.limitType, { color: theme.colors.text }]}>
                    {limit.type}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>
                    {status.percentage}%
                  </Text>
                </View>
              </View>

              <View style={styles.limitDetails}>
                <View style={styles.limitRow}>
                  <Text style={[styles.limitLabel, { color: theme.colors.textSecondary }]}>
                    Daily Limit
                  </Text>
                  <Text style={[styles.limitValue, { color: theme.colors.text }]}>
                    {formatAmount(limit.dailyLimit)}
                  </Text>
                </View>

                <View style={styles.limitRow}>
                  <Text style={[styles.limitLabel, { color: theme.colors.textSecondary }]}>
                    Single Transaction
                  </Text>
                  <Text style={[styles.limitValue, { color: theme.colors.text }]}>
                    {formatAmount(limit.singleTransactionLimit)}
                  </Text>
                </View>

                <View style={styles.limitRow}>
                  <Text style={[styles.limitLabel, { color: theme.colors.textSecondary }]}>
                    Requires Approval
                  </Text>
                  <Text style={[styles.limitValue, { color: '#f59e0b' }]}>
                    {formatAmount(limit.requiresApproval)}+
                  </Text>
                </View>

                {/* Progress bar */}
                <View style={[styles.progressContainer, { backgroundColor: theme.colors.border }]}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        backgroundColor: status.color,
                        width: `${status.percentage}%`
                      }
                    ]}
                  />
                </View>

                <Text style={[styles.statusLabel, { color: status.color }]}>
                  {status.status} • {100 - status.percentage}% remaining
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* CBN Compliance Notice */}
      <View style={[styles.complianceNotice, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.complianceIcon]}>🛡️</Text>
        <View style={styles.complianceText}>
          <Text style={[styles.complianceTitle, { color: theme.colors.text }]}>
            CBN Compliance
          </Text>
          <Text style={[styles.complianceDescription, { color: theme.colors.textSecondary }]}>
            Transaction limits comply with Central Bank of Nigeria regulations for microfinance banks.
            High-value transactions require multi-level approval for AML compliance.
          </Text>
        </View>
      </View>
    </View>
  );
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
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  requestButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  requestButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  limitsGrid: {
    gap: 16,
    marginBottom: 20,
  },
  limitCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
  },
  limitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  limitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  limitIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  limitType: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  limitDetails: {
    gap: 8,
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  limitLabel: {
    fontSize: 13,
    flex: 1,
  },
  limitValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressContainer: {
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  complianceNotice: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  complianceIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  complianceText: {
    flex: 1,
  },
  complianceTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  complianceDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
});

export default TransactionLimitsPanel;