/**
 * Wallet Management Routes
 * Wallet balance, transactions, and account management endpoints
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import { query, transaction } from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateTenantAccess } from '../middleware/tenant';
import { asyncHandler, errors } from '../middleware/errorHandler';
import bcrypt from 'bcrypt';

const router = express.Router();

/**
 * GET /api/wallets/balance
 * Get user's wallet balance and details
 */
router.get('/balance', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  const walletResult = await query(`
    SELECT w.*, u.first_name, u.last_name
    FROM tenant.wallets w
    JOIN tenant.users u ON w.user_id = u.id
    WHERE w.user_id = $1 AND w.wallet_type = 'main'
  `, [req.user.id]);

  if (walletResult.rows.length === 0) {
    throw errors.notFound('Wallet not found', 'WALLET_NOT_FOUND');
  }

  const wallet = walletResult.rows[0];

  res.json({
    success: true,
    data: {
      walletNumber: wallet.wallet_number,
      accountType: wallet.wallet_type,
      balance: parseFloat(wallet.balance),
      availableBalance: parseFloat(wallet.available_balance),
      currency: wallet.currency || 'NGN',
      status: wallet.status,
      owner: {
        name: `${wallet.first_name} ${wallet.last_name}`
      },
      createdAt: wallet.created_at,
      updatedAt: wallet.updated_at
    }
  });
}));

/**
 * GET /api/wallets/statement
 * Get wallet transaction statement
 */
router.get('/statement', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  const { 
    startDate, 
    endDate, 
    page = 1, 
    limit = 50,
    type 
  } = req.query;

  const offset = (page - 1) * limit;
  
  // Get user's wallet
  const walletResult = await query(`
    SELECT id, wallet_number FROM tenant.wallets 
    WHERE user_id = $1 AND wallet_type = 'main'
  `, [req.user.id]);

  if (walletResult.rows.length === 0) {
    throw errors.notFound('Wallet not found', 'WALLET_NOT_FOUND');
  }

  const walletId = walletResult.rows[0].id;
  const walletNumber = walletResult.rows[0].wallet_number;

  // Build query conditions
  let dateFilter = '';
  let typeFilter = '';
  const queryParams = [walletId, limit, offset];
  let paramCount = 3;

  if (startDate && endDate) {
    paramCount += 2;
    dateFilter = `AND t.created_at BETWEEN $${paramCount - 1} AND $${paramCount}`;
    queryParams.splice(-2, 0, startDate, endDate);
  }

  if (type) {
    paramCount++;
    typeFilter = `AND t.transaction_type = $${paramCount}`;
    queryParams.push(type);
  }

  // Get transactions (both sent and received)
  const transactionsResult = await query(`
    SELECT t.id, t.reference_number, t.amount, t.fees, t.description,
           t.recipient_account_number, t.recipient_bank_code, t.recipient_name,
           t.transaction_type, t.status, t.created_at, t.completed_at,
           'debit' as entry_type
    FROM tenant.transactions t
    WHERE t.sender_wallet_id = $1 ${dateFilter} ${typeFilter}
    
    UNION ALL
    
    SELECT t.id, t.reference_number, t.amount, 0 as fees, t.description,
           sw.wallet_number as recipient_account_number, '' as recipient_bank_code, 
           su.first_name || ' ' || su.last_name as recipient_name,
           t.transaction_type, t.status, t.created_at, t.completed_at,
           'credit' as entry_type
    FROM tenant.transactions t
    JOIN tenant.wallets sw ON t.sender_wallet_id = sw.id
    JOIN tenant.users su ON sw.user_id = su.id
    WHERE t.recipient_account_number = $1 AND t.status = 'completed' ${dateFilter} ${typeFilter}
    
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `, queryParams);

  // Get balance at start of period (if date range specified)
  let openingBalance = null;
  if (startDate) {
    const balanceResult = await query(`
      SELECT 
        COALESCE(
          (SELECT balance FROM tenant.wallets WHERE id = $1) -
          COALESCE(SUM(
            CASE 
              WHEN t.sender_wallet_id = $1 THEN -(t.amount + COALESCE(t.fees, 0))
              ELSE t.amount
            END
          ), 0), 
          (SELECT balance FROM tenant.wallets WHERE id = $1)
        ) as opening_balance
      FROM tenant.transactions t
      WHERE (t.sender_wallet_id = $1 OR t.recipient_account_number = (SELECT wallet_number FROM tenant.wallets WHERE id = $1))
        AND t.created_at >= $2
        AND t.status = 'completed'
    `, [walletId, startDate]);
    
    openingBalance = parseFloat(balanceResult.rows[0].opening_balance || 0);
  }

  const transactions = transactionsResult.rows.map(tx => ({
    id: tx.id,
    referenceNumber: tx.reference_number,
    amount: parseFloat(tx.amount),
    fees: parseFloat(tx.fees || 0),
    description: tx.description,
    type: tx.transaction_type,
    status: tx.status,
    entryType: tx.entry_type,
    counterparty: {
      accountNumber: tx.recipient_account_number,
      bankCode: tx.recipient_bank_code,
      name: tx.recipient_name
    },
    createdAt: tx.created_at,
    completedAt: tx.completed_at
  }));

  res.json({
    success: true,
    data: {
      walletNumber,
      statement: {
        openingBalance,
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: transactions.length === parseInt(limit)
        }
      }
    }
  });
}));

