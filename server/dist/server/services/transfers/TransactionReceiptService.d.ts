/**
 * Transaction Receipt and Records Management Service
 * Handles receipt generation, transaction records, and history management
 */
import { Pool } from 'pg';
interface TransactionReceipt {
    id: string;
    transactionId: string;
    receiptNumber: string;
    transactionType: 'internal_transfer' | 'external_transfer' | 'bill_payment' | 'international_transfer' | 'scheduled_payment';
    amount: number;
    fees: number;
    totalAmount: number;
    currency: string;
    status: string;
    sender: {
        accountNumber: string;
        accountName: string;
        bankName: string;
        bankCode?: string;
    };
    recipient: {
        accountNumber: string;
        accountName: string;
        bankName: string;
        bankCode?: string;
    };
    transactionDate: Date;
    description: string;
    reference: string;
    sessionId?: string;
    narration?: string;
    createdAt: Date;
}
interface TransactionRecord {
    id: string;
    tenantId: string;
    userId: string;
    accountId: string;
    transactionType: string;
    transactionCategory: string;
    amount: number;
    fees: number;
    totalAmount: number;
    currency: string;
    status: string;
    reference: string;
    description: string;
    recipientDetails?: any;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
}
interface TransactionSearchFilters {
    accountId?: string;
    transactionType?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    amountMin?: number;
    amountMax?: number;
    reference?: string;
    recipientName?: string;
    limit?: number;
    offset?: number;
}
declare class TransactionReceiptService {
    private db;
    private receiptStoragePath;
    constructor(database: Pool);
    /**
     * Generate receipt for any transaction type
     */
    generateReceipt(transactionId: string, transactionType: string, tenantId: string): Promise<TransactionReceipt>;
    /**
     * Get transaction data from appropriate table based on type
     */
    private getTransactionData;
    /**
     * Generate unique receipt number
     */
    private generateReceiptNumber;
    /**
     * Generate receipt file (PDF/HTML)
     */
    private generateReceiptFile;
    /**
     * Generate HTML receipt content
     */
    private generateReceiptHTML;
    /**
     * Format transaction type for display
     */
    private formatTransactionType;
    /**
     * Create transaction record for comprehensive tracking
     */
    createTransactionRecord(tenantId: string, userId: string, accountId: string, transactionData: {
        transactionType: string;
        transactionCategory: string;
        amount: number;
        fees?: number;
        currency?: string;
        status: string;
        reference: string;
        description: string;
        recipientDetails?: any;
        metadata?: any;
    }): Promise<string>;
    /**
     * Search transaction records with filters
     */
    searchTransactionRecords(tenantId: string, filters: TransactionSearchFilters): Promise<{
        records: TransactionRecord[];
        totalCount: number;
        pagination: {
            limit: number;
            offset: number;
            hasMore: boolean;
        };
    }>;
    /**
     * Get receipt by ID
     */
    getReceipt(receiptId: string, tenantId: string): Promise<TransactionReceipt | null>;
    /**
     * Get transaction history for an account
     */
    getTransactionHistory(accountId: string, tenantId: string, limit?: number, offset?: number): Promise<TransactionRecord[]>;
    /**
     * Ensure storage directory exists
     */
    private ensureStorageDirectory;
    /**
     * Get transaction summary/statistics
     */
    getTransactionSummary(accountId: string, tenantId: string, period?: 'today' | 'week' | 'month' | 'year'): Promise<{
        totalTransactions: number;
        totalAmount: number;
        totalFees: number;
        byType: Record<string, {
            count: number;
            amount: number;
        }>;
        byStatus: Record<string, {
            count: number;
            amount: number;
        }>;
    }>;
}
export default TransactionReceiptService;
//# sourceMappingURL=TransactionReceiptService.d.ts.map