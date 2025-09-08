/**
 * Transfer Routes
 * Money transfer and transaction endpoints
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import { query, transaction } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { validateTenantAccess } from '../middleware/tenant';
import { asyncHandler, errors } from '../middleware/errorHandler';

const router = express.Router();

/**
 * POST /api/transfers/initiate
 * Initiate a money transfer
 */
router.post('/initiate', authenticateToken, validateTenantAccess, [
  body('recipientAccountNumber').isLength({ min: 10, max: 10 }).withMessage('Account number must be 10 digits'),
  body('recipientBankCode').isLength({ min: 3, max: 3 }).withMessage('Bank code must be 3 digits'),
  body('amount').isFloat({ min: 100 }).withMessage('Amount must be at least ₦100'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description too long'),
  body('pin').isLength({ min: 4, max: 4 }).withMessage('Transaction PIN required')
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

  const {
    recipientAccountNumber,
    recipientBankCode,
    recipientName,
    amount,
    description = '',
    pin
  } = req.body;

  const userId = req.user.id;
  const tenantId = req.user.tenantId;

  // Get user's wallet and verify PIN
  const walletResult = await query(`
    SELECT w.*, u.transaction_pin_hash, u.daily_limit, u.monthly_limit
    FROM tenant.wallets w
    JOIN tenant.users u ON w.user_id = u.id
    WHERE w.user_id = $1 AND w.wallet_type = 'main'
  `, [userId]);

  if (walletResult.rows.length === 0) {
    throw errors.notFound('Wallet not found', 'WALLET_NOT_FOUND');
  }

  const wallet = walletResult.rows[0];

  // Verify transaction PIN
  const bcrypt = await import('bcrypt');
  if (!wallet.transaction_pin_hash || !await bcrypt.compare(pin, wallet.transaction_pin_hash)) {
    throw errors.unauthorized('Invalid transaction PIN', 'INVALID_PIN');
  }

  // Check sufficient balance
  if (parseFloat(wallet.available_balance) < amount) {
    throw errors.badRequest('Insufficient balance', 'INSUFFICIENT_BALANCE');
  }

  // Check daily/monthly limits
  const today = new Date().toISOString().split('T'[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const limitsCheck = await query(`
    SELECT 
      COALESCE(SUM(CASE WHEN DATE(created_at) = $1 THEN amount ELSE 0 END), 0) as daily_spent,
      COALESCE(SUM(CASE WHEN created_at >= $2 THEN amount ELSE 0 END), 0) as monthly_spent
    FROM tenant.transactions
    WHERE sender_wallet_id = $3 AND status IN ('completed', 'pending'
  `, [today, monthStart, wallet.id]);

  const { daily_spent, monthly_spent } = limitsCheck.rows[0];
  const dailyLimit = wallet.daily_limit || 500000;
  const monthlyLimit = wallet.monthly_limit || 5000000;

  if (parseFloat(daily_spent) + amount > dailyLimit) {
    throw errors.badRequest('Daily transfer limit exceeded', 'DAILY_LIMIT_EXCEEDED';
  }

  if (parseFloat(monthly_spent) + amount > monthlyLimit) {
    throw errors.badRequest('Monthly transfer limit exceeded', 'MONTHLY_LIMIT_EXCEEDED';
  }

  // Create transfer transaction
  const transferResult = await transaction(async (client) => {
    // Create transaction record
    const transactionResult = await client.query(`
      INSERT INTO tenant.transactions (
        tenant_id, sender_user_id, sender_wallet_id, 
        recipient_account_number, recipient_bank_code, recipient_name,
        amount, fees, description, transaction_type, status,
        reference_number, session_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, 'transfer', 'pending',
        $10, $11
      ) RETURNING id, reference_number, created_at
    `, [
      tenantId, userId, wallet.id,
      recipientAccountNumber, recipientBankCode, recipientName || 'Unknown',
      amount, 0, description,
      `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      req.token.payload.sessionId
    ]);

    const transaction_record = transactionResult.rows[0];

    // Reserve funds in wallet (reduce available balance)
    await client.query(`
      UPDATE tenant.wallets 
      SET available_balance = available_balance - $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [amount, wallet.id]);

    // Log the transaction
    await client.query(`
      INSERT INTO tenant.transaction_logs (
        transaction_id, status, message, created_by
      ) VALUES ($1, 'pending', 'Transfer initiated', $2)
    `, [transaction_record.id, userId]);

    return transaction_record;
  });

  res.json({
    success: true,
    message: 'Transfer initiated successfully',
    data: {
      transactionId: transferResult.id,
      referenceNumber: transferResult.reference_number,
      amount,
      recipient: {
        accountNumber: recipientAccountNumber,
        bankCode: recipientBankCode,
        name: recipientName
      },
      status: 'pending',
      createdAt: transferResult.created_at
    }
  });
}));

/**
 * GET /api/transfers/history
 * Get user's transfer history
 */
router.get('/history', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, type } = req.query;
  const offset = (page - 1) * limit;

  let statusFilter = '';
  let typeFilter = '';
  const queryParams = [req.user.id, limit, offset];
  let paramCount = 3;

  if (status) {
    paramCount++;
    statusFilter = `AND t.status = $${paramCount}`;
    queryParams.push(status);
  }

  if (type) {
    paramCount++;
    typeFilter = `AND t.transaction_type = $${paramCount}`;
    queryParams.push(type);
  }

  const transactionsResult = await query(`
    SELECT t.id, t.reference_number, t.amount, t.fees, t.description,
           t.recipient_account_number, t.recipient_bank_code, t.recipient_name,
           t.transaction_type, t.status, t.created_at, t.completed_at,
           w.wallet_number as sender_wallet_number
    FROM tenant.transactions t
    JOIN tenant.wallets w ON t.sender_wallet_id = w.id
    WHERE t.sender_user_id = $1 ${statusFilter} ${typeFilter}
    ORDER BY t.created_at DESC
    LIMIT $2 OFFSET $3
  `, queryParams);

  // Get total count for pagination
  const countResult = await query(`
    SELECT COUNT(*) as total
    FROM tenant.transactions t
    WHERE t.sender_user_id = $1 ${statusFilter} ${typeFilter}
  `, [req.user.id, ...(status ? [status] : []), ...(type ? [type] : [])]);

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);

  const transactions = transactionsResult.rows.map(tx => ({
    id: tx.id,
    referenceNumber: tx.reference_number,
    amount: parseFloat(tx.amount),
    fees: parseFloat(tx.fees || 0),
    description: tx.description,
    type: tx.transaction_type,
    status: tx.status,
    recipient: {
      accountNumber: tx.recipient_account_number,
      bankCode: tx.recipient_bank_code,
      name: tx.recipient_name
    },
    sender: {
      walletNumber: tx.sender_wallet_number
    },
    createdAt: tx.created_at,
    completedAt: tx.completed_at
  }));

  res.json({
    success: true,
    data: {
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  });
}));

/**
 * GET /api/transfers/:id
 * Get specific transfer details
 */
router.get('/:id', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transactionResult = await query(`
    SELECT t.*, w.wallet_number as sender_wallet_number,
           u.first_name, u.last_name, u.email
    FROM tenant.transactions t
    JOIN tenant.wallets w ON t.sender_wallet_id = w.id
    JOIN tenant.users u ON t.sender_user_id = u.id
    WHERE t.id = $1 AND t.sender_user_id = $2
  `, [id, req.user.id]);

  if (transactionResult.rows.length === 0) {
    throw errors.notFound('Transaction not found', 'TRANSACTION_NOT_FOUND');
  }

  const transaction_record = transactionResult.rows[0];

  // Get transaction logs
  const logsResult = await query(`
    SELECT status, message, created_at, created_by
    FROM tenant.transaction_logs
    WHERE transaction_id = $1
    ORDER BY created_at ASC
  `, [id]);

  res.json({
    success: true,
    data: {
      id: transaction_record.id,
      referenceNumber: transaction_record.reference_number,
      amount: parseFloat(transaction_record.amount),
      fees: parseFloat(transaction_record.fees || 0),
      description: transaction_record.description,
      type: transaction_record.transaction_type,
      status: transaction_record.status,
      recipient: {
        accountNumber: transaction_record.recipient_account_number,
        bankCode: transaction_record.recipient_bank_code,
        name: transaction_record.recipient_name
      },
      sender: {
        walletNumber: transaction_record.sender_wallet_number,
        name: `${transaction_record.first_name} ${transaction_record.last_name}`,
        email: transaction_record.email
      },
      createdAt: transaction_record.created_at,
      completedAt: transaction_record.completed_at,
      logs: logsResult.rows
    }
  });
}));

