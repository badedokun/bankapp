/**
 * Enhanced Wallet Management Routes
 * Complete wallet operations, balance management, and funding
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { query } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { validateTenantAccess } from '../middleware/tenant';
import { asyncHandler, errors } from '../middleware/errorHandler';

const router = express.Router();

/**
 * GET /api/wallets/balance
 * Get user's primary wallet balance and details
 */
router.get('/balance', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  try {
    const walletResult = await query(`
      SELECT w.*, u.first_name, u.last_name, u.account_number, u.kyc_level,
             u.daily_limit, u.monthly_limit
      FROM tenant.wallets w
      JOIN tenant.users u ON w.user_id = u.id
      WHERE w.user_id = $1 AND w.tenant_id = $2 AND w.is_primary = true
    `, [req.user.id, req.user.tenantId]);

    if (walletResult.rowCount === 0) {
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
  `, [today, currentMonth + '-01', req.user.id]);

  const spending = spendingResult.rows[0];

  res.json({
    success: true,
    data: {
      accountNumber: wallet.account_number,
      balance: parseFloat(wallet.balance),
      currency: wallet.currency || 'NGN',
      walletType: wallet.wallet_type,
      status: wallet.status || 'active',
      owner: {
        name: `${wallet.first_name} ${wallet.last_name}`,
        kycLevel: wallet.kyc_level
      },
      limits: {
        dailyLimit: parseFloat(wallet.daily_limit || '100000'),
        monthlyLimit: parseFloat(wallet.monthly_limit || '500000'),
        dailySpent: parseFloat(spending.daily_spent),
        monthlySpent: parseFloat(spending.monthly_spent),
        dailyRemaining: parseFloat(wallet.daily_limit || '100000') - parseFloat(spending.daily_spent),
        monthlyRemaining: parseFloat(wallet.monthly_limit || '500000') - parseFloat(spending.monthly_spent)
      },
      createdAt: wallet.created_at,
      updatedAt: wallet.updated_at
    }
  });

  } catch (error) {
    console.error('Wallet balance fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch wallet balance',
      code: 'INTERNAL_ERROR'
    });
  }
}));

/**
 * GET /api/wallets/all
 * Get all user wallets (primary, savings, etc.)
 */
router.get('/all', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  const walletsResult = await query(`
    SELECT w.*, u.first_name, u.last_name
    FROM tenant.wallets w
    JOIN tenant.users u ON w.user_id = u.id
    WHERE w.user_id = $1 AND w.tenant_id = $2
    ORDER BY w.is_primary DESC, w.created_at ASC
  `, [req.user.id, req.user.tenantId]);

  const wallets = walletsResult.rows.map(wallet => ({
    id: wallet.id,
    walletType: wallet.wallet_type,
    balance: parseFloat(wallet.balance),
    currency: wallet.currency || 'NGN',
    isPrimary: wallet.is_primary,
    status: wallet.status || 'active',
    createdAt: wallet.created_at,
    updatedAt: wallet.updated_at
  }));

  res.json({
    success: true,
    data: { wallets }
  });
}));

/**
 * POST /api/wallets/create
 * Create a new wallet (savings, investment, etc.)
 */
router.post('/create', authenticateToken, validateTenantAccess, [
  body('walletType').isIn(['savings', 'investment', 'goal']).withMessage('Valid wallet type required'),
  body('name').optional().isLength({ min: 3, max: 50 }).withMessage('Wallet name must be 3-50 characters'),
  body('description').optional().isLength({ max: 200 }).withMessage('Description too long'),
  body('targetAmount').optional().isFloat({ min: 1000 }).withMessage('Target amount must be at least ₦1,000')
], asyncHandler(async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: validationErrors.array()
    });
  }

  const { walletType, name, description, targetAmount } = req.body;
  const userId = req.user.id;
  const tenantId = req.user.tenantId;

  try {
    // Check wallet limit (max 5 wallets per user)
    const countResult = await query(`
      SELECT COUNT(*) as wallet_count
      FROM tenant.wallets
      WHERE user_id = $1 AND tenant_id = $2
    `, [userId, tenantId]);

    if (parseInt(countResult.rows[0].wallet_count) >= 5) {
      return res.status(400).json({
        success: false,
        error: 'Maximum wallet limit reached (5 wallets)',
        code: 'WALLET_LIMIT_EXCEEDED'
      });
    }

    // Create new wallet
    const walletResult = await query(`
      INSERT INTO tenant.wallets (
        user_id, tenant_id, wallet_type, wallet_name, description, 
        target_amount, currency, balance, is_primary, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'NGN', 0.00, false, 'active', NOW())
      RETURNING id, wallet_type, wallet_name, balance, created_at
    `, [userId, tenantId, walletType, name, description, targetAmount]);

    const newWallet = walletResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Wallet created successfully',
      data: {
        id: newWallet.id,
        walletType: newWallet.wallet_type,
        name: newWallet.wallet_name,
        balance: parseFloat(newWallet.balance),
        createdAt: newWallet.created_at
      }
    });

  } catch (error) {
    console.error('Wallet creation error:', error);
    throw errors.internalError('Wallet creation failed');
  }
}));

/**
 * POST /api/wallets/transfer-between
 * Transfer money between user's own wallets
 */
router.post('/transfer-between', authenticateToken, validateTenantAccess, [
  body('fromWalletId').isUUID().withMessage('Valid source wallet ID required'),
  body('toWalletId').isUUID().withMessage('Valid destination wallet ID required'),
  body('amount').isFloat({ min: 100 }).withMessage('Amount must be at least ₦100'),
  body('pin').isLength({ min: 4, max: 4 }).withMessage('Transaction PIN required'),
  body('description').optional().isLength({ max: 200 }).withMessage('Description too long')
], asyncHandler(async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: validationErrors.array()
    });
  }

  const { fromWalletId, toWalletId, amount, pin, description = 'Internal transfer' } = req.body;
  const userId = req.user.id;
  const tenantId = req.user.tenantId;

  if (fromWalletId === toWalletId) {
    return res.status(400).json({
      success: false,
      error: 'Cannot transfer to the same wallet',
      code: 'SAME_WALLET_TRANSFER'
    });
  }

  try {
    await query('BEGIN');

    // Verify PIN
    const userResult = await query(`
      SELECT transaction_pin_hash FROM tenant.users WHERE id = $1
    `, [userId]);

    const isPinValid = await bcrypt.compare(pin, userResult.rows[0].transaction_pin_hash);
    if (!isPinValid) {
      await query('ROLLBACK');
      return res.status(401).json({
        success: false,
        error: 'Invalid transaction PIN',
        code: 'INVALID_PIN'
      });
    }

    // Get both wallets and verify ownership
    const walletsResult = await query(`
      SELECT id, wallet_type, balance, wallet_name
      FROM tenant.wallets
      WHERE id IN ($1, $2) AND user_id = $3 AND tenant_id = $4
    `, [fromWalletId, toWalletId, userId, tenantId]);

    if (walletsResult.rowCount !== 2) {
      await query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'One or both wallets not found',
        code: 'WALLET_NOT_FOUND'
      });
    }

    const wallets = walletsResult.rows;
    const fromWallet = wallets.find(w => w.id === fromWalletId);
    const toWallet = wallets.find(w => w.id === toWalletId);

    // Check source wallet balance
    const transferAmount = parseFloat(amount);
    const sourceBalance = parseFloat(fromWallet.balance);

    if (sourceBalance < transferAmount) {
      await query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance in source wallet',
        code: 'INSUFFICIENT_BALANCE',
        data: {
          available: sourceBalance,
          required: transferAmount
        }
      });
    }

    // Perform the transfer
    await query(`
      UPDATE tenant.wallets 
      SET balance = balance - $1, updated_at = NOW()
      WHERE id = $2
    `, [transferAmount, fromWalletId]);

    await query(`
      UPDATE tenant.wallets 
      SET balance = balance + $1, updated_at = NOW()
      WHERE id = $2
    `, [transferAmount, toWalletId]);

    // Create internal transfer record
    const transferResult = await query(`
      INSERT INTO tenant.internal_transfers (
        user_id, tenant_id, from_wallet_id, to_wallet_id, amount, 
        description, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'completed', NOW())
      RETURNING id, created_at
    `, [userId, tenantId, fromWalletId, toWalletId, transferAmount, description]);

    await query('COMMIT');

    res.json({
      success: true,
      message: 'Transfer completed successfully',
      data: {
        transferId: transferResult.rows[0].id,
        amount: transferAmount,
        fromWallet: {
          id: fromWallet.id,
          name: fromWallet.wallet_name,
          type: fromWallet.wallet_type
        },
        toWallet: {
          id: toWallet.id,
          name: toWallet.wallet_name,
          type: toWallet.wallet_type
        },
        description,
        completedAt: transferResult.rows[0].created_at
      }
    });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Internal transfer error:', error);
    throw errors.internalError('Transfer failed');
  }
}));

/**
 * POST /api/wallets/fund
 * Fund wallet using bank transfer or card (simulation)
 */
router.post('/fund', authenticateToken, validateTenantAccess, [
  body('walletId').optional().isUUID().withMessage('Valid wallet ID required'),
  body('amount').isFloat({ min: 100, max: 1000000 }).withMessage('Amount must be between ₦100 and ₦1,000,000'),
  body('method').isIn(['bank_transfer', 'card', 'ussd']).withMessage('Valid funding method required'),
  body('reference').optional().isLength({ min: 5, max: 50 }).withMessage('Reference must be 5-50 characters')
], asyncHandler(async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: validationErrors.array()
    });
  }

  const { walletId, amount, method, reference } = req.body;
  const userId = req.user.id;
  const tenantId = req.user.tenantId;

  try {
    await query('BEGIN');

    // Get target wallet (primary if not specified)
    const targetWalletId = walletId || null;
    const walletQuery = targetWalletId 
      ? 'SELECT id, wallet_type, wallet_name, balance FROM tenant.wallets WHERE id = $1 AND user_id = $2 AND tenant_id = $3'
      : 'SELECT id, wallet_type, wallet_name, balance FROM tenant.wallets WHERE user_id = $1 AND tenant_id = $2 AND is_primary = true';
    
    const params = targetWalletId 
      ? [targetWalletId, userId, tenantId]
      : [userId, tenantId];

    const walletResult = await query(walletQuery, params);

    if (walletResult.rowCount === 0) {
      await query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Wallet not found',
        code: 'WALLET_NOT_FOUND'
      });
    }

    const wallet = walletResult.rows[0];
    const fundingAmount = parseFloat(amount);
    const fundingReference = reference || `FUND_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Simulate funding process (would integrate with actual payment processor)
    const fundingResult = await simulateFunding(method, fundingAmount, fundingReference);

    if (!fundingResult.success) {
      await query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: fundingResult.message,
        code: 'FUNDING_FAILED'
      });
    }

    // Credit the wallet
    await query(`
      UPDATE tenant.wallets 
      SET balance = balance + $1, updated_at = NOW()
      WHERE id = $2
    `, [fundingAmount, wallet.id]);

    // Create funding record
    const fundingRecordResult = await query(`
      INSERT INTO tenant.wallet_fundings (
        user_id, tenant_id, wallet_id, amount, method, reference,
        external_reference, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', NOW())
      RETURNING id, created_at
    `, [userId, tenantId, wallet.id, fundingAmount, method, fundingReference, fundingResult.externalReference]);

    await query('COMMIT');

    res.json({
      success: true,
      message: 'Wallet funded successfully',
      data: {
        fundingId: fundingRecordResult.rows[0].id,
        amount: fundingAmount,
        method,
        reference: fundingReference,
        wallet: {
          id: wallet.id,
          name: wallet.wallet_name,
          type: wallet.wallet_type,
          newBalance: parseFloat(wallet.balance) + fundingAmount
        },
        completedAt: fundingRecordResult.rows[0].created_at
      }
    });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Wallet funding error:', error);
    throw errors.internalError('Wallet funding failed');
  }
}));

