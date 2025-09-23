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
    private getUserFinancialData;
    getPersonalizedSuggestions(context: any, category?: string, maxSuggestions?: number): Promise<any[]>;
    getAnalyticsInsights(context: any, type?: string, timeframe?: string): Promise<any>;
    private classifyIntent;
    processEnhancedMessage(message: string, context: any, options?: any): Promise<any>;
    translateMessage(text: string, sourceLanguage: string, targetLanguage: string, context?: any): Promise<any>;
    getLocalizedSuggestions(language: string, type: any): Promise<any[]>;
    getSupportedLanguages(): string[];
    markSuggestionAsUsed(suggestionId: string, userId: string): Promise<void>;
    markSuggestionAsDismissed(suggestionId: string, userId: string): Promise<void>;
    exportAnalyticsReport(userId: string, format: any): Promise<any>;
    performHealthCheck(): Promise<any>;
    getPerformanceMetrics(): any;
    getConfiguration(): AIIntelligenceConfig;
}
//# sourceMappingURL=AIIntelligenceManager.d.ts.map