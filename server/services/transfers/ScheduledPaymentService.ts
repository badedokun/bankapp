/**
 * Scheduled Payment Service
 * Handles future-dated and recurring transfers/payments
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import {
  TransferRequest,
  TransferResponse,
  TransferError,
  ValidationError,
  InsufficientFundsError,
  TransferStatus,
  TransferFrequency,
} from '../../types/transfers';
import InternalTransferService from './InternalTransferService';
import ExternalTransferService from './ExternalTransferService';
import BillPaymentService from './BillPaymentService';

interface ScheduledPayment {
  id: string;
  tenantId: string;
  userId: string;
  senderAccountId: string;
  type: 'internal' | 'external' | 'bill_payment';
  frequency: TransferFrequency;
  amount: number;
  recipientName: string;
  recipientAccountNumber?: string;
  recipientBankCode?: string;
  billerId?: string;
  customerReference?: string;
  description: string;
  scheduledDate: Date;
  endDate?: Date;
  nextExecutionDate: Date;
  executionCount: number;
  maxExecutions?: number;
  isActive: boolean;
  lastExecutionDate?: Date;
  lastExecutionStatus?: TransferStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface ScheduleExecutionResult {
  success: boolean;
  transferId?: string;
  reference?: string;
  error?: string;
}

class ScheduledPaymentService {
  private db: Pool;
  private internalTransferService: InternalTransferService;
  private externalTransferService: ExternalTransferService;
  private billPaymentService: BillPaymentService;

  constructor(
    database: Pool,
    internalTransferService: InternalTransferService,
    externalTransferService: ExternalTransferService,
    billPaymentService: BillPaymentService
  ) {
    this.db = database;
    this.internalTransferService = internalTransferService;
    this.externalTransferService = externalTransferService;
    this.billPaymentService = billPaymentService;
  }

  /**
   * Create a scheduled payment
   */
  async createScheduledPayment(request: TransferRequest, userId: string): Promise<TransferResponse> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // Validate scheduled payment request
      await this.validateScheduledPaymentRequest(request, userId, client);

      // Get sender account details
      const senderAccount = await this.getSenderAccount(request.senderAccountId, client);
      if (!senderAccount) {
        throw new ValidationError('Invalid sender account', 'senderAccountId');
      }

      // Calculate next execution date
      const nextExecutionDate = this.calculateNextExecutionDate(
        request.scheduledDate || new Date(),
        request.frequency || 'once'
      );

      // Calculate max executions for recurring payments
      const maxExecutions = this.calculateMaxExecutions(
        request.frequency || 'once',
        request.scheduledDate || new Date(),
        request.endDate
      );

      // Create scheduled payment record
      const scheduledPaymentId = uuidv4();
      const reference = `SP${Date.now().toString().slice(-8)}`;

      await client.query(`
        INSERT INTO scheduled_payments (
          id, tenant_id, user_id, sender_account_id, type, frequency, amount,
          recipient_name, recipient_account_number, recipient_bank_code,
          biller_id, customer_reference, description, scheduled_date, end_date,
          next_execution_date, execution_count, max_executions, is_active,
          reference, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())
      `, [
        scheduledPaymentId,
        senderAccount.tenant_id,
        userId,
        request.senderAccountId,
        request.type,
        request.frequency || 'once',
        request.amount,
        request.recipientName,
        (request as any).recipientAccountNumber || null,
        (request as any).recipientBankCode || null,
        (request as any).billerId || null,
        (request as any).customerReference || null,
        request.description || 'Scheduled payment',
        request.scheduledDate || new Date(),
        request.endDate || null,
        nextExecutionDate,
        0,
        maxExecutions,
        true,
        reference
      ]);

      await client.query('COMMIT');

      // If scheduled for immediate execution, process it
      if (this.shouldExecuteNow(request.scheduledDate || new Date())) {
        this.executeScheduledPayment(scheduledPaymentId)
          .catch(error => {
            console.error('Immediate scheduled payment execution failed:', error);
          });
      }

      return {
        id: scheduledPaymentId,
        reference,
        status: 'pending' as TransferStatus,
        amount: request.amount,
        fees: 0, // Will be calculated during execution
        totalAmount: request.amount,
        recipient: {
          name: request.recipientName,
          accountNumber: (request as any).recipientAccountNumber || (request as any).customerReference || '',
          bankName: (request as any).recipientBankCode || (request as any).billerName || '',
        },
        scheduledDate: request.scheduledDate,
        message: request.frequency === 'once'
          ? 'Payment has been scheduled for the specified date.'
          : `Recurring payment has been set up. Next execution: ${nextExecutionDate.toLocaleDateString()}`,
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute a scheduled payment
   */
  async executeScheduledPayment(scheduledPaymentId: string): Promise<ScheduleExecutionResult> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // Get scheduled payment details
      const scheduledPayment = await this.getScheduledPayment(scheduledPaymentId, client);
      if (!scheduledPayment) {
        throw new Error('Scheduled payment not found');
      }

      if (!scheduledPayment.isActive) {
        throw new Error('Scheduled payment is inactive');
      }

      // Check if it's time to execute
      if (new Date() < scheduledPayment.nextExecutionDate) {
        throw new Error('Not yet time to execute');
      }

      // Check if max executions reached
      if (scheduledPayment.maxExecutions &&
          scheduledPayment.executionCount >= scheduledPayment.maxExecutions) {
        await this.deactivateScheduledPayment(scheduledPaymentId, client);
        throw new Error('Maximum executions reached');
      }

      // Create transfer request from scheduled payment
      const transferRequest = this.createTransferRequestFromSchedule(scheduledPayment);

      let result: ScheduleExecutionResult;

      // Execute based on type
      switch (scheduledPayment.type) {
        case 'internal':
          result = await this.executeInternalTransfer(transferRequest, scheduledPayment.userId);
          break;
        case 'external':
          result = await this.executeExternalTransfer(transferRequest, scheduledPayment.userId);
          break;
        case 'bill_payment':
          result = await this.executeBillPayment(transferRequest, scheduledPayment.userId);
          break;
        default:
          throw new Error('Invalid scheduled payment type');
      }

      // Update scheduled payment execution info
      const nextExecutionDate = this.calculateNextExecutionDate(
        scheduledPayment.nextExecutionDate,
        scheduledPayment.frequency
      );

      const shouldDeactivate = this.shouldDeactivateAfterExecution(
        scheduledPayment.frequency,
        scheduledPayment.executionCount + 1,
        scheduledPayment.maxExecutions,
        nextExecutionDate,
        scheduledPayment.endDate
      );

      await client.query(`
        UPDATE scheduled_payments
        SET execution_count = execution_count + 1,
            last_execution_date = NOW(),
            last_execution_status = $1,
            next_execution_date = $2,
            is_active = $3,
            updated_at = NOW()
        WHERE id = $4
      `, [
        result.success ? 'completed' : 'failed',
        shouldDeactivate ? null : nextExecutionDate,
        !shouldDeactivate,
        scheduledPaymentId
      ]);

      await client.query('COMMIT');

      return result;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Scheduled payment execution failed:', error);

      // Update with failure status
      await this.updateExecutionFailure(scheduledPaymentId, error.message);

      return {
        success: false,
        error: error.message,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Execute internal transfer
   */
  private async executeInternalTransfer(
    request: TransferRequest,
    userId: string
  ): Promise<ScheduleExecutionResult> {
    try {
      const response = await this.internalTransferService.processTransfer(request as any, userId);
      return {
        success: true,
        transferId: response.id,
        reference: response.reference,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute external transfer
   */
  private async executeExternalTransfer(
    request: TransferRequest,
    userId: string
  ): Promise<ScheduleExecutionResult> {
    try {
      const response = await this.externalTransferService.processTransfer(request as any, userId);
      return {
        success: true,
        transferId: response.id,
        reference: response.reference,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute bill payment
   */
  private async executeBillPayment(
    request: TransferRequest,
    userId: string
  ): Promise<ScheduleExecutionResult> {
    try {
      const response = await this.billPaymentService.processBillPayment(request as any, userId);
      return {
        success: true,
        transferId: response.id,
        reference: response.reference,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Process all due scheduled payments
   */
  async processDueScheduledPayments(): Promise<void> {
    const duePayments = await this.getDueScheduledPayments();

    console.log(`Processing ${duePayments.length} due scheduled payments`);

    for (const payment of duePayments) {
      try {
        const result = await this.executeScheduledPayment(payment.id);
        console.log(`Scheduled payment ${payment.id} executed:`, result.success ? 'SUCCESS' : 'FAILED');
      } catch (error) {
        console.error(`Failed to execute scheduled payment ${payment.id}:`, error);
      }
    }
  }

  /**
   * Get due scheduled payments
   */
  private async getDueScheduledPayments(): Promise<ScheduledPayment[]> {
    const result = await this.db.query(`
      SELECT * FROM scheduled_payments
      WHERE is_active = true
      AND next_execution_date <= NOW()
      ORDER BY next_execution_date ASC
      LIMIT 100
    `);

    return result.rows.map(this.mapRowToScheduledPayment);
  }

  /**
   * Get scheduled payment by ID
   */
  private async getScheduledPayment(id: string, client?: any): Promise<ScheduledPayment | null> {
    const dbClient = client || this.db;

    const result = await dbClient.query(
      'SELECT * FROM scheduled_payments WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToScheduledPayment(result.rows[0]);
  }

  /**
   * Get user's scheduled payments
   */
  async getUserScheduledPayments(userId: string, isActive?: boolean): Promise<ScheduledPayment[]> {
    let query = 'SELECT * FROM scheduled_payments WHERE user_id = $1';
    const params = [userId];

    if (isActive !== undefined) {
      query += ' AND is_active = $2';
      params.push(isActive);
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.db.query(query, params);
    return result.rows.map(this.mapRowToScheduledPayment);
  }

  /**
   * Cancel scheduled payment
   */
  async cancelScheduledPayment(scheduledPaymentId: string, userId: string): Promise<boolean> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // Verify ownership
      const result = await client.query(
        'SELECT id FROM scheduled_payments WHERE id = $1 AND user_id = $2',
        [scheduledPaymentId, userId]
      );

      if (result.rows.length === 0) {
        throw new ValidationError('Scheduled payment not found or access denied', 'scheduledPaymentId');
      }

      // Deactivate the scheduled payment
      await client.query(`
        UPDATE scheduled_payments
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
      `, [scheduledPaymentId]);

      await client.query('COMMIT');
      return true;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update scheduled payment
   */
  async updateScheduledPayment(
    scheduledPaymentId: string,
    updates: Partial<ScheduledPayment>,
    userId: string
  ): Promise<boolean> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // Verify ownership
      const result = await client.query(
        'SELECT id FROM scheduled_payments WHERE id = $1 AND user_id = $2',
        [scheduledPaymentId, userId]
      );

      if (result.rows.length === 0) {
        throw new ValidationError('Scheduled payment not found or access denied', 'scheduledPaymentId');
      }

      // Build update query
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (updates.amount !== undefined) {
        updateFields.push(`amount = $${paramIndex++}`);
        updateValues.push(updates.amount);
      }

      if (updates.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        updateValues.push(updates.description);
      }

      if (updates.scheduledDate !== undefined) {
        updateFields.push(`scheduled_date = $${paramIndex++}`);
        updateValues.push(updates.scheduledDate);

        // Recalculate next execution date
        const nextExecutionDate = this.calculateNextExecutionDate(
          updates.scheduledDate,
          updates.frequency || 'once'
        );
        updateFields.push(`next_execution_date = $${paramIndex++}`);
        updateValues.push(nextExecutionDate);
      }

      if (updates.endDate !== undefined) {
        updateFields.push(`end_date = $${paramIndex++}`);
        updateValues.push(updates.endDate);
      }

      if (updateFields.length === 0) {
        throw new ValidationError('No fields to update', 'updates');
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(scheduledPaymentId);

      await client.query(`
        UPDATE scheduled_payments
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
      `, updateValues);

      await client.query('COMMIT');
      return true;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Calculate next execution date based on frequency
   */
  private calculateNextExecutionDate(currentDate: Date, frequency: TransferFrequency): Date {
    const nextDate = new Date(currentDate);

    switch (frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      case 'once':
      default:
        return currentDate;
    }

    return nextDate;
  }

  /**
   * Calculate maximum executions
   */
  private calculateMaxExecutions(
    frequency: TransferFrequency,
    startDate: Date,
    endDate?: Date
  ): number | null {
    if (frequency === 'once' || !endDate) {
      return frequency === 'once' ? 1 : null;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();

    switch (frequency) {
      case 'daily':
        return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      case 'weekly':
        return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7)) + 1;
      case 'monthly':
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        return months + 1;
      case 'quarterly':
        const quarters = Math.floor(((end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())) / 3);
        return quarters + 1;
      case 'yearly':
        return end.getFullYear() - start.getFullYear() + 1;
      default:
        return null;
    }
  }

  /**
   * Check if payment should execute now
   */
  private shouldExecuteNow(scheduledDate: Date): boolean {
    const now = new Date();
    const scheduled = new Date(scheduledDate);
    return scheduled <= now;
  }

  /**
   * Check if scheduled payment should be deactivated after execution
   */
  private shouldDeactivateAfterExecution(
    frequency: TransferFrequency,
    executionCount: number,
    maxExecutions: number | null,
    nextExecutionDate: Date,
    endDate?: Date
  ): boolean {
    // One-time payments should be deactivated after execution
    if (frequency === 'once') {
      return true;
    }

    // Check max executions
    if (maxExecutions && executionCount >= maxExecutions) {
      return true;
    }

    // Check end date
    if (endDate && nextExecutionDate > endDate) {
      return true;
    }

    return false;
  }

  /**
   * Create transfer request from scheduled payment
   */
  private createTransferRequestFromSchedule(scheduledPayment: ScheduledPayment): TransferRequest {
    const baseRequest = {
      senderAccountId: scheduledPayment.senderAccountId,
      recipientName: scheduledPayment.recipientName,
      amount: scheduledPayment.amount,
      description: scheduledPayment.description,
      pin: '0000', // PIN validation is skipped for scheduled payments
    };

    switch (scheduledPayment.type) {
      case 'internal':
        return {
          ...baseRequest,
          type: 'internal',
          recipientAccountNumber: scheduledPayment.recipientAccountNumber!,
        } as any;

      case 'external':
        return {
          ...baseRequest,
          type: 'external',
          recipientAccountNumber: scheduledPayment.recipientAccountNumber!,
          recipientBankCode: scheduledPayment.recipientBankCode!,
        } as any;

      case 'bill_payment':
        return {
          ...baseRequest,
          type: 'bill_payment',
          billerId: scheduledPayment.billerId!,
          billerName: scheduledPayment.recipientName,
          customerReference: scheduledPayment.customerReference!,
          billCategory: 'scheduled',
        } as any;

      default:
        throw new Error('Invalid scheduled payment type');
    }
  }

  /**
   * Helper methods
   */
  private async deactivateScheduledPayment(id: string, client: any): Promise<void> {
    await client.query(
      'UPDATE scheduled_payments SET is_active = false, updated_at = NOW() WHERE id = $1',
      [id]
    );
  }

  private async updateExecutionFailure(id: string, error: string): Promise<void> {
    await this.db.query(`
      UPDATE scheduled_payments
      SET last_execution_status = 'failed', updated_at = NOW()
      WHERE id = $1
    `, [id]);
  }

  private async getSenderAccount(accountId: string, client: any): Promise<any> {
    const result = await client.query(`
      SELECT * FROM tenant.accounts
      WHERE id = $1 AND is_active = true
    `, [accountId]);

    return result.rows[0];
  }

  private async validateScheduledPaymentRequest(
    request: TransferRequest,
    userId: string,
    client: any
  ): Promise<void> {
    if (!request.scheduledDate) {
      throw new ValidationError('Scheduled date is required', 'scheduledDate');
    }

    if (new Date(request.scheduledDate) < new Date()) {
      throw new ValidationError('Scheduled date cannot be in the past', 'scheduledDate');
    }

    if (request.endDate && new Date(request.endDate) <= new Date(request.scheduledDate)) {
      throw new ValidationError('End date must be after scheduled date', 'endDate');
    }

    if (!request.amount || request.amount <= 0) {
      throw new ValidationError('Invalid payment amount', 'amount');
    }
  }

  private mapRowToScheduledPayment(row: any): ScheduledPayment {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      senderAccountId: row.sender_account_id,
      type: row.type,
      frequency: row.frequency,
      amount: parseFloat(row.amount),
      recipientName: row.recipient_name,
      recipientAccountNumber: row.recipient_account_number,
      recipientBankCode: row.recipient_bank_code,
      billerId: row.biller_id,
      customerReference: row.customer_reference,
      description: row.description,
      scheduledDate: new Date(row.scheduled_date),
      endDate: row.end_date ? new Date(row.end_date) : undefined,
      nextExecutionDate: new Date(row.next_execution_date),
      executionCount: row.execution_count,
      maxExecutions: row.max_executions,
      isActive: row.is_active,
      lastExecutionDate: row.last_execution_date ? new Date(row.last_execution_date) : undefined,
      lastExecutionStatus: row.last_execution_status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export default ScheduledPaymentService;