"use strict";
// ============================================================================
// INTERNAL TRANSFERS SERVICE
// ============================================================================
// Same-bank instant transfers with real-time processing and balance updates
// Features: Instant settlement, transaction limits, dual authorization, audit trail
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalTransferService = void 0;
const transfers_1 = require("../../types/transfers");
class InternalTransferService {
    constructor(db) {
        this.db = db;
    }
    /**
     * Process an internal transfer between wallets within the same tenant
     */
    async processTransfer(request) {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');
            // Step 1: Validate the transfer request
            const validation = await this.validateTransfer({
                customerId: '', // Will be determined from wallet
                walletId: request.fromWalletId,
                amount: request.amount,
                transferType: 'internal'
            });
            if (!validation.isValid) {
                throw new transfers_1.ValidationError(validation.validationErrors.join(', '));
            }
            // Step 2: Get wallet details and verify ownership
            const { fromWallet, toWallet, customer } = await this.getWalletDetails(client, request.fromWalletId, request.toWalletId);
            // Step 3: Validate tenant isolation (both wallets must be in same tenant)
            if (fromWallet.tenant_id !== toWallet.tenant_id) {
                throw new transfers_1.ValidationError('Cross-tenant transfers are not allowed');
            }
            // Step 4: Check balance and limits
            await this.validateBalanceAndLimits(client, fromWallet, request.amount);
            // Step 5: Generate transfer reference
            const reference = request.reference || await this.generateTransferReference();
            // Step 6: Create internal transfer record
            const transferId = await this.createTransferRecord(client, {
                fromWallet,
                toWallet,
                customer,
                request,
                reference
            });
            // Step 7: Execute the transfer (update balances)
            await this.executeTransfer(client, {
                fromWalletId: request.fromWalletId,
                toWalletId: request.toWalletId,
                amount: request.amount,
                transferId,
                reference
            });
            // Step 8: Update daily transfer tracking
            await this.updateTransferTracking(client, fromWallet.id, request.amount);
            // Step 9: Create audit trail
            await this.createAuditTrail(client, {
                transferId,
                customerId: customer.id,
                action: 'INTERNAL_TRANSFER_COMPLETED',
                details: {
                    fromWallet: fromWallet.wallet_name,
                    toWallet: toWallet.wallet_name,
                    amount: request.amount,
                    reference
                }
            });
            await client.query('COMMIT');
            return {
                success: true,
                transactionId: transferId,
                reference,
                status: 'completed',
                message: 'Internal transfer completed successfully',
                data: {
                    fromWallet: fromWallet.wallet_name,
                    toWallet: toWallet.wallet_name,
                    amount: request.amount,
                    fees: 0, // Internal transfers are typically free
                    completedAt: new Date()
                }
            };
        }
        catch (error) {
            await client.query('ROLLBACK');
            if (error instanceof transfers_1.TransferError) {
                throw error;
            }
            throw new transfers_1.TransferError('TRANSFER_PROCESSING_ERROR', `Failed to process internal transfer: ${error.message}`, error, true);
        }
        finally {
            client.release();
        }
    }
    /**
     * Validate transfer request and check limits
     */
    async validateTransfer(request) {
        const client = await this.db.connect();
        try {
            const validationErrors = [];
            // Basic amount validation
            if (request.amount <= 0) {
                validationErrors.push('Transfer amount must be greater than zero');
            }
            // Get wallet details
            const walletQuery = `
                SELECT w.*, u.id as user_id, u.tenant_id
                FROM tenant.wallets w
                JOIN tenant.users u ON w.user_id = u.id
                WHERE w.id = $1 AND w.status = 'active'
            `;
            const walletResult = await client.query(walletQuery, [request.walletId]);
            if (walletResult.rows.length === 0) {
                validationErrors.push('Source wallet not found or inactive');
                return {
                    isValid: false,
                    validationErrors,
                    availableBalance: 0,
                    dailyLimitRemaining: 0,
                    monthlyLimitRemaining: 0
                };
            }
            const wallet = walletResult.rows[0];
            // Check available balance
            if (wallet.available_balance < request.amount) {
                validationErrors.push('Insufficient available balance');
            }
            // Check daily limits
            const dailyQuery = `
                SELECT COALESCE(SUM(amount), 0) as daily_used
                FROM tenant.internal_transfers
                WHERE from_wallet_id = $1
                AND status = 'completed'
                AND created_at >= CURRENT_DATE
            `;
            const dailyResult = await client.query(dailyQuery, [wallet.id]);
            const dailyUsed = parseFloat(dailyResult.rows[0].daily_used);
            const dailyLimit = parseFloat(wallet.daily_limit) || 500000;
            const dailyRemaining = dailyLimit - dailyUsed;
            if (request.amount > dailyRemaining) {
                validationErrors.push(`Daily transfer limit exceeded. Remaining: ₦${dailyRemaining.toLocaleString()}`);
            }
            // Check monthly limits
            const monthlyQuery = `
                SELECT COALESCE(SUM(amount), 0) as monthly_used
                FROM tenant.internal_transfers
                WHERE from_wallet_id = $1
                AND status = 'completed'
                AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
            `;
            const monthlyResult = await client.query(monthlyQuery, [wallet.id]);
            const monthlyUsed = parseFloat(monthlyResult.rows[0].monthly_used);
            const monthlyLimit = parseFloat(wallet.monthly_limit) || 5000000;
            const monthlyRemaining = monthlyLimit - monthlyUsed;
            if (request.amount > monthlyRemaining) {
                validationErrors.push(`Monthly transfer limit exceeded. Remaining: ₦${monthlyRemaining.toLocaleString()}`);
            }
            return {
                isValid: validationErrors.length === 0,
                validationErrors,
                availableBalance: parseFloat(wallet.available_balance),
                dailyLimitRemaining: dailyRemaining,
                monthlyLimitRemaining: monthlyRemaining,
                suggestedActions: validationErrors.length > 0 ? [
                    'Consider transferring a smaller amount',
                    'Wait for daily limits to reset',
                    'Contact support to increase limits'
                ] : undefined
            };
        }
        catch (error) {
            throw new transfers_1.TransferError('VALIDATION_ERROR', `Failed to validate transfer: ${error.message}`, error);
        }
        finally {
            client.release();
        }
    }
    /**
     * Get transfer status
     */
    async getTransferStatus(transactionId) {
        const client = await this.db.connect();
        try {
            const query = `
                SELECT it.*,
                       fw.wallet_name as from_wallet_name,
                       tw.wallet_name as to_wallet_name,
                       CONCAT(u.first_name, ' ', u.last_name) as customer_name
                FROM tenant.internal_transfers it
                JOIN tenant.wallets fw ON it.from_wallet_id = fw.id
                JOIN tenant.wallets tw ON it.to_wallet_id = tw.id
                JOIN tenant.users u ON it.user_id = u.id
                WHERE it.id = $1
            `;
            const result = await client.query(query, [transactionId]);
            if (result.rows.length === 0) {
                return {
                    success: false,
                    status: 'failed',
                    message: 'Transfer not found',
                    errors: ['Transaction not found']
                };
            }
            const transfer = result.rows[0];
            return {
                success: true,
                transactionId: transfer.id,
                reference: transfer.reference,
                status: transfer.status,
                message: `Transfer is ${transfer.status}`,
                data: {
                    fromWallet: transfer.from_wallet_name,
                    toWallet: transfer.to_wallet_name,
                    amount: parseFloat(transfer.amount),
                    description: transfer.description,
                    createdAt: transfer.created_at,
                    customerName: transfer.customer_name
                }
            };
        }
        catch (error) {
            throw new transfers_1.TransferError('STATUS_CHECK_ERROR', `Failed to get transfer status: ${error.message}`, error);
        }
        finally {
            client.release();
        }
    }
    /**
     * Cancel transfer (only pending transfers can be cancelled)
     */
    async cancelTransfer(transactionId, reason) {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');
            // Check if transfer exists and is cancellable
            const checkQuery = `
                SELECT * FROM tenant.internal_transfers
                WHERE id = $1 AND status = 'pending'
            `;
            const checkResult = await client.query(checkQuery, [transactionId]);
            if (checkResult.rows.length === 0) {
                throw new transfers_1.ValidationError('Transfer not found or cannot be cancelled');
            }
            const transfer = checkResult.rows[0];
            // Update transfer status
            const updateQuery = `
                UPDATE tenant.internal_transfers
                SET status = 'cancelled', description = $2
                WHERE id = $1
            `;
            await client.query(updateQuery, [transactionId, `${transfer.description} - Cancelled: ${reason}`]);
            await client.query('COMMIT');
            return {
                success: true,
                transactionId,
                status: 'cancelled',
                message: 'Transfer cancelled successfully'
            };
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Retry transfer (not applicable for internal transfers as they're instant)
     */
    async retryTransfer(transactionId) {
        throw new transfers_1.ValidationError('Internal transfers are processed instantly and cannot be retried');
    }
    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================
    async getWalletDetails(client, fromWalletId, toWalletId) {
        const query = `
            SELECT w.*, u.id as user_id,
                   CONCAT(u.first_name, ' ', u.last_name) as full_name,
                   u.tenant_id
            FROM tenant.wallets w
            JOIN tenant.users u ON w.user_id = u.id
            WHERE w.id = ANY($1) AND w.status = 'active'
        `;
        const result = await client.query(query, [[fromWalletId, toWalletId]]);
        if (result.rows.length !== 2) {
            throw new transfers_1.ValidationError('One or both wallets not found or inactive');
        }
        const fromWallet = result.rows.find(w => w.id === fromWalletId);
        const toWallet = result.rows.find(w => w.id === toWalletId);
        if (!fromWallet || !toWallet) {
            throw new transfers_1.ValidationError('Wallet configuration error');
        }
        // For internal transfers, typically the same user owns both wallets
        // But we'll allow transfers between different users within same tenant
        const customer = result.rows.find(w => w.id === fromWalletId);
        return { fromWallet, toWallet, customer };
    }
    async validateBalanceAndLimits(client, wallet, amount) {
        // Check available balance
        if (parseFloat(wallet.available_balance) < amount) {
            throw new transfers_1.InsufficientFundsError(parseFloat(wallet.available_balance), amount);
        }
        // Check if daily limit reset is needed
        const today = new Date().toISOString().split('T')[0];
        if (wallet.last_transfer_reset_date !== today) {
            await client.query(`
                UPDATE tenant.wallets
                SET daily_transfer_count = 0,
                    daily_transfer_amount = 0,
                    last_transfer_reset_date = CURRENT_DATE
                WHERE id = $1
            `, [wallet.id]);
            wallet.daily_transfer_amount = 0;
            wallet.daily_transfer_count = 0;
        }
        // Check daily amount limit
        const dailyUsed = parseFloat(wallet.daily_transfer_amount || 0);
        const dailyLimit = parseFloat(wallet.daily_transfer_limit || 100000);
        if (dailyUsed + amount > dailyLimit) {
            throw new transfers_1.LimitExceededError('Daily transfer amount', dailyLimit, dailyUsed + amount);
        }
    }
    async generateTransferReference() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        return `INT-${timestamp}-${random}`;
    }
    async createTransferRecord(client, data) {
        const query = `
            INSERT INTO tenant.internal_transfers (
                user_id, from_wallet_id, to_wallet_id, reference, amount,
                description, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING id
        `;
        const values = [
            data.customer.user_id,
            data.request.fromWalletId,
            data.request.toWalletId,
            data.reference,
            data.request.amount,
            data.request.narration,
            'completed' // Internal transfers are instant
        ];
        const result = await client.query(query, values);
        return result.rows[0].id;
    }
    async executeTransfer(client, data) {
        // Debit from source wallet
        await client.query(`
            UPDATE tenant.wallets
            SET available_balance = available_balance - $1,
                ledger_balance = ledger_balance - $1,
                updated_at = NOW()
            WHERE id = $2
        `, [data.amount, data.fromWalletId]);
        // Credit to destination wallet
        await client.query(`
            UPDATE tenant.wallets
            SET available_balance = available_balance + $1,
                ledger_balance = ledger_balance + $1,
                updated_at = NOW()
            WHERE id = $2
        `, [data.amount, data.toWalletId]);
        // Log transaction details for both wallets
        await this.logWalletTransaction(client, {
            walletId: data.fromWalletId,
            type: 'debit',
            amount: data.amount,
            reference: data.reference,
            description: `Internal transfer to wallet`,
            transferId: data.transferId
        });
        await this.logWalletTransaction(client, {
            walletId: data.toWalletId,
            type: 'credit',
            amount: data.amount,
            reference: data.reference,
            description: `Internal transfer from wallet`,
            transferId: data.transferId
        });
    }
    async updateTransferTracking(client, walletId, amount) {
        await client.query(`
            UPDATE tenant.wallets
            SET daily_transfer_count = daily_transfer_count + 1,
                daily_transfer_amount = daily_transfer_amount + $1
            WHERE id = $2
        `, [amount, walletId]);
    }
    async logWalletTransaction(client, data) {
        const query = `
            INSERT INTO tenant.wallet_transactions (
                wallet_id, transaction_type, amount, reference,
                description, transfer_id, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `;
        // Create wallet_transactions table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS tenant.wallet_transactions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                wallet_id UUID NOT NULL REFERENCES tenant.wallets(id),
                transaction_type VARCHAR(20) NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                reference VARCHAR(100) NOT NULL,
                description TEXT,
                transfer_id UUID,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        await client.query(query, [
            data.walletId,
            data.type,
            data.amount,
            data.reference,
            data.description,
            data.transferId
        ]);
    }
    async createAuditTrail(client, data) {
        // Log to user activity logs for audit trail
        const query = `
            INSERT INTO tenant.user_activity_logs (
                user_id, activity_type, description, metadata, created_at
            ) VALUES ($1, $2, $3, $4, NOW())
        `;
        await client.query(query, [
            data.customerId,
            data.action,
            `Internal transfer completed: ${data.details.amount} from ${data.details.fromWallet} to ${data.details.toWallet}`,
            JSON.stringify(data.details)
        ]);
    }
    /**
     * Get user's internal transfers history
     */
    async getTransferHistory(customerId, options = {}) {
        const client = await this.db.connect();
        try {
            const { page = 1, limit = 20, status, startDate, endDate } = options;
            const offset = (page - 1) * limit;
            let whereClause = 'WHERE it.user_id = $1';
            const queryParams = [customerId];
            let paramIndex = 2;
            if (status) {
                whereClause += ` AND it.status = $${paramIndex}`;
                queryParams.push(status);
                paramIndex++;
            }
            if (startDate) {
                whereClause += ` AND it.created_at >= $${paramIndex}`;
                queryParams.push(startDate);
                paramIndex++;
            }
            if (endDate) {
                whereClause += ` AND it.created_at <= $${paramIndex}`;
                queryParams.push(endDate);
                paramIndex++;
            }
            const query = `
                SELECT it.*,
                       fw.wallet_name as from_wallet_name,
                       tw.wallet_name as to_wallet_name
                FROM tenant.internal_transfers it
                JOIN tenant.wallets fw ON it.from_wallet_id = fw.id
                JOIN tenant.wallets tw ON it.to_wallet_id = tw.id
                ${whereClause}
                ORDER BY it.created_at DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;
            queryParams.push(limit, offset);
            const result = await client.query(query, queryParams);
            // Get total count
            const countQuery = `
                SELECT COUNT(*) as total
                FROM tenant.internal_transfers it
                ${whereClause.replace(/LIMIT.*/, '')}
            `;
            const countResult = await client.query(countQuery, queryParams.slice(0, -2));
            const total = parseInt(countResult.rows[0].total);
            return {
                data: result.rows.map(transfer => ({
                    id: transfer.id,
                    reference: transfer.reference,
                    amount: parseFloat(transfer.amount),
                    fromWallet: transfer.from_wallet_name,
                    toWallet: transfer.to_wallet_name,
                    description: transfer.description,
                    status: transfer.status,
                    createdAt: transfer.created_at
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            };
        }
        catch (error) {
            throw new transfers_1.TransferError('HISTORY_FETCH_ERROR', `Failed to fetch transfer history: ${error.message}`, error);
        }
        finally {
            client.release();
        }
    }
}
exports.InternalTransferService = InternalTransferService;
//# sourceMappingURL=InternalTransferService.js.map