/**
 * External Transfer Service (NIBSS NIP Integration)
 * Handles interbank transfers via Nigeria Instant Payment (NIP)
 */
import { Pool } from 'pg';
import { ExternalTransferRequest, TransferResponse } from '../../types/transfers';
declare class ExternalTransferService {
    private db;
    private nibssBaseUrl;
    private nibssApiKey;
    private channelCode;
    private institutionCode;
    constructor(database: Pool);
    /**
     * Process external transfer via NIBSS NIP
     */
    processTransfer(request: ExternalTransferRequest, userId: string): Promise<TransferResponse>;
    /**
     * Verify recipient account via NIBSS Name Enquiry
     */
    verifyRecipientAccount(accountNumber: string, bankCode: string): Promise<{
        isValid: boolean;
        accountName?: string;
        bankName?: string;
        bvn?: string;
        kycLevel?: string;
    }>;
    /**
     * Process NIBSS transfer
     */
    private processNIBSSTransfer;
    /**
     * Reverse failed transfer
     */
    private reverseFailedTransfer;
    /**
     * Save beneficiary
     */
    private saveBeneficiary;
    /**
     * Get bank name by code
     */
    private getBankName;
    /**
     * Calculate transfer fee
     */
    private calculateTransferFee;
    /**
     * Validate transfer request
     */
    private validateTransferRequest;
    /**
     * Get sender account details
     */
    private getSenderAccount;
    /**
     * Check transfer limits
     */
    private checkTransferLimits;
    /**
     * Get transfer status
     */
    getTransferStatus(transferId: string): Promise<any>;
    /**
     * Get transfer history
     */
    getTransferHistory(accountId: string, limit?: number): Promise<any[]>;
}
export default ExternalTransferService;
//# sourceMappingURL=ExternalTransferService.d.ts.map