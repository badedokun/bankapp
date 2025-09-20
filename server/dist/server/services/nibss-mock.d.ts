/**
 * Mock NIBSS Service for Local Development
 * Simulates NIBSS API responses for testing without network dependencies
 */
export declare class NIBSSMockService {
    private readonly isEnabled;
    constructor();
    /**
     * Mock OAuth2 token response
     */
    mockTokenResponse(): {
        access_token: string;
        token_type: string;
        expires_in: number;
        scope: string;
    };
    /**
     * Mock bank list response
     */
    mockBankListResponse(): {
        status: string;
        data: {
            code: string;
            name: string;
            longCode: string;
            active: boolean;
        }[];
    };
    /**
     * Mock name enquiry response
     */
    mockNameEnquiryResponse(accountNumber: string, bankCode: string): {
        status: string;
        data: {
            accountNumber: string;
            accountName: string;
            bankCode: string;
            bankName: string;
            responseCode: string;
            responseMessage: string;
        };
    };
    /**
     * Mock transfer response
     */
    mockTransferResponse(): {
        status: string;
        data: {
            transactionId: string;
            reference: string;
            status: string;
            responseCode: string;
            responseMessage: string;
            sessionId: string;
        };
    };
    /**
     * Mock transaction status response
     */
    mockTransactionStatusResponse(transactionId: string): {
        status: string;
        data: {
            transactionId: string;
            status: string;
            responseCode: string;
            responseMessage: string;
        };
    };
    /**
     * Get bank name by code
     */
    private getBankName;
    /**
     * Check if mock service should be used
     */
    shouldUseMock(): boolean;
}
export declare const nibssMockService: NIBSSMockService;
//# sourceMappingURL=nibss-mock.d.ts.map