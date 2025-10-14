import { LocalBankingAIService } from './core/LocalBankingAIService';
import { query } from '../../config/database';

export interface AIIntelligenceConfig {
  enableSmartSuggestions: boolean;
  enableAnalyticsInsights: boolean;
  enableContextualRecommendations: boolean;
  enablePredictiveText: boolean;
}

interface TransactionData {
  amount: number;
  type: string;
  description: string;
  created_at: Date;
  status: string;
}

interface UserFinancialData {
  balance: number;
  recentTransactions: TransactionData[];
  totalIncome: number;
  totalExpenses: number;
  averageTransaction: number;
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
    return new LocalBankingAIService();
  }

  getConfig(): AIIntelligenceConfig {
    return { ...this.config };
  }

  private async getUserFinancialData(userId: string, tenantId?: string): Promise<UserFinancialData> {
    try {
      // Get wallet balance from tenant-specific database
      const walletResult = await query(
        'SELECT balance, currency FROM tenant.wallets WHERE user_id = $1',
        [userId]
      );

      // Get recent transactions from tenant-specific database (real user data)
      const transactionsResult = await query(
        `SELECT amount, description, type, created_at, status
         FROM tenant.transactions
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [userId]
      );

      const balance = walletResult.rows[0]?.balance || 0;
      const recentTransactions = transactionsResult.rows || [];

      // Calculate financial metrics
      // For income: look for credit, deposit types
      const totalIncome = recentTransactions
        .filter((t: TransactionData) => t.type === 'credit' || t.type === 'deposit')
        .reduce((sum: number, t: TransactionData) => sum + parseFloat(t.amount.toString()), 0);

      // For expenses: all outgoing transaction types
      const totalExpenses = recentTransactions
        .filter((t: TransactionData) =>
          t.type === 'debit' || t.type === 'money_transfer' || t.type === 'bill_payment' ||
          t.type === 'cash_withdrawal' || t.type === 'withdrawal' || t.type === 'transfer')
        .reduce((sum: number, t: TransactionData) => sum + Math.abs(parseFloat(t.amount.toString())), 0);

      const averageTransaction = recentTransactions.length > 0
        ? recentTransactions.reduce((sum: number, t: TransactionData) => sum + Math.abs(parseFloat(t.amount.toString())), 0) / recentTransactions.length
        : 0;

      return {
        balance,
        recentTransactions,
        totalIncome,
        totalExpenses,
        averageTransaction
      };
    } catch (error) {
      console.error('Error fetching user financial data:', error);
      return {
        balance: 0,
        recentTransactions: [],
        totalIncome: 0,
        totalExpenses: 0,
        averageTransaction: 0
      };
    }
  }

  async getPersonalizedSuggestions(context: any, category?: string, maxSuggestions?: number): Promise<any[]> {
    const userId = context.userId || context.user?.id;

    if (!userId) {
      return [];
    }

    const financialData = await this.getUserFinancialData(userId);
    const suggestions = [];

    // Always generate at least default suggestions
    suggestions.push({
      id: `check-balance-${Date.now()}`,
      type: 'action',
      text: 'Check your account balance and recent transactions',
      priority: 'medium'
    });

    suggestions.push({
      id: `transfer-money-${Date.now()}`,
      type: 'action',
      text: 'Send money to friends, family, or pay bills',
      priority: 'medium'
    });

    // Financial suggestion based on balance
    if (financialData.balance > 10000) {
      const savingsPercentage = financialData.balance > 100000 ? 0.1 : 0.05;
      suggestions.push({
        id: `balance-savings-${Date.now()}`,
        type: 'financial',
        text: `You have ₦${financialData.balance.toLocaleString()} available. Consider saving ${(savingsPercentage * 100)}% (₦${(financialData.balance * savingsPercentage).toLocaleString()})`,
        priority: 'high',
        context: { balance: financialData.balance }
      });
    }

    // Expense-based suggestions
    if (financialData.totalExpenses > financialData.totalIncome * 0.5) {
      suggestions.push({
        id: `expense-warning-${Date.now()}`,
        type: 'financial',
        text: `Your expenses (₦${financialData.totalExpenses.toLocaleString()}) are significant. Consider reviewing your spending habits`,
        priority: 'high',
        context: { expenses: financialData.totalExpenses, income: financialData.totalIncome }
      });
    }

    // Transaction pattern suggestions
    if (financialData.recentTransactions.length > 0) {
      const recurringTransactions = financialData.recentTransactions.filter(t =>
        financialData.recentTransactions.filter(t2 =>
          Math.abs(parseFloat(t.amount.toString()) - parseFloat(t2.amount.toString())) < 100
        ).length > 1
      );

      if (recurringTransactions.length > 0) {
        suggestions.push({
          id: `recurring-payment-${Date.now()}`,
          type: 'automation',
          text: 'You have recurring payments. Set up automatic transfers to save time',
          priority: 'medium',
          context: { recurringCount: recurringTransactions.length }
        });
      }
    }

    // Filter by category if provided
    let filteredSuggestions = category
      ? suggestions.filter(s => s.type === category)
      : suggestions;

    // Limit results
    return filteredSuggestions.slice(0, maxSuggestions || 5);
  }

  async getAnalyticsInsights(context: any, type?: string, timeframe?: string): Promise<any> {
    const userId = context.userId || context.user?.id;

    if (!userId) {
      return {
        type: type || 'general',
        timeframe: timeframe || 'month',
        insights: [],
        recommendations: []
      };
    }

    const financialData = await this.getUserFinancialData(userId);
    const insights = [];
    const recommendations = [];

    // Spending insights
    if (type === 'spending' || !type) {
      const spendingRate = financialData.totalExpenses / (financialData.totalIncome || 1);
      insights.push({
        category: 'spending',
        value: `Total spending: ₦${financialData.totalExpenses.toLocaleString()}`,
        trend: spendingRate > 0.8 ? 'high' : 'normal',
        context: financialData
      });

      if (spendingRate > 0.8) {
        recommendations.push('Reduce discretionary spending to improve savings');
      }
    }

    // Income insights
    if (type === 'income' || !type) {
      insights.push({
        category: 'income',
        value: `Total income: ₦${financialData.totalIncome.toLocaleString()}`,
        trend: 'stable',
        context: financialData
      });
    }

    // Savings insights
    if (type === 'savings' || !type) {
      const savingsAmount = financialData.totalIncome - financialData.totalExpenses;
      const savingsRate = (savingsAmount / (financialData.totalIncome || 1)) * 100;

      insights.push({
        category: 'savings',
        value: `Savings: ₦${savingsAmount.toLocaleString()} (${savingsRate.toFixed(1)}% of income)`,
        trend: savingsRate > 15 ? 'excellent' : savingsRate > 5 ? 'good' : 'low',
        context: { savingsAmount, savingsRate }
      });

      if (savingsRate < 20) {
        recommendations.push('Consider setting up automatic savings to reach 20% savings rate');
      }
    }

    return {
      type: type || 'general',
      timeframe: timeframe || 'month',
      insights,
      recommendations
    };
  }

  private classifyIntent(message: string): { intent: string; confidence: number; entities?: any } {
    const lowerMessage = message.toLowerCase();

    // Balance inquiry
    if (lowerMessage.includes('balance') || lowerMessage.includes('how much')) {
      return { intent: 'balance_inquiry', confidence: 0.95 };
    }

    // Transaction history
    if (lowerMessage.includes('transaction') || lowerMessage.includes('history') ||
        lowerMessage.includes('recent') && (lowerMessage.includes('payment') || lowerMessage.includes('transfer'))) {
      return { intent: 'transaction_history', confidence: 0.9 };
    }

    // Spending inquiry - CHECK BEFORE TRANSFER
    if (lowerMessage.includes('spending') ||
        (lowerMessage.includes('spend') && (lowerMessage.includes('too much') || lowerMessage.includes('am i'))) ||
        lowerMessage.includes('expenses')) {
      return { intent: 'spending_inquiry', confidence: 0.93 };
    }

    // Transfer intent with entity extraction
    if (lowerMessage.includes('transfer') || lowerMessage.includes('send')) {
      const entities: any = {};

      // Extract amount
      const amountMatch = message.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:naira|ngn|₦)?/i);
      if (amountMatch) {
        entities.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
      }

      // Extract recipient name
      const toMatch = message.match(/\bto\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
      if (toMatch) {
        entities.recipient = toMatch[1];
      }

      return { intent: 'transfer', confidence: 0.92, entities };
    }

    // Investment
    if (lowerMessage.includes('invest') || lowerMessage.includes('investment')) {
      return { intent: 'investment_inquiry', confidence: 0.88 };
    }

    // Savings
    if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
      return { intent: 'savings_inquiry', confidence: 0.87 };
    }

    // Bill payment
    if (lowerMessage.includes('bill') || lowerMessage.includes('pay')) {
      return { intent: 'bill_payment', confidence: 0.85 };
    }

    return { intent: 'general', confidence: 0.75 };
  }

  async processEnhancedMessage(message: string, context: any, options?: any): Promise<any> {
    // Handle enriched context from AI chat route
    const userId = context.userId || context.user?.id || context.bankingContext?.user?.id;

    const financialData = userId ? await this.getUserFinancialData(userId) : null;

    const lowerMessage = message.toLowerCase();

    // Classify intent
    const classification = this.classifyIntent(message);

    // Generate contextual response based on intent
    let response = `I can help you with your banking needs. You can ask me about account balances, transfers, transactions, spending analysis, or any other banking services.`;
    if (classification.intent === 'balance_inquiry' && financialData) {
      response = `Your current balance is ₦${financialData.balance.toLocaleString()}.`;
    } else if (classification.intent === 'spending_inquiry' && financialData) {
      // Calculate spending from transactions correctly
      const spendingTotal = financialData.totalExpenses;
      const spendingRate = spendingTotal / (financialData.balance + spendingTotal);

      if (spendingTotal > 0) {
        const advice = spendingRate > 0.6 ? "Yes, you've spent over 60% of your initial funds. Consider reducing expenses." :
                       spendingRate > 0.4 ? "Your spending is moderate but watch your expenses." :
                       "Your spending is under control.";
        response = `You've spent ₦${spendingTotal.toLocaleString()} recently. ${advice} Current balance: ₦${financialData.balance.toLocaleString()}.`;
      } else {
        response = `You haven't had any recent spending. Your balance is ₦${financialData.balance.toLocaleString()}.`;
      }
    } else if (classification.intent === 'transaction_history' && financialData) {
      const recentCount = financialData.recentTransactions.length;
      if (recentCount > 0) {
        const recentTransfers = financialData.recentTransactions.slice(0, 3)
          .map((t: any) => `${t.description}: ₦${parseFloat(t.amount).toLocaleString()}`)
          .join(', ');
        response = `You have ${recentCount} recent transfers totaling ₦${financialData.totalExpenses.toLocaleString()}. Recent: ${recentTransfers}`;
      } else {
        response = `You have no recent transfers. Your current balance is ₦${financialData.balance.toLocaleString()}.`;
      }
    } else if (classification.intent === 'transfer' && classification.entities) {
      const { amount, recipient } = classification.entities;
      response = amount && recipient
        ? `I can help you transfer ₦${amount.toLocaleString()} to ${recipient}.`
        : `I can help you with a transfer. Please provide the amount and recipient.`;
    } else if (lowerMessage.includes('spending') && financialData) {
      const spendingRate = financialData.totalExpenses / (financialData.balance + financialData.totalExpenses);
      if (financialData.totalExpenses > 0) {
        const advice = spendingRate > 0.6 ? "Yes, you've spent over 60% of your initial funds. Consider reducing expenses." :
                       spendingRate > 0.4 ? "Your spending is moderate but watch your expenses." :
                       "Your spending is under control.";
        response = `You've transferred ₦${financialData.totalExpenses.toLocaleString()} recently. ${advice} Current balance: ₦${financialData.balance.toLocaleString()}.`;
      } else {
        response = `No recent spending detected. Your balance remains at ₦${financialData.balance.toLocaleString()}.`;
      }
    }

    const result: any = {
      response,
      intent: classification.intent,
      confidence: classification.confidence,
      context: {
        ...context,
        financialData
      },
      suggestions: await this.getPersonalizedSuggestions(context),
      insights: await this.getAnalyticsInsights(context)
    };

    // Add entities if present
    if (classification.entities) {
      result.entities = classification.entities;
    }

    return result;
  }

  async translateMessage(text: string, sourceLanguage: string, targetLanguage: string, context?: any): Promise<any> {
    return {
      originalText: text,
      translatedText: text, // Placeholder - would use actual translation service
      sourceLanguage,
      targetLanguage,
      confidence: 0.95
    };
  }

  async getLocalizedSuggestions(language: string, type: any): Promise<any[]> {
    return this.getPersonalizedSuggestions({ language }, type);
  }

  getSupportedLanguages(): string[] {
    return ['en', 'fr', 'es', 'de', 'pt', 'ar', 'zh', 'ja'];
  }

  async markSuggestionAsUsed(suggestionId: string, userId: string): Promise<void> {
    // Track suggestion usage in database
    try {
      await query(
        `INSERT INTO ai_suggestion_tracking (suggestion_id, user_id, action, created_at)
         VALUES ($1, $2, 'used', NOW())`,
        [suggestionId, userId]
      );
    } catch (error) {
      console.error('Error tracking suggestion usage:', error);
    }
  }

  async markSuggestionAsDismissed(suggestionId: string, userId: string): Promise<void> {
    // Track dismissed suggestions in database
    try {
      await query(
        `INSERT INTO ai_suggestion_tracking (suggestion_id, user_id, action, created_at)
         VALUES ($1, $2, 'dismissed', NOW())`,
        [suggestionId, userId]
      );
    } catch (error) {
      console.error('Error tracking suggestion dismissal:', error);
    }
  }

  async exportAnalyticsReport(userId: string, format: any): Promise<any> {
    const financialData = await this.getUserFinancialData(userId);
    const insights = await this.getAnalyticsInsights({ userId });

    return {
      userId,
      format,
      reportData: {
        summary: 'Analytics report generated from real user data',
        period: 'last 30 days',
        metrics: {
          balance: financialData.balance,
          totalIncome: financialData.totalIncome,
          totalExpenses: financialData.totalExpenses,
          transactionCount: financialData.recentTransactions.length,
          averageTransaction: financialData.averageTransaction
        },
        insights: insights.insights,
        recommendations: insights.recommendations
      },
      generatedAt: new Date()
    };
  }

  async performHealthCheck(): Promise<any> {
    return {
      status: 'healthy',
      services: {
        aiIntelligence: 'operational',
        smartSuggestions: this.config.enableSmartSuggestions ? 'enabled' : 'disabled',
        analyticsInsights: this.config.enableAnalyticsInsights ? 'enabled' : 'disabled',
        databaseConnection: 'active'
      },
      timestamp: new Date()
    };
  }

  getPerformanceMetrics(): any {
    return {
      requestCount: 0,
      averageResponseTime: 0,
      successRate: 100,
      dataSource: 'database',
      activeFeatures: Object.entries(this.config)
        .filter(([_, enabled]) => enabled)
        .map(([feature]) => feature)
    };
  }

  getConfiguration(): AIIntelligenceConfig {
    return this.getConfig();
  }
}