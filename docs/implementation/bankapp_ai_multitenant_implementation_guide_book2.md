# Book 2: Multi-Tenant Backend and AI Services Implementation Guide
## Nigerian Money Transfer System - AI-Enhanced Enterprise Infrastructure

**Version:** 2.0  
**Date:** September 2025  
**Target Audience:** Backend Developers, AI Engineers, DevOps Engineers, System Architects  

---

## Table of Contents

1. [Multi-Tenant AI-Enhanced Microservices Architecture](#1-multi-tenant-ai-enhanced-microservices-architecture)
2. [AI Services Implementation](#2-ai-services-implementation)
3. [Multi-Tenant Database Design with AI Data Management](#3-multi-tenant-database-design-with-ai-data-management)
4. [Tenant Management and Isolation Systems](#4-tenant-management-and-isolation-systems)
5. [AI Model Serving and Vector Database Integration](#5-ai-model-serving-and-vector-database-integration)
6. [Multi-Tenant Security Implementation](#6-multi-tenant-security-implementation)
7. [Nigerian Payment Systems Integration with AI](#7-nigerian-payment-systems-integration-with-ai)
8. [AI Analytics and Business Intelligence](#8-ai-analytics-and-business-intelligence)
9. [Multi-Tenant Monitoring and Observability](#9-multi-tenant-monitoring-and-observability)
10. [Compliance and Regulatory Implementation](#10-compliance-and-regulatory-implementation)

---

## 1. Multi-Tenant AI-Enhanced Microservices Architecture

### 1.1 Enhanced Project Structure for AI and Multi-Tenancy

```bash
orokii-moneytransfer-ai-backend/
├── services/
│   ├── api-gateway/           # Multi-tenant API Gateway with AI routing
│   ├── tenant-service/        # Tenant management service
│   ├── ai-intelligence-service/ # Core AI processing service
│   ├── auth-service/          # AI-enhanced authentication service
│   ├── user-service/          # Multi-tenant user management
│   ├── transaction-service/   # AI-enhanced transaction processing
│   ├── wallet-service/        # AI-powered wallet management
│   ├── fraud-service/         # AI fraud detection service
│   ├── notification-service/  # AI notification service
│   ├── settlement-service/    # AI settlement processing
│   ├── reporting-service/     # AI analytics and reporting
│   ├── compliance-service/    # AI compliance monitoring
│   ├── ai-model-service/      # AI model serving service
│   ├── document-ai-service/   # Document AI processing
│   └── voice-ai-service/      # Voice processing service
├── shared/
│   ├── ai/                    # Shared AI libraries
│   │   ├── models/           # AI model utilities
│   │   ├── nlp/              # NLP processing utilities
│   │   ├── fraud/            # Fraud detection utilities
│   │   └── analytics/        # AI analytics utilities
│   ├── tenant/               # Multi-tenant utilities
│   │   ├── context/          # Tenant context management
│   │   ├── isolation/        # Data isolation utilities
│   │   └── security/         # Tenant security utilities
│   ├── types/                # Common TypeScript types
│   ├── utils/                # Utility functions
│   ├── middleware/           # Common middleware
│   └── config/               # Configuration management
├── infrastructure/           # Infrastructure as code
│   ├── docker/              # Docker configurations
│   ├── kubernetes/          # K8s manifests for multi-tenancy
│   ├── terraform/           # Multi-tenant infrastructure
│   └── ai-infrastructure/   # AI/ML infrastructure
├── ai-models/               # AI model storage
│   ├── conversational/     # Conversational AI models
│   ├── fraud-detection/    # Fraud detection models
│   ├── nlp/               # NLP models for Nigerian languages
│   ├── voice/             # Voice processing models
│   └── vision/            # Computer vision models
├── docs/                   # API documentation
├── scripts/               # Deployment and utility scripts
└── monitoring/            # Monitoring and observability
```

### 1.2 Multi-Tenant AI Base Service Template

**shared/base-service/MultiTenantAIBaseService.ts:**
```typescript
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from './Logger';
import { MultiTenantDatabaseConnection } from './MultiTenantDatabaseConnection';
import { MessageQueue } from './MessageQueue';
import { HealthCheck } from './HealthCheck';
import { AIServiceClient } from './AIServiceClient';
import { TenantRegistry } from './TenantRegistry';

export interface MultiTenantAIServiceConfig {
  name: string;
  port: number;
  version: string;
  database?: {
    platformUrl: string;
    tenantUrlTemplate: string;
  };
  redis?: {
    url: string;
  };
  messageQueue?: {
    url: string;
  };
  ai?: {
    serviceUrl: string;
    apiKey: string;
    models: {
      [key: string]: string;
    };
  };
  tenant?: {
    registryUrl: string;
    defaultTenant: string;
  };
}

// Enhanced request interface with tenant and AI context
export interface MultiTenantAIRequest extends Request {
  tenantId?: string;
  tenant?: any;
  tenantDb?: any;
  aiContext?: {
    riskScore: number;
    userBehaviorSignals: any[];
    recommendedActions: string[];
    anomalyFlags: string[];
  };
  id: string;
}

export abstract class MultiTenantAIBaseService {
  protected app: Application;
  protected logger: Logger;
  protected platformDb?: MultiTenantDatabaseConnection;
  protected messageQueue?: MessageQueue;
  protected healthCheck: HealthCheck;
  protected aiServiceClient: AIServiceClient;
  protected tenantRegistry: TenantRegistry;
  private tenantConfigs: Map<string, any> = new Map();

  constructor(protected config: MultiTenantAIServiceConfig) {
    this.app = express();
    this.logger = new Logger(config.name);
    this.healthCheck = new HealthCheck(config.name);
    this.aiServiceClient = new AIServiceClient({
      baseUrl: config.ai?.serviceUrl || '',
      apiKey: config.ai?.apiKey || '',
    });
    this.tenantRegistry = new TenantRegistry(config.tenant?.registryUrl || '');
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Basic security and optimization middleware
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(cors({
      origin: this.getAllowedOrigins(),
      credentials: true,
    }));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request ID middleware
    this.app.use((req: MultiTenantAIRequest, res: Response, next: NextFunction) => {
      req.id = uuidv4();
      res.setHeader('X-Request-ID', req.id);
      next();
    });

    // Tenant detection and validation middleware
    this.app.use(async (req: MultiTenantAIRequest, res: Response, next: NextFunction) => {
      try {
        const tenantId = this.detectTenant(req);
        
        if (!tenantId) {
          return res.status(400).json({
            error: 'TENANT_REQUIRED',
            message: 'Tenant identification required',
          });
        }

        // Validate and load tenant configuration
        const tenant = await this.loadTenantConfiguration(tenantId);
        if (!tenant || tenant.status !== 'active') {
          return res.status(403).json({
            error: 'TENANT_INACTIVE',
            message: 'Invalid or inactive tenant',
          });
        }

        // Set tenant context
        req.tenantId = tenantId;
        req.tenant = tenant;
        req.tenantDb = await this.getTenantDatabase(tenantId);

        next();
      } catch (error) {
        this.logger.error('Tenant middleware error', { error, requestId: req.id });
        res.status(500).json({
          error: 'TENANT_MIDDLEWARE_ERROR',
          message: 'Failed to process tenant context',
        });
      }
    });

    // AI-powered request analysis middleware
    this.app.use(async (req: MultiTenantAIRequest, res: Response, next: NextFunction) => {
      try {
        // Analyze request for potential issues or optimizations
        const requestAnalysis = await this.aiServiceClient.analyzeRequest({
          path: req.path,
          method: req.method,
          headers: req.headers,
          body: req.body,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          tenantId: req.tenantId,
        });

        // Add AI insights to request context
        req.aiContext = {
          riskScore: requestAnalysis.riskScore,
          userBehaviorSignals: requestAnalysis.behaviorSignals,
          recommendedActions: requestAnalysis.recommendedActions,
          anomalyFlags: requestAnalysis.anomalyFlags,
        };

        // Block high-risk requests
        if (requestAnalysis.riskScore > 0.9) {
          return res.status(403).json({
            error: 'HIGH_RISK_REQUEST_BLOCKED',
            message: 'Request blocked due to security analysis',
            requestId: req.id,
          });
        }

        next();
      } catch (error) {
        // Log AI analysis error but continue processing
        this.logger.warn('AI request analysis failed', { 
          error: error.message,
          requestId: req.id 
        });
        next();
      }
    });

    // Rate limiting with tenant-aware configuration
    this.app.use((req: MultiTenantAIRequest, res: Response, next: NextFunction) => {
      const tenant = req.tenant;
      const rateLimitConfig = this.getTenantRateLimitConfig(tenant);
      
      const rateLimitMiddleware = rateLimit({
        windowMs: rateLimitConfig.windowMs,
        max: rateLimitConfig.max,
        message: rateLimitConfig.message,
        keyGenerator: (req: MultiTenantAIRequest) => `${req.tenantId}:${req.ip}`,
        skip: (req: MultiTenantAIRequest) => {
          // Skip rate limiting for premium tenants or low-risk requests
          return tenant.tier === 'premium' || (req.aiContext?.riskScore || 0) < 0.3;
        },
      });

      rateLimitMiddleware(req, res, next);
    });
  }

  private detectTenant(req: MultiTenantAIRequest): string | null {
    // 1. Check subdomain (preferred method)
    const host = req.get('host');
    if (host) {
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        return subdomain;
      }
    }

    // 2. Check custom header
    const tenantHeader = req.get('X-Tenant-ID');
    if (tenantHeader) return tenantHeader;

    // 3. Check JWT token tenant claim
    const authHeader = req.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = this.aiServiceClient.decodeToken(token) as any;
        if (decoded && decoded.tenantId) {
          return decoded.tenantId;
        }
      } catch (error) {
        // Continue to other methods
      }
    }

    return null;
  }

  private async loadTenantConfiguration(tenantId: string): Promise<any> {
    if (this.tenantConfigs.has(tenantId)) {
      return this.tenantConfigs.get(tenantId);
    }

    try {
      const tenant = await this.tenantRegistry.getTenant(tenantId);
      
      // Enhance configuration with AI-generated optimizations
      const optimizedConfig = await this.aiServiceClient.optimizeTenantConfig({
        baseConfig: tenant,
        tenantMetrics: await this.getTenantMetrics(tenantId),
        userBehaviorPatterns: await this.getTenantUserPatterns(tenantId),
      });

      this.tenantConfigs.set(tenantId, optimizedConfig);
      
      // Cache for 1 hour
      setTimeout(() => {
        this.tenantConfigs.delete(tenantId);
      }, 60 * 60 * 1000);

      return optimizedConfig;
    } catch (error) {
      this.logger.error('Failed to load tenant configuration', { 
        tenantId, 
        error: error.message 
      });
      throw error;
    }
  }

  private async getTenantDatabase(tenantId: string): Promise<any> {
    const connectionString = this.config.database?.tenantUrlTemplate?.replace('{tenant_id}', tenantId);
    if (!connectionString) {
      throw new Error('Tenant database configuration not found');
    }
    
    // Return database connection for specific tenant
    return new MultiTenantDatabaseConnection(connectionString, tenantId);
  }

  private getAllowedOrigins(): string[] {
    // Dynamically generate allowed origins based on tenant configurations
    return [
      'http://localhost:3000',
      'https://*.nibss.com',
      'https://*.bank-a.com',
      'https://*.bank-b.com',
      'https://*.bank-c.com',
    ];
  }

  private getTenantRateLimitConfig(tenant: any) {
    const baseConfig = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: 'Too many requests from this tenant',
    };

    // Adjust rate limits based on tenant tier
    switch (tenant.tier) {
      case 'enterprise':
        return { ...baseConfig, max: 1000 };
      case 'premium':
        return { ...baseConfig, max: 500 };
      case 'basic':
      default:
        return baseConfig;
    }
  }

  // AI-enhanced tenant operations
  protected async executeAIEnhancedTenantOperation<T>(
    tenantId: string,
    operation: string,
    operationData: any,
    callback: (db: any, aiInsights: any) => Promise<T>
  ): Promise<T> {
    const tenantDb = await this.getTenantDatabase(tenantId);
    const tenant = await this.loadTenantConfiguration(tenantId);
    
    // Get AI insights for the operation
    const aiInsights = await this.aiServiceClient.generateOperationInsights({
      operation,
      operationData,
      tenantId,
      tenantConfig: tenant,
    });

    // Set tenant context in database session
    await tenantDb.query('SET app.current_tenant_id = $1', [tenantId]);
    
    try {
      const result = await callback(tenantDb, aiInsights);
      
      // Log successful AI-enhanced operation
      await this.auditAIOperation(tenantId, operation, {
        operationData,
        aiInsights,
        result: 'success',
      });
      
      return result;
    } catch (error) {
      // Log failed AI-enhanced operation
      await this.auditAIOperation(tenantId, operation, {
        operationData,
        aiInsights,
        result: 'error',
        error: error.message,
      });
      
      throw error;
    } finally {
      await tenantDb.query('RESET app.current_tenant_id');
    }
  }

  private async auditAIOperation(
    tenantId: string,
    operation: string,
    details: any
  ): Promise<void> {
    // Use AI to categorize and analyze the audit event
    const auditAnalysis = await this.aiServiceClient.analyzeAuditEvent({
      tenantId,
      operation,
      details,
      timestamp: new Date(),
    });

    await this.logAuditEvent({
      tenantId,
      service: this.config.name,
      operation,
      details,
      aiAnalysis: auditAnalysis,
      riskLevel: auditAnalysis.riskLevel,
      complianceFlags: auditAnalysis.complianceFlags,
      timestamp: new Date(),
    });

    // Trigger alerts for high-risk operations
    if (auditAnalysis.riskLevel === 'high') {
      await this.triggerSecurityAlert(tenantId, operation, auditAnalysis);
    }
  }

  private async getTenantMetrics(tenantId: string): Promise<any> {
    // Implementation would fetch tenant-specific metrics
    return {};
  }

  private async getTenantUserPatterns(tenantId: string): Promise<any> {
    // Implementation would fetch tenant user behavior patterns
    return {};
  }

  private async logAuditEvent(event: any): Promise<void> {
    // Implementation would log audit events
    this.logger.info('Audit event', event);
  }

  private async triggerSecurityAlert(tenantId: string, operation: string, analysis: any): Promise<void> {
    // Implementation would trigger security alerts
    this.logger.warn('Security alert triggered', { tenantId, operation, analysis });
  }

  protected abstract setupRoutes(): void;

  private setupErrorHandling(): void {
    // Global error handler with tenant context
    this.app.use((error: Error, req: MultiTenantAIRequest, res: Response, next: NextFunction) => {
      this.logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        requestId: req.id,
        tenantId: req.tenantId,
        path: req.path,
        method: req.method,
      });

      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An internal server error occurred',
        requestId: req.id,
      });
    });

    // 404 handler
    this.app.use((req: MultiTenantAIRequest, res: Response) => {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Resource not found',
        requestId: req.id,
      });
    });
  }

  async start(): Promise<void> {
    try {
      // Initialize connections
      if (this.config.database) {
        this.platformDb = new MultiTenantDatabaseConnection(
          this.config.database.platformUrl,
          'platform'
        );
        await this.platformDb.connect();
      }

      if (this.config.messageQueue) {
        this.messageQueue = new MessageQueue(this.config.messageQueue.url);
        await this.messageQueue.connect();
      }

      // Initialize AI services
      await this.aiServiceClient.initialize();

      // Start health checks
      this.healthCheck.start();

      // Start server
      this.app.listen(this.config.port, () => {
        this.logger.info(`${this.config.name} started`, {
          port: this.config.port,
          version: this.config.version,
        });
      });
    } catch (error) {
      this.logger.error('Failed to start service', { error });
      process.exit(1);
    }
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down service');
    
    if (this.platformDb) {
      await this.platformDb.disconnect();
    }
    
    if (this.messageQueue) {
      await this.messageQueue.disconnect();
    }

    await this.aiServiceClient.shutdown();
    this.healthCheck.stop();
  }
}
```

---

## 2. AI Services Implementation

### 2.1 Core AI Intelligence Service

**services/ai-intelligence-service/src/AIIntelligenceService.ts:**
```typescript
import { MultiTenantAIBaseService, MultiTenantAIRequest } from '../../shared/base-service/MultiTenantAIBaseService';
import { Request, Response, NextFunction } from 'express';
import OpenAI from 'openai';
import { NLPProcessor } from './processors/NLPProcessor';
import { ConversationalAI } from './processors/ConversationalAI';
import { IntentClassifier } from './processors/IntentClassifier';
import { EntityExtractor } from './processors/EntityExtractor';

export class AIIntelligenceService extends MultiTenantAIBaseService {
  private openai: OpenAI;
  private nlpProcessor: NLPProcessor;
  private conversationalAI: ConversationalAI;
  private intentClassifier: IntentClassifier;
  private entityExtractor: EntityExtractor;

  constructor(config: any) {
    super(config);
    
    this.openai = new OpenAI({
      apiKey: config.ai.openaiApiKey,
    });
    
    this.nlpProcessor = new NLPProcessor();
    this.conversationalAI = new ConversationalAI(this.openai);
    this.intentClassifier = new IntentClassifier();
    this.entityExtractor = new EntityExtractor();
  }

  protected setupRoutes(): void {
    // Conversational AI endpoints
    this.app.post('/v1/chat/completions', this.handleChatCompletion.bind(this));
    this.app.post('/v1/nlp/process-command', this.handleNLPProcessing.bind(this));
    this.app.post('/v1/nlp/transaction-command', this.handleTransactionCommand.bind(this));
    
    // Intent and entity extraction
    this.app.post('/v1/intent/classify', this.handleIntentClassification.bind(this));
    this.app.post('/v1/entities/extract', this.handleEntityExtraction.bind(this));
    
    // Smart suggestions and recommendations
    this.app.post('/v1/suggestions/smart', this.handleSmartSuggestions.bind(this));
    this.app.post('/v1/recommendations/business', this.handleBusinessRecommendations.bind(this));
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'ai-intelligence-service' });
    });
  }

  private async handleChatCompletion(req: MultiTenantAIRequest, res: Response): Promise<void> {
    try {
      const { message, context, options = {} } = req.body;
      
      if (!message) {
        return res.status(400).json({
          error: 'MESSAGE_REQUIRED',
          message: 'Message is required for chat completion',
        });
      }

      // Get tenant-specific AI configuration
      const aiConfig = req.tenant.aiConfiguration.services.conversationalAI;
      
      // Process the conversation with tenant context
      const response = await this.conversationalAI.processMessage({
        message,
        context: {
          tenantId: req.tenantId,
          tenantName: req.tenant.name,
          userPreferences: context?.userPreferences || {},
          conversationHistory: context?.conversationHistory || [],
          businessContext: {
            bankName: req.tenant.branding.companyName,
            supportedServices: req.tenant.configuration.businessRules.transactionTypes,
            workingHours: req.tenant.configuration.businessRules.operatingHours,
            currency: req.tenant.branding.currency,
          },
          ...context,
        },
        personality: aiConfig.personality,
        options: {
          model: options.model || aiConfig.model || 'gpt-4',
          temperature: options.temperature || aiConfig.temperature || 0.7,
          maxTokens: options.maxTokens || aiConfig.maxTokens || 500,
          language: options.language || req.tenant.branding.locale || 'en',
          ...options,
        },
      });

      // Log the conversation for analytics
      await this.logConversation(req.tenantId, {
        userMessage: message,
        aiResponse: response.message,
        intent: response.intent,
        confidence: response.confidence,
        processingTime: response.processingTime,
      });

      res.json({
        success: true,
        data: response,
        requestId: req.id,
      });

    } catch (error) {
      this.logger.error('Chat completion failed', {
        error: error.message,
        requestId: req.id,
        tenantId: req.tenantId,
      });

      res.status(500).json({
        error: 'CHAT_COMPLETION_FAILED',
        message: 'Failed to process chat completion',
        requestId: req.id,
      });
    }
  }

  private async handleNLPProcessing(req: MultiTenantAIRequest, res: Response): Promise<void> {
    try {
      const { text, context, language } = req.body;
      
      if (!text) {
        return res.status(400).json({
          error: 'TEXT_REQUIRED',
          message: 'Text is required for NLP processing',
        });
      }

      // Process text with Nigerian language support
      const nlpResult = await this.nlpProcessor.processText({
        text,
        language: language || req.tenant.branding.locale || 'en',
        context: context || 'general',
        tenantId: req.tenantId,
        includeNigerianLanguages: true,
      });

      res.json({
        success: true,
        data: nlpResult,
        requestId: req.id,
      });

    } catch (error) {
      this.logger.error('NLP processing failed', {
        error: error.message,
        requestId: req.id,
        tenantId: req.tenantId,
      });

      res.status(500).json({
        error: 'NLP_PROCESSING_FAILED',
        message: 'Failed to process natural language text',
        requestId: req.id,
      });
    }
  }

  private async handleTransactionCommand(req: MultiTenantAIRequest, res: Response): Promise<void> {
    try {
      const { command, context, language, userId } = req.body;
      
      if (!command) {
        return res.status(400).json({
          error: 'COMMAND_REQUIRED',
          message: 'Transaction command is required',
        });
      }

      // Process transaction command with intent classification and entity extraction
      const result = await this.executeAIEnhancedTenantOperation(
        req.tenantId!,
        'process_transaction_command',
        { command, context, language, userId },
        async (tenantDb, aiInsights) => {
          // Classify intent
          const intentResult = await this.intentClassifier.classify({
            text: command,
            context: 'transaction',
            language: language || 'en',
            tenantId: req.tenantId,
          });

          // Extract entities
          const entityResult = await this.entityExtractor.extract({
            text: command,
            intent: intentResult.intent,
            context: {
              ...context,
              supportedServices: req.tenant.configuration.businessRules.transactionTypes,
              currency: req.tenant.branding.currency,
            },
            language: language || 'en',
          });

          // Generate natural language interpretation
          const interpretation = await this.conversationalAI.generateInterpretation({
            command,
            intent: intentResult,
            entities: entityResult.entities,
            confidence: Math.min(intentResult.confidence, entityResult.confidence),
          });

          return {
            intent: intentResult,
            entities: entityResult.entities,
            interpretation: interpretation.text,
            confidence: Math.min(intentResult.confidence, entityResult.confidence),
            suggestedActions: interpretation.suggestedActions,
            extractedTransaction: this.buildTransactionFromEntities(
              intentResult.intent,
              entityResult.entities
            ),
          };
        }
      );

      res.json({
        success: true,
        data: result,
        requestId: req.id,
      });

    } catch (error) {
      this.logger.error('Transaction command processing failed', {
        error: error.message,
        requestId: req.id,
        tenantId: req.tenantId,
      });

      res.status(500).json({
        error: 'TRANSACTION_COMMAND_FAILED',
        message: 'Failed to process transaction command',
        requestId: req.id,
      });
    }
  }

  private async handleIntentClassification(req: MultiTenantAIRequest, res: Response): Promise<void> {
    try {
      const { text, context, language } = req.body;
      
      const result = await this.intentClassifier.classify({
        text,
        context: context || 'general',
        language: language || 'en',
        tenantId: req.tenantId,
      });

      res.json({
        success: true,
        data: result,
        requestId: req.id,
      });

    } catch (error) {
      this.logger.error('Intent classification failed', {
        error: error.message,
        requestId: req.id,
        tenantId: req.tenantId,
      });

      res.status(500).json({
        error: 'INTENT_CLASSIFICATION_FAILED',
        message: 'Failed to classify intent',
        requestId: req.id,
      });
    }
  }

  private async handleEntityExtraction(req: MultiTenantAIRequest, res: Response): Promise<void> {
    try {
      const { text, intent, context, language } = req.body;
      
      const result = await this.entityExtractor.extract({
        text,
        intent,
        context,
        language: language || 'en',
      });

      res.json({
        success: true,
        data: result,
        requestId: req.id,
      });

    } catch (error) {
      this.logger.error('Entity extraction failed', {
        error: error.message,
        requestId: req.id,
        tenantId: req.tenantId,
      });

      res.status(500).json({
        error: 'ENTITY_EXTRACTION_FAILED',
        message: 'Failed to extract entities',
        requestId: req.id,
      });
    }
  }

  private async handleSmartSuggestions(req: MultiTenantAIRequest, res: Response): Promise<void> {
    try {
      const { text, context, maxSuggestions = 5 } = req.body;
      
      const suggestions = await this.generateSmartSuggestions({
        text,
        context: context || 'general',
        tenantId: req.tenantId!,
        maxSuggestions,
        tenantContext: {
          businessType: req.tenant.configuration.businessRules.transactionTypes,
          currency: req.tenant.branding.currency,
          locale: req.tenant.branding.locale,
        },
      });

      res.json({
        success: true,
        data: suggestions,
        requestId: req.id,
      });

    } catch (error) {
      this.logger.error('Smart suggestions failed', {
        error: error.message,
        requestId: req.id,
        tenantId: req.tenantId,
      });

      res.status(500).json({
        error: 'SMART_SUGGESTIONS_FAILED',
        message: 'Failed to generate smart suggestions',
        requestId: req.id,
      });
    }
  }

  private async handleBusinessRecommendations(req: MultiTenantAIRequest, res: Response): Promise<void> {
    try {
      const { timeframe, analysisType, includeComparisons = true } = req.body;
      
      const recommendations = await this.executeAIEnhancedTenantOperation(
        req.tenantId!,
        'generate_business_recommendations',
        { timeframe, analysisType, includeComparisons },
        async (tenantDb, aiInsights) => {
          // Fetch tenant business data
          const businessData = await this.fetchTenantBusinessData(tenantDb, timeframe);
          
          // Generate AI-powered recommendations
          const recommendations = await this.conversationalAI.generateBusinessRecommendations({
            businessData,
            tenantProfile: req.tenant,
            analysisType,
            includeComparisons,
            aiInsights,
          });

          return recommendations;
        }
      );

      res.json({
        success: true,
        data: recommendations,
        requestId: req.id,
      });

    } catch (error) {
      this.logger.error('Business recommendations failed', {
        error: error.message,
        requestId: req.id,
        tenantId: req.tenantId,
      });

      res.status(500).json({
        error: 'BUSINESS_RECOMMENDATIONS_FAILED',
        message: 'Failed to generate business recommendations',
        requestId: req.id,
      });
    }
  }

  private buildTransactionFromEntities(intent: any, entities: any[]): any {
    const transaction: any = {
      type: intent.type,
      confidence: intent.confidence,
    };

    entities.forEach(entity => {
      switch (entity.type) {
        case 'amount':
          transaction.amount = entity.value;
          transaction.currency = entity.currency || 'NGN';
          break;
        case 'recipient':
          transaction.recipient = entity.value;
          break;
        case 'account':
          transaction.accountNumber = entity.value;
          break;
        case 'service':
          transaction.service = entity.value;
          break;
        case 'reference':
          transaction.reference = entity.value;
          break;
      }
    });

    return transaction;
  }

  private async generateSmartSuggestions(params: any): Promise<string[]> {
    // Implementation would use AI to generate context-aware suggestions
    return [];
  }

  private async fetchTenantBusinessData(tenantDb: any, timeframe: string): Promise<any> {
    // Implementation would fetch business data from tenant database
    return {};
  }

  private async logConversation(tenantId: string, conversation: any): Promise<void> {
    // Implementation would log conversation for analytics
    this.logger.info('Conversation logged', { tenantId, conversation });
  }
}
```

### 2.2 AI Fraud Detection Service

**services/fraud-service/src/AIFraudDetectionService.ts:**
```typescript
import { MultiTenantAIBaseService, MultiTenantAIRequest } from '../../shared/base-service/MultiTenantAIBaseService';
import { Response } from 'express';
import * as tf from '@tensorflow/tfjs-node';
import { MLFraudDetector } from './ml/MLFraudDetector';
import { BehavioralAnalyzer } from './analyzers/BehavioralAnalyzer';
import { NetworkAnalyzer } from './analyzers/NetworkAnalyzer';
import { RiskScorer } from './scoring/RiskScorer';

export interface FraudDetectionRequest {
  transactionData: {
    amount: number;
    type: string;
    recipient?: string;
    accountNumber?: string;
    currency: string;
    timestamp: Date;
  };
  userBehaviorData: {
    loginFrequency: number;
    transactionPatterns: any[];
    deviceFingerprint: string;
    location: {
      latitude?: number;
      longitude?: number;
      country: string;
      city?: string;
    };
    timeOfDay: number;
    dayOfWeek: number;
  };
  contextualData: {
    deviceInfo: {
      type: 'mobile' | 'web' | 'api';
      os?: string;
      browser?: string;
      appVersion?: string;
    };
    networkInfo: {
      ipAddress: string;
      vpn: boolean;
      proxy: boolean;
      tor: boolean;
    };
    sessionInfo: {
      duration: number;
      actionsPerformed: string[];
      navigationPattern: string[];
    };
  };
}

export interface FraudDetectionResult {
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  factors: FraudRiskFactor[];
  recommendation: 'approve' | 'review' | 'decline' | 'additional_auth';
  explanation: string;
  processingTime: number;
  modelVersion: string;
}

export interface FraudRiskFactor {
  category: 'behavioral' | 'location' | 'device' | 'transaction' | 'network';
  factor: string;
  weight: number;
  evidence: string[];
  contribution: number; // How much this factor contributed to the overall risk score
}

export class AIFraudDetectionService extends MultiTenantAIBaseService {
  private mlFraudDetector: MLFraudDetector;
  private behavioralAnalyzer: BehavioralAnalyzer;
  private networkAnalyzer: NetworkAnalyzer;
  private riskScorer: RiskScorer;
  private models: Map<string, tf.LayersModel> = new Map();

  constructor(config: any) {
    super(config);
    
    this.mlFraudDetector = new MLFraudDetector();
    this.behavioralAnalyzer = new BehavioralAnalyzer();
    this.networkAnalyzer = new NetworkAnalyzer();
    this.riskScorer = new RiskScorer();
    
    this.loadModels();
  }

  protected setupRoutes(): void {
    // Main fraud detection endpoint
    this.app.post('/v1/fraud/assess-risk', this.handleFraudAssessment.bind(this));
    
    // Real-time risk scoring
    this.app.post('/v1/fraud/real-time-score', this.handleRealTimeScoring.bind(this));
    
    // Behavioral analysis
    this.app.post('/v1/fraud/analyze-behavior', this.handleBehavioralAnalysis.bind(this));
    
    // Network risk analysis
    this.app.post('/v1/fraud/analyze-network', this.handleNetworkAnalysis.bind(this));
    
    // Fraud pattern detection
    this.app.post('/v1/fraud/detect-patterns', this.handlePatternDetection.bind(this));
    
    // Model training and updates
    this.app.post('/v1/fraud/train-model', this.handleModelTraining.bind(this));
    this.app.post('/v1/fraud/update-model', this.handleModelUpdate.bind(this));
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        service: 'ai-fraud-detection-service',
        modelsLoaded: this.models.size,
      });
    });
  }

  private async loadModels(): Promise<void> {
    try {
      // Load pre-trained fraud detection models
      const nigerianFraudModel = await tf.loadLayersModel('file://./models/nigerian-fraud-detection/model.json');
      const globalFraudModel = await tf.loadLayersModel('file://./models/global-fraud-detection/model.json');
      const behavioralModel = await tf.loadLayersModel('file://./models/behavioral-analysis/model.json');
      
      this.models.set('nigerian-fraud', nigerianFraudModel);
      this.models.set('global-fraud', globalFraudModel);
      this.models.set('behavioral', behavioralModel);
      
      this.logger.info('Fraud detection models loaded successfully', {
        modelsCount: this.models.size,
      });
    } catch (error) {
      this.logger.error('Failed to load fraud detection models', { error });
    }
  }

  private async handleFraudAssessment(req: MultiTenantAIRequest, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const fraudRequest: FraudDetectionRequest = req.body;
      
      if (!fraudRequest.transactionData) {
        return res.status(400).json({
          error: 'TRANSACTION_DATA_REQUIRED',
          message: 'Transaction data is required for fraud assessment',
        });
      }

      // Perform comprehensive fraud assessment
      const result = await this.executeAIEnhancedTenantOperation(
        req.tenantId!,
        'fraud_assessment',
        fraudRequest,
        async (tenantDb, aiInsights) => {
          // Get tenant-specific fraud detection settings
          const fraudConfig = req.tenant.aiConfiguration.services.fraudDetection;
          
          // Analyze different risk factors
          const [
            mlFraudResult,
            behavioralResult,
            networkResult,
            historicalResult,
          ] = await Promise.all([
            this.mlFraudDetector.detectFraud(fraudRequest, this.models),
            this.behavioralAnalyzer.analyzeBehavior(fraudRequest.userBehaviorData, tenantDb),
            this.networkAnalyzer.analyzeNetwork(fraudRequest.contextualData.networkInfo),
            this.analyzeHistoricalPatterns(fraudRequest, tenantDb),
          ]);

          // Combine results with risk scoring
          const combinedResult = await this.riskScorer.calculateRiskScore({
            mlResult: mlFraudResult,
            behavioralResult,
            networkResult,
            historicalResult,
            tenantConfig: fraudConfig,
          });

          // Generate explanation and recommendations
          const explanation = await this.generateFraudExplanation(combinedResult);
          const recommendation = this.generateRecommendation(combinedResult, fraudConfig);

          const fraudDetectionResult: FraudDetectionResult = {
            riskScore: combinedResult.overallRiskScore,
            riskLevel: this.getRiskLevel(combinedResult.overallRiskScore),
            confidence: combinedResult.confidence,
            factors: combinedResult.riskFactors,
            recommendation,
            explanation,
            processingTime: Date.now() - startTime,
            modelVersion: this.mlFraudDetector.getModelVersion(),
          };

          // Log fraud assessment for analytics and model improvement
          await this.logFraudAssessment(req.tenantId!, fraudDetectionResult, fraudRequest);

          return fraudDetectionResult;
        }
      );

      res.json({
        success: true,
        data: result,
        requestId: req.id,
      });

    } catch (error) {
      this.logger.error('Fraud assessment failed', {
        error: error.message,
        requestId: req.id,
        tenantId: req.tenantId,
        processingTime: Date.now() - startTime,
      });

      res.status(500).json({
        error: 'FRAUD_ASSESSMENT_FAILED',
        message: 'Failed to assess fraud risk',
        requestId: req.id,
      });
    }
  }

  private async handleRealTimeScoring(req: MultiTenantAIRequest, res: Response): Promise<void> {
    try {
      const { transactionData, userContext } = req.body;
      
      // Fast real-time scoring (< 500ms target)
      const quickScore = await this.mlFraudDetector.quickScore({
        amount: transactionData.amount,
        type: transactionData.type,
        hour: new Date().getHours(),
        dayOfWeek: new Date().getDay(),
        userRiskProfile: userContext.riskProfile || 'medium',
      });

      res.json({
        success: true,
        data: {
          riskScore: quickScore.riskScore,
          riskLevel: this.getRiskLevel(quickScore.riskScore),
          processingTime: quickScore.processingTime,
          recommendation: quickScore.riskScore > 70 ? 'review' : 'approve',
        },
        requestId: req.id,
      });

    } catch (error) {
      this.logger.error('Real-time scoring failed', {
        error: error.message,
        requestId: req.id,
        tenantId: req.tenantId,
      });

      res.status(500).json({
        error: 'REAL_TIME_SCORING_FAILED',
        message: 'Failed to perform real-time fraud scoring',
        requestId: req.id,
      });
    }
  }

  private async handleBehavioralAnalysis(req: MultiTenantAIRequest, res: Response): Promise<void> {
    try {
      const { userBehaviorData } = req.body;
      
      const analysis = await this.executeAIEnhancedTenantOperation(
        req.tenantId!,
        'behavioral_analysis',
        userBehaviorData,
        async (tenantDb) => {
          return await this.behavioralAnalyzer.analyzeBehavior(userBehaviorData, tenantDb);
        }
      );

      res.json({
        success: true,
        data: analysis,
        requestId: req.id,
      });

    } catch (error) {
      this.logger.error('Behavioral analysis failed', {
        error: error.message,
        requestId: req.id,
        tenantId: req.tenantId,
      });

      res.status(500).json({
        error: 'BEHAVIORAL_ANALYSIS_FAILED',
        message: 'Failed to analyze user behavior',
        requestId: req.id,
      });
    }
  }

  private async handleNetworkAnalysis(req: MultiTenantAIRequest, res: Response): Promise<void> {
    try {
      const { networkInfo } = req.body;
      
      const analysis = await this.networkAnalyzer.analyzeNetwork(networkInfo);

      res.json({
        success: true,
        data: analysis,
        requestId: req.id,
      });

    } catch (error) {
      this.logger.error('Network analysis failed', {
        error: error.message,
        requestId: req.id,
        tenantId: req.tenantId,
      });

      res.status(500).json({
        error: 'NETWORK_ANALYSIS_FAILED',
        message: 'Failed to analyze network information',
        requestId: req.id,
      });
    }
  }

  private async handlePatternDetection(req: MultiTenantAIRequest, res: Response): Promise<void> {
    try {
      const { timeframe, patternTypes } = req.body;
      
      const patterns = await this.executeAIEnhancedTenantOperation(
        req.tenantId!,
        'pattern_detection',
        { timeframe, patternTypes },
        async (tenantDb) => {
          return await this.mlFraudDetector.detectPatterns(tenantDb, {
            timeframe,
            patternTypes: patternTypes || ['velocity', 'amount', 'recipient', 'location'],
          });
        }
      );

      res.json({
        success: true,
        data: patterns,
        requestId: req.id,
      });

    } catch (error) {
      this.logger.error('Pattern detection failed', {
        error: error.message,
        requestId: req.id,
        tenantId: req.tenantId,
      });

      res.status(500).json({
        error: 'PATTERN_DETECTION_FAILED',
        message: 'Failed to detect fraud patterns',
        requestId: req.id,
      });
    }
  }

  private async handleModelTraining(req: MultiTenantAIRequest, res: Response): Promise<void> {
    try {
      const { trainingData, modelType, options } = req.body;
      
      // Only allow tenant admins or platform admins to train models
      if (!this.hasModelTrainingPermissions(req)) {
        return res.status(403).json({
          error: 'INSUFFICIENT_PERMISSIONS',
          message: 'Model training requires elevated permissions',
        });
      }

      const trainingResult = await this.mlFraudDetector.trainModel({
        data: trainingData,
        modelType: modelType || 'fraud-detection',
        tenantId: req.tenantId,
        options: {
          epochs: options?.epochs || 100,
          batchSize: options?.batchSize || 32,
          validationSplit: options?.validationSplit || 0.2,
          ...options,
        },
      });

      res.json({
        success: true,
        data: trainingResult,
        requestId: req.id,
      });

    } catch (error) {
      this.logger.error('Model training failed', {
        error: error.message,
        requestId: req.id,
        tenantId: req.tenantId,
      });

      res.status(500).json({
        error: 'MODEL_TRAINING_FAILED',
        message: 'Failed to train fraud detection model',
        requestId: req.id,
      });
    }
  }

  private async handleModelUpdate(req: MultiTenantAIRequest, res: Response): Promise<void> {
    try {
      const { modelId, modelData, version } = req.body;
      
      if (!this.hasModelTrainingPermissions(req)) {
        return res.status(403).json({
          error: 'INSUFFICIENT_PERMISSIONS',
          message: 'Model updates require elevated permissions',
        });
      }

      // Update model
      const updateResult = await this.mlFraudDetector.updateModel({
        modelId,
        modelData,
        version,
        tenantId: req.tenantId,
      });

      // Reload models
      await this.loadModels();

      res.json({
        success: true,
        data: updateResult,
        requestId: req.id,
      });

    } catch (error) {
      this.logger.error('Model update failed', {
        error: error.message,
        requestId: req.id,
        tenantId: req.tenantId,
      });

      res.status(500).json({
        error: 'MODEL_UPDATE_FAILED',
        message: 'Failed to update fraud detection model',
        requestId: req.id,
      });
    }
  }

  private async analyzeHistoricalPatterns(request: FraudDetectionRequest, tenantDb: any): Promise<any> {
    // Analyze historical transaction patterns for this user
    const query = `
      SELECT 
        transaction_type,
        amount,
        recipient,
        created_at,
        status,
        risk_score
      FROM transactions 
      WHERE user_id = $1 
        AND created_at >= NOW() - INTERVAL '30 days'
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const historicalTransactions = await tenantDb.query(query, [request.userBehaviorData]);
    
    return {
      averageAmount: this.calculateAverage(historicalTransactions.rows, 'amount'),
      transactionFrequency: this.calculateFrequency(historicalTransactions.rows),
      unusualPatterns: this.detectUnusualPatterns(historicalTransactions.rows, request),
      riskLevel: this.calculateHistoricalRisk(historicalTransactions.rows),
    };
  }

  private getRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 30) return 'medium';
    return 'low';
  }

  private generateRecommendation(
    result: any, 
    fraudConfig: any
  ): 'approve' | 'review' | 'decline' | 'additional_auth' {
    const { overallRiskScore, confidence } = result;
    const sensitivity = fraudConfig.sensitivity || 'medium';
    
    // Adjust thresholds based on tenant sensitivity
    const thresholds = {
      low: { critical: 85, high: 70, medium: 50 },
      medium: { critical: 75, high: 60, medium: 40 },
      high: { critical: 65, high: 50, medium: 30 },
    }[sensitivity];

    if (overallRiskScore >= thresholds.critical) return 'decline';
    if (overallRiskScore >= thresholds.high) return 'review';
    if (overallRiskScore >= thresholds.medium) return 'additional_auth';
    return 'approve';
  }

  private async generateFraudExplanation(result: any): Promise<string> {
    const topFactors = result.riskFactors
      .sort((a: any, b: any) => b.contribution - a.contribution)
      .slice(0, 3);

    let explanation = `Risk assessment based on ${result.riskFactors.length} factors. `;
    
    if (topFactors.length > 0) {
      explanation += `Primary concerns: `;
      explanation += topFactors.map((f: any) => f.factor).join(', ');
      explanation += '. ';
    }

    if (result.overallRiskScore > 70) {
      explanation += 'High risk indicators detected. ';
    } else if (result.overallRiskScore > 40) {
      explanation += 'Moderate risk detected. ';
    } else {
      explanation += 'Low risk transaction. ';
    }

    explanation += `Confidence level: ${(result.confidence * 100).toFixed(0)}%.`;

    return explanation;
  }

  private hasModelTrainingPermissions(req: MultiTenantAIRequest): boolean {
    // Implementation would check user permissions
    return true; // Placeholder
  }

  private async logFraudAssessment(
    tenantId: string, 
    result: FraudDetectionResult, 
    request: FraudDetectionRequest
  ): Promise<void> {
    this.logger.info('Fraud assessment completed', {
      tenantId,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      recommendation: result.recommendation,
      processingTime: result.processingTime,
      transactionAmount: request.transactionData.amount,
      transactionType: request.transactionData.type,
    });
  }

  private calculateAverage(transactions: any[], field: string): number {
    if (transactions.length === 0) return 0;
    const sum = transactions.reduce((acc, t) => acc + (parseFloat(t[field]) || 0), 0);
    return sum / transactions.length;
  }

  private calculateFrequency(transactions: any[]): number {
    // Calculate transactions per day over the past 30 days
    return transactions.length / 30;
  }

  private detectUnusualPatterns(transactions: any[], request: FraudDetectionRequest): string[] {
    const patterns: string[] = [];
    
    // Detect unusual amounts
    const avgAmount = this.calculateAverage(transactions, 'amount');
    if (request.transactionData.amount > avgAmount * 3) {
      patterns.push('unusual_amount');
    }
    
    // Add more pattern detection logic here
    
    return patterns;
  }

  private calculateHistoricalRisk(transactions: any[]): number {
    // Calculate risk based on historical patterns
    const failedTransactions = transactions.filter(t => t.status === 'failed').length;
    const totalTransactions = transactions.length;
    
    if (totalTransactions === 0) return 50; // Default risk for new users
    
    return (failedTransactions / totalTransactions) * 100;
  }
}
```

---

## 3. Multi-Tenant Database Design with AI Data Management

### 3.1 Platform Database Schema (Shared)

**database/shared/platform-schema.sql:**
```sql
-- Master platform database for tenant management and shared services
CREATE DATABASE nibss_pos_platform;

\c nibss_pos_platform;

-- Create necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tenant registry table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) NOT NULL UNIQUE,
    custom_domain VARCHAR(255),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'suspended', 'inactive', 'pending')),
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('basic', 'premium', 'enterprise')),
    region VARCHAR(50) NOT NULL DEFAULT 'nigeria-west',
    compliance_level VARCHAR(10) NOT NULL CHECK (compliance_level IN ('tier1', 'tier2', 'tier3')),
    
    -- Database configuration
    database_config JSONB NOT NULL DEFAULT '{}',
    
    -- Business configuration
    configuration JSONB NOT NULL DEFAULT '{}',
    
    -- AI configuration
    ai_configuration JSONB NOT NULL DEFAULT '{
        "enabled": true,
        "services": {
            "conversationalAI": {
                "enabled": true,
                "model": "gpt-4",
                "personality": {
                    "name": "AI Assistant",
                    "tone": "professional",
                    "greeting": "Hello! How can I help you today?"
                }
            },
            "fraudDetection": {
                "enabled": true,
                "sensitivity": "medium"
            },
            "voiceProcessing": {
                "enabled": true,
                "languages": ["en", "ha", "yo", "ig"]
            }
        }
    }',
    
    -- Branding and theming
    branding JSONB NOT NULL DEFAULT '{}',
    
    -- Security settings
    security_settings JSONB NOT NULL DEFAULT '{}',
    
    -- Billing information
    billing_info JSONB NOT NULL DEFAULT '{}',
    
    -- Compliance and regulatory
    compliance_settings JSONB NOT NULL DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    last_modified_by UUID
);