/**
 * GET /api/wallets/transactions
 * Get wallet transaction history with pagination
 */
router.get('/transactions', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = (page - 1) * limit;
  const walletId = req.query.walletId as string;

  // Base query for all wallet-related transactions
  let whereClause = 'WHERE (t.sender_id = $1 OR t.recipient_id = $1)';
  let params: any[] = [userId];

  if (walletId) {
    // If specific wallet ID is provided, filter by wallet transactions
    whereClause += ' AND EXISTS (SELECT 1 FROM tenant.wallets w WHERE w.id = $2 AND w.user_id = $1)';
    params.push(walletId);
  }

  const transactionsResult = await query(`
    SELECT 
      t.id, t.reference, t.amount, t.status, t.description, t.created_at,
      t.recipient_account_number, t.recipient_name, t.recipient_bank_code,
      CASE WHEN t.sender_id = $1 THEN 'debit' ELSE 'credit' END as type,
      CASE WHEN t.sender_id = $1 THEN 'sent' ELSE 'received' END as direction,
      'transfer' as transaction_type
    FROM tenant.transfers t
    ${whereClause}
    
    UNION ALL
    
    SELECT 
      wf.id, wf.reference, wf.amount, wf.status, 
      CONCAT('Wallet funding via ', wf.method) as description, wf.created_at,
      NULL as recipient_account_number, NULL as recipient_name, NULL as recipient_bank_code,
      'credit' as type, 'funding' as direction, 'funding' as transaction_type
    FROM tenant.wallet_fundings wf
    WHERE wf.user_id = $1 ${walletId ? 'AND wf.wallet_id = $2' : ''}
    
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `, params);

  const countResult = await query(`
    SELECT COUNT(*) as total FROM (
      SELECT id FROM tenant.transfers t ${whereClause}
      UNION ALL
      SELECT id FROM tenant.wallet_fundings wf WHERE wf.user_id = $1 ${walletId ? 'AND wf.wallet_id = $2' : ''}
    ) combined
  `, params);

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);

  const transactions = transactionsResult.rows.map(t => ({
    id: t.id,
    reference: t.reference,
    amount: parseFloat(t.amount),
    type: t.type,
    direction: t.direction,
    transactionType: t.transaction_type,
    status: t.status,
    description: t.description,
    recipient: t.recipient_account_number ? {
      accountNumber: t.recipient_account_number,
      accountName: t.recipient_name,
      bankCode: t.recipient_bank_code
    } : null,
    createdAt: t.created_at
  }));

  res.json({
    success: true,
    data: {
      transactions,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  });
}));

