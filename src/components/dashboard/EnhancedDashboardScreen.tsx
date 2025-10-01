/**
 * Enhanced Dashboard Screen with RBAC Integration
 * Hybrid approach: Preserves existing AI Assistant + Adds comprehensive banking features
 * Role-based access control with Nigerian banking RBAC matrix
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  TextInput,
  Pressable,
  Modal,
  Image,
} from 'react-native';
import LinearGradient from '../common/LinearGradient';
import { useTenantTheme } from '../../context/TenantThemeContext';
import { useBankingAlert } from '../../services/AlertService';
import APIService from '../../services/api';
import { ENV_CONFIG, buildApiUrl } from '../../config/environment';
import { RoleBasedFeatureGrid } from './RoleBasedFeatureGrid';
import { ModernFeatureGrid } from './ModernFeatureGrid';
import { ModernQuickStats } from './ModernQuickStats';
import { BankingStatsGrid } from './BankingStatsGrid';
import AIAssistantPanel from './AIAssistantPanel';
import { RecentActivityPanel } from './RecentActivityPanel';
import { TransactionLimitsPanel } from './TransactionLimitsPanel';
import { ModernAIAssistant } from '../ai/ModernAIAssistant';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';

// Get responsive dimensions for cross-platform compatibility
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// User roles from RBAC matrix
export type UserRole =
  | 'platform_admin'
  | 'ceo'
  | 'deputy_md'
  | 'branch_manager'
  | 'operations_manager'
  | 'credit_manager'
  | 'compliance_officer'
  | 'audit_officer'
  | 'it_administrator'
  | 'relationship_manager'
  | 'loan_officer'
  | 'customer_service'
  | 'head_teller'
  | 'bank_teller'
  | 'credit_analyst';

// Permission levels from RBAC matrix
export type PermissionLevel = 'none' | 'read' | 'write' | 'full';

// Enhanced user context with RBAC
export interface EnhancedUserContext {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  permissions: Record<string, PermissionLevel>;
  tenantId: string;
  branchId?: string;
  department?: string;
  isActive: boolean;
  lastLogin: Date;
}

// Enhanced dashboard data interface
interface EnhancedDashboardData {
  // Existing data (preserved)
  balance: number;
  availableBalance: number;
  currency: string;
  monthlyStats: {
    transactions: number;
    recipients: number;
    volume: string;
  };
  transactionLimits: {
    daily: { limit: number; used: number; remaining: number; };
    monthly: { limit: number; used: number; remaining: number; };
  };
  recentTransactions: Transaction[];
  aiSuggestions: AISuggestion[];

  // New RBAC-enhanced data
  roleBasedMetrics: {
    customerCount?: number;
    loanApplications?: number;
    complianceAlerts?: number;
    systemHealth?: number;
    branchPerformance?: number;
    approvalQueue?: number;
  };
  availableFeatures: string[];
  restrictedFeatures: string[];
  approvalWorkflows: ApprovalWorkflow[];
}

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

interface AISuggestion {
  id: string;
  type: 'repeat' | 'bills' | 'budget' | 'compliance' | 'operations';
  icon: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  roleSpecific: UserRole[];
}

interface ApprovalWorkflow {
  id: string;
  type: string;
  amount: number;
  requiredApprovers: UserRole[];
  currentApprovals: string[];
  status: 'pending' | 'approved' | 'rejected';
}

// Responsive logo size configuration (preserved)
const LOGO_SIZE_BREAKPOINTS = [
  { name: 'small_mobile', maxWidth: 400, logoSize: 52, containerSize: 60 },
  { name: 'standard_mobile', maxWidth: 768, logoSize: 60, containerSize: 68 },
  { name: 'tablet_large_mobile', maxWidth: 1024, logoSize: 68, containerSize: 76 },
  { name: 'desktop_web', maxWidth: Infinity, logoSize: 72, containerSize: 80 }
];

const getResponsiveLogoSize = () => {
  const breakpoint = LOGO_SIZE_BREAKPOINTS.find(bp => screenWidth < bp.maxWidth);
  return breakpoint || LOGO_SIZE_BREAKPOINTS[LOGO_SIZE_BREAKPOINTS.length - 1];
};

// Time-based greeting (preserved)
const getTimeBasedGreeting = (): string => {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 5 && hour < 12) return 'Good morning';
  else if (hour >= 12 && hour < 17) return 'Good afternoon';
  else if (hour >= 17 && hour < 22) return 'Good evening';
  else return 'Good night';
};

// Role-based greeting customization
const getRoleBasedGreeting = (role: UserRole, fullName: string): string => {
  const greeting = getTimeBasedGreeting();
  const roleGreetings = {
    platform_admin: `${greeting}, Platform Administrator ${fullName}! 🏛️`,
    ceo: `${greeting}, CEO ${fullName}! 👑`,
    deputy_md: `${greeting}, Deputy MD ${fullName}! 🎯`,
    branch_manager: `${greeting}, Branch Manager ${fullName}! 🏦`,
    operations_manager: `${greeting}, Operations Manager ${fullName}! ⚙️`,
    credit_manager: `${greeting}, Credit Manager ${fullName}! 💰`,
    compliance_officer: `${greeting}, Compliance Officer ${fullName}! 🔍`,
    audit_officer: `${greeting}, Audit Officer ${fullName}! 📊`,
    it_administrator: `${greeting}, IT Administrator ${fullName}! 💻`,
    relationship_manager: `${greeting}, Relationship Manager ${fullName}! 🤝`,
    loan_officer: `${greeting}, Loan Officer ${fullName}! 💳`,
    customer_service: `${greeting}, Customer Service ${fullName}! 😊`,
    head_teller: `${greeting}, Head Teller ${fullName}! 💵`,
    bank_teller: `${greeting}, Teller ${fullName}! 💸`,
    credit_analyst: `${greeting}, Credit Analyst ${fullName}! 📈`
  };

  return roleGreetings[role] || `${greeting}, ${fullName}! 👋`;
};

// Permission checking utility
const hasPermission = (
  userPermissions: Record<string, PermissionLevel>,
  feature: string,
  requiredLevel: PermissionLevel = 'read'
): boolean => {
  const userLevel = userPermissions[feature] || 'none';
  const levels = ['none', 'read', 'write', 'full'];
  const userLevelIndex = levels.indexOf(userLevel);
  const requiredLevelIndex = levels.indexOf(requiredLevel);

  return userLevelIndex >= requiredLevelIndex;
};

// Mock permissions generator (TODO: Replace with actual API call)
const getMockPermissionsForRole = (role: string): Record<string, PermissionLevel> => {
  // Admin gets full access to everything
  if (role === 'admin' || role === 'platform_admin' || role === 'ceo') {
    return {
      // Transfers
      internal_transfers: 'full',
      external_transfers: 'full',
      international_transfers: 'full',
      bulk_transfers: 'full',
      scheduled_transfers: 'full',
      recurring_transfers: 'full',
      transfer_approvals: 'full',
      transfer_reversals: 'full',

      // Account Management
      view_customer_accounts: 'full',
      manage_customer_accounts: 'full',
      account_creation: 'full',
      account_closure: 'full',
      account_maintenance: 'full',
      account_statements: 'full',
      account_limits: 'full',
      joint_accounts: 'full',

      // Savings Products
      manage_savings_products: 'full',
      create_savings_accounts: 'full',
      savings_withdrawals: 'full',
      savings_deposits: 'full',
      fixed_deposits: 'full',
      recurring_deposits: 'full',
      savings_interest: 'full',
      savings_maturity: 'full',

      // Loan Products
      manage_loan_products: 'full',
      loan_applications: 'full',
      loan_approvals: 'full',
      loan_disbursements: 'full',
      loan_repayments: 'full',
      loan_restructuring: 'full',
      collateral_management: 'full',
      credit_scoring: 'full',

      // Operations
      transaction_monitoring: 'full',
      daily_operations: 'full',
      cash_management: 'full',
      vault_operations: 'full',
      inter_branch_operations: 'full',
      reconciliation: 'full',
      end_of_day: 'full',
      system_maintenance: 'full',

      // Management & Reporting
      view_financial_reports: 'full',
      generate_reports: 'full',
      view_branch_reports: 'full',
      performance_analytics: 'full',
      customer_analytics: 'full',
      risk_analytics: 'full',
      profitability_analysis: 'full',
      regulatory_reports: 'full',

      // User Management
      manage_users: 'full',
      assign_roles: 'full',
      user_permissions: 'full',
      user_audit: 'full',

      // Compliance & Audit
      compliance_monitoring: 'full',
      audit_trail: 'full',
      risk_management: 'full',
      fraud_monitoring: 'full',
      aml_screening: 'full',
      regulatory_reporting: 'full',
      incident_management: 'full',
      policy_management: 'full',

      // Platform Administration
      platform_administration: 'full',
      tenant_management: 'full',
      system_configuration: 'full',
      integration_management: 'full',

      // Additional Operations
      bill_payments: 'full',
      mobile_banking: 'full',
      notifications: 'full',
      customer_communication: 'full',
      document_management: 'full',
      workflow_management: 'full',
      approval_workflows: 'full'
    };
  }

  // Basic permissions for regular users (can be expanded based on specific roles)
  return {
    view_customer_accounts: 'read',
    internal_transfers: 'read',
    external_transfers: 'read',
    savings_deposits: 'read',
    savings_withdrawals: 'read',
    transaction_monitoring: 'read',
    daily_operations: 'read',
    bill_payments: 'write',
    mobile_banking: 'write',
    notifications: 'write',
    customer_communication: 'read'
  };
};

// Mock role-based metrics generator (TODO: Replace with actual API call)
const getMockRoleBasedMetrics = (role: string) => {
  const baseMetrics = {
    admin: [
      { label: 'Total Customers', value: '15,847', change: '+5.2%', changeType: 'positive', icon: '👥' },
      { label: 'Transaction Volume', value: '₦2.4B', change: '+12.8%', changeType: 'positive', icon: '💰' },
      { label: 'Active Accounts', value: '12,456', change: '+8.4%', changeType: 'positive', icon: '🏦' },
      { label: 'Loan Portfolio', value: '₦850M', change: '+15.6%', changeType: 'positive', icon: '📊' }
    ],
    ceo: [
      { label: 'Bank Performance', value: '94%', change: '+2.1%', changeType: 'positive', icon: '📈' },
      { label: 'Monthly Revenue', value: '₦45M', change: '+18.2%', changeType: 'positive', icon: '💎' },
      { label: 'Customer Growth', value: '847', change: '+12.5%', changeType: 'positive', icon: '🚀' },
      { label: 'Branch Network', value: '12', change: 'stable', changeType: 'neutral', icon: '🏪' }
    ]
  };

  return baseMetrics[role] || baseMetrics.admin;
};

// Mock available features generator (TODO: Replace with actual API call)
const getMockAvailableFeatures = (role: string, permissions: Record<string, string>) => {
  const features = {
    transfers: hasPermission(permissions, 'internal_transfers', 'read'),
    savings: hasPermission(permissions, 'manage_savings_products', 'read'),
    loans: hasPermission(permissions, 'manage_loan_products', 'read'),
    management: hasPermission(permissions, 'manage_users', 'read'),
    compliance: hasPermission(permissions, 'compliance_monitoring', 'read'),
    platform: hasPermission(permissions, 'platform_administration', 'read')
  };

  // Return in expected format with available and restricted arrays
  const available: string[] = [];
  const restricted: string[] = [];

  // Add all standard banking features for admin roles (matching exact IDs from RoleBasedFeatureGrid)
  if (role === 'admin' || role === 'platform_admin' || role === 'ceo') {
    available.push(
      // TRANSFERS
      'money_transfer', 'external_transfers', 'bulk_transfers', 'transfer_templates',
      // SAVINGS
      'flexible_savings', 'target_savings', 'locked_savings', 'group_savings', 'save_as_transact',
      // LOANS
      'personal_loans', 'business_loans', 'quick_loans', 'loan_approvals',
      // OPERATIONS
      'customer_onboarding', 'kyc_onboarding', 'transaction_management',
      // MANAGEMENT
      'user_management', 'compliance_reports', 'analytics_dashboard', 'audit_trails', 'fraud_detection',
      // PLATFORM
      'platform_management', 'system_settings'
    );
  } else {
    // Add basic features for other roles
    available.push('money_transfer', 'target_savings', 'flexible_savings', 'personal_loans');
    restricted.push('platform_management', 'system_settings', 'audit_trails', 'compliance_reports');
  }

  return {
    available,
    restricted
  };
};

// Mock role-specific AI suggestions generator (TODO: Replace with actual API call)
const getMockRoleSpecificAISuggestions = (role: string, permissions: Record<string, PermissionLevel>) => {
  const suggestions = [];

  if (role === 'admin' || role === 'platform_admin') {
    suggestions.push(
      {
        id: 'admin-1',
        type: 'platform',
        title: 'System Performance Review',
        description: 'Platform performance is optimal. Consider scaling resources for peak hours.',
        priority: 'medium',
        actionable: true
      },
      {
        id: 'admin-2',
        type: 'compliance',
        title: 'Compliance Dashboard Update',
        description: 'Monthly compliance reports are due. Review CBN regulatory requirements.',
        priority: 'high',
        actionable: true
      }
    );
  }

  if (role === 'customer_service' || role === 'relationship_manager') {
    suggestions.push(
      {
        id: 'cs-1',
        type: 'customer',
        title: 'High-Value Customer Follow-up',
        description: 'Contact customers with balances above ₦1M for premium service enrollment.',
        priority: 'medium',
        actionable: true
      }
    );
  }

  return suggestions;
};

// Mock pending approvals generator (TODO: Replace with actual API call)
const getMockPendingApprovals = (role: string) => {
  const approvals = [];

  if (role === 'admin' || role === 'branch_manager') {
    approvals.push(
      {
        id: 'approval-1',
        type: 'transfer',
        amount: 500000,
        currency: 'NGN',
        description: 'High-value transfer requiring approval',
        requestedBy: 'John Doe',
        requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        priority: 'high'
      },
      {
        id: 'approval-2',
        type: 'loan',
        amount: 2000000,
        currency: 'NGN',
        description: 'Business loan application',
        requestedBy: 'Jane Smith',
        requestedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        priority: 'medium'
      }
    );
  }

  return approvals;
};

export interface EnhancedDashboardScreenProps {
  // Existing props (preserved)
  onNavigateToTransfer?: () => void;
  onNavigateToHistory?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToTransactionDetails?: (transactionId: string, transaction?: any) => void;
  onNavigateToAIChat?: () => void;
  onLogout?: () => void;

  // New RBAC props
  onNavigateToFeature?: (feature: string, params?: any) => void;
  onApprovalAction?: (workflowId: string, action: 'approve' | 'reject') => void;
  onManageUsers?: () => void;
  onViewReports?: (reportType: string) => void;
  // Dashboard activity refresh handler
  onDashboardRefresh?: (refreshFunction: () => Promise<void>) => void;
}

export const EnhancedDashboardScreen: React.FC<EnhancedDashboardScreenProps> = ({
  // Existing handlers (preserved)
  onNavigateToTransfer,
  onNavigateToHistory,
  onNavigateToSettings,
  onNavigateToTransactionDetails,
  onNavigateToAIChat,
  onLogout,

  // New RBAC handlers
  onNavigateToFeature,
  onApprovalAction,
  onManageUsers,
  onViewReports,
  onDashboardRefresh,
}) => {
  const { theme: tenantTheme, tenantInfo } = useTenantTheme();
  const { showConfirm, showAlert } = useBankingAlert();

  // Get responsive logo dimensions (preserved)
  const { logoSize, containerSize } = getResponsiveLogoSize();

  // Enhanced state management
  const [dashboardData, setDashboardData] = useState<EnhancedDashboardData | null>(null);
  const [userContext, setUserContext] = useState<EnhancedUserContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount, setNotificationCount] = useState(3);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const userProfileRef = useRef<any>(null);

  // Activity refresh timestamp for detecting stale data
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());

  // Auto-refresh interval for recent activity
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load enhanced dashboard data with real RBAC API
  const loadEnhancedDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Load enhanced dashboard data with complete RBAC context from new API endpoint
      const [enhancedData, walletData, transactionsData, limitsData] = await Promise.all([
        APIService.getEnhancedDashboardData(),
        APIService.getWalletBalance(),
        APIService.getTransferHistory({ page: 1, limit: 5 }),
        APIService.getTransactionLimits(),
      ]);

      // Set user context from real API data
      setUserContext(enhancedData.userContext);

      // Process recent transactions (preserved logic)
      const recentTransactions: Transaction[] = transactionsData.transactions.slice(0, 4).map((tx: any) => {
        const transactionAmount = tx.direction === 'sent' ? -Math.abs(tx.amount) : Math.abs(tx.amount);

        return {
          id: tx.id,
          type: tx.direction === 'sent' ? 'sent' : 'received',
          title: tx.description || 'Money Transfer',
          subtitle: tx.recipient?.accountName ? `Bank Transfer • ${tx.recipient.accountName}` : 'Banking Transaction',
          amount: transactionAmount,
          time: new Date(tx.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          icon: tx.direction === 'sent' ? '↗️' : '↙️',
          originalTransaction: tx,
          requiresApproval: tx.amount > 1000000 && !tx.approved, // >1M Naira needs approval
          approvedBy: tx.approvedBy
        };
      });

      const enhancedDashboardData: EnhancedDashboardData = {
        // Existing data (preserved)
        balance: walletData.balance,
        availableBalance: walletData.availableBalance || walletData.balance || 0,
        currency: walletData.currency,
        monthlyStats: {
          transactions: transactionsData.pagination?.totalCount || transactionsData.transactions.length,
          recipients: new Set(transactionsData.transactions.map((tx: any) => tx.recipient_name).filter(Boolean)).size,
          volume: `${getCurrencySymbol(walletData.currency)}${(transactionsData.transactions.reduce((sum: number, tx: any) => sum + Math.abs(tx.amount || 0), 0) / 1000000).toFixed(1)}M`,
        },
        transactionLimits: limitsData?.limits ? {
          daily: {
            limit: limitsData.limits.dailyLimit || 0,
            used: limitsData.limits.dailySpent || 0,
            remaining: limitsData.limits.dailyRemaining || 0
          },
          monthly: {
            limit: limitsData.limits.monthlyLimit || 0,
            used: limitsData.limits.monthlySpent || 0,
            remaining: limitsData.limits.monthlyRemaining || 0
          }
        } : {
          daily: { limit: 0, used: 0, remaining: 0 },
          monthly: { limit: 0, used: 0, remaining: 0 }
        },
        recentTransactions,

        // Real RBAC-enhanced data from API
        aiSuggestions: enhancedData.aiSuggestions,
        roleBasedMetrics: enhancedData.roleBasedMetrics,
        availableFeatures: enhancedData.availableFeatures,
        restrictedFeatures: enhancedData.restrictedFeatures,
        approvalWorkflows: enhancedData.pendingApprovals
      };

      setDashboardData(enhancedDashboardData);
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Failed to load enhanced dashboard data:', error);
      showAlert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadEnhancedDashboardData();
  }, [loadEnhancedDashboardData]);

  // Expose refresh function to parent navigator
  useEffect(() => {
    if (onDashboardRefresh) {
      onDashboardRefresh(loadEnhancedDashboardData);
    }
  }, [onDashboardRefresh, loadEnhancedDashboardData]);

  // DISABLED: Auto-refresh was causing periodic reloads
  // The dashboard can still be manually refreshed by the user
  /*
  // Set up auto-refresh interval for recent activity (every 30 seconds)
  useEffect(() => {
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Set up new interval for auto-refresh
    refreshIntervalRef.current = setInterval(() => {
      // Only refresh if the data is older than 30 seconds
      const timeSinceRefresh = Date.now() - lastRefreshTime.getTime();
      if (timeSinceRefresh > 30000) { // 30 seconds
        loadEnhancedDashboardData();
      }
    }, 30000); // Check every 30 seconds

    // Clean up interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [lastRefreshTime, loadEnhancedDashboardData]);
  */

  // Refresh handler (preserved)
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadEnhancedDashboardData();
  }, [loadEnhancedDashboardData]);

  // Enhanced action handlers with RBAC
  const handleFeatureNavigation = useCallback((feature: string, params?: any) => {
    console.log('[handleFeatureNavigation] Called with feature:', feature);
    console.log('[handleFeatureNavigation] onNavigateToTransfer exists:', !!onNavigateToTransfer);
    console.log('[handleFeatureNavigation] onNavigateToFeature exists:', !!onNavigateToFeature);
    console.log('[handleFeatureNavigation] userContext role:', userContext?.role);
    console.log('[handleFeatureNavigation] availableFeatures:', dashboardData?.availableFeatures);

    if (!userContext || !dashboardData) return;

    // Check if user is admin (legacy role) - admins have full access
    const isLegacyAdmin = userContext.role === 'admin';

    // Check if user has permission for this feature (skip check for admins)
    if (!isLegacyAdmin && !dashboardData.availableFeatures.includes(feature)) {
      showAlert('Access Denied', `You don't have permission to access ${feature}. Contact your administrator if you need access.`);
      return;
    }

    // Route to appropriate handler
    // Only internal transfers and money_transfer should use the basic transfer screen
    const internalTransferFeatures = ['money_transfer', 'internal_transfers'];

    if (internalTransferFeatures.includes(feature)) {
      console.log('[handleFeatureNavigation] Internal transfer feature detected, using onNavigateToTransfer for:', feature);
      if (onNavigateToTransfer) {
        onNavigateToTransfer();
      } else {
        console.warn('[handleFeatureNavigation] onNavigateToTransfer is undefined!');
        // Fallback to onNavigateToFeature if available
        if (onNavigateToFeature) {
          console.log('[handleFeatureNavigation] Falling back to onNavigateToFeature');
          onNavigateToFeature(feature, params);
        }
      }
    } else if (onNavigateToFeature) {
      // All other features (external_transfers, bill_payments, savings, loans, etc.) should go through onNavigateToFeature
      console.log('[handleFeatureNavigation] Using onNavigateToFeature for feature:', feature);
      onNavigateToFeature(feature, params);
    } else {
      // Fallback to existing handlers
      console.log('[handleFeatureNavigation] Using fallback handlers for:', feature);
      switch (feature) {
        case 'transaction_history':
          onNavigateToHistory?.();
          break;
        case 'ai_assistant':
          onNavigateToAIChat?.();
          break;
        case 'rbac_management':
          // This should now be handled by onNavigateToFeature from AppNavigator
          // If we reach here as a fallback, show a helpful message
          showAlert('Navigation Error', 'RBAC Management navigation is not configured. Please check your setup.');
          break;
        default:
          showAlert('Feature Coming Soon', `${feature} will be available in the next update.`);
      }
    }
  }, [userContext, dashboardData, onNavigateToFeature, onNavigateToTransfer, onNavigateToHistory, onNavigateToAIChat, showAlert]);

  // User menu handler (preserved but enhanced)
  const handleUserMenuToggle = useCallback(() => {
    if (!showUserDropdown && userProfileRef.current) {
      userProfileRef.current.measure((fx, fy, width, height, px, py) => {
        setDropdownPosition({
          x: px + width - 180,
          y: py + height + 5
        });
        setShowUserDropdown(true);
      });
    } else {
      setShowUserDropdown(false);
    }
  }, [showUserDropdown]);

  // Enhanced notification handler
  const handleNotifications = useCallback(() => {
    if (!userContext) return;

    const roleSpecificNotifications = {
      platform_admin: 'System notifications, tenant updates, billing alerts',
      ceo: 'Board reports, regulatory updates, performance alerts',
      branch_manager: 'Branch performance, staff updates, customer complaints',
      credit_manager: 'Loan approvals, risk alerts, portfolio updates',
      compliance_officer: 'Regulatory changes, audit findings, compliance alerts',
      default: 'General banking notifications and updates'
    };

    const notification = roleSpecificNotifications[userContext.role] || roleSpecificNotifications.default;

    showAlert(
      `Notifications - ${userContext.role.replace('_', ' ').toUpperCase()}`,
      `• ${notification}\n• Recent activity updates\n• System announcements`
    );
    setNotificationCount(0);
  }, [userContext, showAlert]);

  // Loading state (preserved)
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading your banking dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // No user context - should not happen but good fallback
  if (!userContext || !dashboardData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Failed to load user context. Please refresh.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tenantTheme.colors.background,
    },
    header: {
      backgroundColor: '#ffffff',
      paddingHorizontal: tenantTheme.layout.spacing,
      paddingTop: tenantTheme.layout.spacing,
      paddingBottom: tenantTheme.layout.spacing,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 4,
      overflow: 'visible',
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      overflow: 'visible',
    },
    logoSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 15,
    },
    tenantLogo: {
      width: containerSize,
      height: containerSize,
      backgroundColor: tenantTheme.colors.primary,
      borderRadius: containerSize / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoText: {
      color: '#ffffff',
      fontSize: Math.max(16, containerSize * 0.3),
      fontWeight: 'bold',
    },
    logoInfo: {
      flex: 1,
    },
    logoTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 2,
    },
    logoSubtitle: {
      fontSize: 12,
      color: '#666',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 15,
    },
    searchBox: {
      position: 'relative',
      minWidth: 150,
      maxWidth: 200,
      flex: 1,
    },
    searchInput: {
      paddingHorizontal: tenantTheme.layout.spacing,
      paddingVertical: 8,
      borderWidth: 2,
      borderColor: '#e1e5e9',
      borderRadius: 25,
      backgroundColor: '#f8fafc',
      fontSize: 14,
    },
    notificationButton: {
      position: 'relative',
      padding: 8,
    },
    notificationBadge: {
      position: 'absolute',
      top: 5,
      right: 5,
      backgroundColor: tenantTheme.colors.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    userProfile: {
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    userAvatar: {
      width: 40,
      height: 40,
      backgroundColor: tenantTheme.colors.secondary,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: 'bold',
    },
    roleBadge: {
      backgroundColor: tenantTheme.colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      marginTop: 2,
    },
    roleBadgeText: {
      color: '#ffffff',
      fontSize: 10,
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },
    welcomeSection: {
      backgroundColor: tenantTheme.colors.primary,
      paddingHorizontal: tenantTheme.layout.spacing,
      paddingVertical: 24,
      position: 'relative',
      overflow: 'hidden',
    },
    welcomeContent: {
      position: 'relative',
      zIndex: 2,
    },
    welcomeText: {
      marginBottom: tenantTheme.layout.spacing,
    },
    welcomeTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 8,
    },
    welcomeSubtitle: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.9)',
      marginBottom: tenantTheme.layout.spacing,
    },
    balanceDisplay: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      padding: tenantTheme.layout.spacing,
      borderRadius: 20,
      marginTop: tenantTheme.layout.spacing,
    },
    balanceLabel: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: 4,
    },
    balanceAmount: {
      fontSize: 36,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: tenantTheme.layout.spacing,
    },
    balanceActions: {
      flexDirection: 'row',
      gap: 15,
      flexWrap: 'wrap',
    },
    balanceAction: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: tenantTheme.layout.spacing,
      paddingVertical: 8,
      borderRadius: 25,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    balanceActionText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '500',
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Enhanced Header with Role Display */}
      <View style={dynamicStyles.header}>
        <View style={dynamicStyles.headerContent}>
          <View style={dynamicStyles.logoSection}>
            <View style={[
              dynamicStyles.tenantLogo,
              tenantInfo?.id === 'fmfb' && { backgroundColor: '#FFFFFF' }
            ]}>
              {tenantInfo?.id === 'fmfb' ? (
                <Image
                  source={{ uri: buildApiUrl('tenants/by-name/fmfb/assets/logo/default') }}
                  style={{
                    width: logoSize,
                    height: logoSize,
                    borderRadius: logoSize / 2,
                  }}
                  resizeMode="contain"
                  onError={() => console.log('Failed to load FMFB logo in dashboard, falling back to initials')}
                />
              ) : (
                <Text style={dynamicStyles.logoText}>
                  {tenantInfo?.name?.substring(0, 2).toUpperCase() || 'OP'}
                </Text>
              )}
            </View>
            <View style={dynamicStyles.logoInfo}>
              <Text style={dynamicStyles.logoTitle}>
                {tenantInfo?.displayName || 'OrokiiPay'}
              </Text>
              <Text style={dynamicStyles.logoSubtitle}>Secure Banking Platform</Text>
            </View>
          </View>

          <View style={dynamicStyles.headerActions}>
            <View style={dynamicStyles.searchBox}>
              <TextInput
                style={dynamicStyles.searchInput}
                placeholder="Search banking features..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity
              style={dynamicStyles.notificationButton}
              onPress={handleNotifications}
            >
              <Text style={{ fontSize: 24 }}>🔔</Text>
              {notificationCount > 0 && (
                <View style={dynamicStyles.notificationBadge}>
                  <Text style={dynamicStyles.badgeText}>{notificationCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              ref={userProfileRef}
              style={dynamicStyles.userProfile}
              onPress={handleUserMenuToggle}
            >
              <View>
                <View style={dynamicStyles.userAvatar}>
                  <Text style={dynamicStyles.avatarText}>
                    {userContext.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                  </Text>
                </View>
                <View style={dynamicStyles.roleBadge}>
                  <Text style={dynamicStyles.roleBadgeText}>
                    {userContext.role.replace('_', ' ')}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Enhanced Welcome Section with Role-Based Greeting */}
        <View style={dynamicStyles.welcomeSection}>
          <View style={dynamicStyles.welcomeContent}>
            <View style={dynamicStyles.welcomeText}>
              <Text style={dynamicStyles.welcomeTitle}>
                {getRoleBasedGreeting(userContext.role, userContext.fullName.split(' ')[0])}
              </Text>
              <Text style={dynamicStyles.welcomeSubtitle}>
                Your comprehensive banking platform with AI assistance is ready.
              </Text>
            </View>

            <View style={dynamicStyles.balanceDisplay}>
              <Text style={dynamicStyles.balanceLabel}>Available Balance</Text>
              <Text style={dynamicStyles.balanceAmount}>
                {formatCurrency(dashboardData.availableBalance || 0, tenantTheme.currency, { locale: tenantTheme.locale })}
              </Text>
              <View style={dynamicStyles.balanceActions}>
                <TouchableOpacity
                  style={dynamicStyles.balanceAction}
                  onPress={() => handleFeatureNavigation('money_transfer')}
                >
                  <Text style={dynamicStyles.balanceActionText}>💸 Transfer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={dynamicStyles.balanceAction}
                  onPress={() => handleFeatureNavigation('transaction_history')}
                >
                  <Text style={dynamicStyles.balanceActionText}>📈 History</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={dynamicStyles.balanceAction}
                  onPress={handleRefresh}
                >
                  <Text style={dynamicStyles.balanceActionText}>🔄 Refresh</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Modern Quick Stats Section */}
        <ModernQuickStats
          balance={dashboardData.balance}
          availableBalance={dashboardData.availableBalance}
          monthlyTransactions={dashboardData.monthlyStats.transactions}
          currency={dashboardData.currency}
        />

        {/* Enhanced Banking Stats Grid with Role-Based Metrics */}
        <BankingStatsGrid
          userRole={userContext.role}
          userPermissions={userContext.permissions}
          monthlyStats={dashboardData.monthlyStats}
          roleBasedMetrics={dashboardData.roleBasedMetrics}
          onNavigateToFeature={handleFeatureNavigation}
        />

        {/* Transaction Limits Panel (Preserved) */}
        <TransactionLimitsPanel
          userRole={userContext.role}
          userPermissions={userContext.permissions}
          onLimitPress={(limitType) => console.log('Limit pressed:', limitType)}
          onRequestIncrease={(limitType) => console.log('Request increase:', limitType)}
        />

        <View style={{ paddingHorizontal: tenantTheme.layout.spacing, gap: tenantTheme.layout.spacing }}>
          {/* Modern Feature Grid with Glassmorphism */}
          <ModernFeatureGrid
            userRole={userContext.role}
            userPermissions={userContext.permissions}
            availableFeatures={dashboardData.availableFeatures}
            onFeaturePress={handleFeatureNavigation}
          />

          {/* AI Assistant Panel (Preserved but Enhanced) */}
          <AIAssistantPanel
            aiSuggestions={dashboardData.aiSuggestions}
            userRole={userContext.role}
            onNavigateToAIChat={onNavigateToAIChat}
            onSuggestionPress={handleFeatureNavigation}
          />

          {/* Recent Activity Panel (Enhanced) */}
          <RecentActivityPanel
            recentTransactions={dashboardData.recentTransactions}
            userRole={userContext.role}
            userPermissions={userContext.permissions}
            onTransactionPress={onNavigateToTransactionDetails}
            onViewAllPress={() => handleFeatureNavigation('transaction_history')}
            theme={tenantTheme}
          />
        </View>
      </ScrollView>

      {/* Modern AI Assistant */}
      <ModernAIAssistant
        isVisible={true}
        onToggle={() => {}}
        onSendMessage={async (message: string) => {
          // This will be enhanced with actual AI service integration
          return `Thank you for your message: "${message}". Our AI assistant is processing your request and will provide intelligent banking insights based on your role as ${userContext.role}.`;
        }}
      />

      {/* Enhanced User Dropdown Modal */}
      <Modal
        visible={showUserDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUserDropdown(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
          }}
          onPress={() => setShowUserDropdown(false)}
        >
          <View
            style={{
              position: 'absolute',
              top: dropdownPosition.y,
              left: dropdownPosition.x,
              width: 200,
              backgroundColor: '#ffffff',
              borderRadius: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
              zIndex: 9999,
              borderWidth: 1,
              borderColor: '#e1e5e9',
            }}
          >
            {/* User Info Section */}
            <View style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#f1f5f9',
            }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#333' }}>
                {userContext.fullName}
              </Text>
              <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                {userContext.role.replace('_', ' ').toUpperCase()}
              </Text>
              <Text style={{ fontSize: 11, color: '#999', marginTop: 1 }}>
                {userContext.department || tenantInfo?.displayName}
              </Text>
            </View>

            {/* Profile Action */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#f1f5f9',
              }}
              onPress={() => {
                setShowUserDropdown(false);
                handleFeatureNavigation('user_profile');
              }}
            >
              <Text style={{ marginRight: 12, fontSize: 16 }}>👤</Text>
              <Text style={{ fontSize: 14, color: '#333', fontWeight: '500' }}>My Profile</Text>
            </TouchableOpacity>

            {/* Settings Action */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#f1f5f9',
              }}
              onPress={() => {
                setShowUserDropdown(false);
                onNavigateToSettings?.();
              }}
            >
              <Text style={{ marginRight: 12, fontSize: 16 }}>⚙️</Text>
              <Text style={{ fontSize: 14, color: '#333', fontWeight: '500' }}>Settings</Text>
            </TouchableOpacity>

            {/* Role-Specific Quick Actions */}
            {(userContext.role === 'branch_manager' || userContext.role === 'operations_manager') && (
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#f1f5f9',
                }}
                onPress={() => {
                  setShowUserDropdown(false);
                  onManageUsers?.();
                }}
              >
                <Text style={{ marginRight: 12, fontSize: 16 }}>👥</Text>
                <Text style={{ fontSize: 14, color: '#333', fontWeight: '500' }}>Manage Users</Text>
              </TouchableOpacity>
            )}

            {/* Logout Action */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
              onPress={() => {
                setShowUserDropdown(false);
                onLogout?.();
              }}
            >
              <Text style={{ marginRight: 12, fontSize: 16 }}>🚪</Text>
              <Text style={{ fontSize: 14, color: '#ef4444', fontWeight: '500' }}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default EnhancedDashboardScreen;