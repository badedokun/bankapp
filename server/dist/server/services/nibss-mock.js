"use strict";
/**
 * Mock NIBSS Service for Local Development
 * Simulates NIBSS API responses for testing without network dependencies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.nibssMockService = exports.NIBSSMockService = void 0;
class NIBSSMockService {
    constructor() {
        this.isEnabled = process.env.NODE_ENV === 'development' &&
            process.env.NIBSS_USE_MOCK === 'true';
        if (this.isEnabled) {
            console.log('🎭 NIBSS Mock Service enabled for local development');
        }
    }
    /**
     * Mock OAuth2 token response
     */
    mockTokenResponse() {
        return {
            access_token: 'mock_access_token_' + Date.now(),
            token_type: 'Bearer',
            expires_in: 3600,
            scope: 'nip:read nip:write'
        };
    }
    /**
     * Mock bank list response
     */
    mockBankListResponse() {
        return {
            status: 'success',
            data: [
                {
                    code: '044',
                    name: 'Access Bank',
                    longCode: '044150149',
                    active: true
                },
                {
                    code: '014',
                    name: 'Afribank Nigeria Plc',
                    longCode: '014150008',
                    active: true
                },
                {
                    code: '023',
                    name: 'Citibank Nigeria Limited',
                    longCode: '023150005',
                    active: true
                },
                {
                    code: '050',
                    name: 'Ecobank Nigeria Plc',
                    longCode: '050150010',
                    active: true
                },
                {
                    code: '070',
                    name: 'Fidelity Bank',
                    longCode: '070150003',
                    active: true
                },
                {
                    code: '011',
                    name: 'First Bank of Nigeria',
                    longCode: '011152303',
                    active: true
                },
                {
                    code: '214',
                    name: 'First City Monument Bank',
                    longCode: '214150018',
                    active: true
                },
                {
                    code: '058',
                    name: 'Guaranty Trust Bank',
                    longCode: '058152036',
                    active: true
                },
                {
                    code: '030',
                    name: 'Heritage Banking Company Ltd.',
                    longCode: '030159992',
                    active: true
                },
                {
                    code: '082',
                    name: 'Keystone Bank',
                    longCode: '082150017',
                    active: true
                },
                {
                    code: '076',
                    name: 'Polaris Bank',
                    longCode: '076151006',
                    active: true
                },
                {
                    code: '221',
                    name: 'Stanbic IBTC Bank',
                    longCode: '221159522',
                    active: true
                },
                {
                    code: '068',
                    name: 'Standard Chartered Bank Nigeria Ltd.',
                    longCode: '068150015',
                    active: true
                },
                {
                    code: '232',
                    name: 'Sterling Bank',
                    longCode: '232150016',
                    active: true
                },
                {
                    code: '032',
                    name: 'Union Bank of Nigeria',
                    longCode: '032080474',
                    active: true
                },
                {
                    code: '033',
                    name: 'United Bank For Africa',
                    longCode: '033153513',
                    active: true
                },
                {
                    code: '215',
                    name: 'Unity Bank',
                    longCode: '215154097',
                    active: true
                },
                {
                    code: '035',
                    name: 'Wema Bank',
                    longCode: '035150103',
                    active: true
                },
                {
                    code: '057',
                    name: 'Zenith Bank',
                    longCode: '057150013',
                    active: true
                }
            ]
        };
    }
    /**
     * Mock name enquiry response
     */
    mockNameEnquiryResponse(accountNumber, bankCode) {
        const names = [
            'JOHN DOE',
            'JANE SMITH',
            'AHMED IBRAHIM',
            'CHIOMA OKORO',
            'FATIMA ABDUL',
            'EMEKA NWANKWO',
            'AISHA MOHAMMED',
            'TUNDE ADEBAYO'
        ];
        const randomName = names[Math.floor(Math.random() * names.length)];
        return {
            status: 'success',
            data: {
                accountNumber,
                accountName: randomName,
                bankCode,
                bankName: this.getBankName(bankCode),
                responseCode: '00',
                responseMessage: 'Success'
            }
        };
    }
    /**
     * Mock transfer response
     */
    mockTransferResponse() {
        const transactionId = 'NIBSS_' + Date.now() + Math.floor(Math.random() * 1000);
        return {
            status: 'success',
            data: {
                transactionId,
                reference: 'TXN_' + Date.now(),
                status: 'pending',
                responseCode: '00',
                responseMessage: 'Transaction initiated successfully',
                sessionId: 'SES_' + Date.now()
            }
        };
    }
    /**
     * Mock transaction status response
     */
    mockTransactionStatusResponse(transactionId) {
        const statuses = ['pending', 'successful', 'failed'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        return {
            status: 'success',
            data: {
                transactionId,
                status: randomStatus,
                responseCode: randomStatus === 'successful' ? '00' : '01',
                responseMessage: randomStatus === 'successful'
                    ? 'Transaction completed successfully'
                    : randomStatus === 'failed'
                        ? 'Transaction failed'
                        : 'Transaction in progress'
            }
        };
    }
    /**
     * Get bank name by code
     */
    getBankName(bankCode) {
        const bankMap = {
            '044': 'Access Bank',
            '014': 'Afribank Nigeria Plc',
            '023': 'Citibank Nigeria Limited',
            '050': 'Ecobank Nigeria Plc',
            '070': 'Fidelity Bank',
            '011': 'First Bank of Nigeria',
            '214': 'First City Monument Bank',
            '058': 'Guaranty Trust Bank',
            '030': 'Heritage Banking Company Ltd.',
            '082': 'Keystone Bank',
            '076': 'Polaris Bank',
            '221': 'Stanbic IBTC Bank',
            '068': 'Standard Chartered Bank Nigeria Ltd.',
            '232': 'Sterling Bank',
            '032': 'Union Bank of Nigeria',
            '033': 'United Bank For Africa',
            '215': 'Unity Bank',
            '035': 'Wema Bank',
            '057': 'Zenith Bank'
        };
        return bankMap[bankCode] || 'Unknown Bank';
    }
    /**
     * Check if mock service should be used
     */
    shouldUseMock() {
        return this.isEnabled;
    }
}
exports.NIBSSMockService = NIBSSMockService;
exports.nibssMockService = new NIBSSMockService();
//# sourceMappingURL=nibss-mock.js.map