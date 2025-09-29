/**
 * Modern Feature Grid Component with Glassmorphism
 * Implements modern design patterns from the approved HTML mockup
 * Features: Glassmorphism, gradients, animations, and smooth transitions
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import LinearGradient from '../common/LinearGradient';
import { useTenantTheme } from '../../context/TenantThemeContext';

// Feature definitions (same as before but with modern styling)
interface BankingFeature {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  category: 'transfers' | 'savings' | 'loans' | 'operations' | 'management' | 'platform';
  requiredPermission: string;
  minPermissionLevel: 'read' | 'write' | 'full';
  priority: number;
  rolesWithAccess: string[];
}

// Consolidated banking features
const MODERN_BANKING_FEATURES: BankingFeature[] = [
  {
    id: 'money_transfer',
    title: 'Money Transfer',
    subtitle: 'Send & receive money',
    icon: '💸',
    category: 'transfers',
    requiredPermission: 'internal_transfers',
    minPermissionLevel: 'write',
    priority: 1,
    rolesWithAccess: ['ceo', 'deputy_md', 'branch_manager', 'operations_manager', 'relationship_manager', 'loan_officer', 'customer_service', 'head_teller', 'bank_teller']
  },
  {
    id: 'savings_products',
    title: 'Savings',
    subtitle: 'Grow your money',
    icon: '💰',
    category: 'savings',
    requiredPermission: 'view_savings_accounts',
    minPermissionLevel: 'write',
    priority: 2,
    rolesWithAccess: ['ceo', 'deputy_md', 'branch_manager', 'operations_manager', 'credit_manager', 'relationship_manager', 'loan_officer', 'customer_service', 'head_teller', 'bank_teller']
  },
  {
    id: 'loan_products',
    title: 'Loans',
    subtitle: 'Quick credit access',
    icon: '💳',
    category: 'loans',
    requiredPermission: 'view_loan_applications',
    minPermissionLevel: 'write',
    priority: 3,
    rolesWithAccess: ['ceo', 'deputy_md', 'branch_manager', 'credit_manager', 'relationship_manager', 'loan_officer', 'customer_service', 'credit_analyst']
  },
  {
    id: 'operations_management',
    title: 'Operations',
    subtitle: 'Banking operations',
    icon: '⚙️',
    category: 'operations',
    requiredPermission: 'view_customer_accounts',
    minPermissionLevel: 'read',
    priority: 4,
    rolesWithAccess: ['ceo', 'deputy_md', 'branch_manager', 'operations_manager', 'compliance_officer', 'audit_officer', 'relationship_manager', 'customer_service', 'head_teller', 'bank_teller']
  },
  {
    id: 'management_reports',
    title: 'Reports',
    subtitle: 'Analytics & insights',
    icon: '📊',
    category: 'management',
    requiredPermission: 'bank_performance_dashboard',
    minPermissionLevel: 'read',
    priority: 5,
    rolesWithAccess: ['ceo', 'deputy_md', 'branch_manager', 'operations_manager', 'compliance_officer', 'audit_officer', 'credit_manager', 'it_administrator']
  },
  {
    id: 'rbac_management',
    title: 'RBAC Admin',
    subtitle: 'Manage permissions',
    icon: '🛡️',
    category: 'platform',
    requiredPermission: 'platform_administration',
    minPermissionLevel: 'full',
    priority: 6,
    rolesWithAccess: ['platform_admin', 'ceo']
  },
];

// Get gradient colors for each category using dynamic theme
const getCategoryGradient = (category: string, theme: any): string[] => {
  const baseGradients = {
    transfers: [theme.colors.primaryGradientStart, theme.colors.primaryGradientEnd],
    savings: [theme.colors.secondary, theme.colors.accent],
    loans: ['#43e97b', '#38f9d7'],
    operations: ['#f093fb', '#f5576c'],
    management: ['#ffa726', '#ff7043'],
    platform: [theme.colors.primaryGradientStart, theme.colors.primaryGradientEnd]
  };
  return baseGradients[category] || baseGradients.operations;
};

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

interface ModernFeatureGridProps {
  userRole: string;
  userPermissions: Record<string, string>;
  availableFeatures: string[];
  onFeaturePress: (featureId: string, params?: any) => void;
}

export const ModernFeatureGrid: React.FC<ModernFeatureGridProps> = ({
  userRole,
  userPermissions,
  availableFeatures,
  onFeaturePress,
}) => {
  const { theme, tenantInfo } = useTenantTheme();
  const isDevAdmin = userRole === 'admin' || userPermissions.platform_administration === 'full';

  // Filter features based on permissions
  const accessibleFeatures = MODERN_BANKING_FEATURES
    .filter(feature => {
      if (isDevAdmin) return true;

      const roleHasAccess = feature.rolesWithAccess.includes(userRole);
      const hasRequiredPermission = hasPermission(
        userPermissions,
        feature.requiredPermission,
        feature.minPermissionLevel
      );
      const isFeatureEnabled = availableFeatures.includes(feature.id);

      return roleHasAccess && hasRequiredPermission && isFeatureEnabled;
    })
    .sort((a, b) => a.priority - b.priority);

  const animatedValues = React.useRef(
    accessibleFeatures.map(() => new Animated.Value(0))
  ).current;

  React.useEffect(() => {
    // Animate cards on mount with staggered effect
    const animations = animatedValues.map((animValue, index) =>
      Animated.timing(animValue, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      })
    );
    Animated.parallel(animations).start();
  }, []);

  const handlePressIn = (index: number) => {
    Animated.spring(animatedValues[index], {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (index: number) => {
    Animated.spring(animatedValues[index], {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const dynamicStyles = getDynamicStyles(theme);

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.sectionTitle}>
          Quick Actions
        </Text>
        <Text style={dynamicStyles.sectionSubtitle}>
          Access your banking services
        </Text>
      </View>

      <View style={dynamicStyles.grid}>
        {accessibleFeatures.map((feature, index) => {
          const gradientColors = getCategoryGradient(feature.category, theme);

          return (
            <Animated.View
              key={feature.id}
              style={[
                dynamicStyles.cardWrapper,
                {
                  opacity: animatedValues[index],
                  transform: [
                    {
                      translateY: animatedValues[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                    { scale: animatedValues[index] },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={[dynamicStyles.modernCard, Platform.OS === 'web' && dynamicStyles.webHover]}
                onPress={() => onFeaturePress(feature.id)}
                onPressIn={() => handlePressIn(index)}
                onPressOut={() => handlePressOut(index)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[...gradientColors, gradientColors[1] + '20']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={dynamicStyles.gradientOverlay}
                />

                <View style={dynamicStyles.cardContent}>
                  <View style={[dynamicStyles.iconContainer, { backgroundColor: gradientColors[0] + '20' }]}>
                    <Text style={dynamicStyles.icon}>{feature.icon}</Text>
                  </View>

                  <View style={dynamicStyles.textContent}>
                    <Text style={dynamicStyles.title}>
                      {feature.title}
                    </Text>
                    <Text style={dynamicStyles.subtitle}>
                      {feature.subtitle}
                    </Text>
                  </View>

                  <View style={dynamicStyles.arrowContainer}>
                    <Text style={[dynamicStyles.arrow, { color: gradientColors[0] }]}>→</Text>
                  </View>
                </View>

                {/* Permission indicator */}
                <View style={[dynamicStyles.permissionBadge, { backgroundColor: gradientColors[0] + '15' }]}>
                  <Text style={[dynamicStyles.permissionText, { color: gradientColors[0] }]}>
                    {isDevAdmin ? 'FULL' : (userPermissions[feature.requiredPermission] || 'READ').toUpperCase()}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {accessibleFeatures.length === 0 && (
        <View style={dynamicStyles.emptyState}>
          <Text style={dynamicStyles.emptyIcon}>🔒</Text>
          <Text style={dynamicStyles.emptyText}>
            No features available for your current role
          </Text>
        </View>
      )}
    </View>
  );
};

const getDynamicStyles = (theme: any) => StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  header: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.colors.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    color: theme.colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  cardWrapper: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  modernCard: {
    borderRadius: theme.layout.borderRadiusLarge,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  webHover: Platform.select({
    web: {
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      ':hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 12px 24px ${theme.colors.text}15`,
      },
    } as any,
    default: {},
  }),
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.08,
  },
  cardContent: {
    padding: 20,
    flexDirection: 'column',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: theme.colors.glassBackground,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  icon: {
    fontSize: 24,
  },
  textContent: {
    flex: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.7,
    lineHeight: 16,
    color: theme.colors.textSecondary,
  },
  arrowContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  arrow: {
    fontSize: 20,
    fontWeight: 'bold',
    opacity: 0.5,
  },
  permissionBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  permissionText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
});

export default ModernFeatureGrid;