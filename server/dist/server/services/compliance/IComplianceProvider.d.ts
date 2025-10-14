/**
 * Compliance Provider Interface
 *
 * Abstraction layer for regional regulatory compliance:
 * - KYC (Know Your Customer) verification
 * - AML (Anti-Money Laundering) checks
 * - CTF (Counter-Terrorism Financing) screening
 * - Sanctions screening (OFAC, UN, EU)
 * - Transaction monitoring
 * - Compliance reporting
 */
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    nationality?: string;
    countryOfResidence?: string;
    address?: {
        street: string;
        city: string;
        state?: string;
        postalCode: string;
        country: string;
    };
    phoneNumber?: string;
    identityDocuments?: IdentityDocument[];
    sourceOfFunds?: string;
    occupation?: string;
    employerName?: string;
    annualIncome?: number;
    politicallyExposed?: boolean;
}
export interface IdentityDocument {
    type: 'passport' | 'drivers_license' | 'national_id' | 'ssn' | 'sin' | 'bvn' | 'tax_id';
    number: string;
    issuingCountry: string;
    issueDate?: Date;
    expiryDate?: Date;
    verified: boolean;
}
export interface Transaction {
    id: string;
    userId: string;
    type: 'transfer' | 'deposit' | 'withdrawal' | 'payment';
    amount: number;
    currency: string;
    fromAccount?: string;
    toAccount?: string;
    recipientName?: string;
    recipientCountry?: string;
    narration?: string;
    timestamp: Date;
    status: 'pending' | 'completed' | 'failed' | 'flagged';
}
export interface KYCRequest {
    userId: string;
    user: User;
    level: 'basic' | 'intermediate' | 'advanced';
    documents: IdentityDocument[];
    checkBiometrics?: boolean;
    checkAddress?: boolean;
    checkEmployment?: boolean;
}
export interface KYCResult {
    success: boolean;
    level: 'basic' | 'intermediate' | 'advanced';
    verified: boolean;
    verificationDate?: Date;
    score?: number;
    checks: {
        identityVerified: boolean;
        addressVerified: boolean;
        documentVerified: boolean;
        biometricVerified: boolean;
        pepCheck: boolean;
        sanctionsCheck: boolean;
        adverseMediaCheck: boolean;
    };
    riskLevel: 'low' | 'medium' | 'high';
    issues?: string[];
    nextReviewDate?: Date;
}
export interface AMLCheckRequest {
    transaction: Transaction;
    user: User;
    checkType: 'pre_transaction' | 'post_transaction' | 'periodic';
}
export interface AMLResult {
    passed: boolean;
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    flags: {
        structuring?: boolean;
        rapidMovement?: boolean;
        unusualPattern?: boolean;
        highRiskCountry?: boolean;
        sanctionsMatch?: boolean;
        pepInvolved?: boolean;
        cashIntensive?: boolean;
        suspiciousNarration?: boolean;
    };
    alerts: Array<{
        severity: 'low' | 'medium' | 'high' | 'critical';
        type: string;
        description: string;
        requiresAction: boolean;
    }>;
    recommendation: 'approve' | 'review' | 'reject' | 'escalate';
    requiresReporting: boolean;
    reportType?: 'SAR' | 'CTR' | 'STR';
}
export interface SanctionsCheckRequest {
    name: string;
    dateOfBirth?: Date;
    nationality?: string;
    address?: string;
    identificationNumber?: string;
}
export interface SanctionsCheckResult {
    matched: boolean;
    matches: Array<{
        listName: string;
        matchScore: number;
        entityName: string;
        entityType: 'individual' | 'entity' | 'vessel';
        program: string;
        details: string;
    }>;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    requiresReview: boolean;
}
export interface ComplianceReport {
    reportId: string;
    reportType: 'SAR' | 'CTR' | 'STR' | 'FBAR' | 'FINTRAC' | 'EDD';
    filingDate: Date;
    reportingPeriod: {
        startDate: Date;
        endDate: Date;
    };
    status: 'draft' | 'submitted' | 'acknowledged' | 'under_review';
    data: any;
    submittedTo?: string;
    acknowledgmentNumber?: string;
}
export interface ComplianceReportRequest {
    reportType: 'SAR' | 'CTR' | 'STR' | 'FBAR' | 'FINTRAC' | 'EDD';
    userId?: string;
    transactionId?: string;
    startDate: Date;
    endDate: Date;
    reason?: string;
    suspiciousActivity?: string;
    metadata?: Record<string, any>;
}
export interface TransactionMonitoringRequest {
    userId: string;
    lookbackPeriod: number;
    checkPatterns?: boolean;
    checkVelocity?: boolean;
    checkThresholds?: boolean;
}
export interface TransactionMonitoringResult {
    alerts: Array<{
        type: 'velocity' | 'threshold' | 'pattern' | 'geographic' | 'counterparty';
        severity: 'low' | 'medium' | 'high';
        description: string;
        transactions: string[];
        detectedAt: Date;
    }>;
    statistics: {
        totalTransactions: number;
        totalVolume: number;
        averageTransaction: number;
        largestTransaction: number;
        uniqueCounterparties: number;
        highRiskTransactions: number;
    };
    recommendation: 'continue_monitoring' | 'enhanced_monitoring' | 'file_report' | 'restrict_account';
}
export interface RegulatoryLimits {
    dailyTransactionLimit?: number;
    monthlyTransactionLimit?: number;
    singleTransactionLimit?: number;
    cashTransactionReportingThreshold: number;
    suspiciousActivityThreshold: number;
    enhancedDueDiligenceThreshold: number;
    pepTransactionLimit?: number;
    internationalTransferLimit?: number;
}
export interface ComplianceCapabilities {
    supportsKYC: boolean;
    supportsAML: boolean;
    supportsSanctionsScreening: boolean;
    supportsTransactionMonitoring: boolean;
    supportsPEPScreening: boolean;
    supportsAdverseMediaScreening: boolean;
    supportsBiometricVerification: boolean;
    supportsAutomatedReporting: boolean;
    supportedReportTypes: Array<'SAR' | 'CTR' | 'STR' | 'FBAR' | 'FINTRAC' | 'EDD'>;
    regulatoryBodies: string[];
    certifications: string[];
}
/**
 * Core Compliance Provider Interface
 * All regional compliance providers must implement this interface
 */
