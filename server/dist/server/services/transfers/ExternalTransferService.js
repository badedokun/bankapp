"use strict";
/**
 * External Transfer Service (NIBSS NIP Integration)
 * Handles interbank transfers via Nigeria Instant Payment (NIP)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const transfers_1 = require("../../types/transfers");
class ExternalTransferService {
    constructor(database) {
        this.db = database;
        this.nibssBaseUrl = process.env.NIBSS_BASE_URL || 'https://api.nibss.com/nip/api';
        this.nibssApiKey = process.env.NIBSS_API_KEY || '';
        this.channelCode = process.env.NIBSS_CHANNEL_CODE || 'WEB';
        this.institutionCode = process.env.NIBSS_INSTITUTION_CODE || '999999'; // FMFB code
    }
    /**
     * Process external transfer via NIBSS NIP
     */
    async processTransfer(request, userId) {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');
            // 1. Validate request
            await this.validateTransferRequest(request, userId, client);
            // 2. Get sender account details
            const senderAccount = await this.getSenderAccount(request.senderAccountId, client);
            if (!senderAccount) {
                throw new transfers_1.ValidationError('Invalid sender account', 'senderAccountId');
            }
            // 3. Calculate total amount including fees
            const fee = await this.calculateTransferFee(request.amount, request.recipientBankCode);
            const totalAmount = request.amount + fee;
            // 4. Check account balance
            if (senderAccount.balance < totalAmount) {
                throw new transfers_1.InsufficientFundsError(senderAccount.balance, totalAmount);
            }
            // 5. Check transfer limits
            await this.checkTransferLimits(request.senderAccountId, totalAmount, client);
            // 6. Verify recipient account via NIBSS
            const accountVerification = await this.verifyRecipientAccount(request.recipientAccountNumber, request.recipientBankCode);
            if (!accountVerification.isValid) {
                throw new transfers_1.ValidationError('Recipient account verification failed', 'recipientAccountNumber');
            }
            // 7. Create transfer record
            const transferId = (0, uuid_1.v4)();
            const reference = `FMFB${Date.now().toString().slice(-8)}`;
            await client.query(`
        INSERT INTO transfers (
          id, tenant_id, user_id, sender_account_id, type, amount, fees, total_amount,
          recipient_name, recipient_account_number, recipient_bank_code, recipient_bank_name,
          description, reference, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
      `, [
                transferId,
                senderAccount.tenant_id,
                userId,
                request.senderAccountId,
                'external',
                request.amount,
                fee,
                totalAmount,
                accountVerification.accountName || request.recipientName,
                request.recipientAccountNumber,
                request.recipientBankCode,
                accountVerification.bankName,
                request.description || 'External transfer via NIBSS',
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
                `Transfer to ${accountVerification.accountName || request.recipientName} - ${request.recipientBankCode}`,
                reference,
                'completed'
            ]);
            await client.query('COMMIT');
            // 10. Process NIBSS transfer asynchronously
            this.processNIBSSTransfer(transferId, request, senderAccount, accountVerification, reference)
                .catch(error => {
                console.error('NIBSS transfer processing failed:', error);
            });
            return {
                success: true,
                id: transferId,
                reference,
                status: 'processing',
                amount: request.amount,
                fees: fee,
                totalAmount,
                recipient: {
                    name: accountVerification.accountName || request.recipientName,
                    accountNumber: request.recipientAccountNumber,
                    bankName: accountVerification.bankName,
                },
                message: 'Transfer is being processed via NIBSS. You will receive a notification once completed.',
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
     * Verify recipient account via NIBSS Name Enquiry
     */
    async verifyRecipientAccount(accountNumber, bankCode) {
        try {
            const requestData = {
                destinationInstitutionCode: bankCode,
                channelCode: this.channelCode,
                accountNumber,
            };
            const response = await fetch(`${this.nibssBaseUrl}/NameEnquiry`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.nibssApiKey}`,
                    'Accept': 'application/json',
                },
                body: JSON.stringify(requestData),
            });
            if (!response.ok) {
                throw new Error(`NIBSS API error: ${response.status}`);
            }
            const result = await response.json() || {};
            // NIBSS response codes: 00 = success
            if (result.responseCode === '00') {
                // Get bank name
                const bankName = await this.getBankName(bankCode);
                return {
                    isValid: true,
                    accountName: result.accountName,
                    bankName,
                    bvn: result.bankVerificationNumber,
                    kycLevel: result.kycLevel,
                };
            }
            return {
                isValid: false,
            };
        }
        catch (error) {
            console.error('NIBSS account verification failed:', error);
            return {
                isValid: false,
            };
        }
    }
    /**
     * Process NIBSS transfer
     */
    async processNIBSSTransfer(transferId, request, senderAccount, accountVerification, reference) {
        const client = await this.db.connect();
        try {
            // Prepare NIBSS transfer request
            const nibssRequest = {
                nameEnquiryRef: reference,
                destinationInstitutionCode: request.recipientBankCode,
                channelCode: this.channelCode,
                beneficiaryAccountNumber: request.recipientAccountNumber,
                beneficiaryAccountName: accountVerification.accountName || request.recipientName,
                beneficiaryBankVerificationNumber: accountVerification.bvn || '',
                beneficiaryKYCLevel: accountVerification.kycLevel || '1',
                originatorAccountNumber: senderAccount.account_number,
                originatorAccountName: senderAccount.account_name,
                originatorBankVerificationNumber: senderAccount.bvn || '',
                originatorKYCLevel: senderAccount.kyc_level || '3',
                tranRemarks: request.description || 'Transfer via FMFB',
                amount: request.amount,
                currencyCode: 'NGN',
                paymentReference: reference,
            };
            // Send to NIBSS
            const response = await fetch(`${this.nibssBaseUrl}/SingleCreditPushRequest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.nibssApiKey}`,
                    'Accept': 'application/json',
                },
                body: JSON.stringify(nibssRequest),
            });
            const result = await response.json() || {};
            let status;
            let failureReason = null;
            if (result.responseCode === '00') {
                status = 'completed';
            }
            else {
                status = 'failed';
                failureReason = result.responseDescription || 'NIBSS transfer failed';
                // Reverse the debit if transfer failed
                await this.reverseFailedTransfer(transferId, senderAccount, client);
            }
            // Update transfer status
            await client.query(`
        UPDATE transfers
        SET status = $1, nibss_reference = $2, failure_reason = $3,
            processed_at = NOW(), updated_at = NOW()
        WHERE id = $4
      `, [status, result.transactionReference, failureReason, transferId]);
            // Save beneficiary if requested
            if (request.saveBeneficiary && status === 'completed') {
                await this.saveBeneficiary(senderAccount.user_id, senderAccount.tenant_id, request, accountVerification, client);
            }
        }
        catch (error) {
            console.error('NIBSS transfer processing error:', error);
            // Mark transfer as failed and reverse
            await client.query(`
        UPDATE transfers
        SET status = 'failed', failure_reason = $1, updated_at = NOW()
        WHERE id = $2
      `, ['NIBSS processing error', transferId]);
            await this.reverseFailedTransfer(transferId, senderAccount, client);
        }
        finally {
            client.release();
        }
    }
    /**
     * Reverse failed transfer
     */
    async reverseFailedTransfer(transferId, senderAccount, client) {
        // Get transfer details
        const transferResult = await client.query('SELECT total_amount FROM transfers WHERE id = $1', [transferId]);
        if (transferResult.rows.length > 0) {
            const totalAmount = transferResult.rows[0].total_amount;
            // Credit back to sender account
            await client.query(`
        UPDATE tenant.accounts
        SET balance = balance + $1, updated_at = NOW()
        WHERE id = $2 AND tenant_id = $3
      `, [totalAmount, senderAccount.id, senderAccount.tenant_id]);
            // Record reversal transaction
            await client.query(`
        INSERT INTO tenant.transactions (
          id, tenant_id, user_id, account_id, type, amount, description,
          reference, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      `, [
                (0, uuid_1.v4)(),
                senderAccount.tenant_id,
                senderAccount.user_id,
                senderAccount.id,
                'credit',
                totalAmount,
                `Reversal for failed transfer ${transferId}`,
                `REV${Date.now().toString().slice(-8)}`,
                'completed'
            ]);
        }
    }
    /**
     * Save beneficiary
     */
    async saveBeneficiary(userId, tenantId, request, accountVerification, client) {
        try {
            await client.query(`
        INSERT INTO tenant.beneficiaries (
          id, tenant_id, user_id, name, account_number, bank_code, bank_name,
          nickname, is_frequent, total_transfers, last_used, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), NOW())
        ON CONFLICT (tenant_id, user_id, account_number, bank_code)
        DO UPDATE SET total_transfers = beneficiaries.total_transfers + 1, last_used = NOW()
      `, [
                (0, uuid_1.v4)(),
                tenantId,
                userId,
                accountVerification.accountName || request.recipientName,
                request.recipientAccountNumber,
                request.recipientBankCode,
                accountVerification.bankName,
                request.beneficiaryNickname || accountVerification.accountName,
                false,
                1
            ]);
        }
        catch (error) {
            console.error('Failed to save beneficiary:', error);
        }
    }
    /**
     * Get bank name by code
     */
    async getBankName(bankCode) {
        try {
            const result = await this.db.query('SELECT name FROM banks WHERE code = $1 AND is_active = true', [bankCode]);
            return result.rows[0]?.name || 'Unknown Bank';
        }
        catch (error) {
            return 'Unknown Bank';
        }
    }
    /**
     * Calculate transfer fee
     */
    async calculateTransferFee(amount, bankCode) {
        // NIBSS standard fee structure
        const nibssFee = 52.50; // Standard NIBSS fee
        // Additional bank-specific fees could be added here
        try {
            const result = await this.db.query('SELECT transfer_fee FROM banks WHERE code = $1', [bankCode]);
            if (result.rows.length > 0) {
                return result.rows[0].transfer_fee || nibssFee;
            }
        }
        catch (error) {
            console.error('Error fetching bank fee:', error);
        }
        return nibssFee;
    }
    /**
     * Validate transfer request
     */
    async validateTransferRequest(request, userId, client) {
        if (!request.recipientName?.trim()) {
            throw new transfers_1.ValidationError('Recipient name is required', 'recipientName');
        }
        if (!request.recipientAccountNumber?.trim()) {
            throw new transfers_1.ValidationError('Recipient account number is required', 'recipientAccountNumber');
        }
        if (request.recipientAccountNumber.length !== 10) {
            throw new transfers_1.ValidationError('Account number must be 10 digits', 'recipientAccountNumber');
        }
        if (!request.recipientBankCode?.trim()) {
            throw new transfers_1.ValidationError('Recipient bank code is required', 'recipientBankCode');
        }
        if (!request.amount || request.amount <= 0) {
            throw new transfers_1.ValidationError('Invalid transfer amount', 'amount');
        }
        if (request.amount < 100) {
            throw new transfers_1.ValidationError('Minimum transfer amount is ₦100', 'amount');
        }
        if (request.amount > 1000000) {
            throw new transfers_1.ValidationError('Maximum transfer amount is ₦1,000,000', 'amount');
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
      SELECT a.*, u.bvn, u.kyc_level
      FROM tenant.accounts a
      JOIN tenant.users u ON a.user_id = u.id
      WHERE a.id = $1 AND a.is_active = true
    `, [accountId]);
        return result.rows[0];
    }
    /**
     * Check transfer limits
     */
    async checkTransferLimits(accountId, amount, client) {
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = new Date().toISOString().substring(0, 7);
        // Check daily limit
        const dailyResult = await client.query(`
      SELECT COALESCE(SUM(total_amount), 0) as daily_total
      FROM transfers
      WHERE sender_account_id = $1
      AND DATE(created_at) = $2
      AND status IN ('completed', 'processing')
    `, [accountId, today]);
        const dailyUsed = parseFloat(dailyResult.rows[0].daily_total);
        const dailyLimit = 5000000; // ₦5M daily limit
        if (dailyUsed + amount > dailyLimit) {
            throw new transfers_1.LimitExceededError('Daily', dailyLimit, dailyUsed + amount);
        }
        // Check monthly limit
        const monthlyResult = await client.query(`
      SELECT COALESCE(SUM(total_amount), 0) as monthly_total
      FROM transfers
      WHERE sender_account_id = $1
      AND DATE_TRUNC('month', created_at) = $2
      AND status IN ('completed', 'processing')
    `, [accountId, thisMonth + '-01']);
        const monthlyUsed = parseFloat(monthlyResult.rows[0].monthly_total);
        const monthlyLimit = 20000000; // ₦20M monthly limit
        if (monthlyUsed + amount > monthlyLimit) {
            throw new transfers_1.LimitExceededError('Monthly', monthlyLimit, monthlyUsed + amount);
        }
    }
    /**
     * Get transfer status
     */
    async getTransferStatus(transferId) {
        const result = await this.db.query(`
      SELECT * FROM transfers WHERE id = $1
    `, [transferId]);
        return result.rows[0];
    }
    /**
     * Get transfer history
     */
    async getTransferHistory(accountId, limit = 50) {
        const result = await this.db.query(`
      SELECT * FROM transfers
      WHERE sender_account_id = $1 AND type = 'external'
      ORDER BY created_at DESC
      LIMIT $2
    `, [accountId, limit]);
        return result.rows;
    }
}
exports.default = ExternalTransferService;
//# sourceMappingURL=ExternalTransferService.js.map