/**
 * GET /api/wallets/statement
 * Get wallet statement with transactions for a date range
 */
router.get('/statement', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const tenantId = req.user.tenantId;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  // Validate date parameters
  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: 'Start date and end date are required',
      code: 'MISSING_DATE_PARAMS'
    });
  }

  // Validate date format
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  
  if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
    return res.status(400).json({
      success: false,
      error: 'Invalid date format. Use YYYY-MM-DD',
      code: 'INVALID_DATE_FORMAT'
    });
  }

  try {
    // Get wallet details
    const walletResult = await query(`
      SELECT w.id, w.wallet_number, w.balance, u.first_name, u.last_name
      FROM tenant.wallets w
      JOIN tenant.users u ON w.user_id = u.id
      WHERE w.user_id = $1 AND w.tenant_id = $2 AND w.is_primary = true
    `, [userId, tenantId]);

    if (walletResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found',
        code: 'WALLET_NOT_FOUND'
      });
    }

    const wallet = walletResult.rows[0];

    // Get opening balance (balance at start date)
    const openingBalanceResult = await query(`
      SELECT COALESCE(
        (SELECT balance FROM tenant.wallet_balance_snapshots 
         WHERE wallet_id = $1 AND snapshot_date = $2),
        $3
      ) as opening_balance
    `, [wallet.id, startDate, wallet.balance]);

    const openingBalance = parseFloat(openingBalanceResult.rows[0]?.opening_balance || '0');

    // Get transactions for the period
    const transactionsResult = await query(`
      SELECT 
        t.id, t.reference, t.amount, t.status, t.description, t.created_at,
        t.recipient_account_number, t.recipient_name, t.recipient_bank_code,
        CASE WHEN t.sender_id = $1 THEN 'debit' ELSE 'credit' END as type,
        'transfer' as transaction_type
      FROM tenant.transfers t
      WHERE (t.sender_id = $1 OR t.recipient_id = $1)
        AND DATE(t.created_at) BETWEEN $2 AND $3
        AND t.status IN ('successful', 'completed')
      
      UNION ALL
      
      SELECT 
        wf.id, wf.reference, wf.amount, wf.status,
        CONCAT('Wallet funding via ', wf.method) as description, wf.created_at,
        NULL, NULL, NULL, 'credit' as type, 'funding' as transaction_type
      FROM tenant.wallet_fundings wf
      WHERE wf.user_id = $1 
        AND DATE(wf.created_at) BETWEEN $2 AND $3
        AND wf.status = 'completed'
        
      ORDER BY created_at ASC
    `, [userId, startDate, endDate]);

    const transactions = transactionsResult.rows.map(t => ({
      id: t.id,
      reference: t.reference,
      amount: parseFloat(t.amount),
      type: t.type,
      transactionType: t.transaction_type,
      status: t.status,
      description: t.description,
      recipient: t.recipient_account_number ? {
        accountNumber: t.recipient_account_number,
        accountName: t.recipient_name,
        bankCode: t.recipient_bank_code
      } : null,
      date: t.created_at
    }));

    // Calculate running balance
    let runningBalance = openingBalance;
    const transactionsWithBalance = transactions.map(t => {
      if (t.type === 'credit') {
        runningBalance += t.amount;
      } else {
        runningBalance -= t.amount;
      }
      return { ...t, balance: runningBalance };
    });

    res.json({
      success: true,
      data: {
        statement: {
          walletNumber: wallet.wallet_number,
          accountHolder: `${wallet.first_name} ${wallet.last_name}`,
          period: { startDate, endDate },
          openingBalance,
          closingBalance: runningBalance,
          transactions: transactionsWithBalance
        }
      }
    });

  } catch (error) {
    console.error('Statement generation error:', error);
    throw errors.internalError('Failed to generate statement');
  }
}));

