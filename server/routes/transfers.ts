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
import { fraudDetectionService, FraudDetectionRequest } from '../services/fraud-detection';
import { InternalTransferService } from '../services/transfers/InternalTransferService';
import ExternalTransferService from '../services/transfers/ExternalTransferService';
import BillPaymentService from '../services/transfers/BillPaymentService';
import { generateTransferRef } from '../utils/referenceGenerator';
// TEMP: Disabled due to TypeScript errors
// import ScheduledPaymentService from '../services/transfers/ScheduledPaymentService';
// import InternationalTransferService from '../services/transfers/InternationalTransferService';
import TransactionReceiptService from '../services/transfers/TransactionReceiptService';
import NotificationService from '../services/transfers/NotificationService';
import {
  InternalTransferRequest,
  ExternalTransferRequest as ExtTransferRequest,
  BillPaymentRequest,
  InternationalTransferRequest,
  TransferError,
  ValidationError,
  InsufficientFundsError,
  LimitExceededError,
} from '../types/transfers';

const router = express.Router();

// Initialize transfer services
let transferServices: {
  internal?: InternalTransferService;
  external?: ExternalTransferService;
  billPayment?: BillPaymentService;
  // TEMP: Disabled due to TypeScript errors
  // scheduled?: ScheduledPaymentService;
  // international?: InternationalTransferService;
  receipt?: TransactionReceiptService;
  notification?: NotificationService;
} = {};

// Function to initialize services with database pool
export const initializeTransferServices = (db: any) => {
  transferServices.internal = new InternalTransferService(db);
  transferServices.external = new ExternalTransferService(db);
  transferServices.billPayment = new BillPaymentService(db);
  // TEMP: Disabled due to TypeScript errors
  // transferServices.international = new InternationalTransferService(db);
  transferServices.receipt = new TransactionReceiptService(db);
  transferServices.notification = new NotificationService(db);
  // TEMP: Disabled due to TypeScript errors
  // transferServices.scheduled = new ScheduledPaymentService(
  //   db,
  //   transferServices.internal,
  //   transferServices.external,
  //   transferServices.billPayment
  // );
};

