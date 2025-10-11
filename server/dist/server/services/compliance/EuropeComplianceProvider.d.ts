/**
 * Europe Compliance Provider
 *
 * Implements EU regulatory compliance requirements:
 * - AML5 Directive (5th Anti-Money Laundering Directive)
 * - PSD2 (Payment Services Directive 2) with SCA
 * - GDPR (General Data Protection Regulation)
 * - EU Sanctions Framework
 * - National FIU reporting requirements
 *
 * Key Regulations:
 * - AML5: Enhanced customer due diligence, beneficial ownership registers
 * - PSD2: Strong Customer Authentication for electronic payments
 * - GDPR: Data protection and privacy requirements
 * - EU Sanctions: Consolidated list of persons, groups, and entities
 * - 4AMLD: Risk-based approach to AML/CTF
 */
import { BaseComplianceProvider, KYCRequest, KYCResult, AMLCheckRequest, AMLResult, SanctionsCheckRequest, SanctionsCheckResult, TransactionMonitoringRequest, TransactionMonitoringResult, ComplianceReport, ComplianceReportRequest, RegulatoryLimits, ComplianceCapabilities } from './IComplianceProvider';
export declare class EuropeComplianceProvider extends BaseComplianceProvider {
    readonly name = "Europe Compliance Provider";
    readonly region = "Europe";
    readonly country = "EU";
    readonly capabilities: ComplianceCapabilities;
    private transactionHistory;
    private userRiskScores;
    private consentRecords;
    /**
     * Initialize Europe compliance provider
     * Configuration should include:
     * - National FIU endpoint for STR filing
     * - eIDAS trust service provider
     * - EU sanctions list API
     * - PEP database access (e.g., World-Check, Refinitiv)
     */
    initialize(config: Record<string, any>): Promise<void>;
    /**
     * Perform KYC verification according to AML5 Directive
     * Requirements:
     * 1. Customer identification and verification
     * 2. Beneficial ownership identification (UBO)
     * 3. Purpose and nature of business relationship
     * 4. Ongoing monitoring
     * 5. Enhanced due diligence for high-risk customers
     */
    performKYC(request: KYCRequest): Promise<KYCResult>;
    /**
     * Check transaction for AML compliance under AML5 Directive
     * Risk-based approach focusing on:
     * - Cross-border transactions (especially outside EU)
     * - High-value transactions (€15,000+)
     * - Transactions with high-risk countries
     * - Complex or unusual transaction patterns
     */
    checkAML(request: AMLCheckRequest): Promise<AMLResult>;
    /**
     * Screen against EU Consolidated Sanctions List and UN sanctions
     * Mandatory under EU Common Foreign and Security Policy
     */
    checkSanctions(request: SanctionsCheckRequest): Promise<SanctionsCheckResult>;
    /**
     * Monitor user transactions for suspicious patterns
     * Required under AML5 Directive for ongoing monitoring
     */
    monitorTransactions(request: TransactionMonitoringRequest): Promise<TransactionMonitoringResult>;
    /**
     * Generate compliance report (STR or EDD)
     * Filed with National FIU
     */
    generateReport(request: ComplianceReportRequest): Promise<ComplianceReport>;
    /**
     * Submit compliance report to National FIU
     * Each EU member state has its own FIU
     */
    submitReport(report: ComplianceReport): Promise<{
        success: boolean;
        acknowledgmentNumber?: string;
    }>;
    /**
     * Get EU regulatory limits
     */
    getRegulatoryLimits(currency: string): Promise<RegulatoryLimits>;
    private verifyGDPRConsent;
    private verifyEIDAS;
    private verifyDocument;
    private performSCA;
    private verifyAddressOfficial;
    private verifyBiometrics;
    private screenPEP;
    private screenAdverseMedia;
    private verifyBeneficialOwnership;
    private calculateRiskLevel;
    private getRecentTransactions;
    private detectStructuring;
    private detectRapidMovement;
    private calculateUserBaseline;
    private isTransactionUnusual;
    private isCashIntensive;
    private checkSuspiciousNarration;
    private checkSCAREquirement;
    private getRiskLevel;
    private getRecommendation;
    private calculateNameMatchScore;
    private checkUNSanctions;
    private getSanctionsRiskLevel;
    private detectRoundRobinPattern;
    private detectGeographicAnomalies;
    private detectThirdPartyPayments;
    private generateReportId;
    private getConversionRate;
}
//# sourceMappingURL=EuropeComplianceProvider.d.ts.map