/**
 * Modern RBAC Management Screen
 * Glassmorphic design with tenant-aware theming
 * React Native + React Native Web compatible
 * Follows standardized card dimensions and responsive grid layout
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import LinearGradient from '../../components/common/LinearGradient';
import { useTenantTheme } from '../../context/TenantThemeContext';
import { useNotification } from '../../services/ModernNotificationService';
import APIService from '../../services/api';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

interface RBACFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  count?: number;
  badge?: string;
  available: boolean;
  color?: string;
}

interface RBACStats {
  totalUsers: number;
  activeRoles: number;
  totalPermissions: number;
  pendingApprovals: number;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
    status: string;
  }>;
}

export interface ModernRBACManagementScreenProps {
  navigation?: any;
  onGoBack?: () => void;
  onSelectFeature?: (featureId: string) => void;
}

const ModernRBACManagementScreen: React.FC<ModernRBACManagementScreenProps> = ({
  navigation,
  onGoBack,
  onSelectFeature,
}) => {
  const { theme } = useTenantTheme();
  const notify = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'management'>('overview');
  const [rbacStats, setRbacStats] = useState<RBACStats>({
    totalUsers: 45,
    activeRoles: 12,
    totalPermissions: 89,
    pendingApprovals: 3,
    recentActivity: [
      {
        type: 'role_assigned',
        description: 'Branch Manager role assigned to user1@fmfb.com',
        timestamp: '5 mins ago',
        status: 'success',
      },
      {
        type: 'permission_updated',
        description: 'Transfer limit updated for Teller role',
        timestamp: '2 hours ago',
        status: 'warning',
      },
      {
        type: 'user_activated',
        description: 'New user account activated',
        timestamp: '3 hours ago',
        status: 'success',
      },
    ],
  });

  // RBAC Management Features
  const rbacFeatures: RBACFeature[] = [
    {
      id: 'users',
      name: 'User Management',
      description: 'Manage user accounts & status',
      icon: '👥',
      count: rbacStats.totalUsers,
      available: true,
      color: theme.colors.primary,
    },
    {
      id: 'roles',
      name: 'Role Management',
      description: 'Configure roles & hierarchies',
      icon: '🛡️',
      count: rbacStats.activeRoles,
      badge: 'ACTIVE',
      available: true,
    },
    {
      id: 'permissions',
      name: 'Permissions',
      description: 'Set granular permissions',
      icon: '🔑',
      count: rbacStats.totalPermissions,
      available: true,
    },
    {
      id: 'approvals',
      name: 'Pending Approvals',
      description: 'Review access requests',
      icon: '⏳',
      count: rbacStats.pendingApprovals,
      badge: 'URGENT',
      available: true,
      color: theme.colors.warning,
    },
    {
      id: 'audit',
      name: 'Audit Trail',
      description: 'View access history & logs',
      icon: '📋',
      available: true,
    },
    {
      id: 'policies',
      name: 'Access Policies',
      description: 'Define security policies',
      icon: '📜',
      badge: 'NEW',
      available: true,
    },
  ];

  useEffect(() => {
    loadRBACData();
  }, []);

  const loadRBACData = async () => {
    try {
      setIsLoading(true);
      // Load actual RBAC data from API
      const data = await APIService.getRBACStats?.();
      if (data) {
        setRbacStats(data);
      }
    } catch (error) {
      // Use default values
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRBACData();
  };

  const handleFeatureSelect = async (featureId: string) => {
    setSelectedFeature(featureId);
    setIsLoading(true);

    try {
      const feature = rbacFeatures.find(f => f.id === featureId);

      // Small delay for visual feedback
      setTimeout(() => {
        setIsLoading(false);
        if (onSelectFeature) {
          onSelectFeature(featureId);
        } else {
          switch (featureId) {
            case 'users':
              notify.info('Opening User Management...', 'Feature Loading');
              break;
            case 'roles':
              notify.info('Opening Role Configuration...', 'Feature Loading');
              break;
            case 'permissions':
              notify.info('Opening Permission Editor...', 'Feature Loading');
              break;
            case 'approvals':
              notify.warning(`${rbacStats.pendingApprovals} pending approvals`, 'Action Required');
              break;
            default:
              notify.info(
                `${feature?.name} feature coming soon!`,
                'Feature in Development'
              );
          }
        }
      }, 500);
    } catch (error) {
      setIsLoading(false);
      notify.error('Unable to access feature', 'Error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'error':
        return theme.colors.error;
      default:
        return theme.colors.text;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      
      marginLeft: 20,
      marginRight: 20,
      marginTop: 0,
      marginBottom: 0,
      borderRadius: 12,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      ...Platform.select({
        web: {
          backdropFilter: 'blur(10px)',
        },
      }),
    },
    backButtonText: {
      fontSize: 20,
      color: theme.colors.textInverse,
      fontWeight: '600',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.textInverse,
    },
    headerSpacer: {
      width: 40,
    },
    scrollContent: {
      paddingBottom: 100,
    },
    heroSection: {
      paddingHorizontal: 20,
      paddingVertical: 24,
      alignItems: 'center',
    },
    heroTitle: {
      fontSize: 32,
      fontWeight: '700',
      color: theme.colors.textInverse,
      marginBottom: 8,
    },
    heroSubtitle: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
    },
    tabContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 20,
      marginHorizontal: 6,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      ...Platform.select({
        web: {
          backdropFilter: 'blur(10px)',
        },
      }),
    },
    tabActive: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.8)',
    },
    tabTextActive: {
      color: theme.colors.primary,
    },
    statsSection: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -8,
    },
    statCard: {
      width: isTablet ? '25%' : '50%',
      paddingHorizontal: 8,
      marginBottom: 16,
    },
    statCardInner: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      ...Platform.select({
        web: {
          backdropFilter: 'blur(20px)',
        },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    statEmoji: {
      fontSize: 28,
      marginBottom: 8,
    },
    statNumber: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    activitySection: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.textInverse,
      marginBottom: 16,
    },
    activityCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      ...Platform.select({
        web: {
          backdropFilter: 'blur(20px)',
        },
      }),
    },
    activityHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    activityType: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    activityTime: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    activityDescription: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
    },
    featuresSection: {
      paddingHorizontal: 20,
    },
    featuresGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -8,
    },
    featureCardWrapper: {
      width: isTablet ? '50%' : '100%', // 2 columns on desktop/tablet, 1 on mobile
      paddingHorizontal: 8,
      marginBottom: 16,
    },
    featureCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      minHeight: 180, // CRITICAL: Standardized card height
      ...Platform.select({
        web: {
          backdropFilter: 'blur(20px)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
        },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    featureCardSelected: {
      backgroundColor: 'rgba(255, 255, 255, 1)',
      borderColor: theme.colors.primary,
      borderWidth: 2,
    },
    featureHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    featureIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    featureIcon: {
      fontSize: 24,
    },
    featureBadge: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    featureBadgeText: {
      color: theme.colors.textInverse,
      fontSize: 10,
      fontWeight: '700',
    },
    featureName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    featureDescription: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginBottom: 12,
      minHeight: 36, // Ensure consistent height
    },
    featureFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginTop: 12,
    },
    featureCount: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    featureCountLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    featureAction: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,
    },
    loadingContent: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      padding: 24,
      borderRadius: 16,
      alignItems: 'center',
      ...Platform.select({
        web: {
          backdropFilter: 'blur(10px)',
        },
      }),
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: theme.colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onGoBack || (() => navigation?.goBack())}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>RBAC Management</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FFFFFF"
                colors={[theme.colors.primary]}
              />
            }
          >
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <Text style={styles.heroTitle}>Access Control Center</Text>
              <Text style={styles.heroSubtitle}>
                Manage roles, permissions, and user access
              </Text>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
                onPress={() => setActiveTab('overview')}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === 'overview' && styles.tabTextActive
                ]}>
                  Overview
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'management' && styles.tabActive]}
                onPress={() => setActiveTab('management')}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === 'management' && styles.tabTextActive
                ]}>
                  Management
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'overview' ? (
              <>
                {/* Stats Grid */}
                <View style={styles.statsSection}>
                  <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                      <View style={styles.statCardInner}>
                        <Text style={styles.statEmoji}>👥</Text>
                        <Text style={styles.statNumber}>{rbacStats.totalUsers}</Text>
                        <Text style={styles.statLabel}>Total Users</Text>
                      </View>
                    </View>
                    <View style={styles.statCard}>
                      <View style={styles.statCardInner}>
                        <Text style={styles.statEmoji}>🛡️</Text>
                        <Text style={styles.statNumber}>{rbacStats.activeRoles}</Text>
                        <Text style={styles.statLabel}>Active Roles</Text>
                      </View>
                    </View>
                    <View style={styles.statCard}>
                      <View style={styles.statCardInner}>
                        <Text style={styles.statEmoji}>🔑</Text>
                        <Text style={styles.statNumber}>{rbacStats.totalPermissions}</Text>
                        <Text style={styles.statLabel}>Permissions</Text>
                      </View>
                    </View>
                    <View style={styles.statCard}>
                      <View style={styles.statCardInner}>
                        <Text style={styles.statEmoji}>⏳</Text>
                        <Text style={[styles.statNumber, { color: theme.colors.warning }]}>
                          {rbacStats.pendingApprovals}
                        </Text>
                        <Text style={styles.statLabel}>Pending</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Recent Activity */}
                <View style={styles.activitySection}>
                  <Text style={styles.sectionTitle}>Recent Activity</Text>
                  {rbacStats.recentActivity.map((activity, index) => (
                    <View key={index} style={styles.activityCard}>
                      <View style={styles.activityHeader}>
                        <Text style={[
                          styles.activityType,
                          { color: getStatusColor(activity.status) }
                        ]}>
                          {activity.type.replace('_', ' ')}
                        </Text>
                        <Text style={styles.activityTime}>{activity.timestamp}</Text>
                      </View>
                      <Text style={styles.activityDescription}>
                        {activity.description}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <>
                {/* Management Features Grid */}
                <View style={styles.featuresSection}>
                  <Text style={styles.sectionTitle}>Management Tools</Text>
                  <View style={styles.featuresGrid}>
                    {rbacFeatures.map((feature) => (
                      <View key={feature.id} style={styles.featureCardWrapper}>
                        <TouchableOpacity
                          style={[
                            styles.featureCard,
                            selectedFeature === feature.id && styles.featureCardSelected,
                          ]}
                          onPress={() => handleFeatureSelect(feature.id)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.featureHeader}>
                            <View style={styles.featureIconContainer}>
                              <Text style={styles.featureIcon}>{feature.icon}</Text>
                            </View>
                            {feature.badge && (
                              <View style={[
                                styles.featureBadge,
                                feature.color && { backgroundColor: feature.color },
                              ]}>
                                <Text style={styles.featureBadgeText}>{feature.badge}</Text>
                              </View>
                            )}
                          </View>

                          <Text style={styles.featureName}>{feature.name}</Text>
                          <Text style={styles.featureDescription}>{feature.description}</Text>

                          <View style={styles.featureFooter}>
                            {feature.count !== undefined ? (
                              <View>
                                <Text style={styles.featureCount}>{feature.count}</Text>
                                <Text style={styles.featureCountLabel}>Total</Text>
                              </View>
                            ) : (
                              <View />
                            )}
                            <Text style={styles.featureAction}>Manage →</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          {/* Loading Overlay */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingContent}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading RBAC data...</Text>
              </View>
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

export default ModernRBACManagementScreen;