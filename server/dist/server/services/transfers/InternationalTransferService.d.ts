/**
 * International Transfer Service (SWIFT Integration)
 * Handles cross-border transfers via SWIFT network
 */
import { Pool } from 'pg';
import { InternationalTransferRequest, TransferResponse } from '../../types/transfers';
declare class InternationalTransferService {
    private db;
    private swiftBaseUrl;
    private swiftApiKey;
    private swiftBic;
    private complianceApiUrl;
    private currencyApiUrl;
    constructor(database: Pool);
    /**
     * Process international transfer via SWIFT
     */
    processTransfer(request: InternationalTransferRequest, userId: string): Promise<TransferResponse>;
    /**
     * Perform compliance checks (AML, KYC, Sanctions)
     */
    private performComplianceChecks;
    /**
     * Get exchange rate for currency conversion
     */
    private getExchangeRate;
    /**
     * Calculate international transfer fees
     */
    private calculateInternationalFees;
    /**
     * Process SWIFT transfer
     */
    private processSWIFTTransfer;
    /**
     * Send SWIFT message (mock implementation)
     */
    private sendSWIFTMessage;
    /**
     * Reverse failed transfer
     */
    private reverseFailedTransfer;
    /**
     * Helper methods
     */
    private getCurrencyForCountry;
    private getRegionForCountry;
    /**
     * Validation and utility methods
     */
    private validateTransferRequest;
    private getSenderAccount;
    private checkInternationalLimits;
    /**
     * Get transfer status
     */
    getTransferStatus(transferId: string): Promise<any>;
    /**
     * Get transfer history
     */
    getTransferHistory(accountId: string, limit?: number): Promise<any[]>;
}
export default InternationalTransferService;
//# sourceMappingURL=InternationalTransferService.d.ts.map