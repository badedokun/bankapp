"use strict";
/**
 * Payment Gateway Service
 *
 * Orchestration layer that manages all payment providers
 * and routes requests to the appropriate provider based on:
 * - Currency
 * - Region
 * - Bank code type
 * - Tenant configuration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentGatewayService = void 0;
exports.getPaymentGatewayService = getPaymentGatewayService;
const IPaymentProvider_1 = require("./IPaymentProvider");
const NIBSSProvider_1 = require("./NIBSSProvider");
const ACHProvider_1 = require("./ACHProvider");
const SEPAProvider_1 = require("./SEPAProvider");
const InteracProvider_1 = require("./InteracProvider");
class PaymentGatewayService {
    constructor(db) {
        this.initialized = false;
        this.db = db;
        this.registry = IPaymentProvider_1.paymentProviderRegistry;
    }
    /**
     * Initialize all payment providers
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        // Initialize NIBSS Provider (Nigeria)
        const nibssProvider = new NIBSSProvider_1.NIBSSProvider();
        await nibssProvider.initialize({
            baseUrl: process.env.NIBSS_BASE_URL,
            organizationCode: process.env.NIBSS_ORG_CODE,
            apiKey: process.env.NIBSS_API_KEY,
            secretKey: process.env.NIBSS_SECRET_KEY,
            environment: process.env.NIBSS_ENV || 'sandbox'
        });
        this.registry.register(nibssProvider);
        // Initialize ACH Provider (USA)
        const achProvider = new ACHProvider_1.ACHProvider();
        await achProvider.initialize({
            plaidClientId: process.env.PLAID_CLIENT_ID,
            plaidSecret: process.env.PLAID_SECRET,
            plaidEnvironment: process.env.PLAID_ENV || 'sandbox',
            achProcessorUrl: process.env.ACH_PROCESSOR_URL,
            achProcessorApiKey: process.env.ACH_PROCESSOR_API_KEY
        });
        this.registry.register(achProvider);
        // Initialize SEPA Provider (Europe)
        const sepaProvider = new SEPAProvider_1.SEPAProvider();
        await sepaProvider.initialize({
            sepaProcessorUrl: process.env.SEPA_PROCESSOR_URL,
            sepaApiKey: process.env.SEPA_API_KEY,
            sepaMerchantId: process.env.SEPA_MERCHANT_ID,
            environment: process.env.SEPA_ENV || 'sandbox'
        });
        this.registry.register(sepaProvider);
        // Initialize Interac Provider (Canada)
        const interacProvider = new InteracProvider_1.InteracProvider();
        await interacProvider.initialize({
            interacApiUrl: process.env.INTERAC_API_URL,
            interacApiKey: process.env.INTERAC_API_KEY,
            interacMerchantId: process.env.INTERAC_MERCHANT_ID,
            environment: process.env.INTERAC_ENV || 'sandbox'
        });
        this.registry.register(interacProvider);
        this.initialized = true;
        console.log('✅ Payment Gateway Service initialized with 4 providers');
    }
    /**
     * Get tenant payment configuration from database
     */
    async getTenantConfig(tenantId) {
        try {
            const result = await this.db.query(`SELECT id, name, currency, region
         FROM platform.tenants
         WHERE id = $1`, [tenantId]);
            if (result.rows.length === 0) {
                return null;
            }
            const tenant = result.rows[0];
            return {
                tenantId: tenant.id,
                tenantName: tenant.name,
                currency: tenant.currency || 'NGN',
                region: tenant.region || 'africa-west'
            };
        }
        catch (error) {
            console.error('Error fetching tenant config:', error);
            return null;
        }
    }
    /**
     * Select appropriate payment provider based on context
     */
    async selectProvider(context) {
        this.ensureInitialized();
        // 1. Use preferred provider if specified
        if (context.preferredProvider) {
            const provider = this.registry.getProvider(context.preferredProvider);
            if (provider)
                return provider;
        }
        // 2. Get tenant configuration
        if (context.tenantId) {
            const tenantConfig = await this.getTenantConfig(context.tenantId);
            if (tenantConfig) {
                context.currency = context.currency || tenantConfig.currency;
                context.region = context.region || tenantConfig.region;
            }
        }
        // 3. Select by bank code type (most specific)
        if (context.bankCodeType) {
            const provider = this.registry.getProviderForBankCodeType(context.bankCodeType);
            if (provider)
                return provider;
        }
        // 4. Select by currency
        if (context.currency) {
            const provider = this.registry.getProviderForCurrency(context.currency);
            if (provider)
                return provider;
        }
        // 5. Select by region
        if (context.region) {
            const regionMap = {
                'africa-west': 'Nigeria',
                'africa-east': 'Nigeria',
                'africa-south': 'Nigeria',
                'north-america-east': 'USA',
                'north-america-west': 'USA',
                'north-america-central': 'Canada',
                'europe-west': 'Europe',
                'europe-central': 'Europe',
                'europe-east': 'Europe'
            };
            const providerRegion = regionMap[context.region] || context.region;
            const provider = this.registry.getProviderForRegion(providerRegion);
            if (provider)
                return provider;
        }
        // 6. Default to NIBSS for backward compatibility
        return this.registry.getProvider('nibss');
    }
    /**
     * Validate account across any provider
     */
    async validateAccount(request, tenantId) {
        const provider = await this.selectProvider({
            tenantId,
            currency: request.currency,
            region: request.region,
            bankCodeType: request.bankCodeType
        });
        if (!provider) {
            return {
                isValid: false,
                errorMessage: 'No payment provider available for this request',
                errorCode: 'NO_PROVIDER'
            };
        }
        if (!provider.capabilities.supportsAccountValidation) {
            return {
                isValid: false,
                errorMessage: `${provider.name} does not support account validation`,
                errorCode: 'UNSUPPORTED_OPERATION'
            };
        }
        return await provider.validateAccount(request);
    }
    /**
     * Initiate transfer across any provider
     */
    async initiateTransfer(request, tenantId) {
        const provider = await this.selectProvider({
            tenantId,
            currency: request.currency,
            region: request.region,
            bankCodeType: this.determineBankCodeType(request.toBankCode)
        });
        if (!provider) {
            return {
                success: false,
                transactionReference: request.reference,
                status: 'failed',
                message: 'No payment provider available for this request',
                errorCode: 'NO_PROVIDER'
            };
        }
        return await provider.initiateTransfer(request);
    }
    /**
     * Get transfer status across any provider
     */
    async getTransferStatus(request, providerName) {
        const provider = providerName
            ? this.registry.getProvider(providerName)
            : await this.selectProvider({});
        if (!provider) {
            return {
                transactionReference: request.transactionReference,
                status: 'failed',
                failureReason: 'No payment provider available'
            };
        }
        return await provider.getTransferStatus(request);
    }
    /**
     * Get bank list from appropriate provider
     */
    async getBankList(request, tenantId) {
        const provider = await this.selectProvider({
            tenantId,
            currency: request.currency,
            region: request.region
        });
        if (!provider) {
            return [];
        }
        return await provider.getBankList(request);
    }
    /**
     * Get transfer limits from provider
     */
    async getTransferLimits(currency, tenantId) {
        const provider = await this.selectProvider({
            tenantId,
            currency
        });
        if (!provider) {
            return null;
        }
        return await provider.getTransferLimits(currency);
    }
    /**
     * Calculate transfer fee
     */
    async calculateFee(amount, currency, transferType, tenantId) {
        const provider = await this.selectProvider({
            tenantId,
            currency
        });
        if (!provider) {
            return 0;
        }
        return await provider.calculateFee(amount, currency, transferType);
    }
    /**
     * Get all available providers for a tenant
     */
    async getAvailableProviders(tenantId) {
        const tenantConfig = await this.getTenantConfig(tenantId);
        if (!tenantConfig) {
            return [];
        }
        const allProviders = this.registry.getAllProviders();
        return allProviders.filter(provider => provider.capabilities.supportedCurrencies.includes(tenantConfig.currency));
    }
    /**
     * Get provider capabilities
     */
    getProviderCapabilities(providerName) {
        const provider = this.registry.getProvider(providerName);
        return provider?.capabilities;
    }
    /**
     * Determine bank code type from format
     */
    determineBankCodeType(bankCode) {
        if (!bankCode)
            return undefined;
        // Remove spaces and convert to uppercase
        const cleanCode = bankCode.replace(/\s/g, '').toUpperCase();
        // NIBSS: 3 digits (Nigerian banks)
        if (/^\d{3}$/.test(cleanCode)) {
            return 'NIBSS';
        }
        // Routing number: 9 digits (US banks)
        if (/^\d{9}$/.test(cleanCode)) {
            return 'ROUTING';
        }
        // Transit number: 8 digits (Canadian banks - 3 + 5)
        if (/^\d{8}$/.test(cleanCode)) {
            return 'TRANSIT';
        }
        // SWIFT/BIC: 8 or 11 characters
        if (/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cleanCode)) {
            return 'SWIFT';
        }
        // Sort code: 6 digits (UK banks)
        if (/^\d{6}$/.test(cleanCode)) {
            return 'SORT_CODE';
        }
        return undefined;
    }
    /**
     * Ensure service is initialized
     */
    ensureInitialized() {
        if (!this.initialized) {
            throw new Error('Payment Gateway Service not initialized. Call initialize() first.');
        }
    }
    /**
     * Get registry for direct access (advanced use)
     */
    getRegistry() {
        return this.registry;
    }
}
exports.PaymentGatewayService = PaymentGatewayService;
// Export singleton instance
let paymentGatewayServiceInstance = null;
function getPaymentGatewayService(db) {
    if (!paymentGatewayServiceInstance) {
        paymentGatewayServiceInstance = new PaymentGatewayService(db);
    }
    return paymentGatewayServiceInstance;
}
//# sourceMappingURL=PaymentGatewayService.js.map