export interface IComplianceProvider {
    /**
     * Provider identification
     */
    readonly name: string;
    readonly region: string;
    readonly country: string;
    readonly capabilities: ComplianceCapabilities;
    /**
     * Initialize the provider with configuration
     */
    initialize(config: Record<string, any>): Promise<void>;
    /**
     * Perform KYC verification
     */
    performKYC(request: KYCRequest): Promise<KYCResult>;
    /**
     * Check transaction for AML compliance
     */
    checkAML(request: AMLCheckRequest): Promise<AMLResult>;
    /**
     * Screen against sanctions lists
     */
    checkSanctions(request: SanctionsCheckRequest): Promise<SanctionsCheckResult>;
    /**
     * Monitor user transactions for suspicious patterns
     */
    monitorTransactions(request: TransactionMonitoringRequest): Promise<TransactionMonitoringResult>;
    /**
     * Generate compliance report
     */
    generateReport(request: ComplianceReportRequest): Promise<ComplianceReport>;
    /**
     * Submit compliance report to regulatory body
     */
    submitReport(report: ComplianceReport): Promise<{
        success: boolean;
        acknowledgmentNumber?: string;
    }>;
    /**
     * Get regulatory limits for the region
     */
    getRegulatoryLimits(currency: string): Promise<RegulatoryLimits>;
    /**
     * Check if operation is compliant with regional regulations
     */
    isCompliant(operation: string, context?: any): Promise<boolean>;
    /**
     * Get required KYC level for operation
     */
    getRequiredKYCLevel(operation: 'transfer' | 'withdrawal' | 'deposit', amount: number, currency: string): Promise<'basic' | 'intermediate' | 'advanced'>;
}
/**
 * Base abstract class for compliance providers
 * Provides common functionality that all providers can extend
 */
export declare abstract class BaseComplianceProvider implements IComplianceProvider {
    abstract readonly name: string;
    abstract readonly region: string;
    abstract readonly country: string;
    abstract readonly capabilities: ComplianceCapabilities;
    protected config: Record<string, any>;
    protected initialized: boolean;
    initialize(config: Record<string, any>): Promise<void>;
    protected ensureInitialized(): void;
    abstract performKYC(request: KYCRequest): Promise<KYCResult>;
    abstract checkAML(request: AMLCheckRequest): Promise<AMLResult>;
    abstract checkSanctions(request: SanctionsCheckRequest): Promise<SanctionsCheckResult>;
    abstract monitorTransactions(request: TransactionMonitoringRequest): Promise<TransactionMonitoringResult>;
    abstract generateReport(request: ComplianceReportRequest): Promise<ComplianceReport>;
    abstract submitReport(report: ComplianceReport): Promise<{
        success: boolean;
        acknowledgmentNumber?: string;
    }>;
    abstract getRegulatoryLimits(currency: string): Promise<RegulatoryLimits>;
    isCompliant(operation: string, context?: any): Promise<boolean>;
    getRequiredKYCLevel(operation: 'transfer' | 'withdrawal' | 'deposit', amount: number, currency: string): Promise<'basic' | 'intermediate' | 'advanced'>;
}
/**
 * Compliance Provider Registry
 * Manages available compliance providers and routes requests
 */
export declare class ComplianceProviderRegistry {
    private providers;
    /**
     * Register a compliance provider
     */
    register(provider: IComplianceProvider): void;
    /**
     * Get a specific provider by name
     */
    getProvider(name: string): IComplianceProvider | undefined;
    /**
     * Get provider for a specific region
     */
    getProviderForRegion(region: string): IComplianceProvider | undefined;
    /**
     * Get provider for a specific country
     */
    getProviderForCountry(country: string): IComplianceProvider | undefined;
    /**
     * Get all registered providers
     */
    getAllProviders(): IComplianceProvider[];
}
export declare const complianceProviderRegistry: ComplianceProviderRegistry;
//# sourceMappingURL=IComplianceProvider.d.ts.map