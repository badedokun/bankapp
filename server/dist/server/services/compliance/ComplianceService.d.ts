/**
 * Compliance Service
 *
 * Orchestration layer that manages all compliance providers
 * and routes requests to the appropriate provider based on:
 * - Country
 * - Region
 * - Tenant configuration
 * - Regulatory requirements
 */
import { Pool } from 'pg';
import { IComplianceProvider, ComplianceProviderRegistry, KYCRequest, KYCResult, AMLCheckRequest, AMLResult, SanctionsCheckRequest, SanctionsCheckResult, TransactionMonitoringRequest, TransactionMonitoringResult, ComplianceReportRequest, ComplianceReport, RegulatoryLimits, User, Transaction } from './IComplianceProvider';
export declare class ComplianceService {
    private registry;
    private db;
    private initialized;
    constructor(db: Pool);
    /**
     * Initialize all compliance providers
     */
    initialize(): Promise<void>;
    /**
     * Get tenant compliance configuration from database
     */
    private getTenantConfig;
    /**
     * Select appropriate compliance provider based on context
     */
    selectProvider(context: {
        tenantId?: string;
        country?: string;
        region?: string;
        preferredProvider?: string;
    }): Promise<IComplianceProvider | null>;
    /**
     * Perform KYC verification
     */
    performKYC(request: KYCRequest, tenantId?: string): Promise<KYCResult>;
    /**
     * Check transaction for AML compliance
     */
    checkAML(request: AMLCheckRequest, tenantId?: string): Promise<AMLResult>;
    /**
     * Screen against sanctions lists
     */
    checkSanctions(request: SanctionsCheckRequest, tenantId?: string): Promise<SanctionsCheckResult>;
    /**
     * Monitor user transactions
     */
    monitorTransactions(request: TransactionMonitoringRequest, tenantId?: string): Promise<TransactionMonitoringResult>;
    /**
     * Generate compliance report
     */
    generateReport(request: ComplianceReportRequest, tenantId?: string): Promise<ComplianceReport>;
    /**
     * Submit compliance report to regulatory body
     */
    submitReport(report: ComplianceReport, tenantId?: string): Promise<{
        success: boolean;
        acknowledgmentNumber?: string;
    }>;
    /**
     * Get regulatory limits
     */
    getRegulatoryLimits(currency: string, tenantId?: string): Promise<RegulatoryLimits>;
    /**
     * Get required KYC level for operation
     */
    getRequiredKYCLevel(operation: 'transfer' | 'withdrawal' | 'deposit', amount: number, currency: string, tenantId?: string): Promise<'basic' | 'intermediate' | 'advanced'>;
    /**
     * Check if operation is compliant
     */
    isOperationCompliant(operation: string, context: any, tenantId?: string): Promise<boolean>;
    /**
     * Get available compliance providers for tenant
     */
    getAvailableProviders(tenantId: string): Promise<IComplianceProvider[]>;
    /**
     * Get provider capabilities
     */
    getProviderCapabilities(providerName: string): import("./IComplianceProvider").ComplianceCapabilities;
    /**
     * Perform comprehensive compliance check
     * Combines KYC, AML, and Sanctions screening
     */
    performComprehensiveCheck(user: User, transaction: Transaction, tenantId?: string): Promise<{
        kyc: KYCResult;
        aml: AMLResult;
        sanctions: SanctionsCheckResult;
        overallRisk: 'low' | 'medium' | 'high' | 'critical';
        approved: boolean;
        reason?: string;
    }>;
    /**
     * Ensure service is initialized
     */
    private ensureInitialized;
    /**
     * Get registry for direct access (advanced use)
     */
    getRegistry(): ComplianceProviderRegistry;
}
export declare function getComplianceService(db: Pool): ComplianceService;
//# sourceMappingURL=ComplianceService.d.ts.map