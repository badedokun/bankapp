"use strict";
/**
 * International Transfer Service (SWIFT Integration)
 * Handles cross-border transfers via SWIFT network
 */
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const transfers_1 = require("../../types/transfers");
const validation_error_1 = require("../../types/validation-error");
class InternationalTransferService {
    constructor(database) {
        this.db = database;
        this.swiftBaseUrl = process.env.SWIFT_API_URL || 'https://api.swift.com';
        this.swiftApiKey = process.env.SWIFT_API_KEY || '';
        this.swiftBic = process.env.SWIFT_BIC_CODE || 'FMFBNGLA'; // FMFB BIC code
        this.complianceApiUrl = process.env.COMPLIANCE_API_URL || 'https://api.compliance.service.com';
        this.currencyApiUrl = process.env.CURRENCY_API_URL || 'https://api.exchangerate.host';
    }
    /**
     * Process international transfer via SWIFT
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
                throw new validation_error_1.ValidationError('Invalid sender account', 'senderAccountId');
            }
            // 3. Perform compliance checks
            const complianceResult = await this.performComplianceChecks(request, senderAccount);
            if (!complianceResult.isCompliant) {
                throw new validation_error_1.ValidationError(`Transfer blocked by compliance: ${complianceResult.reason}`, 'compliance');
            }
            // 4. Get exchange rate and calculate amounts
            const exchangeRate = await this.getExchangeRate('NGN', request.recipientCountry);
            const feeStructure = await this.calculateInternationalFees(request.amount, request.recipientCountry);
            const totalAmount = request.amount + feeStructure.totalFees;
            const recipientAmount = request.amount * exchangeRate.rate;
            // 5. Check account balance
            if (senderAccount.balance < totalAmount) {
                throw new transfers_1.InsufficientFundsError(senderAccount.balance, totalAmount);
            }
            // 6. Check transfer limits
            await this.checkInternationalLimits(request.senderAccountId, totalAmount, client);
            // 7. Create transfer record
            const transferId = (0, uuid_1.v4)();
            const reference = `INT${Date.now().toString().slice(-8)}`;
            await client.query(`
        INSERT INTO international_transfers (
          id, tenant_id, user_id, sender_account_id, amount, currency, recipient_amount,
          recipient_currency, exchange_rate, fees, total_amount, recipient_name,
          recipient_iban, recipient_swift_code, recipient_country, recipient_city,
          recipient_address, purpose, source_of_funds, description, reference,
          compliance_score, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW(), NOW())
      `, [
                transferId,
                senderAccount.tenant_id,
                userId,
                request.senderAccountId,
                request.amount,
                'NGN',
                recipientAmount,
                this.getCurrencyForCountry(request.recipientCountry),
                exchangeRate.rate,
                feeStructure.totalFees,
                totalAmount,
                request.recipientName,
                request.recipientIban,
                request.recipientSwiftCode,
                request.recipientCountry,
                request.recipientCity,
                request.recipientAddress,
                request.purpose,
                request.sourceOfFunds,
                request.description || 'International transfer',
                reference,
                complianceResult.riskScore,
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
                `International transfer to ${request.recipientName} - ${request.recipientCountry}`,
                reference,
                'completed'
            ]);
            await client.query('COMMIT');
            // 10. Process SWIFT transfer asynchronously
            this.processSWIFTTransfer(transferId, request, senderAccount, exchangeRate, reference)
                .catch(error => {
                console.error('SWIFT transfer processing failed:', error);
            });
            return {
                id: transferId,
                reference,
                status: 'processing',
                amount: request.amount,
                fees: feeStructure.totalFees,
                totalAmount,
                recipient: {
                    name: request.recipientName,
                    accountNumber: request.recipientIban,
                    bankName: request.recipientSwiftCode,
                },
                message: `International transfer is being processed via SWIFT. Recipient will receive ${recipientAmount.toFixed(2)} ${this.getCurrencyForCountry(request.recipientCountry)}`,
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
     * Perform compliance checks (AML, KYC, Sanctions)
     */
    async performComplianceChecks(request, senderAccount) {
        try {
            // Mock compliance check for demo - in production, integrate with actual compliance service
            const mockCompliance = {
                isCompliant: true,
                riskScore: 25, // Low risk
                sanctions: {
                    isListed: false,
                    lists: [],
                },
                aml: {
                    riskLevel: 'LOW',
                    flags: [],
                },
                kyc: {
                    isVerified: true,
                    level: 3,
                },
            };
            // High-risk countries check
            const highRiskCountries = ['AF', 'IR', 'KP', 'SY']; // Afghanistan, Iran, North Korea, Syria
            if (highRiskCountries.includes(request.recipientCountry)) {
                mockCompliance.isCompliant = false;
                mockCompliance.reason = 'Transfer to high-risk jurisdiction blocked';
                mockCompliance.riskScore = 95;
            }
            // Large amount check
            if (request.amount > 50000) { // USD 50,000 equivalent
                mockCompliance.riskScore += 30;
                mockCompliance.aml.riskLevel = 'HIGH';
                mockCompliance.aml.flags.push('Large amount transaction');
            }
            // Purpose check
            const suspiciousPurposes = ['investment', 'loan', 'gambling'];
            if (suspiciousPurposes.some(purpose => request.purpose.toLowerCase().includes(purpose))) {
                mockCompliance.riskScore += 20;
                mockCompliance.aml.flags.push('Suspicious transaction purpose');
            }
            return mockCompliance;
        }
        catch (error) {
            console.error('Compliance check failed:', error);
            return {
                isCompliant: false,
                riskScore: 100,
                sanctions: { isListed: false, lists: [] },
                aml: { riskLevel: 'HIGH', flags: ['Compliance check error'] },
                kyc: { isVerified: false, level: 0 },
                reason: 'Unable to verify compliance',
            };
        }
    }
    /**
     * Get exchange rate for currency conversion
     */
    async getExchangeRate(fromCurrency, toCountry) {
        try {
            const toCurrency = this.getCurrencyForCountry(toCountry);
            // Mock exchange rates for demo
            const mockRates = {
                'USD': 1600, // 1 USD = 1600 NGN
                'EUR': 1750, // 1 EUR = 1750 NGN
                'GBP': 2000, // 1 GBP = 2000 NGN
                'CAD': 1200, // 1 CAD = 1200 NGN
                'AUD': 1100, // 1 AUD = 1100 NGN
                'ZAR': 85, // 1 ZAR = 85 NGN
                'KES': 11, // 1 KES = 11 NGN
                'GHS': 135, // 1 GHS = 135 NGN
            };
            const rate = mockRates[toCurrency] || 1600; // Default to USD rate
            return {
                fromCurrency,
                toCurrency,
                rate: 1 / rate, // Convert NGN to foreign currency
                timestamp: new Date(),
            };
        }
        catch (error) {
            console.error('Exchange rate fetch failed:', error);
            // Return default USD rate
            return {
                fromCurrency,
                toCurrency: 'USD',
                rate: 1 / 1600,
                timestamp: new Date(),
            };
        }
    }
    /**
     * Calculate international transfer fees
     */
    async calculateInternationalFees(amount, recipientCountry) {
        // Base SWIFT fee
        const swiftFee = 2500; // ₦2,500 base SWIFT fee
        // Correspondent bank fee (varies by region)
        const correspondentFeeRates = {
            'US': 25, // $25 for US transfers
            'EU': 20, // €20 for EU transfers
            'UK': 15, // £15 for UK transfers
            'CA': 25, // CAD 25 for Canada
            'AU': 30, // AUD 30 for Australia
            'DEFAULT': 3000, // ₦3,000 for other countries
        };
        const region = this.getRegionForCountry(recipientCountry);
        const correspondentFee = correspondentFeeRates[region] || correspondentFeeRates['DEFAULT'];
        // Regulatory fee (fixed)
        const regulatoryFee = 500; // ₦500 CBN regulatory fee
        // Convert correspondent fee to NGN if needed
        const correspondentFeeNGN = region === 'DEFAULT'
            ? correspondentFee
            : correspondentFee * 1600; // Approximate conversion
        const totalFees = swiftFee + correspondentFeeNGN + regulatoryFee;
        return {
            swiftFee,
            correspondentFee: correspondentFeeNGN,
            regulatoryFee,
            totalFees,
        };
    }
    /**
     * Process SWIFT transfer
     */
    async processSWIFTTransfer(transferId, request, senderAccount, exchangeRate, reference) {
        const client = await this.db.connect();
        try {
            // Prepare SWIFT MT103 message
            const swiftRequest = {
                messageType: 'MT103',
                senderReference: reference,
                bankOperationCode: 'CRED',
                orderingCustomer: {
                    account: senderAccount.account_number,
                    name: senderAccount.account_name,
                    address: senderAccount.address || 'Lagos, Nigeria',
                },
                sendingInstitution: {
                    bicCode: this.swiftBic,
                    name: 'First Microfinance Bank Limited',
                    address: 'Plot 161, Sinari Daranijo Street, Victoria Island, Lagos, Nigeria',
                },
                receivingInstitution: {
                    bicCode: request.recipientSwiftCode,
                    name: 'Unknown Bank', // Would be resolved from SWIFT directory
                    address: `${request.recipientCity}, ${request.recipientCountry}`,
                },
                beneficiaryCustomer: {
                    account: request.recipientIban,
                    name: request.recipientName,
                    address: request.recipientAddress,
                },
                remittanceInformation: request.description || request.purpose,
                amount: {
                    currency: exchangeRate.toCurrency,
                    value: request.amount * exchangeRate.rate,
                },
                valueDate: new Date().toISOString().split('T')[0],
                charges: 'OUR', // Sender pays all charges
            };
            // Send to SWIFT network (mock for demo)
            const swiftResponse = await this.sendSWIFTMessage(swiftRequest);
            let status;
            let failureReason = null;
            if (swiftResponse.status === 'accepted') {
                status = 'completed';
            }
            else {
                status = 'failed';
                failureReason = swiftResponse.statusDescription;
                // Reverse the debit if transfer failed
                await this.reverseFailedTransfer(transferId, senderAccount, client);
            }
            // Update transfer status
            await client.query(`
        UPDATE international_transfers
        SET status = $1, swift_reference = $2, failure_reason = $3,
            processed_at = NOW(), updated_at = NOW()
        WHERE id = $4
      `, [status, swiftResponse.messageReference, failureReason, transferId]);
        }
        catch (error) {
            console.error('SWIFT transfer processing error:', error);
            // Mark transfer as failed and reverse
            await client.query(`
        UPDATE international_transfers
        SET status = 'failed', failure_reason = $1, updated_at = NOW()
        WHERE id = $2
      `, ['SWIFT processing error', transferId]);
            await this.reverseFailedTransfer(transferId, senderAccount, client);
        }
        finally {
            client.release();
        }
    }
    /**
     * Send SWIFT message (mock implementation)
     */
    async sendSWIFTMessage(request) {
        try {
            // Mock SWIFT API call for demo
            // In production, integrate with actual SWIFT API
            const mockResponse = {
                messageReference: `FT${Date.now().toString().slice(-10)}`,
                transactionReference: `${request.senderReference}SWIFT`,
                status: 'accepted',
                statusDescription: 'Message accepted for processing',
                valueDate: request.valueDate,
                charges: {
                    amount: 25,
                    currency: request.amount.currency,
                },
            };
            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            return mockResponse;
        }
        catch (error) {
            console.error('SWIFT API error:', error);
            return {
                messageReference: '',
                transactionReference: '',
                status: 'rejected',
                statusDescription: 'SWIFT network error',
                valueDate: request.valueDate,
                errors: [{
                        code: 'NETWORK_ERROR',
                        description: 'Unable to connect to SWIFT network',
                    }],
            };
        }
    }
    /**
     * Reverse failed transfer
     */
    async reverseFailedTransfer(transferId, senderAccount, client) {
        // Get transfer details
        const transferResult = await client.query('SELECT total_amount FROM international_transfers WHERE id = $1', [transferId]);
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
                `Reversal for failed international transfer ${transferId}`,
                `REV${Date.now().toString().slice(-8)}`,
                'completed'
            ]);
        }
    }
    /**
     * Helper methods
     */
    getCurrencyForCountry(countryCode) {
        const currencyMap = {
            'US': 'USD', 'CA': 'CAD', 'GB': 'GBP', 'AU': 'AUD', 'NZ': 'NZD',
            'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR',
            'ZA': 'ZAR', 'KE': 'KES', 'GH': 'GHS', 'UG': 'UGX',
            'IN': 'INR', 'CN': 'CNY', 'JP': 'JPY', 'SG': 'SGD',
        };
        return currencyMap[countryCode] || 'USD';
    }
    getRegionForCountry(countryCode) {
        const regions = {
            'US': 'US',
            'CA': 'CA',
            'GB': 'UK',
            'AU': 'AU',
            'NZ': 'AU',
        };
        // EU countries
        const euCountries = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'LU'];
        if (euCountries.includes(countryCode)) {
            return 'EU';
        }
        return regions[countryCode] || 'DEFAULT';
    }
    /**
     * Validation and utility methods
     */
    async validateTransferRequest(request, userId, client) {
        if (!request.recipientName?.trim()) {
            throw new validation_error_1.ValidationError('Recipient name is required', 'recipientName');
        }
        if (!request.recipientIban?.trim()) {
            throw new validation_error_1.ValidationError('Recipient IBAN is required', 'recipientIban');
        }
        if (!request.recipientSwiftCode?.trim()) {
            throw new validation_error_1.ValidationError('Recipient SWIFT code is required', 'recipientSwiftCode');
        }
        if (!request.recipientCountry?.trim()) {
            throw new validation_error_1.ValidationError('Recipient country is required', 'recipientCountry');
        }
        if (!request.recipientCity?.trim()) {
            throw new validation_error_1.ValidationError('Recipient city is required', 'recipientCity');
        }
        if (!request.recipientAddress?.trim()) {
            throw new validation_error_1.ValidationError('Recipient address is required', 'recipientAddress');
        }
        if (!request.purpose?.trim()) {
            throw new validation_error_1.ValidationError('Transfer purpose is required', 'purpose');
        }
        if (!request.sourceOfFunds?.trim()) {
            throw new validation_error_1.ValidationError('Source of funds is required', 'sourceOfFunds');
        }
        if (!request.amount || request.amount <= 0) {
            throw new validation_error_1.ValidationError('Invalid transfer amount', 'amount');
        }
        if (request.amount < 1000) {
            throw new validation_error_1.ValidationError('Minimum international transfer amount is ₦1,000', 'amount');
        }
        if (request.amount > 10000000) {
            throw new validation_error_1.ValidationError('Maximum international transfer amount is ₦10,000,000', 'amount');
        }
        if (!request.pin?.trim()) {
            throw new validation_error_1.ValidationError('Transaction PIN is required', 'pin');
        }
        // Verify PIN
        const pinResult = await client.query('SELECT id FROM tenant.users WHERE id = $1 AND transaction_pin = $2', [userId, request.pin]);
        if (pinResult.rows.length === 0) {
            throw new validation_error_1.ValidationError('Invalid transaction PIN', 'pin');
        }
    }
    async getSenderAccount(accountId, client) {
        const result = await client.query(`
      SELECT a.*, u.bvn, u.kyc_level
      FROM tenant.accounts a
      JOIN tenant.users u ON a.user_id = u.id
      WHERE a.id = $1 AND a.is_active = true
    `, [accountId]);
        return result.rows[0];
    }
    async checkInternationalLimits(accountId, amount, client) {
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = new Date().toISOString().substring(0, 7);
        // Check daily limit for international transfers
        const dailyResult = await client.query(`
      SELECT COALESCE(SUM(total_amount), 0) as daily_total
      FROM international_transfers
      WHERE sender_account_id = $1
      AND DATE(created_at) = $2
      AND status IN ('completed', 'processing')
    `, [accountId, today]);
        const dailyUsed = parseFloat(dailyResult.rows[0].daily_total);
        const dailyLimit = 2000000; // ₦2M daily limit for international
        if (dailyUsed + amount > dailyLimit) {
            throw new transfers_1.LimitExceededError('Daily international', dailyLimit, dailyUsed + amount);
        }
        // Check monthly limit
        const monthlyResult = await client.query(`
      SELECT COALESCE(SUM(total_amount), 0) as monthly_total
      FROM international_transfers
      WHERE sender_account_id = $1
      AND DATE_TRUNC('month', created_at) = $2
      AND STATUS IN ('completed', 'processing')
    `, [accountId, thisMonth + '-01']);
        const monthlyUsed = parseFloat(monthlyResult.rows[0].monthly_total);
        const monthlyLimit = 50000000; // ₦50M monthly limit
        if (monthlyUsed + amount > monthlyLimit) {
            throw new transfers_1.LimitExceededError('Monthly international', monthlyLimit, monthlyUsed + amount);
        }
    }
    /**
     * Get transfer status
     */
    async getTransferStatus(transferId) {
        const result = await this.db.query(`
      SELECT * FROM international_transfers WHERE id = $1
    `, [transferId]);
        return result.rows[0];
    }
    /**
     * Get transfer history
     */
    async getTransferHistory(accountId, limit = 50) {
        const result = await this.db.query(`
      SELECT * FROM international_transfers
      WHERE sender_account_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [accountId, limit]);
        return result.rows;
    }
}
exports.default = InternationalTransferService;
//# sourceMappingURL=InternationalTransferService.js.map