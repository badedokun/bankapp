/**
 * Customer Data Service
 * Handles customer-specific queries using real banking data
 * No mock data - all responses use actual customer information
 */

import { query } from '../../config/database';
import dbManager from '../../config/multi-tenant-database';

export interface CustomerQuery {
  type: 'balance' | 'transactions' | 'spending' | 'savings' | 'transfers' | 'bills' | 'general';
  userId: string;
  parameters?: Record<string, any>;
}

export interface CustomerDataResponse {
  answer: string;
  data: any;
  suggestions?: string[];
  requiresOpenAI: boolean;
}

export class CustomerDataService {
  /**
   * Classify the customer's query intent
   */
  static classifyQuery(message: string): CustomerQuery['type'] {
    const msg = message.toLowerCase();

    // Balance queries
    if (msg.includes('balance') || msg.includes('how much') && (msg.includes('have') || msg.includes('account'))) {
      return 'balance';
    }

    // Transaction queries
    if (msg.includes('transaction') || msg.includes('payment') || msg.includes('history') ||
        msg.includes('recent') && (msg.includes('activity') || msg.includes('transfer'))) {
      return 'transactions';
    }

    // Spending analysis queries
    if (msg.includes('spending') || msg.includes('spent') || msg.includes('expense') ||
        (msg.includes('analyze') && (msg.includes('pattern') || msg.includes('habit')))) {
      return 'spending';
    }

    // Savings queries
    if (msg.includes('saving') || msg.includes('saved') || msg.includes('save money')) {
      return 'savings';
    }

    // Transfer queries
    if (msg.includes('transfer') || msg.includes('send money') || msg.includes('recipient')) {
      return 'transfers';
    }

    // Bill payment queries
    if (msg.includes('bill') || msg.includes('utility') || msg.includes('airtime') || msg.includes('data')) {
      return 'bills';
    }

    // Default to general banking question (requires OpenAI)
    return 'general';
  }

