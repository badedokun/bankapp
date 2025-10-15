/**
 * CBN Compliance Dashboard Screen
 * Central Bank of Nigeria regulatory compliance monitoring and management
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

interface CBNComplianceData {
  overallStatus: 'compliant' | 'non_compliant' | 'pending_review' | 'needs_attention';
  complianceScore: number;
  lastAssessment: string;
  nextAssessmentDue: string;
  requirements: Array<{
    id: string;
    name: string;
    status: 'compliant' | 'non_compliant' | 'in_progress';
    lastUpdated: string;
    description: string;
  }>;
  incidents: Array<{
    id: string;
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'reported' | 'investigating' | 'resolved';
    reportedAt: string;
    cbnReportingDeadline: string;
  }>;
  dataLocalization: {
    compliant: boolean;
    dataLocations: Array<{
      dataType: string;
      location: string;
      compliant: boolean;
    }>;
  };
  auditTrail: {
    totalEvents: number;
    lastEvent: string;
  };
}

interface IncidentReport {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedSystems: string[];
  customerImpact: boolean;
}

export interface CBNComplianceScreenProps {
  onNavigateToIncidents?: () => void;
  onNavigateToAuditLog?: () => void;
  onNavigateToDataLocalization?: () => void;
}

export const CBNComplianceScreen: React.FC<CBNComplianceScreenProps> = ({
  onNavigateToIncidents,
  onNavigateToAuditLog,
  onNavigateToDataLocalization,
}) => {
  const { currentTenant } = useTenant();
  const theme = useTenantTheme();
  const { showAlert } = useBankingAlert();
  
  // State
  const [complianceData, setComplianceData] = useState<CBNComplianceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentReport, setIncidentReport] = useState<IncidentReport>({
    type: '',
    description: '',
    severity: 'medium',
    affectedSystems: [],
    customerImpact: false,
  });

  // Load compliance data
  const loadComplianceData = useCallback(async () => {
    try {
      const [dashboardData, incidentsData, dataLocalizationData] = await Promise.all([
        APIService.getCBNComplianceDashboard(),
        APIService.getCBNIncidents({ page: 1, limit: 10 }),
        APIService.checkDataLocalization(),
      ]);

      setComplianceData({
        overallStatus: dashboardData.overallStatus,
        complianceScore: dashboardData.complianceScore,
        lastAssessment: dashboardData.lastAssessment,
        nextAssessmentDue: dashboardData.nextAssessmentDue,
        requirements: dashboardData.requirements || [],
        incidents: incidentsData.incidents || [],
        dataLocalization: dataLocalizationData,
        auditTrail: dashboardData.auditTrail || { totalEvents: 0, lastEvent: 'N/A' },
      });
    } catch (error) {
      console.error('Failed to load CBN compliance data:', error);
      showAlert('Error', 'Failed to load CBN compliance data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadComplianceData();
  }, [loadComplianceData]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadComplianceData();
  }, [loadComplianceData]);

  // Report incident handler
  const handleReportIncident = useCallback(async () => {
    if (!incidentReport.type || !incidentReport.description) {
      showAlert('Error', 'Please fill in all required fields.');
      return;
    }

    try {
      const response = await APIService.reportCBNIncident(incidentReport);
      showAlert(
        'Incident Reported',
        `Incident reported successfully. ID: ${response.incidentId}. CBN reporting deadline: ${new Date(response.cbnReportingDeadline).toLocaleDateString()}`
      );
      setShowIncidentModal(false);
      setIncidentReport({
        type: '',
        description: '',
        severity: 'medium',
        affectedSystems: [],
        customerImpact: false,
      });
      handleRefresh();
    } catch (error) {
      showAlert('Error', 'Failed to report incident. Please try again.');
    }
  }, [incidentReport, handleRefresh]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'resolved':
        return '#22c55e';
      case 'non_compliant':
      case 'critical':
        return '#ef4444';
      case 'pending_review':
      case 'in_progress':
      case 'investigating':
        return '#f59e0b';
      case 'needs_attention':
      case 'high':
        return '#f97316';
      case 'medium':
        return '#eab308';
      case 'low':
        return '#84cc16';
      default:
        return '#6b7280';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading CBN compliance data...</Text>
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
    reportButton: {
      backgroundColor: theme.colors.error,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: 8,
    },
    reportButtonText: {
      color: theme.colors.textInverse,
      fontSize: 14,
      fontWeight: 'bold',
    },
    statusCard: {
      backgroundColor: theme.colors.surface,
      margin: theme.spacing.lg,
      borderRadius: 20,
      padding: theme.spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 4,
    },
    statusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.lg,
    },
    statusTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    statusBadge: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: 20,
    },
    statusBadgeText: {
      color: theme.colors.textInverse,
      fontSize: 12,
      fontWeight: 'bold',
    },
    scoreContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    scoreCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
    scoreText: {
      fontSize: 36,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    scoreLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    infoGrid: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    infoItem: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
      borderRadius: 12,
      alignItems: 'center',
    },
    infoValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    infoLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
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
    requirementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
    },
    requirementIcon: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: theme.spacing.md,
    },
    requirementContent: {
      flex: 1,
    },
    requirementName: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 2,
    },
    requirementDescription: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    requirementDate: {
      fontSize: 11,
      color: theme.colors.textTertiary,
    },
    incidentItem: {
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
      borderRadius: 12,
      marginBottom: theme.spacing.sm,
      borderLeftWidth: 4,
    },
    incidentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.xs,
    },
    incidentType: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    incidentSeverity: {
      fontSize: 12,
      fontWeight: 'bold',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      color: theme.colors.textInverse,
    },
    incidentDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    incidentFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    incidentDate: {
      fontSize: 12,
      color: theme.colors.textTertiary,
    },
    incidentStatus: {
      fontSize: 12,
      fontWeight: '500',
    },
    dataLocationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
    },
    dataLocationContent: {
      flex: 1,
    },
    dataType: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    dataLocation: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    complianceStatus: {
      fontSize: 12,
      fontWeight: 'bold',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
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
            <Text style={dynamicStyles.headerTitle}>🏛️ CBN Compliance</Text>
            <Text style={dynamicStyles.headerSubtitle}>
              Central Bank of Nigeria Regulatory Compliance
            </Text>
          </View>
          <TouchableOpacity
            style={dynamicStyles.reportButton}
            onPress={() => setShowIncidentModal(true)}
          >
            <Text style={dynamicStyles.reportButtonText}>Report Incident</Text>
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
        {complianceData && (
          <>
            {/* Overall Status Card */}
            <View style={dynamicStyles.statusCard}>
              <View style={dynamicStyles.statusHeader}>
                <Text style={dynamicStyles.statusTitle}>Compliance Overview</Text>
                <View style={[
                  dynamicStyles.statusBadge,
                  { backgroundColor: getStatusColor(complianceData.overallStatus) }
                ]}>
                  <Text style={dynamicStyles.statusBadgeText}>
                    {complianceData.overallStatus.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={dynamicStyles.scoreContainer}>
                <View style={dynamicStyles.scoreCircle}>
                  <Text style={dynamicStyles.scoreText}>
                    {complianceData.complianceScore}%
                  </Text>
                </View>
                <Text style={dynamicStyles.scoreLabel}>Compliance Score</Text>
              </View>

              <View style={dynamicStyles.infoGrid}>
                <View style={dynamicStyles.infoItem}>
                  <Text style={dynamicStyles.infoValue}>
                    {new Date(complianceData.lastAssessment).toLocaleDateString()}
                  </Text>
                  <Text style={dynamicStyles.infoLabel}>Last Assessment</Text>
                </View>
                <View style={dynamicStyles.infoItem}>
                  <Text style={dynamicStyles.infoValue}>
                    {new Date(complianceData.nextAssessmentDue).toLocaleDateString()}
                  </Text>
                  <Text style={dynamicStyles.infoLabel}>Next Assessment</Text>
                </View>
              </View>
            </View>

            {/* Requirements Section */}
            <View style={dynamicStyles.section}>
              <View style={dynamicStyles.sectionHeader}>
                <Text style={dynamicStyles.sectionTitle}>📋 Compliance Requirements</Text>
                <TouchableOpacity>
                  <Text style={dynamicStyles.seeAll}>View All</Text>
                </TouchableOpacity>
              </View>

              {complianceData.requirements.slice(0, 5).map((requirement) => (
                <View key={requirement.id} style={dynamicStyles.requirementItem}>
                  <View style={[
                    dynamicStyles.requirementIcon,
                    { backgroundColor: getStatusColor(requirement.status) }
                  ]} />
                  <View style={dynamicStyles.requirementContent}>
                    <Text style={dynamicStyles.requirementName}>{requirement.name}</Text>
                    <Text style={dynamicStyles.requirementDescription}>
                      {requirement.description}
                    </Text>
                    <Text style={dynamicStyles.requirementDate}>
                      Last updated: {new Date(requirement.lastUpdated).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Recent Incidents Section */}
            <View style={dynamicStyles.section}>
              <View style={dynamicStyles.sectionHeader}>
                <Text style={dynamicStyles.sectionTitle}>🚨 Recent Incidents</Text>
                <TouchableOpacity onPress={onNavigateToIncidents}>
                  <Text style={dynamicStyles.seeAll}>View All</Text>
                </TouchableOpacity>
              </View>

              {complianceData.incidents.slice(0, 3).map((incident) => (
                <View key={incident.id} style={[
                  dynamicStyles.incidentItem,
                  { borderLeftColor: getStatusColor(incident.severity) }
                ]}>
                  <View style={dynamicStyles.incidentHeader}>
                    <Text style={dynamicStyles.incidentType}>{incident.type}</Text>
                    <Text style={[
                      dynamicStyles.incidentSeverity,
                      { backgroundColor: getStatusColor(incident.severity) }
                    ]}>
                      {incident.severity.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={dynamicStyles.incidentDescription}>
                    {incident.description}
                  </Text>
                  <View style={dynamicStyles.incidentFooter}>
                    <Text style={dynamicStyles.incidentDate}>
                      {new Date(incident.reportedAt).toLocaleDateString()}
                    </Text>
                    <Text style={[
                      dynamicStyles.incidentStatus,
                      { color: getStatusColor(incident.status) }
                    ]}>
                      {incident.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
              ))}

              {complianceData.incidents.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xl }}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 16 }}>✅ No recent incidents</Text>
                  <Text style={{ color: theme.colors.textTertiary, fontSize: 14, marginTop: 4 }}>
                    All systems operating normally
                  </Text>
                </View>
              )}
            </View>

            {/* Data Localization Section */}
            <View style={dynamicStyles.section}>
              <View style={dynamicStyles.sectionHeader}>
                <Text style={dynamicStyles.sectionTitle}>🇳🇬 Data Localization</Text>
                <TouchableOpacity onPress={onNavigateToDataLocalization}>
                  <Text style={dynamicStyles.seeAll}>Details</Text>
                </TouchableOpacity>
              </View>

              {complianceData.dataLocalization.dataLocations.map((location, index) => (
                <View key={index} style={dynamicStyles.dataLocationItem}>
                  <View style={dynamicStyles.dataLocationContent}>
                    <Text style={dynamicStyles.dataType}>{location.dataType}</Text>
                    <Text style={dynamicStyles.dataLocation}>{location.location}</Text>
                  </View>
                  <Text style={[
                    dynamicStyles.complianceStatus,
                    {
                      backgroundColor: location.compliant ? '#22c55e' : '#ef4444',
                      color: theme.colors.textInverse,
                    }
                  ]}>
                    {location.compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                  </Text>
                </View>
              ))}
            </View>

            {/* Audit Trail Summary */}
            <View style={dynamicStyles.section}>
              <View style={dynamicStyles.sectionHeader}>
                <Text style={dynamicStyles.sectionTitle}>📊 Audit Trail</Text>
                <TouchableOpacity onPress={onNavigateToAuditLog}>
                  <Text style={dynamicStyles.seeAll}>View Log</Text>
                </TouchableOpacity>
              </View>

              <View style={dynamicStyles.infoGrid}>
                <View style={dynamicStyles.infoItem}>
                  <Text style={dynamicStyles.infoValue}>
                    {complianceData.auditTrail.totalEvents.toLocaleString()}
                  </Text>
                  <Text style={dynamicStyles.infoLabel}>Total Events</Text>
                </View>
                <View style={dynamicStyles.infoItem}>
                  <Text style={dynamicStyles.infoValue}>
                    {complianceData.auditTrail.lastEvent !== 'N/A' 
                      ? new Date(complianceData.auditTrail.lastEvent).toLocaleDateString()
                      : 'N/A'
                    }
                  </Text>
                  <Text style={dynamicStyles.infoLabel}>Last Event</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Incident Reporting Modal */}
      <Modal
        visible={showIncidentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowIncidentModal(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={dynamicStyles.modalHeader}>
                <Text style={dynamicStyles.modalTitle}>Report CBN Incident</Text>
                <TouchableOpacity
                  style={dynamicStyles.modalCloseButton}
                  onPress={() => setShowIncidentModal(false)}
                >
                  <Text style={dynamicStyles.modalCloseText}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={dynamicStyles.formGroup}>
                <Text style={dynamicStyles.formLabel}>Incident Type *</Text>
                <TextInput
                  style={dynamicStyles.formInput}
                  value={incidentReport.type}
                  onChangeText={(text) => setIncidentReport(prev => ({ ...prev, type: text }))}
                  placeholder="e.g., Data Breach, System Outage, Cyber Attack"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={dynamicStyles.formGroup}>
                <Text style={dynamicStyles.formLabel}>Description *</Text>
                <TextInput
                  style={[dynamicStyles.formInput, dynamicStyles.formTextArea]}
                  value={incidentReport.description}
                  onChangeText={(text) => setIncidentReport(prev => ({ ...prev, description: text }))}
                  placeholder="Detailed description of the incident..."
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
                          backgroundColor: incidentReport.severity === severity ? getStatusColor(severity) : '#ffffff',
                          borderColor: getStatusColor(severity),
                        }
                      ]}
                      onPress={() => setIncidentReport(prev => ({ ...prev, severity }))}
                    >
                      <Text style={[
                        dynamicStyles.severityButtonText,
                        {
                          color: incidentReport.severity === severity ? theme.colors.textInverse : getStatusColor(severity)
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
                  onPress={() => setShowIncidentModal(false)}
                >
                  <Text style={dynamicStyles.modalButtonTextSecondary}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                  onPress={handleReportIncident}
                >
                  <Text style={dynamicStyles.modalButtonTextPrimary}>Report Incident</Text>
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

export default CBNComplianceScreen;