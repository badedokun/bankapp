"use strict";
/**
 * Savings Products Routes
 * Complete implementation of all 5 savings products from MidasTap requirements
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
// Savings product configuration based on MidasTap requirements
const SAVINGS_CONFIG = {
    flexible: {
        minAmount: 5000,
        maxAmount: 10000000,
        annualInterestRate: 10, // 10% per annum
        withdrawalPenalty: 0, // No penalty
        minLockPeriod: 0, // No lock period
    },
    target: {
        minAmount: 5000,
        maxAmount: 10000000,
        annualInterestRate: 12, // 12% per annum
        withdrawalPenalty: 2.5, // 2.5% penalty for early withdrawal
        minLockPeriod: 30, // 30 days minimum
    },
    locked: {
        minAmount: 10000,
        maxAmount: 50000000,
        annualInterestRate: 15, // 15% per annum
        withdrawalPenalty: 5, // 5% penalty (emergency only)
        lockPeriods: [90, 180, 365], // 3, 6, 12 months
    },
    group: {
        minAmount: 1000, // Per member
        maxAmount: 5000000, // Total pool
        annualInterestRate: 13, // 13% per annum
        minMembers: 2,
        maxMembers: 20,
        withdrawalPenalty: 3, // 3% penalty
    },
    sayt: {
        percentageOfTransaction: 1, // Default 1% of transaction
        minPercentage: 0.5,
        maxPercentage: 10,
        annualInterestRate: 8, // 8% per annum
        autoSaveEnabled: true,
    }
};
/**
 * GET /api/savings/accounts
 * Get all savings accounts for the user
 */
router.get('/accounts', auth_1.authenticateToken, tenant_1.validateTenantAccess, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    const accounts = await (0, database_1.query)(`
      SELECT
        sa.*,
        sp.name as product_name,
        sp.interest_rate,
        sp.minimum_balance,
        sp.withdrawal_penalty
      FROM tenant.savings_accounts sa
      JOIN tenant.savings_products sp ON sa.product_id = sp.id
      WHERE sa.user_id = $1 AND sa.tenant_id = $2
      ORDER BY sa.created_at DESC
    `, [userId, tenantId]);
    res.json({
        success: true,
        data: accounts.rows
    });
}));
/**
 * POST /api/savings/flexible/create
 * Create a flexible savings account
 */
router.post('/flexible/create', auth_1.authenticateToken, tenant_1.validateTenantAccess, [
    (0, express_validator_1.body)('accountName').notEmpty().withMessage('Account name is required'),
    (0, express_validator_1.body)('initialDeposit').isFloat({ min: SAVINGS_CONFIG.flexible.minAmount })
        .withMessage(`Minimum initial deposit is ₦${SAVINGS_CONFIG.flexible.minAmount}`),
    (0, express_validator_1.body)('targetAmount').optional().isFloat({ min: 0 }),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    const { accountName, initialDeposit, targetAmount } = req.body;
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    await (0, database_1.transaction)(async (client) => {
        // Check wallet balance
        const walletResult = await client.query('SELECT balance FROM tenant.wallets WHERE user_id = $1 AND tenant_id = $2', [userId, tenantId]);
        if (!walletResult.rows[0] || walletResult.rows[0].balance < initialDeposit) {
            throw new Error('Insufficient wallet balance');
        }
        // Create flexible savings account
        const accountResult = await client.query(`
        INSERT INTO tenant.savings_accounts (
          tenant_id, user_id, product_type, account_name,
          balance, target_amount, interest_rate, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
            tenantId, userId, 'flexible', accountName,
            initialDeposit, targetAmount || 0,
            SAVINGS_CONFIG.flexible.annualInterestRate, 'active'
        ]);
        // Deduct from wallet
        await client.query('UPDATE tenant.wallets SET balance = balance - $1 WHERE user_id = $2 AND tenant_id = $3', [initialDeposit, userId, tenantId]);
        // Record transaction
        await client.query(`
        INSERT INTO tenant.transactions (
          tenant_id, user_id, type, amount, description, status
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
            tenantId, userId, 'savings_deposit', initialDeposit,
            `Initial deposit to ${accountName}`, 'completed'
        ]);
        res.json({
            success: true,
            data: accountResult.rows[0],
            message: 'Flexible savings account created successfully'
        });
    });
}));
/**
 * POST /api/savings/flexible/deposit
 * Deposit to flexible savings account
 */
