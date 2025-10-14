/**
 * Banking Stats Grid Component
 * Role-based statistics display with Nigerian banking metrics
 * Enhanced stats based on user role and permissions
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { formatCurrency } from '../../utils/currency';
import { useTenantTheme } from '../../context/TenantThemeContext';

interface MonthlyStats {
  transactions: number;
  recipients: number;
  volume: string;
}

interface RoleBasedMetrics {
  customerCount?: number;
  loanApplications?: number;
  complianceAlerts?: number;
  systemHealth?: number;
  branchPerformance?: number;
  approvalQueue?: number;
  platformTenants?: number;
  platformRevenue?: number;
  auditFindings?: number;
  creditRiskScore?: number;
  savingsBalance?: number;
  tellerTransactions?: number;
}

interface BankingStatsGridProps {
  userRole: string;
  userPermissions: Record<string, string>;
  monthlyStats: MonthlyStats;
  roleBasedMetrics: RoleBasedMetrics;
  onNavigateToFeature: (feature: string, params?: any) => void;
}

// Define role-specific stat configurations
const getRoleBasedStats = (
  role: string,
  monthlyStats: MonthlyStats,
  roleBasedMetrics: RoleBasedMetrics,
  currency: string,
  locale: string
) => {
  const baseStats = [
    {
      id: 'transactions',
      icon: '📊',
      value: monthlyStats.transactions.toString(),
      label: 'Transactions',
      sublabel: 'This Month',
      color: '#667eea',
      feature: 'transaction_history'
    },
    {
      id: 'volume',
      icon: '💰',
      value: monthlyStats.volume,
      label: 'Monthly Volume',
      sublabel: 'Total Value',
      color: '#4facfe',
      feature: 'analytics_dashboard'
    },
    {
      id: 'recipients',
      icon: '👥',
      value: monthlyStats.recipients.toString(),
      label: 'Recipients',
      sublabel: 'Unique Users',
      color: '#43e97b',
      feature: 'customer_management'
    }
  ];

  // Role-specific additional stats
  const roleSpecificStats = {
    platform_admin: [
      {
        id: 'platform_tenants',
        icon: '🏛️',
        value: (roleBasedMetrics.platformTenants || 0).toString(),
        label: 'Active Tenants',
        sublabel: 'Banks on Platform',
        color: '#9c27b0',
        feature: 'tenant_management'
      },
      {
        id: 'platform_revenue',
        icon: '💎',
        value: `${formatCurrency((roleBasedMetrics.platformRevenue || 0) / 1000000, currency, { locale, showSymbol: true })}M`,
        label: 'Platform Revenue',
        sublabel: 'This Month',
        color: '#ff9800',
        feature: 'platform_analytics'
      }
    ],

    ceo: [
      {
        id: 'customers',
        icon: '🏦',
        value: formatNumber(roleBasedMetrics.customerCount || 0),
        label: 'Total Customers',
        sublabel: 'Bank Wide',
        color: '#8b5cf6',
        feature: 'customer_management'
      },
      {
        id: 'branch_performance',
        icon: '📈',
        value: `${roleBasedMetrics.branchPerformance || 85}%`,
        label: 'Branch Performance',
        sublabel: 'Average Score',
        color: '#10b981',
        feature: 'analytics_dashboard'
      }
    ],

    deputy_md: [
      {
        id: 'operations_efficiency',
        icon: '⚙️',
        value: `${roleBasedMetrics.branchPerformance || 92}%`,
        label: 'Operations Score',
        sublabel: 'Efficiency Rating',
        color: '#f59e0b',
        feature: 'analytics_dashboard'
      },
      {
        id: 'approval_queue',
        icon: '⏳',
        value: (roleBasedMetrics.approvalQueue || 0).toString(),
        label: 'Pending Approvals',
        sublabel: 'Requires Action',
        color: '#ef4444',
        feature: 'approval_management'
      }
    ],

    branch_manager: [
      {
        id: 'branch_customers',
        icon: '👤',
        value: formatNumber(roleBasedMetrics.customerCount || 0),
        label: 'Branch Customers',
        sublabel: 'Active Accounts',
        color: '#8b5cf6',
        feature: 'customer_management'
      },
      {
        id: 'branch_loans',
        icon: '💳',
        value: (roleBasedMetrics.loanApplications || 0).toString(),
        label: 'Loan Applications',
        sublabel: 'This Month',
        color: '#43e97b',
        feature: 'loan_management'
      }
    ],

    operations_manager: [
      {
        id: 'daily_transactions',
        icon: '🔄',
        value: Math.round((monthlyStats.transactions || 0) / 30).toString(),
        label: 'Daily Average',
        sublabel: 'Transactions',
        color: '#667eea',
        feature: 'transaction_management'
      },
      {
        id: 'system_health',
        icon: '💚',
        value: `${roleBasedMetrics.systemHealth || 98}%`,
        label: 'System Health',
        sublabel: 'Uptime Status',
        color: '#10b981',
        feature: 'system_monitoring'
      }
    ],

    credit_manager: [
      {
        id: 'loan_portfolio',
        icon: '💼',
        value: (roleBasedMetrics.loanApplications || 0).toString(),
        label: 'Active Loans',
        sublabel: 'Portfolio Size',
        color: '#43e97b',
        feature: 'loan_management'
      },
      {
        id: 'credit_risk',
        icon: '📊',
        value: `${roleBasedMetrics.creditRiskScore || 7.5}/10`,
        label: 'Credit Risk Score',
        sublabel: 'Portfolio Health',
        color: '#f59e0b',
        feature: 'risk_management'
      }
    ],

    compliance_officer: [
      {
        id: 'compliance_alerts',
        icon: '⚠️',
        value: (roleBasedMetrics.complianceAlerts || 0).toString(),
        label: 'Compliance Alerts',
        sublabel: 'Requires Review',
        color: '#ef4444',
        feature: 'compliance_dashboard'
      },
      {
        id: 'audit_findings',
        icon: '🔍',
        value: (roleBasedMetrics.auditFindings || 0).toString(),
        label: 'Audit Findings',
        sublabel: 'Open Items',
        color: '#f59e0b',
        feature: 'audit_management'
      }
    ],

    audit_officer: [
      {
        id: 'audit_coverage',
        icon: '📋',
        value: '87%',
        label: 'Audit Coverage',
        sublabel: 'YTD Progress',
        color: '#8b5cf6',
        feature: 'audit_dashboard'
      },
      {
        id: 'findings',
        icon: '🔍',
        value: (roleBasedMetrics.auditFindings || 0).toString(),
        label: 'Active Findings',
        sublabel: 'In Progress',
        color: '#f59e0b',
        feature: 'audit_findings'
      }
    ],

    relationship_manager: [
      {
        id: 'portfolio_customers',
        icon: '🤝',
        value: formatNumber(roleBasedMetrics.customerCount || 0),
        label: 'My Customers',
        sublabel: 'Portfolio Size',
        color: '#8b5cf6',
        feature: 'customer_portfolio'
      },
      {
        id: 'savings_managed',
        icon: '💰',
        value: `${formatCurrency((roleBasedMetrics.savingsBalance || 0) / 1000000, currency, { locale, showSymbol: true })}M`,
        label: 'Savings Managed',
        sublabel: 'Total Balance',
        color: '#4facfe',
        feature: 'savings_management'
      }
    ],

    loan_officer: [
      {
        id: 'loan_applications_pending',
        icon: '📄',
        value: (roleBasedMetrics.loanApplications || 0).toString(),
        label: 'Pending Applications',
        sublabel: 'My Queue',
        color: '#43e97b',
        feature: 'loan_queue'
      },
      {
        id: 'approval_rate',
        icon: '✅',
        value: '78%',
        label: 'Approval Rate',
        sublabel: 'This Month',
        color: '#10b981',
        feature: 'loan_analytics'
      }
    ],

    customer_service: [
      {
        id: 'support_tickets',
        icon: '🎫',
        value: '24',
        label: 'Support Tickets',
        sublabel: 'Active Cases',
        color: '#f59e0b',
        feature: 'support_dashboard'
      },
      {
        id: 'customer_satisfaction',
        icon: '😊',
        value: '94%',
        label: 'Satisfaction Rate',
        sublabel: 'Customer Rating',
        color: '#10b981',
        feature: 'customer_feedback'
      }
    ],

    head_teller: [
      {
        id: 'cash_position',
        icon: '💵',
        value: `${formatCurrency((roleBasedMetrics.savingsBalance || 5000000) / 1000, currency, { locale, showSymbol: true })}K`,
        label: 'Cash Position',
        sublabel: 'Available Cash',
        color: '#43e97b',
        feature: 'cash_management'
      },
      {
        id: 'teller_transactions',
        icon: '💸',
        value: (roleBasedMetrics.tellerTransactions || 156).toString(),
        label: 'Teller Transactions',
        sublabel: 'Today',
        color: '#667eea',
        feature: 'teller_dashboard'
      }
    ],

    bank_teller: [
      {
        id: 'my_transactions',
        icon: '💸',
        value: '47',
        label: 'My Transactions',
        sublabel: 'Today',
        color: '#667eea',
        feature: 'my_transactions'
      },
      {
        id: 'cash_drawer',
        icon: '💰',
        value: `${formatCurrency((roleBasedMetrics.savingsBalance || 500000) / 1000, currency, { locale, showSymbol: true })}K`,
        label: 'Cash Drawer',
        sublabel: 'Balance',
        color: '#43e97b',
        feature: 'cash_drawer'
      }
    ],

    credit_analyst: [
      {
        id: 'analysis_queue',
        icon: '📊',
        value: (roleBasedMetrics.loanApplications || 0).toString(),
        label: 'Analysis Queue',
        sublabel: 'Pending Review',
        color: '#43e97b',
        feature: 'credit_analysis'
      },
      {
        id: 'risk_models',
        icon: '🎯',
        value: `${roleBasedMetrics.creditRiskScore || 8.2}/10`,
        label: 'Model Accuracy',
        sublabel: 'Risk Prediction',
        color: '#8b5cf6',
        feature: 'risk_modeling'
      }
    ]
  };

  // Combine base stats with role-specific stats
  const roleStats = roleSpecificStats[role] || [];
  return [...baseStats, ...roleStats];
};

// Format number utility
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export const BankingStatsGrid: React.FC<BankingStatsGridProps> = ({
  userRole,
  userPermissions,
  monthlyStats,
  roleBasedMetrics,
  onNavigateToFeature
}) => {
  const { theme: tenantTheme } = useTenantTheme();
  const stats = getRoleBasedStats(userRole, monthlyStats, roleBasedMetrics, 'NGN', 'en-NG');

  return (
    <View style={styles.container}>
      <View style={styles.gridContainer}>
        {stats.map((stat, index) => (
          <TouchableOpacity
            key={stat.id}
            style={[
              styles.statCard,
              {
                backgroundColor: '#ffffff',
                borderLeftWidth: 4,
                borderLeftColor: stat.color,
              }
            ]}
            onPress={() => onNavigateToFeature(stat.feature)}
            activeOpacity={0.7}
          >
            <View style={styles.statHeader}>
              <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
                <Text style={styles.statIconText}>{stat.icon}</Text>
              </View>
              <View style={styles.statContent}>
                <Text style={[styles.statValue, { color: stat.color }]}>
                  {stat.value}
                </Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statSublabel}>{stat.sublabel}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Role-specific insights */}
      <View style={styles.insightsContainer}>
        <Text style={styles.insightsTitle}>
          💡 {userRole.replace('_', ' ').toUpperCase()} Insights
        </Text>
        <Text style={styles.insightsText}>
          {getRoleSpecificInsight(userRole, monthlyStats, roleBasedMetrics, 'NGN', 'en-NG')}
        </Text>
      </View>
    </View>
  );
};