// Helper function to handle transfer errors
function handleTransferError(error: any, res: express.Response): void {
  console.error('Transfer error:', error);

  if (error instanceof ValidationError) {
    res.status(400).json({
      success: false,
      message: error.message,
      field: error.field,
      code: 'VALIDATION_ERROR',
    });
  } else if (error instanceof InsufficientFundsError) {
    res.status(400).json({
      success: false,
      message: error.message,
      code: 'INSUFFICIENT_FUNDS',
    });
  } else if (error instanceof LimitExceededError) {
    res.status(400).json({
      success: false,
      message: error.message,
      code: 'LIMIT_EXCEEDED',
    });
  } else if (error instanceof TransferError) {
    res.status(400).json({
      success: false,
      message: error.message,
      code: error.code,
      details: error.details,
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * POST /api/transfers/fraud-check
 * Standalone fraud detection analysis endpoint
 */
router.post('/fraud-check', authenticateToken, validateTenantAccess, [
  body('amount').isFloat({ min: 100 }).withMessage('Amount must be at least ₦100'),
  body('recipientAccountNumber').isLength({ min: 10, max: 10 }).withMessage('Account number must be 10 digits'),
  body('recipientBankCode').isLength({ min: 1, max: 10 }).withMessage('Bank code must be 1-10 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description too long')
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
    amount,
    recipientAccountNumber,
    recipientBankCode,
    description = 'Fraud check analysis'
  } = req.body;

  const userId = req.user.id;
  const tenantId = req.user.tenantId;

  try {
    const fraudRequest: FraudDetectionRequest = {
      userId,
      tenantId,
      transactionData: {
        amount: parseFloat(amount),
        recipientAccountNumber,
        recipientBankCode,
        description,
        timestamp: new Date().toISOString()
      },
      userContext: {
        ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'Unknown',
        deviceFingerprint: req.headers['x-device-fingerprint'] as string,
        location: req.body.location
      },
      behavioralData: {
        typingPattern: req.body.typingPattern,
        mouseMovements: req.body.mouseMovements,
        sessionDuration: req.body.sessionDuration || 300,
        previousTransactionCount: 0,
        avgTransactionAmount: 50000,
        timeOfDay: new Date().getHours(),
        dayOfWeek: new Date().getDay()
      }
    };

    const fraudAnalysis = await fraudDetectionService.analyzeTransaction(fraudRequest);

    res.json({
      success: true,
      data: {
        riskScore: fraudAnalysis.riskScore,
        riskLevel: fraudAnalysis.riskLevel,
        decision: fraudAnalysis.decision,
        confidence: fraudAnalysis.confidence,
        flags: fraudAnalysis.flags,
        recommendations: fraudAnalysis.recommendations,
        processingTime: fraudAnalysis.processingTime,
        sessionId: fraudAnalysis.sessionId,
        analysis: {
          timestamp: new Date().toISOString(),
          transactionAmount: parseFloat(amount),
          isHighRisk: fraudAnalysis.riskScore >= 70,
          requiresReview: fraudAnalysis.decision === 'review',
          shouldBlock: fraudAnalysis.decision === 'block'
        }
      }
    });

  } catch (error) {
    console.error('Fraud check error:', error);
    res.status(500).json({
      success: false,
      error: 'Fraud detection analysis failed',
      code: 'FRAUD_ANALYSIS_ERROR'
    });
  }
}));

/**
 * POST /api/transfers/validate-recipient
 * Alias for account inquiry to match frontend API
 *
 * TESTING MODE: Accepts any 10-digit account number for development/QA
 */
router.post('/validate-recipient', authenticateToken, validateTenantAccess, [
  body('accountNumber').isLength({ min: 10, max: 10 }).withMessage('Account number must be 10 digits'),
  body('bankCode').notEmpty().withMessage('Bank code is required'),
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
    // TESTING MODE: Accept any 10-digit account number for development/QA
    // In production, this would call real NIBSS account inquiry
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

    if (isDevelopment) {
      // Generate test account name for any valid 10-digit number
      const testAccountName = `Test Account ${accountNumber.slice(-4)}`;

      console.log(`✅ Account validation (TEST MODE): ${accountNumber} → ${testAccountName}`);

      return res.json({
        success: true,
        data: {
          isValid: true,
          accountNumber: accountNumber,
          accountName: testAccountName,
          bankName: req.body.bankName || 'Test Bank',
          bankCode: bankCode
        }
      });
    }

    // PRODUCTION: Call real NIBSS account inquiry
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
  body('bankCode').isLength({ min: 1, max: 10 }).withMessage('Bank code must be 1-10 characters'),
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
  body('recipientBankCode').notEmpty().withMessage('Bank code is required'),
  body('recipientName').isLength({ min: 2, max: 100 }).withMessage('Recipient name is required'),
  body('amount').isFloat({ min: 100 }).withMessage('Amount must be at least ₦100'),
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
    // 0. AI Fraud Detection Analysis (< 500ms target)
    const fraudAnalysisStartTime = Date.now();
    
    const fraudRequest: FraudDetectionRequest = {
      userId,
      tenantId,
      transactionData: {
        amount: parseFloat(amount),
        recipientAccountNumber,
        recipientBankCode,
        description,
        timestamp: new Date().toISOString()
      },
      userContext: {
        ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'Unknown',
        deviceFingerprint: req.headers['x-device-fingerprint'] as string,
        location: req.body.location
      },
      behavioralData: {
        typingPattern: req.body.typingPattern,
        mouseMovements: req.body.mouseMovements,
        sessionDuration: req.body.sessionDuration || 300, // Default 5 minutes
        previousTransactionCount: 0, // Will be updated with actual data in production
        avgTransactionAmount: 50000, // Default average for new users
        timeOfDay: new Date().getHours(),
        dayOfWeek: new Date().getDay()
      }
    };

    const fraudAnalysis = await fraudDetectionService.analyzeTransaction(fraudRequest);
    const fraudAnalysisTime = Date.now() - fraudAnalysisStartTime;

    // Handle fraud detection decision
    if (fraudAnalysis.decision === 'block') {
      return res.status(403).json({
        success: false,
        error: 'Transaction blocked by fraud detection system',
        code: 'FRAUD_BLOCKED',
        fraudAnalysis: {
          riskScore: fraudAnalysis.riskScore,
          riskLevel: fraudAnalysis.riskLevel,
          flags: fraudAnalysis.flags,
          sessionId: fraudAnalysis.sessionId
        }
      });
    }

    if (fraudAnalysis.decision === 'review') {
      // In production, this would trigger manual review workflow
      // For now, we'll allow but flag for review
    }

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

    // Skip daily limit check for Demo User (testing purposes)
    const isDemoUser = wallet.first_name === 'Demo' && wallet.last_name === 'User';
    if (!isDemoUser && (limits.daily_spent + transferAmount) > dailyLimit) {
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

    // Skip monthly limit check for Demo User (testing purposes)
    if (!isDemoUser && (limits.monthly_spent + transferAmount) > monthlyLimit) {
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

    // 5. Generate unique transaction reference using secure ULID-based generator
    // Get tenant's bank code for reference prefix (multi-tenant compliant)
    const tenantBankCode = wallet.source_bank_code || 'EXT';
    const reference = generateTransferRef(tenantBankCode);

    // 6. Check if recipient is an internal user (same bank)
    let recipientUserId = null;
    let isInternalTransfer = false;
    
    // Check if recipient account belongs to an internal user
    const internalUserResult = await query(`
      SELECT id, first_name, last_name FROM tenant.users 
      WHERE account_number = $1 AND tenant_id = $2
    `, [recipientAccountNumber, tenantId]);
    
    if (internalUserResult.rowCount > 0) {
      recipientUserId = internalUserResult.rows[0].id;
      isInternalTransfer = true;
    }

    // 7. Save recipient if requested (for external recipients)
    let recipientId = null;
    if (saveRecipient && !isInternalTransfer) {
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

    // 8. Create transfer record
    const transferResult = await query(`
      INSERT INTO tenant.transfers (
        sender_id, tenant_id, recipient_id, recipient_user_id, reference, amount, fee, description,
        recipient_account_number, recipient_bank_code, recipient_name,
        source_account_number, source_bank_code, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      RETURNING id
    `, [
      userId, tenantId, isInternalTransfer ? null : recipientId, isInternalTransfer ? recipientUserId : null,
      reference, transferAmount, 0, description, recipientAccountNumber, recipientBankCode, recipientName,
      wallet.source_account, wallet.source_bank_code, isInternalTransfer ? 'successful' : 'pending'
    ]);

    const transferId = transferResult.rows[0].id;

    // 9. Debit sender wallet
    await query(`
      UPDATE tenant.wallets
      SET balance = balance - $1, updated_at = NOW()
      WHERE id = $2
    `, [transferAmount, wallet.id]);

    // 10. Credit recipient wallet (ONLY for internal transfers)
    if (isInternalTransfer) {
      // Get recipient's primary wallet
      const recipientWalletResult = await query(`
        SELECT id, balance FROM tenant.wallets 
        WHERE user_id = $1 AND tenant_id = $2 AND is_primary = true
      `, [recipientUserId, tenantId]);

      if (recipientWalletResult.rowCount === 0) {
        await query('ROLLBACK');
        return res.status(500).json({
          success: false,
          error: 'Recipient wallet not found',
          code: 'RECIPIENT_WALLET_NOT_FOUND'
        });
      }

      const recipientWallet = recipientWalletResult.rows[0];
      
      // Credit the recipient wallet
      await query(`
        UPDATE tenant.wallets
        SET balance = balance + $1, updated_at = NOW()
        WHERE id = $2
      `, [transferAmount, recipientWallet.id]);

      // For internal transfers, commit immediately and return success
      await query('COMMIT');
      
      return res.json({
        success: true,
        message: 'Internal transfer completed successfully',
        data: {
          transferId,
          reference,
          amount: transferAmount,
          recipient: {
            accountNumber: recipientAccountNumber,
            accountName: recipientName
          },
          status: 'successful',
          type: 'internal_transfer',
          createdAt: new Date().toISOString()
        }
      });
    }

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

      // Transaction completed successfully
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
        transactionId: nibssResponse.transactionId,
        fraudAnalysis: {
          riskScore: fraudAnalysis.riskScore,
          riskLevel: fraudAnalysis.riskLevel,
          decision: fraudAnalysis.decision,
          processingTime: fraudAnalysisTime,
          sessionId: fraudAnalysis.sessionId,
          flags: fraudAnalysis.flags.length > 0 ? fraudAnalysis.flags : undefined
        }
      }
    });

  } catch (error) {
    await query('ROLLBACK');
    console.error('===== ACTUAL TRANSFER ERROR =====');
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    console.error('===================================');
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
    WHERE t.reference = $2 AND (t.sender_id = $1 OR t.recipient_user_id = $1)
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
    WHERE t.sender_id = $1 OR t.recipient_user_id = $1
    ORDER BY t.created_at DESC
    LIMIT $2 OFFSET $3
  `, [userId, limit, offset]);

  const countResult = await query(`
    SELECT COUNT(*) as total
    FROM tenant.transfers
    WHERE sender_id = $1 OR recipient_user_id = $1
  `, [userId]);

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);

  // Add cache-busting headers to ensure fresh transaction data
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

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

  // TODO: Implement recipients table - for now return empty list
  const recipients = { rows: [] };

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

/**
 * Enhanced Transfer Service Endpoints
 * These complement the existing NIBSS transfer routes
 */

// POST /api/transfers/internal - Process internal transfer
router.post('/internal', authenticateToken, validateTenantAccess, [
  body('recipientAccountNumber').isLength({ min: 10, max: 10 }).withMessage('Account number must be 10 digits'),
  body('recipientName').isLength({ min: 2, max: 100 }).withMessage('Recipient name is required'),
  body('amount').isFloat({ min: 100 }).withMessage('Amount must be at least ₦100'),
  body('pin').isLength({ min: 4, max: 4 }).withMessage('Transaction PIN required'),
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

  try {
    // Get user's primary wallet ID
    const walletQuery = await query(`
      SELECT id FROM tenant.wallets
      WHERE user_id = $1 AND tenant_id = $2 AND status = 'active'
      ORDER BY is_primary DESC, created_at ASC
      LIMIT 1
    `, [req.user.id, req.user.tenantId]);

    if (walletQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No active wallet found',
        code: 'WALLET_NOT_FOUND'
      });
    }

    const fromWalletId = walletQuery.rows[0].id;

    // For toWalletId, we need to find the recipient's wallet by account number
    const recipientQuery = await query(`
      SELECT w.id FROM tenant.wallets w
      JOIN tenant.users u ON w.user_id = u.id
      WHERE w.wallet_number = $1 AND w.tenant_id = $2 AND w.status = 'active'
      ORDER BY w.is_primary DESC
      LIMIT 1
    `, [req.body.recipientAccountNumber, req.user.tenantId]);

    if (recipientQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Recipient account not found',
        code: 'RECIPIENT_NOT_FOUND'
      });
    }

    const toWalletId = recipientQuery.rows[0].id;

    const request: InternalTransferRequest = {
      fromWalletId: fromWalletId,
      toWalletId: toWalletId,
      amount: parseFloat(req.body.amount),
      currency: 'NGN',
      narration: req.body.description || 'Internal transfer',
      reference: `INT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    const result = await transferServices.internal!.processTransfer(request);

    res.status(200).json({
      success: true,
      message: 'Internal transfer processed successfully',
      data: result,
    });
  } catch (error) {
    handleTransferError(error, res);
  }
}));

