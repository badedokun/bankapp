/**
 * Transfer Scheduler Service
 * Processes scheduled and recurring transfers
 */
export declare class TransferSchedulerService {
    private static instance;
    private intervalId;
    private isRunning;
    private constructor();
    static getInstance(): TransferSchedulerService;
    /**
     * Start the scheduler
     * Runs every minute to check for pending scheduled transfers
     */
    start(): void;
    /**
     * Stop the scheduler
     */
    stop(): void;
    /**
     * Process all pending scheduled transfers
     */
    private processScheduledTransfers;
    /**
     * Execute a single scheduled transfer
     */
    private executeScheduledTransfer;
    /**
     * Process recurring transfers
     */
    private processRecurringTransfers;
    /**
     * Execute a recurring transfer and schedule the next one
     */
    private executeRecurringTransfer;
    /**
     * Calculate the next execution date based on frequency
     */
    private calculateNextExecutionDate;
}
declare const _default: TransferSchedulerService;
export default _default;
//# sourceMappingURL=TransferSchedulerService.d.ts.map