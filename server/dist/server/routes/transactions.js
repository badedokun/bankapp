"use strict";
/**
 * OrokiiPay Transaction Processing Routes
 * Comprehensive transaction management for banking operations
 * Includes bill payments, airtime, data, and transaction utilities
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
const router = express_1.default.Router();
/**
 * GET /api/transactions/history
 * Get transaction history for the authenticated user
 */
router.get('/history', auth_1.authenticateToken, tenant_1.validateTenantAccess, [
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }).withMessage('Offset must be 0 or greater'),
    (0, express_validator_1.query)('type').optional().isIn(['all', 'debit', 'credit', 'transfer', 'bill_payment', 'airtime', 'data']).withMessage('Invalid transaction type')
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
    const userId = req.user.id;
    const tenantId = req.user.tenantId;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const type = req.query.type || 'all';
    try {
        // Get transaction history from both tables to capture all transactions
        const transactionsResult = await (0, database_1.query)(`
      SELECT 
        t.id,
        t.type as transaction_type,
        t.amount,
        t.fee,
        t.description,
        t.reference,
        t.status,
        CASE 
          WHEN t.type = 'transfer' THEN tr.recipient_account_number
          ELSE NULL
        END as recipient_account,
        CASE 
          WHEN t.type = 'transfer' THEN tr.recipient_name
          ELSE NULL
        END as recipient_name,
        CASE 
          WHEN t.type = 'transfer' THEN tr.recipient_bank_name
          ELSE NULL
        END as recipient_bank,
        t.metadata,
        t.created_at
      FROM transactions t
      LEFT JOIN transfers tr ON t.reference = tr.reference AND t.type = 'transfer'
      WHERE t.user_id = $1 AND t.tenant_id = $2 ${type !== 'all' ? 'AND t.type = $3' : ''}
      ORDER BY t.created_at DESC
      LIMIT $${type !== 'all' ? '4' : '3'} OFFSET $${type !== 'all' ? '5' : '4'}
    `, type !== 'all' ? [userId, tenantId, type, limit, offset] : [userId, tenantId, limit, offset]);
        // Get total count for pagination
        const countResult = await (0, database_1.query)(`
      SELECT COUNT(*) as total 
      FROM transactions t
      WHERE t.user_id = $1 AND t.tenant_id = $2 ${type !== 'all' ? 'AND t.type = $3' : ''}
    `, type !== 'all' ? [userId, tenantId, type] : [userId, tenantId]);
        const total = parseInt(countResult.rows[0].total);
        // Format transactions for response
        const transactions = transactionsResult.rows.map(tx => ({
            id: tx.id,
            type: tx.transaction_type,
            amount: parseFloat(tx.amount),
            fee: parseFloat(tx.fee || 0),
            description: tx.description,
            reference: tx.reference,
            status: tx.status,
            recipient: tx.recipient_account ? {
                account: tx.recipient_account,
                name: tx.recipient_name,
                bank: tx.recipient_bank
            } : null,
            metadata: tx.metadata,
            date: tx.created_at
        }));
        res.json({
            success: true,
            data: {
                transactions,
                pagination: {
                    total,
                    limit,
                    offset,
                    hasMore: (offset + limit) < total
                }
            }
        });
    }
    catch (error) {
        console.error('Transaction history error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch transaction history',
            code: 'TRANSACTION_HISTORY_ERROR'
        });
    }
}));
/**
 * POST /api/transactions/bill-payment
 * Process bill payments (electricity, water, cable TV, etc.)
 */
router.post('/bill-payment', auth_1.authenticateToken, tenant_1.validateTenantAccess, [
    (0, express_validator_1.body)('billType').isIn(['electricity', 'water', 'cable_tv', 'internet', 'education', 'insurance']).withMessage('Invalid bill type'),
    (0, express_validator_1.body)('providerId').notEmpty().withMessage('Provider ID is required'),
    (0, express_validator_1.body)('customerNumber').isLength({ min: 4, max: 20 }).withMessage('Invalid customer number'),
    (0, express_validator_1.body)('amount').isFloat({ min: 100 }).withMessage('Amount must be at least ₦100'),
    (0, express_validator_1.body)('pin').isLength({ min: 4, max: 4 }).withMessage('Transaction PIN required'),
    (0, express_validator_1.body)('description').optional().isLength({ max: 200 }).withMessage('Description too long')
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
    const { billType, providerId, customerNumber, amount, pin, description } = req.body;
    const userId = req.user.id;
    const tenantId = req.user.tenantId;
    try {
        await (0, database_1.query)('BEGIN');
        // 1. Verify user wallet and PIN
        const walletResult = await (0, database_1.query)(`
      SELECT w.*, u.transaction_pin_hash, u.first_name, u.last_name
      FROM wallets w
      JOIN users u ON w.user_id = u.id
      WHERE w.user_id = $1 AND w.tenant_id = $2 AND w.status = 'active'
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
        // 2. Verify PIN
        const isPinValid = await bcrypt_1.default.compare(pin, wallet.transaction_pin_hash);
        if (!isPinValid) {
            await (0, database_1.query)('ROLLBACK');
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
            await (0, database_1.query)('ROLLBACK');
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
        const providerResult = await (0, database_1.query)(`
      SELECT * FROM bill_providers 
      WHERE id = $1 AND bill_type = $2 AND status = 'active'
    `, [providerId, billType]);
        if (providerResult.rowCount === 0) {
            await (0, database_1.query)('ROLLBACK');
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
        const transactionResult = await (0, database_1.query)(`
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
        await (0, database_1.query)(`
      UPDATE wallets 
      SET balance = balance - $1, updated_at = NOW()
      WHERE id = $2
    `, [totalAmount, wallet.id]);
        // 8. Create wallet transaction entry
        await (0, database_1.query)(`
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
            await (0, database_1.query)(`
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
        }
        else {
            // Payment failed, reverse wallet debit
            await (0, database_1.query)(`
        UPDATE wallets 
        SET balance = balance + $1, updated_at = NOW()
        WHERE id = $2
      `, [totalAmount, wallet.id]);
            await (0, database_1.query)(`
        UPDATE transactions 
        SET status = 'failed', 
            failure_reason = $1,
            updated_at = NOW()
        WHERE id = $2
      `, [paymentResult.message, transactionId]);
        }
        await (0, database_1.query)('COMMIT');
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
    }
    catch (error) {
        await (0, database_1.query)('ROLLBACK');
        console.error('Bill Payment Error:', error);
        throw errorHandler_1.errors.internalError('Bill payment failed');
    }
}));
/**
 * POST /api/transactions/airtime-purchase
 * Purchase airtime for any Nigerian network
 */