// POST /api/transfers/external - Process external transfer
router.post('/external', authenticateToken, validateTenantAccess, [
  body('recipientAccountNumber').isLength({ min: 10, max: 10 }).withMessage('Account number must be 10 digits'),
  body('recipientBankCode').isLength({ min: 1, max: 10 }).withMessage('Bank code must be 1-10 characters'),
  body('recipientName').isLength({ min: 2, max: 100 }).withMessage('Recipient name is required'),
  body('amount').isFloat({ min: 100 }).withMessage('Amount must be at least ₦100'),
  body('pin').isLength({ min: 4, max: 4 }).withMessage('Transaction PIN required'),
], asyncHandler(async (req, res) => {
  try {
    // Get user's primary wallet ID for external transfer
    const walletQuery = await query(`
      SELECT id FROM tenant.wallets
      WHERE user_id = $1 AND tenant_id = $2 AND status = 'active'
      ORDER BY is_primary DESC, created_at ASC
      LIMIT 1
    `, [req.user.id, req.user.tenantId]);

    if (walletQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No active wallet found',
        code: 'WALLET_NOT_FOUND'
      });
    }

    const sourceWalletId = walletQuery.rows[0].id;

    const request: ExtTransferRequest = {
      sourceWalletId: sourceWalletId,
      recipientAccountNumber: req.body.recipientAccountNumber,
      recipientBankCode: req.body.recipientBankCode,
      recipientName: req.body.recipientName,
      amount: parseFloat(req.body.amount),
      narration: req.body.description || 'External transfer',
      saveBeneficiary: req.body.saveBeneficiary,
      beneficiaryNickname: req.body.beneficiaryNickname,
    };

    const result = await transferServices.external!.processTransfer(request, req.user.id);

    res.status(200).json({
      success: true,
      message: 'External transfer initiated successfully',
      data: result,
    });
  } catch (error) {
    handleTransferError(error, res);
  }
}));