-- Tenant billing table
CREATE TABLE tenant_billing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    base_fee DECIMAL(15,2) NOT NULL DEFAULT 0,
    transaction_fees DECIMAL(15,2) NOT NULL DEFAULT 0,
    overage_fees DECIMAL(15,2) NOT NULL DEFAULT 0,
    ai_usage_fees DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')),
    due_date DATE NOT NULL,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tenant usage metrics for billing and AI optimization
CREATE TABLE tenant_usage_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    transaction_volume DECIMAL(15,2) NOT NULL DEFAULT 0,
    api_calls INTEGER NOT NULL DEFAULT 0,
    ai_requests INTEGER NOT NULL DEFAULT 0,
    ai_processing_time DECIMAL(10,2) NOT NULL DEFAULT 0, -- in seconds
    storage_used BIGINT NOT NULL DEFAULT 0, -- in bytes
    bandwidth_used BIGINT NOT NULL DEFAULT 0, -- in bytes
    active_users INTEGER NOT NULL DEFAULT 0,
    features_used JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, metric_date)
);

-- AI model registry for tenant-specific models
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('conversational', 'fraud_detection', 'nlp', 'voice', 'vision')),
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('cloud', 'edge', 'hybrid')),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL for shared models
    model_url TEXT,
    config_url TEXT,
    model_size BIGINT NOT NULL,
    accuracy DECIMAL(5,4),
    latency DECIMAL(8,2), -- in milliseconds
    supported_languages TEXT[] DEFAULT ARRAY['en'],
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI conversation logs for analytics and improvement (aggregated, no PII)
CREATE TABLE ai_conversation_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    conversation_date DATE NOT NULL,
    total_conversations INTEGER NOT NULL DEFAULT 0,
    successful_resolutions INTEGER NOT NULL DEFAULT 0,
    average_confidence DECIMAL(5,4),
    average_response_time DECIMAL(8,2), -- in milliseconds
    language_usage JSONB NOT NULL DEFAULT '{}', -- {"en": 100, "ha": 50}
    intent_distribution JSONB NOT NULL DEFAULT '{}', -- {"transfer": 50, "balance": 30}
    user_satisfaction DECIMAL(3,2), -- Average rating 1-5
    escalation_rate DECIMAL(5,4), -- Percentage of conversations escalated to human
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI fraud detection analytics
CREATE TABLE ai_fraud_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    analysis_date DATE NOT NULL,
    total_assessments INTEGER NOT NULL DEFAULT 0,
    high_risk_count INTEGER NOT NULL DEFAULT 0,
    medium_risk_count INTEGER NOT NULL DEFAULT 0,
    low_risk_count INTEGER NOT NULL DEFAULT 0,
    false_positive_rate DECIMAL(5,4),
    false_negative_rate DECIMAL(5,4),
    model_accuracy DECIMAL(5,4),
    average_processing_time DECIMAL(8,2), -- in milliseconds
    blocked_transactions INTEGER NOT NULL DEFAULT 0,
    approved_transactions INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tenant audit logs