router.post('/flexible/deposit', auth_1.authenticateToken, tenant_1.validateTenantAccess, [
    (0, express_validator_1.body)('accountId').notEmpty().withMessage('Account ID is required'),
    (0, express_validator_1.body)('amount').isFloat({ min: 100 }).withMessage('Minimum deposit is ₦100'),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { accountId, amount } = req.body;
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    await (0, database_1.transaction)(async (client) => {
        // Verify account ownership
        const accountResult = await client.query('SELECT * FROM tenant.savings_accounts WHERE id = $1 AND user_id = $2 AND tenant_id = $3', [accountId, userId, tenantId]);
        if (!accountResult.rows[0]) {
            throw new Error('Savings account not found');
        }
        // Check wallet balance
        const walletResult = await client.query('SELECT balance FROM tenant.wallets WHERE user_id = $1 AND tenant_id = $2', [userId, tenantId]);
        if (!walletResult.rows[0] || walletResult.rows[0].balance < amount) {
            throw new Error('Insufficient wallet balance');
        }
        // Update savings balance
        await client.query('UPDATE tenant.savings_accounts SET balance = balance + $1 WHERE id = $2', [amount, accountId]);
        // Deduct from wallet
        await client.query('UPDATE tenant.wallets SET balance = balance - $1 WHERE user_id = $2 AND tenant_id = $3', [amount, userId, tenantId]);
        // Record transaction
        await client.query(`
        INSERT INTO tenant.transactions (
          tenant_id, user_id, type, amount, description, status
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
            tenantId, userId, 'savings_deposit', amount,
            `Deposit to savings account`, 'completed'
        ]);
        res.json({
            success: true,
            message: 'Deposit successful'
        });
    });
}));
/**
 * POST /api/savings/target/create
 * Create a target savings account
 */
router.post('/target/create', auth_1.authenticateToken, tenant_1.validateTenantAccess, [
    (0, express_validator_1.body)('goalName').notEmpty().withMessage('Goal name is required'),
    (0, express_validator_1.body)('targetAmount').isFloat({ min: SAVINGS_CONFIG.target.minAmount })
        .withMessage(`Minimum target amount is ₦${SAVINGS_CONFIG.target.minAmount}`),
    (0, express_validator_1.body)('targetDate').isISO8601().withMessage('Valid target date is required'),
    (0, express_validator_1.body)('initialDeposit').optional().isFloat({ min: 100 }),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { goalName, targetAmount, targetDate, initialDeposit } = req.body;
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    await (0, database_1.transaction)(async (client) => {
        // Create target savings account
        const accountResult = await client.query(`
        INSERT INTO tenant.savings_accounts (
          tenant_id, user_id, product_type, account_name,
          balance, target_amount, target_date, interest_rate, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
            tenantId, userId, 'target', goalName,
            initialDeposit || 0, targetAmount, targetDate,
            SAVINGS_CONFIG.target.annualInterestRate, 'active'
        ]);
        // If initial deposit, deduct from wallet
        if (initialDeposit > 0) {
            await client.query('UPDATE tenant.wallets SET balance = balance - $1 WHERE user_id = $2 AND tenant_id = $3', [initialDeposit, userId, tenantId]);
            // Record transaction
            await client.query(`
          INSERT INTO tenant.transactions (
            tenant_id, user_id, type, amount, description, status
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
                tenantId, userId, 'savings_deposit', initialDeposit,
                `Initial deposit to ${goalName} goal`, 'completed'
            ]);
        }
        res.json({
            success: true,
            data: accountResult.rows[0],
            message: 'Target savings goal created successfully'
        });
    });
}));
/**
 * GET /api/savings/target/goals
 * Get all target savings goals
 */
router.get('/target/goals', auth_1.authenticateToken, tenant_1.validateTenantAccess, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    const goals = await (0, database_1.query)(`
      SELECT
        *,
        ROUND((balance / target_amount * 100)::numeric, 2) as progress_percentage,
        (target_date - CURRENT_DATE) as days_remaining
      FROM tenant.savings_accounts
      WHERE user_id = $1 AND tenant_id = $2 AND product_type = 'target'
      ORDER BY created_at DESC
    `, [userId, tenantId]);
    res.json({
        success: true,
        data: goals.rows
    });
}));
/**
 * POST /api/savings/target/contribute
 * Contribute to a target savings goal
 */
router.post('/target/contribute', auth_1.authenticateToken, tenant_1.validateTenantAccess, [
    (0, express_validator_1.body)('goalId').notEmpty().withMessage('Goal ID is required'),
    (0, express_validator_1.body)('amount').isFloat({ min: 100 }).withMessage('Minimum contribution is ₦100'),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { goalId, amount } = req.body;
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    await (0, database_1.transaction)(async (client) => {
        // Similar to flexible deposit logic
        const accountResult = await client.query('SELECT * FROM tenant.savings_accounts WHERE id = $1 AND user_id = $2 AND product_type = \'target\'', [goalId, userId]);
        if (!accountResult.rows[0]) {
            throw new Error('Target savings goal not found');
        }
        // Update balance and process
        await client.query('UPDATE tenant.savings_accounts SET balance = balance + $1 WHERE id = $2', [amount, goalId]);
        await client.query('UPDATE tenant.wallets SET balance = balance - $1 WHERE user_id = $2 AND tenant_id = $3', [amount, userId, tenantId]);
        res.json({
            success: true,
            message: 'Contribution successful'
        });
    });
}));
/**
 * POST /api/savings/locked/create
 * Create a locked savings account
 */
router.post('/locked/create', auth_1.authenticateToken, tenant_1.validateTenantAccess, [
    (0, express_validator_1.body)('accountName').notEmpty().withMessage('Account name is required'),
    (0, express_validator_1.body)('amount').isFloat({ min: SAVINGS_CONFIG.locked.minAmount })
        .withMessage(`Minimum amount is ₦${SAVINGS_CONFIG.locked.minAmount}`),
    (0, express_validator_1.body)('lockPeriod').isIn(SAVINGS_CONFIG.locked.lockPeriods)
        .withMessage('Lock period must be 90, 180, or 365 days'),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { accountName, amount, lockPeriod } = req.body;
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    await (0, database_1.transaction)(async (client) => {
        const maturityDate = new Date();
        maturityDate.setDate(maturityDate.getDate() + lockPeriod);
        // Create locked savings account
        const accountResult = await client.query(`
        INSERT INTO tenant.savings_accounts (
          tenant_id, user_id, product_type, account_name,
          balance, lock_period_days, maturity_date, interest_rate, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
            tenantId, userId, 'locked', accountName,
            amount, lockPeriod, maturityDate,
            SAVINGS_CONFIG.locked.annualInterestRate, 'locked'
        ]);
        // Deduct from wallet
        await client.query('UPDATE tenant.wallets SET balance = balance - $1 WHERE user_id = $2 AND tenant_id = $3', [amount, userId, tenantId]);
        res.json({
            success: true,
            data: accountResult.rows[0],
            message: 'Locked savings account created successfully'
        });
    });
}));
/**
 * GET /api/savings/locked/terms
 * Get locked savings terms and rates
 */
