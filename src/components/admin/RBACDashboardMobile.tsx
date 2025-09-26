/**
 * RBAC Dashboard Mobile Component
 * React Native compatible version of RBAC management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTenantTheme } from '../../tenants/TenantContext';
import apiService from '../../services/api';

interface RBACDashboardProps {
  onGoBack?: () => void;
}

export const RBACDashboardMobile: React.FC<RBACDashboardProps> = ({ onGoBack }) => {
  const theme = useTenantTheme();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // This would be the actual API call
      // const data = await apiService.getRBACDashboardData();

      // Mock data for now
      const mockData = {
        totalUsers: 45,
        activeRoles: 12,
        totalPermissions: 89,
        recentAssignments: [
          { email: 'user1@fmfb.com', role: 'Branch Manager', date: '2025-01-24' },
          { email: 'user2@fmfb.com', role: 'Teller', date: '2025-01-23' },
        ]
      };

      setDashboardData(mockData);
    } catch (error) {
      console.error('Failed to load RBAC dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading RBAC Dashboard...</Text>
      </View>
    );
  }

  const renderOverview = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Dashboard Overview</Text>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.statEmoji]}>👥</Text>
          <Text style={[styles.statNumber, { color: theme.colors.text }]}>{dashboardData?.totalUsers || 0}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total Users</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.statEmoji]}>🛡️</Text>
          <Text style={[styles.statNumber, { color: theme.colors.text }]}>{dashboardData?.activeRoles || 0}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Active Roles</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.statEmoji]}>🔑</Text>
          <Text style={[styles.statNumber, { color: theme.colors.text }]}>{dashboardData?.totalPermissions || 0}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Permissions</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 20 }]}>Recent Role Assignments</Text>
      {dashboardData?.recentAssignments?.map((assignment: any, index: number) => (
        <View key={index} style={[styles.assignmentCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.assignmentEmail, { color: theme.colors.text }]}>{assignment.email}</Text>
          <Text style={[styles.assignmentRole, { color: theme.colors.primary }]}>{assignment.role}</Text>
          <Text style={[styles.assignmentDate, { color: theme.colors.textSecondary }]}>{assignment.date}</Text>
        </View>
      ))}
    </View>
  );

  const renderPlaceholder = (title: string, description: string) => (
    <View style={[styles.placeholderContainer, { backgroundColor: theme.colors.card }]}>
      <Text style={[styles.placeholderEmoji]}>🚧</Text>
      <Text style={[styles.placeholderTitle, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.placeholderDescription, { color: theme.colors.textSecondary }]}>{description}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RBAC Management</Text>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { borderBottomColor: theme.colors.border }]}>
        {[
          { id: 'overview', label: 'Overview', emoji: '📊' },
          { id: 'users', label: 'Users', emoji: '👥' },
          { id: 'roles', label: 'Roles', emoji: '🛡️' },
          { id: 'permissions', label: 'Permissions', emoji: '🔑' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && { backgroundColor: theme.colors.primaryLight }
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={styles.tabEmoji}>{tab.emoji}</Text>
            <Text style={[
              styles.tabLabel,
              { color: activeTab === tab.id ? theme.colors.primary : theme.colors.textSecondary }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && renderPlaceholder('User Management', 'Manage user roles and permissions')}
        {activeTab === 'roles' && renderPlaceholder('Role Management', 'Create and edit user roles')}
        {activeTab === 'permissions' && renderPlaceholder('Permission Management', 'Configure system permissions')}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tabEmoji: {
    fontSize: 16,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  assignmentCard: {
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    elevation: 1,
  },
  assignmentEmail: {
    fontSize: 14,
    fontWeight: '600',
  },
  assignmentRole: {
    fontSize: 13,
    marginTop: 2,
  },
  assignmentDate: {
    fontSize: 11,
    marginTop: 4,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    margin: 16,
    borderRadius: 12,
  },
  placeholderEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default RBACDashboardMobile;