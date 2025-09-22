import { DatabaseUserDataProvider } from '../data/DatabaseUserDataProvider';

export interface SmartSuggestion {
  id: string;
  type: 'action' | 'insight' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface SmartSuggestionsContext {
  userId: string;
  tenantId?: string;
  currentBalance?: number;
  recentTransactions?: any[];
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
}

export class SmartSuggestionsEngine {
  private dataProvider: DatabaseUserDataProvider;

  constructor(tenantId?: string) {
    this.dataProvider = new DatabaseUserDataProvider(tenantId);
  }

  async generateSuggestions(context: SmartSuggestionsContext): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];

    try {
      // Get user's financial data
      const userData = await this.dataProvider.getUserData(context.userId);

      if (!userData) {
        return this.getDefaultSuggestions();
      }

      // Balance-based suggestions
      if (userData.balance && userData.balance > 100000) {
        suggestions.push({
          id: 'savings_opportunity',
          type: 'recommendation',
          title: 'Consider Savings',
          description: 'You have a good balance. Consider moving some funds to a savings account.',
          confidence: 0.8,
          metadata: { suggestedAmount: Math.floor(userData.balance * 0.1) }
        });
      }

      // Transaction pattern suggestions
      if (userData.recentTransactions && userData.recentTransactions.length > 0) {
        const hasRecurringPayments = this.detectRecurringPayments(userData.recentTransactions);
        if (hasRecurringPayments) {
          suggestions.push({
            id: 'auto_pay_setup',
            type: 'action',
            title: 'Set Up Auto-Pay',
            description: 'I notice recurring payments. Would you like to set up automatic transfers?',
            confidence: 0.75
          });
        }
      }

      // Time-based suggestions
      if (context.timeOfDay === 'morning') {
        suggestions.push({
          id: 'daily_summary',
          type: 'insight',
          title: 'Daily Financial Summary',
          description: 'Good morning! Here\'s your financial snapshot for today.',
          confidence: 0.9
        });
      }

      return suggestions.slice(0, 3); // Limit to top 3 suggestions
    } catch (error) {
      console.error('Error generating smart suggestions:', error);
      return this.getDefaultSuggestions();
    }
  }

  private detectRecurringPayments(transactions: any[]): boolean {
    // Simple logic to detect recurring payments
    const amounts = transactions.map(t => t.amount);
    const uniqueAmounts = [...new Set(amounts)];
    return uniqueAmounts.length < amounts.length * 0.8; // If 80% are recurring
  }

  private getDefaultSuggestions(): SmartSuggestion[] {
    return [
      {
        id: 'check_balance',
        type: 'action',
        title: 'Check Account Balance',
        description: 'View your current account balance and recent activity.',
        confidence: 0.9
      },
      {
        id: 'transfer_money',
        type: 'action',
        title: 'Transfer Money',
        description: 'Send money to friends, family, or pay bills.',
        confidence: 0.85
      },
      {
        id: 'view_transactions',
        type: 'insight',
        title: 'Review Transactions',
        description: 'Check your recent transaction history and spending patterns.',
        confidence: 0.8
      }
    ];
  }
}