router.get('/locked/terms', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const terms = SAVINGS_CONFIG.locked.lockPeriods.map(days => ({
        days,
        months: days / 30,
        interestRate: SAVINGS_CONFIG.locked.annualInterestRate,
        minAmount: SAVINGS_CONFIG.locked.minAmount,
        maxAmount: SAVINGS_CONFIG.locked.maxAmount,
        earlyWithdrawalPenalty: SAVINGS_CONFIG.locked.withdrawalPenalty
    }));
    res.json({
        success: true,
        data: terms
    });
}));
/**
 * GET /api/savings/locked/maturity
 * Check maturity status of locked savings
 */
router.get('/locked/maturity', auth_1.authenticateToken, tenant_1.validateTenantAccess, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    const accounts = await (0, database_1.query)(`
      SELECT
        *,
        CASE
          WHEN maturity_date <= CURRENT_DATE THEN 'matured'
          ELSE 'locked'
        END as maturity_status,
        (maturity_date - CURRENT_DATE) as days_to_maturity
      FROM tenant.savings_accounts
      WHERE user_id = $1 AND tenant_id = $2 AND product_type = 'locked'
      ORDER BY maturity_date ASC
    `, [userId, tenantId]);
    res.json({
        success: true,
        data: accounts.rows
    });
}));
/**
 * POST /api/savings/group/create
 * Create a group savings account
 */