// POST /api/transfers/bills - Process bill payment
router.post('/bills', authenticateToken, validateTenantAccess, [
  body('billerId').notEmpty().withMessage('Biller ID is required'),
  body('customerReference').notEmpty().withMessage('Customer reference is required'),
  body('amount').isFloat({ min: 50 }).withMessage('Amount must be at least ₦50'),
  body('pin').isLength({ min: 4, max: 4 }).withMessage('Transaction PIN required'),
], asyncHandler(async (req, res) => {
  try {
    // Get user's primary wallet ID for bill payment
    const walletQuery = await query(`
      SELECT id FROM tenant.wallets
      WHERE user_id = $1 AND tenant_id = $2 AND status = 'active'
      ORDER BY is_primary DESC, created_at ASC
      LIMIT 1
    `, [req.user.id, req.user.tenantId]);

    if (walletQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No active wallet found',
        code: 'WALLET_NOT_FOUND'
      });
    }

    const walletId = walletQuery.rows[0].id;

    const request: BillPaymentRequest = {
      billerId: req.body.billerId,
      customerReference: req.body.customerReference,
      amount: parseFloat(req.body.amount),
      walletId: walletId,
      validateCustomer: req.body.validateCustomer
    };

    const result = await transferServices.billPayment!.processBillPayment(request, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Bill payment processed successfully',
      data: result,
    });
  } catch (error) {
    handleTransferError(error, res);
  }
}));

