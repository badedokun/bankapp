/**
 * Tenant Configuration Loader
 * Loads and manages tenant-specific configurations
 */

import { TenantConfig, TenantID } from '@/types/tenant';

// Tenant configurations (in production, these would come from a secure API)
const tenantConfigs: Record<TenantID, TenantConfig> = {
  'fmfb': {
    id: 'fmfb',
    name: 'fmfb',
    displayName: 'Firstmidas Microfinance Bank',
    domain: 'fmfb.orokiipay.com',
    apiEndpoint: 'https://api.orokiipay.com/fmfb',
    features: {
      aiAssistant: true,
      voiceTransfer: true,
      biometricAuth: true,
      offlineMode: true,
      multiCurrency: true,
      internationalTransfers: true,
      bulkTransfers: true,
      scheduledTransfers: true,
      fraudDetection: true,
    },
    branding: {
      primaryColor: '#010080',
      secondaryColor: '#000060',
      accentColor: '#DAA520',
      logo: 'https://firstmidasmfb.com/wp-content/uploads/2021/01/logomidas-e1609933219910.png',
      favicon: 'fmfb-favicon',
      fonts: {
        primary: 'Inter',
        secondary: 'Roboto',
      },
      borderRadius: 10,
      shadowIntensity: 0.1,
    },
    aiConfig: {
      provider: 'openai',
      models: {
        conversational: 'gpt-4',
        fraud: 'custom-fraud-model',
        prediction: 'custom-prediction-model',
      },
      voiceSettings: {
        enabled: true,
        language: 'en-NG',
        accent: 'nigerian',
      },
    },
    languages: ['en', 'yo', 'ha', 'ig', 'pcm'],
    defaultLanguage: 'en',
  },
  'bank-a': {
    id: 'bank-a',
    name: 'bank-a',
    displayName: 'Bank A',
    domain: 'bank-a.orokiipay.com',
    apiEndpoint: 'https://api.orokiipay.com/bank-a',
    features: {
      aiAssistant: true,
      voiceTransfer: true,
      biometricAuth: true,
      offlineMode: true,
      multiCurrency: true,
      internationalTransfers: true,
      bulkTransfers: true,
      scheduledTransfers: true,
      fraudDetection: true,
    },
    branding: {
      primaryColor: '#007bff',
      secondaryColor: '#0056b3',
      accentColor: '#28a745',
      logo: 'bank-a-logo',
      favicon: 'bank-a-favicon',
      fonts: {
        primary: 'Inter',
        secondary: 'Roboto',
      },
      borderRadius: 10,
      shadowIntensity: 0.1,
    },
    aiConfig: {
      provider: 'openai',
      models: {
        conversational: 'gpt-4',
        fraud: 'custom-fraud-model',
        prediction: 'custom-prediction-model',
      },
      voiceSettings: {
        enabled: true,
        language: 'en-NG',
        accent: 'nigerian',
      },
    },
    languages: ['en', 'yo', 'ha', 'ig', 'pcm'],
    defaultLanguage: 'en',
  },
  'bank-b': {
    id: 'bank-b',
    name: 'bank-b',
    displayName: 'Bank B',
    domain: 'bank-b.orokiipay.com',
    apiEndpoint: 'https://api.orokiipay.com/bank-b',
    features: {
      aiAssistant: true,
      voiceTransfer: true,
      biometricAuth: true,
      offlineMode: false,
      multiCurrency: true,
      internationalTransfers: false,
      bulkTransfers: true,
      scheduledTransfers: true,
      fraudDetection: true,
    },
    branding: {
      primaryColor: '#e31e24',
      secondaryColor: '#b71c1c',
      accentColor: '#ff5252',
      logo: 'bank-b-logo',
      favicon: 'bank-b-favicon',
      fonts: {
        primary: 'Poppins',
        secondary: 'Open Sans',
      },
      borderRadius: 8,
      shadowIntensity: 0.15,
    },
    aiConfig: {
      provider: 'azure',
      models: {
        conversational: 'gpt-4',
        fraud: 'azure-fraud-detector',
        prediction: 'azure-ml-predictor',
      },
      voiceSettings: {
        enabled: true,
        language: 'en-NG',
        accent: 'nigerian',
      },
    },
    languages: ['en', 'yo', 'ha', 'pcm'],
    defaultLanguage: 'en',
  },
  'bank-c': {
    id: 'bank-c',
    name: 'bank-c',
    displayName: 'Bank C',
    domain: 'bank-c.orokiipay.com',
    apiEndpoint: 'https://api.orokiipay.com/bank-c',
    features: {
      aiAssistant: true,
      voiceTransfer: false,
      biometricAuth: true,
      offlineMode: true,
      multiCurrency: false,
      internationalTransfers: false,
      bulkTransfers: false,
      scheduledTransfers: true,
      fraudDetection: true,
    },
    branding: {
      primaryColor: '#00a651',
      secondaryColor: '#00701a',
      accentColor: '#4caf50',
      logo: 'bank-c-logo',
      favicon: 'bank-c-favicon',
      fonts: {
        primary: 'Montserrat',
        secondary: 'Lato',
      },
      borderRadius: 12,
      shadowIntensity: 0.08,
    },
    aiConfig: {
      provider: 'custom',
      endpoint: 'https://ai.bank-c.com',
      models: {
        conversational: 'custom-chat',
        fraud: 'custom-fraud',
        prediction: 'custom-predict',
      },
      voiceSettings: {
        enabled: false,
        language: 'en-NG',
        accent: 'nigerian',
      },
    },
    languages: ['en', 'ig', 'pcm'],
    defaultLanguage: 'en',
  },
  'default': {
    id: 'default',
    name: 'orokiipay',
    displayName: 'OrokiiPay',
    domain: 'orokiipay.com',
    apiEndpoint: 'https://api.orokiipay.com',
    features: {
      aiAssistant: true,
      voiceTransfer: true,
      biometricAuth: true,
      offlineMode: true,
      multiCurrency: true,
      internationalTransfers: true,
      bulkTransfers: true,
      scheduledTransfers: true,
      fraudDetection: true,
    },
    branding: {
      primaryColor: '#007bff',
      secondaryColor: '#0056b3',
      accentColor: '#17a2b8',
      logo: 'orokiipay-logo',
      favicon: 'orokiipay-favicon',
      fonts: {
        primary: '-apple-system',
        secondary: 'system-ui',
      },
      borderRadius: 10,
      shadowIntensity: 0.1,
    },
    aiConfig: {
      provider: 'openai',
      models: {
        conversational: 'gpt-4',
        fraud: 'custom-fraud-model',
        prediction: 'custom-prediction-model',
      },
      voiceSettings: {
        enabled: true,
        language: 'en-NG',
        accent: 'nigerian',
      },
    },
    languages: ['en', 'yo', 'ha', 'ig', 'pcm'],
    defaultLanguage: 'en',
  },
};

