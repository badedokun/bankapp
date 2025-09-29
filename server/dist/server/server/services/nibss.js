"use strict";
/**
 * NIBSS (Nigeria Inter-Bank Settlement System) API Integration
 * Handles real-time money transfers between Nigerian banks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.nibssService = exports.NIBSSService = void 0;
class NIBSSService {
    constructor() {
        this.config = {
            baseUrl: process.env.NIBSS_BASE_URL || 'https://apitest.nibss-plc.com.ng',
            apiKey: process.env.NIBSS_API_KEY || 'STUBBED_API_KEY',
            clientId: process.env.NIBSS_CLIENT_ID || 'STUBBED_CLIENT_ID',
            clientSecret: process.env.NIBSS_CLIENT_SECRET || 'STUBBED_CLIENT_SECRET',
            environment: process.env.NIBSS_ENVIRONMENT || 'sandbox',
            timeout: parseInt(process.env.NIBSS_TIMEOUT || '30000'),
            resetUrl: process.env.NIBSS_RESET_URL || 'https://apitest.nibss-plc.com.ng/v2/reset',
            merchantId: process.env.NIBSS_MERCHANT_ID || 'STUBBED_MERCHANT_ID',
        };
    }
    /**
     * Initiate a bank transfer via NIBSS
     */
    async initiateTransfer(request) {
        console.log('🏦 NIBSS Transfer Request:', request);
        // STUB: Return mock response until we have real API credentials
        if (this.isStubMode()) {
            return this.stubTransferResponse(request);
        }
        try {
            const payload = {
                amount: request.amount,
                sourceAccount: request.sourceAccountNumber,
                sourceBankCode: request.sourceBankCode,
                destinationAccount: request.destinationAccountNumber,
                destinationBankCode: request.destinationBankCode,
                narration: request.narration,
                reference: request.reference,
                beneficiaryName: request.beneficiaryName,
            };
            const headers = this.buildHeaders();
            const response = await fetch(`${this.config.baseUrl}/nip/transfer`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(this.config.timeout),
            });
            if (!response.ok) {
                throw new Error(`NIBSS API Error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return {
                success: data.status === '00',
                transactionId: data.transactionId || data.sessionId,
                reference: request.reference,
                status: this.mapNIBSSStatus(data.status),
                message: data.message || data.responseMessage,
                fee: data.fee,
                responseCode: data.status,
                sessionId: data.sessionId,
            };
        }
        catch (error) {
            console.error('NIBSS Transfer Error:', error);
            return {
                success: false,
                transactionId: '',
                reference: request.reference,
                status: 'failed',
                message: error instanceof Error ? error.message : 'Transfer failed',
            };
        }
    }
    /**
     * Perform account name inquiry
     */
    async accountInquiry(request) {
        console.log('🔍 NIBSS Account Inquiry:', request);
        // STUB: Return mock response until we have real API credentials
        if (this.isStubMode()) {
            return this.stubAccountInquiryResponse(request);
        }
        try {
            const payload = {
                accountNumber: request.accountNumber,
                bankCode: request.bankCode,
            };
            const headers = this.buildHeaders();
            const response = await fetch(`${this.config.baseUrl}/nip/account-inquiry`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(this.config.timeout),
            });
            if (!response.ok) {
                throw new Error(`NIBSS API Error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return {
                success: data.status === '00',
                accountNumber: request.accountNumber,
                accountName: data.accountName || data.beneficiaryName || '',
                bankCode: request.bankCode,
                bankName: data.bankName || this.getBankName(request.bankCode),
                message: data.message || data.responseMessage || 'Account inquiry successful',
            };
        }
        catch (error) {
            console.error('NIBSS Account Inquiry Error:', error);
            return {
                success: false,
                accountNumber: request.accountNumber,
                accountName: '',
                bankCode: request.bankCode,
                bankName: '',
                message: error instanceof Error ? error.message : 'Account inquiry failed',
            };
        }
    }
    /**
     * Get list of supported banks
     */
    async getBankList() {
        console.log('🏛️ NIBSS Get Bank List');
        // STUB: Return mock response until we have real API credentials
        if (this.isStubMode()) {
            return this.stubBankListResponse();
        }
        try {
            const headers = this.buildHeaders();
            const response = await fetch(`${this.config.baseUrl}/banks`, {
                method: 'GET',
                headers,
                signal: AbortSignal.timeout(this.config.timeout),
            });
            if (!response.ok) {
                throw new Error(`NIBSS API Error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return {
                success: true,
                banks: data.banks || data.data || [],
            };
        }
        catch (error) {
            console.error('NIBSS Bank List Error:', error);
            return {
                success: false,
                banks: [],
            };
        }
    }
    /**
     * Check transaction status
     */
    async getTransactionStatus(request) {
        console.log('📊 NIBSS Transaction Status:', request);
        // STUB: Return mock response until we have real API credentials
        if (this.isStubMode()) {
            return this.stubTransactionStatusResponse(request);
        }
        try {
            const payload = {
                reference: request.reference,
                transactionId: request.transactionId,
            };
            const headers = this.buildHeaders();
            const response = await fetch(`${this.config.baseUrl}/nip/transaction-status`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(this.config.timeout),
            });
            if (!response.ok) {
                throw new Error(`NIBSS API Error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return {
                success: data.status === '00',
                transactionId: data.transactionId || request.transactionId || '',
                reference: request.reference,
                status: this.mapNIBSSStatus(data.status),
                message: data.message || data.responseMessage || '',
                responseCode: data.status,
            };
        }
        catch (error) {
            console.error('NIBSS Transaction Status Error:', error);
            return {
                success: false,
                transactionId: request.transactionId || '',
                reference: request.reference,
                status: 'failed',
                message: error instanceof Error ? error.message : 'Status check failed',
            };
        }
    }
    // Private helper methods
    isStubMode() {
        return this.config.apiKey === 'STUBBED_API_KEY' || this.config.environment === 'sandbox';
    }
    buildHeaders() {
        const timestamp = Date.now().toString();
        const signature = this.generateSignature(timestamp);
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
            'X-Client-ID': this.config.clientId,
            'X-Client-Secret': this.config.clientSecret,
            'X-Timestamp': timestamp,
            'X-Signature': signature,
        };
    }
    generateSignature(timestamp) {
        // TODO: Implement proper HMAC-SHA256 signature when we have real credentials
        return `stub_signature_${timestamp}`;
    }
    mapNIBSSStatus(nibssStatus) {
        switch (nibssStatus) {
            case '00': return 'successful';
            case '01':
            case '02':
            case '03': return 'pending';
            case '90':
            case '91': return 'reversed';
            default: return 'failed';
        }
    }
    getBankName(bankCode) {
        const bankNames = {
            '011': 'First Bank of Nigeria',
            '044': 'Access Bank',
            '014': 'Afribank Nigeria',
            '023': 'Citibank Nigeria',
            '058': 'Guaranty Trust Bank',
            '076': 'Skye Bank',
            '082': 'Keystone Bank',
            '221': 'Stanbic IBTC Bank',
            '068': 'Standard Chartered Bank',
            '232': 'Sterling Bank',
            '032': 'Union Bank of Nigeria',
            '033': 'United Bank for Africa',
            '035': 'Wema Bank',
            '057': 'Zenith Bank',
            // Add more bank codes as needed
        };
        return bankNames[bankCode] || 'Unknown Bank';
    }
    // STUB METHODS - These will be used until we have real NIBSS API credentials
    stubTransferResponse(request) {
        const amount = parseFloat(request.amount);
        const fee = Math.min(amount * 0.01, 50); // 1% fee, max ₦50
        // Simulate some realistic scenarios
        if (amount > 1000000) {
            return {
                success: false,
                transactionId: '',
                reference: request.reference,
                status: 'failed',
                message: 'Amount exceeds daily transfer limit',
                responseCode: '61',
            };
        }
        if (request.destinationAccountNumber === '0000000000') {
            return {
                success: false,
                transactionId: '',
                reference: request.reference,
                status: 'failed',
                message: 'Invalid account number',
                responseCode: '25',
            };
        }
        return {
            success: true,
            transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            reference: request.reference,
            status: 'successful',
            message: 'Transfer completed successfully',
            fee: fee.toFixed(2),
            responseCode: '00',
            sessionId: `SES_${Date.now()}`,
        };
    }
    stubAccountInquiryResponse(request) {
        // Simulate account inquiry with some test accounts
        const testAccounts = {
            '1234567890': 'John Doe',
            '0987654321': 'Jane Smith',
            '1111111111': 'Test Account',
            '2222222222': 'Demo User',
        };
        const accountName = testAccounts[request.accountNumber] || 'ACCOUNT HOLDER';
        if (request.accountNumber === '0000000000') {
            return {
                success: false,
                accountNumber: request.accountNumber,
                accountName: '',
                bankCode: request.bankCode,
                bankName: '',
                message: 'Invalid account number',
            };
        }
        return {
            success: true,
            accountNumber: request.accountNumber,
            accountName,
            bankCode: request.bankCode,
            bankName: this.getBankName(request.bankCode),
            message: 'Account inquiry successful',
        };
    }
    stubBankListResponse() {
        return {
            success: true,
            banks: [
                { code: '011', name: 'First Bank of Nigeria', active: true },
                { code: '044', name: 'Access Bank', active: true },
                { code: '014', name: 'Afribank Nigeria', active: true },
                { code: '023', name: 'Citibank Nigeria', active: true },
                { code: '058', name: 'Guaranty Trust Bank', active: true },
                { code: '076', name: 'Skye Bank', active: true },
                { code: '082', name: 'Keystone Bank', active: true },
                { code: '221', name: 'Stanbic IBTC Bank', active: true },
                { code: '068', name: 'Standard Chartered Bank', active: true },
                { code: '232', name: 'Sterling Bank', active: true },
                { code: '032', name: 'Union Bank of Nigeria', active: true },
                { code: '033', name: 'United Bank for Africa', active: true },
                { code: '035', name: 'Wema Bank', active: true },
                { code: '057', name: 'Zenith Bank', active: true },
            ],
        };
    }
    stubTransactionStatusResponse(request) {
        // Simulate checking transaction status
        return {
            success: true,
            transactionId: request.transactionId || `TXN_${Date.now()}`,
            reference: request.reference,
            status: 'successful',
            message: 'Transaction completed successfully',
            responseCode: '00',
        };
    }
}
exports.NIBSSService = NIBSSService;
// Export singleton instance
exports.nibssService = new NIBSSService();