// TEMP: Disabled international transfers route due to TypeScript errors
// TODO: Re-enable after fixing InternationalTransferService
/*
router.post('/international', authenticateToken, validateTenantAccess, [
  body('recipientName').isLength({ min: 2, max: 100 }).withMessage('Recipient name is required'),
  body('recipientIban').notEmpty().withMessage('Recipient IBAN is required'),
  body('recipientSwiftCode').notEmpty().withMessage('Recipient SWIFT code is required'),
  body('recipientCountry').isLength({ min: 2, max: 2 }).withMessage('Valid country code required'),
  body('amount').isFloat({ min: 1000 }).withMessage('Amount must be at least ₦1,000'),
  body('purpose').notEmpty().withMessage('Transfer purpose is required'),
  body('sourceOfFunds').notEmpty().withMessage('Source of funds is required'),
  body('pin').isLength({ min: 4, max: 4 }).withMessage('Transaction PIN required'),
], asyncHandler(async (req, res) => {
  try {
    const walletQuery = await query(`
      SELECT id FROM tenant.wallets
      WHERE user_id = $1 AND tenant_id = $2 AND status = 'active'
      ORDER BY is_primary DESC, created_at ASC
      LIMIT 1
    `, [req.user.id, req.user.tenantId]);

    if (walletQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No active wallet found',
        code: 'WALLET_NOT_FOUND'
      });
    }

    const sourceWalletId = walletQuery.rows[0].id;

    const request: InternationalTransferRequest = {
      sourceWalletId: sourceWalletId,
      amount: parseFloat(req.body.amount),
      sourceCurrency: 'NGN',
      destinationCurrency: req.body.destinationCurrency || 'USD',
      recipientName: req.body.recipientName,
      recipientAddress: req.body.recipientAddress,
      recipientCountry: req.body.recipientCountry,
      recipientBankName: req.body.recipientBankName || '',
      recipientBankSwift: req.body.recipientSwiftCode,
      recipientAccountNumber: req.body.recipientAccountNumber || '',
      recipientIban: req.body.recipientIban,
      transferPurpose: req.body.purpose || 'Personal remittance'
    };

    const result = await transferServices.international!.processTransfer(request, req.user.id);

    res.status(200).json({
      success: true,
      message: 'International transfer initiated successfully',
      data: result,
    });
  } catch (error) {
    handleTransferError(error, res);
  }
}));
*/

