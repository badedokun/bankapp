import { DatabaseUserDataProvider } from '../data/DatabaseUserDataProvider';
import { query } from '../../../config/database';

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
      // Get real user data from database
      const userData = await this.getUserDataFromDatabase(context.userId);

      if (!userData || !userData.balance) {
        return this.getDefaultSuggestions();
      }

      // Balance-based suggestions (using real data with dynamic thresholds)
      if (userData.balance > 10000) {
        const savingsPercentage = userData.balance > 100000 ? 0.1 : 0.05;
        suggestions.push({
          id: `savings_opportunity_${Date.now()}`,
          type: 'recommendation',
          title: 'Savings Opportunity',
          description: `You have ₦${userData.balance.toLocaleString()}. Consider moving ₦${(userData.balance * savingsPercentage).toLocaleString()} to savings.`,
          confidence: 0.85,
          metadata: { suggestedAmount: Math.floor(userData.balance * savingsPercentage), currentBalance: userData.balance }
        });
      }

      // Transaction pattern suggestions (using real data)
      if (userData.recentTransactions && userData.recentTransactions.length > 0) {
        const hasRecurringPayments = this.detectRecurringPayments(userData.recentTransactions);
        if (hasRecurringPayments) {
          suggestions.push({
            id: `auto_pay_setup_${Date.now()}`,
            type: 'action',
            title: 'Automate Recurring Payments',
            description: `Detected ${hasRecurringPayments} recurring payments. Set up auto-pay to save time.`,
            confidence: 0.75,
            metadata: { recurringCount: hasRecurringPayments }
          });
        }

        // Spending analysis based on real transactions
        const totalSpending = userData.recentTransactions
          .filter((t: any) => t.type === 'debit')
          .reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount)), 0);

        if (totalSpending > userData.balance * 0.5) {
          suggestions.push({
            id: `spending_alert_${Date.now()}`,
            type: 'insight',
            title: 'High Spending Alert',
            description: `Your recent spending (₦${totalSpending.toLocaleString()}) is over 50% of your balance. Review your expenses.`,
            confidence: 0.9,
            metadata: { totalSpending, balance: userData.balance }
          });
        }
      }

      // Time-based suggestions
      if (context.timeOfDay === 'morning') {
        const dailySummary = await this.getDailySummary(context.userId);
        suggestions.push({
          id: `daily_summary_${Date.now()}`,
          type: 'insight',
          title: 'Good Morning! Your Financial Snapshot',
          description: `Balance: ₦${userData.balance.toLocaleString()} | Today's transactions: ${dailySummary.todayTransactionCount}`,
          confidence: 0.9,
          metadata: dailySummary
        });
      }

      return suggestions.slice(0, 3); // Limit to top 3 suggestions
    } catch (error) {
      console.error('Error generating smart suggestions:', error);
      return this.getDefaultSuggestions();
    }
  }

  private async getUserDataFromDatabase(userId: string): Promise<any> {
    try {
      // Get user balance from tenant-specific database
      const balanceResult = await query(
        'SELECT balance, currency FROM tenant.wallets WHERE user_id = $1',
        [userId]
      );

      // Get recent transfers from tenant-specific database (real user data)
      const transactionsResult = await query(
        `SELECT amount, recipient_name as description, 'debit' as type, created_at, status
         FROM tenant.transfers
         WHERE sender_id = $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [userId]
      );

      return {
        balance: balanceResult.rows[0]?.balance || 0,
        currency: balanceResult.rows[0]?.currency || 'NGN',
        recentTransactions: transactionsResult.rows || []
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  private async getDailySummary(userId: string): Promise<any> {
    try {
      const result = await query(
        `SELECT COUNT(*) as count, COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) as income,
         COALESCE(SUM(CASE WHEN type = 'debit' THEN ABS(amount) ELSE 0 END), 0) as expenses
         FROM tenant.transactions
         WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE`,
        [userId]
      );

      return {
        todayTransactionCount: parseInt(result.rows[0]?.count || '0'),
        todayIncome: parseFloat(result.rows[0]?.income || '0'),
        todayExpenses: parseFloat(result.rows[0]?.expenses || '0')
      };
    } catch (error) {
      return { todayTransactionCount: 0, todayIncome: 0, todayExpenses: 0 };
    }
  }

  private detectRecurringPayments(transactions: any[]): number {
    // Simple logic to detect recurring payments using real transaction data
    const amounts = transactions.map(t => Math.abs(parseFloat(t.amount)));
    const amountCounts = amounts.reduce((acc: any, amount) => {
      acc[amount] = (acc[amount] || 0) + 1;
      return acc;
    }, {});

    // Count amounts that appear more than once
    return Object.values(amountCounts).filter((count: any) => count > 1).length;
  }

  private getDefaultSuggestions(): SmartSuggestion[] {
    return [
      {
        id: `check_balance_${Date.now()}`,
        type: 'action',
        title: 'Check Account Balance',
        description: 'View your current account balance and recent activity.',
        confidence: 0.9
      },
      {
        id: `transfer_money_${Date.now()}`,
        type: 'action',
        title: 'Transfer Money',
        description: 'Send money to friends, family, or pay bills.',
        confidence: 0.85
      },
      {
        id: `view_transactions_${Date.now()}`,
        type: 'insight',
        title: 'Review Transactions',
        description: 'Check your recent transaction history and spending patterns.',
        confidence: 0.8
      }
    ];
  }

  static async getPersonalizedSuggestions(request: any): Promise<SmartSuggestion[]> {
    const engine = new SmartSuggestionsEngine();
    const userId = typeof request === 'string' ? request : request.context?.userId || request.userId;
    const context = typeof request === 'object' ? request.context || request : {};

    return engine.generateSuggestions({
      userId,
      ...context
    });
  }
}