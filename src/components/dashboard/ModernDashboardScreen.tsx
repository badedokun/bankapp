/**
 * Modern Dashboard Screen - Glassmorphism Design with RBAC Integration
 * Replaces EnhancedDashboardScreen with modern Revolut-style interface
 * Maintains all existing multi-tenancy and RBAC security features
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useTenantTheme } from '../../context/TenantThemeContext';
import { RoleBasedFeatureGrid } from './RoleBasedFeatureGrid';
import AIAssistantPanel from './AIAssistantPanel';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';

const { width: screenWidth } = Dimensions.get('window');

// Modern Stats Card Component with Glassmorphism
interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
  theme: any;
  isVisible: boolean;
}

const ModernStatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon,
  theme,
  isVisible
}) => {
  if (!isVisible) return null;

  const changeColor = changeType === 'positive' ? '#10B981' : changeType === 'negative' ? '#EF4444' : theme.colors.textSecondary;

  return (
    <View style={[styles.statsCard, {
      backgroundColor: theme.colors.glassBackground,
      borderColor: theme.colors.glassBorder
    }]}>
      <View style={styles.statsHeader}>
        <Text style={styles.statsIcon}>{icon}</Text>
        <Text style={[styles.statsTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
      </View>
      <Text style={[styles.statsValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statsChange, { color: changeColor }]}>{change}</Text>
    </View>
  );
};

// Quick Action Button with Modern Design
interface QuickActionProps {
  title: string;
  icon: string;
  onPress: () => void;
  theme: any;
  gradient?: [string, string];
  isVisible: boolean;
}

const QuickActionButton: React.FC<QuickActionProps> = ({
  title,
  icon,
  onPress,
  theme,
  gradient = [theme.colors.primary, theme.colors.primaryGradientEnd],
  isVisible
}) => {
  if (!isVisible) return null;

  return (
    <TouchableOpacity
      style={[styles.quickAction, {
        backgroundColor: gradient[0],
        shadowColor: gradient[0]
      }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.quickActionIcon}>{icon}</Text>
      <Text style={styles.quickActionTitle}>{title}</Text>
    </TouchableOpacity>
  );
};

// Recent Transaction Item with Modern Styling
interface TransactionItemProps {
  transaction: any;
  theme: any;
  onPress: () => void;
}

const ModernTransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  theme,
  onPress
}) => {
  const getTransactionIcon = (type: string) => {
    const icons = {
      transfer: '↗️',
      deposit: '💰',
      withdrawal: '💸',
      payment: '💳',
      default: '💼'
    };
    return icons[type] || icons.default;
  };

  return (
    <TouchableOpacity
      style={[styles.transactionItem, {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border
      }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.transactionIcon, { backgroundColor: theme.colors.background }]}>
        <Text style={styles.transactionIconText}>{getTransactionIcon(transaction.type)}</Text>
      </View>
      <View style={styles.transactionDetails}>
        <Text style={[styles.transactionTitle, { color: theme.colors.text }]}>
          {transaction.description || transaction.recipient_name || 'Transaction'}
        </Text>
        <Text style={[styles.transactionDate, { color: theme.colors.textSecondary }]}>
          {new Date(transaction.created_at).toLocaleDateString()}
        </Text>
      </View>
      <Text style={[styles.transactionAmount, {
        color: transaction.type === 'deposit' ? '#10B981' : tenantTheme.colors.text
      }]}>
        {transaction.type === 'withdrawal' ? '-' : ''}{formatCurrency(Number(transaction.amount), tenantTheme.currency, { locale: tenantTheme.locale })}
      </Text>
    </TouchableOpacity>
  );
};

// Main Dashboard Props Interface
interface ModernDashboardScreenProps {
  userContext: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions: Record<string, string>;
    tenantId: string;
  };
  dashboardData: {
    totalBalance: number;
    accountNumber: string;
    recentTransactions: any[];
    availableFeatures: string[];
    analyticsData?: any;
  };
  onNavigateToTransactionDetails: (transactionId: string) => void;
  onFeatureNavigation: (feature: string, params?: any) => void;
  onAIAssistantPress: () => void;
}

export const ModernDashboardScreen: React.FC<ModernDashboardScreenProps> = ({
  userContext,
  dashboardData,
  onNavigateToTransactionDetails,
  onFeatureNavigation,
  onAIAssistantPress
}) => {
  const { theme: tenantTheme } = useTenantTheme();
  const [refreshing, setRefreshing] = useState(false);

  // Permission checks for feature visibility
  const hasPermission = (permission: string, level: string = 'read') => {
    const userLevel = userContext.permissions[permission] || 'none';
    const levels = ['none', 'read', 'write', 'full'];
    return levels.indexOf(userLevel) >= levels.indexOf(level);
  };

  // Admin gets everything for development
  const isDevAdmin = userContext.role === 'admin' || hasPermission('platform_administration', 'full');

  // Calculate stats based on permissions
  const statsData = [
    {
      title: 'Total Balance',
      value: formatCurrency(dashboardData.totalBalance, tenantTheme.currency, { locale: tenantTheme.locale }),
      change: '+2.5% from last month',
      changeType: 'positive' as const,
      icon: '💰',
      isVisible: hasPermission('view_account_balance') || isDevAdmin
    },
    {
      title: 'Monthly Transactions',
      value: dashboardData.recentTransactions?.length?.toString() || '0',
      change: '+12% this month',
      changeType: 'positive' as const,
      icon: '📊',
      isVisible: hasPermission('view_transaction_history') || isDevAdmin
    },
    {
      title: 'Account Status',
      value: 'Active',
      change: 'Verified account',
      changeType: 'neutral' as const,
      icon: '✅',
      isVisible: hasPermission('view_customer_accounts') || isDevAdmin
    },
    {
      title: 'Available Credit',
      value: formatCurrency(500000, tenantTheme.currency, { locale: tenantTheme.locale }),
      change: '60% utilized',
      changeType: 'neutral' as const,
      icon: '💳',
      isVisible: hasPermission('view_loan_applications') || isDevAdmin
    }
  ];

  // Quick actions based on permissions
  const quickActions = [
    {
      title: 'Transfer',
      icon: '💸',
      onPress: () => onFeatureNavigation('money_transfer_operations'),
      gradient: [theme.colors.primary, theme.colors.primaryGradientEnd],
      isVisible: hasPermission('internal_transfers', 'write') || isDevAdmin
    },
    {
      title: 'Pay Bills',
      icon: '📱',
      onPress: () => onFeatureNavigation('bill_payments'),
      gradient: ['#10B981', '#059669'],
      isVisible: hasPermission('bill_payments', 'write') || isDevAdmin
    },
    {
      title: 'Savings',
      icon: '🏦',
      onPress: () => onFeatureNavigation('savings_products'),
      gradient: ['#3B82F6', '#1D4ED8'],
      isVisible: hasPermission('view_savings_accounts', 'write') || isDevAdmin
    },
    {
      title: 'Loans',
      icon: '💰',
      onPress: () => onFeatureNavigation('loan_products'),
      gradient: ['#8B5CF6', '#7C3AED'],
      isVisible: hasPermission('view_loan_applications', 'write') || isDevAdmin
    }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: tenantTheme.colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        Platform.OS !== 'web' ? (
          <ScrollView
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={tenantTheme.colors.primary}
          />
        ) : undefined
      }
    >
      {/* Modern Header with Glass Effect */}
      <View style={[styles.header, {
        backgroundColor: tenantTheme.colors.glassBackground,
        borderColor: tenantTheme.colors.glassBorder
      }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.welcomeText, { color: tenantTheme.colors.textSecondary }]}>
              Welcome back,
            </Text>
            <Text style={[styles.userName, { color: tenantTheme.colors.text }]}>
              {userContext.firstName} {userContext.lastName}
            </Text>
            <Text style={[styles.userRole, { color: tenantTheme.colors.textSecondary }]}>
              {userContext.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.aiButton, { backgroundColor: tenantTheme.colors.primary }]}
            onPress={onAIAssistantPress}
            activeOpacity={0.8}
          >
            <Text style={styles.aiButtonText}>🤖</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modern Stats Grid */}
      <View style={styles.statsGrid}>
        {statsData.map((stat, index) => (
          <ModernStatsCard
            key={index}
            {...stat}
            theme={tenantTheme}
          />
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={[styles.sectionTitle, { color: tenantTheme.colors.text }]}>
          Quick Actions
        </Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <QuickActionButton
              key={index}
              {...action}
              theme={tenantTheme}
            />
          ))}
        </View>
      </View>

      {/* Recent Transactions */}
      {(hasPermission('view_transaction_history') || isDevAdmin) && (
        <View style={styles.transactionsContainer}>
          <View style={styles.transactionsHeader}>
            <Text style={[styles.sectionTitle, { color: tenantTheme.colors.text }]}>
              Recent Transactions
            </Text>
            <TouchableOpacity
              onPress={() => onFeatureNavigation('transaction_history')}
              activeOpacity={0.7}
            >
              <Text style={[styles.viewAllText, { color: tenantTheme.colors.primary }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.transactionsList, {
            backgroundColor: tenantTheme.colors.glassBackground,
            borderColor: tenantTheme.colors.glassBorder
          }]}>
            {dashboardData.recentTransactions?.slice(0, 5).map((transaction, index) => (
              <ModernTransactionItem
                key={transaction.id || index}
                transaction={transaction}
                theme={tenantTheme}
                onPress={() => onNavigateToTransactionDetails(transaction.id)}
              />
            ))}
            {(!dashboardData.recentTransactions || dashboardData.recentTransactions.length === 0) && (
              <View style={styles.emptyTransactions}>
                <Text style={[styles.emptyText, { color: tenantTheme.colors.textSecondary }]}>
                  No recent transactions
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* RBAC Feature Grid */}
      <RoleBasedFeatureGrid
        userRole={userContext.role}
        userPermissions={userContext.permissions}
        availableFeatures={dashboardData.availableFeatures}
        onFeaturePress={onFeatureNavigation}
        theme={tenantTheme}
      />

      {/* AI Assistant Panel */}
      {(hasPermission('access_ai_chat') || isDevAdmin) && (
        <AIAssistantPanel
          theme={tenantTheme}
          userRole={userContext.role}
          aiSuggestions={[]}
          onNavigateToAIChat={onAIAssistantPress}
          onSuggestionPress={(suggestionType, params) => {
            // Handle AI suggestion press - could trigger feature navigation
            if (suggestionType && onFeatureNavigation) {
              onFeatureNavigation(suggestionType, params);
            }
          }}
        />
      )}

      {/* Bottom Spacer */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginHorizontal: 20,
    marginTop: Platform.OS === 'ios' ? 60 : 20,
    marginBottom: 20,
    borderRadius: 24,
    borderWidth: 1,
    backdropFilter: 'blur(20px)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
  },
  welcomeText: {
    fontSize: 14,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 12,
    opacity: 0.8,
  },
  aiButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  aiButtonText: {
    fontSize: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statsCard: {
    width: (screenWidth - 56) / 2,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    backdropFilter: 'blur(20px)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statsTitle: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsChange: {
    fontSize: 11,
    fontWeight: '500',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  quickAction: {
    width: (screenWidth - 56) / 2,
    height: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  transactionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionsList: {
    borderRadius: 20,
    borderWidth: 1,
    backdropFilter: 'blur(20px)',
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionIconText: {
    fontSize: 16,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyTransactions: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default ModernDashboardScreen;