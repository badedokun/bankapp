"use strict";
/**
 * Transaction Receipt and Records Management Service
 * Handles receipt generation, transaction records, and history management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
class TransactionReceiptService {
    constructor(database) {
        this.db = database;
        this.receiptStoragePath = process.env.RECEIPT_STORAGE_PATH || './receipts';
        this.ensureStorageDirectory();
    }
    /**
     * Generate receipt for any transaction type
     */
    async generateReceipt(transactionId, transactionType, tenantId) {
        const client = await this.db.connect();
        try {
            // Get transaction details based on type
            const transactionData = await this.getTransactionData(transactionId, transactionType, tenantId, client);
            if (!transactionData) {
                throw new Error(`Transaction not found: ${transactionId}`);
            }
            // Generate receipt number
            const receiptNumber = await this.generateReceiptNumber(tenantId, client);
            // Create receipt record
            const receiptId = (0, uuid_1.v4)();
            const receipt = {
                id: receiptId,
                transactionId,
                receiptNumber,
                transactionType: transactionType,
                amount: transactionData.amount,
                fees: transactionData.fees || 0,
                totalAmount: transactionData.total_amount || transactionData.amount,
                currency: transactionData.currency || 'NGN',
                status: transactionData.status,
                sender: {
                    accountNumber: transactionData.sender_account_number,
                    accountName: transactionData.sender_account_name,
                    bankName: transactionData.sender_bank_name || 'Banking Institution',
                },
                recipient: {
                    accountNumber: transactionData.recipient_account_number,
                    accountName: transactionData.recipient_name,
                    bankName: transactionData.recipient_bank_name || 'External Bank',
                    bankCode: transactionData.recipient_bank_code,
                },
                transactionDate: transactionData.created_at,
                description: transactionData.description,
                reference: transactionData.reference,
                sessionId: transactionData.session_id,
                narration: transactionData.narration,
                createdAt: new Date(),
            };
            // Save receipt to database
            await client.query(`
        INSERT INTO platform.transaction_receipts (
          id, tenant_id, transaction_id, transaction_type, receipt_number,
          amount, fees, total_amount, currency, status, sender_details,
          recipient_details, transaction_date, description, reference,
          session_id, narration, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
      `, [
                receiptId,
                tenantId,
                transactionId,
                transactionType,
                receiptNumber,
                receipt.amount,
                receipt.fees,
                receipt.totalAmount,
                receipt.currency,
                receipt.status,
                JSON.stringify(receipt.sender),
                JSON.stringify(receipt.recipient),
                receipt.transactionDate,
                receipt.description,
                receipt.reference,
                receipt.sessionId,
                receipt.narration
            ]);
            // Generate and save receipt file
            await this.generateReceiptFile(receipt, tenantId);
            return receipt;
        }
        catch (error) {
            console.error('Receipt generation error:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Get transaction data from appropriate table based on type
     */
    async getTransactionData(transactionId, transactionType, tenantId, client) {
        let query = '';
        let params = [transactionId, tenantId];
        switch (transactionType) {
            case 'internal_transfer':
                query = `
          SELECT
            it.*,
            sa.account_number as sender_account_number,
            sa.account_name as sender_account_name,
            t.display_name as sender_bank_name,
            ra.account_number as recipient_account_number,
            ra.account_name as recipient_name,
            t.display_name as recipient_bank_name
          FROM internal_transfers it
          JOIN tenant.accounts sa ON it.sender_account_id = sa.id
          JOIN tenant.accounts ra ON it.recipient_account_id = ra.id
          JOIN platform.tenants t ON it.tenant_id = t.id
          WHERE it.id = $1 AND it.tenant_id = $2
        `;
                break;
            case 'external_transfer':
                query = `
          SELECT
            et.*,
            sa.account_number as sender_account_number,
            sa.account_name as sender_account_name,
            t.display_name as sender_bank_name,
            et.recipient_account_number,
            et.recipient_name,
            et.recipient_bank_name,
            et.recipient_bank_code
          FROM external_transfers et
          JOIN tenant.accounts sa ON et.sender_account_id = sa.id
          JOIN platform.tenants t ON et.tenant_id = t.id
          WHERE et.id = $1 AND et.tenant_id = $2
        `;
                break;
            case 'bill_payment':
                query = `
          SELECT
            bp.*,
            sa.account_number as sender_account_number,
            sa.account_name as sender_account_name,
            t.display_name as sender_bank_name,
            bp.customer_id as recipient_account_number,
            bp.customer_name as recipient_name,
            bp.biller_name as recipient_bank_name
          FROM bill_payments bp
          JOIN tenant.accounts sa ON bp.sender_account_id = sa.id
          JOIN platform.tenants t ON bp.tenant_id = t.id
          WHERE bp.id = $1 AND bp.tenant_id = $2
        `;
                break;
            case 'international_transfer':
                query = `
          SELECT
            it.*,
            sa.account_number as sender_account_number,
            sa.account_name as sender_account_name,
            t.display_name as sender_bank_name,
            it.recipient_iban as recipient_account_number,
            it.recipient_name,
            it.recipient_swift_code as recipient_bank_code
          FROM international_transfers it
          JOIN tenant.accounts sa ON it.sender_account_id = sa.id
          JOIN platform.tenants t ON it.tenant_id = t.id
          WHERE it.id = $1 AND it.tenant_id = $2
        `;
                break;
            case 'scheduled_payment':
                query = `
          SELECT
            sp.*,
            sa.account_number as sender_account_number,
            sa.account_name as sender_account_name,
            t.display_name as sender_bank_name,
            sp.recipient_account_number,
            sp.recipient_name,
            sp.recipient_bank_name,
            sp.recipient_bank_code
          FROM scheduled_payments sp
          JOIN tenant.accounts sa ON sp.sender_account_id = sa.id
          JOIN platform.tenants t ON sp.tenant_id = t.id
          WHERE sp.id = $1 AND sp.tenant_id = $2
        `;
                break;
            default:
                throw new Error(`Unsupported transaction type: ${transactionType}`);
        }
        const result = await client.query(query, params);
        return result.rows[0];
    }
    /**
     * Generate unique receipt number
     */
    async generateReceiptNumber(tenantId, client) {
        const today = new Date();
        const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');
        // Get count of receipts generated today
        const countResult = await client.query(`
      SELECT COUNT(*) as count
      FROM platform.transaction_receipts
      WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE
    `, [tenantId]);
        const dailyCount = parseInt(countResult.rows[0].count) + 1;
        const sequenceNumber = dailyCount.toString().padStart(4, '0');
        return `RCP${datePrefix}${sequenceNumber}`;
    }
    /**
     * Generate receipt file (PDF/HTML)
     */
    async generateReceiptFile(receipt, tenantId) {
        try {
            // Generate HTML receipt
            const htmlContent = this.generateReceiptHTML(receipt);
            // Save to file system
            const fileName = `receipt_${receipt.receiptNumber}.html`;
            const filePath = path_1.default.join(this.receiptStoragePath, tenantId, fileName);
            // Ensure tenant directory exists
            await promises_1.default.mkdir(path_1.default.dirname(filePath), { recursive: true });
            // Write file
            await promises_1.default.writeFile(filePath, htmlContent, 'utf8');
        }
        catch (error) {
            console.error('Receipt file generation error:', error);
            // Don't throw error - receipt record still exists in database
        }
    }
    /**
     * Generate HTML receipt content
     */
    generateReceiptHTML(receipt) {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Transaction Receipt - ${receipt.receiptNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .receipt { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #0066cc; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #0066cc; margin-bottom: 10px; }
        .receipt-title { font-size: 18px; color: #333; margin-bottom: 5px; }
        .receipt-number { font-size: 14px; color: #666; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .detail-label { color: #666; font-weight: 500; }
        .detail-value { color: #333; font-weight: 600; }
        .amount-section { background: #f8f9fa; padding: 15px; border-radius: 5px; }
        .total-amount { font-size: 18px; font-weight: bold; color: #0066cc; }
        .status { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .status.completed { background: #d4edda; color: #155724; }
        .status.processing { background: #fff3cd; color: #856404; }
        .status.failed { background: #f8d7da; color: #721c24; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
        @media print { body { background: white; } .receipt { box-shadow: none; } }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <div class="logo">First Microfinance Bank Limited</div>
            <div class="receipt-title">Transaction Receipt</div>
            <div class="receipt-number">Receipt #: ${receipt.receiptNumber}</div>
        </div>

        <div class="section">
            <div class="section-title">Transaction Details</div>
            <div class="detail-row">
                <span class="detail-label">Transaction Type:</span>
                <span class="detail-value">${this.formatTransactionType(receipt.transactionType)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Reference:</span>
                <span class="detail-value">${receipt.reference}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date & Time:</span>
                <span class="detail-value">${receipt.transactionDate.toLocaleString()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">
                    <span class="status ${receipt.status}">${receipt.status.toUpperCase()}</span>
                </span>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Sender Information</div>
            <div class="detail-row">
                <span class="detail-label">Account Name:</span>
                <span class="detail-value">${receipt.sender.accountName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Account Number:</span>
                <span class="detail-value">${receipt.sender.accountNumber}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Bank:</span>
                <span class="detail-value">${receipt.sender.bankName}</span>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Recipient Information</div>
            <div class="detail-row">
                <span class="detail-label">Recipient Name:</span>
                <span class="detail-value">${receipt.recipient.accountName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Account Number:</span>
                <span class="detail-value">${receipt.recipient.accountNumber}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Bank:</span>
                <span class="detail-value">${receipt.recipient.bankName}</span>
            </div>
            ${receipt.recipient.bankCode ? `
            <div class="detail-row">
                <span class="detail-label">Bank Code:</span>
                <span class="detail-value">${receipt.recipient.bankCode}</span>
            </div>
            ` : ''}
        </div>

        <div class="section amount-section">
            <div class="section-title">Amount Details</div>
            <div class="detail-row">
                <span class="detail-label">Transfer Amount:</span>
                <span class="detail-value">₦${receipt.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            </div>
            ${receipt.fees > 0 ? `
            <div class="detail-row">
                <span class="detail-label">Fees:</span>
                <span class="detail-value">₦${receipt.fees.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            </div>
            ` : ''}
            <div class="detail-row total-amount">
                <span class="detail-label">Total Amount:</span>
                <span class="detail-value">₦${receipt.totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            </div>
        </div>

        ${receipt.description ? `
        <div class="section">
            <div class="section-title">Description</div>
            <div class="detail-value">${receipt.description}</div>
        </div>
        ` : ''}

        ${receipt.narration ? `
        <div class="section">
            <div class="section-title">Narration</div>
            <div class="detail-value">${receipt.narration}</div>
        </div>
        ` : ''}

        <div class="footer">
            <p>This is a computer-generated receipt and does not require a signature.</p>
            <p>For inquiries, please contact customer service</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
    `;
    }
    /**
     * Format transaction type for display
     */
    formatTransactionType(type) {
        const typeMap = {
            'internal_transfer': 'Internal Transfer',
            'external_transfer': 'External Transfer',
            'bill_payment': 'Bill Payment',
            'international_transfer': 'International Transfer',
            'scheduled_payment': 'Scheduled Payment',
        };
        return typeMap[type] || type;
    }
    /**
     * Create transaction record for comprehensive tracking
     */
    async createTransactionRecord(tenantId, userId, accountId, transactionData) {
        const client = await this.db.connect();
        try {
            const recordId = (0, uuid_1.v4)();
            const totalAmount = transactionData.amount + (transactionData.fees || 0);
            await client.query(`
        INSERT INTO platform.transaction_records (
          id, tenant_id, user_id, account_id, transaction_type, transaction_category,
          amount, fees, total_amount, currency, status, reference, description,
          recipient_details, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
      `, [
                recordId,
                tenantId,
                userId,
                accountId,
                transactionData.transactionType,
                transactionData.transactionCategory,
                transactionData.amount,
                transactionData.fees || 0,
                totalAmount,
                transactionData.currency || 'NGN',
                transactionData.status,
                transactionData.reference,
                transactionData.description,
                JSON.stringify(transactionData.recipientDetails || {}),
                JSON.stringify(transactionData.metadata || {})
            ]);
            return recordId;
        }
        catch (error) {
            console.error('Transaction record creation error:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Search transaction records with filters
     */
    async searchTransactionRecords(tenantId, filters) {
        const client = await this.db.connect();
        try {
            let whereConditions = ['tr.tenant_id = $1'];
            let params = [tenantId];
            let paramIndex = 2;
            // Build dynamic WHERE clause
            if (filters.accountId) {
                whereConditions.push(`tr.account_id = $${paramIndex}`);
                params.push(filters.accountId);
                paramIndex++;
            }
            if (filters.transactionType) {
                whereConditions.push(`tr.transaction_type = $${paramIndex}`);
                params.push(filters.transactionType);
                paramIndex++;
            }
            if (filters.status) {
                whereConditions.push(`tr.status = $${paramIndex}`);
                params.push(filters.status);
                paramIndex++;
            }
            if (filters.dateFrom) {
                whereConditions.push(`tr.created_at >= $${paramIndex}`);
                params.push(filters.dateFrom);
                paramIndex++;
            }
            if (filters.dateTo) {
                whereConditions.push(`tr.created_at <= $${paramIndex}`);
                params.push(filters.dateTo);
                paramIndex++;
            }
            if (filters.amountMin) {
                whereConditions.push(`tr.amount >= $${paramIndex}`);
                params.push(filters.amountMin);
                paramIndex++;
            }
            if (filters.amountMax) {
                whereConditions.push(`tr.amount <= $${paramIndex}`);
                params.push(filters.amountMax);
                paramIndex++;
            }
            if (filters.reference) {
                whereConditions.push(`tr.reference ILIKE $${paramIndex}`);
                params.push(`%${filters.reference}%`);
                paramIndex++;
            }
            if (filters.recipientName) {
                whereConditions.push(`tr.recipient_details::text ILIKE $${paramIndex}`);
                params.push(`%${filters.recipientName}%`);
                paramIndex++;
            }
            const whereClause = whereConditions.join(' AND ');
            // Get total count
            const countQuery = `
        SELECT COUNT(*) as total
        FROM platform.transaction_records tr
        WHERE ${whereClause}
      `;
            const countResult = await client.query(countQuery, params);
            const totalCount = parseInt(countResult.rows[0].total);
            // Get records with pagination
            const limit = filters.limit || 50;
            const offset = filters.offset || 0;
            const dataQuery = `
        SELECT tr.*, a.account_number, a.account_name
        FROM platform.transaction_records tr
        JOIN tenant.accounts a ON tr.account_id = a.id
        WHERE ${whereClause}
        ORDER BY tr.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
            params.push(limit, offset);
            const dataResult = await client.query(dataQuery, params);
            const records = dataResult.rows.map(row => ({
                id: row.id,
                tenantId: row.tenant_id,
                userId: row.user_id,
                accountId: row.account_id,
                transactionType: row.transaction_type,
                transactionCategory: row.transaction_category,
                amount: parseFloat(row.amount),
                fees: parseFloat(row.fees),
                totalAmount: parseFloat(row.total_amount),
                currency: row.currency,
                status: row.status,
                reference: row.reference,
                description: row.description,
                recipientDetails: row.recipient_details,
                metadata: row.metadata,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            }));
            return {
                records,
                totalCount,
                pagination: {
                    limit,
                    offset,
                    hasMore: offset + records.length < totalCount,
                },
            };
        }
        catch (error) {
            console.error('Transaction search error:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Get receipt by ID
     */
    async getReceipt(receiptId, tenantId) {
        try {
            const result = await this.db.query(`
        SELECT * FROM platform.transaction_receipts
        WHERE id = $1 AND tenant_id = $2
      `, [receiptId, tenantId]);
            if (result.rows.length === 0) {
                return null;
            }
            const row = result.rows[0];
            return {
                id: row.id,
                transactionId: row.transaction_id,
                receiptNumber: row.receipt_number,
                transactionType: row.transaction_type,
                amount: parseFloat(row.amount),
                fees: parseFloat(row.fees),
                totalAmount: parseFloat(row.total_amount),
                currency: row.currency,
                status: row.status,
                sender: row.sender_details,
                recipient: row.recipient_details,
                transactionDate: row.transaction_date,
                description: row.description,
                reference: row.reference,
                sessionId: row.session_id,
                narration: row.narration,
                createdAt: row.created_at,
            };
        }
        catch (error) {
            console.error('Get receipt error:', error);
            throw error;
        }
    }
    /**
     * Get transaction history for an account
     */
    async getTransactionHistory(accountId, tenantId, limit = 50, offset = 0) {
        try {
            const result = await this.db.query(`
        SELECT tr.*, a.account_number, a.account_name
        FROM platform.transaction_records tr
        JOIN tenant.accounts a ON tr.account_id = a.id
        WHERE tr.account_id = $1 AND tr.tenant_id = $2
        ORDER BY tr.created_at DESC
        LIMIT $3 OFFSET $4
      `, [accountId, tenantId, limit, offset]);
            return result.rows.map(row => ({
                id: row.id,
                tenantId: row.tenant_id,
                userId: row.user_id,
                accountId: row.account_id,
                transactionType: row.transaction_type,
                transactionCategory: row.transaction_category,
                amount: parseFloat(row.amount),
                fees: parseFloat(row.fees),
                totalAmount: parseFloat(row.total_amount),
                currency: row.currency,
                status: row.status,
                reference: row.reference,
                description: row.description,
                recipientDetails: row.recipient_details,
                metadata: row.metadata,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            }));
        }
        catch (error) {
            console.error('Transaction history error:', error);
            throw error;
        }
    }
    /**
     * Ensure storage directory exists
     */
    async ensureStorageDirectory() {
        try {
            await promises_1.default.mkdir(this.receiptStoragePath, { recursive: true });
        }
        catch (error) {
            console.error('Storage directory creation error:', error);
        }
    }
    /**
     * Get transaction summary/statistics
     */
    async getTransactionSummary(accountId, tenantId, period = 'month') {
        const client = await this.db.connect();
        try {
            let dateCondition = '';
            switch (period) {
                case 'today':
                    dateCondition = "AND DATE(tr.created_at) = CURRENT_DATE";
                    break;
                case 'week':
                    dateCondition = "AND tr.created_at >= DATE_TRUNC('week', CURRENT_DATE)";
                    break;
                case 'month':
                    dateCondition = "AND tr.created_at >= DATE_TRUNC('month', CURRENT_DATE)";
                    break;
                case 'year':
                    dateCondition = "AND tr.created_at >= DATE_TRUNC('year', CURRENT_DATE)";
                    break;
            }
            // Get overall summary
            const summaryResult = await client.query(`
        SELECT
          COUNT(*) as total_transactions,
          COALESCE(SUM(amount), 0) as total_amount,
          COALESCE(SUM(fees), 0) as total_fees
        FROM platform.transaction_records tr
        WHERE tr.account_id = $1 AND tr.tenant_id = $2 ${dateCondition}
      `, [accountId, tenantId]);
            // Get summary by transaction type
            const byTypeResult = await client.query(`
        SELECT
          transaction_type,
          COUNT(*) as count,
          COALESCE(SUM(amount), 0) as amount
        FROM platform.transaction_records tr
        WHERE tr.account_id = $1 AND tr.tenant_id = $2 ${dateCondition}
        GROUP BY transaction_type
      `, [accountId, tenantId]);
            // Get summary by status
            const byStatusResult = await client.query(`
        SELECT
          status,
          COUNT(*) as count,
          COALESCE(SUM(amount), 0) as amount
        FROM platform.transaction_records tr
        WHERE tr.account_id = $1 AND tr.tenant_id = $2 ${dateCondition}
        GROUP BY status
      `, [accountId, tenantId]);
            const summary = summaryResult.rows[0];
            const byType = {};
            const byStatus = {};
            byTypeResult.rows.forEach(row => {
                byType[row.transaction_type] = {
                    count: parseInt(row.count),
                    amount: parseFloat(row.amount),
                };
            });
            byStatusResult.rows.forEach(row => {
                byStatus[row.status] = {
                    count: parseInt(row.count),
                    amount: parseFloat(row.amount),
                };
            });
            return {
                totalTransactions: parseInt(summary.total_transactions),
                totalAmount: parseFloat(summary.total_amount),
                totalFees: parseFloat(summary.total_fees),
                byType,
                byStatus,
            };
        }
        catch (error) {
            console.error('Transaction summary error:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
}
exports.default = TransactionReceiptService;
//# sourceMappingURL=TransactionReceiptService.js.map