class TenantConfigLoader {
  private static instance: TenantConfigLoader;
  private currentConfig: TenantConfig | null = null;
  private configCache: Map<TenantID, TenantConfig> = new Map();

  private constructor() {}

  static getInstance(): TenantConfigLoader {
    if (!TenantConfigLoader.instance) {
      TenantConfigLoader.instance = new TenantConfigLoader();
    }
    return TenantConfigLoader.instance;
  }

  /**
   * Load tenant configuration
   */
  async loadConfig(tenantId: TenantID): Promise<TenantConfig> {
    try {
      // Check cache first
      if (this.configCache.has(tenantId)) {
        const cached = this.configCache.get(tenantId)!;
        this.currentConfig = cached;
        return cached;
      }

      // In production, this would fetch from a secure API
      // For now, use local configurations
      const config = tenantConfigs[tenantId];
      
      if (!config) {
        throw new Error(`Configuration not found for tenant: ${tenantId}`);
      }

      // Cache the configuration
      this.configCache.set(tenantId, config);
      this.currentConfig = config;
      
      return config;
    } catch (error) {
      console.error('Error loading tenant configuration:', error);
      // Fallback to default configuration
      const defaultConfig = tenantConfigs.default;
      this.currentConfig = defaultConfig;
      return defaultConfig;
    }
  }

  /**
   * Get current configuration
   */
  getCurrentConfig(): TenantConfig | null {
    return this.currentConfig;
  }

  /**
   * Update tenant configuration (for dynamic updates)
   */
  async updateConfig(tenantId: TenantID, updates: Partial<TenantConfig>): Promise<TenantConfig> {
    const currentConfig = await this.loadConfig(tenantId);
    const updatedConfig = {
      ...currentConfig,
      ...updates,
    };
    
    this.configCache.set(tenantId, updatedConfig);
    this.currentConfig = updatedConfig;
    
    return updatedConfig;
  }

  /**
   * Clear configuration cache
   */
  clearCache(): void {
    this.configCache.clear();
    this.currentConfig = null;
  }

  /**
   * Get all available tenant configurations
   */
  getAllConfigs(): TenantConfig[] {
    return Object.values(tenantConfigs);
  }

  /**
   * Check if a feature is enabled for current tenant
   */
  isFeatureEnabled(feature: keyof TenantConfig['features']): boolean {
    if (!this.currentConfig) {
      return false;
    }
    return this.currentConfig.features[feature] === true;
  }
}

export default TenantConfigLoader.getInstance();