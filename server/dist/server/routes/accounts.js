"use strict";
/**
 * Account Management Routes
 * User account information and management endpoints
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
/**
 * GET /api/accounts
 * Get user's accounts/wallets information
 */
router.get('/', auth_1.authenticateToken, tenant_1.validateTenantAccess, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const walletsResult = await (0, database_1.query)(`
    SELECT
      w.id,
      w.wallet_number as account_number,
      w.balance,
      w.currency,
      w.is_primary,
      w.wallet_type,
      w.status,
      w.created_at,
      w.updated_at,
      u.first_name,
      u.last_name,
      u.kyc_level
    FROM tenant.wallets w
    JOIN tenant.users u ON w.user_id = u.id
    WHERE w.user_id = $1 AND w.tenant_id = $2
    ORDER BY w.is_primary DESC, w.created_at DESC
  `, [req.user?.id, req.user?.tenantId]);
    const accounts = walletsResult.rows.map(row => ({
        id: row.id,
        accountNumber: row.account_number,
        accountName: `${row.first_name} ${row.last_name}`,
        balance: parseFloat(row.balance),
        currency: row.currency,
        accountType: row.wallet_type || 'savings',
        isPrimary: row.is_primary,
        status: row.status,
        kycLevel: row.kyc_level,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }));
    res.json({
        success: true,
        data: { accounts }
    });
}));
/**
 * GET /api/accounts/:id
 * Get specific account details
 */
router.get('/:id', auth_1.authenticateToken, tenant_1.validateTenantAccess, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const accountResult = await (0, database_1.query)(`
    SELECT
      w.id,
      w.wallet_number as account_number,
      w.balance,
      w.currency,
      w.is_primary,
      w.wallet_type,
      w.status,
      w.created_at,
      w.updated_at,
      u.first_name,
      u.last_name,
      u.kyc_level,
      u.daily_limit,
      u.monthly_limit
    FROM tenant.wallets w
    JOIN tenant.users u ON w.user_id = u.id
    WHERE w.id = $1 AND w.user_id = $2 AND w.tenant_id = $3
  `, [id, req.user?.id, req.user?.tenantId]);
    if (accountResult.rows.length === 0) {
        throw errorHandler_1.errors.notFound('Account not found', 'ACCOUNT_NOT_FOUND');
    }
    const account = accountResult.rows[0];
    res.json({
        success: true,
        data: {
            id: account.id,
            accountNumber: account.account_number,
            accountName: `${account.first_name} ${account.last_name}`,
            balance: parseFloat(account.balance),
            currency: account.currency,
            accountType: account.wallet_type || 'savings',
            isPrimary: account.is_primary,
            status: account.status,
            kycLevel: account.kyc_level,
            limits: {
                dailyLimit: parseFloat(account.daily_limit || '0'),
                monthlyLimit: parseFloat(account.monthly_limit || '0')
            },
            createdAt: account.created_at,
            updatedAt: account.updated_at
        }
    });
}));
exports.default = router;
//# sourceMappingURL=accounts.js.map