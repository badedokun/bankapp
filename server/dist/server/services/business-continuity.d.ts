/**
 * Business Continuity Planning Service
 * CBN-compliant disaster recovery and business continuity management
 *
 * Reference: CBN Circular on Business Continuity Planning for Financial Institutions
 * Reference: CBN Guidelines on Risk Management Framework
 */
export interface BusinessContinuityPlan {
    planId: string;
    tenantId: string;
    planType: 'disaster_recovery' | 'business_continuity' | 'pandemic_response' | 'cyber_incident';
    version: string;
    status: 'draft' | 'active' | 'archived' | 'under_review';
    lastUpdated: Date;
    nextReview: Date;
    approvedBy: string;
    approvedAt?: Date;
    riskAssessment: RiskAssessment;
    criticalProcesses: CriticalProcess[];
    recoveryProcedures: RecoveryProcedure[];
    communicationPlan: CommunicationPlan;
    resourceRequirements: ResourceRequirement[];
    testingSchedule: TestingSchedule;
    cbnCompliance: CBNBCPCompliance;
    regulatoryApproval?: RegulatoryApproval;
}
export interface RiskAssessment {
    identifiedRisks: Risk[];
    impactAnalysis: ImpactAnalysis;
    probabilityAssessment: ProbabilityAssessment;
    riskMatrix: RiskMatrix;
    lastAssessment: Date;
}
export interface Risk {
    riskId: string;
    category: 'operational' | 'technological' | 'regulatory' | 'financial' | 'reputational' | 'strategic';
    description: string;
    probability: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
    impact: 'minimal' | 'minor' | 'moderate' | 'major' | 'catastrophic';
    riskScore: number;
    mitigationStrategies: string[];
    owner: string;
    status: 'identified' | 'assessed' | 'mitigated' | 'accepted' | 'transferred';
}
export interface CriticalProcess {
    processId: string;
    name: string;
    description: string;
    category: 'core_banking' | 'payment_processing' | 'customer_service' | 'regulatory_reporting' | 'risk_management';
    criticality: 'high' | 'medium' | 'low';
    rto: number;
    rpo: number;
    dependencies: string[];
    alternativeProcedures: string[];
    staffRequirements: StaffRequirement[];
}
export interface RecoveryProcedure {
    procedureId: string;
    processId: string;
    stepNumber: number;
    description: string;
    responsibility: string;
    timeframe: string;
    resources: string[];
    successCriteria: string[];
    escalationProcedure: string;
}
export interface CommunicationPlan {
    internalContacts: Contact[];
    externalContacts: Contact[];
    regulatoryContacts: Contact[];
    mediaStrategy: MediaStrategy;
    communicationChannels: CommunicationChannel[];
    messageTemplates: MessageTemplate[];
}
export interface Contact {
    role: string;
    name: string;
    primaryPhone: string;
    alternatePhone?: string;
    email: string;
    alternateEmail?: string;
}
export interface CBNBCPCompliance {
    complianceChecklist: ComplianceItem[];
    regulatoryRequirements: RegulatoryRequirement[];
    reportingSchedule: ReportingSchedule[];
    auditTrail: AuditTrailEntry[];
    lastComplianceCheck: Date;
    nextComplianceReview: Date;
}
export interface TestingSchedule {
    testType: 'tabletop' | 'walkthrough' | 'simulation' | 'live_test';
    frequency: 'monthly' | 'quarterly' | 'biannually' | 'annually';
    lastTest: Date;
    nextTest: Date;
    testResults: TestResult[];
    improvements: Improvement[];
}
export interface TestResult {
    testId: string;
    testDate: Date;
    testType: string;
    scope: string[];
    participants: string[];
    duration: number;
    objectives: string[];
    actualResults: string[];
    gaps: string[];
    recommendations: string[];
    overallRating: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'inadequate';
}
interface ImpactAnalysis {
    financialImpact: FinancialImpact;
    operationalImpact: OperationalImpact;
    reputationalImpact: ReputationalImpact;
    regulatoryImpact: RegulatoryImpact;
}
interface FinancialImpact {
    revenueImpact: number;
    costOfDisruption: number;
    recoveryInvestment: number;
    regulatoryFines: number;
}
interface ProbabilityAssessment {
    historicalData: string;
    industryBenchmarks: string;
    expertJudgment: string;
    overallProbability: number;
}
interface RiskMatrix {
    highRisks: Risk[];
    mediumRisks: Risk[];
    lowRisks: Risk[];
    riskTrends: string;
}
interface StaffRequirement {
    role: string;
    minimumStaff: number;
    skillsRequired: string[];
    backupStaff: string[];
}
interface MediaStrategy {
    spokesperson: string;
    keyMessages: string[];
    channels: string[];
    timeline: string;
}
interface CommunicationChannel {
    channel: 'email' | 'sms' | 'phone' | 'social_media' | 'website' | 'press_release';
    primary: boolean;
    contactList: string[];
    messageTemplate: string;
}
interface MessageTemplate {
    templateId: string;
    audience: 'internal' | 'customers' | 'regulators' | 'media' | 'stakeholders';
    scenario: string;
    template: string;
    approvalRequired: boolean;
}
interface ComplianceItem {
    requirement: string;
    status: 'compliant' | 'non_compliant' | 'partially_compliant' | 'not_applicable';
    evidence: string;
    lastCheck: Date;
    nextCheck: Date;
}
interface RegulatoryRequirement {
    regulation: string;
    requirement: string;
    deadline: Date;
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
    evidence: string;
}
interface ReportingSchedule {
    reportType: string;
    frequency: string;
    recipient: string;
    nextDue: Date;
    lastSubmitted?: Date;
}
interface AuditTrailEntry {
    timestamp: Date;
    action: string;
    user: string;
    details: string;
}
interface ResourceRequirement {
    resourceType: 'human' | 'technology' | 'facility' | 'financial';
    description: string;
    quantity: number;
    availability: 'available' | 'limited' | 'unavailable';
    alternativeSources: string[];
}
interface Improvement {
    improvementId: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    assignee: string;
    dueDate: Date;
    status: 'open' | 'in_progress' | 'completed';
}
interface OperationalImpact {
    processesAffected: string[];
    customersImpacted: number;
    serviceLevelReduction: string;
    recoveryTime: number;
}
interface ReputationalImpact {
    publicPerception: string;
    mediaAttention: string;
    customerConfidence: string;
    regulatoryStanding: string;
}
interface RegulatoryImpact {
    complianceViolations: string[];
    reportingRequirements: string[];
    potentialSanctions: string[];
    relationshipImpact: string;
}
interface RegulatoryApproval {
    approvalDate: Date;
    approvedBy: string;
    validUntil: Date;
    conditions: string[];
    reviewSchedule: string;
}
/**
 * Business Continuity Planning Service
 */