/**
 * PUT /api/wallets/set-pin
 * Set or update transaction PIN
 */
router.put('/set-pin', authenticateToken, validateTenantAccess, [
  body('pin').isLength({ min: 4, max: 4 }).withMessage('PIN must be exactly 4 digits'),
  body('confirmPin').isLength({ min: 4, max: 4 }).withMessage('Confirm PIN must be exactly 4 digits'),
  body('currentPin').optional().isLength({ min: 4, max: 4 }).withMessage('Current PIN must be exactly 4 digits')
], asyncHandler(async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: validationErrors.array()
    });
  }

  const { pin, confirmPin, currentPin } = req.body;
  const userId = req.user.id;

  // Validate PIN confirmation
  if (pin !== confirmPin) {
    return res.status(400).json({
      success: false,
      error: 'PIN and confirm PIN do not match',
      code: 'PIN_MISMATCH'
    });
  }

  try {
    // Get current PIN hash
    const userResult = await query(`
      SELECT transaction_pin_hash FROM tenant.users WHERE id = $1
    `, [userId]);

    const user = userResult.rows[0];
    
    // If user has existing PIN, verify current PIN
    if (user.transaction_pin_hash && currentPin) {
      const isPinValid = await bcrypt.compare(currentPin, user.transaction_pin_hash);
      if (!isPinValid) {
        return res.status(401).json({
          success: false,
          error: 'Current PIN is incorrect',
          code: 'INVALID_CURRENT_PIN'
        });
      }
    } else if (user.transaction_pin_hash && !currentPin) {
      return res.status(400).json({
        success: false,
        error: 'Current PIN is required to update existing PIN',
        code: 'CURRENT_PIN_REQUIRED'
      });
    }

    // Hash new PIN
    const saltRounds = 12;
    const pinHash = await bcrypt.hash(pin, saltRounds);

    // Update PIN
    await query(`
      UPDATE tenant.users 
      SET transaction_pin_hash = $1, updated_at = NOW()
      WHERE id = $2
    `, [pinHash, userId]);

    res.json({
      success: true,
      message: 'Transaction PIN set successfully'
    });

  } catch (error) {
    console.error('PIN setting error:', error);
    throw errors.internalError('Failed to set transaction PIN');
  }
}));