// TEMP: Disabled scheduled payments routes due to TypeScript errors
// TODO: Re-enable after fixing ScheduledPaymentService
/*
router.post('/scheduled', authenticateToken, validateTenantAccess, [
  body('scheduledDate').isISO8601().withMessage('Valid scheduled date required'),
  body('frequency').isIn(['once', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly']).withMessage('Valid frequency required'),
], asyncHandler(async (req, res) => {
  try {
    const request = {
      ...req.body,
      scheduledDate: new Date(req.body.scheduledDate),
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
    };

    const result = await transferServices.scheduled!.createScheduledPayment(request, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Scheduled payment created successfully',
      data: result,
    });
  } catch (error) {
    handleTransferError(error, res);
  }
}));
*/

// GET /api/transfers/billers - Get available billers
router.get('/billers', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  try {
    const category = req.query.category as string;
    const billers = await transferServices.billPayment!.getBillers(category);

    res.status(200).json({
      success: true,
      data: billers,
    });
  } catch (error) {
    handleTransferError(error, res);
  }
}));

/*
router.get('/scheduled', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  try {
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
    const scheduledPayments = await transferServices.scheduled!.getUserScheduledPayments(req.user.id, isActive);

    res.status(200).json({
      success: true,
      data: scheduledPayments,
    });
  } catch (error) {
    handleTransferError(error, res);
  }
}));

router.put('/scheduled/:id', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const result = await transferServices.scheduled!.updateScheduledPayment(id, updates, req.user.id);

    res.status(200).json({
      success: result,
      message: result ? 'Scheduled payment updated successfully' : 'Failed to update scheduled payment',
    });
  } catch (error) {
    handleTransferError(error, res);
  }
}));

router.delete('/scheduled/:id', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const result = await transferServices.scheduled!.cancelScheduledPayment(id, req.user.id);

    res.status(200).json({
      success: result,
      message: result ? 'Scheduled payment cancelled successfully' : 'Failed to cancel scheduled payment',
    });
  } catch (error) {
    handleTransferError(error, res);
  }
}));

router.post('/scheduled/:id/execute', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const result = await transferServices.scheduled!.executeScheduledPayment(id);

    res.status(200).json({
      success: result.success,
      message: result.success ? 'Scheduled payment executed successfully' : 'Failed to execute scheduled payment',
      data: result,
    });
  } catch (error) {
    handleTransferError(error, res);
  }
}));
*/

