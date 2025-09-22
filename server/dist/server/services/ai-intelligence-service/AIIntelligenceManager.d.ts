import { LocalBankingAIService } from './core/LocalBankingAIService';
export interface AIIntelligenceConfig {
    enableSmartSuggestions: boolean;
    enableAnalyticsInsights: boolean;
    enableContextualRecommendations: boolean;
    enablePredictiveText: boolean;
}
export declare class AIIntelligenceManager {
    private config;
    constructor(config: AIIntelligenceConfig);
    isFeatureEnabled(feature: keyof AIIntelligenceConfig): boolean;
    createLocalBankingAIService(tenantId?: string): LocalBankingAIService;
    getConfig(): AIIntelligenceConfig;
}
//# sourceMappingURL=AIIntelligenceManager.d.ts.map