  /**
   * Get customer balance with natural language response
   */
  static async getBalance(userId: string, tenantId: string): Promise<CustomerDataResponse> {
    try {
      const result = await dbManager.queryTenant(tenantId,
        `SELECT
          w.balance,
          w.currency,
          w.wallet_type,
          w.wallet_number,
          u.first_name,
          u.last_name
        FROM tenant.wallets w
        JOIN tenant.users u ON w.user_id = u.id
        WHERE w.user_id = $1
          AND w.wallet_type IN ('primary', 'main', 'default', 'checking')
        ORDER BY
          CASE w.wallet_type
            WHEN 'main' THEN 1
            WHEN 'primary' THEN 2
            WHEN 'default' THEN 3
            ELSE 4
          END
        LIMIT 1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return {
          answer: "I couldn't find your account balance. Please contact support if you believe this is an error.",
          data: null,
          requiresOpenAI: false
        };
      }

      const { balance, currency, first_name, wallet_number } = result.rows[0];
      const formattedBalance = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: currency || 'NGN'
      }).format(balance);

      return {
        answer: `Hi ${first_name}, your current account balance is ${formattedBalance}. Your account number is ${wallet_number}.`,
        data: {
          balance: parseFloat(balance),
          currency: currency || 'NGN',
          walletNumber: wallet_number,
          formattedBalance
        },
        suggestions: [
          'View recent transactions',
          'Transfer money',
          'Check spending patterns'
        ],
        requiresOpenAI: false
      };
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }
  }

  /**
   * Get recent transactions with natural language response
   */
  static async getRecentTransactions(userId: string, tenantId: string, limit: number = 5): Promise<CustomerDataResponse> {
    try {
      const result = await dbManager.queryTenant(tenantId,
        `SELECT
          id,
          reference,
          type,
          amount,
          currency,
          description,
          status,
          created_at,
          recipient_name,
          sender_name
        FROM tenant.transactions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2`,
        [userId, limit]
      );

      if (result.rows.length === 0) {
        return {
          answer: "You don't have any recent transactions yet.",
          data: { transactions: [] },
          suggestions: ['Make a transfer', 'Pay a bill'],
          requiresOpenAI: false
        };
      }

      const transactions = result.rows;

      const totalSpent = transactions
        .filter(t => ['money_transfer', 'bill_payment', 'cash_withdrawal', 'airtime_purchase'].includes(t.type))
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const formattedTotal = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: transactions[0].currency || 'NGN'
      }).format(totalSpent);

      let answer = `Here are your ${transactions.length} most recent transactions:\n\n`;

      transactions.forEach((tx, index) => {
        const amount = new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: tx.currency || 'NGN'
        }).format(tx.amount);

        const date = new Date(tx.created_at).toLocaleDateString('en-NG', {
          month: 'short',
          day: 'numeric'
        });

        answer += `${index + 1}. ${tx.description} - ${amount} (${date})\n`;
      });

      answer += `\nTotal spent: ${formattedTotal}`;

      return {
        answer,
        data: {
          transactions: transactions.map(tx => ({
            ...tx,
            amount: parseFloat(tx.amount),
            date: tx.created_at
          })),
          totalSpent,
          count: transactions.length
        },
        suggestions: [
          'Analyze spending patterns',
          'View full transaction history',
          'Download statement'
        ],
        requiresOpenAI: false
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  /**
   * Analyze spending patterns with real data
   */
  static async analyzeSpending(userId: string, tenantId: string, days: number = 30): Promise<CustomerDataResponse> {
    try {
      // Get spending by category (spending types: withdrawals, transfers, payments, etc.)
      const categoryResult = await dbManager.queryTenant(tenantId,
        `SELECT
          LOWER(description) as category,
          SUM(amount) as total_amount,
          COUNT(*) as transaction_count,
          AVG(amount) as avg_amount
        FROM tenant.transactions
        WHERE user_id = $1
          AND created_at >= NOW() - INTERVAL '${days} days'
          AND type IN ('cash_withdrawal', 'money_transfer', 'bill_payment', 'airtime_purchase', 'loan_payment', 'pos_payment', 'qr_payment')
        GROUP BY LOWER(description)
        ORDER BY total_amount DESC
        LIMIT 10`,
        [userId]
      );

      // Get overall spending stats (spending vs income)
      const statsResult = await dbManager.queryTenant(tenantId,
        `SELECT
          COUNT(*) as total_transactions,
          SUM(CASE WHEN type IN ('cash_withdrawal', 'money_transfer', 'bill_payment', 'airtime_purchase', 'loan_payment', 'pos_payment', 'qr_payment')
              THEN amount ELSE 0 END) as total_spent,
          SUM(CASE WHEN type IN ('account_opening', 'investment')
              THEN amount ELSE 0 END) as total_received,
          AVG(CASE WHEN type IN ('cash_withdrawal', 'money_transfer', 'bill_payment', 'airtime_purchase', 'loan_payment', 'pos_payment', 'qr_payment')
              THEN amount ELSE NULL END) as avg_transaction
        FROM tenant.transactions
        WHERE user_id = $1
          AND created_at >= NOW() - INTERVAL '${days} days'`,
        [userId]
      );

      const stats = statsResult.rows[0];
      const categories = categoryResult.rows;

      if (categories.length === 0) {
        return {
          answer: `You haven't made any transactions in the last ${days} days.`,
          data: { stats, categories: [] },
          suggestions: ['View account balance', 'Make a transfer'],
          requiresOpenAI: false
        };
      }

      const totalSpent = parseFloat(stats.total_spent || 0);
      const totalReceived = parseFloat(stats.total_received || 0);
      const avgTransaction = parseFloat(stats.avg_transaction || 0);

      const formattedSpent = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
      }).format(totalSpent);

      const formattedReceived = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
      }).format(totalReceived);

      const formattedAvg = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
      }).format(avgTransaction);

      let answer = `📊 Spending Analysis (Last ${days} days)\n\n`;
      answer += `Total Spent: ${formattedSpent}\n`;
      answer += `Total Received: ${formattedReceived}\n`;
      answer += `Average Transaction: ${formattedAvg}\n\n`;
      answer += `Top Spending Categories:\n`;

      categories.slice(0, 5).forEach((cat, index) => {
        const amount = new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: 'NGN'
        }).format(cat.total_amount);
        const percentage = ((parseFloat(cat.total_amount) / totalSpent) * 100).toFixed(1);
        answer += `${index + 1}. ${cat.category} - ${amount} (${percentage}%)\n`;
      });

      // Add insights based on data
      const insights = [];
      if (totalSpent > totalReceived) {
        insights.push('You spent more than you received this period. Consider reviewing your expenses.');
      }
      if (avgTransaction > 50000) {
        insights.push('Your average transaction is relatively high. Consider breaking down large expenses.');
      }

      if (insights.length > 0) {
        answer += `\n💡 Insights:\n${insights.map(i => `• ${i}`).join('\n')}`;
      }

      return {
        answer,
        data: {
          stats: {
            totalSpent,
            totalReceived,
            avgTransaction,
            transactionCount: parseInt(stats.total_transactions)
          },
          categories: categories.map(cat => ({
            category: cat.category,
            amount: parseFloat(cat.total_amount),
            count: parseInt(cat.transaction_count),
            average: parseFloat(cat.avg_amount)
          })),
          insights
        },
        suggestions: [
          'Set a monthly budget',
          'View savings options',
          'Analyze by time period'
        ],
        requiresOpenAI: false
      };
    } catch (error) {
      console.error('Error analyzing spending:', error);
      throw error;
    }
  }

  /**
   * Get savings information
   */
  static async getSavingsInfo(userId: string, tenantId: string): Promise<CustomerDataResponse> {
    try {
      const result = await dbManager.queryTenant(tenantId,
        `SELECT
          id,
          goal_name,
          target_amount,
          current_amount,
          interest_rate,
          maturity_date,
          status,
          created_at
        FROM tenant.savings_accounts
        WHERE user_id = $1
        ORDER BY created_at DESC`,
        [userId]
      );

      if (result.rows.length === 0) {
        return {
          answer: "You don't have any savings accounts yet. Would you like to start saving today?",
          data: { savingsAccounts: [] },
          suggestions: [
            'Create a savings goal',
            'Learn about savings options',
            'Calculate potential savings'
          ],
          requiresOpenAI: false
        };
      }

      const savings = result.rows;
      const totalSaved = savings.reduce((sum, s) => sum + parseFloat(s.current_amount || 0), 0);
      const totalTarget = savings.reduce((sum, s) => sum + parseFloat(s.target_amount || 0), 0);

      const formattedSaved = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
      }).format(totalSaved);

      const formattedTarget = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
      }).format(totalTarget);

      const progress = totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : '0';

      let answer = `💰 Your Savings Summary\n\n`;
      answer += `Total Saved: ${formattedSaved}\n`;
      answer += `Total Goals: ${formattedTarget}\n`;
      answer += `Progress: ${progress}%\n\n`;
      answer += `Active Savings Goals:\n`;

      savings.forEach((goal, index) => {
        const current = new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: 'NGN'
        }).format(goal.current_amount);

        const target = new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: 'NGN'
        }).format(goal.target_amount);

        const goalProgress = ((parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100).toFixed(1);

        answer += `${index + 1}. ${goal.goal_name}: ${current} of ${target} (${goalProgress}%)\n`;
      });

      return {
        answer,
        data: {
          totalSaved,
          totalTarget,
          overallProgress: parseFloat(progress),
          savingsAccounts: savings.map(s => ({
            ...s,
            currentAmount: parseFloat(s.current_amount),
            targetAmount: parseFloat(s.target_amount),
            interestRate: parseFloat(s.interest_rate || 0)
          }))
        },
        suggestions: [
          'Add to savings',
          'Create new savings goal',
          'View interest earned'
        ],
        requiresOpenAI: false
      };
    } catch (error) {
      console.error('Error fetching savings info:', error);
      throw error;
    }
  }

  /**
   * Process customer query and return appropriate response
   */
  static async processQuery(message: string, userId: string, tenantId: string): Promise<CustomerDataResponse> {
    const queryType = this.classifyQuery(message);

    switch (queryType) {
      case 'balance':
        return await this.getBalance(userId, tenantId);

      case 'transactions':
        return await this.getRecentTransactions(userId, tenantId);

      case 'spending':
        return await this.analyzeSpending(userId, tenantId);

      case 'savings':
        return await this.getSavingsInfo(userId, tenantId);

      case 'transfers':
      case 'bills':
        // These require more context, return guidance
        return {
          answer: `I can help you with ${queryType}. Please use the ${queryType} screen in the app for secure transactions.`,
          data: null,
          suggestions: [
            `Go to ${queryType} screen`,
            'View transaction history',
            'Check account balance'
          ],
          requiresOpenAI: false
        };

      case 'general':
      default:
        // General banking questions require OpenAI
        return {
          answer: '',
          data: null,
          requiresOpenAI: true
        };
    }
  }
}