CREATE TABLE tenant_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL,
    operation VARCHAR(100) NOT NULL,
    user_id UUID,
    details JSONB NOT NULL DEFAULT '{}',
    ai_analysis JSONB, -- AI analysis of the audit event
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    compliance_flags TEXT[],
    ip_address INET,
    user_agent TEXT,
    request_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Platform configuration for AI services
CREATE TABLE platform_ai_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN DEFAULT false,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID
);

-- Insert default AI configuration
INSERT INTO platform_ai_config (config_key, config_value, description) VALUES
('openai_models', '{
    "gpt-4": {"max_tokens": 2000, "temperature": 0.7},
    "gpt-3.5-turbo": {"max_tokens": 1500, "temperature": 0.7}
}', 'OpenAI model configurations'),
('fraud_detection_thresholds', '{
    "low_sensitivity": {"critical": 85, "high": 70, "medium": 50},
    "medium_sensitivity": {"critical": 75, "high": 60, "medium": 40},
    "high_sensitivity": {"critical": 65, "high": 50, "medium": 30}
}', 'Fraud detection risk thresholds by sensitivity level'),
('nigerian_languages', '{
    "en": {"name": "English", "code": "en-NG"},
    "ha": {"name": "Hausa", "code": "ha-NG"},
    "yo": {"name": "Yoruba", "code": "yo-NG"},
    "ig": {"name": "Igbo", "code": "ig-NG"},
    "pid": {"name": "Nigerian Pidgin", "code": "pcm-NG"}
}', 'Supported Nigerian languages for AI processing');