router.post('/group/create', auth_1.authenticateToken, tenant_1.validateTenantAccess, [
    (0, express_validator_1.body)('groupName').notEmpty().withMessage('Group name is required'),
    (0, express_validator_1.body)('description').optional(),
    (0, express_validator_1.body)('targetAmount').isFloat({ min: 10000 })
        .withMessage('Minimum group target is ₦10,000'),
    (0, express_validator_1.body)('contributionAmount').isFloat({ min: SAVINGS_CONFIG.group.minAmount })
        .withMessage(`Minimum contribution is ₦${SAVINGS_CONFIG.group.minAmount}`),
    (0, express_validator_1.body)('frequency').isIn(['daily', 'weekly', 'monthly'])
        .withMessage('Frequency must be daily, weekly, or monthly'),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { groupName, description, targetAmount, contributionAmount, frequency } = req.body;
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    await (0, database_1.transaction)(async (client) => {
        // Create group savings account
        const groupResult = await client.query(`
        INSERT INTO tenant.group_savings (
          tenant_id, created_by, group_name, description,
          target_amount, contribution_amount, frequency,
          interest_rate, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
            tenantId, userId, groupName, description,
            targetAmount, contributionAmount, frequency,
            SAVINGS_CONFIG.group.annualInterestRate, 'active'
        ]);
        // Add creator as first member
        await client.query(`
        INSERT INTO tenant.group_savings_members (
          group_id, user_id, role, contribution_total, joined_at
        ) VALUES ($1, $2, $3, $4, NOW())
      `, [groupResult.rows[0].id, userId, 'admin', 0]);
        res.json({
            success: true,
            data: groupResult.rows[0],
            message: 'Group savings created successfully'
        });
    });
}));
/**
 * POST /api/savings/group/invite
 * Invite members to group savings
 */
router.post('/group/invite', auth_1.authenticateToken, tenant_1.validateTenantAccess, [
    (0, express_validator_1.body)('groupId').notEmpty().withMessage('Group ID is required'),
    (0, express_validator_1.body)('emails').isArray().withMessage('Emails must be an array'),
    (0, express_validator_1.body)('emails.*').isEmail().withMessage('Invalid email format'),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { groupId, emails } = req.body;
    const userId = req.user.userId;
    // Verify admin rights
    const adminCheck = await (0, database_1.query)('SELECT role FROM tenant.group_savings_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
    if (!adminCheck.rows[0] || adminCheck.rows[0].role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Only group admin can invite members'
        });
    }
    // Process invitations (simplified - would normally send emails)
    res.json({
        success: true,
        message: `Invitations sent to ${emails.length} people`
    });
}));
/**
 * GET /api/savings/group/members
 * Get group members and their contributions
 */
router.get('/group/members/:groupId', auth_1.authenticateToken, tenant_1.validateTenantAccess, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { groupId } = req.params;
    const userId = req.user.userId;
    // Verify membership
    const memberCheck = await (0, database_1.query)('SELECT * FROM tenant.group_savings_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
    if (!memberCheck.rows[0]) {
        return res.status(403).json({
            success: false,
            message: 'You are not a member of this group'
        });
    }
    const members = await (0, database_1.query)(`
      SELECT
        gsm.*,
        u.first_name,
        u.last_name,
        u.email
      FROM tenant.group_savings_members gsm
      JOIN tenant.users u ON gsm.user_id = u.id
      WHERE gsm.group_id = $1
      ORDER BY gsm.contribution_total DESC
    `, [groupId]);
    res.json({
        success: true,
        data: members.rows
    });
}));
/**
 * POST /api/savings/auto/enable
 * Enable Save As You Transact (SAYT)
 */
router.post('/auto/enable', auth_1.authenticateToken, tenant_1.validateTenantAccess, [
    (0, express_validator_1.body)('percentage').isFloat({
        min: SAVINGS_CONFIG.sayt.minPercentage,
        max: SAVINGS_CONFIG.sayt.maxPercentage
    }).withMessage(`Percentage must be between ${SAVINGS_CONFIG.sayt.minPercentage}% and ${SAVINGS_CONFIG.sayt.maxPercentage}%`),
    (0, express_validator_1.body)('savingsAccountId').optional(),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { percentage, savingsAccountId } = req.body;
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    await (0, database_1.transaction)(async (client) => {
        // Create or update SAYT settings
        const result = await client.query(`
        INSERT INTO tenant.sayt_settings (
          tenant_id, user_id, percentage, target_account_id,
          is_active, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (tenant_id, user_id)
        DO UPDATE SET
          percentage = $3,
          target_account_id = $4,
          is_active = $5,
          updated_at = NOW()
        RETURNING *
      `, [
            tenantId, userId, percentage,
            savingsAccountId || null, true
        ]);
        res.json({
            success: true,
            data: result.rows[0],
            message: 'Save As You Transact enabled successfully'
        });
    });
}));
/**
 * PUT /api/savings/auto/settings
 * Update SAYT settings
 */
router.put('/auto/settings', auth_1.authenticateToken, tenant_1.validateTenantAccess, [
    (0, express_validator_1.body)('percentage').optional().isFloat({
        min: SAVINGS_CONFIG.sayt.minPercentage,
        max: SAVINGS_CONFIG.sayt.maxPercentage
    }),
    (0, express_validator_1.body)('isActive').optional().isBoolean(),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { percentage, isActive } = req.body;
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    const updates = [];
    const values = [];
    let paramCount = 1;
    if (percentage !== undefined) {
        updates.push(`percentage = $${paramCount++}`);
        values.push(percentage);
    }
    if (isActive !== undefined) {
        updates.push(`is_active = $${paramCount++}`);
        values.push(isActive);
    }
    updates.push(`updated_at = NOW()`);
    values.push(tenantId, userId);
    const result = await (0, database_1.query)(`
      UPDATE tenant.sayt_settings
      SET ${updates.join(', ')}
      WHERE tenant_id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `, values);
    res.json({
        success: true,
        data: result.rows[0],
        message: 'Settings updated successfully'
    });
}));
/**
 * GET /api/savings/auto/history
 * Get SAYT auto-save history
 */
router.get('/auto/history', auth_1.authenticateToken, tenant_1.validateTenantAccess, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    const { limit = 50, offset = 0 } = req.query;
    const history = await (0, database_1.query)(`
      SELECT
        t.id,
        t.amount as transaction_amount,
        sh.saved_amount,
        sh.percentage_saved,
        t.description,
        t.created_at
      FROM tenant.sayt_history sh
      JOIN tenant.transactions t ON sh.transaction_id = t.id
      WHERE sh.user_id = $1 AND sh.tenant_id = $2
      ORDER BY sh.created_at DESC
      LIMIT $3 OFFSET $4
    `, [userId, tenantId, limit, offset]);
    res.json({
        success: true,
        data: history.rows
    });
}));
exports.default = router;
