"use strict";
/**
 * Payment Provider Interface
 *
 * Abstraction layer for regional payment networks:
 * - NIBSS (Nigeria)
 * - ACH/FedWire (USA)
 * - SEPA (Europe)
 * - Interac (Canada)
 * - SWIFT (International)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentProviderRegistry = exports.PaymentProviderRegistry = exports.BasePaymentProvider = void 0;
/**
 * Base abstract class for payment providers
 * Provides common functionality that all providers can extend
 */
class BasePaymentProvider {
    constructor() {
        this.config = {};
        this.initialized = false;
    }
    async initialize(config) {
        this.config = config;
        this.initialized = true;
    }
    ensureInitialized() {
        if (!this.initialized) {
            throw new Error(`Payment provider ${this.name} not initialized`);
        }
    }
    isSupported(operation, context) {
        switch (operation) {
            case 'validate':
                return this.capabilities.supportsAccountValidation;
            case 'transfer':
                return true; // All providers must support basic transfer
            case 'status':
                return true; // All providers must support status check
            case 'banks':
                return true; // All providers must provide bank list
            default:
                return false;
        }
    }
}
exports.BasePaymentProvider = BasePaymentProvider;
/**
 * Provider Registry
 * Manages available payment providers and routes requests to the appropriate provider
 */
class PaymentProviderRegistry {
    constructor() {
        this.providers = new Map();
    }
    /**
     * Register a payment provider
     */
    register(provider) {
        this.providers.set(provider.name.toLowerCase(), provider);
    }
    /**
     * Get a specific provider by name
     */
    getProvider(name) {
        return this.providers.get(name.toLowerCase());
    }
    /**
     * Get provider for a specific region
     */
    getProviderForRegion(region) {
        const providers = Array.from(this.providers.values());
        for (const provider of providers) {
            if (provider.region.toLowerCase() === region.toLowerCase()) {
                return provider;
            }
        }
        return undefined;
    }
    /**
     * Get provider for a specific currency
     */
    getProviderForCurrency(currency) {
        const providers = Array.from(this.providers.values());
        for (const provider of providers) {
            if (provider.capabilities.supportedCurrencies.includes(currency)) {
                return provider;
            }
        }
        return undefined;
    }
    /**
     * Get all registered providers
     */
    getAllProviders() {
        return Array.from(this.providers.values());
    }
    /**
     * Get provider based on bank code type
     */
    getProviderForBankCodeType(bankCodeType) {
        const providerMap = {
            'NIBSS': 'nibss',
            'ROUTING': 'ach',
            'SWIFT': 'swift',
            'TRANSIT': 'interac',
            'SORT_CODE': 'faster-payments'
        };
        const providerName = providerMap[bankCodeType];
        return providerName ? this.getProvider(providerName) : undefined;
    }
}
exports.PaymentProviderRegistry = PaymentProviderRegistry;
// Global registry instance
exports.paymentProviderRegistry = new PaymentProviderRegistry();
//# sourceMappingURL=IPaymentProvider.js.map