/**
 * PCI DSS Compliance Dashboard Screen
 * Payment Card Industry Data Security Standard compliance monitoring and management
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

interface PCIDSSRequirement {
  id: string;
  number: string;
  name: string;
  description: string;
  status: 'compliant' | 'non_compliant' | 'not_applicable' | 'compensating_control';
  lastAssessed: string;
  nextDue: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface PCIDSSAssessment {
  id: string;
  assessmentType: 'self' | 'external';
  status: 'planned' | 'in_progress' | 'completed' | 'overdue';
  scope: string;
  plannedDate: string;
  completedDate?: string;
  assessor?: string;
}

interface VulnerabilityScan {
  id: string;
  scanType: 'external' | 'internal';
  scanDate: string;
  status: 'passed' | 'failed' | 'pending';
  findings: Array<{
    vulnerability: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'resolved' | 'mitigated';
  }>;
}

interface PCIDSSComplianceData {
  overallStatus: 'compliant' | 'non_compliant' | 'pending_assessment';
  complianceScore: number;
  level: '1' | '2' | '3' | '4';
  lastAssessment: string;
  nextAssessmentDue: string;
  requirements: PCIDSSRequirement[];
  assessments: PCIDSSAssessment[];
  vulnerabilityScans: VulnerabilityScan[];
  networkSegmentation: {
    status: 'compliant' | 'non_compliant';
    lastValidated: string;
    segmentCount: number;
  };
}

interface NewAssessment {
  assessmentType: 'self' | 'external';
  scope: string;
  plannedDate: string;
}

export interface PCIDSSComplianceScreenProps {
  onNavigateToRequirements?: () => void;
  onNavigateToAssessments?: () => void;
  onNavigateToScans?: () => void;
}

export const PCIDSSComplianceScreen: React.FC<PCIDSSComplianceScreenProps> = ({
  onNavigateToRequirements,
  onNavigateToAssessments,
  onNavigateToScans,
}) => {
  const { currentTenant } = useTenant();
  const theme = useTenantTheme();
  const { showAlert } = useBankingAlert();
  
  // State
  const [complianceData, setComplianceData] = useState<PCIDSSComplianceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [newAssessment, setNewAssessment] = useState<NewAssessment>({
    assessmentType: 'self',
    scope: '',
    plannedDate: '',
  });

  // Load compliance data
  const loadComplianceData = useCallback(async () => {
    try {
      const [dashboardData, assessmentsData, scansData] = await Promise.all([
        APIService.getPCIDSSComplianceDashboard(),
        APIService.getPCIDSSAssessments(),
        APIService.getVulnerabilityScans(),
      ]);

      setComplianceData({
        overallStatus: dashboardData.overallStatus,
        complianceScore: dashboardData.complianceScore,
        level: dashboardData.level,
        lastAssessment: dashboardData.lastAssessment,
        nextAssessmentDue: dashboardData.nextAssessmentDue,
        requirements: dashboardData.requirements || [],
        assessments: assessmentsData.assessments || [],
        vulnerabilityScans: scansData.scans || [],
        networkSegmentation: dashboardData.networkSegmentation || {
          status: 'compliant',
          lastValidated: new Date().toISOString(),
          segmentCount: 0
        },
      });
    } catch (error) {
      console.error('Failed to load PCI DSS compliance data:', error);
      showAlert('Error', 'Failed to load PCI DSS compliance data. Please try again.');
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

  // Create assessment handler
  const handleCreateAssessment = useCallback(async () => {
    if (!newAssessment.scope || !newAssessment.plannedDate) {
      showAlert('Error', 'Please fill in all required fields.');
      return;
    }

    try {
      const response = await APIService.createPCIDSSAssessment(newAssessment);
      showAlert(
        'Assessment Created',
        `Assessment created successfully. ID: ${response.assessmentId}`
      );
      setShowAssessmentModal(false);
      setNewAssessment({
        assessmentType: 'self',
        scope: '',
        plannedDate: '',
      });
      handleRefresh();
    } catch (error) {
      showAlert('Error', 'Failed to create assessment. Please try again.');
    }
  }, [newAssessment, handleRefresh]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'passed':
      case 'resolved':
      case 'completed':
        return '#22c55e';
      case 'non_compliant':
      case 'failed':
      case 'critical':
      case 'overdue':
        return '#ef4444';
      case 'pending_assessment':
      case 'pending':
      case 'in_progress':
      case 'planned':
        return '#f59e0b';
      case 'not_applicable':
      case 'compensating_control':
        return '#6b7280';
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

  // Get level badge color
  const getLevelColor = (level: string) => {
    switch (level) {
      case '1': return '#ef4444'; // Level 1 - Most stringent
      case '2': return '#f97316';
      case '3': return '#eab308';
      case '4': return '#22c55e';
      default: return '#6b7280';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading PCI DSS compliance data...</Text>
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
    assessButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: 8,
    },
    assessButtonText: {
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
    statusBadges: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
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
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
      borderRadius: 12,
      marginBottom: theme.spacing.sm,
      borderLeftWidth: 4,
    },
    requirementHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.xs,
    },
    requirementNumber: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    requirementStatus: {
      fontSize: 12,
      fontWeight: 'bold',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      color: theme.colors.textInverse,
    },
    requirementName: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    requirementDescription: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    requirementDate: {
      fontSize: 11,
      color: theme.colors.textTertiary,
    },
    assessmentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
    },
    assessmentContent: {
      flex: 1,
    },
    assessmentType: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 2,
    },
    assessmentScope: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    assessmentDate: {
      fontSize: 12,
      color: theme.colors.textTertiary,
    },
    assessmentStatus: {
      fontSize: 12,
      fontWeight: 'bold',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    scanItem: {
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
      borderRadius: 12,
      marginBottom: theme.spacing.sm,
    },
    scanHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    scanType: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    scanStatus: {
      fontSize: 12,
      fontWeight: 'bold',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      color: theme.colors.textInverse,
    },
    scanDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
    },
    findingsSummary: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    findingBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      minWidth: 50,
      alignItems: 'center',
    },
    findingCount: {
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.colors.textInverse,
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
    typeButtons: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    typeButton: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
    },
    typeButtonText: {
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
            <Text style={dynamicStyles.headerTitle}>💳 PCI DSS Compliance</Text>
            <Text style={dynamicStyles.headerSubtitle}>
              Payment Card Industry Data Security Standard
            </Text>
          </View>
          <TouchableOpacity
            style={dynamicStyles.assessButton}
            onPress={() => setShowAssessmentModal(true)}
          >
            <Text style={dynamicStyles.assessButtonText}>New Assessment</Text>
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
                <View style={dynamicStyles.statusBadges}>
                  <View style={[
                    dynamicStyles.statusBadge,
                    { backgroundColor: getLevelColor(complianceData.level) }
                  ]}>
                    <Text style={dynamicStyles.statusBadgeText}>
                      LEVEL {complianceData.level}
                    </Text>
                  </View>
                  <View style={[
                    dynamicStyles.statusBadge,
                    { backgroundColor: getStatusColor(complianceData.overallStatus) }
                  ]}>
                    <Text style={dynamicStyles.statusBadgeText}>
                      {complianceData.overallStatus.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
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
                <Text style={dynamicStyles.sectionTitle}>📋 Key Requirements</Text>
                <TouchableOpacity onPress={onNavigateToRequirements}>
                  <Text style={dynamicStyles.seeAll}>View All 12</Text>
                </TouchableOpacity>
              </View>

              {complianceData.requirements.slice(0, 4).map((requirement) => (
                <View key={requirement.id} style={[
                  dynamicStyles.requirementItem,
                  { borderLeftColor: getStatusColor(requirement.status) }
                ]}>
                  <View style={dynamicStyles.requirementHeader}>
                    <Text style={dynamicStyles.requirementNumber}>
                      Requirement {requirement.number}
                    </Text>
                    <Text style={[
                      dynamicStyles.requirementStatus,
                      { backgroundColor: getStatusColor(requirement.status) }
                    ]}>
                      {requirement.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                  <Text style={dynamicStyles.requirementName}>{requirement.name}</Text>
                  <Text style={dynamicStyles.requirementDescription}>
                    {requirement.description}
                  </Text>
                  <Text style={dynamicStyles.requirementDate}>
                    Last assessed: {new Date(requirement.lastAssessed).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>

            {/* Recent Assessments Section */}
            <View style={dynamicStyles.section}>
              <View style={dynamicStyles.sectionHeader}>
                <Text style={dynamicStyles.sectionTitle}>📊 Recent Assessments</Text>
                <TouchableOpacity onPress={onNavigateToAssessments}>
                  <Text style={dynamicStyles.seeAll}>View All</Text>
                </TouchableOpacity>
              </View>

              {complianceData.assessments.slice(0, 3).map((assessment) => (
                <View key={assessment.id} style={dynamicStyles.assessmentItem}>
                  <View style={dynamicStyles.assessmentContent}>
                    <Text style={dynamicStyles.assessmentType}>
                      {assessment.assessmentType === 'self' ? 'Self-Assessment' : 'External Assessment'}
                    </Text>
                    <Text style={dynamicStyles.assessmentScope}>{assessment.scope}</Text>
                    <Text style={dynamicStyles.assessmentDate}>
                      Planned: {new Date(assessment.plannedDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={[
                    dynamicStyles.assessmentStatus,
                    {
                      backgroundColor: getStatusColor(assessment.status),
                      color: theme.colors.textInverse,
                    }
                  ]}>
                    {assessment.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              ))}

              {complianceData.assessments.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xl }}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 16 }}>📝 No recent assessments</Text>
                  <Text style={{ color: theme.colors.textTertiary, fontSize: 14, marginTop: 4 }}>
                    Schedule your next assessment
                  </Text>
                </View>
              )}
            </View>

            {/* Vulnerability Scans Section */}
            <View style={dynamicStyles.section}>
              <View style={dynamicStyles.sectionHeader}>
                <Text style={dynamicStyles.sectionTitle}>🔍 Vulnerability Scans</Text>
                <TouchableOpacity onPress={onNavigateToScans}>
                  <Text style={dynamicStyles.seeAll}>View All</Text>
                </TouchableOpacity>
              </View>

              {complianceData.vulnerabilityScans.slice(0, 2).map((scan) => (
                <View key={scan.id} style={dynamicStyles.scanItem}>
                  <View style={dynamicStyles.scanHeader}>
                    <Text style={dynamicStyles.scanType}>
                      {scan.scanType === 'external' ? '🌐 External' : '🏢 Internal'} Scan
                    </Text>
                    <Text style={[
                      dynamicStyles.scanStatus,
                      { backgroundColor: getStatusColor(scan.status) }
                    ]}>
                      {scan.status.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={dynamicStyles.scanDate}>
                    {new Date(scan.scanDate).toLocaleDateString()}
                  </Text>
                  <View style={dynamicStyles.findingsSummary}>
                    {(['critical', 'high', 'medium', 'low'] as const).map((severity) => {
                      const count = scan.findings.filter(f => f.severity === severity).length;
                      if (count === 0) return null;
                      return (
                        <View key={severity} style={[
                          dynamicStyles.findingBadge,
                          { backgroundColor: getStatusColor(severity) }
                        ]}>
                          <Text style={dynamicStyles.findingCount}>
                            {count} {severity.toUpperCase()}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}

              {complianceData.vulnerabilityScans.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xl }}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 16 }}>🔍 No recent scans</Text>
                  <Text style={{ color: theme.colors.textTertiary, fontSize: 14, marginTop: 4 }}>
                    Schedule quarterly vulnerability scans
                  </Text>
                </View>
              )}
            </View>

            {/* Network Segmentation Section */}
            <View style={dynamicStyles.section}>
              <View style={dynamicStyles.sectionHeader}>
                <Text style={dynamicStyles.sectionTitle}>🛡️ Network Segmentation</Text>
                <Text style={[
                  dynamicStyles.seeAll,
                  { color: getStatusColor(complianceData.networkSegmentation.status) }
                ]}>
                  {complianceData.networkSegmentation.status.toUpperCase()}
                </Text>
              </View>

              <View style={dynamicStyles.infoGrid}>
                <View style={dynamicStyles.infoItem}>
                  <Text style={dynamicStyles.infoValue}>
                    {complianceData.networkSegmentation.segmentCount}
                  </Text>
                  <Text style={dynamicStyles.infoLabel}>Network Segments</Text>
                </View>
                <View style={dynamicStyles.infoItem}>
                  <Text style={dynamicStyles.infoValue}>
                    {new Date(complianceData.networkSegmentation.lastValidated).toLocaleDateString()}
                  </Text>
                  <Text style={dynamicStyles.infoLabel}>Last Validated</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Assessment Creation Modal */}
      <Modal
        visible={showAssessmentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAssessmentModal(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>Schedule Assessment</Text>
              <TouchableOpacity
                style={dynamicStyles.modalCloseButton}
                onPress={() => setShowAssessmentModal(false)}
              >
                <Text style={dynamicStyles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.formGroup}>
              <Text style={dynamicStyles.formLabel}>Assessment Type</Text>
              <View style={dynamicStyles.typeButtons}>
                {(['self', 'external'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      dynamicStyles.typeButton,
                      {
                        backgroundColor: newAssessment.assessmentType === type ? theme.colors.primary : '#ffffff',
                        borderColor: theme.colors.primary,
                      }
                    ]}
                    onPress={() => setNewAssessment(prev => ({ ...prev, assessmentType: type }))}
                  >
                    <Text style={[
                      dynamicStyles.typeButtonText,
                      {
                        color: newAssessment.assessmentType === type ? theme.colors.textInverse : theme.colors.primary
                      }
                    ]}>
                      {type === 'self' ? 'Self-Assessment' : 'External Assessment'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={dynamicStyles.formGroup}>
              <Text style={dynamicStyles.formLabel}>Scope Description *</Text>
              <TextInput
                style={dynamicStyles.formInput}
                value={newAssessment.scope}
                onChangeText={(text) => setNewAssessment(prev => ({ ...prev, scope: text }))}
                placeholder="e.g., Full cardholder data environment assessment"
                placeholderTextColor="#999"
              />
            </View>

            <View style={dynamicStyles.formGroup}>
              <Text style={dynamicStyles.formLabel}>Planned Date *</Text>
              <TextInput
                style={dynamicStyles.formInput}
                value={newAssessment.plannedDate}
                onChangeText={(text) => setNewAssessment(prev => ({ ...prev, plannedDate: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            </View>

            <View style={dynamicStyles.modalActions}>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonSecondary]}
                onPress={() => setShowAssessmentModal(false)}
              >
                <Text style={dynamicStyles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={handleCreateAssessment}
              >
                <Text style={dynamicStyles.modalButtonTextPrimary}>Schedule Assessment</Text>
              </TouchableOpacity>
            </View>
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

export default PCIDSSComplianceScreen;