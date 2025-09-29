/**
 * Modern Quick Stats Component
 * Displays key metrics with glassmorphism and animations
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import LinearGradient from '../common/LinearGradient';
import { useTenantTheme } from '../../context/TenantThemeContext';

interface StatCard {
  id: string;
  label: string;
  value: string | number;
  change?: number;
  icon: string;
  gradient: string[];
}

interface ModernQuickStatsProps {
  balance: number;
  availableBalance: number;
  monthlyTransactions: number;
  savingsGoal?: number;
  loanBalance?: number;
  currency: string;
}

export const ModernQuickStats: React.FC<ModernQuickStatsProps> = ({
  balance,
  availableBalance,
  monthlyTransactions,
  savingsGoal = 0,
  loanBalance = 0,
  currency,
}) => {
  const { theme, tenantInfo } = useTenantTheme();
  const formatCurrency = (amount: number) => {
    return `${currency} ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const stats: StatCard[] = [
    {
      id: 'balance',
      label: 'Total Balance',
      value: formatCurrency(balance),
      change: 12.5,
      icon: '💰',
      gradient: [theme.colors.primaryGradientStart, theme.colors.primaryGradientEnd],
    },
    {
      id: 'available',
      label: 'Available',
      value: formatCurrency(availableBalance),
      change: 8.2,
      icon: '💳',
      gradient: [theme.colors.secondary, theme.colors.accent],
    },
    {
      id: 'transactions',
      label: 'Monthly Activity',
      value: formatNumber(monthlyTransactions),
      change: -3.1,
      icon: '📊',
      gradient: ['#43e97b', '#38f9d7'],
    },
    {
      id: 'savings',
      label: 'Savings Goal',
      value: savingsGoal > 0 ? formatCurrency(savingsGoal) : 'Set Goal',
      icon: '🎯',
      gradient: ['#f093fb', '#f5576c'],
    },
  ];

  const animatedValues = React.useRef(
    stats.map(() => new Animated.Value(0))
  ).current;

  React.useEffect(() => {
    const animations = animatedValues.map((animValue, index) =>
      Animated.spring(animValue, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: index * 100,
        useNativeDriver: true,
      })
    );
    Animated.parallel(animations).start();
  }, []);

  const dynamicStyles = getDynamicStyles(theme);

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>
          Quick Overview
        </Text>
        <Text style={dynamicStyles.subtitle}>
          Your financial snapshot
        </Text>
      </View>

      <View style={dynamicStyles.statsGrid}>
        {stats.map((stat, index) => (
          <Animated.View
            key={stat.id}
            style={[
              dynamicStyles.statCard,
              {
                opacity: animatedValues[index],
                transform: [
                  {
                    scale: animatedValues[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                  {
                    translateY: animatedValues[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={[...stat.gradient, stat.gradient[1] + '10']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={dynamicStyles.gradientOverlay}
            />

            <View style={dynamicStyles.statContent}>
              <View style={dynamicStyles.statHeader}>
                <View style={[dynamicStyles.iconContainer, { backgroundColor: stat.gradient[0] + '15' }]}>
                  <Text style={dynamicStyles.icon}>{stat.icon}</Text>
                </View>
                {stat.change && (
                  <View style={[
                    dynamicStyles.changeBadge,
                    { backgroundColor: stat.change > 0 ? '#10b98115' : '#ef444415' }
                  ]}>
                    <Text style={[
                      dynamicStyles.changeText,
                      { color: stat.change > 0 ? '#10b981' : '#ef4444' }
                    ]}>
                      {stat.change > 0 ? '↑' : '↓'} {Math.abs(stat.change)}%
                    </Text>
                  </View>
                )}
              </View>

              <Text style={dynamicStyles.statLabel}>
                {stat.label}
              </Text>

              <Text style={dynamicStyles.statValue} numberOfLines={1}>
                {stat.value}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>

      {/* Balance trend mini chart */}
      <View style={[dynamicStyles.trendCard]}>
        <View style={dynamicStyles.trendHeader}>
          <Text style={dynamicStyles.trendTitle}>
            Balance Trend
          </Text>
          <Text style={dynamicStyles.trendPeriod}>
            Last 7 days
          </Text>
        </View>

        <View style={dynamicStyles.miniChart}>
          {[65, 72, 68, 75, 82, 79, 85].map((height, index) => (
            <View key={index} style={dynamicStyles.chartBarContainer}>
              <LinearGradient
                colors={[theme.colors.primaryGradientStart, theme.colors.primaryGradientEnd]}
                style={[dynamicStyles.chartBar, { height: `${height}%` }]}
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const getDynamicStyles = (theme: any) => StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.7,
    color: theme.colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  statCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 6,
    right: 6,
    bottom: 0,
    borderRadius: theme.layout.borderRadius,
    opacity: 0.05,
  },
  statContent: {
    padding: 16,
    borderRadius: theme.layout.borderRadius,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.glassBackground,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  icon: {
    fontSize: 18,
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.7,
    color: theme.colors.textSecondary,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  trendCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: theme.layout.borderRadius,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  trendPeriod: {
    fontSize: 11,
    opacity: 0.7,
    color: theme.colors.textSecondary,
  },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
    gap: 4,
  },
  chartBarContainer: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
});

export default ModernQuickStats;