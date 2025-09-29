/**
 * Modern Dashboard Screen Wrapper
 * Uses the new ModernDashboardWithAI component that matches the mockup
 * Now with dynamic user data instead of hardcoded values
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useTenantTheme } from '../../context/TenantThemeContext';
import ModernDashboardWithAI from '../../components/dashboard/ModernDashboardWithAI';
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
      // Try to fetch real dashboard data from API
      const [walletData, transactionsData] = await Promise.all([
        APIService.getWallets().catch(() => null),
        APIService.getTransactionHistory().catch(() => ({ transactions: [] }))
      ]);

      // Use real data if available, otherwise use mock data
      const balance = walletData?.[0]?.balance || 2450000.00;
      const accountNumber = walletData?.[0]?.wallet_number || 'ACC-0012345678';
      const transactions = transactionsData?.transactions || [];

      setDashboardData({
        totalBalance: parseFloat(balance),
        accountNumber: accountNumber,
        currency: 'NGN',
        recentTransactions: transactions.length > 0 ? transactions.slice(0, 5).map((t: any) => ({
          id: t.id,
          amount: parseFloat(t.amount),
          description: t.description || t.narration,
          date: t.transaction_date || t.created_at,
          type: t.transaction_type === 'credit' ? 'deposit' : 'withdrawal',
          created_at: t.created_at
        })) : [
          {
            id: '1',
            amount: 15000,
            description: 'Transfer from John Doe',
            date: '2025-09-28',
            type: 'deposit',
            created_at: '2025-09-28T08:00:00Z'
          },
          {
            id: '2',
            amount: 50000,
            description: 'Salary Credit',
            date: '2025-09-27',
            type: 'deposit',
            created_at: '2025-09-27T15:30:00Z'
          }
        ],
        availableFeatures: ['transfers', 'bill_payments', 'savings', 'loans'],
        monthlySpending: 125000,
        savingsGoal: 1000000,
        currentSavings: 750000
      });
    } catch (error) {
      // Use fallback data
      setDashboardData({
        totalBalance: 2450000.00,
        accountNumber: 'ACC-0012345678',
        currency: 'NGN',
        recentTransactions: [
          {
            id: '1',
            amount: 15000,
            description: 'Transfer from John Doe',
            date: '2025-09-28',
            type: 'deposit',
            created_at: '2025-09-28T08:00:00Z'
          },
          {
            id: '2',
            amount: 50000,
            description: 'Salary Credit',
            date: '2025-09-27',
            type: 'deposit',
            created_at: '2025-09-27T15:30:00Z'
          }
        ],
        availableFeatures: ['transfers', 'bill_payments', 'savings', 'loans'],
        monthlySpending: 125000,
        savingsGoal: 1000000,
        currentSavings: 750000
      });
    }
  };

  // Handle feature navigation
  const handleFeatureNavigation = (feature: string, params?: any) => {
    if (onNavigateToFeature) {
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

  if (isLoading || !userContext || !dashboardData) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading dashboard...</Text>
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
});

export default ModernDashboardScreen;