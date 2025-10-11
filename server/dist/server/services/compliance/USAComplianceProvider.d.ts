/**
 * USA Compliance Provider
 *
 * Implements US regulatory compliance requirements:
 * - Bank Secrecy Act (BSA)
 * - USA PATRIOT Act
 * - FinCEN regulations
 * - OFAC sanctions screening
 * - OCC/FDIC/SEC oversight
 *
 * Key Regulations:
 * - BSA: Anti-money laundering program requirements
 * - CTR: Currency Transaction Reports for cash transactions >$10,000
 * - SAR: Suspicious Activity Reports for suspicious transactions >$5,000
 * - CIP: Customer Identification Program under PATRIOT Act
 * - OFAC: Office of Foreign Assets Control sanctions screening
 */
import { BaseComplianceProvider, KYCRequest, KYCResult, AMLCheckRequest, AMLResult, SanctionsCheckRequest, SanctionsCheckResult, TransactionMonitoringRequest, TransactionMonitoringResult, ComplianceReport, ComplianceReportRequest, RegulatoryLimits, ComplianceCapabilities } from './IComplianceProvider';
export declare class USAComplianceProvider extends BaseComplianceProvider {
    readonly name = "USA Compliance Provider";
    readonly region = "USA";
    readonly country = "US";
    readonly capabilities: ComplianceCapabilities;
    private transactionHistory;
    private userRiskScores;
    /**
     * Initialize USA compliance provider
     * Configuration should include API keys for:
     * - ComplyAdvantage (sanctions screening)
     * - Dow Jones (PEP screening)
     * - LexisNexis (identity verification)
     * - Experian/Equifax/TransUnion (credit bureau checks)
     */
    initialize(config: Record<string, any>): Promise<void>;
    /**
     * Perform KYC verification according to US CIP requirements
     * Under the PATRIOT Act Section 326, financial institutions must:
     * 1. Verify customer identity using documents
     * 2. Check government lists (OFAC SDN, FBI Most Wanted)
     * 3. Form reasonable belief that identity is accurate
     */
    performKYC(request: KYCRequest): Promise<KYCResult>;
    /**
     * Check transaction for AML compliance under Bank Secrecy Act
     * Monitors for:
     * - Structuring (breaking up transactions to avoid CTR filing)
     * - Rapid movement of funds
     * - Transactions with high-risk countries
     * - Unusual patterns
     */
    checkAML(request: AMLCheckRequest): Promise<AMLResult>;
    /**
     * Screen against OFAC Specially Designated Nationals (SDN) list
     * Mandatory for all US financial institutions
     */
    checkSanctions(request: SanctionsCheckRequest): Promise<SanctionsCheckResult>;
    /**
     * Monitor user transactions for suspicious patterns
     * Required under Bank Secrecy Act
     */
    monitorTransactions(request: TransactionMonitoringRequest): Promise<TransactionMonitoringResult>;
    /**
     * Generate compliance report (SAR, CTR, or FBAR)
     */
    generateReport(request: ComplianceReportRequest): Promise<ComplianceReport>;
    /**
     * Submit compliance report to FinCEN
     * In production, this would use FinCEN's BSA E-Filing System
     */
    submitReport(report: ComplianceReport): Promise<{
        success: boolean;
        acknowledgmentNumber?: string;
    }>;
    /**
     * Get USA regulatory limits
     */
    getRegulatoryLimits(currency: string): Promise<RegulatoryLimits>;
    private verifySSN;
    private verifyDocument;
    private performCreditBureauCheck;
    private screenPEP;
    private screenAdverseMedia;
    private verifyBiometrics;
    private calculateRiskLevel;
    private getRecentTransactions;
    private detectStructuring;
    private detectRapidMovement;
    private calculateUserBaseline;
    private isTransactionUnusual;
    private isCashIntensive;
    private checkSuspiciousNarration;
    private getRiskLevel;
    private getRecommendation;
    private calculateNameMatchScore;
    private getSanctionsRiskLevel;
    private detectRoundRobinPattern;
    private detectGeographicAnomalies;
    private generateReportId;
    private getSubmissionTarget;
    private getConversionRate;
}
//# sourceMappingURL=USAComplianceProvider.d.ts.map