"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIIntelligenceManager = void 0;
const LocalBankingAIService_1 = require("./core/LocalBankingAIService");
class AIIntelligenceManager {
    constructor(config) {
        this.config = config;
    }
    isFeatureEnabled(feature) {
        return this.config[feature];
    }
    createLocalBankingAIService(tenantId) {
        return new LocalBankingAIService_1.LocalBankingAIService(tenantId);
    }
    getConfig() {
        return { ...this.config };
    }
}
exports.AIIntelligenceManager = AIIntelligenceManager;
//# sourceMappingURL=AIIntelligenceManager.js.map