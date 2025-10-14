/**
 * Interac Payment Provider
 *
 * Interac e-Transfer implementation for Canada
 * Supports:
 * - Interac e-Transfer
 * - Account verification
 * - Canadian bank transfers
 * - Instant transfers (typically under 30 minutes)
 *
 * Integration: Interac Network
 */
import { BasePaymentProvider, AccountValidationRequest, AccountValidationResult, TransferRequest, TransferResponse, TransferStatusRequest, TransferStatusResponse, BankListRequest, BankInfo, TransferLimits, ProviderCapabilities } from './IPaymentProvider';
export declare class InteracProvider extends BasePaymentProvider {
    readonly name = "Interac";
    readonly region = "Canada";
    readonly capabilities: ProviderCapabilities;
    private client;
    private interacConfig;
    initialize(config: Record<string, any>): Promise<void>;
    /**
     * Validate Canadian bank account
     * Format: Institution Number (3) + Transit Number (5) + Account Number (7-12)
     */
    validateAccount(request: AccountValidationRequest): Promise<AccountValidationResult>;
    /**
     * Initiate Interac e-Transfer
     */
    initiateTransfer(request: TransferRequest): Promise<TransferResponse>;
    /**
     * Get Interac transfer status
     */
    getTransferStatus(request: TransferStatusRequest): Promise<TransferStatusResponse>;
    /**
     * Get list of Canadian banks
     */
    getBankList(request?: BankListRequest): Promise<BankInfo[]>;
    /**
     * Get Interac transfer limits
     */
    getTransferLimits(currency: string): Promise<TransferLimits>;
    /**
     * Calculate Interac transfer fee
     */
    calculateFee(amount: number, currency: string, transferType: string): Promise<number>;
    /**
     * Parse Canadian bank account format
     * Accepts formats:
     * - 003-12345-1234567 (with dashes)
     * - 003 12345 1234567 (with spaces)
     * - 00312345001234567 (continuous)
     */
    private parseCanadianAccount;
    /**
     * Get bank name from institution number
     */
    private getBankNameFromInstitution;
    /**
     * Mock Interac account validation
     * In production, this would call Interac validation API
     */
    private mockInteracValidation;
    /**
     * Generate request signature for Interac API
     */
    private generateSignature;
    /**
     * Mask account number for security
     */
    private maskAccountNumber;
}
//# sourceMappingURL=InteracProvider.d.ts.map