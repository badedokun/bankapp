/**
 * Role-Based Feature Grid Component
 * Displays banking features based on user role and permissions from RBAC matrix
 * Integrates all 17 HTML mockup features with proper access control
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

// Feature definitions from our 17 HTML mockups + RBAC matrix
interface BankingFeature {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  category: 'transfers' | 'savings' | 'loans' | 'operations' | 'management' | 'platform';
  requiredPermission: string;
  minPermissionLevel: 'read' | 'write' | 'full';
  priority: number; // 1=highest, 10=lowest (for sorting)
  rolesWithAccess: string[]; // Roles that should see this feature
}

// All banking features from RBAC matrix and HTML mockups
const ALL_BANKING_FEATURES: BankingFeature[] = [
  // TRANSFER OPERATIONS (Consolidated into single entry point)
  {
    id: 'money_transfer_operations',
    title: 'Money Transfer Operations',
    subtitle: 'All transfer services in one place',
    icon: '💸',
    category: 'transfers',
    requiredPermission: 'internal_transfers',
    minPermissionLevel: 'write',
    priority: 1,
    rolesWithAccess: ['ceo', 'deputy_md', 'branch_manager', 'operations_manager', 'relationship_manager', 'loan_officer', 'customer_service', 'head_teller', 'bank_teller']
  },

  // SAVINGS PRODUCTS (Consolidated into single entry point)
  {
    id: 'savings_products',
    title: 'Savings Products',
    subtitle: 'All savings services in one place',
    icon: '💰',
    category: 'savings',
    requiredPermission: 'view_savings_accounts',
    minPermissionLevel: 'write',
    priority: 2,
    rolesWithAccess: ['ceo', 'deputy_md', 'branch_manager', 'operations_manager', 'credit_manager', 'relationship_manager', 'loan_officer', 'customer_service', 'head_teller', 'bank_teller']
  },

  // LOAN PRODUCTS (Consolidated into single entry point)
  {
    id: 'loan_products',
    title: 'Loan Products',
    subtitle: 'All lending services in one place',
    icon: '💳',
    category: 'loans',
    requiredPermission: 'view_loan_applications',
    minPermissionLevel: 'write',
    priority: 3,
    rolesWithAccess: ['ceo', 'deputy_md', 'branch_manager', 'credit_manager', 'relationship_manager', 'loan_officer', 'customer_service', 'credit_analyst']
  },

  // OPERATIONS MANAGEMENT (Consolidated - Bill Payments moved to Money Transfer Operations)
  {
    id: 'operations_management',
    title: 'Operations Management',
    subtitle: 'Banking operations & compliance',
    icon: '⚙️',
    category: 'operations',
    requiredPermission: 'view_customer_accounts',
    minPermissionLevel: 'read',
    priority: 3,
    rolesWithAccess: ['ceo', 'deputy_md', 'branch_manager', 'operations_manager', 'compliance_officer', 'audit_officer', 'relationship_manager', 'customer_service', 'head_teller', 'bank_teller']
  },

  // MANAGEMENT & REPORTS (Consolidated into single entry point)
  {
    id: 'management_reports',
    title: 'Management & Reports',
    subtitle: 'Analytics, compliance & administration',
    icon: '📊',
    category: 'management',
    requiredPermission: 'bank_performance_dashboard',
    minPermissionLevel: 'read',
    priority: 7,
    rolesWithAccess: ['ceo', 'deputy_md', 'branch_manager', 'operations_manager', 'compliance_officer', 'audit_officer', 'credit_manager', 'it_administrator']
  },

  // PLATFORM ADMINISTRATION (Platform Admin only)
  {
    id: 'rbac_management',
    title: 'RBAC Management',
    subtitle: 'Roles & permissions admin',
    icon: '🛡️',
    category: 'platform',
    requiredPermission: 'platform_administration',
    minPermissionLevel: 'full',
    priority: 1,
    rolesWithAccess: ['platform_admin', 'ceo']
  },
  {
    id: 'tenant_management',
    title: 'Tenant Management',
    subtitle: 'Bank onboarding',
    icon: '🏛️',
    category: 'platform',
    requiredPermission: 'create_new_tenant',
    minPermissionLevel: 'full',
    priority: 2,
    rolesWithAccess: ['platform_admin']
  },
  {
    id: 'platform_analytics',
    title: 'Platform Analytics',
    subtitle: 'Cross-tenant insights',
    icon: '🌐',
    category: 'platform',
    requiredPermission: 'cross_tenant_analytics',
    minPermissionLevel: 'read',
    priority: 3,
    rolesWithAccess: ['platform_admin']
  },
  {
    id: 'system_health',
    title: 'System Health',
    subtitle: 'Platform monitoring',
    icon: '⚡',
    category: 'platform',
    requiredPermission: 'platform_system_health',
    minPermissionLevel: 'read',
    priority: 4,
    rolesWithAccess: ['platform_admin']
  }
];

// Permission checking utility
const hasPermission = (
  userPermissions: Record<string, string>,
  feature: string,
  requiredLevel: string
): boolean => {
  const userLevel = userPermissions[feature] || 'none';
  const levels = ['none', 'read', 'write', 'full'];
  const userLevelIndex = levels.indexOf(userLevel);
  const requiredLevelIndex = levels.indexOf(requiredLevel);

  return userLevelIndex >= requiredLevelIndex;
};

// Get category color and gradient
const getCategoryStyle = (category: string) => {
  const categoryStyles = {
    transfers: {
      backgroundColor: '#667eea',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderColor: '#5a6fd8'
    },
    savings: {
      backgroundColor: '#4facfe',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      borderColor: '#39a0fe'
    },
    loans: {
      backgroundColor: '#43e97b',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      borderColor: '#2dd867'
    },
    operations: {
      backgroundColor: '#f093fb',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      borderColor: '#ed7efa'
    },
    management: {
      backgroundColor: '#ffa726',
      gradient: 'linear-gradient(135deg, #ffa726 0%, #ff7043 100%)',
      borderColor: '#ff9800'
    },
    platform: {
      backgroundColor: '#9c27b0',
      gradient: 'linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)',
      borderColor: '#8e24aa'
    }
  };

  return categoryStyles[category] || categoryStyles.operations;
};

interface RoleBasedFeatureGridProps {
  userRole: string;
  userPermissions: Record<string, string>;
  availableFeatures: string[];
  onFeaturePress: (featureId: string, params?: any) => void;
  theme: any;
}

export const RoleBasedFeatureGrid: React.FC<RoleBasedFeatureGridProps> = ({
  userRole,
  userPermissions,
  availableFeatures,
  onFeaturePress,
  theme
}) => {
  // For development: admin@fmfb.com should have access to ALL features
  const isDevAdmin = userRole === 'admin' || userPermissions.platform_administration === 'full';

  // Filter features based on user role and permissions
  const accessibleFeatures = ALL_BANKING_FEATURES
    .filter(feature => {
      // ADMIN GETS EVERYTHING - no restrictions for development
      if (isDevAdmin) {
        return true;
      }

      // For other users, apply normal filtering
      const roleHasAccess = feature.rolesWithAccess.includes(userRole);
      const hasRequiredPermission = hasPermission(
        userPermissions,
        feature.requiredPermission,
        feature.minPermissionLevel
      );
      const isFeatureEnabled = availableFeatures.includes(feature.id);

      return roleHasAccess && hasRequiredPermission && isFeatureEnabled;
    })
    .sort((a, b) => a.priority - b.priority); // Sort by priority


  // Group features by category
  const featuresByCategory = accessibleFeatures.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, BankingFeature[]>);

  // Category display names and order
  const categoryOrder = ['platform', 'transfers', 'savings', 'loans', 'operations', 'management'];
  const categoryNames = {
    platform: 'Platform Administration',
    transfers: 'Transfer Operations',
    savings: 'Savings Products',
    loans: 'Loan Products',
    operations: 'Operations Management',
    management: 'Management & Reports'
  };

  if (accessibleFeatures.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.text }]}>
          No features available for your current role.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          🏦 Banking Operations
        </Text>
        <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
          {accessibleFeatures.length} features available for {userRole.replace('_', ' ')}
        </Text>
      </View>

      {categoryOrder.map(categoryKey => {
        const categoryFeatures = featuresByCategory[categoryKey];
        if (!categoryFeatures || categoryFeatures.length === 0) return null;

        const categoryStyle = getCategoryStyle(categoryKey);

        return (
          <View key={categoryKey} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryIndicator, { backgroundColor: categoryStyle.backgroundColor }]} />
              <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>
                {categoryNames[categoryKey]}
              </Text>
              <Text style={[styles.categoryCount, { color: theme.colors.textSecondary }]}>
                ({categoryFeatures.length})
              </Text>
            </View>

            <View style={styles.featuresGrid}>
              {categoryFeatures.map(feature => (
                <TouchableOpacity
                  key={feature.id}
                  style={[
                    styles.featureCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: categoryStyle.borderColor,
                      shadowColor: theme.colors.shadow || '#000'
                    }
                  ]}
                  onPress={() => onFeaturePress(feature.id)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.featureIcon,
                    { backgroundColor: categoryStyle.backgroundColor }
                  ]}>
                    <Text style={styles.featureIconText}>{feature.icon}</Text>
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={[styles.featureTitle, { color: theme.colors.text }]}>
                      {feature.title}
                    </Text>
                    <Text style={[styles.featureSubtitle, { color: theme.colors.textSecondary }]}>
                      {feature.subtitle}
                    </Text>

                    {/* Permission level indicator */}
                    <View style={styles.permissionIndicator}>
                      <View style={[
                        styles.permissionBadge,
                        { backgroundColor: getPermissionColor(
                          isDevAdmin ? 'full' : (userPermissions[feature.requiredPermission] || 'read')
                        ) }
                      ]}>
                        <Text style={styles.permissionText}>
                          {isDevAdmin ? 'FULL' : (userPermissions[feature.requiredPermission] || 'read').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      })}

      {/* Feature Summary */}
      <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>
          💡 Role Summary
        </Text>
        <Text style={[styles.summaryText, { color: theme.colors.textSecondary }]}>
          As a {userRole.replace('_', ' ')}, you have access to {accessibleFeatures.length} banking features
          across {Object.keys(featuresByCategory).length} categories. Your permissions enable full banking
          operations within your role's scope.
        </Text>
      </View>
    </View>
  );
};

// Get permission level color
const getPermissionColor = (level: string): string => {
  const colors = {
    read: '#3b82f6',    // Blue
    write: '#10b981',   // Green
    full: '#8b5cf6',    // Purple
    none: '#6b7280'     // Gray
  };
  return colors[level] || colors.read;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: 20,
  },
  headerSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    minWidth: 140,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureIconText: {
    fontSize: 20,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 8,
  },
  permissionIndicator: {
    alignItems: 'flex-start',
  },
  permissionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  permissionText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default RoleBasedFeatureGrid;