router.post('/airtime-purchase', auth_1.authenticateToken, tenant_1.validateTenantAccess, [
    (0, express_validator_1.body)('network').isIn(['MTN', 'GLO', 'AIRTEL', '9MOBILE']).withMessage('Invalid network provider'),
    (0, express_validator_1.body)('phoneNumber').isMobilePhone('en-NG').withMessage('Invalid Nigerian phone number'),
    (0, express_validator_1.body)('amount').isInt({ min: 100, max: 50000 }).withMessage('Amount must be between ₦100 and ₦50,000'),
    (0, express_validator_1.body)('pin').isLength({ min: 4, max: 4 }).withMessage('Transaction PIN required')
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
    const { network, phoneNumber, amount, pin } = req.body;
    const userId = req.user.id;
    const tenantId = req.user.tenantId;
    try {
        await (0, database_1.query)('BEGIN');
        // Verify wallet and PIN
        const walletResult = await (0, database_1.query)(`
      SELECT w.*, u.transaction_pin_hash 
      FROM wallets w
      JOIN users u ON w.user_id = u.id
      WHERE w.user_id = $1 AND w.tenant_id = $2 AND w.status = 'active'
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
        const isPinValid = await bcrypt_1.default.compare(pin, wallet.transaction_pin_hash);
        if (!isPinValid) {
            await (0, database_1.query)('ROLLBACK');
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
            await (0, database_1.query)('ROLLBACK');
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
        const transactionResult = await (0, database_1.query)(`
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
        await (0, database_1.query)(`
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
        await (0, database_1.query)(`
      UPDATE transactions 
      SET status = $1, 
          external_reference = $2,
          ${purchaseResult.success ? '' : 'failure_reason = $3,'}
          updated_at = NOW()
      WHERE id = ${purchaseResult.success ? '$3' : '$4'}
    `, purchaseResult.success
            ? [finalStatus, purchaseResult.providerReference, transactionId]
            : [finalStatus, purchaseResult.providerReference, purchaseResult.message, transactionId]);
        if (!purchaseResult.success) {
            // Reverse wallet debit on failure
            await (0, database_1.query)(`
        UPDATE wallets 
        SET balance = balance + $1, updated_at = NOW()
        WHERE id = $2
      `, [totalAmount, wallet.id]);
        }
        await (0, database_1.query)('COMMIT');
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
    }
    catch (error) {
        await (0, database_1.query)('ROLLBACK');
        console.error('Airtime Purchase Error:', error);
        throw errorHandler_1.errors.internalError('Airtime purchase failed');
    }
}));
/**
 * GET /api/transactions/:reference/status
 * Get detailed transaction status and information
 */
router.get('/:reference/status', auth_1.authenticateToken, tenant_1.validateTenantAccess, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { reference } = req.params;
    const userId = req.user.id;
    const tenantId = req.user.tenantId;
    const transactionResult = await (0, database_1.query)(`
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
router.get('/bill-providers', auth_1.authenticateToken, tenant_1.validateTenantAccess, [
    (0, express_validator_1.query)('type').optional().isIn(['electricity', 'water', 'cable_tv', 'internet', 'education', 'insurance']).withMessage('Invalid bill type')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = ['status = $1'];
    const params = ['active'];
    if (req.query.type) {
        filters.push('bill_type = $2');
        params.push(req.query.type);
    }
    const providers = await (0, database_1.query)(`
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
async function simulateBillPayment(params) {
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
    }
    else {
        return {
            success: false,
            message: 'Provider service temporarily unavailable. Please try again.',
            providerReference: null
        };
    }
}
async function simulateAirtimePurchase(params) {
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
exports.default = router;
//# sourceMappingURL=transactions.js.map