/**
 * POST /api/wallets/verify-pin
 * Verify transaction PIN
 */
router.post('/verify-pin', authenticateToken, validateTenantAccess, [
  body('pin').isLength({ min: 4, max: 4 }).withMessage('PIN must be exactly 4 digits')
], asyncHandler(async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: validationErrors.array()
    });
  }

  const { pin } = req.body;
  const userId = req.user.id;

  try {
    // Get PIN hash
    const userResult = await query(`
      SELECT transaction_pin_hash FROM tenant.users WHERE id = $1
    `, [userId]);

    const user = userResult.rows[0];
    
    if (!user.transaction_pin_hash) {
      return res.status(400).json({
        success: false,
        error: 'Transaction PIN not set',
        code: 'PIN_NOT_SET'
      });
    }

    // Verify PIN
    const isPinValid = await bcrypt.compare(pin, user.transaction_pin_hash);
    
    if (!isPinValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid transaction PIN',
        code: 'INVALID_PIN'
      });
    }

    res.json({
      success: true,
      message: 'PIN verified successfully'
    });

  } catch (error) {
    console.error('PIN verification error:', error);
    throw errors.internalError('Failed to verify PIN');
  }
}));

/**
 * GET /api/wallets/limits
 * Get user transaction limits
 */
router.get('/limits', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const tenantId = req.user.tenantId;

  try {
    // Get user limits
    const userResult = await query(`
      SELECT u.daily_limit, u.monthly_limit, u.kyc_level,
             w.balance
      FROM tenant.users u
      JOIN tenant.wallets w ON u.id = w.user_id AND w.is_primary = true
      WHERE u.id = $1 AND u.tenant_id = $2
    `, [userId, tenantId]);

    if (userResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'User or wallet not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];

    // Calculate current spending
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

    res.json({
      success: true,
      data: {
        limits: {
          dailyLimit: parseFloat(user.daily_limit || '100000'),
          monthlyLimit: parseFloat(user.monthly_limit || '500000'),
          dailySpent: parseFloat(spending.daily_spent),
          monthlySpent: parseFloat(spending.monthly_spent),
          dailyRemaining: parseFloat(user.daily_limit || '100000') - parseFloat(spending.daily_spent),
          monthlyRemaining: parseFloat(user.monthly_limit || '500000') - parseFloat(spending.monthly_spent)
        },
        kycLevel: user.kyc_level,
        walletBalance: parseFloat(user.balance)
      }
    });

  } catch (error) {
    console.error('Limits fetch error:', error);
    throw errors.internalError('Failed to fetch transaction limits');
  }
}));

// Private method for funding simulation
async function simulateFunding(method: string, amount: number, reference: string): Promise<{
  success: boolean;
  message: string;
  externalReference?: string;
}> {
  // STUB: Simulate different funding methods
  // In production, this would integrate with Paystack, Flutterwave, etc.
  
  // Simulate some failure scenarios for testing
  if (amount > 500000) {
    return {
      success: false,
      message: 'Amount exceeds single transaction limit for this method'
    };
  }

  if (method === 'card' && Math.random() < 0.1) {
    return {
      success: false,
      message: 'Card declined by issuing bank'
    };
  }

  // Simulate successful funding
  return {
    success: true,
    message: 'Funding processed successfully',
    externalReference: `EXT_${Date.now()}_${method.toUpperCase()}`
  };
}

export default router;