/**
 * POST /api/transfers/validate-recipient
 * Validate recipient account details
 */
router.post('/validate-recipient', authenticateToken, validateTenantAccess, [
  body('accountNumber').isLength({ min: 10, max: 10 }).withMessage('Account number must be 10 digits'),
  body('bankCode').isLength({ min: 3, max: 3 }).withMessage('Bank code must be 3 digits')
], asyncHandler(async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    throw errors.badRequest('Validation failed', 'VALIDATION_ERROR', validationErrors.array());
  }

  const { accountNumber, bankCode } = req.body;

  // Mock bank verification (in production, integrate with actual bank APIs)
  const mockBankNames = {
    '011': 'First Bank of Nigeria',
    '030': 'Heritage Bank',
    '057': 'Zenith Bank',
    '058': 'GTBank',
    '033': 'United Bank for Africa'
  };

  const mockAccountNames = [
    'John Adebayo Ogundimu',
    'Fatima Aisha Mohammed', 
    'Emeka Chinedu Okafor',
    'Aisha Binta Usman',
    'Olumide Samuel Adeyemi'
  ];

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock validation - in production, call actual bank API
  const bankName = mockBankNames[bankCode];
  if (!bankName) {
    throw errors.badRequest('Invalid bank code', 'INVALID_BANK_CODE');
  }

  // Random account name for demo
  const accountName = mockAccountNames[Math.floor(Math.random() * mockAccountNames.length)];

  res.json({
    success: true,
    message: 'Account validation successful',
    data: {
      accountNumber,
      bankCode,
      bankName,
      accountName,
      isValid: true
    }
  });
}));

/**
 * GET /api/transfers/banks
 * Get list of supported banks
 */
router.get('/banks', authenticateToken, asyncHandler(async (req, res) => {
  // Mock bank list - in production, fetch from actual bank registry
  const banks = [
    { code: '011', name: 'First Bank of Nigeria', slug: 'first-bank' },
    { code: '030', name: 'Heritage Bank', slug: 'heritage-bank' },
    { code: '057', name: 'Zenith Bank', slug: 'zenith-bank' },
    { code: '058', name: 'Guaranty Trust Bank', slug: 'gtbank' },
    { code: '033', name: 'United Bank for Africa', slug: 'uba' },
    { code: '044', name: 'Access Bank', slug: 'access-bank' },
    { code: '050', name: 'Ecobank Nigeria', slug: 'ecobank' },
    { code: '076', name: 'Polaris Bank', slug: 'polaris-bank' },
    { code: '221', name: 'Stanbic IBTC Bank', slug: 'stanbic-ibtc' },
    { code: '214', name: 'First City Monument Bank', slug: 'fcmb' }
  ];

  res.json({
    success: true,
    data: { banks }
  });
}));

export default router;