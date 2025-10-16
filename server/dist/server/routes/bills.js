"use strict";
/**
 * Bill Payment Routes
 * Bill payment providers and payment processing
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
// Sample bill providers data
const BILL_PROVIDERS = [
    {
        id: 'electricity',
        name: 'Electricity Bills',
        category: 'utilities',
        providers: [
            { code: 'IKEDC', name: 'Ikeja Electric', category: 'electricity' },
            { code: 'EKEDC', name: 'Eko Electric', category: 'electricity' },
            { code: 'AEDC', name: 'Abuja Electric', category: 'electricity' },
            { code: 'PHEDC', name: 'Port Harcourt Electric', category: 'electricity' }
        ]
    },
    {
        id: 'water',
        name: 'Water Bills',
        category: 'utilities',
        providers: [
            { code: 'LASWA', name: 'Lagos Water Corporation', category: 'water' },
            { code: 'ABEOKUTA_WATER', name: 'Abeokuta Water Corporation', category: 'water' }
        ]
    },
    {
        id: 'internet',
        name: 'Internet & Cable TV',
        category: 'telecommunications',
        providers: [
            { code: 'MTN', name: 'MTN Nigeria', category: 'internet' },
            { code: 'AIRTEL', name: 'Airtel Nigeria', category: 'internet' },
            { code: 'GLO', name: 'Globacom Nigeria', category: 'internet' },
            { code: 'DSTV', name: 'DStv', category: 'cable' },
            { code: 'GOTV', name: 'GOtv', category: 'cable' }
        ]
    }
];
/**
 * GET /api/bills/providers
 * Get available bill payment providers
 */
router.get('/providers', auth_1.authenticateToken, tenant_1.validateTenantAccess, (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    res.json({
        success: true,
        data: { providers: BILL_PROVIDERS }
    });
}));
/**
 * GET /api/bills/providers/:category
 * Get bill providers by category
 */
router.get('/providers/:category', auth_1.authenticateToken, tenant_1.validateTenantAccess, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { category } = req.params;
    const categoryProviders = BILL_PROVIDERS.filter(p => p.category === category);
    res.json({
        success: true,
        data: { providers: categoryProviders }
    });
}));
/**
 * POST /api/bills/validate
 * Validate bill account number
 */
router.post('/validate', auth_1.authenticateToken, tenant_1.validateTenantAccess, [
    (0, express_validator_1.body)('provider').notEmpty().withMessage('Provider is required'),
    (0, express_validator_1.body)('accountNumber').notEmpty().withMessage('Account number is required'),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
        });
        return;
    }
    const { provider, accountNumber } = req.body;
    // Simulate bill validation
    const isValid = accountNumber.length >= 8 && accountNumber.length <= 15;
    if (!isValid) {
        return res.status(400).json({
            success: false,
            error: 'Invalid account number format'
        });
    }
    // Simulate customer info lookup
    const customerInfo = {
        accountNumber,
        customerName: `Customer ${accountNumber.slice(-4)}`,
        provider,
        outstandingBalance: Math.floor(Math.random() * 10000) + 1000,
        lastPaymentDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        accountStatus: 'active'
    };
    res.json({
        success: true,
        data: {
            isValid: true,
            customerInfo
        }
    });
}));
/**
 * POST /api/bills/pay
 * Process bill payment
 */
router.post('/pay', auth_1.authenticateToken, tenant_1.validateTenantAccess, [
    (0, express_validator_1.body)('provider').notEmpty().withMessage('Provider is required'),
    (0, express_validator_1.body)('accountNumber').notEmpty().withMessage('Account number is required'),
    (0, express_validator_1.body)('amount').isNumeric().withMessage('Amount must be a number'),
    (0, express_validator_1.body)('pin').isLength({ min: 4, max: 6 }).withMessage('PIN must be 4-6 digits'),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
        });
        return;
    }
    const { provider, accountNumber, amount, customerName } = req.body;
    // Verify user has sufficient balance
    const balanceResult = await (0, database_1.query)(`
    SELECT balance FROM tenant.wallets
    WHERE user_id = $1 AND tenant_id = $2 AND is_primary = true
  `, [req.user?.id, req.user?.tenantId]);
    if (balanceResult.rows.length === 0) {
        throw errorHandler_1.errors.notFound('Wallet not found', 'WALLET_NOT_FOUND');
    }
    const currentBalance = parseFloat(balanceResult.rows[0].balance);
    const paymentAmount = parseFloat(amount);
    const fees = paymentAmount * 0.01; // 1% fee
    const totalAmount = paymentAmount + fees;
    if (currentBalance < totalAmount) {
        res.status(400).json({
            success: false,
            error: 'Insufficient balance'
        });
        return;
    }
    // Generate payment reference
    const reference = `BILL${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    // Record the transaction
    try {
        await (0, database_1.query)('BEGIN');
        // Debit wallet
        await (0, database_1.query)(`
      UPDATE tenant.wallets
      SET balance = balance - $1, updated_at = NOW()
      WHERE user_id = $2 AND tenant_id = $3 AND is_primary = true
    `, [totalAmount, req.user?.id, req.user?.tenantId]);
        // Record transaction
        await (0, database_1.query)(`
      INSERT INTO tenant.transactions (
        user_id, tenant_id, type, amount, fees, description,
        reference, status, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    `, [
            req.user?.id,
            req.user?.tenantId,
            'bill_payment',
            paymentAmount,
            fees,
            `Bill payment to ${provider} - ${accountNumber}`,
            reference,
            'completed',
            JSON.stringify({
                provider,
                accountNumber,
                customerName: customerName || `Customer ${accountNumber.slice(-4)}`,
                billType: 'utility'
            })
        ]);
        await (0, database_1.query)('COMMIT');
        res.json({
            success: true,
            message: 'Bill payment successful',
            data: {
                reference,
                amount: paymentAmount,
                fees,
                totalAmount,
                provider,
                accountNumber,
                customerName: customerName || `Customer ${accountNumber.slice(-4)}`,
                timestamp: new Date().toISOString(),
                status: 'completed'
            }
        });
    }
    catch (error) {
        await (0, database_1.query)('ROLLBACK');
        console.error('Bill payment error:', error);
        throw errorHandler_1.errors.internalError('Payment processing failed');
    }
}));
/**
 * GET /api/bills/history
 * Get user's bill payment history
 */
router.get('/history', auth_1.authenticateToken, tenant_1.validateTenantAccess, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { limit = 20, offset = 0 } = req.query;
    const historyResult = await (0, database_1.query)(`
    SELECT
      reference,
      amount,
      fees,
      description,
      status,
      metadata,
      created_at
    FROM tenant.transactions
    WHERE user_id = $1 AND tenant_id = $2 AND type = 'bill_payment'
    ORDER BY created_at DESC
    LIMIT $3 OFFSET $4
  `, [req.user?.id, req.user?.tenantId, limit, offset]);
    const payments = historyResult.rows.map(row => ({
        reference: row.reference,
        amount: parseFloat(row.amount),
        fees: parseFloat(row.fees || '0'),
        description: row.description,
        status: row.status,
        metadata: row.metadata,
        timestamp: row.created_at
    }));
    res.json({
        success: true,
        data: { payments }
    });
}));
exports.default = router;
//# sourceMappingURL=bills.js.map