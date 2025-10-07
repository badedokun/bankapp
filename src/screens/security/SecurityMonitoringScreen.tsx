/**
 * Security Monitoring (SIEM) Dashboard Screen
 * Security Information and Event Management with real-time monitoring
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
  Dimensions,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useTenant, useTenantTheme } from '../../tenants/TenantContext';
import { useBankingAlert } from '../../services/AlertService';
import APIService from '../../services/api';

const { width: screenWidth } = Dimensions.get('window');

interface SecurityAlert {
  id: string;
  alertType: 'fraud_attempt' | 'intrusion_detection' | 'anomaly' | 'policy_violation' | 'vulnerability';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  detectedAt: string;
  affectedAssets: string[];
  source: string;
  riskScore: number;
}

interface SecurityEvent {
  id: string;
  eventType: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  timestamp: string;
  metadata?: any;
}

interface ThreatIndicator {
  type: 'ip_address' | 'domain' | 'hash' | 'email';
  value: string;
  threatType: string;
  confidence: number;
  lastSeen: string;
  blocked: boolean;
}

interface SecurityMetrics {
  totalEvents: number;
  totalAlerts: number;
  criticalAlerts: number;
  resolvedAlerts: number;
  averageResponseTime: string;
  systemUptime: number;
  threatDetectionRate: number;
  falsePositiveRate: number;
}

interface SecurityMonitoringData {
  status: 'operational' | 'degraded' | 'critical';
  metrics: SecurityMetrics;
  recentAlerts: SecurityAlert[];
  recentEvents: SecurityEvent[];
  threatIndicators: ThreatIndicator[];
  networkSegments: Array<{
    id: string;
    name: string;
    status: 'secure' | 'monitoring' | 'alert';
    deviceCount: number;
    lastScanned: string;
  }>;
}

interface NewSecurityEvent {
  eventType: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
}

export interface SecurityMonitoringScreenProps {
  onNavigateToAlerts?: () => void;
  onNavigateToEvents?: () => void;
  onNavigateToThreatIntel?: () => void;
}

export const SecurityMonitoringScreen: React.FC<SecurityMonitoringScreenProps> = ({
  onNavigateToAlerts,
  onNavigateToEvents,
  onNavigateToThreatIntel,
}) => {
  const { currentTenant } = useTenant();
  const theme = useTenantTheme();
  const { showAlert } = useBankingAlert();
  
  // State
  const [monitoringData, setMonitoringData] = useState<SecurityMonitoringData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState<NewSecurityEvent>({
    eventType: '',
    description: '',
    severity: 'medium',
    source: 'manual',
  });

  // Load monitoring data
  const loadMonitoringData = useCallback(async () => {
    try {
      const [dashboardData, alertsData, auditData] = await Promise.all([
        APIService.getSecurityMonitoringDashboard(),
        APIService.getSecurityAlerts({ page: 1, limit: 10 }),
        APIService.getAuditTrail({ page: 1, limit: 20 }),
      ]);

      // Transform audit events to security events
      const securityEvents = auditData.events.map((event: any) => ({
        id: event.id,
        eventType: event.eventType || 'system_event',
        description: event.description || 'System event logged',
        severity: event.severity || 'low',
        source: event.source || 'system',
        timestamp: event.timestamp,
        metadata: event.metadata,
      }));

      setMonitoringData({
        status: dashboardData.status || 'operational',
        metrics: dashboardData.metrics || {
          totalEvents: securityEvents.length,
          totalAlerts: alertsData.alerts.length,
          criticalAlerts: alertsData.alerts.filter((a: any) => a.severity === 'critical').length,
          resolvedAlerts: alertsData.alerts.filter((a: any) => a.status === 'resolved').length,
          averageResponseTime: '15 minutes',
          systemUptime: 99.97,
          threatDetectionRate: 98.5,
          falsePositiveRate: 2.1,
        },
        recentAlerts: alertsData.alerts || [],
        recentEvents: securityEvents,
        threatIndicators: dashboardData.threatIndicators || [],
        networkSegments: dashboardData.networkSegments || [],
      });
    } catch (error) {
      console.error('Failed to load security monitoring data:', error);
      showAlert('Error', 'Failed to load security monitoring data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadMonitoringData();
    
    // Set up auto-refresh every 30 seconds for real-time monitoring
    const interval = setInterval(loadMonitoringData, 30000);
    return () => clearInterval(interval);
  }, [loadMonitoringData]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadMonitoringData();
  }, [loadMonitoringData]);

  // Log security event handler
  const handleLogEvent = useCallback(async () => {
    if (!newEvent.eventType || !newEvent.description) {
      showAlert('Error', 'Please fill in all required fields.');
      return;
    }

    try {
      const response = await APIService.logSecurityEvent(newEvent);
      showAlert('Event Logged', `Security event logged successfully. ID: ${response.eventId}`);
      setShowEventModal(false);
      setNewEvent({
        eventType: '',
        description: '',
        severity: 'medium',
        source: 'manual',
      });
      handleRefresh();
    } catch (error) {
      showAlert('Error', 'Failed to log security event. Please try again.');
    }
  }, [newEvent, handleRefresh]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
      case 'secure':
      case 'resolved':
        return '#22c55e';
      case 'critical':
      case 'alert':
        return '#ef4444';
      case 'degraded':
      case 'monitoring':
      case 'investigating':
        return '#f59e0b';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#eab308';
      case 'low':
        return '#84cc16';
      case 'false_positive':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '📋';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading security monitoring...</Text>
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
      backgroundColor: theme.colors.surface,
      
      marginLeft: 20,
      marginRight: 20,
      marginTop: 0,
      marginBottom: 0,
      borderRadius: 12,
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
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
    },
    headerSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    statusIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginRight: theme.spacing.md,
    },
    statusDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    statusText: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    logEventButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: 8,
    },
    logEventButtonText: {
      color: theme.colors.textInverse,
      fontSize: 14,
      fontWeight: 'bold',
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    metricCard: {
      width: (screenWidth - theme.spacing.lg * 2 - theme.spacing.md) / 2,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.lg,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    metricValue: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    metricLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    section: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      borderRadius: 20,
      padding: theme.spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 4,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    seeAll: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    alertItem: {
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
      borderRadius: 12,
      marginBottom: theme.spacing.sm,
      borderLeftWidth: 4,
    },
    alertHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.xs,
    },
    alertTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    alertSeverity: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    severityText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.colors.textInverse,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    alertDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    alertFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    alertTime: {
      fontSize: 12,
      color: theme.colors.textTertiary,
    },
    alertStatus: {
      fontSize: 12,
      fontWeight: '500',
    },
    eventItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
    },
    eventIcon: {
      fontSize: 20,
      marginRight: theme.spacing.md,
    },
    eventContent: {
      flex: 1,
    },
    eventType: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 2,
    },
    eventDescription: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    eventTime: {
      fontSize: 11,
      color: theme.colors.textTertiary,
      marginLeft: theme.spacing.md,
    },
    threatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
    },
    threatContent: {
      flex: 1,
    },
    threatType: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    threatValue: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    threatActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    confidenceScore: {
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    blockedBadge: {
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.colors.textInverse,
      backgroundColor: theme.colors.error,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    networkSegmentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
    },
    segmentContent: {
      flex: 1,
    },
    segmentName: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 2,
    },
    segmentInfo: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    segmentStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    segmentStatusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    segmentStatusText: {
      fontSize: 12,
      fontWeight: '500',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      width: screenWidth - 40,
      maxHeight: '80%',
      borderRadius: 20,
      padding: theme.spacing.lg,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.lg,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    modalCloseButton: {
      padding: theme.spacing.sm,
    },
    modalCloseText: {
      fontSize: 24,
      color: theme.colors.textSecondary,
    },
    formGroup: {
      marginBottom: theme.spacing.lg,
    },
    formLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    formInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: 16,
      backgroundColor: theme.colors.background,
    },
    formTextArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    severityButtons: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    severityButton: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
    },
    severityButtonText: {
      fontSize: 14,
      fontWeight: '500',
    },
    modalActions: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    modalButton: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: 8,
      alignItems: 'center',
    },
    modalButtonPrimary: {
      backgroundColor: theme.colors.primary,
    },
    modalButtonSecondary: {
      backgroundColor: theme.colors.background,
    },
    modalButtonTextPrimary: {
      color: theme.colors.textInverse,
      fontSize: 16,
      fontWeight: 'bold',
    },
    modalButtonTextSecondary: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '500',
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={dynamicStyles.header}>
        <View style={dynamicStyles.headerContent}>
          <View style={{ flex: 1 }}>
            <Text style={dynamicStyles.headerTitle}>🛡️ Security Monitoring</Text>
            <Text style={dynamicStyles.headerSubtitle}>
              Real-time SIEM Dashboard & Threat Detection
            </Text>
          </View>
          <View style={dynamicStyles.statusIndicator}>
            <View style={[
              dynamicStyles.statusDot,
              { backgroundColor: getStatusColor(monitoringData?.status || 'operational') }
            ]} />
            <Text style={[
              dynamicStyles.statusText,
              { color: getStatusColor(monitoringData?.status || 'operational') }
            ]}>
              {(monitoringData?.status || 'operational').toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity
            style={dynamicStyles.logEventButton}
            onPress={() => setShowEventModal(true)}
          >
            <Text style={dynamicStyles.logEventButtonText}>Log Event</Text>
          </TouchableOpacity>
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
        {monitoringData && (
          <>
            {/* Metrics Grid */}
            <View style={dynamicStyles.metricsGrid}>
              <View style={dynamicStyles.metricCard}>
                <Text style={dynamicStyles.metricValue}>
                  {monitoringData.metrics.totalAlerts}
                </Text>
                <Text style={dynamicStyles.metricLabel}>Total Alerts</Text>
              </View>
              <View style={dynamicStyles.metricCard}>
                <Text style={[dynamicStyles.metricValue, { color: theme.colors.error }]}>
                  {monitoringData.metrics.criticalAlerts}
                </Text>
                <Text style={dynamicStyles.metricLabel}>Critical Alerts</Text>
              </View>
              <View style={dynamicStyles.metricCard}>
                <Text style={dynamicStyles.metricValue}>
                  {monitoringData.metrics.systemUptime}%
                </Text>
                <Text style={dynamicStyles.metricLabel}>System Uptime</Text>
              </View>
              <View style={dynamicStyles.metricCard}>
                <Text style={dynamicStyles.metricValue}>
                  {monitoringData.metrics.averageResponseTime}
                </Text>
                <Text style={dynamicStyles.metricLabel}>Avg Response Time</Text>
              </View>
            </View>

            {/* Recent Alerts Section */}
            <View style={dynamicStyles.section}>
              <View style={dynamicStyles.sectionHeader}>
                <Text style={dynamicStyles.sectionTitle}>🚨 Recent Alerts</Text>
                <TouchableOpacity onPress={onNavigateToAlerts}>
                  <Text style={dynamicStyles.seeAll}>View All</Text>
                </TouchableOpacity>
              </View>

              {monitoringData.recentAlerts.slice(0, 3).map((alert) => (
                <View key={alert.id} style={[
                  dynamicStyles.alertItem,
                  { borderLeftColor: getStatusColor(alert.severity) }
                ]}>
                  <View style={dynamicStyles.alertHeader}>
                    <Text style={dynamicStyles.alertTitle}>{alert.title}</Text>
                    <View style={dynamicStyles.alertSeverity}>
                      <Text>{getSeverityIcon(alert.severity)}</Text>
                      <Text style={[
                        dynamicStyles.severityText,
                        { backgroundColor: getStatusColor(alert.severity) }
                      ]}>
                        {alert.severity.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={dynamicStyles.alertDescription}>
                    {alert.description}
                  </Text>
                  <View style={dynamicStyles.alertFooter}>
                    <Text style={dynamicStyles.alertTime}>
                      {new Date(alert.detectedAt).toLocaleString()}
                    </Text>
                    <Text style={[
                      dynamicStyles.alertStatus,
                      { color: getStatusColor(alert.status) }
                    ]}>
                      {alert.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
              ))}

              {monitoringData.recentAlerts.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xl }}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 16 }}>✅ No recent alerts</Text>
                  <Text style={{ color: theme.colors.textTertiary, fontSize: 14, marginTop: 4 }}>
                    All systems secure
                  </Text>
                </View>
              )}
            </View>

            {/* Recent Events Section */}
            <View style={dynamicStyles.section}>
              <View style={dynamicStyles.sectionHeader}>
                <Text style={dynamicStyles.sectionTitle}>📋 Recent Events</Text>
                <TouchableOpacity onPress={onNavigateToEvents}>
                  <Text style={dynamicStyles.seeAll}>View All</Text>
                </TouchableOpacity>
              </View>

              {monitoringData.recentEvents.slice(0, 5).map((event) => (
                <View key={event.id} style={dynamicStyles.eventItem}>
                  <Text style={dynamicStyles.eventIcon}>
                    {getSeverityIcon(event.severity)}
                  </Text>
                  <View style={dynamicStyles.eventContent}>
                    <Text style={dynamicStyles.eventType}>{event.eventType}</Text>
                    <Text style={dynamicStyles.eventDescription}>
                      {event.description}
                    </Text>
                  </View>
                  <Text style={dynamicStyles.eventTime}>
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              ))}
            </View>

            {/* Network Segments Section */}
            {monitoringData.networkSegments.length > 0 && (
              <View style={dynamicStyles.section}>
                <View style={dynamicStyles.sectionHeader}>
                  <Text style={dynamicStyles.sectionTitle}>🌐 Network Segments</Text>
                  <TouchableOpacity>
                    <Text style={dynamicStyles.seeAll}>Details</Text>
                  </TouchableOpacity>
                </View>

                {monitoringData.networkSegments.map((segment) => (
                  <View key={segment.id} style={dynamicStyles.networkSegmentItem}>
                    <View style={dynamicStyles.segmentContent}>
                      <Text style={dynamicStyles.segmentName}>{segment.name}</Text>
                      <Text style={dynamicStyles.segmentInfo}>
                        {segment.deviceCount} devices • Last scanned: {new Date(segment.lastScanned).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={dynamicStyles.segmentStatus}>
                      <View style={[
                        dynamicStyles.segmentStatusDot,
                        { backgroundColor: getStatusColor(segment.status) }
                      ]} />
                      <Text style={[
                        dynamicStyles.segmentStatusText,
                        { color: getStatusColor(segment.status) }
                      ]}>
                        {segment.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Threat Intelligence Section */}
            {monitoringData.threatIndicators.length > 0 && (
              <View style={dynamicStyles.section}>
                <View style={dynamicStyles.sectionHeader}>
                  <Text style={dynamicStyles.sectionTitle}>⚠️ Threat Intelligence</Text>
                  <TouchableOpacity onPress={onNavigateToThreatIntel}>
                    <Text style={dynamicStyles.seeAll}>View All</Text>
                  </TouchableOpacity>
                </View>

                {monitoringData.threatIndicators.slice(0, 3).map((threat, index) => (
                  <View key={index} style={dynamicStyles.threatItem}>
                    <View style={dynamicStyles.threatContent}>
                      <Text style={dynamicStyles.threatType}>
                        {threat.threatType} ({threat.type})
                      </Text>
                      <Text style={dynamicStyles.threatValue}>{threat.value}</Text>
                    </View>
                    <View style={dynamicStyles.threatActions}>
                      <Text style={dynamicStyles.confidenceScore}>
                        {threat.confidence}%
                      </Text>
                      {threat.blocked && (
                        <Text style={dynamicStyles.blockedBadge}>BLOCKED</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Security Event Logging Modal */}
      <Modal
        visible={showEventModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={dynamicStyles.modalHeader}>
                <Text style={dynamicStyles.modalTitle}>Log Security Event</Text>
                <TouchableOpacity
                  style={dynamicStyles.modalCloseButton}
                  onPress={() => setShowEventModal(false)}
                >
                  <Text style={dynamicStyles.modalCloseText}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={dynamicStyles.formGroup}>
                <Text style={dynamicStyles.formLabel}>Event Type *</Text>
                <TextInput
                  style={dynamicStyles.formInput}
                  value={newEvent.eventType}
                  onChangeText={(text) => setNewEvent(prev => ({ ...prev, eventType: text }))}
                  placeholder="e.g., login_attempt, data_access, system_alert"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={dynamicStyles.formGroup}>
                <Text style={dynamicStyles.formLabel}>Description *</Text>
                <TextInput
                  style={[dynamicStyles.formInput, dynamicStyles.formTextArea]}
                  value={newEvent.description}
                  onChangeText={(text) => setNewEvent(prev => ({ ...prev, description: text }))}
                  placeholder="Detailed description of the security event..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={dynamicStyles.formGroup}>
                <Text style={dynamicStyles.formLabel}>Severity Level</Text>
                <View style={dynamicStyles.severityButtons}>
                  {(['low', 'medium', 'high', 'critical'] as const).map((severity) => (
                    <TouchableOpacity
                      key={severity}
                      style={[
                        dynamicStyles.severityButton,
                        {
                          backgroundColor: newEvent.severity === severity ? getStatusColor(severity) : '#ffffff',
                          borderColor: getStatusColor(severity),
                        }
                      ]}
                      onPress={() => setNewEvent(prev => ({ ...prev, severity }))}
                    >
                      <Text style={[
                        dynamicStyles.severityButtonText,
                        {
                          color: newEvent.severity === severity ? theme.colors.textInverse : getStatusColor(severity)
                        }
                      ]}>
                        {severity.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={dynamicStyles.modalActions}>
                <TouchableOpacity
                  style={[dynamicStyles.modalButton, dynamicStyles.modalButtonSecondary]}
                  onPress={() => setShowEventModal(false)}
                >
                  <Text style={dynamicStyles.modalButtonTextSecondary}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                  onPress={handleLogEvent}
                >
                  <Text style={dynamicStyles.modalButtonTextPrimary}>Log Event</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
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

export default SecurityMonitoringScreen;