-- Indexes for performance
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenant_billing_tenant_period ON tenant_billing(tenant_id, billing_period_start);
CREATE INDEX idx_tenant_usage_tenant_date ON tenant_usage_metrics(tenant_id, metric_date);
CREATE INDEX idx_ai_models_tenant_type ON ai_models(tenant_id, type);
CREATE INDEX idx_ai_conversation_tenant_date ON ai_conversation_analytics(tenant_id, conversation_date);
CREATE INDEX idx_ai_fraud_tenant_date ON ai_fraud_analytics(tenant_id, analysis_date);
CREATE INDEX idx_tenant_audit_tenant_service ON tenant_audit_logs(tenant_id, service_name);
CREATE INDEX idx_tenant_audit_created_at ON tenant_audit_logs(created_at);

-- Row Level Security policies
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_fraud_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for tenant isolation (to be used by application-level users)
-- Note: These would be customized based on your authentication system

-- Function to get current tenant ID from application context
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_tenant_id')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3.2 Tenant Database Template Schema

**database/tenant-template/tenant-schema.sql:**
```sql
-- Template schema for individual tenant databases
-- This will be applied to each tenant-specific database (e.g., tenant_bank_a_mt)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tenant-specific users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL, -- Reference to platform.tenants(id)
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'super_agent', 'agent', 'merchant')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    
    -- AI and behavioral data
    ai_preferences JSONB NOT NULL DEFAULT '{
        "assistant_enabled": true,
        "voice_commands": true,
        "language": "en",
        "privacy_level": "standard"
    }',
    behavioral_profile JSONB NOT NULL DEFAULT '{}',
    risk_profile VARCHAR(20) DEFAULT 'medium' CHECK (risk_profile IN ('low', 'medium', 'high')),
    
    -- Security and authentication
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    last_login_at TIMESTAMP,
    last_login_ip INET,
    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    mfa_secret VARCHAR(255),
    
    -- Profile information
    profile_data JSONB NOT NULL DEFAULT '{}',
    preferences JSONB NOT NULL DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    -- Ensure tenant isolation
    CONSTRAINT check_tenant_id CHECK (tenant_id IS NOT NULL)
);

-- User sessions for security tracking
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    refresh_token VARCHAR(255),
    device_info JSONB NOT NULL DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI-enhanced transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    reference VARCHAR(50) UNIQUE NOT NULL,
    external_reference VARCHAR(100),
    type VARCHAR(50) NOT NULL CHECK (type IN ('cash_withdrawal', 'money_transfer', 'bill_payment', 'airtime_purchase', 'balance_inquiry')),
    
    -- Transaction details
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    description TEXT,
    
    -- Recipient information (for transfers)
    recipient_name VARCHAR(255),
    recipient_account VARCHAR(50),
    recipient_bank VARCHAR(100),
    
    -- Status and processing
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'blocked')),
    processing_details JSONB NOT NULL DEFAULT '{}',
    failure_reason TEXT,
    
    -- AI-specific fields
    ai_initiated BOOLEAN NOT NULL DEFAULT false,
    voice_initiated BOOLEAN NOT NULL DEFAULT false,
    ai_confidence DECIMAL(5,4),
    natural_language_command TEXT,
    ai_processing_metadata JSONB DEFAULT '{}',
    
    -- Fraud detection
    fraud_score DECIMAL(5,2),
    fraud_factors JSONB DEFAULT '{}',
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Payment provider details
    payment_provider VARCHAR(50),
    provider_transaction_id VARCHAR(100),
    provider_response JSONB DEFAULT '{}',
    
    -- Fees and charges
    fees DECIMAL(15,2) NOT NULL DEFAULT 0,
    charges JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Ensure tenant isolation
    CONSTRAINT check_tenant_id CHECK (tenant_id IS NOT NULL),
    CONSTRAINT check_positive_amount CHECK (amount > 0)
);

-- User wallets/accounts
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    wallet_type VARCHAR(50) NOT NULL DEFAULT 'main' CHECK (wallet_type IN ('main', 'savings', 'business')),
    
    -- Balance information
    balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    available_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    reserved_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    
    -- AI-powered features
    ai_insights JSONB DEFAULT '{}',
    predicted_balance DECIMAL(15,2),
    balance_prediction_date DATE,
    spending_patterns JSONB DEFAULT '{}',
    
    -- Security
    is_active BOOLEAN NOT NULL DEFAULT true,
    daily_limit DECIMAL(15,2) DEFAULT 500000, -- ₦500,000 default
    monthly_limit DECIMAL(15,2) DEFAULT 5000000, -- ₦5,000,000 default
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_tenant_id CHECK (tenant_id IS NOT NULL),
    CONSTRAINT check_balance_positive CHECK (balance >= 0),
    UNIQUE(user_id, wallet_type)
);

-- AI conversation history (anonymized for model improvement)
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    
    -- Conversation metadata
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    message_count INTEGER NOT NULL DEFAULT 0,
    
    -- AI performance metrics
    average_confidence DECIMAL(5,4),
    total_processing_time DECIMAL(8,2), -- milliseconds
    successful_resolution BOOLEAN,
    user_satisfaction INTEGER CHECK (user_satisfaction BETWEEN 1 AND 5),
    escalated_to_human BOOLEAN NOT NULL DEFAULT false,
    
    -- Language and context
    primary_language VARCHAR(10) NOT NULL DEFAULT 'en',
    intents_identified TEXT[],
    entities_extracted JSONB DEFAULT '{}',
    
    -- No actual conversation content stored for privacy
    conversation_summary TEXT, -- AI-generated summary without PII
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fraud alerts and notifications
CREATE TABLE fraud_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    transaction_id UUID REFERENCES transactions(id),
    
    -- Alert details
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('high_risk', 'unusual_pattern', 'velocity_check', 'location_anomaly')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    risk_score DECIMAL(5,2) NOT NULL,
    
    -- AI analysis
    ai_analysis JSONB NOT NULL DEFAULT '{}',
    contributing_factors JSONB NOT NULL DEFAULT '{}',
    recommended_action VARCHAR(50) NOT NULL,
    
    -- Resolution
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id),
    resolution_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User behavioral patterns for AI learning
CREATE TABLE user_behavior_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Pattern data (aggregated, no specific transaction details)
    pattern_date DATE NOT NULL,
    transaction_velocity DECIMAL(8,4), -- transactions per hour
    average_transaction_amount DECIMAL(15,2),
    preferred_transaction_types TEXT[],
    active_hours INTEGER[], -- hours of day when most active (0-23)
    typical_locations JSONB DEFAULT '{}', -- approximate locations (city level only)
    
    -- Device and app usage patterns
    device_patterns JSONB DEFAULT '{}',
    app_usage_patterns JSONB DEFAULT '{}',
    
    -- AI model features (anonymized)
    feature_vector DECIMAL(8,6)[],
    anomaly_score DECIMAL(5,4),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, pattern_date)
);

-- Notifications and alerts
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification details
    type VARCHAR(50) NOT NULL CHECK (type IN ('transaction', 'security', 'ai_insight', 'fraud_alert', 'system')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- AI-generated content
    ai_generated BOOLEAN NOT NULL DEFAULT false,
    personalization_level VARCHAR(20) DEFAULT 'standard',
    
    -- Delivery
    channels TEXT[] NOT NULL DEFAULT ARRAY['in_app'],
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    
    -- Context
    related_transaction_id UUID REFERENCES transactions(id),
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX idx_users_tenant_phone ON users(tenant_id, phone_number);
CREATE INDEX idx_users_status ON users(status);

CREATE INDEX idx_transactions_tenant_user ON transactions(tenant_id, user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_reference ON transactions(reference);
CREATE INDEX idx_transactions_fraud_score ON transactions(fraud_score);

CREATE INDEX idx_wallets_user_tenant ON wallets(user_id, tenant_id);
CREATE INDEX idx_wallets_type ON wallets(wallet_type);

CREATE INDEX idx_ai_conversations_user_date ON ai_conversations(user_id, started_at);
CREATE INDEX idx_ai_conversations_session ON ai_conversations(session_id);

CREATE INDEX idx_fraud_alerts_user ON fraud_alerts(user_id);
CREATE INDEX idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX idx_fraud_alerts_severity ON fraud_alerts(severity);

CREATE INDEX idx_user_behavior_user_date ON user_behavior_patterns(user_id, pattern_date);

CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant isolation
CREATE POLICY tenant_isolation_users ON users
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY tenant_isolation_transactions ON transactions
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY tenant_isolation_wallets ON wallets
    USING (tenant_id = get_current_tenant_id());

-- Functions
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_tenant_id', true)::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update available balance based on reserved balance
    NEW.available_balance = NEW.balance - NEW.reserved_balance;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallet_balance_trigger BEFORE INSERT OR UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_wallet_balance();

-- Generate transaction reference
CREATE OR REPLACE FUNCTION generate_transaction_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reference IS NULL OR NEW.reference = '' THEN
        NEW.reference = 'TXN' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(NEXTVAL('transaction_ref_seq')::TEXT, 8, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE transaction_ref_seq START 1;
CREATE TRIGGER generate_transaction_reference_trigger BEFORE INSERT ON transactions FOR EACH ROW EXECUTE FUNCTION generate_transaction_reference();
```

This comprehensive implementation guide continues with tenant management systems, AI model serving, security implementation, and more. Would you like me to continue with the remaining sections of Book 2, or would you prefer to see Book 3 (Infrastructure and Operations) as well?