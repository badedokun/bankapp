/**
 * OrokiiPay Transaction Processing Routes
 * Comprehensive transaction management for banking operations
 * Includes bill payments, airtime, data, and transaction utilities
 */

import express from 'express';
import { body, query as queryValidator, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { query, transaction } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { validateTenantAccess } from '../middleware/tenant';
import { asyncHandler, errors } from '../middleware/errorHandler';

const router = express.Router();

/**
 * POST /api/transactions/bill-payment
 * Process bill payments (electricity, water, cable TV, etc.)
 */
router.post('/bill-payment', authenticateToken, validateTenantAccess, [
  body('billType').isIn(['electricity', 'water', 'cable_tv', 'internet', 'education', 'insurance']).withMessage('Invalid bill type'),
  body('providerId').notEmpty().withMessage('Provider ID is required'),
  body('customerNumber').isLength({ min: 4, max: 20 }).withMessage('Invalid customer number'),
  body('amount').isFloat({ min: 100, max: 500000 }).withMessage('Amount must be between ₦100 and ₦500,000'),
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

  const { billType, providerId, customerNumber, amount, pin, description } = req.body;
  const userId = req.user.id;
  const tenantId = req.user.tenantId;

  try {
    await query('BEGIN');

    // 1. Verify user wallet and PIN
    const walletResult = await query(`
      SELECT w.*, u.transaction_pin_hash, u.first_name, u.last_name
      FROM wallets w
      JOIN users u ON w.user_id = u.id
      WHERE w.user_id = $1 AND w.tenant_id = $2 AND w.status = 'active'
    `, [userId, tenantId]);

    if (walletResult.rowCount === 0) {
      await query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Wallet not found',
        code: 'WALLET_NOT_FOUND'
      });
    }

    const wallet = walletResult.rows[0];

    // 2. Verify PIN
    const isPinValid = await bcrypt.compare(pin, wallet.transaction_pin_hash);
    if (!isPinValid) {
      await query('ROLLBACK');
      return res.status(401).json({
        success: false,
        error: 'Invalid transaction PIN',
        code: 'INVALID_PIN'
      });
    }

    // 3. Check balance
    const paymentAmount = parseFloat(amount);
    const serviceFee = Math.max(50, paymentAmount * 0.01); // 1% fee, minimum ₦50
    const totalAmount = paymentAmount + serviceFee;

    if (parseFloat(wallet.balance) < totalAmount) {
      await query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        code: 'INSUFFICIENT_BALANCE',
        data: {
          balance: parseFloat(wallet.balance),
          required: totalAmount,
          breakdown: {
            billAmount: paymentAmount,
            serviceFee: serviceFee
          }
        }
      });
    }

    // 4. Get provider information
    const providerResult = await query(`
      SELECT * FROM bill_providers 
      WHERE id = $1 AND bill_type = $2 AND status = 'active'
    `, [providerId, billType]);

    if (providerResult.rowCount === 0) {
      await query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Invalid service provider',
        code: 'INVALID_PROVIDER'
      });
    }

    const provider = providerResult.rows[0];

    // 5. Generate transaction reference
    const reference = `BILL_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // 6. Create bill payment transaction
    const transactionResult = await query(`
      INSERT INTO transactions (
        user_id, tenant_id, reference, type, amount, fee, status,
        description, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, 'bill_payment', $4, $5, 'processing', $6, $7, NOW(), NOW())
      RETURNING id
    `, [
      userId, tenantId, reference, paymentAmount, serviceFee,
      description || `${billType} bill payment to ${provider.name}`,
      JSON.stringify({
        billType,
        providerId,
        providerName: provider.name,
        customerNumber,
        customerInfo: null // Will be populated after validation
      })
    ]);

    const transactionId = transactionResult.rows[0].id;

    // 7. Debit wallet
    await query(`
      UPDATE wallets 
      SET balance = balance - $1, updated_at = NOW()
      WHERE id = $2
    `, [totalAmount, wallet.id]);

    // 8. Create wallet transaction entry
    await query(`
      INSERT INTO wallet_transactions (
        wallet_id, transaction_id, reference, type, amount, 
        balance_before, balance_after, description, created_at
      ) VALUES ($1, $2, $3, 'debit', $4, $5, $6, $7, NOW())
    `, [
      wallet.id, transactionId, reference, totalAmount,
      parseFloat(wallet.balance), 
      parseFloat(wallet.balance) - totalAmount,
      `Bill payment: ${provider.name}`
    ]);

    // 9. Process bill payment (simulate external API call)
    // In production, this would call the actual bill provider API
    const paymentResult = await simulateBillPayment({
      provider: provider.name,
      customerNumber,
      amount: paymentAmount,
      reference
    });

    // 10. Update transaction status
    if (paymentResult.success) {
      await query(`
        UPDATE transactions 
        SET status = 'completed', 
            external_reference = $1,
            metadata = $2,
            updated_at = NOW()
        WHERE id = $3
      `, [
        paymentResult.providerReference,
        JSON.stringify({
          ...JSON.parse(transactionResult.rows[0].metadata || '{}'),
          customerInfo: paymentResult.customerInfo,
          providerReference: paymentResult.providerReference,
          token: paymentResult.token
        }),
        transactionId
      ]);
    } else {
      // Payment failed, reverse wallet debit
      await query(`
        UPDATE wallets 
        SET balance = balance + $1, updated_at = NOW()
        WHERE id = $2
      `, [totalAmount, wallet.id]);

      await query(`
        UPDATE transactions 
        SET status = 'failed', 
            failure_reason = $1,
            updated_at = NOW()
        WHERE id = $2
      `, [paymentResult.message, transactionId]);
    }

    await query('COMMIT');

    res.json({
      success: paymentResult.success,
      data: {
        transactionId,
        reference,
        status: paymentResult.success ? 'completed' : 'failed',
        amount: paymentAmount,
        fee: serviceFee,
        total: totalAmount,
        provider: {
          name: provider.name,
          id: providerId
        },
        customer: paymentResult.customerInfo || { number: customerNumber },
        token: paymentResult.token,
        message: paymentResult.message
      }
    });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Bill Payment Error:', error);
    throw errors.internalError('Bill payment failed');
  }
}));

/**
 * POST /api/transactions/airtime-purchase
 * Purchase airtime for any Nigerian network
 */
router.post('/airtime-purchase', authenticateToken, validateTenantAccess, [
  body('network').isIn(['MTN', 'GLO', 'AIRTEL', '9MOBILE']).withMessage('Invalid network provider'),
  body('phoneNumber').isMobilePhone('en-NG').withMessage('Invalid Nigerian phone number'),
  body('amount').isInt({ min: 100, max: 50000 }).withMessage('Amount must be between ₦100 and ₦50,000'),
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

  const { network, phoneNumber, amount, pin } = req.body;
  const userId = req.user.id;
  const tenantId = req.user.tenantId;

  try {
    await query('BEGIN');

    // Verify wallet and PIN
    const walletResult = await query(`
      SELECT w.*, u.transaction_pin_hash 
      FROM wallets w
      JOIN users u ON w.user_id = u.id
      WHERE w.user_id = $1 AND w.tenant_id = $2 AND w.status = 'active'
    `, [userId, tenantId]);

    if (walletResult.rowCount === 0) {
      await query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Wallet not found',
        code: 'WALLET_NOT_FOUND'
      });
    }

    const wallet = walletResult.rows[0];
    const isPinValid = await bcrypt.compare(pin, wallet.transaction_pin_hash);
    
    if (!isPinValid) {
      await query('ROLLBACK');
      return res.status(401).json({
        success: false,
        error: 'Invalid transaction PIN',
        code: 'INVALID_PIN'
      });
    }

    const purchaseAmount = parseInt(amount);
    const serviceFee = 0; // No fee for airtime purchases
    const totalAmount = purchaseAmount + serviceFee;

    if (parseFloat(wallet.balance) < totalAmount) {
      await query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        code: 'INSUFFICIENT_BALANCE',
        data: {
          balance: parseFloat(wallet.balance),
          required: totalAmount
        }
      });
    }

    const reference = `AIR_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create transaction
    const transactionResult = await query(`
      INSERT INTO transactions (
        user_id, tenant_id, reference, type, amount, fee, status,
        description, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, 'airtime_purchase', $4, $5, 'processing', $6, $7, NOW(), NOW())
      RETURNING id
    `, [
      userId, tenantId, reference, purchaseAmount, serviceFee,
      `${network} Airtime purchase for ${phoneNumber}`,
      JSON.stringify({ network, phoneNumber })
    ]);

    const transactionId = transactionResult.rows[0].id;

    // Debit wallet
    await query(`
      UPDATE wallets 
      SET balance = balance - $1, updated_at = NOW()
      WHERE id = $2
    `, [totalAmount, wallet.id]);

    // Simulate airtime purchase
    const purchaseResult = await simulateAirtimePurchase({
      network,
      phoneNumber,
      amount: purchaseAmount,
      reference
    });

    // Update transaction status
    const finalStatus = purchaseResult.success ? 'completed' : 'failed';
    await query(`
      UPDATE transactions 
      SET status = $1, 
          external_reference = $2,
          ${purchaseResult.success ? '' : 'failure_reason = $3,'}
          updated_at = NOW()
      WHERE id = ${purchaseResult.success ? '$3' : '$4'}
    `, purchaseResult.success 
      ? [finalStatus, purchaseResult.providerReference, transactionId]
      : [finalStatus, purchaseResult.providerReference, purchaseResult.message, transactionId]
    );

    if (!purchaseResult.success) {
      // Reverse wallet debit on failure
      await query(`
        UPDATE wallets 
        SET balance = balance + $1, updated_at = NOW()
        WHERE id = $2
      `, [totalAmount, wallet.id]);
    }

    await query('COMMIT');

    res.json({
      success: purchaseResult.success,
      data: {
        transactionId,
        reference,
        status: finalStatus,
        amount: purchaseAmount,
        network,
        phoneNumber,
        message: purchaseResult.message
      }
    });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Airtime Purchase Error:', error);
    throw errors.internalError('Airtime purchase failed');
  }
}));

