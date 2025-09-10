/**
 * Enhanced Transfer Routes with NIBSS Integration
 * Complete money transfer system with real-time processing
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { query, transaction } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { validateTenantAccess } from '../middleware/tenant';
import { asyncHandler, errors } from '../middleware/errorHandler';
import { nibssService, NIBSSTransferRequest } from '../services/nibss';

const router = express.Router();

/**
 * POST /api/transfers/validate-recipient
 * Alias for account inquiry to match frontend API
 */
router.post('/validate-recipient', authenticateToken, validateTenantAccess, [
  body('accountNumber').isLength({ min: 10, max: 10 }).withMessage('Account number must be 10 digits'),
  body('bankCode').isLength({ min: 3, max: 3 }).withMessage('Bank code must be 3 digits'),
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

  const { accountNumber, bankCode } = req.body;

  try {
    const inquiryResult = await nibssService.accountInquiry({
      accountNumber,
      bankCode
    });

    if (!inquiryResult.success) {
      return res.status(400).json({
        success: false,
        error: inquiryResult.message,
        code: 'ACCOUNT_INQUIRY_FAILED'
      });
    }

    res.json({
      success: true,
      data: {
        accountNumber: inquiryResult.accountNumber,
        accountName: inquiryResult.accountName,
        bankName: inquiryResult.bankName,
        bankCode: inquiryResult.bankCode,
        isValid: true
      }
    });

  } catch (error) {
    throw errors.internalError('Account validation failed');
  }
}));

/**
 * POST /api/transfers/account-inquiry
 * Verify recipient account details before transfer
 */
router.post('/account-inquiry', authenticateToken, validateTenantAccess, [
  body('accountNumber').isLength({ min: 10, max: 10 }).withMessage('Account number must be 10 digits'),
  body('bankCode').isLength({ min: 3, max: 3 }).withMessage('Bank code must be 3 digits'),
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

  const { accountNumber, bankCode } = req.body;

  try {
    const inquiryResult = await nibssService.accountInquiry({
      accountNumber,
      bankCode
    });

    if (!inquiryResult.success) {
      return res.status(400).json({
        success: false,
        error: inquiryResult.message,
        code: 'ACCOUNT_INQUIRY_FAILED'
      });
    }

    res.json({
      success: true,
      data: {
        accountNumber: inquiryResult.accountNumber,
        accountName: inquiryResult.accountName,
        bankName: inquiryResult.bankName,
        bankCode: inquiryResult.bankCode
      }
    });

  } catch (error) {
    throw errors.internalError('Account inquiry failed');
  }
}));

/**
 * POST /api/transfers/initiate
 * Initiate a money transfer via NIBSS
 */
