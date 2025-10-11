/**
 * Payment Gateway Service
 *
 * Orchestration layer that manages all payment providers
 * and routes requests to the appropriate provider based on:
 * - Currency
 * - Region
 * - Bank code type
 * - Tenant configuration
 */
import { Pool } from 'pg';
import { IPaymentProvider, PaymentProviderRegistry, AccountValidationRequest, AccountValidationResult, TransferRequest, TransferResponse, TransferStatusRequest, TransferStatusResponse, BankListRequest, BankInfo, TransferLimits } from './IPaymentProvider';
export declare class PaymentGatewayService {
    private registry;
    private db;
    private initialized;
    constructor(db: Pool);
    /**
     * Initialize all payment providers
     */
    initialize(): Promise<void>;
    /**
     * Get tenant payment configuration from database
     */
    private getTenantConfig;
    /**
     * Select appropriate payment provider based on context
     */
    selectProvider(context: {
        tenantId?: string;
        currency?: string;
        region?: string;
        bankCodeType?: string;
        preferredProvider?: string;
    }): Promise<IPaymentProvider | null>;
    /**
     * Validate account across any provider
     */
    validateAccount(request: AccountValidationRequest, tenantId?: string): Promise<AccountValidationResult>;
    /**
     * Initiate transfer across any provider
     */
    initiateTransfer(request: TransferRequest, tenantId?: string): Promise<TransferResponse>;
    /**
     * Get transfer status across any provider
     */
    getTransferStatus(request: TransferStatusRequest, providerName?: string): Promise<TransferStatusResponse>;
    /**
     * Get bank list from appropriate provider
     */
    getBankList(request: BankListRequest, tenantId?: string): Promise<BankInfo[]>;
    /**
     * Get transfer limits from provider
     */
    getTransferLimits(currency: string, tenantId?: string): Promise<TransferLimits | null>;
    /**
     * Calculate transfer fee
     */
    calculateFee(amount: number, currency: string, transferType: string, tenantId?: string): Promise<number>;
    /**
     * Get all available providers for a tenant
     */
    getAvailableProviders(tenantId: string): Promise<IPaymentProvider[]>;
    /**
     * Get provider capabilities
     */
    getProviderCapabilities(providerName: string): import("./IPaymentProvider").ProviderCapabilities;
    /**
     * Determine bank code type from format
     */
    private determineBankCodeType;
    /**
     * Ensure service is initialized
     */
    private ensureInitialized;
    /**
     * Get registry for direct access (advanced use)
     */
    getRegistry(): PaymentProviderRegistry;
}
export declare function getPaymentGatewayService(db: Pool): PaymentGatewayService;
//# sourceMappingURL=PaymentGatewayService.d.ts.map