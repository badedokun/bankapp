"use strict";
/**
 * Bill Payment Service
 * Handles utility bills, airtime, data, and other bill payments
 */
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const transfers_1 = require("../../types/transfers");
class BillPaymentService {
    constructor(database) {
        this.db = database;
        this.initializeBillerAPIs();
    }
    /**
     * Initialize biller API configurations
     */
    initializeBillerAPIs() {
        this.billerAPIs = new Map([
            ['EKEDC', {
                    baseUrl: process.env.EKEDC_API_URL || 'https://api.ekedc.com',
                    apiKey: process.env.EKEDC_API_KEY || '',
                    endpoints: {
                        validate: '/validate',
                        payment: '/payment',
                        status: '/status'
                    }
                }],
            ['DSTV', {
                    baseUrl: process.env.DSTV_API_URL || 'https://api.dstv.com',
                    apiKey: process.env.DSTV_API_KEY || '',
                    endpoints: {
                        validate: '/validate',
                        payment: '/payment',
                        status: '/status'
                    }
                }],
            ['MTN', {
                    baseUrl: process.env.MTN_API_URL || 'https://api.mtn.ng',
                    apiKey: process.env.MTN_API_KEY || '',
                    endpoints: {
                        validate: '/airtime/validate',
                        payment: '/airtime/purchase',
                        status: '/airtime/status'
                    }
                }],
            ['AIRTEL', {
                    baseUrl: process.env.AIRTEL_API_URL || 'https://api.airtel.com.ng',
                    apiKey: process.env.AIRTEL_API_KEY || '',
                    endpoints: {
                        validate: '/airtime/validate',
                        payment: '/airtime/purchase',
                        status: '/airtime/status'
                    }
                }],
            ['GLO', {
                    baseUrl: process.env.GLO_API_URL || 'https://api.gloworld.com',
                    apiKey: process.env.GLO_API_KEY || '',
                    endpoints: {
                        validate: '/airtime/validate',
                        payment: '/airtime/purchase',
                        status: '/airtime/status'
                    }
                }],
            ['9MOBILE', {
                    baseUrl: process.env.ETISALAT_API_URL || 'https://api.9mobile.com.ng',
                    apiKey: process.env.ETISALAT_API_KEY || '',
                    endpoints: {
                        validate: '/airtime/validate',
                        payment: '/airtime/purchase',
                        status: '/airtime/status'
                    }
                }]
        ]);
    }
    /**
     * Process bill payment
     */
    async processBillPayment(request, userId) {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');
            // 1. Validate request
            await this.validateBillPaymentRequest(request, userId, client);
            // 2. Get sender account details
            const senderAccount = await this.getSenderAccount(request.senderAccountId, client);
            if (!senderAccount) {
                throw new transfers_1.ValidationError('Invalid sender account', 'senderAccountId');
            }
            // 3. Get biller details
            const biller = await this.getBiller(request.billerId, client);
            if (!biller) {
                throw new transfers_1.ValidationError('Invalid biller', 'billerId');
            }
            // 4. Validate customer details with biller
            const validation = await this.validateCustomer(request, biller);
            if (!validation.isValid) {
                throw new transfers_1.ValidationError(validation.error || 'Customer validation failed', 'customerReference');
            }
            // 5. Calculate total amount including fees
            const fee = await this.calculateBillPaymentFee(request.amount, biller.category);
            const totalAmount = request.amount + fee;
            // 6. Check account balance
            if (senderAccount.balance < totalAmount) {
                throw new transfers_1.InsufficientFundsError(senderAccount.balance, totalAmount);
            }
            // 7. Create bill payment record
            const paymentId = (0, uuid_1.v4)();
            const reference = `BP${Date.now().toString().slice(-8)}`;
            await client.query(`
        INSERT INTO bill_payments (
          id, tenant_id, user_id, sender_account_id, biller_id, biller_name,
          customer_reference, customer_name, amount, fees, total_amount,
          description, reference, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      `, [
                paymentId,
                senderAccount.tenant_id,
                userId,
                request.senderAccountId,
                request.billerId,
                biller.name,
                request.customerReference,
                validation.customerName || 'Customer',
                request.amount,
                fee,
                totalAmount,
                request.description || `${biller.name} payment`,
                reference,
                'processing'
            ]);
            // 8. Debit sender account
            await client.query(`
        UPDATE tenant.accounts
        SET balance = balance - $1, updated_at = NOW()
        WHERE id = $2 AND tenant_id = $3
      `, [totalAmount, request.senderAccountId, senderAccount.tenant_id]);
            // 9. Record transaction
            await client.query(`
        INSERT INTO tenant.transactions (
          id, tenant_id, user_id, account_id, type, amount, description,
          reference, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      `, [
                (0, uuid_1.v4)(),
                senderAccount.tenant_id,
                userId,
                request.senderAccountId,
                'debit',
                totalAmount,
                `${biller.name} payment - ${request.customerReference}`,
                reference,
                'completed'
            ]);
            await client.query('COMMIT');
            // 10. Process bill payment asynchronously
            this.processBillerPayment(paymentId, request, biller, validation, reference)
                .catch(error => {
                console.error('Bill payment processing failed:', error);
            });
            return {
                id: paymentId,
                reference,
                status: 'processing',
                amount: request.amount,
                fees: fee,
                totalAmount,
                recipient: {
                    name: validation.customerName || biller.name,
                    accountNumber: request.customerReference,
                    bankName: biller.name,
                },
                message: 'Bill payment is being processed. You will receive a notification once completed.',
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
     * Validate customer with biller
     */
    async validateCustomer(request, biller) {
        try {
            const billerAPI = this.billerAPIs.get(biller.code);
            if (!billerAPI) {
                // Mock validation for demo purposes
                return this.mockValidateCustomer(request, biller);
            }
            const validationRequest = {
                billerId: request.billerId,
                customerReference: request.customerReference,
                amount: request.amount,
            };
            const response = await fetch(`${billerAPI.baseUrl}${billerAPI.endpoints.validate}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${billerAPI.apiKey}`,
                    'Accept': 'application/json',
                },
                body: JSON.stringify(validationRequest),
            });
            if (!response.ok) {
                throw new Error(`Biller API error: ${response.status}`);
            }
            const result = await response.json();
            return result;
        }
        catch (error) {
            console.error('Customer validation failed:', error);
            // Return mock validation for demo
            return this.mockValidateCustomer(request, biller);
        }
    }
    /**
     * Mock customer validation for demo purposes
     */
    mockValidateCustomer(request, biller) {
        // Generate mock customer names based on biller type
        const mockNames = {
            'electricity': ['ADEBAYO OLUMIDE', 'FATIMA MOHAMMED', 'CHIOMA OKWU', 'IBRAHIM HASSAN'],
            'tv_subscription': ['JOHN OKAFOR', 'MARY ADELEKE', 'PETER NWANKWO', 'GRACE ADEOLA'],
            'airtime': ['MTN AIRTIME', 'AIRTEL AIRTIME', 'GLO AIRTIME', '9MOBILE AIRTIME'],
            'data': ['DATA BUNDLE', 'INTERNET BUNDLE', 'DATA SUBSCRIPTION', 'BROADBAND SERVICE'],
            'internet': ['INTERNET SERVICE', 'BROADBAND CONNECTION', 'FIBER OPTIC', 'WIRELESS INTERNET'],
        };
        const categoryNames = mockNames[biller.category] || ['CUSTOMER'];
        const randomName = categoryNames[Math.floor(Math.random() * categoryNames.length)];
        return {
            isValid: true,
            customerName: randomName,
            customerInfo: {
                accountStatus: 'Active',
                lastPaymentDate: new Date(Date.now() - 86400000 * 30), // 30 days ago
            },
            amountDue: biller.category === 'airtime' ? undefined : request.amount,
        };
    }
    /**
     * Process biller payment
     */
    async processBillerPayment(paymentId, request, biller, validation, reference) {
        const client = await this.db.connect();
        try {
            const billerAPI = this.billerAPIs.get(biller.code);
            let status = 'completed';
            let failureReason = null;
            let billerReference = null;
            if (billerAPI) {
                try {
                    // Process actual payment with biller
                    const paymentRequest = {
                        billerId: request.billerId,
                        customerReference: request.customerReference,
                        amount: request.amount,
                        customerName: validation.customerName || 'Customer',
                        paymentReference: reference,
                        description: request.description || `${biller.name} payment`,
                    };
                    const response = await fetch(`${billerAPI.baseUrl}${billerAPI.endpoints.payment}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${billerAPI.apiKey}`,
                            'Accept': 'application/json',
                        },
                        body: JSON.stringify(paymentRequest),
                    });
                    const result = await response.json();
                    if (response.ok && result.success) {
                        status = 'completed';
                        billerReference = result.billerReference || result.transactionId;
                    }
                    else {
                        status = 'failed';
                        failureReason = result.message || 'Biller payment failed';
                    }
                }
                catch (error) {
                    console.error('Biller payment API error:', error);
                    status = 'failed';
                    failureReason = 'Biller communication error';
                }
            }
            else {
                // Mock successful payment for demo
                status = 'completed';
                billerReference = `${biller.code}${Date.now().toString().slice(-6)}`;
            }
            // Update payment status
            await client.query(`
        UPDATE bill_payments
        SET status = $1, biller_reference = $2, failure_reason = $3,
            processed_at = NOW(), updated_at = NOW()
        WHERE id = $4
      `, [status, billerReference, failureReason, paymentId]);
            // If payment failed, reverse the transaction
            if (status === 'failed') {
                await this.reverseFailedPayment(paymentId, client);
            }
        }
        catch (error) {
            console.error('Bill payment processing error:', error);
            // Mark payment as failed and reverse
            await client.query(`
        UPDATE bill_payments
        SET status = 'failed', failure_reason = $1, updated_at = NOW()
        WHERE id = $2
      `, ['Payment processing error', paymentId]);
            await this.reverseFailedPayment(paymentId, client);
        }
        finally {
            client.release();
        }
    }
    /**
     * Reverse failed payment
     */
    async reverseFailedPayment(paymentId, client) {
        // Get payment details
        const paymentResult = await client.query(`
      SELECT total_amount, sender_account_id, tenant_id, user_id
      FROM bill_payments
      WHERE id = $1
    `, [paymentId]);
        if (paymentResult.rows.length > 0) {
            const payment = paymentResult.rows[0];
            // Credit back to sender account
            await client.query(`
        UPDATE tenant.accounts
        SET balance = balance + $1, updated_at = NOW()
        WHERE id = $2 AND tenant_id = $3
      `, [payment.total_amount, payment.sender_account_id, payment.tenant_id]);
            // Record reversal transaction
            await client.query(`
        INSERT INTO tenant.transactions (
          id, tenant_id, user_id, account_id, type, amount, description,
          reference, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      `, [
                (0, uuid_1.v4)(),
                payment.tenant_id,
                payment.user_id,
                payment.sender_account_id,
                'credit',
                payment.total_amount,
                `Reversal for failed bill payment ${paymentId}`,
                `REV${Date.now().toString().slice(-8)}`,
                'completed'
            ]);
        }
    }
    /**
     * Get available billers
     */
    async getBillers(category) {
        try {
            let query = 'SELECT * FROM billers WHERE is_active = true';
            const params = [];
            if (category) {
                query += ' AND category = $1';
                params.push(category);
            }
            query += ' ORDER BY category, name';
            const result = await this.db.query(query, params);
            return result.rows.map(row => ({
                id: row.id,
                name: row.name,
                code: row.code,
                category: row.category,
                description: row.description,
                logo: row.logo,
                isActive: row.is_active,
                fields: JSON.parse(row.fields || '[]'),
                minAmount: row.min_amount,
                maxAmount: row.max_amount,
                fee: row.fee,
            }));
        }
        catch (error) {
            console.error('Error fetching billers:', error);
            return [];
        }
    }
    /**
     * Get biller by ID
     */
    async getBiller(billerId, client) {
        try {
            const dbClient = client || this.db;
            const result = await dbClient.query('SELECT * FROM billers WHERE id = $1 AND is_active = true', [billerId]);
            if (result.rows.length === 0) {
                return null;
            }
            const row = result.rows[0];
            return {
                id: row.id,
                name: row.name,
                code: row.code,
                category: row.category,
                description: row.description,
                logo: row.logo,
                isActive: row.is_active,
                fields: JSON.parse(row.fields || '[]'),
                minAmount: row.min_amount,
                maxAmount: row.max_amount,
                fee: row.fee,
            };
        }
        catch (error) {
            console.error('Error fetching biller:', error);
            return null;
        }
    }
    /**
     * Calculate bill payment fee
     */
    async calculateBillPaymentFee(amount, category) {
        // Fee structure based on category
        const feeStructure = {
            'electricity': 50,
            'tv_subscription': 50,
            'airtime': 0, // No fee for airtime
            'data': 25,
            'internet': 50,
            'water': 50,
            'waste_management': 50,
            'tax': 100,
            'education': 50,
            'insurance': 75,
        };
        return feeStructure[category] || 50;
    }
    /**
     * Validate bill payment request
     */
    async validateBillPaymentRequest(request, userId, client) {
        if (!request.billerId?.trim()) {
            throw new transfers_1.ValidationError('Biller ID is required', 'billerId');
        }
        if (!request.customerReference?.trim()) {
            throw new transfers_1.ValidationError('Customer reference is required', 'customerReference');
        }
        if (!request.amount || request.amount <= 0) {
            throw new transfers_1.ValidationError('Invalid payment amount', 'amount');
        }
        if (request.amount < 50) {
            throw new transfers_1.ValidationError('Minimum payment amount is ₦50', 'amount');
        }
        if (request.amount > 500000) {
            throw new transfers_1.ValidationError('Maximum payment amount is ₦500,000', 'amount');
        }
        if (!request.pin?.trim()) {
            throw new transfers_1.ValidationError('Transaction PIN is required', 'pin');
        }
        if (request.pin.length !== 4) {
            throw new transfers_1.ValidationError('PIN must be 4 digits', 'pin');
        }
        // Verify PIN
        const pinResult = await client.query('SELECT id FROM tenant.users WHERE id = $1 AND transaction_pin = $2', [userId, request.pin]);
        if (pinResult.rows.length === 0) {
            throw new transfers_1.ValidationError('Invalid transaction PIN', 'pin');
        }
    }
    /**
     * Get sender account details
     */
    async getSenderAccount(accountId, client) {
        const result = await client.query(`
      SELECT * FROM tenant.accounts
      WHERE id = $1 AND is_active = true
    `, [accountId]);
        return result.rows[0];
    }
    /**
     * Get bill payment history
     */
    async getBillPaymentHistory(accountId, limit = 50) {
        const result = await this.db.query(`
      SELECT * FROM bill_payments
      WHERE sender_account_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [accountId, limit]);
        return result.rows;
    }
    /**
     * Get payment status
     */
    async getPaymentStatus(paymentId) {
        const result = await this.db.query(`
      SELECT * FROM bill_payments WHERE id = $1
    `, [paymentId]);
        return result.rows[0];
    }
}
exports.default = BillPaymentService;
