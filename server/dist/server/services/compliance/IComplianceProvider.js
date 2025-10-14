"use strict";
/**
 * Compliance Provider Interface
 *
 * Abstraction layer for regional regulatory compliance:
 * - KYC (Know Your Customer) verification
 * - AML (Anti-Money Laundering) checks
 * - CTF (Counter-Terrorism Financing) screening
 * - Sanctions screening (OFAC, UN, EU)
 * - Transaction monitoring
 * - Compliance reporting
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.complianceProviderRegistry = exports.ComplianceProviderRegistry = exports.BaseComplianceProvider = void 0;
/**
 * Base abstract class for compliance providers
 * Provides common functionality that all providers can extend
 */
class BaseComplianceProvider {
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
            throw new Error(`Compliance provider ${this.name} not initialized`);
        }
    }
    async isCompliant(operation, context) {
        // Default implementation - can be overridden
        return true;
    }
    async getRequiredKYCLevel(operation, amount, currency) {
        // Default tiered approach based on amount
        const limits = await this.getRegulatoryLimits(currency);
        if (amount >= limits.enhancedDueDiligenceThreshold) {
            return 'advanced';
        }
        else if (amount >= limits.suspiciousActivityThreshold * 0.5) {
            return 'intermediate';
        }
        else {
            return 'basic';
        }
    }
}
exports.BaseComplianceProvider = BaseComplianceProvider;
/**
 * Compliance Provider Registry
 * Manages available compliance providers and routes requests
 */
class ComplianceProviderRegistry {
    constructor() {
        this.providers = new Map();
    }
    /**
     * Register a compliance provider
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
     * Get provider for a specific country
     */
    getProviderForCountry(country) {
        const providers = Array.from(this.providers.values());
        for (const provider of providers) {
            if (provider.country.toLowerCase() === country.toLowerCase()) {
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
}
exports.ComplianceProviderRegistry = ComplianceProviderRegistry;
// Global registry instance
exports.complianceProviderRegistry = new ComplianceProviderRegistry();
//# sourceMappingURL=IComplianceProvider.js.map