/**
 * GET /api/transactions/history
 * Get user's complete transaction history with filtering and pagination
 */
router.get('/history', authenticateToken, validateTenantAccess, [
  queryValidator('page').optional().isInt({ min: 1 }).withMessage('Invalid page number'),
  queryValidator('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Invalid limit'),
  queryValidator('type').optional().isIn(['transfer', 'bill_payment', 'airtime_purchase', 'data_purchase']).withMessage('Invalid transaction type'),
  queryValidator('status').optional().isIn(['pending', 'processing', 'completed', 'failed']).withMessage('Invalid status'),
  queryValidator('startDate').optional().isISO8601().withMessage('Invalid start date'),
  queryValidator('endDate').optional().isISO8601().withMessage('Invalid end date')
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

  const userId = req.user.id;
  const tenantId = req.user.tenantId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = (page - 1) * limit;

  // Build dynamic query based on filters
  const filters = [];
  const params = [userId, tenantId];
  let paramIndex = 2;

  if (req.query.type) {
    filters.push(`t.type = $${++paramIndex}`);
    params.push(req.query.type);
  }

  if (req.query.status) {
    filters.push(`t.status = $${++paramIndex}`);
    params.push(req.query.status);
  }

  if (req.query.startDate) {
    filters.push(`t.created_at >= $${++paramIndex}`);
    params.push(req.query.startDate);
  }

  if (req.query.endDate) {
    filters.push(`t.created_at <= $${++paramIndex}`);
    params.push(req.query.endDate);
  }

  const whereClause = filters.length > 0 ? `AND ${filters.join(' AND ')}` : '';
  
  const transactionsQuery = `
    SELECT t.*, 
           CASE 
             WHEN t.type = 'transfer' THEN tr.recipient_name
             ELSE NULL
           END as recipient_name,
           CASE 
             WHEN t.type = 'transfer' THEN tr.recipient_account_number
             ELSE NULL
           END as recipient_account
    FROM transactions t
    LEFT JOIN transfers tr ON t.reference = tr.reference AND t.type = 'transfer'
    WHERE t.user_id = $1 AND t.tenant_id = $2 ${whereClause}
    ORDER BY t.created_at DESC
    LIMIT $${++paramIndex} OFFSET $${++paramIndex}
  `;

  params.push(limit, offset);

  const transactions = await query(transactionsQuery, params);

  // Get total count for pagination
  const countQuery = `
    SELECT COUNT(*) as total
    FROM transactions t
    WHERE t.user_id = $1 AND t.tenant_id = $2 ${whereClause}
  `;

  const countResult = await query(countQuery, params.slice(0, -2)); // Remove limit and offset
  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: {
      transactions: transactions.rows.map(t => ({
        id: t.id,
        reference: t.reference,
        type: t.type,
        amount: parseFloat(t.amount),
        fee: parseFloat(t.fee || '0'),
        status: t.status,
        description: t.description,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        metadata: t.metadata ? JSON.parse(t.metadata) : null,
        recipientName: t.recipient_name,
        recipientAccount: t.recipient_account
      })),
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
 * GET /api/transactions/:reference/status
 * Get detailed transaction status and information
 */
router.get('/:reference/status', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  const { reference } = req.params;
  const userId = req.user.id;
  const tenantId = req.user.tenantId;

  const transactionResult = await query(`
    SELECT * FROM transactions 
    WHERE reference = $1 AND user_id = $2 AND tenant_id = $3
  `, [reference, userId, tenantId]);

  if (transactionResult.rowCount === 0) {
    return res.status(404).json({
      success: false,
      error: 'Transaction not found',
      code: 'TRANSACTION_NOT_FOUND'
    });
  }

  const transaction = transactionResult.rows[0];

  res.json({
    success: true,
    data: {
      id: transaction.id,
      reference: transaction.reference,
      type: transaction.type,
      amount: parseFloat(transaction.amount),
      fee: parseFloat(transaction.fee || '0'),
      status: transaction.status,
      description: transaction.description,
      metadata: transaction.metadata ? JSON.parse(transaction.metadata) : null,
      externalReference: transaction.external_reference,
      failureReason: transaction.failure_reason,
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at
    }
  });
}));

/**
 * GET /api/transactions/bill-providers
 * Get list of available bill payment providers
 */
router.get('/bill-providers', authenticateToken, validateTenantAccess, [
  queryValidator('type').optional().isIn(['electricity', 'water', 'cable_tv', 'internet', 'education', 'insurance']).withMessage('Invalid bill type')
], asyncHandler(async (req, res) => {
  const filters = ['status = $1'];
  const params = ['active'];
  
  if (req.query.type) {
    filters.push('bill_type = $2');
    params.push(req.query.type as string);
  }

  const providers = await query(`
    SELECT * FROM bill_providers 
    WHERE ${filters.join(' AND ')}
    ORDER BY name
  `, params);

  res.json({
    success: true,
    data: {
      providers: providers.rows.map(p => ({
        id: p.id,
        name: p.name,
        billType: p.bill_type,
        description: p.description,
        logoUrl: p.logo_url,
        minAmount: parseFloat(p.min_amount || '100'),
        maxAmount: parseFloat(p.max_amount || '500000'),
        isActive: p.status === 'active'
      }))
    }
  });
}));

// Helper functions for simulation (replace with real API integrations in production)

async function simulateBillPayment(params: any) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate 95% success rate
  const success = Math.random() > 0.05;
  
  if (success) {
    return {
      success: true,
      message: 'Bill payment successful',
      providerReference: `PRV_${Date.now()}_${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      customerInfo: {
        name: 'John Doe',
        address: 'Lagos, Nigeria',
        accountType: 'Postpaid'
      },
      token: Math.random().toString(36).substr(2, 20).toUpperCase()
    };
  } else {
    return {
      success: false,
      message: 'Provider service temporarily unavailable. Please try again.',
      providerReference: null
    };
  }
}

async function simulateAirtimePurchase(params: any) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulate 98% success rate for airtime
  const success = Math.random() > 0.02;
  
  return {
    success,
    message: success ? 'Airtime purchase successful' : 'Network provider error. Please try again.',
    providerReference: success ? `${params.network}_${Date.now()}` : null
  };
}

export default router;