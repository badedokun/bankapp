import { Pool } from 'pg';
import { InternalTransferRequest, TransferResult, TransferValidationRequest, TransferValidationResult, ITransferService } from '../../types/transfers';
export declare class InternalTransferService implements ITransferService {
    private db;
    constructor(db: Pool);
    /**
     * Process an internal transfer between wallets within the same tenant
     */
    processTransfer(request: InternalTransferRequest): Promise<TransferResult>;
    /**
     * Validate transfer request and check limits
     */
    validateTransfer(request: TransferValidationRequest): Promise<TransferValidationResult>;
    /**
     * Get transfer status
     */
    getTransferStatus(transactionId: string): Promise<TransferResult>;
    /**
     * Cancel transfer (only pending transfers can be cancelled)
     */
    cancelTransfer(transactionId: string, reason: string): Promise<TransferResult>;
    /**
     * Retry transfer (not applicable for internal transfers as they're instant)
     */
    retryTransfer(transactionId: string): Promise<TransferResult>;
    private getWalletDetails;
    private validateBalanceAndLimits;
    private generateTransferReference;
    private createTransferRecord;
    private executeTransfer;
    private updateTransferTracking;
    private logWalletTransaction;
    private createAuditTrail;
    /**
     * Get user's internal transfers history
     */
    getTransferHistory(customerId: string, options?: any): Promise<any>;
}
//# sourceMappingURL=InternalTransferService.d.ts.map