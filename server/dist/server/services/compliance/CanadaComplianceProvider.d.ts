/**
 * Canada Compliance Provider
 *
 * Implements Canadian regulatory compliance requirements:
 * - PCMLTFA (Proceeds of Crime (Money Laundering) and Terrorist Financing Act)
 * - FINTRAC (Financial Transactions and Reports Analysis Centre of Canada)
 * - OSFI (Office of the Superintendent of Financial Institutions)
 * - Privacy Act and PIPEDA (Personal Information Protection and Electronic Documents Act)
 *
 * Key Regulations:
 * - PCMLTFA: AML/CTF program requirements
 * - Large Cash Transaction Report: Cash transactions CA$10,000+
 * - Suspicious Transaction Report (STR): Any amount
 * - Electronic Funds Transfer Report: International EFTs CA$10,000+
 * - Client identification and record keeping
 * - Ongoing monitoring and risk assessment
 */
import { BaseComplianceProvider, KYCRequest, KYCResult, AMLCheckRequest, AMLResult, SanctionsCheckRequest, SanctionsCheckResult, TransactionMonitoringRequest, TransactionMonitoringResult, ComplianceReport, ComplianceReportRequest, RegulatoryLimits, ComplianceCapabilities } from './IComplianceProvider';
export declare class CanadaComplianceProvider extends BaseComplianceProvider {
    readonly name = "Canada Compliance Provider";
    readonly region = "Canada";
    readonly country = "CA";
    readonly capabilities: ComplianceCapabilities;
    private transactionHistory;
    private userRiskScores;
    private privacyConsent;
    /**
     * Initialize Canada compliance provider
     * Configuration should include:
     * - FINTRAC reporting endpoint
     * - OSFI sanctions list access
     * - Credit bureau integration (Equifax Canada, TransUnion Canada)
     * - PEP database access
     */
    initialize(config: Record<string, any>): Promise<void>;
    /**
     * Perform KYC verification according to PCMLTFA requirements
     *
     * FINTRAC Client Identification:
     * 1. Individual: Name, address, date of birth, occupation
     * 2. Document verification: Government-issued photo ID
     * 3. Third-party determination (if applicable)
     * 4. Beneficial ownership for entities
     * 5. Ongoing monitoring
     *
     * Enhanced measures for high-risk clients and PEPs
     */
    performKYC(request: KYCRequest): Promise<KYCResult>;
    /**
     * Check transaction for AML compliance under PCMLTFA
     *
     * Required monitoring:
     * - Large Cash Transactions (CA$10,000+)
     * - Suspicious Transactions (any amount)
     * - Electronic Funds Transfers (CA$10,000+ international)
     * - Terrorist Property
     * - Pattern analysis
     */
    checkAML(request: AMLCheckRequest): Promise<AMLResult>;
    /**
     * Screen against OSFI Consolidated Sanctions List
     * Includes UN Security Council sanctions and Canadian autonomous sanctions
     */
    checkSanctions(request: SanctionsCheckRequest): Promise<SanctionsCheckResult>;
    /**
     * Monitor user transactions for suspicious patterns
     * Required under PCMLTFA ongoing monitoring obligations
     */
    monitorTransactions(request: TransactionMonitoringRequest): Promise<TransactionMonitoringResult>;
    /**
     * Generate compliance report for FINTRAC
     * Report types: STR, LCTR, EFT Report
     */
    generateReport(request: ComplianceReportRequest): Promise<ComplianceReport>;
    /**
     * Submit compliance report to FINTRAC
     * Uses FINTRAC Web Reporting System or XML submission
     */
    submitReport(report: ComplianceReport): Promise<{
        success: boolean;
        acknowledgmentNumber?: string;
    }>;
    /**
     * Get Canadian regulatory limits
     */
    getRegulatoryLimits(currency: string): Promise<RegulatoryLimits>;
    private verifyPrivacyConsent;
    private verifyDocument;
    private verifyCreditFile;
    private performEnhancedCreditCheck;
    private verifySIN;
    private verifyUtilityBill;
    private screenPEP;
    private screenTerroristEntities;
    private screenAdverseMedia;
    private verifyBiometrics;
    private checkThirdPartyDetermination;
    private calculateRiskLevel;
    private convertToCAD;
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
    private checkUNSanctions;
    private getSanctionsRiskLevel;
    private detectRoundRobinPattern;
    private detectGeographicAnomalies;
    private detectSmurfing;
    private generateReportId;
    private getConversionRate;
}
//# sourceMappingURL=CanadaComplianceProvider.d.ts.map