// ===== RECEIPT MANAGEMENT ENDPOINTS =====

/**
 * POST /api/transfers/receipts/generate
 * Generate receipt for a transaction
 */
router.post('/receipts/generate', authenticateToken, validateTenantAccess, [
  body('transactionId').isUUID().withMessage('Valid transaction ID required'),
  body('transactionType').isIn(['internal_transfer', 'external_transfer', 'bill_payment', 'international_transfer', 'scheduled_payment']).withMessage('Valid transaction type required')
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

  try {
    const { transactionId, transactionType } = req.body;
    const tenantId = req.user.tenantId;

    const receipt = await transferServices.receipt!.generateReceipt(
      transactionId,
      transactionType,
      tenantId
    );

    res.status(200).json({
      success: true,
      message: 'Receipt generated successfully',
      data: receipt,
    });
  } catch (error) {
    handleTransferError(error, res);
  }
}));

/**
 * GET /api/transfers/receipts/:receiptId
 * Get receipt by ID
 */
router.get('/receipts/:receiptId', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  try {
    const { receiptId } = req.params;
    const tenantId = req.user.tenantId;

    const receipt = await transferServices.receipt!.getReceipt(receiptId, tenantId);

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found',
        code: 'RECEIPT_NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      data: receipt,
    });
  } catch (error) {
    handleTransferError(error, res);
  }
}));

/**
 * GET /api/transfers/transaction-records
 * Search transaction records with filters
 */
router.get('/transaction-records', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      accountId,
      transactionType,
      status,
      dateFrom,
      dateTo,
      amountMin,
      amountMax,
      reference,
      recipientName,
      limit,
      offset
    } = req.query;

    const filters = {
      accountId: accountId as string,
      transactionType: transactionType as string,
      status: status as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      amountMin: amountMin ? parseFloat(amountMin as string) : undefined,
      amountMax: amountMax ? parseFloat(amountMax as string) : undefined,
      reference: reference as string,
      recipientName: recipientName as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    };

    const result = await transferServices.receipt!.searchTransactionRecords(tenantId, filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleTransferError(error, res);
  }
}));

/**
 * GET /api/transfers/transaction-summary/:accountId
 * Get transaction summary for an account
 */
router.get('/transaction-summary/:accountId', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  try {
    const { accountId } = req.params;
    const tenantId = req.user.tenantId;
    const { period } = req.query;

    const summary = await transferServices.receipt!.getTransactionSummary(
      accountId,
      tenantId,
      period as 'today' | 'week' | 'month' | 'year'
    );

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    handleTransferError(error, res);
  }
}));

// ===== NOTIFICATION MANAGEMENT ENDPOINTS =====

/**
 * GET /api/transfers/notifications/unread
 * Get unread notifications for user
 */
router.get('/notifications/unread', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const tenantId = req.user.tenantId;

    const notifications = await transferServices.notification!.getUnreadNotifications(userId, tenantId);

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    handleTransferError(error, res);
  }
}));

/**
 * PUT /api/transfers/notifications/:notificationId/read
 * Mark notification as read
 */
router.put('/notifications/:notificationId/read', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    await transferServices.notification!.markNotificationAsRead(notificationId, userId);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    handleTransferError(error, res);
  }
}));

/**
 * POST /api/transfers/notifications/test
 * Send test notification (development only)
 */