/**
 * POST /api/wallets/set-pin
 * Set or change transaction PIN
 */
router.post('/set-pin', authenticateToken, validateTenantAccess, [
  body('newPin'.isLength({ min: 4, max: 4 }).isNumeric().withMessage('PIN must be 4 digits',
  body('currentPin'.optional().isLength({ min: 4, max: 4 }).isNumeric().withMessage('Current PIN must be 4 digits',
  body('confirmPin'.isLength({ min: 4, max: 4 }).isNumeric().withMessage('Confirm PIN must be 4 digits'
], asyncHandler(async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    throw errors.badRequest('Validation failed', 'VALIDATION_ERROR', validationErrors.array());
  }

  const { newPin, currentPin, confirmPin } = req.body;

  if (newPin !== confirmPin) {
    throw errors.badRequest('PINs do not match', 'PIN_MISMATCH';
  }

  // Get user's current PIN hash
  const userResult = await query(`
    SELECT transaction_pin_hash FROM tenant.users WHERE id = $1
  `, [req.user.id]);

  const user = userResult.rows[0];

  // If user has existing PIN, verify current PIN
  if (user.transaction_pin_hash && currentPin) {
    const isValidPin = await bcrypt.compare(currentPin, user.transaction_pin_hash);
    if (!isValidPin) {
      throw errors.unauthorized('Current PIN is incorrect', 'INVALID_PIN';
    }
  } else if (user.transaction_pin_hash && !currentPin) {
    throw errors.badRequest('Current PIN required', 'CURRENT_PIN_REQUIRED';
  }

  // Hash new PIN
  const saltRounds = 12;
  const newPinHash = await bcrypt.hash(newPin, saltRounds);

  // Update user's PIN
  await query(`
    UPDATE tenant.users 
    SET transaction_pin_hash = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `, [newPinHash, req.user.id]);

  res.json({
    success: true,
    message: user.transaction_pin_hash ? 'Transaction PIN updated successfully' : 'Transaction PIN set successfully'
  });
}));

/**
 * POST /api/wallets/verify-pin
 * Verify transaction PIN
 */
router.post('/verify-pin', authenticateToken, validateTenantAccess, [
  body('pin'.isLength({ min: 4, max: 4 }).isNumeric().withMessage('PIN must be 4 digits'
], asyncHandler(async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    throw errors.badRequest('Validation failed', 'VALIDATION_ERROR', validationErrors.array());
  }

  const { pin } = req.body;

  const userResult = await query(`
    SELECT transaction_pin_hash FROM tenant.users WHERE id = $1
  `, [req.user.id]);

  const user = userResult.rows[0];

  if (!user.transaction_pin_hash) {
    throw errors.badRequest('Transaction PIN not set', 'PIN_NOT_SET';
  }

  const isValidPin = await bcrypt.compare(pin, user.transaction_pin_hash);
  
  res.json({
    success: true,
    data: {
      isValid: isValidPin
    }
  });
}));

/**
 * GET /api/wallets/limits
 * Get transaction limits
 */
router.get('/limits', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  const userResult = await query(`
    SELECT daily_limit, monthly_limit FROM tenant.users WHERE id = $1
  `, [req.user.id]);

  const user = userResult.rows[0];

  // Get current usage
  const today = new Date().toISOString().split('T'[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const usageResult = await query(`
    SELECT 
      COALESCE(SUM(CASE WHEN DATE(t.created_at) = $1 THEN t.amount ELSE 0 END), 0) as daily_spent,
      COALESCE(SUM(CASE WHEN t.created_at >= $2 THEN t.amount ELSE 0 END), 0) as monthly_spent
    FROM tenant.transactions t
    JOIN tenant.wallets w ON t.sender_wallet_id = w.id
    WHERE w.user_id = $3 AND t.status IN ('completed', 'pending'
  `, [today, monthStart, req.user.id]);

  const usage = usageResult.rows[0];
  const dailyLimit = user.daily_limit || 500000;
  const monthlyLimit = user.monthly_limit || 5000000;

  res.json({
    success: true,
    data: {
      limits: {
        daily: {
          limit: dailyLimit,
          used: parseFloat(usage.daily_spent),
          remaining: dailyLimit - parseFloat(usage.daily_spent)
        },
        monthly: {
          limit: monthlyLimit,
          used: parseFloat(usage.monthly_spent),
          remaining: monthlyLimit - parseFloat(usage.monthly_spent)
        }
      }
    }
  });
}));

/**
 * POST /api/wallets/request-limit-increase
 * Request transaction limit increase
 */
router.post('/request-limit-increase', authenticateToken, validateTenantAccess, [
  body('type'.isIn(['daily', 'monthly']).withMessage('Type must be daily or monthly',
  body('requestedAmount'.isFloat({ min: 1 }).withMessage('Valid amount required',
  body('reason'.isLength({ min: 10, max: 500 }).withMessage('Reason must be 10-500 characters'
], asyncHandler(async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    throw errors.badRequest('Validation failed', 'VALIDATION_ERROR', validationErrors.array());
  }

  const { type, requestedAmount, reason } = req.body;

  // Create limit increase request
  const requestResult = await query(`
    INSERT INTO tenant.limit_increase_requests (
      user_id, tenant_id, limit_type, current_limit, requested_limit, 
      reason, status, created_at
    ) VALUES ($1, $2, $3, 
      (SELECT CASE WHEN $3 = 'daily' THEN daily_limit ELSE monthly_limit END FROM tenant.users WHERE id = $1),
      $4, $5, 'pending', CURRENT_TIMESTAMP
    ) RETURNING id, created_at
  `, [req.user.id, req.user.tenantId, type, requestedAmount, reason]);

  res.json({
    success: true,
    message: 'Limit increase request submitted successfully',
    data: {
      requestId: requestResult.rows[0].id,
      submittedAt: requestResult.rows[0].created_at
    }
  });
}));

/**
 * GET /api/wallets/all
 * Get all wallets (admin only)
 */
router.get('/all', authenticateToken, requireRole(['admin']), validateTenantAccess, asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  let statusFilter = '';
  const queryParams = [req.user.tenantId, limit, offset];

  if (status) {
    statusFilter = 'AND w.status = $4';
    queryParams.push(status);
  }

  const walletsResult = await query(`
    SELECT w.*, u.first_name, u.last_name, u.email, u.phone_number
    FROM tenant.wallets w
    JOIN tenant.users u ON w.user_id = u.id
    WHERE w.tenant_id = $1 ${statusFilter}
    ORDER BY w.created_at DESC
    LIMIT $2 OFFSET $3
  `, queryParams);

  const wallets = walletsResult.rows.map(w => ({
    id: w.id,
    walletNumber: w.wallet_number,
    accountType: w.wallet_type,
    balance: parseFloat(w.balance),
    availableBalance: parseFloat(w.available_balance),
    currency: w.currency,
    status: w.status,
    owner: {
      id: w.user_id,
      name: `${w.first_name} ${w.last_name}`,
      email: w.email,
      phoneNumber: w.phone_number
    },
    createdAt: w.created_at,
    updatedAt: w.updated_at
  }));

  res.json({
    success: true,
    data: { wallets }
  });
}));

export default router;