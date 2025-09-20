# Book 1: AI-Enhanced Multi-Tenant Frontend Implementation Guide
## Nigerian Money Transfer Cross-Platform Application Development with AI Integration

**Version:** 2.0  
**Date:** September 2025  
**Target Audience:** Frontend Developers, AI Developers, React Native Developers, Mobile Developers  

---

## Table of Contents

1. [Multi-Tenant Project Setup and AI Integration](#1-multi-tenant-project-setup-and-ai-integration)
2. [AI-Enhanced Multi-Tenant Component Development](#2-ai-enhanced-multi-tenant-component-development)
3. [Conversational AI Interface Implementation](#3-conversational-ai-interface-implementation)
4. [Voice Processing and Multi-Language AI](#4-voice-processing-and-multi-language-ai)
5. [Multi-Tenant State Management with AI Context](#5-multi-tenant-state-management-with-ai-context)
6. [AI-Powered Authentication and Security](#6-ai-powered-authentication-and-security)
7. [Tenant-Aware Offline AI Capabilities](#7-tenant-aware-offline-ai-capabilities)
8. [AI Device Integration and Smart Features](#8-ai-device-integration-and-smart-features)
9. [AI-Enhanced Testing Strategies](#9-ai-enhanced-testing-strategies)
10. [Performance Optimization for AI and Multi-Tenancy](#10-performance-optimization-for-ai-and-multi-tenancy)

---

## 1. Multi-Tenant Project Setup and AI Integration

### 1.1 Environment Setup for AI-Enhanced Multi-Tenant Development

#### 1.1.1 Prerequisites Installation

```bash
# Install Node.js 18+ LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install React Native CLI and Expo CLI
npm install -g @react-native-community/cli
npm install -g @expo/cli

# Install AI and ML development tools
npm install -g @tensorflow/tfjs-node
npm install -g @tensorflow/tfjs-react-native

# Install platform-specific requirements
# For iOS (macOS only)
sudo gem install cocoapods

# For Android - Install Android Studio and configure SDK
```

#### 1.1.2 Multi-Tenant AI Project Initialization

```bash
# Create new React Native project with TypeScript and AI support
npx react-native init NigerianPoSMultiTenantAI --template react-native-template-typescript

cd NigerianPoSMultiTenantAI

# Install React Native Web dependencies
npm install react-native-web react-dom

# Install multi-tenant and AI dependencies
npm install @reduxjs/toolkit react-redux @tanstack/react-query
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage
npm install react-native-keychain react-native-biometrics
npm install react-native-vector-icons react-native-svg

# AI and ML dependencies
npm install @tensorflow/tfjs @tensorflow/tfjs-react-native
npm install @tensorflow/tfjs-platform-react-native
npm install react-native-voice react-native-tts
npm install react-native-speech-to-text
npm install expo-av expo-speech

# Multi-tenant specific dependencies
npm install react-native-config
npm install react-native-dynamic-theme
npm install react-native-super-grid

# AI service integration
npm install openai
npm install @azure/cognitiveservices-speech-sdk
npm install natural nltk

# Additional utilities for AI features
npm install react-native-markdown-display
npm install react-native-animatable
npm install lottie-react-native
npm install react-native-chat-bubble
```

#### 1.1.3 Multi-Tenant AI Project Structure

```bash
NigerianPoSMultiTenantAI/
├── src/
│   ├── ai/                     # AI and ML components
│   │   ├── services/          # AI service integrations
│   │   │   ├── ConversationalAI.ts
│   │   │   ├── VoiceProcessor.ts
│   │   │   ├── FraudDetectionAI.ts
│   │   │   ├── DocumentAI.ts
│   │   │   └── PredictiveAnalytics.ts
│   │   ├── models/            # On-device AI models
│   │   │   ├── offline/       # Offline AI models
│   │   │   └── cache/         # Model cache
│   │   ├── components/        # AI UI components
│   │   │   ├── AIAssistant/
│   │   │   ├── VoiceInput/
│   │   │   ├── ChatInterface/
│   │   │   └── SmartSuggestions/
│   │   └── utils/             # AI utilities
│   ├── tenants/               # Multi-tenant management
│   │   ├── TenantContext.tsx
│   │   ├── TenantDetector.ts
│   │   ├── TenantConfigLoader.ts
│   │   └── TenantThemeManager.ts
│   ├── components/            # Tenant-aware UI components
│   │   ├── common/           # Multi-tenant base components
│   │   ├── tenant/           # Tenant-specific components
│   │   ├── ai/               # AI-enhanced components
│   │   ├── forms/            # Smart form components
│   │   └── ui/               # Themeable base UI components
│   ├── screens/              # Tenant-aware app screens
│   │   ├── auth/            # Multi-tenant authentication
│   │   ├── onboarding/      # AI-guided onboarding
│   │   ├── transaction/     # AI-enhanced transactions
│   │   ├── dashboard/       # AI-powered dashboards
│   │   ├── ai-assistant/    # AI assistant screens
│   │   └── settings/        # Tenant configuration screens
│   ├── services/            # Multi-tenant business logic
│   │   ├── tenant/          # Tenant management services
│   │   ├── auth/            # AI-enhanced authentication
│   │   ├── transaction/     # AI transaction services
│   │   ├── ai/              # AI service integrations
│   │   └── configuration/   # Tenant configuration management
│   ├── store/               # Multi-tenant Redux store
│   │   ├── tenant/          # Tenant context slice
│   │   ├── ai/              # AI state management
│   │   ├── auth/            # Tenant-aware authentication
│   │   └── transaction/     # AI-enhanced transactions
│   ├── themes/              # Multi-tenant theming system
│   │   ├── base.ts         # Base theme structure
│   │   ├── generator.ts    # Dynamic theme generation
│   │   ├── ai-themes.ts    # AI-aware themes
│   │   └── tenants/        # Tenant-specific themes
│   ├── navigation/          # AI-guided navigation
│   ├── utils/               # Multi-tenant utility functions
│   ├── hooks/               # Multi-tenant React hooks
│   │   ├── useTenant.ts    # Core tenant management hook
│   │   ├── useAI.ts        # AI service hooks
│   │   ├── useTenantAuth.ts # Tenant-aware authentication
│   │   └── useTenantTheme.ts # Dynamic theming hook
│   ├── types/               # Multi-tenant TypeScript definitions
│   │   ├── tenant.ts       # Tenant-related types
│   │   ├── ai.ts           # AI-related types
│   │   ├── configuration.ts # Tenant configuration types
│   │   └── branding.ts     # Tenant branding types
│   └── constants/           # Multi-tenant constants
├── web/                     # Web-specific configurations
│   ├── webpack.config.js    # Multi-tenant web bundling
│   ├── public/             # Tenant-aware web assets
│   │   ├── tenants/        # Tenant-specific assets
│   │   │   ├── bank-a/     # Bank A assets and AI config
│   │   │   ├── bank-b/     # Bank B assets
│   │   │   └── bank-c/     # Bank C assets
│   │   ├── ai/             # AI model assets
│   │   └── index.html      # Tenant-detecting entry point
│   └── tenant-detection.js # AI-enhanced tenant detection
├── ios/                     # iOS native code
├── android/                 # Android native code
├── ai-models/              # AI model storage
│   ├── offline/            # Offline models for React Native
│   ├── web/                # Web-optimized models
│   └── metadata/           # Model metadata and configs
├── __tests__/              # Test files
└── package.json
```

### 1.2 Multi-Tenant React Native Web Configuration with AI

#### 1.2.1 Enhanced Webpack Configuration for AI and Multi-Tenancy

**web/webpack.config.js:**
```javascript
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const appDirectory = path.resolve(__dirname, '../');

// Multi-tenant and AI-specific configuration
const multiTenantConfig = {
  // Tenant detection configuration
  TENANT_DETECTION_METHOD: process.env.TENANT_DETECTION_METHOD || 'subdomain',
  // AI service endpoints
  AI_SERVICE_URL: process.env.AI_SERVICE_URL,
  OPENAI_API_URL: process.env.OPENAI_API_URL,
  // Model serving configuration
  AI_MODEL_BASE_URL: process.env.AI_MODEL_BASE_URL,
};

module.exports = {
  entry: {
    app: path.join(appDirectory, 'index.web.js'),
  },
  output: {
    path: path.resolve(appDirectory, 'web/build'),
    publicPath: '/',
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].js',
  },
  resolve: {
    alias: {
      'react-native$': 'react-native-web',
      // AI model aliases for web
      '@ai-models': path.resolve(appDirectory, 'ai-models/web'),
      '@tensorflow/tfjs-react-native$': '@tensorflow/tfjs',
    },
    extensions: ['.web.js', '.js', '.web.ts', '.ts', '.web.tsx', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        include: [
          path.resolve(appDirectory, 'src'),
          path.resolve(appDirectory, 'index.web.js'),
        ],
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            presets: [
              '@babel/preset-react',
              '@babel/preset-typescript',
              ['@babel/preset-env', { targets: { node: 'current' } }],
            ],
            plugins: [
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-transform-react-jsx',
              // AI model loading optimization
              ['babel-plugin-transform-imports', {
                '@tensorflow/tfjs': {
                  'transform': '@tensorflow/tfjs/dist/index',
                  'preventFullImport': true,
                },
              }],
            ],
          },
        },
      },
      // AI model files
      {
        test: /\.(bin|pb|json)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: 'ai-models/[name].[ext]',
          },
        }],
      },
      // Tenant assets
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: 'assets/[path][name].[ext]',
          },
        }],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(false),
      // Multi-tenant configuration
      'process.env.TENANT_DETECTION_METHOD': JSON.stringify(multiTenantConfig.TENANT_DETECTION_METHOD),
      'process.env.AI_SERVICE_URL': JSON.stringify(multiTenantConfig.AI_SERVICE_URL),
      'process.env.OPENAI_API_URL': JSON.stringify(multiTenantConfig.OPENAI_API_URL),
      'process.env.AI_MODEL_BASE_URL': JSON.stringify(multiTenantConfig.AI_MODEL_BASE_URL),
    }),
    new HtmlWebpackPlugin({
      template: path.join(appDirectory, 'web/public/index.html'),
      inject: false,
      templateParameters: {
        // Dynamic tenant configuration injection
        tenantConfig: JSON.stringify(multiTenantConfig),
      },
    }),
    // AI model optimization
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/,
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Separate chunk for AI models
        aiModels: {
          test: /[\\/]ai-models[\\/]/,
          name: 'ai-models',
          chunks: 'all',
          priority: 20,
        },
        // Tenant-specific assets
        tenantAssets: {
          test: /[\\/]tenants[\\/]/,
          name: 'tenant-assets',
          chunks: 'all',
          priority: 15,
        },
        // Core AI libraries
        aiLibraries: {
          test: /[\\/]node_modules[\\/](@tensorflow|openai|natural)[\\/]/,
          name: 'ai-libraries',
          chunks: 'all',
          priority: 10,
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 5,
        },
      },
    },
  },
  devServer: {
    historyApiFallback: true,
    contentBase: path.join(appDirectory, 'web/public'),
    port: 3000,
    // Multi-tenant development configuration
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        headers: {
          'X-Tenant-ID': 'development',
        },
      },
      '/ai-api': {
        target: process.env.AI_SERVICE_URL || 'http://localhost:3010',
        changeOrigin: true,
      },
    },
  },
};
```

#### 1.2.2 Enhanced HTML Template with Tenant Detection and AI Loading

**web/public/index.html:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    
    <!-- Dynamic tenant-specific meta tags -->
    <title id="dynamic-title">Nigerian Money Transfer System</title>
    <meta name="description" content="AI-Enhanced Multi-Tenant Money Transfer System" />
    
    <!-- Tenant-specific favicons will be loaded dynamically -->
    <link rel="icon" type="image/x-icon" id="dynamic-favicon" />
    
    <!-- Preload AI models for better performance -->
    <link rel="preload" href="/ai-models/fraud-detection.json" as="fetch" crossorigin="anonymous" />
    <link rel="preload" href="/ai-models/nlp-nigerian.json" as="fetch" crossorigin="anonymous" />
    
    <!-- Tenant detection and AI initialization script -->
    <script id="tenant-ai-init">
        window.TENANT_CONFIG = <%= tenantConfig %>;
        
        // Tenant detection from subdomain or domain
        function detectTenant() {
            const hostname = window.location.hostname;
            const subdomain = hostname.split('.')[0];
            
            // Check for tenant-specific subdomains
            const knownTenants = ['bank-a', 'bank-b', 'bank-c', 'bank-d', 'bank-e'];
            if (knownTenants.includes(subdomain)) {
                return subdomain;
            }
            
            // Check for custom domains
            const customDomains = {
                'banking.bank-a.com': 'bank-a',
                'banking.bank-b.com': 'bank-b',
                'banking.bank-c.com': 'bank-c',
            };
            
            return customDomains[hostname] || 'default';
        }
        
        // Initialize tenant context
        window.DETECTED_TENANT = detectTenant();
        
        // Preload tenant-specific AI configuration
        async function preloadTenantAIConfig() {
            try {
                const tenantId = window.DETECTED_TENANT;
                const response = await fetch(`/api/tenants/${tenantId}/ai-config`);
                window.TENANT_AI_CONFIG = await response.json();
                
                // Load tenant-specific AI models
                if (window.TENANT_AI_CONFIG.aiModels) {
                    window.TENANT_AI_CONFIG.aiModels.forEach(model => {
                        const link = document.createElement('link');
                        link.rel = 'preload';
                        link.href = model.url;
                        link.as = 'fetch';
                        link.crossOrigin = 'anonymous';
                        document.head.appendChild(link);
                    });
                }
            } catch (error) {
                console.warn('Failed to preload tenant AI config:', error);
            }
        }
        
        // Initialize AI services early
        window.AI_INITIALIZATION_PROMISE = preloadTenantAIConfig();
        
        // Dynamic theme loading based on tenant
        async function loadTenantTheme() {
            try {
                const tenantId = window.DETECTED_TENANT;
                const response = await fetch(`/api/tenants/${tenantId}/theme`);
                const theme = await response.json();
                
                // Apply tenant theme
                document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
                document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
                document.documentElement.style.setProperty('--background-color', theme.backgroundColor);
                
                // Update favicon and title
                document.getElementById('dynamic-favicon').href = theme.faviconUrl;
                document.getElementById('dynamic-title').textContent = theme.appTitle;
                
            } catch (error) {
                console.warn('Failed to load tenant theme:', error);
            }
        }
        
        // Load tenant theme early
        loadTenantTheme();
    </script>
    
    <!-- AI service worker for offline AI capabilities -->
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/ai-service-worker.js')
                    .then(registration => {
                        console.log('AI Service Worker registered:', registration);
                    })
                    .catch(error => {
                        console.log('AI Service Worker registration failed:', error);
                    });
            });
        }
    </script>
    
    <!-- Preconnect to AI service APIs -->
    <link rel="preconnect" href="<%= process.env.AI_SERVICE_URL %>" />
    <link rel="preconnect" href="<%= process.env.OPENAI_API_URL %>" />
</head>
<body>
    <noscript>
        <div style="padding: 20px; text-align: center;">
            <h2>JavaScript Required</h2>
            <p>This AI-enhanced banking application requires JavaScript to function properly. Please enable JavaScript in your browser settings.</p>
        </div>
    </noscript>
    
    <!-- Loading screen with tenant branding -->
    <div id="loading-screen" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        color: white;
    ">
        <div style="width: 64px; height: 64px; border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <h3 style="margin-top: 20px;">Loading AI-Enhanced Money Transfer System...</h3>
        <p style="margin-top: 10px; opacity: 0.8;">Initializing AI services and tenant configuration</p>
    </div>
    
    <style>
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
    
    <!-- React app root -->
    <div id="root"></div>
    
    <!-- Bundle injection point -->
    <script src="/static/js/app.js"></script>
</body>
</html>
```

### 1.3 TypeScript Configuration for Multi-Tenant AI

#### 1.3.1 Enhanced TypeScript Configuration

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "es2020",
    "lib": ["es2020", "dom", "dom.iterable"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@ai/*": ["ai/*"],
      "@tenants/*": ["tenants/*"],
      "@components/*": ["components/*"],
      "@services/*": ["services/*"],
      "@utils/*": ["utils/*"],
      "@hooks/*": ["hooks/*"],
      "@types/*": ["types/*"],
      "@themes/*": ["themes/*"],
      "@constants/*": ["constants/*"]
    },
    "typeRoots": ["./node_modules/@types", "./src/types"]
  },
  "include": [
    "src/**/*",
    "ai-models/**/*",
    "web/tenant-detection.js",
    "index.web.js",
    "index.js"
  ],
  "exclude": [
    "node_modules",
    "web/build",
    "__tests__",
    "**/*.test.*"
  ]
}
```

#### 1.3.2 Core Multi-Tenant AI Type Definitions

**src/types/ai.ts:**
```typescript
// AI Service Types
export interface AIServiceConfig {
  baseUrl: string;
  apiKey: string;
  tenantId: string;
  modelVersion: string;
  timeout: number;
  retryAttempts: number;
}

export interface ConversationalAIConfig {
  model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3' | 'custom';
  language: 'en' | 'ha' | 'yo' | 'ig' | 'pid'; // English, Hausa, Yoruba, Igbo, Pidgin
  personality: string;
  maxTokens: number;
  temperature: number;
  tenantContext: TenantAIPersonality;
}

export interface TenantAIPersonality {
  name: string;
  description: string;
  greeting: string;
  tone: 'professional' | 'friendly' | 'casual' | 'formal';
  bankSpecificPhrases: string[];
  culturalContext: NigerianCulturalContext;
}

export interface NigerianCulturalContext {
  preferredGreetings: string[];
  commonExpressions: string[];
  businessHours: {
    timezone: string;
    workingDays: string[];
    startTime: string;
    endTime: string;
  };
  holidays: string[];
  currencyFormat: string;
}

// Voice AI Types
export interface VoiceProcessingConfig {
  language: string;
  accent: 'nigerian' | 'standard';
  noiseReduction: boolean;
  realTimeProcessing: boolean;
  offline: boolean;
}

export interface VoiceCommand {
  id: string;
  transcript: string;
  confidence: number;
  language: string;
  intent: TransactionIntent;
  entities: VoiceEntity[];
  timestamp: Date;
}

export interface VoiceEntity {
  type: 'amount' | 'recipient' | 'account' | 'service' | 'date';
  value: string;
  confidence: number;
  startOffset: number;
  endOffset: number;
}

// Transaction AI Types
export interface TransactionIntent {
  type: 'send_money' | 'pay_bill' | 'buy_airtime' | 'check_balance' | 'withdraw_cash';
  confidence: number;
  parameters: TransactionParameters;
}

export interface TransactionParameters {
  amount?: number;
  currency?: string;
  recipient?: string;
  accountNumber?: string;
  service?: string;
  provider?: string;
  reference?: string;
}

// Fraud Detection AI Types
export interface FraudDetectionResult {
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: FraudRiskFactor[];
  recommendation: 'approve' | 'review' | 'decline' | 'additional_auth';
  confidence: number;
}

export interface FraudRiskFactor {
  type: 'behavioral' | 'location' | 'device' | 'transaction' | 'network';
  description: string;
  weight: number;
  evidence: string[];
}

// Document AI Types
export interface DocumentAIResult {
  type: 'receipt' | 'id_card' | 'bank_statement' | 'utility_bill';
  extractedData: ExtractedDocumentData;
  confidence: number;
  validationResults: DocumentValidation[];
}

export interface ExtractedDocumentData {
  [key: string]: string | number | Date;
}

export interface DocumentValidation {
  field: string;
  isValid: boolean;
  confidence: number;
  errorMessage?: string;
}

// AI Model Types
export interface AIModel {
  id: string;
  name: string;
  version: string;
  type: 'conversational' | 'fraud_detection' | 'nlp' | 'voice' | 'vision';
  platform: 'cloud' | 'edge' | 'hybrid';
  modelUrl?: string;
  configUrl?: string;
  size: number; // in bytes
  accuracy: number;
  latency: number; // in ms
  supportedLanguages: string[];
  tenantSpecific: boolean;
}

// AI Analytics Types
export interface AIAnalytics {
  usage: AIUsageMetrics;
  performance: AIPerformanceMetrics;
  accuracy: AIAccuracyMetrics;
  userEngagement: AIEngagementMetrics;
}

export interface AIUsageMetrics {
  totalInteractions: number;
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionLength: number;
  featureUsage: Record<string, number>;
}

export interface AIPerformanceMetrics {
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  throughput: number;
  resourceUtilization: number;
}

export interface AIAccuracyMetrics {
  intentRecognition: number;
  entityExtraction: number;
  fraudDetection: number;
  voiceRecognition: number;
  documentProcessing: number;
}

export interface AIEngagementMetrics {
  userSatisfaction: number;
  completionRate: number;
  retryRate: number;
  escalationRate: number;
  feedbackScore: number;
}
```

**src/types/tenant.ts:**
```typescript
import { AIServiceConfig, TenantAIPersonality } from './ai';

export interface Tenant {
  id: string;
  name: string;
  displayName: string;
  subdomain: string;
  customDomain?: string;
  status: 'active' | 'suspended' | 'inactive' | 'pending';
  tier: 'basic' | 'premium' | 'enterprise';
  region: string;
  complianceLevel: 'tier1' | 'tier2' | 'tier3';
  
  // Database configuration
  database: {
    connectionString: string;
    encryptionKey: string;
    backupSchedule: string;
  };
  
  // Business configuration
  configuration: TenantConfiguration;
  
  // Compliance and regulatory
  compliance: TenantCompliance;
  
  // AI configuration
  aiConfiguration: TenantAIConfiguration;
  
  // Branding and theming
  branding: TenantBranding;
  
  // Security settings
  security: TenantSecurity;
  
  // Billing information
  billing: TenantBilling;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
}

export interface TenantConfiguration {
  branding: TenantBranding;
  businessRules: BusinessRules;
  paymentProviders: PaymentProvider[];
  featureFlags: FeatureFlags;
  limits: TransactionLimits;
  integrations: TenantIntegrations;
}

export interface TenantAIConfiguration {
  enabled: boolean;
  services: {
    conversationalAI: AIServiceConfig & { personality: TenantAIPersonality };
    fraudDetection: AIServiceConfig & { sensitivity: 'low' | 'medium' | 'high' };
    voiceProcessing: AIServiceConfig & { languages: string[] };
    documentAI: AIServiceConfig & { supportedDocuments: string[] };
    predictiveAnalytics: AIServiceConfig & { features: string[] };
  };
  models: {
    offline: string[];
    cloud: string[];
  };
  customization: {
    personality: TenantAIPersonality;
    responses: Record<string, string>;
    workflows: AIWorkflow[];
  };
}

export interface AIWorkflow {
  id: string;
  name: string;
  trigger: string;
  steps: AIWorkflowStep[];
  enabled: boolean;
}

export interface AIWorkflowStep {
  id: string;
  type: 'ai_analysis' | 'api_call' | 'user_prompt' | 'notification';
  configuration: Record<string, any>;
  nextStep?: string;
}

export interface TenantBranding {
  companyName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: number;
  appTitle: string;
  tagline: string;
  customCss?: string;
  darkMode: boolean;
  locale: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
}

export interface BusinessRules {
  transactionTypes: TransactionType[];
  transactionLimits: TransactionLimits;
  operatingHours: OperatingHours;
  approvalWorkflows: ApprovalWorkflow[];
  complianceRules: ComplianceRule[];
}

export interface TransactionLimits {
  daily: {
    amount: number;
    count: number;
  };
  monthly: {
    amount: number;
    count: number;
  };
  perTransaction: {
    minimum: number;
    maximum: number;
  };
  aiEnhanced: {
    riskBasedLimits: boolean;
    dynamicLimits: boolean;
    behaviorBasedAdjustments: boolean;
  };
}

export interface OperatingHours {
  timezone: string;
  workingDays: string[];
  startTime: string;
  endTime: string;
  holidays: string[];
  maintenanceWindows: MaintenanceWindow[];
}

export interface MaintenanceWindow {
  start: Date;
  end: Date;
  description: string;
  recurring: boolean;
}

export interface PaymentProvider {
  id: string;
  name: string;
  type: 'nibss' | 'interswitch' | 'flutterwave' | 'paystack';
  enabled: boolean;
  configuration: Record<string, any>;
  priority: number;
  aiRouting: {
    enabled: boolean;
    successRateWeighting: number;
    costWeighting: number;
    speedWeighting: number;
  };
}

export interface FeatureFlags {
  aiAssistant: boolean;
  voiceCommands: boolean;
  biometricAuth: boolean;
  offlineMode: boolean;
  qrCodePayments: boolean;
  bulkTransactions: boolean;
  advancedAnalytics: boolean;
  realTimeFraudDetection: boolean;
  multilanguageSupport: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  webhooks: boolean;
}

export interface TenantCompliance {
  regulatoryRequirements: string[];
  dataRetentionPeriod: number;
  auditLevel: 'basic' | 'enhanced' | 'comprehensive';
  encryptionRequirements: EncryptionSpec;
  complianceReports: ComplianceReport[];
}

export interface EncryptionSpec {
  algorithm: string;
  keyLength: number;
  rotationFrequency: number;
  hsm: boolean;
}

export interface ComplianceReport {
  id: string;
  type: string;
  generatedAt: Date;
  status: 'compliant' | 'non_compliant' | 'partial';
  findings: ComplianceFinding[];
}

export interface ComplianceFinding {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  resolved: boolean;
}

export interface TenantSecurity {
  mfa: {
    required: boolean;
    methods: string[];
    exemptions: string[];
  };
  sessionManagement: {
    timeout: number;
    maxConcurrentSessions: number;
    deviceBinding: boolean;
  };
  ipWhitelist: string[];
  geoRestrictions: {
    allowedCountries: string[];
    blockedCountries: string[];
  };
  fraudPrevention: {
    enabled: boolean;
    riskThreshold: number;
    actions: string[];
  };
}

export interface TenantBilling {
  plan: 'basic' | 'premium' | 'enterprise' | 'custom';
  billingCycle: 'monthly' | 'quarterly' | 'annually';
  currency: string;
  subscriptionFee: number;
  transactionFee: number;
  overage: {
    transactionFee: number;
    userFee: number;
  };
  paymentMethod: {
    type: string;
    details: Record<string, any>;
  };
  invoicing: {
    email: string;
    frequency: string;
    format: string;
  };
}

export interface TenantIntegrations {
  sso: {
    enabled: boolean;
    provider: string;
    configuration: Record<string, any>;
  };
  api: {
    enabled: boolean;
    keys: string[];
    webhooks: WebhookConfig[];
  };
  thirdParty: ExternalIntegration[];
}

export interface WebhookConfig {
  url: string;
  events: string[];
  secret: string;
  active: boolean;
}

export interface ExternalIntegration {
  name: string;
  type: string;
  configuration: Record<string, any>;
  enabled: boolean;
}

// Tenant Detection and Management
export interface TenantDetectionResult {
  tenantId: string;
  method: 'subdomain' | 'domain' | 'header' | 'token';
  confidence: number;
  fallback: boolean;
}

export interface TenantContext {
  tenant: Tenant;
  configuration: TenantConfiguration;
  user: TenantUser;
  permissions: string[];
  features: FeatureFlags;
  theme: TenantBranding;
  ai: TenantAIConfiguration;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  email: string;
  role: string;
  permissions: string[];
  preferences: UserPreferences;
  aiPreferences: AIPreferences;
}

export interface UserPreferences {
  language: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
}

export interface AIPreferences {
  assistantEnabled: boolean;
  voiceCommands: boolean;
  personalityType: string;
  language: string;
  privacyLevel: 'minimal' | 'standard' | 'comprehensive';
  dataSharing: {
    analytics: boolean;
    modelImprovement: boolean;
    personalization: boolean;
  };
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
  categories: Record<string, boolean>;
}

export interface PrivacyPreferences {
  dataCollection: 'minimal' | 'standard' | 'full';
  analytics: boolean;
  marketing: boolean;
  thirdParty: boolean;
}
```

---

## 2. AI-Enhanced Multi-Tenant Component Development

### 2.1 Multi-Tenant Base UI Components with AI Integration

#### 2.1.1 Tenant-Aware AI Button Component

**src/components/ui/AIButton.tsx:**
```typescript
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { useTenant } from '@hooks/useTenant';
import { useAI } from '@hooks/useAI';
import Icon from 'react-native-vector-icons/MaterialIcons';

export interface AIButtonProps {
  title: string;
  onPress: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'ai' | 'voice';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  aiEnabled?: boolean;
  voiceCommand?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  children?: React.ReactNode;
}

export const AIButton: React.FC<AIButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  aiEnabled = false,
  voiceCommand,
  style,
  textStyle,
  children,
}) => {
  const { tenant, theme } = useTenant();
  const { isAIFeatureEnabled, registerVoiceCommand } = useAI();

  // Register voice command if provided and AI is enabled
  React.useEffect(() => {
    if (aiEnabled && voiceCommand && isAIFeatureEnabled('voice_commands')) {
      registerVoiceCommand(voiceCommand, onPress);
    }
  }, [aiEnabled, voiceCommand, isAIFeatureEnabled, registerVoiceCommand, onPress]);

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius,
      paddingHorizontal: size === 'small' ? 12 : size === 'large' ? 24 : 16,
      paddingVertical: size === 'small' ? 8 : size === 'large' ? 16 : 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: size === 'small' ? 36 : size === 'large' ? 56 : 44,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? theme.primaryColor + '50' : theme.primaryColor,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? theme.secondaryColor + '50' : theme.secondaryColor,
        };
      case 'ai':
        return {
          ...baseStyle,
          backgroundColor: disabled ? '#9c27b050' : '#9c27b0',
          shadowColor: '#9c27b0',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        };
      case 'voice':
        return {
          ...baseStyle,
          backgroundColor: disabled ? '#ff573350' : '#ff5733',
          borderWidth: 2,
          borderColor: '#ffffff50',
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontFamily: theme.fontFamily,
      fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
      fontWeight: 'bold',
      color: disabled ? theme.textColor + '70' : '#ffffff',
    };

    return baseTextStyle;
  };

  const handlePress = async () => {
    if (disabled || loading) return;
    
    // Add haptic feedback for AI buttons
    if (variant === 'ai' || variant === 'voice') {
      // Haptic feedback would be implemented here
      // HapticFeedback.trigger('impactLight');
    }
    
    await onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle(), style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={aiEnabled ? `Voice command: ${voiceCommand}` : undefined}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color="#ffffff" 
          style={styles.loadingIndicator}
        />
      ) : (
        <>
          {icon && (
            <Icon 
              name={icon} 
              size={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
              color="#ffffff" 
              style={styles.icon}
            />
          )}
          {variant === 'voice' && (
            <Icon 
              name="mic" 
              size={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
              color="#ffffff" 
              style={styles.icon}
            />
          )}
          {children || (
            <Text style={[getTextStyle(), textStyle]}>
              {title}
            </Text>
          )}
          {aiEnabled && variant !== 'voice' && (
            <View style={styles.aiIndicator}>
              <Icon name="psychology" size={12} color="#ffffff" />
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'relative',
  },
  loadingIndicator: {
    marginRight: 8,
  },
  icon: {
    marginRight: 8,
  },
  aiIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

#### 2.1.2 AI-Enhanced Input Component with Smart Suggestions

**src/components/ui/AIInput.tsx:**
```typescript
import React, { useState, useCallback, useRef } from 'react';
import {
  TextInput,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Modal,
  Keyboard,
} from 'react-native';
import { useTenant } from '@hooks/useTenant';
import { useAI } from '@hooks/useAI';
import Icon from 'react-native-vector-icons/MaterialIcons';

export interface AIInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: (text: string) => void;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: any;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  editable?: boolean;
  aiSuggestions?: boolean;
  voiceInput?: boolean;
  smartCompletion?: boolean;
  contextType?: 'transaction' | 'search' | 'general' | 'banking';
  style?: ViewStyle;
  inputStyle?: TextStyle;
  error?: string;
  required?: boolean;
}

export const AIInput: React.FC<AIInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  onSubmit,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
  editable = true,
  aiSuggestions = false,
  voiceInput = false,
  smartCompletion = false,
  contextType = 'general',
  style,
  inputStyle,
  error,
  required = false,
}) => {
  const { tenant, theme } = useTenant();
  const { 
    isAIFeatureEnabled, 
    getSmartSuggestions, 
    startVoiceInput,
    isVoiceInputActive 
  } = useAI();

  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Debounced AI suggestions
  const getSuggestions = useCallback(
    async (text: string) => {
      if (!aiSuggestions || !isAIFeatureEnabled('smart_suggestions') || text.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const aiSuggestions = await getSmartSuggestions({
          text,
          context: contextType,
          tenantId: tenant.id,
          maxSuggestions: 5,
        });
        
        setSuggestions(aiSuggestions);
        setShowSuggestions(aiSuggestions.length > 0);
      } catch (error) {
        console.warn('Failed to get AI suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    },
    [aiSuggestions, isAIFeatureEnabled, getSmartSuggestions, contextType, tenant.id]
  );

  // Debounced suggestions call
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isFocused && value) {
        getSuggestions(value);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, isFocused, getSuggestions]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Hide suggestions after a delay to allow selection
    setTimeout(() => setShowSuggestions(false), 150);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    onChangeText(suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();
    
    if (onSubmit) {
      onSubmit(suggestion);
    }
  };

  const handleVoiceInput = async () => {
    if (!voiceInput || !isAIFeatureEnabled('voice_input')) return;

    try {
      const result = await startVoiceInput({
        language: tenant.configuration.branding.locale,
        context: contextType,
      });
      
      if (result.transcript) {
        onChangeText(result.transcript);
        if (onSubmit) {
          onSubmit(result.transcript);
        }
      }
    } catch (error) {
      console.warn('Voice input failed:', error);
    }
  };

  const getInputContainerStyle = (): ViewStyle => ({
    borderWidth: 2,
    borderColor: error 
      ? '#f44336' 
      : isFocused 
        ? theme.primaryColor 
        : theme.secondaryColor + '30',
    borderRadius: theme.borderRadius,
    backgroundColor: theme.backgroundColor,
    paddingHorizontal: 12,
    paddingVertical: multiline ? 12 : 8,
    minHeight: multiline ? 80 : 44,
  });

  const getInputStyle = (): TextStyle => ({
    fontFamily: theme.fontFamily,
    fontSize: 16,
    color: theme.textColor,
    flex: 1,
    textAlignVertical: multiline ? 'top' : 'center',
  });

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: theme.textColor, fontFamily: theme.fontFamily }]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View style={[styles.inputContainer, getInputContainerStyle()]}>
        <TextInput
          ref={inputRef}
          style={[getInputStyle(), inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={theme.textColor + '70'}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={() => onSubmit?.(value)}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          editable={editable}
          returnKeyType={onSubmit ? 'done' : 'default'}
        />
        
        <View style={styles.inputActions}>
          {voiceInput && isAIFeatureEnabled('voice_input') && (
            <TouchableOpacity
              style={[
                styles.voiceButton,
                { backgroundColor: isVoiceInputActive ? '#ff5733' : theme.primaryColor }
              ]}
              onPress={handleVoiceInput}
              accessibilityLabel="Voice input"
            >
              <Icon 
                name={isVoiceInputActive ? 'mic' : 'mic-none'} 
                size={20} 
                color="#ffffff" 
              />
            </TouchableOpacity>
          )}
          
          {aiSuggestions && isAIFeatureEnabled('smart_suggestions') && (
            <View style={styles.aiIndicator}>
              <Icon name="psychology" size={16} color={theme.primaryColor} />
            </View>
          )}
        </View>
      </View>
      
      {error && (
        <Text style={[styles.error, { color: '#f44336', fontFamily: theme.fontFamily }]}>
          {error}
        </Text>
      )}
      
      {/* AI Suggestions Modal */}
      <Modal
        visible={showSuggestions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuggestions(false)}
      >
        <TouchableOpacity
          style={styles.suggestionsOverlay}
          activeOpacity={1}
          onPress={() => setShowSuggestions(false)}
        >
          <View style={[
            styles.suggestionsContainer,
            { backgroundColor: theme.backgroundColor, borderColor: theme.primaryColor }
          ]}>
            <FlatList
              data={suggestions}
              keyExtractor={(item, index) => `suggestion-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.suggestionItem, { borderBottomColor: theme.secondaryColor + '20' }]}
                  onPress={() => handleSuggestionSelect(item)}
                >
                  <Icon name="lightbulb" size={16} color={theme.primaryColor} />
                  <Text style={[styles.suggestionText, { color: theme.textColor, fontFamily: theme.fontFamily }]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.suggestionsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  required: {
    color: '#f44336',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  voiceButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  aiIndicator: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  suggestionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsContainer: {
    width: '85%',
    maxHeight: 200,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
});
```

### 2.2 Tenant-Aware Transaction Components with AI Enhancement

#### 2.2.1 AI-Enhanced Transaction Form

**src/components/transaction/AITransactionForm.tsx:**
```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTenant } from '@hooks/useTenant';
import { useAI } from '@hooks/useAI';
import { useTransaction } from '@hooks/useTransaction';
import { AIInput } from '@components/ui/AIInput';
import { AIButton } from '@components/ui/AIButton';
import { TransactionTypeSelector } from './TransactionTypeSelector';
import { RecipientSelector } from './RecipientSelector';
import { AmountInput } from './AmountInput';
import { AITransactionSummary } from './AITransactionSummary';

export interface TransactionFormData {
  type: string;
  amount: number;
  recipient: string;
  accountNumber: string;
  reference: string;
  description: string;
  aiGenerated?: boolean;
  voiceInitiated?: boolean;
}

export interface AITransactionFormProps {
  initialData?: Partial<TransactionFormData>;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  onCancel?: () => void;
}

export const AITransactionForm: React.FC<AITransactionFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const { tenant, theme, configuration } = useTenant();
  const { 
    processNaturalLanguageCommand,
    getFraudAssessment,
    isAIFeatureEnabled,
    aiInsights 
  } = useAI();
  const { validateTransaction, processTransaction } = useTransaction();

  const [formData, setFormData] = useState<TransactionFormData>({
    type: '',
    amount: 0,
    recipient: '',
    accountNumber: '',
    reference: '',
    description: '',
    ...initialData,
  });

  const [loading, setLoading] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [fraudAssessment, setFraudAssessment] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [voiceCommand, setVoiceCommand] = useState('');

  // Process voice command or natural language input
  const handleNaturalLanguageInput = async (command: string) => {
    if (!isAIFeatureEnabled('natural_language_processing')) return;

    setAiProcessing(true);
    try {
      const result = await processNaturalLanguageCommand({
        command,
        context: 'transaction',
        tenantId: tenant.id,
      });

      if (result.intent && result.entities) {
        const newFormData = { ...formData };
        
        // Extract transaction details from AI processing
        if (result.entities.amount) {
          newFormData.amount = result.entities.amount.value;
        }
        
        if (result.entities.recipient) {
          newFormData.recipient = result.entities.recipient.value;
        }
        
        if (result.entities.account) {
          newFormData.accountNumber = result.entities.account.value;
        }
        
        if (result.intent.type) {
          newFormData.type = result.intent.type;
        }
        
        newFormData.aiGenerated = true;
        newFormData.voiceInitiated = command !== voiceCommand;
        
        setFormData(newFormData);
        
        // Show AI interpretation to user
        Alert.alert(
          'AI Understanding',
          `I understood: ${result.interpretation}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to process natural language command:', error);
      Alert.alert('AI Processing Error', 'Could not understand the command. Please try again.');
    } finally {
      setAiProcessing(false);
    }
  };

  // Real-time fraud assessment
  useEffect(() => {
    const performFraudAssessment = async () => {
      if (!formData.amount || !formData.type || !isAIFeatureEnabled('fraud_detection')) return;

      try {
        const assessment = await getFraudAssessment({
          transactionData: formData,
          userBehavior: {
            // Add current user behavior context
            location: 'current_location',
            device: 'current_device',
            timeOfDay: new Date().getHours(),
          },
          tenantId: tenant.id,
        });

        setFraudAssessment(assessment);
      } catch (error) {
        console.warn('Fraud assessment failed:', error);
      }
    };

    const timeoutId = setTimeout(performFraudAssessment, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData.amount, formData.type, formData.recipient]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Validate transaction
      const validation = await validateTransaction(formData);
      if (!validation.isValid) {
        Alert.alert('Validation Error', validation.message);
        return;
      }

      // Check fraud assessment
      if (fraudAssessment && fraudAssessment.riskLevel === 'high') {
        Alert.alert(
          'Security Alert',
          'This transaction has been flagged for security review. Please contact support.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Submit transaction
      await onSubmit(formData);
    } catch (error) {
      Alert.alert('Transaction Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceCommand = (command: string) => {
    setVoiceCommand(command);
    handleNaturalLanguageInput(command);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.backgroundColor }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* AI Command Input */}
        {isAIFeatureEnabled('natural_language_processing') && (
          <View style={styles.aiSection}>
            <Text style={[styles.sectionTitle, { color: theme.textColor, fontFamily: theme.fontFamily }]}>
              AI Assistant
            </Text>
            <AIInput
              placeholder="Describe your transaction in natural language..."
              value={voiceCommand}
              onChangeText={setVoiceCommand}
              onSubmit={handleNaturalLanguageInput}
              multiline
              numberOfLines={2}
              aiSuggestions
              voiceInput
              contextType="transaction"
              style={styles.aiCommandInput}
            />
            {aiProcessing && (
              <View style={styles.aiProcessingIndicator}>
                <Text style={[styles.aiProcessingText, { color: theme.primaryColor }]}>
                  AI is processing your request...
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Transaction Type */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textColor, fontFamily: theme.fontFamily }]}>
            Transaction Type
          </Text>
          <TransactionTypeSelector
            selectedType={formData.type}
            onTypeSelect={(type) => setFormData({ ...formData, type })}
            allowedTypes={configuration.businessRules.transactionTypes}
            tenantBranding={theme}
          />
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <AmountInput
            value={formData.amount}
            onChange={(amount) => setFormData({ ...formData, amount })}
            currency={configuration.branding.currency}
            limits={configuration.businessRules.transactionLimits}
            tenantBranding={theme}
            aiSuggestions={isAIFeatureEnabled('smart_suggestions')}
            fraudAssessment={fraudAssessment}
          />
        </View>

        {/* Recipient Selection */}
        {formData.type && ['send_money', 'pay_bill'].includes(formData.type) && (
          <View style={styles.section}>
            <RecipientSelector
              recipient={formData.recipient}
              accountNumber={formData.accountNumber}
              onRecipientChange={(recipient, accountNumber) =>
                setFormData({ ...formData, recipient, accountNumber })
              }
              transactionType={formData.type}
              aiSuggestions={isAIFeatureEnabled('smart_suggestions')}
              tenantBranding={theme}
            />
          </View>
        )}

        {/* Reference and Description */}
        <View style={styles.section}>
          <AIInput
            label="Reference (Optional)"
            placeholder="Enter reference"
            value={formData.reference}
            onChangeText={(reference) => setFormData({ ...formData, reference })}
            aiSuggestions={isAIFeatureEnabled('smart_suggestions')}
            contextType="banking"
          />
          
          <AIInput
            label="Description (Optional)"
            placeholder="Transaction description"
            value={formData.description}
            onChangeText={(description) => setFormData({ ...formData, description })}
            multiline
            numberOfLines={2}
            aiSuggestions={isAIFeatureEnabled('smart_suggestions')}
            contextType="banking"
          />
        </View>

        {/* AI Transaction Summary */}
        {isAIFeatureEnabled('ai_insights') && formData.type && formData.amount > 0 && (
          <AITransactionSummary
            transactionData={formData}
            fraudAssessment={fraudAssessment}
            aiInsights={aiInsights}
            tenantBranding={theme}
          />
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {onCancel && (
            <AIButton
              title="Cancel"
              onPress={onCancel}
              variant="secondary"
              style={[styles.button, styles.cancelButton]}
            />
          )}
          
          <AIButton
            title={loading ? 'Processing...' : 'Submit Transaction'}
            onPress={handleSubmit}
            variant="ai"
            loading={loading}
            disabled={!formData.type || !formData.amount || loading}
            style={[styles.button, styles.submitButton]}
            aiEnabled
            voiceCommand="submit transaction"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  aiSection: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(156, 39, 176, 0.3)',
  },
  aiCommandInput: {
    marginTop: 8,
  },
  aiProcessingIndicator: {
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    alignItems: 'center',
  },
  aiProcessingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 16,
  },
  button: {
    flex: 1,
  },
  cancelButton: {
    marginRight: 8,
  },
  submitButton: {
    marginLeft: 8,
  },
});
```

---

## 3. Conversational AI Interface Implementation

### 3.1 AI Chat Interface Component

**src/components/ai/AIAssistant/ChatInterface.tsx:**
```typescript
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useTenant } from '@hooks/useTenant';
import { useAI } from '@hooks/useAI';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ChatBubble } from './ChatBubble';
import { TypingIndicator } from './TypingIndicator';
import { QuickActions } from './QuickActions';
import { VoiceInputButton } from './VoiceInputButton';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
  actions?: ChatAction[];
  transactionData?: any;
  metadata?: {
    confidence?: number;
    language?: string;
    processingTime?: number;
  };
}

export interface ChatAction {
  type: 'quick_action' | 'transaction' | 'external_link';
  label: string;
  action: string;
  data?: any;
}

export interface ChatInterfaceProps {
  onTransactionRequest?: (data: any) => void;
  onExternalAction?: (action: string, data?: any) => void;
}

const { height: screenHeight } = Dimensions.get('window');

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onTransactionRequest,
  onExternalAction,
}) => {
  const { tenant, theme, configuration } = useTenant();
  const {
    sendMessage,
    isAIFeatureEnabled,
    startVoiceInput,
    isVoiceInputActive,
    stopVoiceInput,
  } = useAI();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const keyboardAnimation = useRef(new Animated.Value(0)).current;

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome-' + Date.now(),
      role: 'assistant',
      content: `Hello! I'm ${configuration.ai?.services.conversationalAI.personality.name || 'your AI assistant'}, your ${tenant.name} assistant. I can help you process transactions, check balances, or answer questions. You can speak to me in English, Hausa, Yoruba, or Igbo. How can I help you today?`,
      timestamp: new Date(),
      actions: [
        { type: 'quick_action', label: 'Check Balance', action: 'check_balance' },
        { type: 'quick_action', label: 'Send Money', action: 'start_transfer' },
        { type: 'quick_action', label: 'Pay Bill', action: 'start_bill_payment' },
        { type: 'quick_action', label: 'Buy Airtime', action: 'start_airtime' },
      ],
    };
    
    setMessages([welcomeMessage]);
  }, [tenant, configuration]);

  // Keyboard handling
  useEffect(() => {
    const keyboardWillShow = (event: any) => {
      const { height, duration } = event.endCoordinates;
      setKeyboardHeight(height);
      Animated.timing(keyboardAnimation, {
        toValue: height,
        duration,
        useNativeDriver: false,
      }).start();
    };

    const keyboardWillHide = (event: any) => {
      const { duration } = event.endCoordinates;
      setKeyboardHeight(0);
      Animated.timing(keyboardAnimation, {
        toValue: 0,
        duration,
        useNativeDriver: false,
      }).start();
    };

    const showListener = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideListener = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    
    // Keyboard event listeners would be added here in real implementation
    
    return () => {
      // Cleanup listeners
    };
  }, []);

  const sendChatMessage = async (text: string, isVoice = false) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      isVoice,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await sendMessage({
        message: text,
        context: {
          tenantId: tenant.id,
          userId: 'current_user_id', // Get from auth context
          conversationHistory: messages.slice(-5), // Last 5 messages for context
          userPreferences: {
            language: configuration.branding.locale,
            preferredCurrency: configuration.branding.currency,
          },
        },
        isVoice,
      });

      const assistantMessage: ChatMessage = {
        id: 'assistant-' + Date.now(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        actions: response.suggestedActions,
        transactionData: response.extractedTransaction,
        metadata: {
          confidence: response.confidence,
          language: response.detectedLanguage,
          processingTime: response.processingTime,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle specific AI responses
      if (response.type === 'transaction_intent') {
        if (onTransactionRequest && response.extractedTransaction) {
          onTransactionRequest(response.extractedTransaction);
        }
      }

    } catch (error) {
      const errorMessage: ChatMessage = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again or contact support if the problem persists.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceInput = async () => {
    if (isVoiceInputActive) {
      try {
        const result = await stopVoiceInput();
        if (result.transcript) {
          await sendChatMessage(result.transcript, true);
        }
      } catch (error) {
        console.error('Voice input error:', error);
      }
    } else {
      try {
        await startVoiceInput({
          language: configuration.branding.locale,
          continuous: false,
          interimResults: true,
        });
      } catch (error) {
        console.error('Failed to start voice input:', error);
      }
    }
  };

  const handleQuickAction = async (action: ChatAction) => {
    switch (action.type) {
      case 'quick_action':
        await sendChatMessage(action.label);
        break;
      case 'transaction':
        if (onTransactionRequest) {
          onTransactionRequest(action.data);
        }
        break;
      case 'external_link':
        if (onExternalAction) {
          onExternalAction(action.action, action.data);
        }
        break;
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <ChatBubble
      message={item}
      tenantBranding={theme}
      onActionPress={handleQuickAction}
    />
  );

  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  useEffect(() => {
    // Auto scroll to bottom when new messages arrive
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Chat Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
      />

      {/* Typing Indicator */}
      {isTyping && (
        <TypingIndicator
          tenantBranding={theme}
          assistantName={configuration.ai?.services.conversationalAI.personality.name}
        />
      )}

      {/* Quick Actions */}
      {messages.length === 1 && (
        <QuickActions
          actions={messages[0].actions || []}
          onActionPress={handleQuickAction}
          tenantBranding={theme}
        />
      )}

      {/* Input Area */}
      <Animated.View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.backgroundColor,
            borderTopColor: theme.secondaryColor + '30',
            paddingBottom: Math.max(keyboardHeight, 20),
          },
        ]}
      >
        <View style={[styles.inputRow, { backgroundColor: theme.backgroundColor }]}>
          <TextInput
            ref={inputRef}
            style={[
              styles.textInput,
              {
                backgroundColor: theme.backgroundColor,
                borderColor: theme.primaryColor,
                color: theme.textColor,
                fontFamily: theme.fontFamily,
              },
            ]}
            placeholder={`Message ${configuration.ai?.services.conversationalAI.personality.name || 'AI Assistant'}...`}
            placeholderTextColor={theme.textColor + '70'}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => sendChatMessage(inputText)}
            multiline
            maxLength={500}
            returnKeyType="send"
            blurOnSubmit={false}
          />

          {/* Voice Input Button */}
          {isAIFeatureEnabled('voice_input') && (
            <VoiceInputButton
              isActive={isVoiceInputActive}
              onPress={handleVoiceInput}
              tenantBranding={theme}
            />
          )}

          {/* Send Button */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: inputText.trim() ? theme.primaryColor : theme.secondaryColor,
              },
            ]}
            onPress={() => sendChatMessage(inputText)}
            disabled={!inputText.trim() || isTyping}
          >
            <Icon name="send" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Character Counter */}
        <Text style={[styles.characterCounter, { color: theme.textColor + '70' }]}>
          {inputText.length}/500
        </Text>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  inputContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 12,
    fontSize: 16,
    maxHeight: 120,
    marginRight: 8,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  characterCounter: {
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 4,
  },
});
```

### 3.2 Chat Bubble Component with Rich Content Support

**src/components/ai/AIAssistant/ChatBubble.tsx:**
```typescript
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ChatMessage, ChatAction } from './ChatInterface';
import { TenantBranding } from '@types/tenant';
import { formatCurrency, formatDate } from '@utils/formatting';

