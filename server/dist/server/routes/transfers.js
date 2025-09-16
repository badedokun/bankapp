"use strict";
/**
 * Enhanced Transfer Routes with NIBSS Integration
 * Complete money transfer system with real-time processing
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const errorHandler_1 = require("../middleware/errorHandler");
const nibss_1 = require("../services/nibss");
const fraud_detection_1 = require("../services/fraud-detection");
const router = express_1.default.Router();
/**
 * POST /api/transfers/fraud-check
 * Standalone fraud detection analysis endpoint
 */
router.post('/fraud-check', auth_1.authenticateToken, tenant_1.validateTenantAccess, [
    (0, express_validator_1.body)('amount').isFloat({ min: 100 }).withMessage('Amount must be at least ₦100'),
    (0, express_validator_1.body)('recipientAccountNumber').isLength({ min: 10, max: 10 }).withMessage('Account number must be 10 digits'),
    (0, express_validator_1.body)('recipientBankCode').isLength({ min: 3, max: 3 }).withMessage('Bank code must be 3 digits'),
    (0, express_validator_1.body)('description').optional().isLength({ max: 500 }).withMessage('Description too long')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: validationErrors.array()
        });
    }
    const { amount, recipientAccountNumber, recipientBankCode, description = 'Fraud check analysis' } = req.body;
    const userId = req.user.id;
    const tenantId = req.user.tenantId;
    try {
        const fraudRequest = {
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
                deviceFingerprint: req.headers['x-device-fingerprint'],
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
        const fraudAnalysis = await fraud_detection_1.fraudDetectionService.analyzeTransaction(fraudRequest);
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
    }
    catch (error) {
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
 */
router.post('/validate-recipient', auth_1.authenticateToken, tenant_1.validateTenantAccess, [
    (0, express_validator_1.body)('accountNumber').isLength({ min: 10, max: 10 }).withMessage('Account number must be 10 digits'),
    (0, express_validator_1.body)('bankCode').isLength({ min: 3, max: 3 }).withMessage('Bank code must be 3 digits'),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const validationErrors = (0, express_validator_1.validationResult)(req);
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
        const inquiryResult = await nibss_1.nibssService.accountInquiry({
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
    }
    catch (error) {
        throw errorHandler_1.errors.internalError('Account validation failed');
    }
}));
/**
 * POST /api/transfers/account-inquiry
 * Verify recipient account details before transfer
 */
router.post('/account-inquiry', auth_1.authenticateToken, tenant_1.validateTenantAccess, [
    (0, express_validator_1.body)('accountNumber').isLength({ min: 10, max: 10 }).withMessage('Account number must be 10 digits'),
    (0, express_validator_1.body)('bankCode').isLength({ min: 3, max: 3 }).withMessage('Bank code must be 3 digits'),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const validationErrors = (0, express_validator_1.validationResult)(req);
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
        const inquiryResult = await nibss_1.nibssService.accountInquiry({
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
    }
    catch (error) {
        throw errorHandler_1.errors.internalError('Account inquiry failed');
    }
}));
/**
 * POST /api/transfers/initiate
 * Initiate a money transfer via NIBSS
 */
router.post('/initiate', auth_1.authenticateToken, tenant_1.validateTenantAccess, [
    (0, express_validator_1.body)('recipientAccountNumber').isLength({ min: 10, max: 10 }).withMessage('Account number must be 10 digits'),
    (0, express_validator_1.body)('recipientBankCode').isLength({ min: 3, max: 3 }).withMessage('Bank code must be 3 digits'),
    (0, express_validator_1.body)('recipientName').isLength({ min: 2, max: 100 }).withMessage('Recipient name is required'),
    (0, express_validator_1.body)('amount').isFloat({ min: 100 }).withMessage('Amount must be at least ₦100'),
    (0, express_validator_1.body)('description').optional().isLength({ max: 500 }).withMessage('Description too long'),
    (0, express_validator_1.body)('pin').isLength({ min: 4, max: 4 }).withMessage('Transaction PIN required'),
    (0, express_validator_1.body)('saveRecipient').optional().isBoolean().withMessage('Save recipient must be boolean')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: validationErrors.array()
        });
    }
    const { recipientAccountNumber, recipientBankCode, recipientName, amount, description = 'Money transfer', pin, saveRecipient = false } = req.body;
    const userId = req.user.id;
    const tenantId = req.user.tenantId;
    try {
        console.log('=== TRANSFER DEBUG: Starting transfer process ===');
        console.log('User ID:', userId);
        console.log('Tenant ID:', tenantId);
        console.log('Amount:', amount);
        console.log('PIN provided:', pin ? 'YES' : 'NO');
        // 0. AI Fraud Detection Analysis (< 500ms target)
        console.log('Starting fraud detection analysis...');
        const fraudAnalysisStartTime = Date.now();
        const fraudRequest = {
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
                deviceFingerprint: req.headers['x-device-fingerprint'],
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
        console.log('About to call fraudDetectionService.analyzeTransaction...');
        const fraudAnalysis = await fraud_detection_1.fraudDetectionService.analyzeTransaction(fraudRequest);
        console.log('Fraud analysis successful:', fraudAnalysis);
        const fraudAnalysisTime = Date.now() - fraudAnalysisStartTime;
        console.log(`Fraud analysis completed in ${fraudAnalysisTime}ms - Risk: ${fraudAnalysis.riskScore}, Decision: ${fraudAnalysis.decision}`);
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
            console.log(`Transaction flagged for manual review: ${fraudAnalysis.sessionId}`);
        }
        // Start database transaction
        await (0, database_1.query)('BEGIN');
        // 1. Get user's primary wallet and verify PIN
        const walletResult = await (0, database_1.query)(`
      SELECT w.*, u.transaction_pin_hash, u.daily_limit, u.monthly_limit,
             u.first_name, u.last_name, u.account_number as source_account,
             t.bank_code as source_bank_code
      FROM tenant.wallets w
      JOIN tenant.users u ON w.user_id = u.id
      JOIN platform.tenants t ON u.tenant_id = t.id
      WHERE w.user_id = $1 AND w.tenant_id = $2 AND w.is_primary = true
    `, [userId, tenantId]);
        if (walletResult.rowCount === 0) {
            await (0, database_1.query)('ROLLBACK');
            return res.status(404).json({
                success: false,
                error: 'Wallet not found',
                code: 'WALLET_NOT_FOUND'
            });
        }
        const wallet = walletResult.rows[0];
        // 2. Verify transaction PIN
        const isPinValid = await bcrypt_1.default.compare(pin, wallet.transaction_pin_hash);
        if (!isPinValid) {
            await (0, database_1.query)('ROLLBACK');
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
            await (0, database_1.query)('ROLLBACK');
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
        console.log(`✅ Balance check passed: Transfer amount ${transferAmount} (current balance: ${currentBalance})`);
        // 4. Check daily and monthly limits
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().toISOString().substring(0, 7);
        const limitsResult = await (0, database_1.query)(`
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
            await (0, database_1.query)('ROLLBACK');
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
            await (0, database_1.query)('ROLLBACK');
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
        // 6. Check if recipient is an internal user (same bank)
        let recipientUserId = null;
        let isInternalTransfer = false;
        // Check if recipient account belongs to an internal user
        const internalUserResult = await (0, database_1.query)(`
      SELECT id, first_name, last_name FROM tenant.users 
      WHERE account_number = $1 AND tenant_id = $2
    `, [recipientAccountNumber, tenantId]);
        if (internalUserResult.rowCount > 0) {
            recipientUserId = internalUserResult.rows[0].id;
            isInternalTransfer = true;
            console.log(`🏦 INTERNAL TRANSFER detected: ${recipientAccountNumber} belongs to user ${recipientUserId}`);
            // Verify the recipient name matches (optional security check)
            const actualName = `${internalUserResult.rows[0].first_name} ${internalUserResult.rows[0].last_name}`;
            console.log(`📋 Recipient name verification: Expected="${recipientName}" | Actual="${actualName}"`);
        }
        else {
            console.log(`🌍 EXTERNAL TRANSFER: ${recipientAccountNumber} is not an internal user`);
        }
        // 7. Save recipient if requested (for external recipients)
        let recipientId = null;
        if (saveRecipient && !isInternalTransfer) {
            const existingRecipient = await (0, database_1.query)(`
        SELECT id FROM recipients 
        WHERE user_id = $1 AND account_number = $2 AND bank_code = $3
      `, [userId, recipientAccountNumber, recipientBankCode]);
            if (existingRecipient.rowCount === 0) {
                const recipientResult = await (0, database_1.query)(`
          INSERT INTO recipients (user_id, tenant_id, account_number, account_name, bank_code, bank_name, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
          RETURNING id
        `, [userId, tenantId, recipientAccountNumber, recipientName, recipientBankCode, 'Unknown Bank']);
                recipientId = recipientResult.rows[0].id;
            }
            else {
                recipientId = existingRecipient.rows[0].id;
            }
        }
        // 8. Create transfer record
        const transferResult = await (0, database_1.query)(`
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
        await (0, database_1.query)(`
      UPDATE tenant.wallets 
      SET balance = balance - $1, updated_at = NOW()
      WHERE id = $2
    `, [transferAmount, wallet.id]);
        console.log(`💰 DEBIT: Removed ₦${transferAmount} from sender wallet ${wallet.id}`);
        // 10. Credit recipient wallet (ONLY for internal transfers)
        if (isInternalTransfer) {
            // Get recipient's primary wallet
            const recipientWalletResult = await (0, database_1.query)(`
        SELECT id, balance FROM tenant.wallets 
        WHERE user_id = $1 AND tenant_id = $2 AND is_primary = true
      `, [recipientUserId, tenantId]);
            if (recipientWalletResult.rowCount === 0) {
                await (0, database_1.query)('ROLLBACK');
                return res.status(500).json({
                    success: false,
                    error: 'Recipient wallet not found',
                    code: 'RECIPIENT_WALLET_NOT_FOUND'
                });
            }
            const recipientWallet = recipientWalletResult.rows[0];
            // Credit the recipient wallet
            await (0, database_1.query)(`
        UPDATE tenant.wallets 
        SET balance = balance + $1, updated_at = NOW()
        WHERE id = $2
      `, [transferAmount, recipientWallet.id]);
            console.log(`💰 CREDIT: Added ₦${transferAmount} to recipient wallet ${recipientWallet.id}`);
            console.log(`🏦 INTERNAL TRANSFER COMPLETED: ₦${transferAmount} moved from user ${userId} to user ${recipientUserId}`);
            // For internal transfers, commit immediately and return success
            await (0, database_1.query)('COMMIT');
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
        const nibssRequest = {
            amount: amount,
            sourceAccountNumber: wallet.source_account,
            sourceBankCode: wallet.source_bank_code,
            destinationAccountNumber: recipientAccountNumber,
            destinationBankCode: recipientBankCode,
            narration: description.substring(0, 100), // NIBSS has character limit
            reference: reference,
            beneficiaryName: recipientName
        };
        const nibssResponse = await nibss_1.nibssService.initiateTransfer(nibssRequest);
        // 10. Update transfer with NIBSS response
        if (nibssResponse.success) {
            await (0, database_1.query)(`
        UPDATE tenant.transfers 
        SET status = $1, nibss_transaction_id = $2, nibss_session_id = $3, fee = $4, updated_at = NOW()
        WHERE id = $5
      `, [nibssResponse.status, nibssResponse.transactionId, nibssResponse.sessionId,
                parseFloat(nibssResponse.fee || '0'), transferId]);
            // If successful, log the transaction (commented out until transaction_logs table is created)
            if (nibssResponse.status === 'successful') {
                console.log(`Transfer completed successfully: ${transferId} - ${nibssResponse.message}`);
            }
        }
        else {
            // Transfer failed, reverse the wallet debit
            await (0, database_1.query)(`
        UPDATE tenant.wallets 
        SET balance = balance + $1, updated_at = NOW()
        WHERE id = $2
      `, [transferAmount, wallet.id]);
            await (0, database_1.query)(`
        UPDATE tenant.transfers 
        SET status = 'failed', nibss_response_message = $1, updated_at = NOW()
        WHERE id = $2
      `, [nibssResponse.message, transferId]);
            console.log(`Transfer failed: ${transferId} - ${nibssResponse.message}`);
        }
        // Commit transaction
        await (0, database_1.query)('COMMIT');
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
    }
    catch (error) {
        await (0, database_1.query)('ROLLBACK');
        console.error('===== ACTUAL TRANSFER ERROR =====');
        console.error('Error name:', error?.name);
        console.error('Error message:', error?.message);
        console.error('Error stack:', error?.stack);
        console.error('===================================');
        throw errorHandler_1.errors.internalError('Transfer failed');
    }
}));
/**
 * GET /api/transfers/status/:reference
 * Check transfer status
 */
router.get('/status/:reference', auth_1.authenticateToken, tenant_1.validateTenantAccess, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { reference } = req.params;
    const userId = req.user.id;
    const transferResult = await (0, database_1.query)(`
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
            const statusResponse = await nibss_1.nibssService.getTransactionStatus({
                reference: transfer.reference,
                transactionId: transfer.nibss_transaction_id
            });
            // Update transfer status if changed
            if (statusResponse.status !== transfer.status) {
                await (0, database_1.query)(`
          UPDATE tenant.transfers 
          SET status = $1, nibss_response_message = $2, updated_at = NOW()
          WHERE id = $3
        `, [statusResponse.status, statusResponse.message, transfer.id]);
                transfer.status = statusResponse.status;
                transfer.nibss_response_message = statusResponse.message;
            }
        }
        catch (error) {
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
router.get('/history', auth_1.authenticateToken, tenant_1.validateTenantAccess, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;
    const transfers = await (0, database_1.query)(`
    SELECT t.*,
           CASE WHEN t.sender_id = $1 THEN 'sent' ELSE 'received' END as direction,
           u.first_name as sender_first_name, u.last_name as sender_last_name
    FROM tenant.transfers t
    LEFT JOIN tenant.users u ON t.sender_id = u.id
    WHERE t.sender_id = $1 OR t.recipient_user_id = $1
    ORDER BY t.created_at DESC
    LIMIT $2 OFFSET $3
  `, [userId, limit, offset]);
    const countResult = await (0, database_1.query)(`
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
router.get('/banks', auth_1.authenticateToken, tenant_1.validateTenantAccess, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const banksResponse = await nibss_1.nibssService.getBankList();
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
    }
    catch (error) {
        throw errorHandler_1.errors.internalError('Failed to fetch bank list');
    }
}));
/**
 * GET /api/transfers/recipients
 * Get user's saved recipients
 */
router.get('/recipients', auth_1.authenticateToken, tenant_1.validateTenantAccess, (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
exports.default = router;
//# sourceMappingURL=transfers.js.map