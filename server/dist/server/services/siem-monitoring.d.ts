/**
 * SIEM (Security Information and Event Management) Service
 * Real-time security monitoring, alerting, and forensic analysis
 *
 * Features:
 * - Real-time log analysis and correlation
 * - Security event detection and alerting
 * - Threat intelligence integration
 * - Forensic analysis and audit trails
 * - Compliance reporting
 */
export interface SIEMEvent {
    eventId: string;
    tenantId: string;
    timestamp: Date;
    eventType: 'authentication' | 'authorization' | 'data_access' | 'network' | 'system' | 'application' | 'fraud' | 'compliance';
    severity: 'low' | 'medium' | 'high' | 'critical';
    source: string;
    sourceIP: string;
    userId?: string;
    description: string;
    rawLog: string;
    parsedData: Record<string, any>;
    correlationId?: string;
    riskScore: number;
    indicators: ThreatIndicator[];
    relatedEvents: string[];
    status: 'new' | 'investigating' | 'resolved' | 'false_positive';
    assignedTo?: string;
    investigationNotes?: string;
    responseActions: ResponseAction[];
    complianceRelevance: string[];
    retentionPeriod: number;
    forensicEvidence?: ForensicEvidence;
}
export interface ThreatIndicator {
    indicator: string;
    type: 'ip' | 'domain' | 'hash' | 'pattern' | 'behavior';
    confidence: number;
    source: string;
    description: string;
}
export interface ResponseAction {
    actionId: string;
    actionType: 'alert' | 'block' | 'quarantine' | 'escalate' | 'investigate';
    timestamp: Date;
    executor: 'system' | 'human';
    executorId: string;
    description: string;
    result: string;
    success: boolean;
}
export interface ForensicEvidence {
    evidenceId: string;
    evidenceType: 'log' | 'network_capture' | 'file' | 'memory_dump' | 'screenshot';
    location: string;
    hash: string;
    chainOfCustody: ChainOfCustodyEntry[];
}
export interface ChainOfCustodyEntry {
    timestamp: Date;
    actor: string;
    action: 'collected' | 'analyzed' | 'transferred' | 'stored';
    location: string;
    signature: string;
}
export interface SecurityAlert {
    alertId: string;
    tenantId: string;
    alertType: 'anomaly' | 'rule_match' | 'threshold_breach' | 'correlation' | 'threat_intel';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    timestamp: Date;
    triggerEvents: string[];
    ruleName: string;
    ruleDescription: string;
    riskScore: number;
    threatActors: string[];
    affectedAssets: string[];
    potentialImpact: string;
    status: 'open' | 'acknowledged' | 'investigating' | 'resolved' | 'false_positive';
    assignedTo?: string;
    escalated: boolean;
    responseTime?: number;
    resolutionTime?: number;
    investigationSteps: InvestigationStep[];
    relatedAlerts: string[];
    evidence: string[];
}
export interface InvestigationStep {
    stepId: string;
    timestamp: Date;
    investigator: string;
    action: string;
    findings: string;
    nextActions: string[];
}
export interface SIEMRule {
    ruleId: string;
    tenantId: string;
    ruleName: string;
    description: string;
    category: 'authentication' | 'data_protection' | 'network_security' | 'fraud_detection' | 'compliance';
    enabled: boolean;
    conditions: RuleCondition[];
    timeWindow: number;
    threshold: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    alertActions: AlertAction[];
    automatedResponses: AutomatedResponse[];
    createdBy: string;
    lastModified: Date;
    triggerCount: number;
    falsePositiveRate: number;
}
export interface RuleCondition {
    field: string;
    operator: 'equals' | 'contains' | 'regex' | 'greater_than' | 'less_than' | 'in_list';
    value: any;
    caseSensitive?: boolean;
}
export interface AlertAction {
    actionType: 'email' | 'sms' | 'webhook' | 'ticket' | 'escalate';
    recipients: string[];
    template: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
}
export interface AutomatedResponse {
    responseType: 'block_ip' | 'disable_account' | 'quarantine_file' | 'isolate_system' | 'collect_evidence';
    parameters: Record<string, any>;
    conditions: string[];
}
export interface ThreatIntelligence {
    sourceId: string;
    sourceName: string;
    lastUpdated: Date;
    indicators: ThreatIndicator[];
    feeds: ThreatFeed[];
}
export interface ThreatFeed {
    feedId: string;
    feedName: string;
    feedType: 'commercial' | 'open_source' | 'government' | 'industry';
    updateFrequency: string;
    reliability: number;
    lastUpdate: Date;
    indicatorCount: number;
}
/**
 * SIEM Monitoring Service
 * Central security monitoring and event management
 */
export declare class SIEMMonitoringService {
    private readonly DEFAULT_RETENTION_DAYS;
    private readonly THREAT_SCORE_THRESHOLD;
    constructor();
    /**
     * Initialize SIEM monitoring system
     */
    private initializeSIEM;
    /**
     * Create SIEM database tables
     */
    private createSIEMTables;
    /**
     * Log security event to SIEM
     */
    logSecurityEvent(event: Partial<SIEMEvent>): Promise<SIEMEvent>;
    /**
     * Create security alert
     */
    createSecurityAlert(tenantId: string, alertType: string, title: string, description: string, severity: 'low' | 'medium' | 'high' | 'critical', triggerEvents: string[], ruleName: string): Promise<SecurityAlert>;
    /**
     * Get SIEM dashboard data
     */
    getSIEMDashboard(tenantId: string): Promise<any>;
    /**
     * Search security events
     */
    searchSecurityEvents(tenantId: string, filters: {
        eventType?: string;
        severity?: string;
        timeRange?: {
            start: Date;
            end: Date;
        };
        sourceIP?: string;
        userId?: string;
        riskScoreMin?: number;
        limit?: number;
    }): Promise<SIEMEvent[]>;
    private initializeDefaultRules;
    private calculateRiskScore;
    private determineComplianceRelevance;
    private processEventRules;
    private correlateEvents;
    private calculateAlertRiskScore;
    private assessPotentialImpact;
    private executeAutomatedResponses;
    private isHighRiskIP;
    private calculateAverageRiskScore;
    private groupEventsByType;
    private groupEventsBySeverity;
    private getTopRiskSources;
    private calculateAlertTrends;
}
export default SIEMMonitoringService;
//# sourceMappingURL=siem-monitoring.d.ts.map