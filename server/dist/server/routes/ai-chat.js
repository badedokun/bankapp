"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = __importStar(require("express"));
const auth_1 = require("../middleware/auth");
const ConversationalAIService_1 = require("../services/ai-intelligence-service/core/ConversationalAIService");
const IntentClassificationService_1 = __importDefault(require("../services/ai-intelligence-service/nlp/IntentClassificationService"));
const EntityExtractionService_1 = __importDefault(require("../services/ai-intelligence-service/nlp/EntityExtractionService"));
const AIIntelligenceManager_1 = require("../services/ai-intelligence-service/AIIntelligenceManager");
const multi_tenant_database_1 = __importDefault(require("../config/multi-tenant-database"));
const DevelopmentControls_1 = require("../services/ai-intelligence-service/utils/DevelopmentControls");
const CustomerDataService_1 = require("../services/ai-intelligence-service/CustomerDataService");
const AIActionsService_1 = __importDefault(require("../services/ai-intelligence-service/AIActionsService"));
const ConversationalTransferService_1 = __importDefault(require("../services/ai-intelligence-service/ConversationalTransferService"));
const ConversationStateManager_1 = __importDefault(require("../services/ai-intelligence-service/ConversationStateManager"));
const router = express.Router();
// Initialize services
const aiService = new ConversationalAIService_1.ConversationalAIService();
const intentService = new IntentClassificationService_1.default();
const entityService = new EntityExtractionService_1.default();
const aiManager = new AIIntelligenceManager_1.AIIntelligenceManager({
    enableSmartSuggestions: process.env.ENABLE_SMART_SUGGESTIONS === 'true',
    enableAnalyticsInsights: process.env.ENABLE_ANALYTICS_INSIGHTS === 'true',
    enableContextualRecommendations: process.env.ENABLE_CONTEXTUAL_RECOMMENDATIONS === 'true',
    enablePredictiveText: false
});
// Initialize development controls
const devControls = DevelopmentControls_1.DevelopmentControls.getInstance();
// Helper function to enrich context with comprehensive real user banking data
async function enrichContextWithUserData(context, userId, tenantId) {
    try {
        // Get user profile data from tenant database
        const userResult = await multi_tenant_database_1.default.queryTenant(tenantId, 'SELECT id, email, first_name, last_name, role, kyc_level, created_at FROM tenant.users WHERE id = $1', [userId]);
        // Get account balance data from tenant database
        const balanceResult = await multi_tenant_database_1.default.queryTenant(tenantId, 'SELECT balance, currency, updated_at, created_at FROM tenant.wallets WHERE user_id = $1', [userId]);
        // Get recent transactions (last 30 for comprehensive analysis) from tenant database
        const transactionsResult = await multi_tenant_database_1.default.queryTenant(tenantId, `SELECT
        amount,
        type,
        description,
        created_at,
        status,
        reference
      FROM tenant.transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 30`, [userId]);
        // Get spending analytics (last 30 days) from tenant database
        const spendingAnalyticsResult = await multi_tenant_database_1.default.queryTenant(tenantId, `SELECT
        SUM(amount) as total_spent,
        COUNT(*) as transaction_count,
        AVG(amount) as avg_transaction,
        type
      FROM tenant.transactions
      WHERE user_id = $1
        AND created_at >= NOW() - INTERVAL '30 days'
        AND type IN ('money_transfer', 'bill_payment', 'cash_withdrawal', 'airtime_purchase')
        AND status = 'completed'
      GROUP BY type`, [userId]);
        // Get monthly spending by category/description from tenant database
        const categorySpendingResult = await multi_tenant_database_1.default.queryTenant(tenantId, `SELECT
        LOWER(description) as category,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count
      FROM tenant.transactions
      WHERE user_id = $1
        AND created_at >= NOW() - INTERVAL '30 days'
        AND amount > 0
        AND status = 'completed'
      GROUP BY LOWER(description)
      ORDER BY total_amount DESC
      LIMIT 10`, [userId]);
        // Calculate account insights
        const accountAge = userResult.rows[0] ?
            Math.floor((Date.now() - new Date(userResult.rows[0].created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;
        const currentBalance = balanceResult.rows[0]?.balance || 0;
        const totalSpent = spendingAnalyticsResult.rows.reduce((sum, row) => sum + parseFloat(row.total_spent || 0), 0);
        // Enrich the context with comprehensive real data
        const enrichedContext = {
            ...context,
            bankingContext: {
                ...context.bankingContext,
                // User Information
                user: userResult.rows[0] || null,
                accountAge,
                // Account Balance
                accountBalance: currentBalance,
                currency: balanceResult.rows[0]?.currency || 'NGN',
                // Transaction Data
                recentTransactions: transactionsResult.rows || [],
                totalTransactions: transactionsResult.rows.length,
                // Spending Analytics
                monthlySpending: {
                    totalSpent,
                    avgTransactionAmount: spendingAnalyticsResult.rows.length > 0 ?
                        spendingAnalyticsResult.rows.reduce((sum, row) => sum + parseFloat(row.avg_transaction || 0), 0) / spendingAnalyticsResult.rows.length : 0,
                    transactionCount: spendingAnalyticsResult.rows.reduce((sum, row) => sum + parseInt(row.transaction_count || 0), 0),
                    byType: spendingAnalyticsResult.rows
                },
                // Category Analysis
                topSpendingCategories: categorySpendingResult.rows,
                // Financial Health Indicators
                balanceToSpendingRatio: totalSpent > 0 ? currentBalance / totalSpent : null,
                avgDailySpend: totalSpent / 30,
                // Metadata
                lastUpdated: new Date().toISOString(),
                dataCompleteness: {
                    hasUserData: !!userResult.rows[0],
                    hasBalanceData: !!balanceResult.rows[0],
                    hasTransactionData: transactionsResult.rows.length > 0,
                    hasSpendingAnalytics: spendingAnalyticsResult.rows.length > 0
                }
            }
        };
        return enrichedContext;
    }
    catch (error) {
        console.error('❌ Failed to enrich context with user data:', error);
        // Return original context if enrichment fails
        return context;
    }
}
// Enhanced chat endpoint with full AI Intelligence features
router.post('/chat', auth_1.authenticateToken, async (req, res) => {
    try {
        const { message, context, options: _options = {} } = req.body;
        const userId = req.user?.id || 'anonymous';
        const tenantId = req.user?.tenantId || 'default';
        if (!message || !context) {
            return res.status(400).json({
                error: 'Message and context are required'
            });
        }
        // Generate conversation ID (use session ID or generate one)
        const conversationId = context.conversationId || context.sessionId || `conv_${Date.now()}`;
        // Check if user is in an active conversational flow
        const conversationState = ConversationStateManager_1.default.getState(userId, conversationId);
        if (conversationState.currentFlow === 'transfer') {
            // User is in middle of transfer flow - continue it
            const transferResponse = await ConversationalTransferService_1.default.processTransferConversation(message, userId, conversationId, tenantId);
            return res.json({
                response: transferResponse.message,
                confidence: 0.95,
                intent: 'transfer_money',
                suggestions: transferResponse.suggestions || [],
                data: transferResponse.data,
                inConversation: !transferResponse.completed,
                completed: transferResponse.completed,
                error: transferResponse.error,
                metadata: {
                    source: 'conversational_transfer',
                    conversationId,
                    step: conversationState.step
                }
            });
        }
        // Check if message is starting a new transfer
        const isTransferIntent = message.toLowerCase().includes('transfer') ||
            message.toLowerCase().includes('send money') ||
            (message.toLowerCase().includes('send') && message.toLowerCase().includes('₦'));
        if (isTransferIntent && userId !== 'anonymous') {
            // Start new conversational transfer flow
            const transferResponse = await ConversationalTransferService_1.default.processTransferConversation(message, userId, conversationId, tenantId);
            return res.json({
                response: transferResponse.message,
                confidence: 0.95,
                intent: 'transfer_money',
                suggestions: transferResponse.suggestions || [],
                data: transferResponse.data,
                inConversation: true,
                metadata: {
                    source: 'conversational_transfer',
                    conversationId,
                    step: 1
                }
            });
        }
        // Enrich context with real user banking data
        const enrichedContext = userId !== 'anonymous'
            ? await enrichContextWithUserData(context, userId, tenantId)
            : context;
        let response;
        // First, try to answer using real customer data (no mock mode)
        const customerDataResponse = await CustomerDataService_1.CustomerDataService.processQuery(message, userId, tenantId);
        if (!customerDataResponse.requiresOpenAI) {
            // Check if this is an actionable intent (transfer, bill payment, etc.)
            const queryType = CustomerDataService_1.CustomerDataService.classifyQuery(message);
            if (queryType === 'transfers' || queryType === 'bills') {
                // Handle actionable intents with AIActionsService
                const intentMap = {
                    'transfers': 'transfer_money',
                    'bills': 'bill_payment'
                };
                const actionResponse = await AIActionsService_1.default.processActionIntent(intentMap[queryType], userId, message, {});
                response = {
                    response: actionResponse.message,
                    confidence: 0.95,
                    intent: actionResponse.action,
                    suggestions: actionResponse.suggestions || [],
                    data: actionResponse.data,
                    action: {
                        type: actionResponse.action,
                        status: actionResponse.status,
                        nextStep: actionResponse.nextStep,
                        requiredFields: actionResponse.requiredFields
                    },
                    metadata: {
                        source: 'ai_actions',
                        reason: 'actionable_intent',
                        realData: true,
                        enrichedContext: true
                    }
                };
            }
            else {
                // Query answered with real customer data - no OpenAI needed
                response = {
                    response: customerDataResponse.answer,
                    confidence: 0.95,
                    intent: 'customer_data',
                    suggestions: customerDataResponse.suggestions || [],
                    data: customerDataResponse.data,
                    metadata: {
                        source: 'customer_data',
                        reason: 'customer_specific_query',
                        realData: true,
                        enrichedContext: true
                    }
                };
            }
        }
        else {
            // General banking question - use OpenAI
            if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'placeholder') {
                // No OpenAI configured
                return res.status(503).json({
                    error: 'AI service not available',
                    message: 'General banking questions require OpenAI configuration. Please contact support.',
                    suggestion: 'I can help you with account-specific questions like balance, transactions, and spending analysis.'
                });
            }
            try {
                // Use real OpenAI with real database data
                response = await aiManager.processEnhancedMessage(message, enrichedContext, {
                    includeSuggestions: true,
                    includeAnalytics: false
                });
                // Add metadata to show real data usage
                response.metadata = {
                    ...response.metadata,
                    source: 'openai',
                    realData: true,
                    enrichedContext: !!enrichedContext?.bankingContext?.user,
                    accountBalance: enrichedContext?.bankingContext?.accountBalance,
                    transactionCount: enrichedContext?.bankingContext?.recentTransactions?.length || 0
                };
            }
            catch (error) {
                // Fallback: Use Smart Suggestions Engine directly without OpenAI
                const smartSuggestions = await aiManager.getPersonalizedSuggestions(enrichedContext);
                const analyticsInsights = await aiManager.getAnalyticsInsights(enrichedContext);
                // Generate a contextual response based on the message intent
                let contextualResponse = "I can help you with your banking needs. Here are some personalized suggestions based on your account activity:";
                if (message.toLowerCase().includes('investment') || message.toLowerCase().includes('invest')) {
                    contextualResponse = "Based on your account balance, here are some investment options and financial suggestions for you:";
                }
                else if (message.toLowerCase().includes('spending') || message.toLowerCase().includes('pattern')) {
                    contextualResponse = "I've analyzed your spending patterns. Here are insights and suggestions to optimize your finances:";
                }
                else if (message.toLowerCase().includes('saving') || message.toLowerCase().includes('save')) {
                    contextualResponse = "Here are some smart saving options tailored to your financial profile:";
                }
                else if (message.toLowerCase().includes('budget') || message.toLowerCase().includes('money')) {
                    contextualResponse = "Let me help you manage your finances better with these personalized recommendations:";
                }
                else if (message.toLowerCase().includes('balance') || message.toLowerCase().includes('account')) {
                    contextualResponse = "Here's what you can do with your account and some smart suggestions:";
                }
                else if (message.toLowerCase().includes('analyze') || message.toLowerCase().includes('insight')) {
                    contextualResponse = "Here's an analysis of your financial data with actionable insights:";
                }
                response = {
                    response: contextualResponse,
                    suggestions: smartSuggestions,
                    insights: analyticsInsights,
                    confidence: 0.85,
                    metadata: {
                        source: 'smart-suggestions-engine',
                        reason: 'openai_quota_exceeded',
                        realData: true,
                        enrichedContext: !!enrichedContext?.bankingContext?.user,
                        accountBalance: enrichedContext?.bankingContext?.accountBalance,
                        transactionCount: enrichedContext?.bankingContext?.recentTransactions?.length || 0,
                        smartSuggestionsCount: smartSuggestions?.length || 0,
                        analyticsInsightsCount: analyticsInsights?.length || 0
                    }
                };
            }
        }
        // Record the request for usage tracking
        devControls.recordRequest(userId);
        devControls.logUsageInfo(userId, 'chat', message.length + (response.response?.length || 0));
        return res.json(response);
    }
    catch (error) {
        console.error('AI Chat Error:', error);
        return res.status(500).json({
            error: 'Failed to process AI chat request',
            message: "I'm sorry, I'm having trouble understanding your request right now. Please try again."
        });
    }
});
// Legacy chat endpoint (backwards compatibility)
router.post('/chat/basic', auth_1.authenticateToken, async (req, res) => {
    try {
        const { message, context } = req.body;
        if (!message || !context) {
            return res.status(400).json({
                error: 'Message and context are required'
            });
        }
        const response = await aiService.processMessage(message, context);
        return res.json(response);
    }
    catch (error) {
        console.error('AI Chat Error:', error);
        return res.status(500).json({
            error: 'Failed to process AI chat request',
            message: "I'm sorry, I'm having trouble understanding your request right now. Please try again."
        });
    }
});
router.post('/voice', auth_1.authenticateToken, async (req, res) => {
    try {
        const { audioData, context } = req.body;
        if (!audioData || !context) {
            return res.status(400).json({
                error: 'Audio data and context are required'
            });
        }
        const audioBuffer = Buffer.from(audioData, 'base64');
        const response = await aiService.processVoiceCommand(audioBuffer, context);
        return res.json(response);
    }
    catch (error) {
        console.error('AI Voice Error:', error);
        return res.status(500).json({
            error: 'Failed to process voice command',
            message: "I couldn't understand the voice command. Please try speaking again."
        });
    }
});
router.post('/intent', auth_1.authenticateToken, async (req, res) => {
    try {
        const { text, context } = req.body;
        if (!text) {
            return res.status(400).json({
                error: 'Text is required'
            });
        }
        const intent = await intentService.classifyIntent(text, context);
        return res.json(intent);
    }
    catch (error) {
        console.error('Intent Classification Error:', error);
        return res.status(500).json({
            error: 'Failed to classify intent'
        });
    }
});
router.post('/entities', auth_1.authenticateToken, async (req, res) => {
    try {
        const { text, context } = req.body;
        if (!text) {
            return res.status(400).json({
                error: 'Text is required'
            });
        }
        const result = await entityService.extractEntities(text, context);
        return res.json(result);
    }
    catch (error) {
        console.error('Entity Extraction Error:', error);
        return res.status(500).json({
            error: 'Failed to extract entities'
        });
    }
});
router.get('/suggestions', auth_1.authenticateToken, async (req, res) => {
    try {
        const { context } = req.query;
        const contextObj = context ? JSON.parse(context) : {
            userId: req.user?.id || 'anonymous',
            tenantId: 'default',
            conversationId: 'suggestions',
            language: 'en',
            bankingContext: {}
        };
        const suggestions = await aiService.generateSuggestions(contextObj);
        return res.json({ suggestions });
    }
    catch (error) {
        console.error('AI Suggestions Error:', error);
        return res.status(500).json({
            error: 'Failed to generate suggestions',
            suggestions: [
                "Check my account balance",
                "Send money to someone",
                "Show recent transactions",
                "Pay bills",
                "How can you help me?"
            ]
        });
    }
});
router.post('/suggestions/personalized', auth_1.authenticateToken, async (req, res) => {
    try {
        const { category, maxSuggestions = 5, language = 'en', accountBalance, recentTransactions = [], timeOfDay, excludeActionTypes = [] } = req.body;
        const userContext = {
            userId: req.user?.id || 'anonymous',
            tenantId: req.user?.tenantId || 'default',
            language,
            accountBalance: accountBalance || 0,
            recentTransactions,
            lastLoginTime: new Date(),
            behaviorPattern: {}
        };
        const suggestionRequest = {
            context: userContext,
            category,
            maxSuggestions,
            excludeActionTypes,
            includePersonalized: true,
            timeOfDay
        };
        const { SmartSuggestionsEngine } = await Promise.resolve().then(() => __importStar(require('../services/ai-intelligence-service/engines/SmartSuggestionsEngine')));
        const suggestions = await SmartSuggestionsEngine.getPersonalizedSuggestions(suggestionRequest);
        return res.json({
            suggestions,
            metadata: {
                personalized: true,
                category: category || 'all',
                language,
                timeOfDay,
                context: 'personalized_suggestions'
            }
        });
    }
    catch (error) {
        console.error('Personalized Suggestions Error:', error);
        return res.status(500).json({
            error: 'Failed to generate personalized suggestions',
            suggestions: [
                { text: "Check your account balance", confidence: 0.8, relevanceScore: 0.7 },
                { text: "Send money to contacts", confidence: 0.7, relevanceScore: 0.6 },
                { text: "View transaction history", confidence: 0.6, relevanceScore: 0.5 }
            ]
        });
    }
});
router.get('/intent-suggestions', auth_1.authenticateToken, async (req, res) => {
    try {
        const { partialText } = req.query;
        if (!partialText) {
            return res.json({
                suggestions: [
                    "Check my balance",
                    "Send money",
                    "Recent transactions",
                    "Pay bills",
                    "Help"
                ]
            });
        }
        const suggestions = await intentService.getIntentSuggestions(partialText);
        return res.json({ suggestions });
    }
    catch (error) {
        console.error('Intent Suggestions Error:', error);
        return res.status(500).json({
            error: 'Failed to get intent suggestions',
            suggestions: []
        });
    }
});
router.get('/entity-types', auth_1.authenticateToken, async (_req, res) => {
    try {
        const entityTypes = entityService.getEntityTypes();
        return res.json({ entityTypes });
    }
    catch (error) {
        console.error('Entity Types Error:', error);
        return res.status(500).json({
            error: 'Failed to get entity types',
            entityTypes: []
        });
    }
});
router.post('/validate-entities', auth_1.authenticateToken, async (req, res) => {
    try {
        const { entities, context } = req.body;
        if (!entities || !Array.isArray(entities)) {
            return res.status(400).json({
                error: 'Entities array is required'
            });
        }
        const validatedEntities = await entityService.validateExtractedEntities(entities, context);
        return res.json({ entities: validatedEntities });
    }
    catch (error) {
        console.error('Entity Validation Error:', error);
        return res.status(500).json({
            error: 'Failed to validate entities'
        });
    }
});
// Enhanced AI Intelligence endpoints
router.get('/suggestions/smart', auth_1.authenticateToken, async (req, res) => {
    try {
        const { context, category, limit = 5 } = req.query;
        const userId = req.user?.id || 'anonymous';
        const tenantId = req.user?.tenantId || 'default';
        // Smart Suggestions Engine works locally without OpenAI - no rate limiting needed
        let contextObj = context ? JSON.parse(context) : {
            userId: userId,
            tenantId: 'default',
            conversationId: 'smart-suggestions',
            language: 'en',
            bankingContext: {}
        };
        // Enrich context with real user banking data
        if (userId !== 'anonymous') {
            contextObj = await enrichContextWithUserData(contextObj, userId, tenantId);
        }
        // Always use real customer data from AIIntelligenceManager
        const suggestions = await aiManager.getPersonalizedSuggestions(contextObj, category, parseInt(limit));
        // Record the request
        devControls.recordRequest(userId);
        devControls.logUsageInfo(userId, 'smart-suggestions', JSON.stringify(suggestions).length);
        return res.json({ suggestions });
    }
    catch (error) {
        console.error('Smart Suggestions Error:', error);
        return res.status(500).json({
            error: 'Failed to generate smart suggestions',
            suggestions: []
        });
    }
});
router.get('/analytics/insights', auth_1.authenticateToken, async (req, res) => {
    try {
        const { context, type, timeframe = 'month' } = req.query;
        const userId = req.user?.id;
        const tenantId = req.user?.tenantId || 'default';
        let contextObj = context ? JSON.parse(context) : {
            userId: userId || 'anonymous',
            tenantId: 'default',
            conversationId: 'analytics',
            language: 'en',
            bankingContext: {}
        };
        // Enrich context with real user banking data
        if (userId) {
            contextObj = await enrichContextWithUserData(contextObj, userId, tenantId);
        }
        // Always use real customer data from AIIntelligenceManager
        const insights = await aiManager.getAnalyticsInsights(contextObj, type, timeframe);
        return res.json({ insights });
    }
    catch (error) {
        console.error('Analytics Insights Error:', error);
        return res.status(500).json({
            error: 'Failed to generate analytics insights',
            insights: []
        });
    }
});
router.post('/translate', auth_1.authenticateToken, async (req, res) => {
    try {
        const { text, sourceLanguage, targetLanguage, context = 'banking' } = req.body;
        if (!text || !sourceLanguage || !targetLanguage) {
            return res.status(400).json({
                error: 'Text, source language, and target language are required'
            });
        }
        const result = await aiManager.translateMessage(text, sourceLanguage, targetLanguage, context);
        return res.json(result);
    }
    catch (error) {
        console.error('Translation Error:', error);
        return res.status(500).json({
            error: 'Failed to translate text',
            translatedText: req.body.text,
            confidence: 0.1
        });
    }
});
router.get('/suggestions/localized', auth_1.authenticateToken, async (req, res) => {
    try {
        const { language = 'en', type = 'banking' } = req.query;
        const suggestions = await aiManager.getLocalizedSuggestions(language, type);
        return res.json({ suggestions });
    }
    catch (error) {
        console.error('Localized Suggestions Error:', error);
        return res.status(500).json({
            error: 'Failed to get localized suggestions',
            suggestions: []
        });
    }
});
router.get('/languages', (_req, res) => {
    try {
        const languages = aiManager.getSupportedLanguages();
        return res.json({ languages });
    }
    catch (error) {
        console.error('Languages Error:', error);
        return res.status(500).json({
            error: 'Failed to get supported languages',
            languages: []
        });
    }
});
router.post('/suggestions/mark-used', auth_1.authenticateToken, async (req, res) => {
    try {
        const { suggestionId } = req.body;
        const userId = req.user?.id;
        if (!suggestionId || !userId) {
            return res.status(400).json({
                error: 'Suggestion ID and user ID are required'
            });
        }
        await aiManager.markSuggestionAsUsed(suggestionId, userId);
        return res.json({ success: true });
    }
    catch (error) {
        console.error('Mark Suggestion Used Error:', error);
        return res.status(500).json({
            error: 'Failed to mark suggestion as used'
        });
    }
});
router.post('/suggestions/mark-dismissed', auth_1.authenticateToken, async (req, res) => {
    try {
        const { suggestionId } = req.body;
        const userId = req.user?.id;
        if (!suggestionId || !userId) {
            return res.status(400).json({
                error: 'Suggestion ID and user ID are required'
            });
        }
        await aiManager.markSuggestionAsDismissed(suggestionId, userId);
        return res.json({ success: true });
    }
    catch (error) {
        console.error('Mark Suggestion Dismissed Error:', error);
        return res.status(500).json({
            error: 'Failed to mark suggestion as dismissed'
        });
    }
});
router.get('/analytics/export', auth_1.authenticateToken, async (req, res) => {
    try {
        const { format = 'json' } = req.query;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(400).json({
                error: 'User ID is required'
            });
        }
        const report = await aiManager.exportAnalyticsReport(userId, format);
        res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
        return res.json(report.data);
    }
    catch (error) {
        console.error('Analytics Export Error:', error);
        return res.status(500).json({
            error: 'Failed to export analytics report'
        });
    }
});
router.get('/health', async (_req, res) => {
    try {
        const serviceHealth = await aiManager.performHealthCheck();
        const performanceMetrics = aiManager.getPerformanceMetrics();
        return res.json({
            status: serviceHealth.overall,
            services: serviceHealth.services,
            performance: performanceMetrics,
            lastHealthCheck: serviceHealth.lastHealthCheck,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Health Check Error:', error);
        return res.status(500).json({
            status: 'down',
            error: 'Health check failed',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/config', auth_1.authenticateToken, async (_req, res) => {
    try {
        const configuration = aiManager.getConfiguration();
        return res.json({ configuration });
    }
    catch (error) {
        console.error('Configuration Error:', error);
        return res.status(500).json({
            error: 'Failed to get AI configuration'
        });
    }
});
// Development usage stats endpoint
router.get('/dev/usage', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id || 'anonymous';
        const usageStats = devControls.getUsageStats(userId);
        return res.json({
            developmentMode: devControls.isDevelopmentMode(),
            useMockResponses: devControls.shouldUseMockResponses(),
            usageStats,
            configuration: {
                maxDailyRequests: process.env.AI_MAX_DAILY_REQUESTS || '100',
                maxHourlyRequests: process.env.AI_RATE_LIMIT_MAX_REQUESTS || '10',
                openaiApiKeyStatus: process.env.OPENAI_API_KEY?.includes('placeholder') ? 'placeholder' : 'configured'
            }
        });
    }
    catch (error) {
        console.error('Development Usage Stats Error:', error);
        return res.status(500).json({
            error: 'Failed to get development usage stats'
        });
    }
});
// Development controls endpoint (reset usage for testing)
router.post('/dev/reset-usage', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id || 'anonymous';
        const { resetAll = false } = req.body;
        if (resetAll && devControls.isDevelopmentMode()) {
            devControls.resetUsageStats();
            return res.json({ message: 'All usage stats reset', resetAll: true });
        }
        else {
            devControls.resetUsageStats(userId);
            return res.json({ message: `Usage stats reset for user ${userId}`, userId });
        }
    }
    catch (error) {
        console.error('Reset Usage Stats Error:', error);
        return res.status(500).json({
            error: 'Failed to reset usage stats'
        });
    }
});
exports.default = router;
//# sourceMappingURL=ai-chat.js.map