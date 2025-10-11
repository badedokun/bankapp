"use strict";
/**
 * SEPA Payment Provider
 *
 * Single Euro Payments Area (SEPA) implementation for Europe
 * Supports:
 * - SEPA Credit Transfer (SCT)
 * - SEPA Instant Credit Transfer (SCT Inst)
 * - IBAN validation
 * - European bank transfers
 *
 * Integration: SEPA Credit Transfer Network
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEPAProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const IPaymentProvider_1 = require("./IPaymentProvider");
class SEPAProvider extends IPaymentProvider_1.BasePaymentProvider {
    constructor() {
        super(...arguments);
        this.name = 'SEPA';
        this.region = 'Europe';
        this.capabilities = {
            supportsAccountValidation: true,
            supportsInstantTransfer: true, // SEPA Instant
            supportsScheduledTransfer: true,
            supportsInternationalTransfer: false, // Only within SEPA zone
            supportedCurrencies: ['EUR'],
            supportedCountries: [
                'AT', 'BE', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU',
                'MT', 'NL', 'PT', 'SK', 'SI', 'ES', 'HR', 'BG', 'CZ', 'DK', 'HU', 'PL', 'RO',
                'SE', 'IS', 'LI', 'NO', 'CH', 'GB', 'MC', 'SM', 'VA'
            ],
            averageProcessingTime: '1 business day'
        };
        this.client = null;
        this.sepaConfig = null;
    }
    async initialize(config) {
        await super.initialize(config);
        this.sepaConfig = {
            baseUrl: config.baseUrl || process.env.SEPA_BASE_URL || 'https://api.sepa-network.eu',
            apiKey: config.apiKey || process.env.SEPA_API_KEY || '',
            merchantId: config.merchantId || process.env.SEPA_MERCHANT_ID || '',
            environment: config.environment || 'sandbox'
        };
        this.client = axios_1.default.create({
            baseURL: this.sepaConfig.baseUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.sepaConfig.apiKey}`,
                'X-Merchant-ID': this.sepaConfig.merchantId
            }
        });
    }
    /**
     * Validate IBAN (International Bank Account Number)
     * IBAN format: up to 34 alphanumeric characters
     * Example: DE89370400440532013000
     */
    async validateAccount(request) {
        this.ensureInitialized();
        try {
            if (!this.client || !this.sepaConfig) {
                throw new Error('SEPA client not initialized');
            }
            // Basic IBAN format validation
            const iban = request.accountNumber.replace(/\s/g, '').toUpperCase();
            if (iban.length < 15 || iban.length > 34) {
                return {
                    isValid: false,
                    errorMessage: 'IBAN must be between 15 and 34 characters',
                    errorCode: 'INVALID_IBAN_LENGTH'
                };
            }
            // IBAN must start with 2 letter country code
            if (!/^[A-Z]{2}[0-9]{2}/.test(iban)) {
                return {
                    isValid: false,
                    errorMessage: 'Invalid IBAN format. Must start with country code and check digits',
                    errorCode: 'INVALID_IBAN_FORMAT'
                };
            }
            // Extract country code
            const countryCode = iban.substring(0, 2);
            // Check if country is in SEPA zone
            if (!this.capabilities.supportedCountries.includes(countryCode)) {
                return {
                    isValid: false,
                    errorMessage: `Country ${countryCode} is not in SEPA zone`,
                    errorCode: 'INVALID_SEPA_COUNTRY'
                };
            }
            // IBAN checksum validation (mod 97)
            if (!this.validateIBANChecksum(iban)) {
                return {
                    isValid: false,
                    errorMessage: 'Invalid IBAN checksum',
                    errorCode: 'INVALID_IBAN_CHECKSUM'
                };
            }
            // In production, call SEPA validation API
            const response = await this.mockSEPAValidation(iban);
            return {
                isValid: true,
                accountName: response.accountHolderName,
                accountNumber: this.formatIBAN(iban),
                bankName: response.bankName || await this.getBankNameFromBIC(request.bankCode)
            };
        }
        catch (error) {
            return {
                isValid: false,
                errorMessage: error.message || 'Account validation error',
                errorCode: 'SEPA_ERROR'
            };
        }
    }
    /**
     * Initiate SEPA Credit Transfer
     */
    async initiateTransfer(request) {
        this.ensureInitialized();
        try {
            if (!this.client || !this.sepaConfig) {
                throw new Error('SEPA client not initialized');
            }
            // Validate currency
            if (request.currency !== 'EUR') {
                return {
                    success: false,
                    transactionReference: request.reference,
                    status: 'failed',
                    message: 'SEPA only supports EUR currency',
                    errorCode: 'INVALID_CURRENCY'
                };
            }
            // Determine transfer type (standard or instant)
            const isInstant = request.metadata?.instant === true;
            const fee = await this.calculateFee(request.amount, request.currency, isInstant ? 'instant' : 'standard');
            const totalAmount = request.amount + fee;
            // SEPA transfer payload
            const payload = {
                debtorIBAN: request.fromAccountNumber.replace(/\s/g, ''),
                debtorName: request.fromAccountName,
                debtorBIC: request.fromBankCode,
                creditorIBAN: request.toAccountNumber.replace(/\s/g, ''),
                creditorName: request.toAccountName,
                creditorBIC: request.toBankCode,
                amount: {
                    value: request.amount.toFixed(2),
                    currency: 'EUR'
                },
                remittanceInformation: request.narration.substring(0, 140), // SEPA allows up to 140 chars
                endToEndId: request.reference,
                instructionPriority: isInstant ? 'HIGH' : 'NORM',
                serviceLevel: isInstant ? 'INST' : 'SEPA',
                requestedExecutionDate: new Date().toISOString().split('T')[0]
            };
            // Simulate SEPA processing
            // In production, this would call SEPA network API
            const estimatedCompletionTime = new Date();
            if (isInstant) {
                // SEPA Instant: under 10 seconds, typically instant
                estimatedCompletionTime.setMinutes(estimatedCompletionTime.getMinutes() + 1);
            }
            else {
                // Standard SEPA: 1 business day
                estimatedCompletionTime.setDate(estimatedCompletionTime.getDate() + 1);
            }
            return {
                success: true,
                transactionReference: request.reference,
                providerReference: `SEPA${isInstant ? 'INST' : 'SCT'}-${Date.now()}`,
                status: isInstant ? 'completed' : 'processing',
                message: isInstant
                    ? 'SEPA Instant transfer completed'
                    : 'SEPA transfer initiated. Processing time: 1 business day',
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
                message: error.message || 'SEPA transfer error',
                errorCode: 'SEPA_ERROR'
            };
        }
    }
    /**
     * Get SEPA transfer status
     */
    async getTransferStatus(request) {
        this.ensureInitialized();
        try {
            // In production, query SEPA network for transfer status
            // For now, return mock status
            const isInstant = request.providerReference?.includes('INST');
            return {
                transactionReference: request.transactionReference,
                providerReference: request.providerReference,
                status: isInstant ? 'completed' : 'processing',
                metadata: {
                    transferType: isInstant ? 'SEPA Instant' : 'SEPA Credit Transfer',
                    estimatedCompletion: isInstant ? 'instant' : '1 business day',
                    note: isInstant
                        ? 'SEPA Instant transfers are completed within 10 seconds'
                        : 'Standard SEPA transfers take 1 business day'
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
     * Get list of European banks in SEPA zone
     */
    async getBankList(request) {
        // Static list of major European banks
        // In production, this would be a comprehensive database
        const banks = [
            {
                bankCode: 'DEUTDEFF',
                bankName: 'Deutsche Bank AG',
                bankCodeType: 'SWIFT',
                country: 'DE',
                currency: 'EUR',
                swiftCode: 'DEUTDEFF',
                active: true
            },
            {
                bankCode: 'BNPAFRPP',
                bankName: 'BNP Paribas',
                bankCodeType: 'SWIFT',
                country: 'FR',
                currency: 'EUR',
                swiftCode: 'BNPAFRPP',
                active: true
            },
            {
                bankCode: 'BSCHESMM',
                bankName: 'Banco Santander',
                bankCodeType: 'SWIFT',
                country: 'ES',
                currency: 'EUR',
                swiftCode: 'BSCHESMM',
                active: true
            },
            {
                bankCode: 'INGBNL2A',
                bankName: 'ING Bank',
                bankCodeType: 'SWIFT',
                country: 'NL',
                currency: 'EUR',
                swiftCode: 'INGBNL2A',
                active: true
            },
            {
                bankCode: 'UBSWCHZH',
                bankName: 'UBS Switzerland AG',
                bankCodeType: 'SWIFT',
                country: 'CH',
                currency: 'EUR',
                swiftCode: 'UBSWCHZH',
                active: true
            },
            {
                bankCode: 'UNCRITMM',
                bankName: 'UniCredit Bank',
                bankCodeType: 'SWIFT',
                country: 'IT',
                currency: 'EUR',
                swiftCode: 'UNCRITMM',
                active: true
            },
            {
                bankCode: 'BKAUATWW',
                bankName: 'Bank Austria (UniCredit)',
                bankCodeType: 'SWIFT',
                country: 'AT',
                currency: 'EUR',
                swiftCode: 'BKAUATWW',
                active: true
            },
            {
                bankCode: 'GEBABEBB',
                bankName: 'BNP Paribas Fortis',
                bankCodeType: 'SWIFT',
                country: 'BE',
                currency: 'EUR',
                swiftCode: 'GEBABEBB',
                active: true
            },
            {
                bankCode: 'AIBKIE2D',
                bankName: 'Allied Irish Banks',
                bankCodeType: 'SWIFT',
                country: 'IE',
                currency: 'EUR',
                swiftCode: 'AIBKIE2D',
                active: true
            },
            {
                bankCode: 'CGDIFRPP',
                bankName: 'Caisse d\'Epargne',
                bankCodeType: 'SWIFT',
                country: 'FR',
                currency: 'EUR',
                swiftCode: 'CGDIFRPP',
                active: true
            }
        ];
        // Filter by country if requested
        if (request?.country) {
            return banks.filter(b => b.country === request.country);
        }
        return banks;
    }
    /**
     * Get SEPA transfer limits
     */
    async getTransferLimits(currency) {
        if (currency !== 'EUR') {
            throw new Error('SEPA only supports EUR currency');
        }
        // SEPA Instant has lower limits than standard SEPA
        return {
            minAmount: 0.01,
            maxAmount: 999999, // €999,999 per transaction (SEPA Instant limit)
            dailyLimit: 100000, // €100,000 per day
            monthlyLimit: 1000000, // €1M per month
            currency: 'EUR'
        };
    }
    /**
     * Calculate SEPA transfer fee
     */
    async calculateFee(amount, currency, transferType) {
        if (currency !== 'EUR') {
            throw new Error('SEPA only supports EUR currency');
        }
        // SEPA fee structure
        if (transferType === 'internal') {
            return 0; // Free for internal transfers
        }
        else if (transferType === 'instant') {
            return 1.50; // €1.50 for SEPA Instant
        }
        else {
            return 0.20; // €0.20 for standard SEPA
        }
    }
    /**
     * Validate IBAN checksum using mod 97 algorithm
     */
    validateIBANChecksum(iban) {
        // Move first 4 characters to the end
        const rearranged = iban.substring(4) + iban.substring(0, 4);
        // Replace letters with numbers (A=10, B=11, ..., Z=35)
        let numericString = '';
        for (const char of rearranged) {
            if (char >= 'A' && char <= 'Z') {
                numericString += (char.charCodeAt(0) - 55).toString();
            }
            else {
                numericString += char;
            }
        }
        // Calculate mod 97
        let remainder = 0;
        for (const digit of numericString) {
            remainder = (remainder * 10 + parseInt(digit)) % 97;
        }
        return remainder === 1;
    }
    /**
     * Format IBAN with spaces for readability
     */
    formatIBAN(iban) {
        return iban.replace(/(.{4})/g, '$1 ').trim();
    }
    /**
     * Mock SEPA account validation
     * In production, this would call SEPA validation API
     */
    async mockSEPAValidation(iban) {
        // Simulate validation delay
        await new Promise(resolve => setTimeout(resolve, 500));
        const countryCode = iban.substring(0, 2);
        const bankCode = iban.substring(4, 12); // Simplified bank code extraction
        return {
            valid: true,
            iban,
            bankCode,
            accountHolderName: 'John Doe', // Mock account holder
            bankName: this.getDefaultBankName(countryCode)
        };
    }
    /**
     * Get bank name from BIC/SWIFT code
     */
    async getBankNameFromBIC(bic) {
        if (!bic)
            return 'Unknown Bank';
        const banks = await this.getBankList();
        const bank = banks.find(b => b.swiftCode === bic || b.bankCode === bic);
        return bank?.bankName || 'Unknown Bank';
    }
    /**
     * Get default bank name for country
     */
    getDefaultBankName(countryCode) {
        const countryBanks = {
            'DE': 'Deutsche Bank',
            'FR': 'BNP Paribas',
            'ES': 'Banco Santander',
            'IT': 'UniCredit',
            'NL': 'ING Bank',
            'BE': 'BNP Paribas Fortis',
            'AT': 'Bank Austria',
            'IE': 'Allied Irish Banks',
            'PT': 'Banco BPI',
            'GR': 'National Bank of Greece',
            'CH': 'UBS',
            'LU': 'Banque et Caisse d\'Epargne de l\'Etat'
        };
        return countryBanks[countryCode] || 'European Bank';
    }
}
exports.SEPAProvider = SEPAProvider;
//# sourceMappingURL=SEPAProvider.js.map