// Generate role-specific insights
const getRoleSpecificInsight = (
  role: string,
  monthlyStats: MonthlyStats,
  roleBasedMetrics: RoleBasedMetrics,
  currency: string,
  locale: string
): string => {
  const insights = {
    platform_admin: `Managing ${roleBasedMetrics.platformTenants || 0} active banks with ${formatCurrency((roleBasedMetrics.platformRevenue || 0) / 1000000, currency, { locale })}M monthly revenue. System performance optimal.`,
    ceo: `Bank performance at ${roleBasedMetrics.branchPerformance || 85}% with ${formatNumber(roleBasedMetrics.customerCount || 0)} customers. ${monthlyStats.volume} processed this month.`,
    deputy_md: `Operations running at ${roleBasedMetrics.branchPerformance || 92}% efficiency. ${roleBasedMetrics.approvalQueue || 0} items need your approval.`,
    branch_manager: `Your branch serves ${formatNumber(roleBasedMetrics.customerCount || 0)} customers with ${roleBasedMetrics.loanApplications || 0} active loan applications.`,
    operations_manager: `Processing ${Math.round((monthlyStats.transactions || 0) / 30)} transactions daily with ${roleBasedMetrics.systemHealth || 98}% system uptime.`,
    credit_manager: `Managing ${roleBasedMetrics.loanApplications || 0} loans with risk score of ${roleBasedMetrics.creditRiskScore || 7.5}/10. Portfolio health is strong.`,
    compliance_officer: `${roleBasedMetrics.complianceAlerts || 0} compliance alerts require review. ${roleBasedMetrics.auditFindings || 0} audit findings in progress.`,
    audit_officer: `87% audit coverage achieved YTD. ${roleBasedMetrics.auditFindings || 0} active findings being tracked.`,
    relationship_manager: `Managing ${formatNumber(roleBasedMetrics.customerCount || 0)} customers with ${formatCurrency((roleBasedMetrics.savingsBalance || 0) / 1000000, currency, { locale })}M in savings.`,
    loan_officer: `${roleBasedMetrics.loanApplications || 0} applications in your queue with 78% approval rate this month.`,
    customer_service: `24 active support tickets with 94% customer satisfaction rating. Strong service performance.`,
    head_teller: `${formatCurrency((roleBasedMetrics.savingsBalance || 5000000) / 1000, currency, { locale })}K cash position with ${roleBasedMetrics.tellerTransactions || 156} transactions today.`,
    bank_teller: `47 transactions processed today with ${formatCurrency((roleBasedMetrics.savingsBalance || 500000) / 1000, currency, { locale })}K cash drawer balance.`,
    credit_analyst: `${roleBasedMetrics.loanApplications || 0} applications pending analysis with ${roleBasedMetrics.creditRiskScore || 8.2}/10 model accuracy.`
  };

  return insights[role] || 'Your banking operations are performing well.';
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#f8fafc',
    marginBottom: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    minWidth: 150,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statIconText: {
    fontSize: 16,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 1,
  },
  statSublabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  insightsContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  insightsText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6b7280',
  },
});

export default BankingStatsGrid;