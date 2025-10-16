import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateTenantAccess } from '../middleware/tenant';
import { query } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

/**
 * GET /api/transaction-limits
 * Get user's transaction limits and current spending
 */
router.get('/', authenticateToken, validateTenantAccess, asyncHandler(async (req: Request, res: Response)=> {
  const userId = req.user?.id;
  const tenantId = req.user?.tenantId;

  // Get user's wallet with limits
  const walletResult = await query(`
    SELECT 
      w.daily_limit,
      w.monthly_limit,
      u.kyc_level
    FROM tenant.wallets w
    JOIN tenant.users u ON w.user_id = u.id
    WHERE w.user_id = $1 AND w.tenant_id = $2 AND w.is_primary = true
  `, [userId, tenantId]);

  if (walletResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Wallet not found',
      code: 'WALLET_NOT_FOUND'
    });
  }

  const wallet = walletResult.rows[0];

  // Calculate daily and monthly spending
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().substring(0, 7);

  const spendingResult = await query(`
    SELECT 
      COALESCE(SUM(CASE WHEN DATE(created_at) = $1 THEN amount ELSE 0 END), 0) as daily_spent,
      COALESCE(SUM(CASE WHEN DATE(created_at) >= $2 THEN amount ELSE 0 END), 0) as monthly_spent
    FROM tenant.transfers 
    WHERE sender_id = $3 AND status IN ('pending', 'successful')
  `, [today, currentMonth + '-01', userId]);

  const spending = spendingResult.rows[0];

  // Get KYC-based default limits if not set
  const getDefaultLimits = (kycLevel: number) => {
    switch(kycLevel) {
      case 1: return { daily: 50000, monthly: 200000 };
      case 2: return { daily: 100000, monthly: 500000 };
      case 3: return { daily: 500000, monthly: 5000000 };
      default: return { daily: 50000, monthly: 200000 };
    }
  };

  const defaults = getDefaultLimits(wallet.kyc_level);
  const dailyLimit = parseFloat(wallet.daily_limit || defaults.daily);
  const monthlyLimit = parseFloat(wallet.monthly_limit || defaults.monthly);
  const dailySpent = parseFloat(spending.daily_spent);
  const monthlySpent = parseFloat(spending.monthly_spent);

  res.json({
    success: true,
    data: {
      limits: {
        dailyLimit,
        monthlyLimit,
        dailySpent,
        monthlySpent,
        dailyRemaining: Math.max(0, dailyLimit - dailySpent),
        monthlyRemaining: Math.max(0, monthlyLimit - monthlySpent)
      },
      kycLevel: wallet.kyc_level,
      limitsUpdatedAt: new Date()
    }
  });
}));

/**
 * PUT /api/transaction-limits
 * Update user's transaction limits (admin only)
 */
router.put('/', authenticateToken, validateTenantAccess, asyncHandler(async (req: Request, res: Response)=> {
  const { userId, userEmail, dailyLimit, monthlyLimit } = req.body;
  const tenantId = req.user?.tenantId;
  
  // Admin role check
  if (req.user?.role !== 'super_agent') {
    return res.status(403).json({
      success: false,
      error: 'Admin privileges required',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
  
  // Validate limits
  if (dailyLimit && monthlyLimit && dailyLimit > monthlyLimit) {
    return res.status(400).json({
      success: false,
      error: 'Daily limit cannot exceed monthly limit',
      code: 'INVALID_LIMITS'
    });
  }

  let targetUserId = userId;
  
  // If userEmail provided, lookup user by email
  if (userEmail && !userId) {
    const userLookup = await query(`
      SELECT id FROM tenant.users 
      WHERE email = $1 AND tenant_id = $2
    `, [userEmail, tenantId]);
    
    if (userLookup.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found with provided email',
        code: 'USER_NOT_FOUND'
      });
    }
    
    targetUserId = userLookup.rows[0].id;
  }
  
  // Use current user if no target specified (self-update)
  if (!targetUserId) {
    targetUserId = req.user?.id;
  }

  // Update user limits in users table
  const updateResult = await query(`
    UPDATE tenant.users 
    SET 
      daily_limit = COALESCE($1, daily_limit),
      monthly_limit = COALESCE($2, monthly_limit),
      updated_at = NOW()
    WHERE id = $3 AND tenant_id = $4
    RETURNING daily_limit, monthly_limit, email, first_name, last_name
  `, [dailyLimit, monthlyLimit, targetUserId, tenantId]);

  if (updateResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  const updatedUser = updateResult.rows[0];

  res.json({
    success: true,
    data: {
      dailyLimit: parseFloat(updatedUser.daily_limit),
      monthlyLimit: parseFloat(updatedUser.monthly_limit),
      updatedAt: new Date(),
      user: {
        email: updatedUser.email,
        name: `${updatedUser.first_name} ${updatedUser.last_name}`
      }
    }
  });
}));

export default router;