export declare class BusinessContinuityService {
    private readonly CBN_BCP_REQUIREMENTS;
    constructor();
    /**
     * Initialize business continuity framework
     */
    private initializeBusinessContinuity;
    /**
     * Create business continuity database tables
     */
    private createBusinessContinuityTables;
    /**
     * Create comprehensive business continuity plan
     */
    createBusinessContinuityPlan(tenantId: string, planType: 'disaster_recovery' | 'business_continuity' | 'pandemic_response' | 'cyber_incident'): Promise<BusinessContinuityPlan>;
    /**
     * Conduct BCP testing
     */
    conductBCPTest(planId: string, testType: 'tabletop' | 'walkthrough' | 'simulation' | 'live_test', scope: string[], participants: string[]): Promise<TestResult>;
    /**
     * Get business continuity dashboard
     */
    getBCPDashboard(tenantId: string): Promise<any>;
    private createRiskAssessment;
    private defineCriticalProcesses;
    private createRecoveryProcedures;
    private createCommunicationPlan;
    private defineResourceRequirements;
    private createTestingSchedule;
    private createCBNComplianceChecklist;
    private defineCBNRequirements;
    private createReportingSchedule;
    private calculateAverageTestRating;
    private calculateComplianceRate;
    private getNextReviewDue;
    private getUpcomingActivities;
}
export default BusinessContinuityService;
//# sourceMappingURL=business-continuity.d.ts.map