/**
 * Modern Dashboard Screen Wrapper
 * Uses the new ModernDashboardWithAI component that matches the mockup
 * Now with dynamic user data instead of hardcoded values
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTenantTheme } from '../../context/TenantThemeContext';
import ModernDashboardWithAI from '../../components/dashboard/ModernDashboardWithAI';
import { SkeletonDashboard } from '../../components/ui/SkeletonLoader';
import Typography from '../../components/ui/Typography';
import APIService from '../../services/api';

export interface ModernDashboardScreenProps {
  navigation?: any;
  route?: any;
  onNavigateToTransfer?: () => void;
  onNavigateToHistory?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToTransactionDetails?: (transactionId: string, transaction?: any) => void;
  onNavigateToAIChat?: () => void;
  onLogout?: () => void;
  onNavigateToFeature?: (feature: string, params?: any) => void;
  onDashboardRefresh?: (refreshFunction: () => Promise<void>) => void;
}

const ModernDashboardScreen: React.FC<ModernDashboardScreenProps> = ({
  onNavigateToTransfer,
  onNavigateToHistory,
  onNavigateToSettings,
  onNavigateToTransactionDetails,
  onNavigateToAIChat,
  onLogout,
  onNavigateToFeature,
  onDashboardRefresh,
}) => {
  const { theme } = useTenantTheme();
  const [userContext, setUserContext] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    loadUserData();
    loadDashboardData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await APIService.getCurrentUser();

      if (user) {
        // Fetch user permissions if available
        const permissionsData = await APIService.getUserPermissions().catch(() => ({
          permissions: {}
        }));

        setUserContext({
          id: user.id,
          email: user.email,
          firstName: user.firstName || 'User',
          lastName: user.lastName || '',
          role: user.role || 'user',
          tenantId: user.tenant?.id || '',
          permissions: permissionsData.permissions || {
            'view_account_balance': 'read',
            'internal_transfers': 'write',
            'view_transaction_history': 'read',
            'access_ai_chat': 'write'
          }
        });
      } else {
        // Fallback to guest user context if no user data available
        setUserContext({
          id: 'guest-user',
          email: 'guest@example.com',
          firstName: 'Guest',
          lastName: 'User',
          role: 'user',
          tenantId: 'default',
          permissions: {
            'view_account_balance': 'read',
            'view_transaction_history': 'read',
            'access_ai_chat': 'read'
          }
        });
      }
    } catch (error) {
      // Error loading user data, use fallback
      setUserContext({
        id: 'guest-user',
        email: 'guest@example.com',
        firstName: 'Guest',
        lastName: 'User',
        role: 'user',
        tenantId: 'default',
        permissions: {
          'view_account_balance': 'read',
          'view_transaction_history': 'read',
          'access_ai_chat': 'read'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Fetch real dashboard data from API - NO FALLBACKS for financial data
      const [walletData, transactionsData] = await Promise.all([
        APIService.getWalletBalance(),
        APIService.getTransferHistory({ page: 1, limit: 5 })
      ]);

      // Use only real data - never fallback to mock financial data
      const balance = walletData.balance;
      const accountNumber = walletData.walletNumber;
      const transactions = transactionsData.transactions || [];

      setDashboardData({
        totalBalance: parseFloat(balance),
        accountNumber: accountNumber,
        currency: walletData.currency || 'NGN',
        recentTransactions: transactions.slice(0, 5).map((t: any) => ({
          id: t.id,
          amount: parseFloat(t.amount),
          description: t.description || t.narration || 'Transaction',
          date: t.transaction_date || t.createdAt || t.created_at,
          type: t.direction === 'sent' ? 'withdrawal' : 'deposit',
          created_at: t.createdAt || t.created_at
        })),
        availableFeatures: ['transfers', 'bill_payments', 'savings', 'loans'],
        monthlySpending: 0, // Calculate from real data
        savingsGoal: 0, // Get from user settings
        currentSavings: 0 // Calculate from real data
      });
    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error);
      // DO NOT use fallback financial data - set null to show error state
      setDashboardData(null);
    }
  };

  // Handle feature navigation
  const handleFeatureNavigation = (feature: string, params?: any) => {
    if (feature === 'rewards') {
      // Navigate to rewards screen
      if (onNavigateToFeature) {
        onNavigateToFeature('rewards', params);
      }
    } else if (onNavigateToFeature) {
      onNavigateToFeature(feature, params);
    }
  };

  // Handle transaction details navigation
  const handleTransactionDetails = (transactionId: string) => {
    const transaction = dashboardData?.recentTransactions.find((t: any) => t.id === transactionId);
    if (onNavigateToTransactionDetails) {
      onNavigateToTransactionDetails(transactionId, transaction);
    }
  };

  // Handle AI assistant interaction
  const handleAIAssistantPress = () => {
    if (onNavigateToAIChat) {
      onNavigateToAIChat();
    }
  };

  if (isLoading || !userContext) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <SkeletonDashboard />
      </View>
    );
  }

  if (!dashboardData) {
    return (
      <View style={[styles.container, styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={{ fontSize: 60, marginBottom: 24 }}>🔌</Text>
        <Typography.HeadlineMedium color={theme.colors.danger} style={{ marginBottom: 16, textAlign: 'center' }}>
          Unable to Load Account Data
        </Typography.HeadlineMedium>
        <Typography.BodyMedium style={{ marginBottom: 12, textAlign: 'center', lineHeight: 24 }}>
          We couldn't retrieve your account information at the moment. Please check your connection and try again.
        </Typography.BodyMedium>
        <Typography.Caption style={{ fontStyle: 'italic', textAlign: 'center', lineHeight: 20 }}>
          For security reasons, we don't display fallback financial data.
        </Typography.Caption>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernDashboardWithAI
        userContext={userContext}
        dashboardData={dashboardData}
        onNavigateToTransactionDetails={handleTransactionDetails}
        onFeatureNavigation={handleFeatureNavigation}
        onAIAssistantPress={handleAIAssistantPress}
        onLogout={onLogout}
        onSettings={onNavigateToSettings}
        theme={theme}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorNote: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ModernDashboardScreen;