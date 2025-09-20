/**
 * PCI DSS (Payment Card Industry Data Security Standard) Compliance Service
 * Implements Level 1 merchant compliance requirements for secure cardholder data handling
 *
 * Reference: PCI DSS v4.0 Requirements and Security Assessment Procedures
 * Reference: PCI DSS Quick Reference Guide for Merchants
 */
export interface PCIDSSCompliance {
    complianceId: string;
    tenantId: string;
    merchantLevel: 1 | 2 | 3 | 4;
    assessmentType: 'self_assessment' | 'external_audit' | 'internal_audit';
    complianceStatus: 'compliant' | 'non_compliant' | 'in_progress' | 'not_assessed';
    lastAssessment: Date;
    nextAssessment: Date;
    validUntil: Date;
    requirements: PCIDSSRequirement[];
    networkSecurity: NetworkSecurityControls;
    cardholderDataProtection: CardholderDataProtection;
    vulnerabilityManagement: VulnerabilityManagement;
    accessControl: AccessControlMeasures;
    monitoring: MonitoringAndTesting;
    securityPolicy: SecurityPolicy;
}
export interface PCIDSSRequirement {
    requirementId: string;
    requirementNumber: string;
    title: string;
    description: string;
    category: 'network_security' | 'data_protection' | 'vulnerability_mgmt' | 'access_control' | 'monitoring' | 'policy';
    priority: 'critical' | 'high' | 'medium' | 'low';
    status: 'compliant' | 'non_compliant' | 'not_applicable' | 'compensating_control';
    evidence: string[];
    lastTested: Date;
    nextTest: Date;
    findings: PCIDSSFinding[];
    compensatingControls?: CompensatingControl[];
}
export interface PCIDSSFinding {
    findingId: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    risk: string;
    recommendation: string;
    status: 'open' | 'in_progress' | 'resolved' | 'accepted';
    dueDate: Date;
    assignee: string;
}
export interface NetworkSecurityControls {
    firewallConfiguration: FirewallConfig;
    networkSegmentation: NetworkSegmentation;
    defaultPasswordChanges: DefaultPasswordControls;
    dataTransmissionSecurity: DataTransmissionSecurity;
}
export interface CardholderDataProtection {
    dataStorage: CardholderDataStorage;
    dataTransmission: CardholderDataTransmission;
    masking: DataMasking;
    retention: DataRetention;
    disposal: SecureDisposal;
}
export interface VulnerabilityManagement {
    antivirusControls: AntivirusControls;
    systemUpdates: SystemUpdateManagement;
    secureApplicationDevelopment: SecureDevControls;
}
export interface AccessControlMeasures {
    uniqueUserIds: UniqueUserIdControls;
    accessRestrictions: AccessRestrictionControls;
    physicalAccess: PhysicalAccessControls;
}
export interface MonitoringAndTesting {
    logManagement: LogManagementControls;
    securityTesting: SecurityTestingControls;
    incidentResponse: IncidentResponseControls;
}
export interface SecurityPolicy {
    informationSecurityPolicy: PolicyControls;
    riskAssessment: RiskAssessmentControls;
    securityAwareness: SecurityAwarenessControls;
}
interface FirewallConfig {
    rulesDocumented: boolean;
    rulesReviewed: boolean;
    lastReviewDate: Date;
    configurationStandards: string[];
}
interface NetworkSegmentation {
    cardholderDataEnvironment: string;
    segmentationTested: boolean;
    lastPenetrationTest: Date;
    segmentationControls: string[];
}
interface DataMasking {
    panMasking: boolean;
    maskingMethod: 'truncation' | 'replacement' | 'hashing' | 'tokenization';
    displayRules: string[];
    exemptions: string[];
}
interface SecurityTestingControls {
    penetrationTesting: PenetrationTestingControls;
    vulnerabilityScanning: VulnerabilityScanning;
    applicationTesting: ApplicationSecurityTesting;
}
interface PenetrationTestingControls {
    frequency: 'annual' | 'after_significant_changes';
    lastTest: Date;
    nextTest: Date;
    scope: string[];
    findings: string[];
    remediation: string[];
}
interface DefaultPasswordControls {
    defaultsChanged: boolean;
    changePolicy: string;
    verificationProcess: string;
}
interface DataTransmissionSecurity {
    encryptionStandards: string[];
    transmissionProtocols: string[];
    keyManagement: string;
}
interface CardholderDataStorage {
    storageMinimized: boolean;
    retentionPolicy: string;
    storageLocations: string[];
    encryptionStandards: string[];
}
interface CardholderDataTransmission {
    encryptionRequired: boolean;
    approvedProtocols: string[];
    keyManagement: string;
}
interface DataRetention {
    retentionPeriod: number;
    businessJustification: string;
    secureStorage: boolean;
}
interface SecureDisposal {
    disposalMethods: string[];
    mediaDestruction: string;
    verificationProcess: string;
}
interface AntivirusControls {
    deploymentScope: string;
    updateFrequency: string;
    monitoringEnabled: boolean;
}
interface SystemUpdateManagement {
    patchManagement: string;
    criticalPatchTimeline: string;
    testingProcess: string;
}
interface SecureDevControls {
    developmentStandards: string[];
    codeReviewProcess: string;
    vulnerabilityTesting: string;
}
interface UniqueUserIdControls {
    userIdPolicy: string;
    sharedIdProhibition: boolean;
    serviceAccountManagement: string;
}
interface AccessRestrictionControls {
    needToKnowBasis: boolean;
    roleBasedAccess: boolean;
    privilegedAccess: string;
}
interface PhysicalAccessControls {
    facilityAccess: string;
    mediaAccess: string;
    deviceSecurity: string;
}
interface LogManagementControls {
    loggingEnabled: boolean;
    logSources: string[];
    retentionPeriod: number;
    reviewProcess: string;
}
interface IncidentResponseControls {
    responseProcess: string;
    teamStructure: string;
    communicationPlan: string;
    testingSchedule: string;
}
interface PolicyControls {
    policyExists: boolean;
    lastReview: Date;
    nextReview: Date;
    approvalProcess: string;
}
interface RiskAssessmentControls {
    assessmentFrequency: string;
    lastAssessment: Date;
    riskRegister: string[];
    mitigationPlans: string[];
}
interface SecurityAwarenessControls {
    trainingProgram: string;
    trainingFrequency: string;
    awarenessActivities: string[];
}
interface VulnerabilityScanning {
    scanningFrequency: string;
    lastScan: Date;
    scanScope: string[];
    criticalFindings: number;
}
interface ApplicationSecurityTesting {
    staticAnalysis: boolean;
    dynamicAnalysis: boolean;
    testingFrequency: string;
}
interface CompensatingControl {
    controlId: string;
    description: string;
    justification: string;
    validation: string;
    maintenance: string;
}
/**
 * PCI DSS Compliance Service
 * Manages Payment Card Industry Data Security Standard compliance
 */