export interface ChatBubbleProps {
  message: ChatMessage;
  tenantBranding: TenantBranding;
  onActionPress: (action: ChatAction) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const maxBubbleWidth = screenWidth * 0.8;

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  tenantBranding,
  onActionPress,
}) => {
  const isUser = message.role === 'user';

  const renderActions = () => {
    if (!message.actions || message.actions.length === 0) return null;

    return (
      <View style={styles.actionsContainer}>
        {message.actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.actionButton,
              {
                backgroundColor: tenantBranding.primaryColor + '20',
                borderColor: tenantBranding.primaryColor,
              },
            ]}
            onPress={() => onActionPress(action)}
          >
            <Text
              style={[
                styles.actionButtonText,
                { color: tenantBranding.primaryColor, fontFamily: tenantBranding.fontFamily },
              ]}
            >
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderTransactionData = () => {
    if (!message.transactionData) return null;

    const { type, amount, recipient, currency = 'NGN' } = message.transactionData;

    return (
      <View style={[styles.transactionCard, { borderColor: tenantBranding.primaryColor }]}>
        <View style={styles.transactionHeader}>
          <Icon name="account-balance-wallet" size={20} color={tenantBranding.primaryColor} />
          <Text
            style={[
              styles.transactionTitle,
              { color: tenantBranding.primaryColor, fontFamily: tenantBranding.fontFamily },
            ]}
          >
            Transaction Details
          </Text>
        </View>
        
        <View style={styles.transactionDetails}>
          <View style={styles.transactionRow}>
            <Text style={[styles.transactionLabel, { fontFamily: tenantBranding.fontFamily }]}>
              Type:
            </Text>
            <Text style={[styles.transactionValue, { fontFamily: tenantBranding.fontFamily }]}>
              {type?.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          
          {amount && (
            <View style={styles.transactionRow}>
              <Text style={[styles.transactionLabel, { fontFamily: tenantBranding.fontFamily }]}>
                Amount:
              </Text>
              <Text
                style={[
                  styles.transactionValue,
                  styles.amountText,
                  { fontFamily: tenantBranding.fontFamily, color: tenantBranding.primaryColor },
                ]}
              >
                {formatCurrency(amount, currency)}
              </Text>
            </View>
          )}
          
          {recipient && (
            <View style={styles.transactionRow}>
              <Text style={[styles.transactionLabel, { fontFamily: tenantBranding.fontFamily }]}>
                Recipient:
              </Text>
              <Text style={[styles.transactionValue, { fontFamily: tenantBranding.fontFamily }]}>
                {recipient}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderMetadata = () => {
    if (!message.metadata || !__DEV__) return null; // Only show in development

    return (
      <View style={styles.metadataContainer}>
        {message.metadata.confidence && (
          <Text style={styles.metadataText}>
            Confidence: {(message.metadata.confidence * 100).toFixed(1)}%
          </Text>
        )}
        {message.metadata.language && (
          <Text style={styles.metadataText}>
            Language: {message.metadata.language}
          </Text>
        )}
        {message.metadata.processingTime && (
          <Text style={styles.metadataText}>
            Response time: {message.metadata.processingTime}ms
          </Text>
        )}
      </View>
    );
  };

  const getBubbleStyle = () => {
    const baseStyle = [
      styles.bubble,
      {
        backgroundColor: isUser ? tenantBranding.primaryColor : tenantBranding.backgroundColor,
        borderColor: isUser ? 'transparent' : tenantBranding.secondaryColor + '30',
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        borderBottomRightRadius: isUser ? 4 : 16,
        borderBottomLeftRadius: isUser ? 16 : 4,
        maxWidth: maxBubbleWidth,
      },
    ];

    if (!isUser) {
      baseStyle.push({
        borderWidth: 1,
        shadowColor: tenantBranding.primaryColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      });
    }

    return baseStyle;
  };

  const getTextStyle = () => ({
    color: isUser ? '#ffffff' : tenantBranding.textColor,
    fontFamily: tenantBranding.fontFamily,
  });

  return (
    <View style={[styles.messageContainer, { alignItems: isUser ? 'flex-end' : 'flex-start' }]}>
      <View style={getBubbleStyle()}>
        {/* Voice indicator */}
        {message.isVoice && (
          <View style={styles.voiceIndicator}>
            <Icon name="mic" size={12} color={isUser ? '#ffffff70' : tenantBranding.primaryColor} />
            <Text
              style={[
                styles.voiceLabel,
                { color: isUser ? '#ffffff70' : tenantBranding.primaryColor, fontFamily: tenantBranding.fontFamily },
              ]}
            >
              Voice message
            </Text>
          </View>
        )}

        {/* Message content */}
        <Text style={[styles.messageText, getTextStyle()]}>
          {message.content}
        </Text>

        {/* Transaction data */}
        {renderTransactionData()}

        {/* Action buttons */}
        {renderActions()}

        {/* Metadata (dev only) */}
        {renderMetadata()}

        {/* Timestamp */}
        <Text
          style={[
            styles.timestamp,
            {
              color: isUser ? '#ffffff70' : tenantBranding.textColor + '70',
              fontFamily: tenantBranding.fontFamily,
              alignSelf: isUser ? 'flex-end' : 'flex-start',
            },
          ]}
        >
          {formatDate(message.timestamp, 'HH:mm')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 4,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    minWidth: 60,
  },
  voiceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  voiceLabel: {
    fontSize: 10,
    marginLeft: 4,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  transactionCard: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  transactionDetails: {
    gap: 4,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLabel: {
    fontSize: 12,
    color: '#666',
  },
  transactionValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metadataContainer: {
    marginTop: 8,
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
  },
  metadataText: {
    fontSize: 8,
    color: '#666',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
  },
});
```

This implementation provides a comprehensive foundation for the AI-enhanced multi-tenant frontend. The guide continues with voice processing, state management, authentication, and other critical components. Would you like me to continue with the next sections of Book 1, or would you prefer to see Books 2 and 3 as well?
