/**
 * Role-Based Navigation Component
 * Provides context-aware navigation based on user roles and permissions
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

interface NavigationItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  route: string;
  requiredPermission: string;
  minPermissionLevel: 'none' | 'read' | 'write' | 'full';
  category: 'quick' | 'operations' | 'management' | 'compliance' | 'platform';
  priority: number;
  rolesWithAccess: string[];
  badgeCount?: number;
  urgent?: boolean;
}

interface RoleBasedNavigationProps {
  userRole: string;
  userPermissions: Record<string, string>;
  currentRoute: string;
  onNavigate: (route: string, params?: any) => void;
  theme: any;
  style?: any;
}

export const RoleBasedNavigation: React.FC<RoleBasedNavigationProps> = ({
  userRole,
  userPermissions,
  currentRoute,
  onNavigate,
  theme,
  style
}) => {
  // Comprehensive navigation items for Nigerian banking
  const ALL_NAVIGATION_ITEMS: NavigationItem[] = [
    // Quick Actions
    {
      id: 'quick_transfer',
      title: 'Quick Transfer',
      subtitle: 'Send money now',
      icon: '⚡',
      route: '/transfer/quick',
      requiredPermission: 'internal_transfers',
      minPermissionLevel: 'write',
      category: 'quick',
      priority: 1,
      rolesWithAccess: ['ceo', 'deputy_md', 'branch_manager', 'operations_manager', 'head_teller', 'bank_teller']
    },
    {
      id: 'customer_lookup',
      title: 'Customer Lookup',
      subtitle: 'Find customer info',
      icon: '👤',
      route: '/customers/search',
      requiredPermission: 'view_customer_accounts',
      minPermissionLevel: 'read',
      category: 'quick',
      priority: 2,
      rolesWithAccess: ['ceo', 'deputy_md', 'branch_manager', 'operations_manager', 'customer_service', 'head_teller', 'bank_teller', 'relationship_manager']
    },
    {
      id: 'balance_inquiry',
      title: 'Balance Inquiry',
      subtitle: 'Check account balance',
      icon: '💰',
      route: '/accounts/balance',
      requiredPermission: 'view_customer_accounts',
      minPermissionLevel: 'read',
      category: 'quick',
      priority: 3,
      rolesWithAccess: ['ceo', 'deputy_md', 'branch_manager', 'operations_manager', 'customer_service', 'head_teller', 'bank_teller', 'relationship_manager']
    },
    {
      id: 'transaction_status',
      title: 'Transaction Status',
      subtitle: 'Track transfers',
      icon: '🔍',
      route: '/transactions/status',
      requiredPermission: 'view_transactions',
      minPermissionLevel: 'read',
      category: 'quick',
      priority: 4,
      rolesWithAccess: ['ceo', 'deputy_md', 'branch_manager', 'operations_manager', 'customer_service', 'head_teller', 'bank_teller', 'compliance_officer', 'audit_officer']
    },

    // Banking Operations
    {
      id: 'money_transfers',
      title: 'Money Transfers',
      subtitle: 'All transfer options',
      icon: '💸',
      route: '/transfers',
      requiredPermission: 'internal_transfers',
      minPermissionLevel: 'read',
      category: 'operations',
      priority: 1,
      rolesWithAccess: ['ceo', 'deputy_md', 'branch_manager', 'operations_manager', 'head_teller', 'bank_teller']
    },
    {
      id: 'account_management',
      title: 'Account Management',
      subtitle: 'Manage customer accounts',
      icon: '🏦',
      route: '/accounts',
      requiredPermission: 'manage_customer_accounts',
      minPermissionLevel: 'write',
      category: 'operations',
      priority: 2,
      rolesWithAccess: ['ceo', 'deputy_md', 'branch_manager', 'operations_manager', 'customer_service', 'relationship_manager']
    },
    {
      id: 'savings_products',
      title: 'Savings Products',
      subtitle: 'Savings & deposits',
      icon: '💎',
      route: '/savings',
      requiredPermission: 'manage_savings_products',
      minPermissionLevel: 'read',
      category: 'operations',
      priority: 3,
      rolesWithAccess: ['ceo', 'deputy_md', 'branch_manager', 'operations_manager', 'customer_service', 'relationship_manager']
    },
    {
      id: 'loan_management',
      title: 'Loan Management',
      subtitle: 'Loans & credit',
      icon: '📊',
      route: '/loans',
      requiredPermission: 'manage_loan_products',
      minPermissionLevel: 'read',
      category: 'operations',
      priority: 4,
      rolesWithAccess: ['ceo', 'deputy_md', 'branch_manager', 'credit_manager', 'loan_officer', 'credit_analyst']
    },
    {
      id: 'bill_payments',
      title: 'Bill Payments',
      subtitle: 'Pay utilities & bills',
      icon: '🧾',
      route: '/payments/bills',
      requiredPermission: 'bill_payments',
      minPermissionLevel: 'write',
      category: 'operations',
      priority: 5,
      rolesWithAccess: ['ceo', 'deputy_md', 'branch_manager', 'operations_manager', 'customer_service', 'head_teller', 'bank_teller']
    },

    // Management & Oversight
    {
      id: 'user_management',
      title: 'User Management',
      subtitle: 'Staff & roles',
      icon: '👥',
      route: '/admin/users',
      requiredPermission: 'manage_users',
      minPermissionLevel: 'read',
      category: 'management',
      priority: 1,
      rolesWithAccess: ['platform_admin', 'ceo', 'deputy_md', 'branch_manager']
    },
    {
      id: 'transaction_monitoring',
      title: 'Transaction Monitoring',
      subtitle: 'Monitor all activities',
      icon: '📈',
      route: '/monitoring/transactions',
      requiredPermission: 'monitor_transactions',
      minPermissionLevel: 'read',
      category: 'management',
      priority: 2,
      rolesWithAccess: ['platform_admin', 'ceo', 'deputy_md', 'branch_manager', 'operations_manager', 'compliance_officer', 'audit_officer']
    },
    {
      id: 'financial_reports',
      title: 'Financial Reports',
      subtitle: 'Analytics & insights',
      icon: '📊',
      route: '/reports/financial',
      requiredPermission: 'view_financial_reports',
      minPermissionLevel: 'read',
      category: 'management',
      priority: 3,
      rolesWithAccess: ['platform_admin', 'ceo', 'deputy_md', 'branch_manager', 'operations_manager', 'credit_manager', 'compliance_officer', 'audit_officer']
    },
    {
      id: 'branch_performance',
      title: 'Branch Performance',
      subtitle: 'Performance metrics',
      icon: '🏪',
      route: '/reports/branches',
      requiredPermission: 'view_branch_reports',
      minPermissionLevel: 'read',
      category: 'management',
      priority: 4,
      rolesWithAccess: ['platform_admin', 'ceo', 'deputy_md', 'branch_manager', 'operations_manager']
    },

    // Compliance & Audit
    {
      id: 'compliance_monitoring',
      title: 'Compliance Monitoring',
      subtitle: 'CBN compliance',
      icon: '🛡️',
      route: '/compliance/monitoring',
      requiredPermission: 'compliance_monitoring',
      minPermissionLevel: 'read',
      category: 'compliance',
      priority: 1,
      rolesWithAccess: ['platform_admin', 'ceo', 'deputy_md', 'compliance_officer', 'audit_officer']
    },
    {
      id: 'audit_trail',
      title: 'Audit Trail',
      subtitle: 'Activity logs',
      icon: '🔍',
      route: '/audit/trail',
      requiredPermission: 'audit_trail',
      minPermissionLevel: 'read',
      category: 'compliance',
      priority: 2,
      rolesWithAccess: ['platform_admin', 'ceo', 'deputy_md', 'compliance_officer', 'audit_officer']
    },
    {
      id: 'risk_assessment',
      title: 'Risk Assessment',
      subtitle: 'Risk management',
      icon: '⚠️',
      route: '/risk/assessment',
      requiredPermission: 'risk_management',
      minPermissionLevel: 'read',
      category: 'compliance',
      priority: 3,
      rolesWithAccess: ['platform_admin', 'ceo', 'deputy_md', 'compliance_officer', 'audit_officer', 'credit_manager', 'credit_analyst']
    },
    {
      id: 'regulatory_reports',
      title: 'Regulatory Reports',
      subtitle: 'CBN submissions',
      icon: '📋',
      route: '/compliance/reports',
      requiredPermission: 'regulatory_reporting',
      minPermissionLevel: 'read',
      category: 'compliance',
      priority: 4,
      rolesWithAccess: ['platform_admin', 'ceo', 'deputy_md', 'compliance_officer', 'audit_officer']
    },

    // Platform Administration
    {
      id: 'tenant_management',
      title: 'Tenant Management',
      subtitle: 'Multi-bank platform',
      icon: '🏛️',
      route: '/platform/tenants',
      requiredPermission: 'platform_administration',
      minPermissionLevel: 'read',
      category: 'platform',
      priority: 1,
      rolesWithAccess: ['platform_admin']
    },
    {
      id: 'system_configuration',
      title: 'System Configuration',
      subtitle: 'Platform settings',
      icon: '⚙️',
      route: '/platform/config',
      requiredPermission: 'platform_administration',
      minPermissionLevel: 'write',
      category: 'platform',
      priority: 2,
      rolesWithAccess: ['platform_admin']
    },
    {
      id: 'system_monitoring',
      title: 'System Monitoring',
      subtitle: 'Platform health',
      icon: '📡',
      route: '/platform/monitoring',
      requiredPermission: 'platform_administration',
      minPermissionLevel: 'read',
      category: 'platform',
      priority: 3,
      rolesWithAccess: ['platform_admin']
    }
  ];

  // Filter navigation items based on user role and permissions
  const getAccessibleItems = (): NavigationItem[] => {
    return ALL_NAVIGATION_ITEMS.filter(item => {
      // Check if role has access
      if (!item.rolesWithAccess.includes(userRole)) {
        return false;
      }

      // Check permission level
      const userPermissionLevel = userPermissions[item.requiredPermission];
      if (!userPermissionLevel || userPermissionLevel === 'none') {
        return false;
      }

      // Check minimum permission level
      const permissionLevels = ['none', 'read', 'write', 'full'];
      const userLevel = permissionLevels.indexOf(userPermissionLevel);
      const requiredLevel = permissionLevels.indexOf(item.minPermissionLevel);

      return userLevel >= requiredLevel;
    }).sort((a, b) => a.priority - b.priority);
  };

  // Group items by category
  const getItemsByCategory = () => {
    const items = getAccessibleItems();
    const grouped: Record<string, NavigationItem[]> = {};

    items.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });

    return grouped;
  };

  const getCategoryTitle = (category: string): string => {
    const titles = {
      quick: '⚡ Quick Actions',
      operations: '🏦 Banking Operations',
      management: '📊 Management',
      compliance: '🛡️ Compliance & Audit',
      platform: '🏛️ Platform Administration'
    };

    return titles[category] || category;
  };

  const getCategoryDescription = (category: string): string => {
    const descriptions = {
      quick: 'Frequently used banking functions',
      operations: 'Core banking services and customer management',
      management: 'Oversight, reporting, and performance monitoring',
      compliance: 'Regulatory compliance and audit functions',
      platform: 'System administration and multi-tenant management'
    };

    return descriptions[category] || '';
  };

  const isActiveRoute = (route: string): boolean => {
    return currentRoute === route || currentRoute.startsWith(route);
  };

  const handleItemPress = (item: NavigationItem) => {
    onNavigate(item.route, {
      title: item.title,
      userRole,
      permissions: userPermissions
    });
  };

  const groupedItems = getItemsByCategory();
  const categoryOrder = ['quick', 'operations', 'management', 'compliance', 'platform'];

  // Filter out empty categories
  const availableCategories = categoryOrder.filter(category => groupedItems[category]?.length > 0);

  if (availableCategories.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface }, style]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔒</Text>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            Limited Access
          </Text>
          <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>
            Your current role has limited navigation options. Contact your administrator for access to additional features.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.surface }, style]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          🧭 Banking Navigation
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          Role: {userRole.replace('_', ' ').toUpperCase()}
        </Text>
      </View>

      {availableCategories.map((category) => (
        <View key={category} style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>
              {getCategoryTitle(category)}
            </Text>
            <Text style={[styles.categoryDescription, { color: theme.colors.textSecondary }]}>
              {getCategoryDescription(category)}
            </Text>
          </View>

          <View style={styles.itemsGrid}>
            {groupedItems[category].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.navigationItem,
                  {
                    backgroundColor: isActiveRoute(item.route)
                      ? theme.colors.primary + '20'
                      : theme.colors.background,
                    borderColor: isActiveRoute(item.route)
                      ? theme.colors.primary
                      : theme.colors.border
                  }
                ]}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.itemHeader}>
                  <Text style={styles.itemIcon}>{item.icon}</Text>
                  {item.badgeCount && (
                    <View style={[styles.badge, { backgroundColor: item.urgent ? '#ef4444' : theme.colors.primary }]}>
                      <Text style={styles.badgeText}>
                        {item.badgeCount > 99 ? '99+' : item.badgeCount.toString()}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={[
                  styles.itemTitle,
                  {
                    color: isActiveRoute(item.route)
                      ? theme.colors.primary
                      : theme.colors.text
                  }
                ]}>
                  {item.title}
                </Text>

                {item.subtitle && (
                  <Text style={[styles.itemSubtitle, { color: theme.colors.textSecondary }]}>
                    {item.subtitle}
                  </Text>
                )}

                {/* Permission indicator */}
                <View style={styles.permissionIndicator}>
                  <Text style={[
                    styles.permissionText,
                    { color: theme.colors.textSecondary }
                  ]}>
                    {userPermissions[item.requiredPermission]?.toUpperCase() || 'LIMITED'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Role Summary */}
      <View style={[styles.roleSummary, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.roleSummaryTitle, { color: theme.colors.text }]}>
          👤 Role Summary
        </Text>
        <Text style={[styles.roleSummaryText, { color: theme.colors.textSecondary }]}>
          As a {userRole.replace('_', ' ')}, you have access to {getAccessibleItems().length} features
          across {availableCategories.length} categories. Your permissions enable
          {Object.values(userPermissions).filter(p => p !== 'none').length} distinct operations.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryHeader: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  navigationItem: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    minHeight: 120,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemIcon: {
    fontSize: 24,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  permissionIndicator: {
    marginTop: 'auto',
  },
  permissionText: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  roleSummary: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  roleSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  roleSummaryText: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    minHeight: 200,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default RoleBasedNavigation;