"use strict";
/**
 * Transfer Scheduler Service
 * Processes scheduled and recurring transfers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferSchedulerService = void 0;
const database_1 = require("../../config/database");
const InternalTransferService_1 = require("./InternalTransferService");
class TransferSchedulerService {
    constructor() {
        this.intervalId = null;
        this.isRunning = false;
    }
    static getInstance() {
        if (!TransferSchedulerService.instance) {
            TransferSchedulerService.instance = new TransferSchedulerService();
        }
        return TransferSchedulerService.instance;
    }
    /**
     * Start the scheduler
     * Runs every minute to check for pending scheduled transfers
     */
    start() {
        if (this.isRunning) {
            console.log('⏰ Transfer scheduler is already running');
            return;
        }
        console.log('⏰ Starting transfer scheduler service...');
        this.isRunning = true;
        // Run immediately on start
        this.processScheduledTransfers();
        // Then run every minute
        this.intervalId = setInterval(() => {
            this.processScheduledTransfers();
        }, 60000); // Every 1 minute
        console.log('✅ Transfer scheduler started successfully');
    }
    /**
     * Stop the scheduler
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('⏸️  Transfer scheduler stopped');
    }
    /**
     * Process all pending scheduled transfers
     */
    async processScheduledTransfers() {
        try {
            const now = new Date();
            // Find all scheduled transfers that are due
            const query = `
                SELECT *
                FROM tenant.scheduled_transfers
                WHERE status = 'pending'
                AND scheduled_date <= $1
                ORDER BY scheduled_date ASC
            `;
            const result = await database_1.pool.query(query, [now]);
            if (result.rows.length > 0) {
                console.log(`📅 Found ${result.rows.length} scheduled transfer(s) to process`);
                for (const scheduledTransfer of result.rows) {
                    await this.executeScheduledTransfer(scheduledTransfer);
                }
            }
            // Also process recurring transfers
            await this.processRecurringTransfers();
        }
        catch (error) {
            console.error('❌ Error processing scheduled transfers:', error);
        }
    }
    /**
     * Execute a single scheduled transfer
     */
    async executeScheduledTransfer(scheduledTransfer) {
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');
            console.log(`💸 Executing scheduled transfer: ${scheduledTransfer.id}`);
            // Update status to processing
            await client.query(`UPDATE tenant.scheduled_transfers
                 SET status = 'processing', updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1`, [scheduledTransfer.id]);
            // Execute the transfer
            const transferService = new InternalTransferService_1.InternalTransferService(database_1.pool);
            const transferRequest = {
                walletId: scheduledTransfer.from_wallet_id,
                recipientWalletNumber: scheduledTransfer.to_wallet_number,
                recipientAccountName: scheduledTransfer.recipient_name,
                amount: parseFloat(scheduledTransfer.amount),
                narration: scheduledTransfer.narration || 'Scheduled transfer',
                reference: scheduledTransfer.reference,
                pin: '' // PIN was already validated when scheduling
            };
            const result = await transferService.processTransfer(transferRequest);
            // Update scheduled transfer status
            if (result.success) {
                await client.query(`UPDATE tenant.scheduled_transfers
                     SET status = 'completed',
                         executed_at = CURRENT_TIMESTAMP,
                         transfer_id = $2,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE id = $1`, [scheduledTransfer.id, result.transferId]);
                console.log(`✅ Scheduled transfer completed: ${scheduledTransfer.id}`);
            }
            else {
                await client.query(`UPDATE tenant.scheduled_transfers
                     SET status = 'failed',
                         error_message = $2,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE id = $1`, [scheduledTransfer.id, result.message || 'Transfer failed']);
                console.error(`❌ Scheduled transfer failed: ${scheduledTransfer.id}`);
            }
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error(`❌ Error executing scheduled transfer ${scheduledTransfer.id}:`, error);
            // Mark as failed
            try {
                await client.query(`UPDATE tenant.scheduled_transfers
                     SET status = 'failed',
                         error_message = $2,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE id = $1`, [scheduledTransfer.id, error.message]);
            }
            catch (updateError) {
                console.error('Failed to update transfer status:', updateError);
            }
        }
        finally {
            client.release();
        }
    }
    /**
     * Process recurring transfers
     */
    async processRecurringTransfers() {
        try {
            const now = new Date();
            // Find all active recurring transfers that are due
            const query = `
                SELECT *
                FROM tenant.recurring_transfers
                WHERE status = 'active'
                AND next_execution_date <= $1
                AND (end_date IS NULL OR end_date >= $1)
                ORDER BY next_execution_date ASC
            `;
            const result = await database_1.pool.query(query, [now]);
            if (result.rows.length > 0) {
                console.log(`🔄 Found ${result.rows.length} recurring transfer(s) to process`);
                for (const recurringTransfer of result.rows) {
                    await this.executeRecurringTransfer(recurringTransfer);
                }
            }
        }
        catch (error) {
            console.error('❌ Error processing recurring transfers:', error);
        }
    }
    /**
     * Execute a recurring transfer and schedule the next one
     */
    async executeRecurringTransfer(recurringTransfer) {
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');
            console.log(`🔄 Executing recurring transfer: ${recurringTransfer.id}`);
            // Execute the transfer
            const transferService = new InternalTransferService_1.InternalTransferService(database_1.pool);
            const transferRequest = {
                walletId: recurringTransfer.from_wallet_id,
                recipientWalletNumber: recurringTransfer.to_wallet_number,
                recipientAccountName: recurringTransfer.recipient_name,
                amount: parseFloat(recurringTransfer.amount),
                narration: recurringTransfer.narration || 'Recurring transfer',
                reference: `${recurringTransfer.reference}-${Date.now()}`,
                pin: '' // PIN was already validated when setting up recurring
            };
            const result = await transferService.processTransfer(transferRequest);
            if (result.success) {
                // Calculate next execution date
                const nextDate = this.calculateNextExecutionDate(new Date(recurringTransfer.next_execution_date), recurringTransfer.frequency);
                // Check if we should continue
                const endDate = recurringTransfer.end_date ? new Date(recurringTransfer.end_date) : null;
                const shouldContinue = !endDate || nextDate <= endDate;
                // Update recurring transfer
                if (shouldContinue) {
                    await client.query(`UPDATE tenant.recurring_transfers
                         SET next_execution_date = $2,
                             last_execution_date = CURRENT_TIMESTAMP,
                             execution_count = execution_count + 1,
                             updated_at = CURRENT_TIMESTAMP
                         WHERE id = $1`, [recurringTransfer.id, nextDate]);
                    console.log(`✅ Recurring transfer executed and rescheduled: ${recurringTransfer.id}`);
                }
                else {
                    await client.query(`UPDATE tenant.recurring_transfers
                         SET status = 'completed',
                             last_execution_date = CURRENT_TIMESTAMP,
                             execution_count = execution_count + 1,
                             updated_at = CURRENT_TIMESTAMP
                         WHERE id = $1`, [recurringTransfer.id]);
                    console.log(`✅ Recurring transfer completed (reached end date): ${recurringTransfer.id}`);
                }
            }
            else {
                console.error(`❌ Recurring transfer failed: ${recurringTransfer.id}`);
                // Don't stop the recurring transfer, just log the failure
                // Could add failure count and stop after X failures
            }
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error(`❌ Error executing recurring transfer ${recurringTransfer.id}:`, error);
        }
        finally {
            client.release();
        }
    }
    /**
     * Calculate the next execution date based on frequency
     */
    calculateNextExecutionDate(currentDate, frequency) {
        const nextDate = new Date(currentDate);
        switch (frequency.toLowerCase()) {
            case 'daily':
                nextDate.setDate(nextDate.getDate() + 1);
                break;
            case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            case 'yearly':
                nextDate.setFullYear(nextDate.getFullYear() + 1);
                break;
            default:
                nextDate.setDate(nextDate.getDate() + 1); // Default to daily
        }
        return nextDate;
    }
}
exports.TransferSchedulerService = TransferSchedulerService;
// Export singleton instance
exports.default = TransferSchedulerService.getInstance();
//# sourceMappingURL=TransferSchedulerService.js.map