export declare class PCIDSSComplianceService {
    private readonly PCI_DSS_REQUIREMENTS;
    constructor();
    /**
     * Initialize PCI DSS compliance framework
     */
    private initializePCIDSSFramework;
    /**
     * Create PCI DSS compliance database tables
     */
    private createPCIDSSTables;
    /**
     * Initialize PCI DSS compliance assessment for tenant
     */
    initializePCIDSSAssessment(tenantId: string, merchantLevel?: 1 | 2 | 3 | 4, assessmentType?: 'self_assessment' | 'external_audit' | 'internal_audit'): Promise<PCIDSSCompliance>;
    /**
     * Validate network segmentation for cardholder data environment
     */
    validateNetworkSegmentation(tenantId: string): Promise<any>;
    /**
     * Get PCI DSS compliance dashboard
     */
    getPCIDSSDashboard(tenantId: string): Promise<any>;
    private createPCIDSSRequirements;
    private createNetworkSecurityControls;
    private createCardholderDataProtection;
    private createVulnerabilityManagement;
    private createAccessControlMeasures;
    private createMonitoringAndTesting;
    private createSecurityPolicy;
    private saveRequirement;
    private calculateComplianceScore;
    private getNextActions;
}
export default PCIDSSComplianceService;
//# sourceMappingURL=pci-dss-compliance.d.ts.map