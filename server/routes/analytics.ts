/**
 * Analytics and Dashboard Routes
 * User analytics, insights, and dashboard data
 */

import express from 'express';
import { Request, Response } from 'express';
import { query } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { validateTenantAccess } from '../middleware/tenant';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

/**
 * GET /api/analytics/dashboard
 * Get user dashboard analytics data
 */
router.get('/dashboard', authenticateToken, validateTenantAccess, asyncHandler(async (req: Request, res: Response)=> {
  const userId = req.user?.id;
  const tenantId = req.user?.tenantId;

  // Get current balance
  const balanceResult = await query(`
    SELECT balance, currency FROM tenant.wallets
    WHERE user_id = $1 AND tenant_id = $2 AND is_primary = true
  `, [userId, tenantId]);

  const currentBalance = balanceResult.rows.length > 0 ? parseFloat(balanceResult.rows[0].balance) : 0;
  const currency = balanceResult.rows.length > 0 ? balanceResult.rows[0].currency : 'NGN';

  // Get transaction stats for last 30 days (including transfers)
  const transactionStatsResult = await query(`
    SELECT
      type,
      COUNT(*) as transaction_count,
      SUM(amount) as total_amount
    FROM (
      -- Regular transactions
      SELECT type, amount, created_at
      FROM tenant.transactions
      WHERE user_id = $1 AND tenant_id = $2
        AND created_at >= NOW() - INTERVAL '30 days'

      UNION ALL

      -- Money transfers from transfers table
      SELECT 'money_transfer' as type, amount, created_at
      FROM tenant.transfers
      WHERE sender_id = $1 AND tenant_id = $2
        AND created_at >= NOW() - INTERVAL '30 days'
        AND status = 'successful'
    ) combined_transactions
    GROUP BY type
  `, [userId, tenantId]);

  // Get monthly spending pattern (last 6 months) including transfers
  const monthlySpendingResult = await query(`
    SELECT
      DATE_TRUNC('month', created_at) as month,
      SUM(CASE WHEN type IN ('money_transfer', 'bill_payment', 'cash_withdrawal') THEN amount ELSE 0 END) as spending,
      SUM(CASE WHEN type IN ('deposit', 'credit') THEN amount ELSE 0 END) as income
    FROM (
      -- Regular transactions
      SELECT type, amount, created_at
      FROM tenant.transactions
      WHERE user_id = $1 AND tenant_id = $2
        AND created_at >= NOW() - INTERVAL '6 months'

      UNION ALL

      -- Money transfers from transfers table
      SELECT 'money_transfer' as type, amount, created_at
      FROM tenant.transfers
      WHERE sender_id = $1 AND tenant_id = $2
        AND created_at >= NOW() - INTERVAL '6 months'
        AND status = 'successful'
    ) combined_transactions
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month DESC
  `, [userId, tenantId]);

  // Get recent transactions including transfers
  const recentTransactionsResult = await query(`
    SELECT
      type,
      amount,
      description,
      status,
      created_at
    FROM (
      -- Regular transactions
      SELECT type, amount, description, status, created_at
      FROM tenant.transactions
      WHERE user_id = $1 AND tenant_id = $2

      UNION ALL

      -- Money transfers from transfers table
      SELECT 'money_transfer' as type, amount,
             COALESCE(description, 'Transfer to ' || recipient_name) as description,
             status, created_at
      FROM tenant.transfers
      WHERE sender_id = $1 AND tenant_id = $2
    ) combined_transactions
    ORDER BY created_at DESC
    LIMIT 5
  `, [userId, tenantId]);

  // Calculate spending categories including transfers
  const categorySpendingResult = await query(`
    SELECT
      CASE
        WHEN type = 'bill_payment' THEN 'Bills & Utilities'
        WHEN type = 'money_transfer' THEN 'Transfers'
        WHEN type = 'cash_withdrawal' THEN 'Cash Withdrawals'
        WHEN type = 'shopping' THEN 'Shopping'
        ELSE 'Other'
      END as category,
      SUM(amount) as total_amount,
      COUNT(*) as transaction_count
    FROM (
      -- Regular transactions
      SELECT type, amount, created_at
      FROM tenant.transactions
      WHERE user_id = $1 AND tenant_id = $2
        AND type IN ('bill_payment', 'cash_withdrawal', 'shopping')
        AND created_at >= NOW() - INTERVAL '30 days'

      UNION ALL

      -- Money transfers from transfers table
      SELECT 'money_transfer' as type, amount, created_at
      FROM tenant.transfers
      WHERE sender_id = $1 AND tenant_id = $2
        AND created_at >= NOW() - INTERVAL '30 days'
        AND status = 'successful'
    ) combined_transactions
    GROUP BY
      CASE
        WHEN type = 'bill_payment' THEN 'Bills & Utilities'
        WHEN type = 'money_transfer' THEN 'Transfers'
        WHEN type = 'cash_withdrawal' THEN 'Cash Withdrawals'
        WHEN type = 'shopping' THEN 'Shopping'
        ELSE 'Other'
      END
    ORDER BY total_amount DESC
  `, [userId, tenantId]);

  // Calculate insights
  const totalSpending = transactionStatsResult.rows
    .filter(row => ['money_transfer', 'bill_payment', 'cash_withdrawal'].includes(row.type))
    .reduce((sum, row) => sum + parseFloat(row.total_amount || '0'), 0);

  const totalIncome = transactionStatsResult.rows
    .filter(row => ['deposit', 'credit'].includes(row.type))
    .reduce((sum, row) => sum + parseFloat(row.total_amount || '0'), 0);

  // Generate insights
  const insights = [];

  if (totalSpending > totalIncome && totalSpending > 0) {
    insights.push({
      type: 'warning',
      title: 'Spending Alert',
      message: 'Your spending exceeds your income this month. Consider reviewing your expenses.',
      actionable: true
    });
  }

  if (currentBalance < totalSpending * 0.1) {
    insights.push({
      type: 'caution',
      title: 'Low Balance',
      message: 'Your current balance is low compared to your spending pattern.',
      actionable: true
    });
  }

  const dashboard = {
    balance: {
      current: currentBalance,
      currency: currency,
      trend: totalIncome > totalSpending ? 'positive' : 'negative'
    },
    summary: {
      totalSpending: totalSpending,
      totalIncome: totalIncome,
      netFlow: totalIncome - totalSpending,
      transactionCount: transactionStatsResult.rows.reduce((sum, row) => sum + parseInt(row.transaction_count), 0)
    },
    monthlyData: monthlySpendingResult.rows.map(row => ({
      month: row.month,
      spending: parseFloat(row.spending || '0'),
      income: parseFloat(row.income || '0')
    })),
    categoryBreakdown: categorySpendingResult.rows.map(row => ({
      category: row.category,
      amount: parseFloat(row.total_amount),
      count: parseInt(row.transaction_count),
      percentage: totalSpending > 0 ? ((parseFloat(row.total_amount) / totalSpending) * 100).toFixed(1) : 0
    })),
    recentActivity: recentTransactionsResult.rows.map(row => ({
      type: row.type,
      amount: parseFloat(row.amount),
      description: row.description,
      status: row.status,
      date: row.created_at
    })),
    insights: insights,
    goals: [
      {
        id: 'emergency_fund',
        title: 'Emergency Fund',
        target: currentBalance * 6,
        current: currentBalance,
        progress: Math.min((currentBalance / (currentBalance * 6)) * 100, 100)
      },
      {
        id: 'monthly_savings',
        title: 'Monthly Savings',
        target: totalIncome * 0.2,
        current: Math.max(totalIncome - totalSpending, 0),
        progress: totalIncome > 0 ? Math.min(((totalIncome - totalSpending) / (totalIncome * 0.2)) * 100, 100) : 0
      }
    ]
  };

  res.json({
    success: true,
    data: dashboard
  });
}));

