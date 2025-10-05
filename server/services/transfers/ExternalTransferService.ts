/**
 * External Transfer Service (NIBSS NIP Integration)
 * Handles interbank transfers via Nigeria Instant Payment (NIP)
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import {
  ExternalTransferRequest,
  TransferResponse,
  TransferError,
  ValidationError,
  InsufficientFundsError,
  LimitExceededError,
  TransferStatus,
} from '../../types/transfers';

interface NIBSSAccountInquiryRequest {
  destinationInstitutionCode: string;
  channelCode: string;
  accountNumber: string;
}

interface NIBSSAccountInquiryResponse {
  responseCode: string;
  responseDescription: string;
  accountNumber: string;
  accountName: string;
  bankVerificationNumber: string;
  kycLevel: string;
}

interface NIBSSTransferRequest {
  nameEnquiryRef: string;
  destinationInstitutionCode: string;
  channelCode: string;
  beneficiaryAccountNumber: string;
  beneficiaryAccountName: string;
  beneficiaryBankVerificationNumber: string;
  beneficiaryKYCLevel: string;
  originatorAccountNumber: string;
  originatorAccountName: string;
  originatorBankVerificationNumber: string;
  originatorKYCLevel: string;
  tranRemarks: string;
  amount: number;
  currencyCode: string;
  paymentReference: string;
}

interface NIBSSTransferResponse {
  responseCode: string;
  responseDescription: string;
  transactionReference: string;
  amount: number;
  sessionId: string;
}

class ExternalTransferService {
  private db: Pool;
  private nibssBaseUrl: string;
  private nibssApiKey: string;
  private channelCode: string;
  private institutionCode: string;

  constructor(database: Pool) {
    this.db = database;
    this.nibssBaseUrl = process.env.NIBSS_BASE_URL || 'https://api.nibss.com/nip/api';
    this.nibssApiKey = process.env.NIBSS_API_KEY || '';
    this.channelCode = process.env.NIBSS_CHANNEL_CODE || 'WEB';
    this.institutionCode = process.env.NIBSS_INSTITUTION_CODE || '999999'; // FMFB code
  }

  /**
   * Process external transfer via NIBSS NIP
   */
  async processTransfer(request: ExternalTransferRequest, userId: string): Promise<TransferResponse> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // 1. Validate request
      await this.validateTransferRequest(request, userId, client);

      // 2. Get sender account details
      const senderAccount = await this.getSenderAccount(request.senderAccountId, client);
      if (!senderAccount) {
        throw new ValidationError('Invalid sender account', 'senderAccountId');
      }

      // 3. Calculate total amount including fees
      const fee = await this.calculateTransferFee(request.amount, request.recipientBankCode);
      const totalAmount = request.amount + fee;

      // 4. Check account balance
      if (senderAccount.balance < totalAmount) {
        throw new InsufficientFundsError(senderAccount.balance, totalAmount);
      }

      // 5. Check transfer limits
      await this.checkTransferLimits(request.senderAccountId, totalAmount, client);

      // 6. Verify recipient account via NIBSS
      const accountVerification = await this.verifyRecipientAccount(
        request.recipientAccountNumber,
        request.recipientBankCode
      );

      if (!accountVerification.isValid) {
        throw new ValidationError('Recipient account verification failed', 'recipientAccountNumber');
      }

      // 7. Create transfer record
      const transferId = uuidv4();
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
        uuidv4(),
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
        status: 'processing' as TransferStatus,
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

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Verify recipient account via NIBSS Name Enquiry
   */
  async verifyRecipientAccount(
    accountNumber: string,
    bankCode: string
  ): Promise<{
    isValid: boolean;
    accountName?: string;
    bankName?: string;
    bvn?: string;
    kycLevel?: string;
  }> {
    try {
      const requestData: NIBSSAccountInquiryRequest = {
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

      const result: NIBSSAccountInquiryResponse = await response.json() as NIBSSAccountInquiryResponse || {} as NIBSSAccountInquiryResponse;

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

    } catch (error) {
      console.error('NIBSS account verification failed:', error);
      return {
        isValid: false,
      };
    }
  }

  /**
   * Process NIBSS transfer
   */
  private async processNIBSSTransfer(
    transferId: string,
    request: ExternalTransferRequest,
    senderAccount: any,
    accountVerification: any,
    reference: string
  ): Promise<void> {
    const client = await this.db.connect();

    try {
      // Prepare NIBSS transfer request
      const nibssRequest: NIBSSTransferRequest = {
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

      const result: NIBSSTransferResponse = await response.json() as NIBSSTransferResponse || {} as NIBSSTransferResponse;

      let status: TransferStatus;
      let failureReason: string | null = null;

      if (result.responseCode === '00') {
        status = 'completed';
      } else {
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
        await this.saveBeneficiary(
          senderAccount.user_id,
          senderAccount.tenant_id,
          request,
          accountVerification,
          client
        );
      }

    } catch (error) {
      console.error('NIBSS transfer processing error:', error);

      // Mark transfer as failed and reverse
      await client.query(`
        UPDATE transfers
        SET status = 'failed', failure_reason = $1, updated_at = NOW()
        WHERE id = $2
      `, ['NIBSS processing error', transferId]);

      await this.reverseFailedTransfer(transferId, senderAccount, client);
    } finally {
      client.release();
    }
  }

  /**
   * Reverse failed transfer
   */
  private async reverseFailedTransfer(
    transferId: string,
    senderAccount: any,
    client: any
  ): Promise<void> {
    // Get transfer details
    const transferResult = await client.query(
      'SELECT total_amount FROM transfers WHERE id = $1',
      [transferId]
    );

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
        uuidv4(),
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
  private async saveBeneficiary(
    userId: string,
    tenantId: string,
    request: ExternalTransferRequest,
    accountVerification: any,
    client: any
  ): Promise<void> {
    try {
      await client.query(`
        INSERT INTO tenant.beneficiaries (
          id, tenant_id, user_id, name, account_number, bank_code, bank_name,
          nickname, is_frequent, total_transfers, last_used, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), NOW())
        ON CONFLICT (tenant_id, user_id, account_number, bank_code)
        DO UPDATE SET total_transfers = beneficiaries.total_transfers + 1, last_used = NOW()
      `, [
        uuidv4(),
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
    } catch (error) {
      console.error('Failed to save beneficiary:', error);
    }
  }

  /**
   * Get bank name by code
   */
  private async getBankName(bankCode: string): Promise<string> {
    try {
      const result = await this.db.query(
        'SELECT name FROM banks WHERE code = $1 AND is_active = true',
        [bankCode]
      );

      return result.rows[0]?.name || 'Unknown Bank';
    } catch (error) {
      return 'Unknown Bank';
    }
  }

  /**
   * Calculate transfer fee
   */
  private async calculateTransferFee(amount: number, bankCode: string): Promise<number> {
    // NIBSS standard fee structure
    const nibssFee = 52.50; // Standard NIBSS fee

    // Additional bank-specific fees could be added here
    try {
      const result = await this.db.query(
        'SELECT transfer_fee FROM banks WHERE code = $1',
        [bankCode]
      );

      if (result.rows.length > 0) {
        return result.rows[0].transfer_fee || nibssFee;
      }
    } catch (error) {
      console.error('Error fetching bank fee:', error);
    }

    return nibssFee;
  }

  /**
   * Validate transfer request
   */
  private async validateTransferRequest(
    request: ExternalTransferRequest,
    userId: string,
    client: any
  ): Promise<void> {
    if (!request.recipientName?.trim()) {
      throw new ValidationError('Recipient name is required', 'recipientName');
    }

    if (!request.recipientAccountNumber?.trim()) {
      throw new ValidationError('Recipient account number is required', 'recipientAccountNumber');
    }

    if (request.recipientAccountNumber.length !== 10) {
      throw new ValidationError('Account number must be 10 digits', 'recipientAccountNumber');
    }

    if (!request.recipientBankCode?.trim()) {
      throw new ValidationError('Recipient bank code is required', 'recipientBankCode');
    }

    if (!request.amount || request.amount <= 0) {
      throw new ValidationError('Invalid transfer amount', 'amount');
    }

    if (request.amount < 100) {
      throw new ValidationError('Minimum transfer amount is ₦100', 'amount');
    }

    if (request.amount > 1000000) {
      throw new ValidationError('Maximum transfer amount is ₦1,000,000', 'amount');
    }

    if (!request.pin?.trim()) {
      throw new ValidationError('Transaction PIN is required', 'pin');
    }

    if (request.pin.length !== 4) {
      throw new ValidationError('PIN must be 4 digits', 'pin');
    }

    // Verify PIN
    const pinResult = await client.query(
      'SELECT id FROM tenant.users WHERE id = $1 AND transaction_pin = $2',
      [userId, request.pin]
    );

    if (pinResult.rows.length === 0) {
      throw new ValidationError('Invalid transaction PIN', 'pin');
    }
  }

  /**
   * Get sender account details
   */
  private async getSenderAccount(accountId: string, client: any): Promise<any> {
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
  private async checkTransferLimits(
    accountId: string,
    amount: number,
    client: any
  ): Promise<void> {
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
      throw new LimitExceededError('Daily', dailyLimit, dailyUsed + amount);
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
      throw new LimitExceededError('Monthly', monthlyLimit, monthlyUsed + amount);
    }
  }

  /**
   * Get transfer status
   */
  async getTransferStatus(transferId: string): Promise<any> {
    const result = await this.db.query(`
      SELECT * FROM transfers WHERE id = $1
    `, [transferId]);

    return result.rows[0];
  }

  /**
   * Get transfer history
   */
  async getTransferHistory(accountId: string, limit: number = 50): Promise<any[]> {
    const result = await this.db.query(`
      SELECT * FROM transfers
      WHERE sender_account_id = $1 AND type = 'external'
      ORDER BY created_at DESC
      LIMIT $2
    `, [accountId, limit]);

    return result.rows;
  }
}

export default ExternalTransferService;