/**
 * SEPA Payment Provider
 *
 * Single Euro Payments Area (SEPA) implementation for Europe
 * Supports:
 * - SEPA Credit Transfer (SCT)
 * - SEPA Instant Credit Transfer (SCT Inst)
 * - IBAN validation
 * - European bank transfers
 *
 * Integration: SEPA Credit Transfer Network
 */
import { BasePaymentProvider, AccountValidationRequest, AccountValidationResult, TransferRequest, TransferResponse, TransferStatusRequest, TransferStatusResponse, BankListRequest, BankInfo, TransferLimits, ProviderCapabilities } from './IPaymentProvider';
export declare class SEPAProvider extends BasePaymentProvider {
    readonly name = "SEPA";
    readonly region = "Europe";
    readonly capabilities: ProviderCapabilities;
    private client;
    private sepaConfig;
    initialize(config: Record<string, any>): Promise<void>;
    /**
     * Validate IBAN (International Bank Account Number)
     * IBAN format: up to 34 alphanumeric characters
     * Example: DE89370400440532013000
     */
    validateAccount(request: AccountValidationRequest): Promise<AccountValidationResult>;
    /**
     * Initiate SEPA Credit Transfer
     */
    initiateTransfer(request: TransferRequest): Promise<TransferResponse>;
    /**
     * Get SEPA transfer status
     */
    getTransferStatus(request: TransferStatusRequest): Promise<TransferStatusResponse>;
    /**
     * Get list of European banks in SEPA zone
     */
    getBankList(request?: BankListRequest): Promise<BankInfo[]>;
    /**
     * Get SEPA transfer limits
     */
    getTransferLimits(currency: string): Promise<TransferLimits>;
    /**
     * Calculate SEPA transfer fee
     */
    calculateFee(amount: number, currency: string, transferType: string): Promise<number>;
    /**
     * Validate IBAN checksum using mod 97 algorithm
     */
    private validateIBANChecksum;
    /**
     * Format IBAN with spaces for readability
     */
    private formatIBAN;
    /**
     * Mock SEPA account validation
     * In production, this would call SEPA validation API
     */
    private mockSEPAValidation;
    /**
     * Get bank name from BIC/SWIFT code
     */
    private getBankNameFromBIC;
    /**
     * Get default bank name for country
     */
    private getDefaultBankName;
}
//# sourceMappingURL=SEPAProvider.d.ts.map