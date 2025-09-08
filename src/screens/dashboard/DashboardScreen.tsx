/**
 * Dashboard Screen Component
 * Main dashboard with balance, quick actions, AI assistant, and recent transactions
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Dimensions,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useTenant, useTenantTheme } from '@/tenants/TenantContext';
import APIService from '@/services/api';

const { width: screenWidth } = Dimensions.get('window');

interface DashboardData {
  balance: number;
  availableBalance: number;
  currency: string;
  monthlyStats: {
    transactions: number;
    recipients: number;
    volume: string;
  };
  recentTransactions: Transaction[];
  aiSuggestions: AISuggestion[];
}

interface Transaction {
  id: string;
  type: 'sent' | 'received' | 'pending';
  title: string;
  subtitle: string;
  amount: number;
  time: string;
  icon: string;
}

interface AISuggestion {
  id: string;
  type: 'repeat' | 'bills' | 'budget';
  icon: string;
  title: string;
  description: string;
}

interface DashboardScreenProps {
  onNavigateToTransfer?: () => void;
  onNavigateToHistory?: () => void;
  onNavigateToSettings?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToTransfer,
  onNavigateToHistory,
  onNavigateToSettings,
}) => {
  const { currentTenant } = useTenant();
  const theme = useTenantTheme();
  
  // State
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount, setNotificationCount] = useState(3);
  const [userName, setUserName] = useState('User');
  const [userInitials, setUserInitials] = useState('JD');

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      // Fetch wallet balance and transaction history in parallel
      const [walletData, transactionsData, limitsData] = await Promise.all([
        APIService.getWalletBalance(),
        APIService.getTransferHistory({ page: 1, limit: 5 }),
        APIService.getTransactionLimits(),
      ]);

      // Convert API transactions to dashboard format
      const recentTransactions: Transaction[] = transactionsData.transactions.slice(0, 4).map((tx: any) => ({
        id: tx.id,
        type: tx.type === 'money_transfer' ? (tx.amount < 0 ? 'sent' : 'received') : 
              tx.status === 'pending' ? 'pending' : 'sent',
        title: tx.description || 'Transaction',
        subtitle: tx.recipient_name ? `${tx.recipient_bank} • ${tx.recipient_name}` : 'Banking Transaction',
        amount: tx.amount,
        time: new Date(tx.created_at).toLocaleDateString(),
        icon: tx.type === 'money_transfer' ? (tx.amount < 0 ? '↗️' : '↙️') : 
              tx.type === 'cash_withdrawal' ? '💸' : '📋',
      }));

      // Generate AI suggestions based on transaction history
      const aiSuggestions: AISuggestion[] = [
        {
          id: '1',
          type: 'repeat',
          icon: '🔄',
          title: 'Quick Actions',
          description: 'View your recent transactions or start a new transfer.',
        },
        {
          id: '2',
          type: 'bills',
          icon: '📊',
          title: 'Transaction History',
          description: `You have ${transactionsData.transactions.length} transactions this month.`,
        },
      ];

      setDashboardData({
        balance: walletData.balance,
        availableBalance: walletData.availableBalance,
        currency: walletData.currency,
        monthlyStats: {
          transactions: transactionsData.transactions.length,
          recipients: new Set(transactionsData.transactions.map((tx: any) => tx.recipient_name).filter(Boolean)).size,
          volume: `₦${(transactionsData.transactions.reduce((sum: number, tx: any) => sum + Math.abs(tx.amount || 0), 0) / 1000000).toFixed(1)}M`,
        },
        recentTransactions: recentTransactions,
        aiSuggestions: aiSuggestions,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadDashboardData();
  }, [loadDashboardData]);

  // Action handlers
  const handleSendMoney = useCallback(() => {
    onNavigateToTransfer?.();
  }, [onNavigateToTransfer]);

  const handleViewDetails = useCallback(() => {
    onNavigateToHistory?.();
  }, [onNavigateToHistory]);

  const handleRefreshBalance = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  const handleAISuggestion = useCallback((suggestion: AISuggestion) => {
    switch (suggestion.type) {
      case 'repeat':
        Alert.alert('AI Assistant', 'I can help you send ₦50,000 to Adebayo Michael again. Would you like me to prepare the transfer?');
        break;
      case 'bills':
        Alert.alert('AI Assistant', 'Your EKEDC bill is ₦15,750. I can set up automatic payment if you\'d like!');
        break;
      case 'budget':
        Alert.alert('AI Assistant', 'You\'ve spent ₦932,000 out of ₦1,200,000 this month. Most spending was on transfers (68%) and bills (22%).');
        break;
    }
  }, []);

  const handleNotifications = useCallback(() => {
    Alert.alert(
      'Notifications',
      '• Transfer completed: ₦25,000 to Adebayo\n• Budget alert: 78% monthly limit reached\n• New recipient added: Ibrahim Yusuf'
    );
    setNotificationCount(0);
  }, []);

  // Quick actions
  const quickActions = [
    { icon: '💸', title: 'Send Money', subtitle: 'Transfer to any bank', onPress: handleSendMoney },
    { icon: '📱', title: 'Mobile Top-up', subtitle: 'Airtime & Data', onPress: () => Alert.alert('Coming Soon', 'Mobile top-up feature coming soon!') },
    { icon: '💡', title: 'Pay Bills', subtitle: 'Utilities & Services', onPress: () => Alert.alert('Coming Soon', 'Bill payment feature coming soon!') },
    { icon: '📊', title: 'Analytics', subtitle: 'Spending insights', onPress: () => Alert.alert('Coming Soon', 'Analytics feature coming soon!') },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: '#ffffff',
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 4,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    logoSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 15,
    },
    tenantLogo: {
      width: 50,
      height: 50,
      backgroundColor: theme.colors.primary,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoText: {
      color: '#ffffff',
      fontSize: 20,
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
      width: screenWidth < 400 ? 150 : 200,
    },
    searchInput: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderWidth: 2,
      borderColor: '#e1e5e9',
      borderRadius: 25,
      backgroundColor: '#f8fafc',
      fontSize: 14,
    },
    notificationButton: {
      position: 'relative',
      padding: theme.spacing.sm,
    },
    notificationBadge: {
      position: 'absolute',
      top: 5,
      right: 5,
      backgroundColor: theme.colors.error,
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    userAvatar: {
      width: 40,
      height: 40,
      backgroundColor: theme.colors.secondary,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: 'bold',
    },
    welcomeSection: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.xl,
      position: 'relative',
      overflow: 'hidden',
    },
    welcomeContent: {
      position: 'relative',
      zIndex: 2,
    },
    welcomeText: {
      marginBottom: theme.spacing.lg,
    },
    welcomeTitle: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: theme.spacing.sm,
    },
    welcomeSubtitle: {
      fontSize: 18,
      color: 'rgba(255, 255, 255, 0.9)',
      marginBottom: theme.spacing.lg,
    },
    balanceDisplay: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      padding: theme.spacing.lg,
      borderRadius: 20,
      marginTop: theme.spacing.lg,
    },
    balanceLabel: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: theme.spacing.xs,
    },
    balanceAmount: {
      fontSize: 42,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: theme.spacing.md,
    },
    balanceActions: {
      flexDirection: 'row',
      gap: 15,
      flexWrap: 'wrap',
    },
    balanceAction: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: 25,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    balanceActionText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '500',
    },
    statsGrid: {
      flexDirection: 'row',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    statCard: {
      flex: 1,
      backgroundColor: '#ffffff',
      padding: theme.spacing.lg,
      borderRadius: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 4,
    },
    statIcon: {
      fontSize: 24,
      marginBottom: theme.spacing.sm,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: theme.spacing.xs,
    },
    statLabel: {
      fontSize: 12,
      color: '#666',
      textAlign: 'center',
    },
    dashboardGrid: {
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.lg,
    },
    quickActions: {
      backgroundColor: '#ffffff',
      borderRadius: 20,
      padding: theme.spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 4,
      marginBottom: theme.spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#333',
    },
    seeAll: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    actionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
    },
    actionCard: {
      backgroundColor: '#f8fafc',
      borderRadius: 16,
      padding: theme.spacing.lg,
      alignItems: 'center',
      width: (screenWidth - theme.spacing.lg * 2 - theme.spacing.lg * 2 - theme.spacing.md) / 2,
      minHeight: 120,
    },
    actionIcon: {
      fontSize: 32,
      marginBottom: theme.spacing.sm,
    },
    actionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: theme.spacing.xs,
      textAlign: 'center',
    },
    actionSubtitle: {
      fontSize: 12,
      color: '#666',
      textAlign: 'center',
    },
    aiPanel: {
      backgroundColor: '#ffffff',
      borderRadius: 20,
      padding: theme.spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 4,
      marginBottom: theme.spacing.lg,
    },
    aiHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.lg,
    },
    aiStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusDot: {
      width: 8,
      height: 8,
      backgroundColor: '#22c55e',
      borderRadius: 4,
    },
    statusText: {
      fontSize: 12,
      color: '#22c55e',
      fontWeight: '500',
    },
    aiSuggestion: {
      backgroundColor: '#f8fafc',
      borderRadius: 12,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    suggestionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
      gap: 8,
    },
    suggestionTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#333',
    },
    suggestionDescription: {
      fontSize: 12,
      color: '#666',
      lineHeight: 16,
    },
    recentActivity: {
      backgroundColor: '#ffffff',
      borderRadius: 20,
      padding: theme.spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 4,
      marginBottom: theme.spacing.lg,
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
    },
    activityIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    activityDetails: {
      flex: 1,
    },
    activityTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: '#333',
      marginBottom: 2,
    },
    activitySubtitle: {
      fontSize: 12,
      color: '#666',
      marginBottom: 2,
    },
    activityTime: {
      fontSize: 11,
      color: '#999',
    },
    activityAmount: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    amountSent: {
      color: '#ef4444',
    },
    amountReceived: {
      color: '#22c55e',
    },
    amountPending: {
      color: '#f59e0b',
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={dynamicStyles.header}>
        <View style={dynamicStyles.headerContent}>
          <View style={dynamicStyles.logoSection}>
            <View style={dynamicStyles.tenantLogo}>
              <Text style={dynamicStyles.logoText}>
                {currentTenant?.name?.substring(0, 2).toUpperCase() || 'OP'}
              </Text>
            </View>
            <View style={dynamicStyles.logoInfo}>
              <Text style={dynamicStyles.logoTitle}>
                {currentTenant?.displayName || 'OrokiiPay'}
              </Text>
              <Text style={dynamicStyles.logoSubtitle}>Money Transfer</Text>
            </View>
          </View>

          <View style={dynamicStyles.headerActions}>
            <View style={dynamicStyles.searchBox}>
              <TextInput
                style={dynamicStyles.searchInput}
                placeholder="Search..."
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
              style={dynamicStyles.userProfile}
              onPress={onNavigateToSettings}
            >
              <View style={dynamicStyles.userAvatar}>
                <Text style={dynamicStyles.avatarText}>{userInitials}</Text>
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
        {/* Welcome Section */}
        <View style={dynamicStyles.welcomeSection}>
          <View style={dynamicStyles.welcomeContent}>
            <View style={dynamicStyles.welcomeText}>
              <Text style={dynamicStyles.welcomeTitle}>Good morning, {userName}! 👋</Text>
              <Text style={dynamicStyles.welcomeSubtitle}>
                Ready to make some transfers? Your AI assistant is here to help.
              </Text>
            </View>

            {dashboardData && (
              <View style={dynamicStyles.balanceDisplay}>
                <Text style={dynamicStyles.balanceLabel}>Available Balance</Text>
                <Text style={dynamicStyles.balanceAmount}>
                  {dashboardData.currency}{dashboardData.availableBalance.toLocaleString()}
                </Text>
                <View style={dynamicStyles.balanceActions}>
                  <TouchableOpacity style={dynamicStyles.balanceAction} onPress={handleSendMoney}>
                    <Text style={dynamicStyles.balanceActionText}>💸 Send Money</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={dynamicStyles.balanceAction} onPress={handleViewDetails}>
                    <Text style={dynamicStyles.balanceActionText}>📈 View Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={dynamicStyles.balanceAction} onPress={handleRefreshBalance}>
                    <Text style={dynamicStyles.balanceActionText}>🔄 Refresh</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Stats Grid */}
        {dashboardData && (
          <View style={dynamicStyles.statsGrid}>
            <View style={dynamicStyles.statCard}>
              <Text style={dynamicStyles.statIcon}>📊</Text>
              <Text style={dynamicStyles.statValue}>{dashboardData.monthlyStats.transactions}</Text>
              <Text style={dynamicStyles.statLabel}>Transactions This Month</Text>
            </View>
            <View style={dynamicStyles.statCard}>
              <Text style={dynamicStyles.statIcon}>👥</Text>
              <Text style={dynamicStyles.statValue}>{dashboardData.monthlyStats.recipients}</Text>
              <Text style={dynamicStyles.statLabel}>Frequent Recipients</Text>
            </View>
            <View style={dynamicStyles.statCard}>
              <Text style={dynamicStyles.statIcon}>💰</Text>
              <Text style={dynamicStyles.statValue}>{dashboardData.monthlyStats.volume}</Text>
              <Text style={dynamicStyles.statLabel}>Monthly Volume</Text>
            </View>
          </View>
        )}

        <View style={dynamicStyles.dashboardGrid}>
          {/* Quick Actions */}
          <View style={dynamicStyles.quickActions}>
            <View style={dynamicStyles.sectionHeader}>
              <Text style={dynamicStyles.sectionTitle}>⚡ Quick Actions</Text>
              <TouchableOpacity>
                <Text style={dynamicStyles.seeAll}>Customize</Text>
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.actionsGrid}>
              {quickActions.map((action, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={dynamicStyles.actionCard}
                  onPress={action.onPress}
                >
                  <Text style={dynamicStyles.actionIcon}>{action.icon}</Text>
                  <Text style={dynamicStyles.actionTitle}>{action.title}</Text>
                  <Text style={dynamicStyles.actionSubtitle}>{action.subtitle}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* AI Assistant Panel */}
          {dashboardData && (
            <View style={dynamicStyles.aiPanel}>
              <View style={dynamicStyles.aiHeader}>
                <Text style={dynamicStyles.sectionTitle}>🤖 AI Assistant</Text>
                <View style={dynamicStyles.aiStatus}>
                  <View style={dynamicStyles.statusDot} />
                  <Text style={dynamicStyles.statusText}>Online & Ready</Text>
                </View>
              </View>

              {dashboardData.aiSuggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.id}
                  style={dynamicStyles.aiSuggestion}
                  onPress={() => handleAISuggestion(suggestion)}
                >
                  <View style={dynamicStyles.suggestionHeader}>
                    <Text style={{ fontSize: 16 }}>{suggestion.icon}</Text>
                    <Text style={dynamicStyles.suggestionTitle}>{suggestion.title}</Text>
                  </View>
                  <Text style={dynamicStyles.suggestionDescription}>
                    {suggestion.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Recent Activity */}
          {dashboardData && (
            <View style={dynamicStyles.recentActivity}>
              <View style={dynamicStyles.sectionHeader}>
                <Text style={dynamicStyles.sectionTitle}>📝 Recent Activity</Text>
                <TouchableOpacity onPress={onNavigateToHistory}>
                  <Text style={dynamicStyles.seeAll}>View All</Text>
                </TouchableOpacity>
              </View>

              {dashboardData.recentTransactions.map((transaction) => (
                <View key={transaction.id} style={dynamicStyles.activityItem}>
                  <View style={[
                    dynamicStyles.activityIcon,
                    { 
                      backgroundColor: transaction.type === 'sent' ? '#fef2f2' : 
                                     transaction.type === 'received' ? '#f0fdf4' : '#fef3c7'
                    }
                  ]}>
                    <Text style={{ fontSize: 18 }}>{transaction.icon}</Text>
                  </View>
                  <View style={dynamicStyles.activityDetails}>
                    <Text style={dynamicStyles.activityTitle}>{transaction.title}</Text>
                    <Text style={dynamicStyles.activitySubtitle}>{transaction.subtitle}</Text>
                    <Text style={dynamicStyles.activityTime}>{transaction.time}</Text>
                  </View>
                  <Text style={[
                    dynamicStyles.activityAmount,
                    transaction.type === 'sent' ? dynamicStyles.amountSent : 
                    transaction.type === 'received' ? dynamicStyles.amountReceived :
                    dynamicStyles.amountPending
                  ]}>
                    {transaction.amount > 0 ? '+' : ''}₦{Math.abs(transaction.amount).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
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

export default DashboardScreen;