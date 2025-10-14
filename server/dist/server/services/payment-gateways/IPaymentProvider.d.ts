/**
 * Payment Provider Interface
 *
 * Abstraction layer for regional payment networks:
 * - NIBSS (Nigeria)
 * - ACH/FedWire (USA)
 * - SEPA (Europe)
 * - Interac (Canada)
 * - SWIFT (International)
 */
export interface AccountValidationRequest {
    accountNumber: string;
    bankCode: string;
    bankCodeType: 'NIBSS' | 'SWIFT' | 'ROUTING' | 'TRANSIT' | 'SORT_CODE';
    currency?: string;
    region?: string;
}
export interface AccountValidationResult {
    isValid: boolean;
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    errorMessage?: string;
    errorCode?: string;
}
export interface TransferRequest {
    fromAccountNumber: string;
    fromAccountName: string;
    fromBankCode?: string;
    toAccountNumber: string;
    toAccountName?: string;
    toBankCode: string;
    toBankName?: string;
    amount: number;
    currency: string;
    narration: string;
    reference: string;
    transferType: 'internal' | 'external' | 'international';
    region?: string;
    userId?: string;
    tenantId?: string;
    metadata?: Record<string, any>;
}
export interface TransferResponse {
    success: boolean;
    transactionReference: string;
    providerReference?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    message?: string;
    errorCode?: string;
    fee?: number;
    totalAmount?: number;
    estimatedCompletionTime?: Date;
}
export interface TransferStatusRequest {
    transactionReference: string;
    providerReference?: string;
}
export interface TransferStatusResponse {
    transactionReference: string;
    providerReference?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'reversed';
    amount?: number;
    currency?: string;
    completedAt?: Date;
    failureReason?: string;
    metadata?: Record<string, any>;
}
export interface BankListRequest {
    country?: string;
    currency?: string;
    region?: string;
}
export interface BankInfo {
    bankCode: string;
    bankName: string;
    bankCodeType: 'NIBSS' | 'SWIFT' | 'ROUTING' | 'TRANSIT' | 'SORT_CODE';
    country: string;
    currency?: string;
    swiftCode?: string;
    active: boolean;
}
export interface TransferLimits {
    minAmount: number;
    maxAmount: number;
    dailyLimit: number;
    monthlyLimit: number;
    currency: string;
}
export interface ProviderCapabilities {
    supportsAccountValidation: boolean;
    supportsInstantTransfer: boolean;
    supportsScheduledTransfer: boolean;
    supportsInternationalTransfer: boolean;
    supportedCurrencies: string[];
    supportedCountries: string[];
    averageProcessingTime: string;
}
/**
 * Core Payment Provider Interface
 * All regional payment providers must implement this interface
 */
export interface IPaymentProvider {
    /**
     * Provider identification
     */
    readonly name: string;
    readonly region: string;
    readonly capabilities: ProviderCapabilities;
    /**
     * Initialize the provider with configuration
     */
    initialize(config: Record<string, any>): Promise<void>;
    /**
     * Validate account number and retrieve account details
     */
    validateAccount(request: AccountValidationRequest): Promise<AccountValidationResult>;
    /**
     * Initiate a fund transfer
     */
    initiateTransfer(request: TransferRequest): Promise<TransferResponse>;
    /**
     * Check the status of a transfer
     */
    getTransferStatus(request: TransferStatusRequest): Promise<TransferStatusResponse>;
    /**
     * Get list of supported banks
     */
    getBankList(request?: BankListRequest): Promise<BankInfo[]>;
    /**
     * Get transfer limits for the provider
     */
    getTransferLimits(currency: string): Promise<TransferLimits>;
    /**
     * Validate if the provider supports a specific operation
     */
    isSupported(operation: 'validate' | 'transfer' | 'status' | 'banks', context?: any): boolean;
    /**
     * Calculate transfer fee
     */
    calculateFee(amount: number, currency: string, transferType: string): Promise<number>;
}
/**
 * Base abstract class for payment providers
 * Provides common functionality that all providers can extend
 */
export declare abstract class BasePaymentProvider implements IPaymentProvider {
    abstract readonly name: string;
    abstract readonly region: string;
    abstract readonly capabilities: ProviderCapabilities;
    protected config: Record<string, any>;
    protected initialized: boolean;
    initialize(config: Record<string, any>): Promise<void>;
    protected ensureInitialized(): void;
    abstract validateAccount(request: AccountValidationRequest): Promise<AccountValidationResult>;
    abstract initiateTransfer(request: TransferRequest): Promise<TransferResponse>;
    abstract getTransferStatus(request: TransferStatusRequest): Promise<TransferStatusResponse>;
    abstract getBankList(request?: BankListRequest): Promise<BankInfo[]>;
    abstract getTransferLimits(currency: string): Promise<TransferLimits>;
    abstract calculateFee(amount: number, currency: string, transferType: string): Promise<number>;
    isSupported(operation: 'validate' | 'transfer' | 'status' | 'banks', context?: any): boolean;
}
/**
 * Provider Registry
 * Manages available payment providers and routes requests to the appropriate provider
 */
export declare class PaymentProviderRegistry {
    private providers;
    /**
     * Register a payment provider
     */
    register(provider: IPaymentProvider): void;
    /**
     * Get a specific provider by name
     */
    getProvider(name: string): IPaymentProvider | undefined;
    /**
     * Get provider for a specific region
     */
    getProviderForRegion(region: string): IPaymentProvider | undefined;
    /**
     * Get provider for a specific currency
     */
    getProviderForCurrency(currency: string): IPaymentProvider | undefined;
    /**
     * Get all registered providers
     */
    getAllProviders(): IPaymentProvider[];
    /**
     * Get provider based on bank code type
     */
    getProviderForBankCodeType(bankCodeType: string): IPaymentProvider | undefined;
}
export declare const paymentProviderRegistry: PaymentProviderRegistry;
//# sourceMappingURL=IPaymentProvider.d.ts.map