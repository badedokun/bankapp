/**
 * NIBSS (Nigeria Inter-Bank Settlement System) API Integration
 * Handles real-time money transfers between Nigerian banks
 */
export interface NIBSSTransferRequest {
    amount: string;
    sourceAccountNumber: string;
    sourceBankCode: string;
    destinationAccountNumber: string;
    destinationBankCode: string;
    narration: string;
    reference: string;
    beneficiaryName?: string;
}
export interface NIBSSTransferResponse {
    success: boolean;
    transactionId: string;
    reference: string;
    status: 'pending' | 'successful' | 'failed' | 'reversed';
    message: string;
    fee?: string;
    responseCode?: string;
    sessionId?: string;
}
export interface NIBSSAccountInquiryRequest {
    accountNumber: string;
    bankCode: string;
}
export interface NIBSSAccountInquiryResponse {
    success: boolean;
    accountNumber: string;
    accountName: string;
    bankCode: string;
    bankName: string;
    message: string;
}
export interface NIBSSBankListResponse {
    success: boolean;
    banks: Array<{
        code: string;
        name: string;
        longCode?: string;
        active: boolean;
    }>;
}
export interface NIBSSTransactionStatusRequest {
    reference: string;
    transactionId?: string;
}
export declare class NIBSSService {
    private config;
    constructor();
    /**
     * Initiate a bank transfer via NIBSS
     */
    initiateTransfer(request: NIBSSTransferRequest): Promise<NIBSSTransferResponse>;
    /**
     * Perform account name inquiry
     */
    accountInquiry(request: NIBSSAccountInquiryRequest): Promise<NIBSSAccountInquiryResponse>;
    /**
     * Get list of supported banks
     */
    getBankList(): Promise<NIBSSBankListResponse>;
    /**
     * Check transaction status
     */
    getTransactionStatus(request: NIBSSTransactionStatusRequest): Promise<NIBSSTransferResponse>;
    private isStubMode;
    private buildHeaders;
    private generateSignature;
    private mapNIBSSStatus;
    private getBankName;
    private stubTransferResponse;
    private stubAccountInquiryResponse;
    private stubBankListResponse;
    private stubTransactionStatusResponse;
}
export declare const nibssService: NIBSSService;
//# sourceMappingURL=nibss.d.ts.map