import { LocalBankingAIService } from './core/LocalBankingAIService';

export interface AIIntelligenceConfig {
  enableSmartSuggestions: boolean;
  enableAnalyticsInsights: boolean;
  enableContextualRecommendations: boolean;
  enablePredictiveText: boolean;
}

export class AIIntelligenceManager {
  private config: AIIntelligenceConfig;

  constructor(config: AIIntelligenceConfig) {
    this.config = config;
  }

  isFeatureEnabled(feature: keyof AIIntelligenceConfig): boolean {
    return this.config[feature];
  }

  createLocalBankingAIService(tenantId?: string): LocalBankingAIService {
    return new LocalBankingAIService(tenantId);
  }

  getConfig(): AIIntelligenceConfig {
    return { ...this.config };
  }
}