router.post('/notifications/test', authenticateToken, validateTenantAccess, [
  body('type').isIn(['transfer_initiated', 'transfer_completed', 'transfer_failed', 'receipt_generated']).withMessage('Valid notification type required'),
  body('transferData').isObject().withMessage('Transfer data is required')
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

  try {
    const { type, transferData, priority } = req.body;
    const userId = req.user.id;
    const tenantId = req.user.tenantId;

    await transferServices.notification!.sendTransferNotification({
      type,
      tenantId,
      userId,
      transferData,
      priority: priority || 'medium',
    });

    res.status(200).json({
      success: true,
      message: 'Test notification sent successfully',
    });
  } catch (error) {
    handleTransferError(error, res);
  }
}));

// ===== ENHANCED TRANSFER STATUS AND ANALYTICS =====

/**
 * GET /api/transfers/analytics/summary
 * Get transfer analytics summary
 */
router.get('/analytics/summary', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { startDate, endDate, groupBy } = req.query;

    // Mock analytics data - in production, implement proper analytics service
    const mockAnalytics = {
      totalTransfers: 1250,
      totalVolume: 15750000.00,
      averageAmount: 12600.00,
      successRate: 98.5,
      transfersByType: {
        internal: { count: 750, volume: 8250000.00 },
        external: { count: 400, volume: 6500000.00 },
        bills: { count: 80, volume: 800000.00 },
        international: { count: 20, volume: 200000.00 },
      },
      topRecipients: [
        { name: 'John Doe', count: 15, volume: 180000.00 },
        { name: 'Jane Smith', count: 12, volume: 150000.00 },
        { name: 'David Wilson', count: 10, volume: 120000.00 },
      ],
      fraudPrevented: {
        count: 25,
        potentialLoss: 450000.00,
      },
    };

    res.status(200).json({
      success: true,
      data: mockAnalytics,
    });
  } catch (error) {
    handleTransferError(error, res);
  }
}));

/**
 * GET /api/transfers/limits/:accountId
 * Get current transfer limits and usage
 */
router.get('/limits/:accountId', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  try {
    const { accountId } = req.params;
    const tenantId = req.user.tenantId;

    // Mock limits data - in production, implement proper limits service
    const mockLimits = {
      daily: {
        limit: 500000.00,
        used: 125000.00,
        remaining: 375000.00,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      monthly: {
        limit: 10000000.00,
        used: 3250000.00,
        remaining: 6750000.00,
        resetTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      perTransaction: {
        internal: 1000000.00,
        external: 500000.00,
        bills: 100000.00,
        international: 50000.00,
      },
    };

    res.status(200).json({
      success: true,
      data: mockLimits,
    });
  } catch (error) {
    handleTransferError(error, res);
  }
}));

/**
 * GET /api/transfers/fees/calculate
 * Calculate transfer fees
 */
router.get('/fees/calculate', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  try {
    const { amount, transferType, recipientCountry } = req.query;

    if (!amount || !transferType) {
      return res.status(400).json({
        success: false,
        error: 'Amount and transfer type are required',
        code: 'VALIDATION_ERROR',
      });
    }

    // Mock fee calculation - in production, implement proper fee service
    const transferAmount = parseFloat(amount as string);
    let fees: any = {};

    switch (transferType) {
      case 'internal':
        fees = { amount: 0, description: 'No fee for internal transfers' };
        break;
      case 'external':
        fees = { amount: 50, description: 'NIBSS transfer fee' };
        break;
      case 'bills':
        fees = { amount: 25, description: 'Bill payment processing fee' };
        break;
      case 'international':
        fees = {
          swiftFee: 2500,
          correspondentFee: 3000,
          regulatoryFee: 500,
          totalFees: 6000,
          description: 'International transfer fees',
        };
        break;
      default:
        fees = { amount: 0, description: 'Unknown transfer type' };
    }

    res.status(200).json({
      success: true,
      data: {
        transferAmount,
        fees,
        totalAmount: transferAmount + (fees.totalFees || fees.amount || 0),
      },
    });
  } catch (error) {
    handleTransferError(error, res);
  }
}));

export default router;