router.post('/initiate', authenticateToken, validateTenantAccess, [
  body('recipientAccountNumber').isLength({ min: 10, max: 10 }).withMessage('Account number must be 10 digits'),
  body('recipientBankCode').isLength({ min: 3, max: 3 }).withMessage('Bank code must be 3 digits'),
  body('recipientName').isLength({ min: 2, max: 100 }).withMessage('Recipient name is required'),
  body('amount').isFloat({ min: 100, max: 1000000 }).withMessage('Amount must be between ₦100 and ₦1,000,000'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description too long'),
  body('pin').isLength({ min: 4, max: 4 }).withMessage('Transaction PIN required'),
  body('saveRecipient').optional().isBoolean().withMessage('Save recipient must be boolean')
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
    description = 'Money transfer',
    pin,
    saveRecipient = false
  } = req.body;

  const userId = req.user.id;
  const tenantId = req.user.tenantId;

  try {
    // Start database transaction
    await query('BEGIN');

    // 1. Get user's primary wallet and verify PIN
    const walletResult = await query(`
      SELECT w.*, u.transaction_pin_hash, u.daily_limit, u.monthly_limit,
             u.first_name, u.last_name, u.account_number as source_account,
             t.bank_code as source_bank_code
      FROM tenant.wallets w
      JOIN tenant.users u ON w.user_id = u.id
      JOIN platform.tenants t ON u.tenant_id = t.id
      WHERE w.user_id = $1 AND w.tenant_id = $2 AND w.is_primary = true
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

    // 2. Verify transaction PIN
    const isPinValid = await bcrypt.compare(pin, wallet.transaction_pin_hash);
    if (!isPinValid) {
      await query('ROLLBACK');
      return res.status(401).json({
        success: false,
        error: 'Invalid transaction PIN',
        code: 'INVALID_PIN'
      });
    }

    // 3. Check wallet balance
    const transferAmount = parseFloat(amount);
    const currentBalance = parseFloat(wallet.balance);

    if (currentBalance < transferAmount) {
      await query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        code: 'INSUFFICIENT_BALANCE',
        data: {
          balance: currentBalance,
          required: transferAmount
        }
      });
    }

    // 4. Check daily and monthly limits
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().substring(0, 7);

    const limitsResult = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN DATE(created_at) = $1 THEN amount ELSE 0 END), 0) as daily_spent,
        COALESCE(SUM(CASE WHEN DATE(created_at) >= $2 THEN amount ELSE 0 END), 0) as monthly_spent
      FROM tenant.transfers 
      WHERE sender_id = $3 AND status IN ('pending', 'successful')
    `, [today, currentMonth + '-01', userId]);

    const limits = limitsResult.rows[0];
    const dailyLimit = parseFloat(wallet.daily_limit || '500000');
    const monthlyLimit = parseFloat(wallet.monthly_limit || '2000000');

    if ((limits.daily_spent + transferAmount) > dailyLimit) {
      await query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Daily transfer limit exceeded',
        code: 'DAILY_LIMIT_EXCEEDED',
        data: {
          dailyLimit,
          dailySpent: limits.daily_spent,
          requestedAmount: transferAmount
        }
      });
    }

    if ((limits.monthly_spent + transferAmount) > monthlyLimit) {
      await query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Monthly transfer limit exceeded',
        code: 'MONTHLY_LIMIT_EXCEEDED',
        data: {
          monthlyLimit,
          monthlySpent: limits.monthly_spent,
          requestedAmount: transferAmount
        }
      });
    }

    // 5. Generate unique transaction reference
    const reference = `ORP_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // 6. Save recipient if requested
    let recipientId = null;
    if (saveRecipient) {
      const existingRecipient = await query(`
        SELECT id FROM recipients 
        WHERE user_id = $1 AND account_number = $2 AND bank_code = $3
      `, [userId, recipientAccountNumber, recipientBankCode]);

      if (existingRecipient.rowCount === 0) {
        const recipientResult = await query(`
          INSERT INTO recipients (user_id, tenant_id, account_number, account_name, bank_code, bank_name, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
          RETURNING id
        `, [userId, tenantId, recipientAccountNumber, recipientName, recipientBankCode, 'Unknown Bank']);
        
        recipientId = recipientResult.rows[0].id;
      } else {
        recipientId = existingRecipient.rows[0].id;
      }
    }

    // 7. Create transfer record
    const transferResult = await query(`
      INSERT INTO tenant.transfers (
        sender_id, tenant_id, recipient_id, reference, amount, fee, description,
        recipient_account_number, recipient_bank_code, recipient_name,
        source_account_number, source_bank_code, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending', NOW())
      RETURNING id
    `, [
      userId, tenantId, recipientId, reference, transferAmount, 0,
      description, recipientAccountNumber, recipientBankCode, recipientName,
      wallet.source_account, wallet.source_bank_code
    ]);

    const transferId = transferResult.rows[0].id;

    // 8. Debit wallet (hold the amount)
    await query(`
      UPDATE tenant.wallets 
      SET balance = balance - $1, updated_at = NOW()
      WHERE id = $2
    `, [transferAmount, wallet.id]);

    // 9. Initiate NIBSS transfer
    const nibssRequest: NIBSSTransferRequest = {
      amount: amount,
      sourceAccountNumber: wallet.source_account,
      sourceBankCode: wallet.source_bank_code,
      destinationAccountNumber: recipientAccountNumber,
      destinationBankCode: recipientBankCode,
      narration: description.substring(0, 100), // NIBSS has character limit
      reference: reference,
      beneficiaryName: recipientName
    };

    const nibssResponse = await nibssService.initiateTransfer(nibssRequest);

    // 10. Update transfer with NIBSS response
    if (nibssResponse.success) {
      await query(`
        UPDATE tenant.transfers 
        SET status = $1, nibss_transaction_id = $2, nibss_session_id = $3, fee = $4, updated_at = NOW()
        WHERE id = $5
      `, [nibssResponse.status, nibssResponse.transactionId, nibssResponse.sessionId, 
          parseFloat(nibssResponse.fee || '0'), transferId]);

      // If successful, log the transaction
      if (nibssResponse.status === 'successful') {
        await query(`
          INSERT INTO transaction_logs (transfer_id, event_type, message, created_at)
          VALUES ($1, 'TRANSFER_COMPLETED', $2, NOW())
        `, [transferId, nibssResponse.message]);
      }
    } else {
      // Transfer failed, reverse the wallet debit
      await query(`
        UPDATE tenant.wallets 
        SET balance = balance + $1, updated_at = NOW()
        WHERE id = $2
      `, [transferAmount, wallet.id]);

      await query(`
        UPDATE tenant.transfers 
        SET status = 'failed', nibss_response_message = $1, updated_at = NOW()
        WHERE id = $2
      `, [nibssResponse.message, transferId]);

      await query(`
        INSERT INTO transaction_logs (transfer_id, event_type, message, created_at)
        VALUES ($1, 'TRANSFER_FAILED', $2, NOW())
      `, [transferId, nibssResponse.message]);
    }

    // Commit transaction
    await query('COMMIT');

    res.json({
      success: nibssResponse.success,
      data: {
        transferId,
        reference,
        status: nibssResponse.status,
        message: nibssResponse.message,
        amount: transferAmount,
        recipient: {
          accountNumber: recipientAccountNumber,
          accountName: recipientName,
          bankCode: recipientBankCode
        },
        fee: parseFloat(nibssResponse.fee || '0'),
        transactionId: nibssResponse.transactionId
      }
    });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Transfer Error:', error);
    throw errors.internalError('Transfer failed');
  }
}));

/**
 * GET /api/transfers/status/:reference
 * Check transfer status
 */
router.get('/status/:reference', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  const { reference } = req.params;
  const userId = req.user.id;

  const transferResult = await query(`
    SELECT t.*, 
           CASE WHEN t.sender_id = $1 THEN 'sent' ELSE 'received' END as direction
    FROM tenant.transfers t
    WHERE t.reference = $2 AND (t.sender_id = $1 OR t.recipient_id = $1)
  `, [userId, reference]);

  if (transferResult.rowCount === 0) {
    return res.status(404).json({
      success: false,
      error: 'Transfer not found',
      code: 'TRANSFER_NOT_FOUND'
    });
  }

  const transfer = transferResult.rows[0];

  // If transfer is pending, check with NIBSS
  if (transfer.status === 'pending' && transfer.nibss_transaction_id) {
    try {
      const statusResponse = await nibssService.getTransactionStatus({
        reference: transfer.reference,
        transactionId: transfer.nibss_transaction_id
      });

      // Update transfer status if changed
      if (statusResponse.status !== transfer.status) {
        await query(`
          UPDATE tenant.transfers 
          SET status = $1, nibss_response_message = $2, updated_at = NOW()
          WHERE id = $3
        `, [statusResponse.status, statusResponse.message, transfer.id]);

        transfer.status = statusResponse.status;
        transfer.nibss_response_message = statusResponse.message;
      }
    } catch (error) {
      console.error('Status check error:', error);
    }
  }

  res.json({
    success: true,
    data: {
      id: transfer.id,
      reference: transfer.reference,
      amount: parseFloat(transfer.amount),
      status: transfer.status,
      direction: transfer.direction,
      description: transfer.description,
      recipient: {
        accountNumber: transfer.recipient_account_number,
        accountName: transfer.recipient_name,
        bankCode: transfer.recipient_bank_code
      },
      fee: parseFloat(transfer.fee || '0'),
      createdAt: transfer.created_at,
      updatedAt: transfer.updated_at,
      transactionId: transfer.nibss_transaction_id
    }
  });
}));

/**
 * GET /api/transfers/history
 * Get user's transfer history with pagination
 */
router.get('/history', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = (page - 1) * limit;

  const transfers = await query(`
    SELECT t.*,
           CASE WHEN t.sender_id = $1 THEN 'sent' ELSE 'received' END as direction,
           u.first_name as sender_first_name, u.last_name as sender_last_name
    FROM tenant.transfers t
    LEFT JOIN tenant.users u ON t.sender_id = u.id
    WHERE t.sender_id = $1 OR t.recipient_id = $1
    ORDER BY t.created_at DESC
    LIMIT $2 OFFSET $3
  `, [userId, limit, offset]);

  const countResult = await query(`
    SELECT COUNT(*) as total
    FROM tenant.transfers
    WHERE sender_id = $1 OR recipient_id = $1
  `, [userId]);

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: {
      transfers: transfers.rows.map(t => ({
        id: t.id,
        reference: t.reference,
        amount: parseFloat(t.amount),
        status: t.status,
        direction: t.direction,
        description: t.description,
        recipient: {
          accountNumber: t.recipient_account_number,
          accountName: t.recipient_name,
          bankCode: t.recipient_bank_code
        },
        fee: parseFloat(t.fee || '0'),
        createdAt: t.created_at,
        senderName: t.sender_first_name ? `${t.sender_first_name} ${t.sender_last_name}` : null
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
 * GET /api/transfers/banks
 * Get list of supported banks
 */
router.get('/banks', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  try {
    const banksResponse = await nibssService.getBankList();

    if (!banksResponse.success) {
      return res.status(503).json({
        success: false,
        error: 'Unable to fetch bank list',
        code: 'SERVICE_UNAVAILABLE'
      });
    }

    res.json({
      success: true,
      data: {
        banks: banksResponse.banks.filter(bank => bank.active)
      }
    });

  } catch (error) {
    throw errors.internalError('Failed to fetch bank list');
  }
}));

/**
 * GET /api/transfers/recipients
 * Get user's saved recipients
 */
router.get('/recipients', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const recipients = await query(`
    SELECT r.*, COUNT(t.id) as transfer_count, MAX(t.created_at) as last_transfer
    FROM recipients r
    LEFT JOIN transfers t ON r.id = t.recipient_id
    WHERE r.user_id = $1
    GROUP BY r.id
    ORDER BY last_transfer DESC NULLS LAST, r.created_at DESC
  `, [userId]);

  res.json({
    success: true,
    data: {
      recipients: recipients.rows.map(r => ({
        id: r.id,
        accountNumber: r.account_number,
        accountName: r.account_name,
        bankCode: r.bank_code,
        bankName: r.bank_name,
        transferCount: parseInt(r.transfer_count),
        lastTransfer: r.last_transfer,
        createdAt: r.created_at
      }))
    }
  });
}));

export default router;