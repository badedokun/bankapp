/**
 * Scheduled Payment Service
 * Handles future-dated and recurring transfers/payments
 */
import { Pool } from 'pg';
import { TransferStatus, TransferFrequency } from '../../types/transfers';
import { TransferRequest, TransferResponse } from '../../types';
import { InternalTransferService } from './InternalTransferService';
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
declare class ScheduledPaymentService {
    private db;
    private internalTransferService;
    private externalTransferService;
    private billPaymentService;
    constructor(database: Pool, internalTransferService: InternalTransferService, externalTransferService: ExternalTransferService, billPaymentService: BillPaymentService);
    /**
     * Create a scheduled payment
     */
    createScheduledPayment(request: TransferRequest, userId: string): Promise<TransferResponse>;
    /**
     * Execute a scheduled payment
     */
    executeScheduledPayment(scheduledPaymentId: string): Promise<ScheduleExecutionResult>;
    /**
     * Execute internal transfer
     */
    private executeInternalTransfer;
    /**
     * Execute external transfer
     */
    private executeExternalTransfer;
    /**
     * Execute bill payment
     */
    private executeBillPayment;
    /**
     * Process all due scheduled payments
     */
    processDueScheduledPayments(): Promise<void>;
    /**
     * Get due scheduled payments
     */
    private getDueScheduledPayments;
    /**
     * Get scheduled payment by ID
     */
    private getScheduledPayment;
    /**
     * Get user's scheduled payments
     */
    getUserScheduledPayments(userId: string, isActive?: boolean): Promise<ScheduledPayment[]>;
    /**
     * Cancel scheduled payment
     */
    cancelScheduledPayment(scheduledPaymentId: string, userId: string): Promise<boolean>;
    /**
     * Update scheduled payment
     */
    updateScheduledPayment(scheduledPaymentId: string, updates: Partial<ScheduledPayment>, userId: string): Promise<boolean>;
    /**
     * Calculate next execution date based on frequency
     */
    private calculateNextExecutionDate;
    /**
     * Calculate maximum executions
     */
    private calculateMaxExecutions;
    /**
     * Check if payment should execute now
     */
    private shouldExecuteNow;
    /**
     * Check if scheduled payment should be deactivated after execution
     */
    private shouldDeactivateAfterExecution;
    /**
     * Create transfer request from scheduled payment
     */
    private createTransferRequestFromSchedule;
    /**
     * Helper methods
     */
    private deactivateScheduledPayment;
    private updateExecutionFailure;
    private getSenderAccount;
    private validateScheduledPaymentRequest;
    private mapRowToScheduledPayment;
}
export default ScheduledPaymentService;
//# sourceMappingURL=ScheduledPaymentService.d.ts.map