/**
 * GET /api/analytics/spending-trends
 * Get detailed spending trends and patterns
 */
router.get('/spending-trends', authenticateToken, validateTenantAccess, asyncHandler(async (req: Request, res: Response)=> {
  const { period = '3months' } = req.query;
  const userId = req.user?.id;
  const tenantId = req.user?.tenantId;

  let intervalDays;
  switch (period) {
    case '1month': intervalDays = 30; break;
    case '3months': intervalDays = 90; break;
    case '6months': intervalDays = 180; break;
    case '1year': intervalDays = 365; break;
    default: intervalDays = 90;
  }

  const trendsResult = await query(`
    SELECT
      DATE_TRUNC('week', created_at) as week,
      type,
      SUM(amount) as total_amount,
      COUNT(*) as transaction_count
    FROM tenant.transactions
    WHERE user_id = $1 AND tenant_id = $2
      AND created_at >= NOW() - INTERVAL '${intervalDays} days'
      AND type IN ('transfer', 'bill_payment', 'withdrawal', 'deposit', 'credit')
    GROUP BY DATE_TRUNC('week', created_at), type
    ORDER BY week DESC, type
  `, [userId, tenantId]);

  res.json({
    success: true,
    data: {
      period,
      trends: trendsResult.rows.map(row => ({
        week: row.week,
        type: row.type,
        amount: parseFloat(row.total_amount),
        count: parseInt(row.transaction_count)
      }))
    }
  });
}));

export default router;