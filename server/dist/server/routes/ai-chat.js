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
const database_1 = require("../config/database");
const DevelopmentControls_1 = require("../services/ai-intelligence-service/utils/DevelopmentControls");
const MockResponses_1 = require("../services/ai-intelligence-service/utils/MockResponses");
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
async function enrichContextWithUserData(context, userId) {
    try {
        // Get user profile data
        const userResult = await (0, database_1.query)('SELECT id, email, first_name, last_name, role, kyc_level, created_at FROM tenant.users WHERE id = $1', [userId]);
        // Get account balance data
        const balanceResult = await (0, database_1.query)('SELECT balance, currency, updated_at, created_at FROM tenant.wallets WHERE user_id = $1', [userId]);
        // Get recent transactions (last 20 for better analysis)
        const transactionsResult = await (0, database_1.query)(`SELECT
        amount,
        type,
        description,
        created_at,
        status,
        reference
      FROM transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20`, [userId]);
        // Get spending analytics (last 30 days)
        const spendingAnalyticsResult = await (0, database_1.query)(`SELECT
        SUM(amount) as total_spent,
        COUNT(*) as transaction_count,
        AVG(amount) as avg_transaction,
        type
      FROM transactions
      WHERE user_id = $1
        AND created_at >= NOW() - INTERVAL '30 days'
        AND type IN ('debit', 'withdrawal', 'transfer')
        AND status = 'completed'
      GROUP BY type`, [userId]);
        // Get monthly spending by category/description
        const categorySpendingResult = await (0, database_1.query)(`SELECT
        LOWER(description) as category,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count
      FROM transactions
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
        const avgMonthlySpend = totalSpent;
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
        console.log('📊 Context enriched with comprehensive banking data:', {
            userId,
            accountBalance: currentBalance,
            transactionCount: transactionsResult.rows.length,
            monthlySpend: totalSpent,
            topCategory: categorySpendingResult.rows[0]?.category || 'none',
            dataQuality: 'comprehensive'
        });
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
        const { message, context, options = {} } = req.body;
        const userId = req.user?.id || 'anonymous';
        if (!message || !context) {
            return res.status(400).json({
                error: 'Message and context are required'
            });
        }
        // Ensure smart suggestions are enabled by default for enhanced experience
        const enhancedOptions = {
            includeSuggestions: true,
            includeAnalytics: false, // Keep analytics optional for performance
            ...options
        };
        // Identify data analysis queries that should use Smart Suggestions Engine directly
        const isDataAnalysisQuery = ((message.toLowerCase().includes('spending') && message.toLowerCase().includes('pattern')) ||
            message.toLowerCase().includes('analyze') ||
            (message.toLowerCase().includes('boost') && message.toLowerCase().includes('fund')) ||
            message.toLowerCase().includes('save money') ||
            message.toLowerCase().includes('investment') ||
            message.toLowerCase().includes('budget') ||
            message.toLowerCase().includes('insight') ||
            message.toLowerCase().includes('finance') ||
            (message.toLowerCase().includes('what') && (message.toLowerCase().includes('spend') || message.toLowerCase().includes('save'))) ||
            message.toLowerCase().includes('emergency fund') ||
            message.toLowerCase().includes('money management'));
        // Debug logging
        console.log(`🔍 Query: "${message}"`);
        console.log(`🔍 Data Analysis Query Detected: ${isDataAnalysisQuery}`);
        // Enrich context with real user banking data
        const enrichedContext = userId !== 'anonymous'
            ? await enrichContextWithUserData(context, userId)
            : context;
        // For data analysis queries, use Smart Suggestions Engine directly (bypass rate limits and OpenAI)
        if (isDataAnalysisQuery) {
            console.log('🧠 Data Analysis Query detected - using Smart Suggestions Engine directly');
            try {
                const smartSuggestions = await aiManager.getPersonalizedSuggestions(enrichedContext);
                const analyticsInsights = await aiManager.getAnalyticsInsights(enrichedContext);
                // Generate contextual response based on the specific query type
                let contextualResponse = "I've analyzed your transaction data and financial patterns. Here are personalized insights based on your banking activity:";
                if (message.toLowerCase().includes('spending') && message.toLowerCase().includes('pattern')) {
                    contextualResponse = "Based on your transaction history, I've identified your spending patterns. Here's what the data shows:";
                }
                else if (message.toLowerCase().includes('boost') && message.toLowerCase().includes('fund')) {
                    contextualResponse = "I've analyzed your financial situation for emergency fund optimization. Here are tailored recommendations:";
                }
                else if (message.toLowerCase().includes('save money')) {
                    contextualResponse = "After analyzing your spending patterns, here are specific areas where you can save money:";
                }
                else if (message.toLowerCase().includes('investment')) {
                    contextualResponse = "Based on your account balance and spending patterns, here are investment options suitable for your profile:";
                }
                else if (message.toLowerCase().includes('analyze')) {
                    contextualResponse = "Here's a comprehensive analysis of your financial data with actionable insights:";
                }
                const response = {
                    response: contextualResponse,
                    suggestions: smartSuggestions,
                    insights: analyticsInsights,
                    confidence: 0.95,
                    metadata: {
                        source: 'smart-suggestions-engine',
                        reason: 'data_analysis_query',
                        realData: true,
                        enrichedContext: !!enrichedContext?.bankingContext?.user,
                        accountBalance: enrichedContext?.bankingContext?.accountBalance,
                        transactionCount: enrichedContext?.bankingContext?.recentTransactions?.length || 0,
                        processingTime: Date.now()
                    }
                };
                // Record usage for analytics (placeholder for future implementation)
                return res.json(response);
            }
            catch (error) {
                console.error('Smart Suggestions Engine error:', error);
                return res.status(500).json({
                    error: 'Unable to analyze your data at the moment',
                    message: 'Please try again later'
                });
            }
        }
        // For non-data-analysis queries, check rate limits before using OpenAI
        if (!isDataAnalysisQuery) {
            const rateCheck = devControls.checkRateLimit(userId);
            if (!rateCheck.allowed) {
                return res.status(429).json({
                    error: 'Rate limit exceeded',
                    message: rateCheck.reason,
                    resetTime: rateCheck.resetTime,
                    usageStats: devControls.getUsageStats(userId)
                });
            }
        }
        let response;
        // Always use real OpenAI with real data (unless API key is placeholder)
        if (process.env.OPENAI_API_KEY?.includes('placeholder')) {
            console.log('⚠️ OpenAI API key is placeholder - using mock responses');
            const mockResponse = MockResponses_1.MockAIResponseGenerator.generateConversationalResponse(message, enrichedContext);
            response = {
                response: mockResponse.response,
                confidence: mockResponse.confidence,
                intent: mockResponse.intent,
                entities: mockResponse.entities,
                suggestions: mockResponse.suggestions,
                metadata: {
                    source: 'mock',
                    reason: 'placeholder_api_key',
                    enrichedContext: !!enrichedContext?.bankingContext?.user
                }
            };
        }
        else {
            try {
                // Use real OpenAI with real database data
                console.log('🤖 Using real OpenAI with enriched banking data and Smart Suggestions');
                response = await aiManager.processEnhancedMessage(message, enrichedContext, enhancedOptions);
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
                console.log('❌ OpenAI failed, using Smart Suggestions Engine only:', error.message);
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
        res.json(response);
    }
    catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({
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
        res.json(response);
    }
    catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({
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
        res.json(response);
    }
    catch (error) {
        console.error('AI Voice Error:', error);
        res.status(500).json({
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
        res.json(intent);
    }
    catch (error) {
        console.error('Intent Classification Error:', error);
        res.status(500).json({
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
        res.json(result);
    }
    catch (error) {
        console.error('Entity Extraction Error:', error);
        res.status(500).json({
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
        res.json({ suggestions });
    }
    catch (error) {
        console.error('AI Suggestions Error:', error);
        res.status(500).json({
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
        res.json({
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
        res.status(500).json({
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
        res.json({ suggestions });
    }
    catch (error) {
        console.error('Intent Suggestions Error:', error);
        res.status(500).json({
            error: 'Failed to get intent suggestions',
            suggestions: []
        });
    }
});
router.get('/entity-types', auth_1.authenticateToken, async (req, res) => {
    try {
        const entityTypes = entityService.getEntityTypes();
        res.json({ entityTypes });
    }
    catch (error) {
        console.error('Entity Types Error:', error);
        res.status(500).json({
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
        res.json({ entities: validatedEntities });
    }
    catch (error) {
        console.error('Entity Validation Error:', error);
        res.status(500).json({
            error: 'Failed to validate entities'
        });
    }
});
// Enhanced AI Intelligence endpoints
router.get('/suggestions/smart', auth_1.authenticateToken, async (req, res) => {
    try {
        const { context, category, limit = 5 } = req.query;
        const userId = req.user?.id || 'anonymous';
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
            contextObj = await enrichContextWithUserData(contextObj, userId);
        }
        let suggestions;
        // Always use real data unless API key is placeholder
        if (process.env.OPENAI_API_KEY?.includes('placeholder')) {
            console.log('⚠️ OpenAI API key is placeholder - using mock smart suggestions');
            suggestions = MockResponses_1.MockAIResponseGenerator.generateSmartSuggestions(category || 'financial', parseInt(limit));
        }
        else {
            console.log('🤖 Generating smart suggestions with real banking data');
            suggestions = await aiManager.getPersonalizedSuggestions(contextObj, category, parseInt(limit));
        }
        // Record the request
        devControls.recordRequest(userId);
        devControls.logUsageInfo(userId, 'smart-suggestions', JSON.stringify(suggestions).length);
        res.json({ suggestions });
    }
    catch (error) {
        console.error('Smart Suggestions Error:', error);
        res.status(500).json({
            error: 'Failed to generate smart suggestions',
            suggestions: []
        });
    }
});
router.get('/analytics/insights', auth_1.authenticateToken, async (req, res) => {
    try {
        const { context, type, timeframe = 'month' } = req.query;
        const userId = req.user?.id;
        let contextObj = context ? JSON.parse(context) : {
            userId: userId || 'anonymous',
            tenantId: 'default',
            conversationId: 'analytics',
            language: 'en',
            bankingContext: {}
        };
        // Enrich context with real user banking data
        if (userId) {
            contextObj = await enrichContextWithUserData(contextObj, userId);
        }
        let insights;
        // Always use real data unless API key is placeholder
        if (process.env.OPENAI_API_KEY?.includes('placeholder')) {
            console.log('⚠️ OpenAI API key is placeholder - using mock analytics insights');
            insights = MockResponses_1.MockAIResponseGenerator.generateAnalyticsInsights(type || 'spending', timeframe || 'month');
        }
        else {
            console.log('🤖 Generating analytics insights with real banking data');
            insights = await aiManager.getAnalyticsInsights(contextObj, type, timeframe);
        }
        res.json({ insights });
    }
    catch (error) {
        console.error('Analytics Insights Error:', error);
        res.status(500).json({
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
        res.json(result);
    }
    catch (error) {
        console.error('Translation Error:', error);
        res.status(500).json({
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
        res.json({ suggestions });
    }
    catch (error) {
        console.error('Localized Suggestions Error:', error);
        res.status(500).json({
            error: 'Failed to get localized suggestions',
            suggestions: []
        });
    }
});
router.get('/languages', (req, res) => {
    try {
        const languages = aiManager.getSupportedLanguages();
        res.json({ languages });
    }
    catch (error) {
        console.error('Languages Error:', error);
        res.status(500).json({
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
        res.json({ success: true });
    }
    catch (error) {
        console.error('Mark Suggestion Used Error:', error);
        res.status(500).json({
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
        res.json({ success: true });
    }
    catch (error) {
        console.error('Mark Suggestion Dismissed Error:', error);
        res.status(500).json({
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
        res.json(report.data);
    }
    catch (error) {
        console.error('Analytics Export Error:', error);
        res.status(500).json({
            error: 'Failed to export analytics report'
        });
    }
});
router.get('/health', async (req, res) => {
    try {
        const serviceHealth = await aiManager.performHealthCheck();
        const performanceMetrics = aiManager.getPerformanceMetrics();
        res.json({
            status: serviceHealth.overall,
            services: serviceHealth.services,
            performance: performanceMetrics,
            lastHealthCheck: serviceHealth.lastHealthCheck,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Health Check Error:', error);
        res.status(500).json({
            status: 'down',
            error: 'Health check failed',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/config', auth_1.authenticateToken, async (req, res) => {
    try {
        const configuration = aiManager.getConfiguration();
        res.json({ configuration });
    }
    catch (error) {
        console.error('Configuration Error:', error);
        res.status(500).json({
            error: 'Failed to get AI configuration'
        });
    }
});
// Development usage stats endpoint
router.get('/dev/usage', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id || 'anonymous';
        const usageStats = devControls.getUsageStats(userId);
        res.json({
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
        res.status(500).json({
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
            res.json({ message: 'All usage stats reset', resetAll: true });
        }
        else {
            devControls.resetUsageStats(userId);
            res.json({ message: `Usage stats reset for user ${userId}`, userId });
        }
    }
    catch (error) {
        console.error('Reset Usage Stats Error:', error);
        res.status(500).json({
            error: 'Failed to reset usage stats'
        });
    }
});
exports.default = router;
//# sourceMappingURL=ai-chat.js.map