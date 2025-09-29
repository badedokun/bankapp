/**
 * Modern Stats Panel Component - Glassmorphism Design
 * Displays financial metrics with RBAC-based visibility
 * Integrates with tenant theme configuration
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface StatItem {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
  permissionRequired: string;
  onPress?: () => void;
}

interface ModernStatsPanelProps {
  stats: StatItem[];
  userPermissions: Record<string, string>;
  theme: any;
  isDevAdmin?: boolean;
}

const ModernStatsPanel: React.FC<ModernStatsPanelProps> = ({
  stats,
  userPermissions,
  theme,
  isDevAdmin = false
}) => {
  // Permission checking
  const hasPermission = (permission: string, level: string = 'read') => {
    const userLevel = userPermissions[permission] || 'none';
    const levels = ['none', 'read', 'write', 'full'];
    return levels.indexOf(userLevel) >= levels.indexOf(level);
  };

  // Filter stats based on permissions
  const visibleStats = stats.filter(stat =>
    isDevAdmin || hasPermission(stat.permissionRequired)
  );

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'positive': return '#10B981';
      case 'negative': return '#EF4444';
      default: return theme.colors.textSecondary;
    }
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'positive': return '↗️';
      case 'negative': return '↘️';
      default: return '→';
    }
  };

  if (visibleStats.length === 0) {
    return (
      <View style={[styles.emptyContainer, {
        backgroundColor: theme.colors.glassBackground,
        borderColor: theme.colors.glassBorder
      }]}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No financial data available for your role
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Financial Overview
      </Text>
      <View style={styles.statsGrid}>
        {visibleStats.map((stat, index) => (
          <TouchableOpacity
            key={stat.id}
            style={[styles.statCard, {
              backgroundColor: theme.colors.glassBackground,
              borderColor: theme.colors.glassBorder,
              shadowColor: theme.colors.primary
            }]}
            onPress={stat.onPress}
            activeOpacity={stat.onPress ? 0.8 : 1}
            disabled={!stat.onPress}
          >
            <View style={styles.statHeader}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>
                {stat.title}
              </Text>
            </View>

            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {stat.value}
            </Text>

            <View style={styles.changeContainer}>
              <Text style={styles.changeIcon}>
                {getChangeIcon(stat.changeType)}
              </Text>
              <Text style={[styles.changeText, { color: getChangeColor(stat.changeType) }]}>
                {stat.change}
              </Text>
            </View>

            {/* Permission indicator */}
            <View style={styles.permissionIndicator}>
              <View style={[styles.permissionDot, {
                backgroundColor: isDevAdmin ? '#8B5CF6' :
                  hasPermission(stat.permissionRequired, 'write') ? '#10B981' : '#3B82F6'
              }]} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (screenWidth - 56) / 2,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    backdropFilter: 'blur(20px)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    position: 'relative',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  permissionIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  permissionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  emptyContainer: {
    marginHorizontal: 20,
    padding: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ModernStatsPanel;