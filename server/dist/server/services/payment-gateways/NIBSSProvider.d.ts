/**
 * NIBSS Payment Provider
 *
 * Nigeria Inter-Bank Settlement System (NIBSS) implementation
 * Supports:
 * - NIP (NIBSS Instant Payment)
 * - Account name verification
 * - Nigerian bank transfers
 */
import { BasePaymentProvider, AccountValidationRequest, AccountValidationResult, TransferRequest, TransferResponse, TransferStatusRequest, TransferStatusResponse, BankListRequest, BankInfo, TransferLimits, ProviderCapabilities } from './IPaymentProvider';
export declare class NIBSSProvider extends BasePaymentProvider {
    readonly name = "NIBSS";
    readonly region = "Nigeria";
    readonly capabilities: ProviderCapabilities;
    private client;
    private nibssConfig;
    initialize(config: Record<string, any>): Promise<void>;
    /**
     * Validate Nigerian bank account using NIBSS Name Enquiry
     */
    validateAccount(request: AccountValidationRequest): Promise<AccountValidationResult>;
    /**
     * Initiate NIBSS Instant Payment (NIP) transfer
     */
    initiateTransfer(request: TransferRequest): Promise<TransferResponse>;
    /**
     * Get transfer status from NIBSS
     */
    getTransferStatus(request: TransferStatusRequest): Promise<TransferStatusResponse>;
    /**
     * Get list of Nigerian banks from NIBSS
     */
    getBankList(request?: BankListRequest): Promise<BankInfo[]>;
    /**
     * Get NIBSS transfer limits
     */
    getTransferLimits(currency: string): Promise<TransferLimits>;
    /**
     * Calculate NIBSS transfer fee
     * Based on CBN fee structure
     */
    calculateFee(amount: number, currency: string, transferType: string): Promise<number>;
    /**
     * Generate NIBSS request signature
     */
    private generateSignature;
    /**
     * Get bank name from bank code
     */
    private getBankName;
}
//# sourceMappingURL=NIBSSProvider.d.ts.map