/**
 * Bill Payment Service
 * Handles utility bills, airtime, data, and other bill payments
 */
import { Pool } from 'pg';
import { BillPaymentRequest, TransferResponse, Biller, BillPaymentValidation } from '../../types/transfers';
declare class BillPaymentService {
    private db;
    private billerAPIs;
    constructor(database: Pool);
    /**
     * Initialize biller API configurations
     */
    private initializeBillerAPIs;
    /**
     * Process bill payment
     */
    processBillPayment(request: BillPaymentRequest, userId: string): Promise<TransferResponse>;
    /**
     * Validate customer with biller
     */
    validateCustomer(request: BillPaymentRequest, biller: Biller): Promise<BillPaymentValidation>;
    /**
     * Mock customer validation for demo purposes
     */
    private mockValidateCustomer;
    /**
     * Process biller payment
     */
    private processBillerPayment;
    /**
     * Reverse failed payment
     */
    private reverseFailedPayment;
    /**
     * Get available billers
     */
    getBillers(category?: string): Promise<Biller[]>;
    /**
     * Get biller by ID
     */
    getBiller(billerId: string, client?: any): Promise<Biller | null>;
    /**
     * Calculate bill payment fee
     */
    private calculateBillPaymentFee;
    /**
     * Validate bill payment request
     */
    private validateBillPaymentRequest;
    /**
     * Get sender account details
     */
    private getSenderAccount;
    /**
     * Get bill payment history
     */
    getBillPaymentHistory(accountId: string, limit?: number): Promise<any[]>;
    /**
     * Get payment status
     */
    getPaymentStatus(paymentId: string): Promise<any>;
}
export default BillPaymentService;
//# sourceMappingURL=BillPaymentService.d.ts.map