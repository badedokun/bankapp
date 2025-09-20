/**
 * CBN (Central Bank of Nigeria) Compliance Framework Service
 * Implements regulatory requirements for Nigerian banking institutions
 *
 * Reference: CBN Circular BSD/DIR/GEN/LAB/11/156 - Guidelines on Cybersecurity Framework
 * Reference: CBN IT Risk Management Framework
 */
export interface CBNComplianceReport {
    reportId: string;
    tenantId: string;
    reportType: 'incident' | 'risk_assessment' | 'security_audit' | 'business_continuity';
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'draft' | 'submitted' | 'acknowledged' | 'resolved';
    submissionDeadline: Date;
    submittedAt?: Date;
    acknowledgedAt?: Date;
    description: string;
    impact: string;
    mitigationActions: string[];
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface CBNIncident {
    incidentId: string;
    tenantId: string;
    category: 'cyber_attack' | 'data_breach' | 'system_failure' | 'fraud' | 'operational_risk';
    severity: 'low' | 'medium' | 'high' | 'critical';
    impactLevel: 'minimal' | 'moderate' | 'significant' | 'severe';
    affectedSystems: string[];
    customerImpact: number;
    financialImpact: number;
    dataTypes: string[];
    detectedAt: Date;
    reportedAt: Date;
    resolvedAt?: Date;
    rootCause?: string;
    status: 'active' | 'contained' | 'resolved' | 'closed';
    timeline: CBNIncidentTimelineEntry[];
    complianceReport?: CBNComplianceReport;
}
export interface CBNIncidentTimelineEntry {
    timestamp: Date;
    event: string;
    actor: string;
    details: string;
}
export interface DataLocalizationCheck {
    checkId: string;
    tenantId: string;
    dataType: 'customer_data' | 'transaction_data' | 'payment_data' | 'kyc_data';
    storageLocation: 'nigeria' | 'nigeria_cloud' | 'international' | 'hybrid';
    compliance: boolean;
    lastChecked: Date;
    issues: string[];
    remediation: string[];
}
export interface CBNSecurityAudit {
    auditId: string;
    tenantId: string;
    auditType: 'internal' | 'external' | 'regulatory' | 'penetration_test';
    scope: string[];
    status: 'scheduled' | 'in_progress' | 'completed' | 'failed';
    startDate: Date;
    endDate?: Date;
    auditor: string;
    findings: CBNAuditFinding[];
    riskRating: 'low' | 'medium' | 'high' | 'critical';
    complianceScore: number;
    recommendations: string[];
    actionPlan: CBNActionItem[];
}
export interface CBNAuditFinding {
    findingId: string;
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    evidence: string;
    recommendation: string;
    status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
}
export interface CBNActionItem {
    itemId: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    assignee: string;
    dueDate: Date;
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
}
/**
 * CBN Compliance Service
 * Handles all regulatory compliance requirements for Nigerian banking
 */
export declare class CBNComplianceService {
    private readonly CBN_REPORTING_DEADLINE_HOURS;
    private readonly DATA_LOCALIZATION_REGIONS;
    constructor();
    /**
     * Initialize CBN compliance framework
     */
    private initializeComplianceFramework;
    /**
     * Create compliance tracking database tables
     */
    private createComplianceTables;
    /**
     * Report security incident to CBN (24-hour mandatory reporting)
     */
    reportIncident(tenantId: string, incident: Partial<CBNIncident>): Promise<CBNComplianceReport>;
    /**
     * Check Nigerian data localization compliance
     */
    checkDataLocalization(tenantId: string): Promise<DataLocalizationCheck[]>;
    /**
     * Generate CBN security audit
     */
    generateSecurityAudit(tenantId: string, auditType: 'internal' | 'external' | 'regulatory' | 'penetration_test'): Promise<CBNSecurityAudit>;
    /**
     * Get compliance dashboard for tenant
     */
    getComplianceDashboard(tenantId: string): Promise<any>;
    private calculateIncidentSeverity;
    private generateIncidentDescription;
    private generateImpactAssessment;
    private generateMitigationActions;
    private determineDataLocation;
    private getAuditScope;
}
export default CBNComplianceService;
//# sourceMappingURL=cbn-compliance.d.ts.map