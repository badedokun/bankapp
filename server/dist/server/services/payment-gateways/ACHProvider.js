"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACHProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const IPaymentProvider_1 = require("./IPaymentProvider");
class ACHProvider extends IPaymentProvider_1.BasePaymentProvider {
    constructor() {
        super(...arguments);
        this.name = 'ACH';
        this.region = 'USA';
        this.capabilities = {
            supportsAccountValidation: true,
            supportsInstantTransfer: false, // ACH takes 1-3 business days
            supportsScheduledTransfer: true,
            supportsInternationalTransfer: false,
            supportedCurrencies: ['USD'],
            supportedCountries: ['US'],
            averageProcessingTime: '1-3 business days'
        };
        this.plaidClient = null;
        this.achProcessorClient = null;
        this.achConfig = null;
    }
    async initialize(config) {
        await super.initialize(config);
        this.achConfig = {
            plaidClientId: config.plaidClientId || process.env.PLAID_CLIENT_ID || '',
            plaidSecret: config.plaidSecret || process.env.PLAID_SECRET || '',
            plaidEnvironment: config.plaidEnvironment || 'sandbox',
            achProcessorUrl: config.achProcessorUrl || process.env.ACH_PROCESSOR_URL || '',
            achProcessorApiKey: config.achProcessorApiKey || process.env.ACH_PROCESSOR_API_KEY || ''
        };
        // Initialize Plaid client for account verification
        this.plaidClient = axios_1.default.create({
            baseURL: `https://${this.achConfig.plaidEnvironment}.plaid.com`,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'PLAID-CLIENT-ID': this.achConfig.plaidClientId,
                'PLAID-SECRET': this.achConfig.plaidSecret
            }
        });
        // Initialize ACH processor client (Stripe/Dwolla)
        this.achProcessorClient = axios_1.default.create({
            baseURL: this.achConfig.achProcessorUrl,
            timeout: 60000, // ACH can take longer
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.achConfig.achProcessorApiKey}`
            }
        });
    }
    /**
     * Validate US bank account using Plaid
     * Routing number: 9 digits
     * Account number: Variable length (4-17 digits)
     */
    async validateAccount(request) {
        this.ensureInitialized();
        try {
            if (!this.plaidClient || !this.achConfig) {
                throw new Error('ACH client not initialized');
            }
            // Validate routing number format
            if (request.bankCode.length !== 9) {
                return {
                    isValid: false,
                    errorMessage: 'US routing numbers must be 9 digits',
                    errorCode: 'INVALID_ROUTING'
                };
            }
            // Validate account number format (basic check)
            if (request.accountNumber.length < 4 || request.accountNumber.length > 17) {
                return {
                    isValid: false,
                    errorMessage: 'US account numbers must be 4-17 digits',
                    errorCode: 'INVALID_ACCOUNT'
                };
            }
            // In production, use Plaid Auth to verify account
            // For now, return mock validation
            const response = await this.mockPlaidVerification(request);
            return {
                isValid: true,
                accountName: response.accountName,
                accountNumber: this.maskAccountNumber(request.accountNumber),
                bankName: await this.getBankNameFromRouting(request.bankCode)
            };
        }
        catch (error) {
            return {
                isValid: false,
                errorMessage: error.message || 'Account validation error',
                errorCode: 'ACH_ERROR'
            };
        }
    }
    /**
     * Initiate ACH transfer
     */
    async initiateTransfer(request) {
        this.ensureInitialized();
        try {
            if (!this.achProcessorClient || !this.achConfig) {
                throw new Error('ACH processor not initialized');
            }
            // Validate currency
            if (request.currency !== 'USD') {
                return {
                    success: false,
                    transactionReference: request.reference,
                    status: 'failed',
                    message: 'ACH only supports USD currency',
                    errorCode: 'INVALID_CURRENCY'
                };
            }
            const fee = await this.calculateFee(request.amount, request.currency, request.transferType);
            const totalAmount = request.amount + fee;
            // ACH transfer payload
            const payload = {
                source: {
                    account_number: request.fromAccountNumber,
                    routing_number: request.fromBankCode
                },
                destination: {
                    account_number: request.toAccountNumber,
                    routing_number: request.toBankCode
                },
                amount: Math.round(request.amount * 100), // Convert to cents
                currency: 'usd',
                description: request.narration.substring(0, 80),
                idempotency_key: request.reference,
                metadata: {
                    tenant_id: request.tenantId,
                    user_id: request.userId,
                    transfer_type: request.transferType
                }
            };
            // Simulate ACH processing
            // In production, this would call Stripe/Dwolla API
            const estimatedCompletionTime = new Date();
            estimatedCompletionTime.setDate(estimatedCompletionTime.getDate() + 3);
            return {
                success: true,
                transactionReference: request.reference,
                providerReference: `ach_${Date.now()}`,
                status: 'processing',
                message: 'ACH transfer initiated. Processing time: 1-3 business days',
                fee,
                totalAmount,
                estimatedCompletionTime
            };
        }
        catch (error) {
            return {
                success: false,
                transactionReference: request.reference,
                status: 'failed',
                message: error.message || 'ACH transfer error',
                errorCode: 'ACH_ERROR'
            };
        }
    }
    /**
     * Get ACH transfer status
     */
    async getTransferStatus(request) {
        this.ensureInitialized();
        try {
            // In production, query Stripe/Dwolla for transfer status
            // For now, return mock status
            return {
                transactionReference: request.transactionReference,
                providerReference: request.providerReference,
                status: 'processing',
                metadata: {
                    estimatedCompletion: '1-3 business days',
                    note: 'ACH transfers are processed in batches'
                }
            };
        }
        catch (error) {
            return {
                transactionReference: request.transactionReference,
                status: 'failed',
                failureReason: error.message
            };
        }
    }
    /**
     * Get list of US banks
     */
    async getBankList(request) {
        // Static list of major US banks
        // In production, this would be a comprehensive database
        return [
            {
                bankCode: '021000021',
                bankName: 'JPMorgan Chase Bank',
                bankCodeType: 'ROUTING',
                country: 'US',
                currency: 'USD',
                swiftCode: 'CHASUS33',
                active: true
            },
            {
                bankCode: '026009593',
                bankName: 'Bank of America',
                bankCodeType: 'ROUTING',
                country: 'US',
                currency: 'USD',
                swiftCode: 'BOFAUS3N',
                active: true
            },
            {
                bankCode: '121000248',
                bankName: 'Wells Fargo Bank',
                bankCodeType: 'ROUTING',
                country: 'US',
                currency: 'USD',
                swiftCode: 'WFBIUS6S',
                active: true
            },
            {
                bankCode: '021300077',
                bankName: 'Citibank',
                bankCodeType: 'ROUTING',
                country: 'US',
                currency: 'USD',
                swiftCode: 'CITIUS33',
                active: true
            },
            {
                bankCode: '031201360',
                bankName: 'TD Bank',
                bankCodeType: 'ROUTING',
                country: 'US',
                currency: 'USD',
                swiftCode: 'NRTHUS33',
                active: true
            },
            {
                bankCode: '063100277',
                bankName: 'U.S. Bank',
                bankCodeType: 'ROUTING',
                country: 'US',
                currency: 'USD',
                swiftCode: 'USBKUS44',
                active: true
            }
        ];
    }
    /**
     * Get ACH transfer limits
     */
    async getTransferLimits(currency) {
        if (currency !== 'USD') {
            throw new Error('ACH only supports USD currency');
        }
        // Standard ACH limits (can be customized per tenant)
        return {
            minAmount: 1,
            maxAmount: 1000000, // $1M per transaction
            dailyLimit: 5000000, // $5M per day
            monthlyLimit: 20000000, // $20M per month
            currency: 'USD'
        };
    }
    /**
     * Calculate ACH transfer fee
     */
    async calculateFee(amount, currency, transferType) {
        if (currency !== 'USD') {
            throw new Error('ACH only supports USD currency');
        }
        // ACH fees are typically flat rate
        // Standard: $0.25 - $1.50 per transaction
        if (transferType === 'internal') {
            return 0; // Free for internal transfers
        }
        else {
            return 0.75; // $0.75 for external ACH
        }
    }
    /**
     * Mock Plaid account verification
     * In production, this would call Plaid Auth API
     */
    async mockPlaidVerification(request) {
        // Simulate Plaid verification delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            accountName: 'John Doe' // Mock account name
        };
    }
    /**
     * Get bank name from routing number
     */
    async getBankNameFromRouting(routingNumber) {
        const banks = await this.getBankList();
        const bank = banks.find(b => b.bankCode === routingNumber);
        return bank?.bankName || 'Unknown Bank';
    }
    /**
     * Mask account number for security
     */
    maskAccountNumber(accountNumber) {
        if (accountNumber.length <= 4) {
            return accountNumber;
        }
        const lastFour = accountNumber.slice(-4);
        return `****${lastFour}`;
    }
}
exports.ACHProvider = ACHProvider;
//# sourceMappingURL=ACHProvider.js.map