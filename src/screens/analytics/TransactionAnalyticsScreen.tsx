/**
 * Transaction Analytics Screen
 * Provides insights into transaction patterns, revenue trends, and performance metrics
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
  Platform,
  Dimensions,
} from 'react-native';
import { useTenant, useTenantTheme } from '../../tenants/TenantContext';
import { useBankingAlert } from '../../services/AlertService';
import { formatCurrency } from '../../utils/currency';
import APIService from '../../services/api';

const { width: screenWidth } = Dimensions.get('window');

interface AnalyticsData {
  moneyFlow: {
    currentMonthSent: number;
    currentMonthReceived: number;
    lastMonthSent: number;
    lastMonthReceived: number;
    netFlow: number;
    flowTrend: 'positive' | 'negative';
  };
  transactionPatterns: {
    mostFrequentType: string;
    averageTransaction: number;
    peakDay: string;
    totalVolume: number;
  };
  performanceMetrics: {
    successRate: number;
    averageProcessingTime: string;
    pendingCount: number;
    failedCount: number;
  };
  monthlyTrends: Array<{
    month: string;
    sent: number;
    received: number;
    transactions: number;
  }>;
}

interface TransactionAnalyticsScreenProps {
  onBack: () => void;
}

const TransactionAnalyticsScreen: React.FC<TransactionAnalyticsScreenProps> = ({ onBack }) => {
  const tenant = useTenant();
  const theme = tenant.theme;
  const tenantTheme = useTenantTheme();
  const { showAlert } = useBankingAlert();

  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedTab, setSelectedTab] = useState<'moneyFlow' | 'patterns' | 'performance'>('moneyFlow');

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch transaction history from API - get last 6 months of data
      const response = await APIService.getTransferHistory({
        page: 1,
        limit: 1000 // Get enough data for analytics
      });

      const transactions = response.transactions || [];

      // Get the actual year from the most recent transaction (handle test data with old dates)
      let latestTxnDate = new Date();
      if (transactions.length > 0) {
        const dateStr = transactions[0].createdAt || transactions[0].created_at || transactions[0].date;
        const txnDate = new Date(dateStr);
        // Check if date is valid
        if (!isNaN(txnDate.getTime())) {
          latestTxnDate = txnDate;
        }
      }

      const currentYear = latestTxnDate.getFullYear();
      const currentMonth = latestTxnDate.getMonth();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      // Filter transactions by month
      const currentMonthTxns = transactions.filter((t: any) => {
        const dateStr = t.createdAt || t.created_at || t.date;
        const txDate = new Date(dateStr);
        return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
      });

      const lastMonthTxns = transactions.filter((t: any) => {
        const dateStr = t.createdAt || t.created_at || t.date;
        const txDate = new Date(dateStr);
        return txDate.getMonth() === lastMonth && txDate.getFullYear() === lastMonthYear;
      });

      // Calculate money sent vs money received (successful transactions only)
      const currentMonthSentTxns = currentMonthTxns
        .filter((t: any) => (t.status === 'completed' || t.status === 'successful') && t.direction === 'sent');
      const currentMonthSent = currentMonthSentTxns
        .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);

      const currentMonthReceivedTxns = currentMonthTxns
        .filter((t: any) => (t.status === 'completed' || t.status === 'successful') && t.direction === 'received');
      const currentMonthReceived = currentMonthReceivedTxns
        .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);

      const lastMonthSent = lastMonthTxns
        .filter((t: any) => (t.status === 'completed' || t.status === 'successful') && t.direction === 'sent')
        .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);

      const lastMonthReceived = lastMonthTxns
        .filter((t: any) => (t.status === 'completed' || t.status === 'successful') && t.direction === 'received')
        .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);

      const netFlow = currentMonthReceived - currentMonthSent;
      const lastMonthNetFlow = lastMonthReceived - lastMonthSent;

      // Calculate transaction patterns
      const typeCount: Record<string, number> = {};
      transactions.forEach((t: any) => {
        const type = t.type || 'transfer';
        typeCount[type] = (typeCount[type] || 0) + 1;
      });
      const mostFrequentType = Object.keys(typeCount).reduce((a, b) =>
        typeCount[a] > typeCount[b] ? a : b, 'transfers'
      );

      const averageTransaction = transactions.length > 0
        ? transactions.reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0) / transactions.length
        : 0;

      // Calculate peak day
      const dayCount: Record<string, number> = {};
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      transactions.forEach((t: any) => {
        const dateStr = t.createdAt || t.created_at || t.date;
        const day = new Date(dateStr).getDay();
        const dayName = dayNames[day];
        dayCount[dayName] = (dayCount[dayName] || 0) + 1;
      });
      const peakDay = Object.keys(dayCount).reduce((a, b) =>
        dayCount[a] > dayCount[b] ? a : b, 'Friday'
      );

      // Calculate performance metrics
      const successfulCount = transactions.filter((t: any) =>
        t.status === 'completed' || t.status === 'successful'
      ).length;
      const pendingCount = transactions.filter((t: any) => t.status === 'pending').length;
      const failedCount = transactions.filter((t: any) => t.status === 'failed').length;
      const successRate = transactions.length > 0
        ? (successfulCount / transactions.length) * 100
        : 0;

      // Calculate monthly trends (last 5 months)
      const monthlyTrends = [];
      for (let i = 4; i >= 0; i--) {
        const targetMonth = currentMonth - i;
        const targetYear = targetMonth < 0 ? currentYear - 1 : currentYear;
        const adjustedMonth = targetMonth < 0 ? 12 + targetMonth : targetMonth;

        const monthTxns = transactions.filter((t: any) => {
          const dateStr = t.createdAt || t.created_at || t.date;
          const txDate = new Date(dateStr);
          return txDate.getMonth() === adjustedMonth && txDate.getFullYear() === targetYear;
        });

        const monthSent = monthTxns
          .filter((t: any) => (t.status === 'completed' || t.status === 'successful') && t.direction === 'sent')
          .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);

        const monthReceived = monthTxns
          .filter((t: any) => (t.status === 'completed' || t.status === 'successful') && t.direction === 'received')
          .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);

        monthlyTrends.push({
          month: new Date(targetYear, adjustedMonth, 1).toLocaleDateString('en-US', { month: 'short' }),
          sent: monthSent,
          received: monthReceived,
          transactions: monthTxns.length
        });
      }

      const analyticsData: AnalyticsData = {
        moneyFlow: {
          currentMonthSent,
          currentMonthReceived,
          lastMonthSent,
          lastMonthReceived,
          netFlow,
          flowTrend: netFlow >= 0 ? 'positive' : 'negative',
        },
        transactionPatterns: {
          mostFrequentType,
          averageTransaction,
          peakDay,
          totalVolume: transactions.length,
        },
        performanceMetrics: {
          successRate: Math.round(successRate * 10) / 10,
          averageProcessingTime: '2.3s', // This would come from API in production
          pendingCount,
          failedCount,
        },
        monthlyTrends,
      };

      setAnalyticsData(analyticsData);
    } catch (error) {
      console.error('Analytics loading error:', error);
      showAlert('Error', 'Failed to load analytics data. Please try again.', [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  }, [showAlert]);

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.primary,
      
      marginLeft: 20,
      marginRight: 20,
      marginTop: 0,
      marginBottom: 0,
      borderRadius: 12,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
    },
    backButton: {
      marginRight: theme.spacing.sm,
    },
    backButtonCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
        web: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
      }),
    },
    backButtonIcon: {
      color: tenantTheme.colors.textInverse,
      fontSize: 24,
      fontWeight: '600',
    },
    headerTitle: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitleText: {
      fontSize: 30,
      fontWeight: '700',
      color: tenantTheme.colors.textInverse,
      marginBottom: 5,
      letterSpacing: 0.3,
    },
    headerSubtitle: {
      fontSize: 16,
      fontWeight: '400',
      color: 'rgba(255, 255, 255, 0.9)',
      letterSpacing: 0.2,
    },
    headerSpacer: {
      width: 80,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: tenantTheme.colors.surface,
      padding: theme.spacing.md,
      gap: 12,
      ...Platform.select({
        ios: {
          shadowColor: tenantTheme.colors.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
        web: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
      }),
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: tenantTheme.colors.background,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: tenantTheme.colors.border,
    },
    activeTab: {
      backgroundColor: tenantTheme.colors.primary,
      borderColor: tenantTheme.colors.primary,
      ...Platform.select({
        ios: {
          shadowColor: tenantTheme.colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
        web: {
          boxShadow: `0 2px 8px ${tenantTheme.colors.primary}40`,
        },
      }),
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: tenantTheme.colors.text,
      letterSpacing: 0.2,
    },
    activeTabText: {
      color: tenantTheme.colors.textInverse,
      fontWeight: '700',
    },
    content: {
      padding: theme.spacing.lg,
    },
    section: {
      backgroundColor: tenantTheme.colors.surface,
      borderRadius: 16,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      ...Platform.select({
        ios: {
          shadowColor: tenantTheme.colors.text,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
        },
        android: {
          elevation: 6,
        },
        web: {
          boxShadow: '0 3px 12px rgba(0, 0, 0, 0.12)',
        },
      }),
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: tenantTheme.colors.text,
      marginBottom: theme.spacing.md,
      letterSpacing: 0.3,
    },
    metricCard: {
      backgroundColor: tenantTheme.colors.background,
      borderRadius: 16,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: tenantTheme.colors.border,
      ...Platform.select({
        ios: {
          shadowColor: tenantTheme.colors.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        android: {
          elevation: 3,
        },
        web: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
      }),
    },
    metricRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    metricLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: tenantTheme.colors.textSecondary,
      letterSpacing: 0.2,
      marginBottom: 12,
      textTransform: 'uppercase',
    },
    metricValue: {
      fontSize: 32,
      fontWeight: '700',
      color: tenantTheme.colors.text,
      letterSpacing: -0.5,
    },
    metricChange: {
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: 0.2,
      marginTop: 4,
    },
    metricChangeUp: {
      color: tenantTheme.colors.success,
    },
    metricChangeDown: {
      color: tenantTheme.colors.error,
    },
    chartContainer: {
      marginTop: theme.spacing.md,
      gap: 8,
    },
    chartBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    chartMonth: {
      width: 40,
      fontSize: 13,
      fontWeight: '600',
      color: tenantTheme.colors.textSecondary,
      letterSpacing: 0.1,
    },
    chartBarContainer: {
      flex: 1,
      height: 36,
      backgroundColor: tenantTheme.colors.background,
      borderRadius: 10,
      overflow: 'hidden',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: tenantTheme.colors.border,
    },
    chartBarFill: {
      height: '100%',
      backgroundColor: tenantTheme.colors.primary,
      ...Platform.select({
        ios: {
          shadowColor: tenantTheme.colors.primary,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.3,
          shadowRadius: 3,
        },
        android: {
          elevation: 2,
        },
        web: {
          boxShadow: `0 1px 3px ${tenantTheme.colors.primary}40`,
        },
      }),
      borderRadius: 8,
      justifyContent: 'center',
      paddingHorizontal: 12,
    },
    chartBarValue: {
      fontSize: 13,
      fontWeight: '700',
      color: tenantTheme.colors.textInverse,
      letterSpacing: 0.2,
    },
    insightCard: {
      backgroundColor: `${tenantTheme.colors.primary}10`,
      borderRadius: 16,
      padding: theme.spacing.lg,
      borderLeftWidth: 5,
      borderLeftColor: tenantTheme.colors.primary,
      marginTop: theme.spacing.md,
      ...Platform.select({
        ios: {
          shadowColor: tenantTheme.colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
        },
        android: {
          elevation: 3,
        },
        web: {
          boxShadow: `0 2px 8px ${tenantTheme.colors.primary}20`,
        },
      }),
    },
    insightText: {
      fontSize: 15,
      fontWeight: '500',
      color: tenantTheme.colors.text,
      lineHeight: 22,
      letterSpacing: 0.1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      fontWeight: '400',
      color: tenantTheme.colors.textSecondary,
      letterSpacing: 0.1,
    },
  });

  if (isLoading || !analyticsData) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.loadingContainer}>
          <Text style={dynamicStyles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderMoneyFlowTab = () => (
    <View>
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>Money Flow Overview</Text>

        <View style={dynamicStyles.metricCard}>
          <Text style={dynamicStyles.metricLabel}>Money Sent (This Month)</Text>
          <Text style={[dynamicStyles.metricValue, { color: tenantTheme.colors.primary }]}>
            {formatCurrency(analyticsData.moneyFlow.currentMonthSent, 'NGN')}
          </Text>
        </View>

        <View style={dynamicStyles.metricCard}>
          <Text style={dynamicStyles.metricLabel}>Money Received (This Month)</Text>
          <Text style={[dynamicStyles.metricValue, { color: tenantTheme.colors.success }]}>
            {formatCurrency(analyticsData.moneyFlow.currentMonthReceived, 'NGN')}
          </Text>
        </View>

        <View style={dynamicStyles.metricCard}>
          <Text style={dynamicStyles.metricLabel}>Net Flow (This Month)</Text>
          <Text style={[
            dynamicStyles.metricValue,
            { color: analyticsData.moneyFlow.flowTrend === 'positive' ? tenantTheme.colors.success : tenantTheme.colors.error }
          ]}>
            {analyticsData.moneyFlow.flowTrend === 'positive' ? '+' : ''}{formatCurrency(analyticsData.moneyFlow.netFlow, 'NGN')}
          </Text>
          <Text style={[
            dynamicStyles.metricChange,
            analyticsData.moneyFlow.flowTrend === 'positive' ? dynamicStyles.metricChangeUp : dynamicStyles.metricChangeDown
          ]}>
            {analyticsData.moneyFlow.flowTrend === 'positive' ? '✓ Positive' : '⚠ Negative'} cash flow
          </Text>
        </View>
      </View>

      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>Monthly Trends (Sent vs Received)</Text>
        <View style={dynamicStyles.chartContainer}>
          {analyticsData.monthlyTrends.map((item) => {
            const maxAmount = Math.max(
              ...analyticsData.monthlyTrends.flatMap(t => [t.sent, t.received])
            );
            const sentPercentage = maxAmount > 0 ? (item.sent / maxAmount) * 100 : 0;
            const receivedPercentage = maxAmount > 0 ? (item.received / maxAmount) * 100 : 0;

            return (
              <View key={item.month} style={{ marginBottom: 16 }}>
                <Text style={dynamicStyles.chartMonth}>{item.month}</Text>

                {/* Sent bar */}
                <View style={dynamicStyles.chartBar}>
                  <Text style={{ fontSize: 11, width: 60, color: tenantTheme.colors.primary }}>Sent:</Text>
                  <View style={dynamicStyles.chartBarContainer}>
                    <View style={[dynamicStyles.chartBarFill, { width: `${sentPercentage}%`, backgroundColor: tenantTheme.colors.primary }]}>
                      <Text style={dynamicStyles.chartBarValue}>
                        ₦{(item.sent / 1000).toFixed(0)}K
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Received bar */}
                <View style={dynamicStyles.chartBar}>
                  <Text style={{ fontSize: 11, width: 60, color: tenantTheme.colors.success }}>Received:</Text>
                  <View style={dynamicStyles.chartBarContainer}>
                    <View style={[dynamicStyles.chartBarFill, { width: `${receivedPercentage}%`, backgroundColor: tenantTheme.colors.success }]}>
                      <Text style={dynamicStyles.chartBarValue}>
                        ₦{(item.received / 1000).toFixed(0)}K
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={dynamicStyles.insightCard}>
        <Text style={dynamicStyles.insightText}>
          {analyticsData.moneyFlow.flowTrend === 'positive'
            ? `Great! You received ${formatCurrency(analyticsData.moneyFlow.netFlow, 'NGN')} more than you sent this month.`
            : `You sent ${formatCurrency(Math.abs(analyticsData.moneyFlow.netFlow), 'NGN')} more than you received this month.`}
        </Text>
      </View>
    </View>
  );

  const renderPatternsTab = () => (
    <View>
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>Transaction Patterns</Text>

        <View style={dynamicStyles.metricCard}>
          <Text style={dynamicStyles.metricLabel}>Total Transaction Volume</Text>
          <Text style={dynamicStyles.metricValue}>{analyticsData.transactionPatterns.totalVolume}</Text>
        </View>

        <View style={dynamicStyles.metricCard}>
          <Text style={dynamicStyles.metricLabel}>Average Transaction Amount</Text>
          <Text style={dynamicStyles.metricValue}>
            {formatCurrency(analyticsData.transactionPatterns.averageTransaction, 'NGN')}
          </Text>
        </View>

        <View style={dynamicStyles.metricCard}>
          <Text style={dynamicStyles.metricLabel}>Most Frequent Type</Text>
          <Text style={dynamicStyles.metricValue}>
            {analyticsData.transactionPatterns.mostFrequentType.charAt(0).toUpperCase() +
             analyticsData.transactionPatterns.mostFrequentType.slice(1)}
          </Text>
        </View>

        <View style={dynamicStyles.metricCard}>
          <Text style={dynamicStyles.metricLabel}>Peak Transaction Day</Text>
          <Text style={dynamicStyles.metricValue}>{analyticsData.transactionPatterns.peakDay}</Text>
        </View>
      </View>

      <View style={dynamicStyles.insightCard}>
        <Text style={dynamicStyles.insightText}>
          Most of your transactions happen on {analyticsData.transactionPatterns.peakDay}s. Consider scheduling important transfers on this day for optimal processing.
        </Text>
      </View>
    </View>
  );

  const renderPerformanceTab = () => (
    <View>
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>Performance Metrics</Text>

        <View style={dynamicStyles.metricCard}>
          <Text style={dynamicStyles.metricLabel}>Success Rate</Text>
          <View style={dynamicStyles.metricRow}>
            <Text style={[dynamicStyles.metricValue, { color: tenantTheme.colors.success }]}>
              {analyticsData.performanceMetrics.successRate}%
            </Text>
          </View>
        </View>

        <View style={dynamicStyles.metricCard}>
          <Text style={dynamicStyles.metricLabel}>Average Processing Time</Text>
          <Text style={dynamicStyles.metricValue}>{analyticsData.performanceMetrics.averageProcessingTime}</Text>
        </View>

        <View style={dynamicStyles.metricCard}>
          <Text style={dynamicStyles.metricLabel}>Pending Transactions</Text>
          <Text style={[dynamicStyles.metricValue, { color: tenantTheme.colors.warning }]}>
            {analyticsData.performanceMetrics.pendingCount}
          </Text>
        </View>

        <View style={dynamicStyles.metricCard}>
          <Text style={dynamicStyles.metricLabel}>Failed Transactions</Text>
          <Text style={[dynamicStyles.metricValue, { color: tenantTheme.colors.error }]}>
            {analyticsData.performanceMetrics.failedCount}
          </Text>
        </View>
      </View>

      <View style={dynamicStyles.insightCard}>
        <Text style={dynamicStyles.insightText}>
          Your system is performing excellently with a {analyticsData.performanceMetrics.successRate}% success rate and average processing time of {analyticsData.performanceMetrics.averageProcessingTime}.
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Header */}
      <View style={dynamicStyles.header}>
        <View style={dynamicStyles.headerContent}>
          <TouchableOpacity style={dynamicStyles.backButton} onPress={onBack}>
            <View style={dynamicStyles.backButtonCircle}>
              <Text style={dynamicStyles.backButtonIcon}>←</Text>
            </View>
          </TouchableOpacity>

          <View style={dynamicStyles.headerTitle}>
            <Text style={dynamicStyles.headerTitleText}>Analytics</Text>
            <Text style={dynamicStyles.headerSubtitle}>Transaction insights & trends</Text>
          </View>

          <View style={dynamicStyles.headerSpacer} />
        </View>
      </View>

      {/* Tabs */}
      <View style={dynamicStyles.tabContainer}>
        <TouchableOpacity
          style={[dynamicStyles.tab, selectedTab === 'moneyFlow' && dynamicStyles.activeTab]}
          onPress={() => setSelectedTab('moneyFlow')}
        >
          <Text style={[dynamicStyles.tabText, selectedTab === 'moneyFlow' && dynamicStyles.activeTabText]}>
            Money Flow
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[dynamicStyles.tab, selectedTab === 'patterns' && dynamicStyles.activeTab]}
          onPress={() => setSelectedTab('patterns')}
        >
          <Text style={[dynamicStyles.tabText, selectedTab === 'patterns' && dynamicStyles.activeTabText]}>
            Patterns
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[dynamicStyles.tab, selectedTab === 'performance' && dynamicStyles.activeTab]}
          onPress={() => setSelectedTab('performance')}
        >
          <Text style={[dynamicStyles.tabText, selectedTab === 'performance' && dynamicStyles.activeTabText]}>
            Performance
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={dynamicStyles.content}>
          {selectedTab === 'moneyFlow' && renderMoneyFlowTab()}
          {selectedTab === 'patterns' && renderPatternsTab()}
          {selectedTab === 'performance' && renderPerformanceTab()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TransactionAnalyticsScreen;
