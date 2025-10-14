/**
 * ACH Payment Provider
 *
 * Automated Clearing House (ACH) implementation for USA
 * Supports:
 * - ACH transfers
 * - Account verification
 * - US bank transfers
 *
 * Integration: Plaid + Stripe/Dwolla for ACH processing
 */
import { BasePaymentProvider, AccountValidationRequest, AccountValidationResult, TransferRequest, TransferResponse, TransferStatusRequest, TransferStatusResponse, BankListRequest, BankInfo, TransferLimits, ProviderCapabilities } from './IPaymentProvider';
export declare class ACHProvider extends BasePaymentProvider {
    readonly name = "ACH";
    readonly region = "USA";
    readonly capabilities: ProviderCapabilities;
    private plaidClient;
    private achProcessorClient;
    private achConfig;
    initialize(config: Record<string, any>): Promise<void>;
    /**
     * Validate US bank account using Plaid
     * Routing number: 9 digits
     * Account number: Variable length (4-17 digits)
     */
    validateAccount(request: AccountValidationRequest): Promise<AccountValidationResult>;
    /**
     * Initiate ACH transfer
     */
    initiateTransfer(request: TransferRequest): Promise<TransferResponse>;
    /**
     * Get ACH transfer status
     */
    getTransferStatus(request: TransferStatusRequest): Promise<TransferStatusResponse>;
    /**
     * Get list of US banks
     */
    getBankList(request?: BankListRequest): Promise<BankInfo[]>;
    /**
     * Get ACH transfer limits
     */
    getTransferLimits(currency: string): Promise<TransferLimits>;
    /**
     * Calculate ACH transfer fee
     */
    calculateFee(amount: number, currency: string, transferType: string): Promise<number>;
    /**
     * Mock Plaid account verification
     * In production, this would call Plaid Auth API
     */
    private mockPlaidVerification;
    /**
     * Get bank name from routing number
     */
    private getBankNameFromRouting;
    /**
     * Mask account number for security
     */
    private maskAccountNumber;
}
//# sourceMappingURL=ACHProvider.d.ts.map