/**
 * Transfer Service Integration Layer
 * Connects React Native + React Web frontend to backend transfer services
 */

import APIService from './api';
import {
  TransferRequest,
  TransferResponse,
  TransferRecord,
  TransferLimits,
  Beneficiary,
  Bank,
  UserAccount,
  InternalTransferRequest,
  ExternalTransferRequest,
  BillPaymentRequest,
  InternationalTransferRequest,
  TransferService as ITransferService,
  TransferError,
  ValidationError,
  InsufficientFundsError,
  LimitExceededError,
  OTPRequest,
  OTPResponse,
  BulkTransferRequest,
} from '../types/transfers';

class TransferService implements ITransferService {
  private baseUrl = '/api/transfers';

  /**
   * Initiate a transfer of any type
   */
  async initiateTransfer(request: TransferRequest): Promise<TransferResponse> {
    try {
      // Route to appropriate endpoint based on transfer type
      let endpoint = '';
      let payload: any = request;

      switch (request.type) {
        case 'internal':
          endpoint = `${this.baseUrl}/internal`;
          break;
        case 'external':
          endpoint = `${this.baseUrl}/external`;
          break;
        case 'bill_payment':
          endpoint = `${this.baseUrl}/bills`;
          break;
        case 'international':
          endpoint = `${this.baseUrl}/international`;
          break;
        default:
          throw new ValidationError('Invalid transfer type', 'type');
      }

      const response = await APIService.makeRequest('POST', endpoint, payload);

      if (!response.success) {
        throw new TransferError(
          response.message || 'Transfer failed',
          response.code || 'TRANSFER_FAILED',
          response.data
        );
      }

      return {
        id: response.data.id,
        reference: response.data.reference,
        status: response.data.status,
        amount: response.data.amount,
        fees: response.data.fees,
        totalAmount: response.data.totalAmount,
        recipient: response.data.recipient,
        scheduledDate: response.data.scheduledDate ? new Date(response.data.scheduledDate) : undefined,
        processedAt: response.data.processedAt ? new Date(response.data.processedAt) : undefined,
        message: response.message,
      };
    } catch (error: any) {
      if (error instanceof TransferError) {
        throw error;
      }

      // Handle specific error types
      if (error.message?.includes('insufficient')) {
        throw new InsufficientFundsError(0, request.amount);
      }

      if (error.message?.includes('limit')) {
        throw new LimitExceededError(0, request.amount, 'transaction');
      }

      throw new TransferError(
        error.message || 'Transfer failed',
        'UNKNOWN_ERROR',
        error
      );
    }
  }

  /**
   * Get transfer history for an account
   */
  async getTransferHistory(
    accountId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<TransferRecord[]> {
    try {
      const response = await APIService.makeRequest('GET', `${this.baseUrl}/history`, {
        accountId,
        page,
        limit,
      });

      if (!response.success) {
        throw new TransferError(response.message || 'Failed to fetch transfer history', 'FETCH_FAILED');
      }

      return response.data.map((record: any) => ({
        id: record.id,
        reference: record.reference,
        type: record.type,
        status: record.status,
        amount: record.amount,
        fees: record.fees,
        description: record.description,
        recipient: record.recipient,
        sender: record.sender,
        createdAt: new Date(record.createdAt),
        processedAt: record.processedAt ? new Date(record.processedAt) : undefined,
        scheduledDate: record.scheduledDate ? new Date(record.scheduledDate) : undefined,
        failureReason: record.failureReason,
      }));
    } catch (error: any) {
      throw new TransferError(
        error.message || 'Failed to fetch transfer history',
        'FETCH_FAILED',
        error
      );
    }
  }

  /**
   * Get details of a specific transfer
   */
  async getTransferDetails(transferId: string): Promise<TransferRecord> {
    try {
      const response = await APIService.makeRequest('GET', `${this.baseUrl}/${transferId}`);

      if (!response.success) {
        throw new TransferError(response.message || 'Transfer not found', 'NOT_FOUND');
      }

      const record = response.data;
      return {
        id: record.id,
        reference: record.reference,
        type: record.type,
        status: record.status,
        amount: record.amount,
        fees: record.fees,
        description: record.description,
        recipient: record.recipient,
        sender: record.sender,
        createdAt: new Date(record.createdAt),
        processedAt: record.processedAt ? new Date(record.processedAt) : undefined,
        scheduledDate: record.scheduledDate ? new Date(record.scheduledDate) : undefined,
        failureReason: record.failureReason,
      };
    } catch (error: any) {
      throw new TransferError(
        error.message || 'Failed to fetch transfer details',
        'FETCH_FAILED',
        error
      );
    }
  }

  /**
   * Cancel a pending or scheduled transfer
   */
  async cancelTransfer(transferId: string): Promise<boolean> {
    try {
      const response = await APIService.makeRequest('POST', `${this.baseUrl}/${transferId}/cancel`);
      return response.success;
    } catch (error: any) {
      throw new TransferError(
        error.message || 'Failed to cancel transfer',
        'CANCEL_FAILED',
        error
      );
    }
  }

  /**
   * Get user's saved beneficiaries
   */
  async getBeneficiaries(userId: string): Promise<Beneficiary[]> {
    try {
      const response = await APIService.makeRequest('GET', '/api/beneficiaries', { userId });

      if (!response.success) {
        throw new TransferError(response.message || 'Failed to fetch beneficiaries', 'FETCH_FAILED');
      }

      return response.data.map((beneficiary: any) => ({
        id: beneficiary.id,
        name: beneficiary.name,
        accountNumber: beneficiary.accountNumber,
        bankCode: beneficiary.bankCode,
        bankName: beneficiary.bankName,
        nickname: beneficiary.nickname,
        isFrequent: beneficiary.isFrequent,
        lastUsed: new Date(beneficiary.lastUsed),
        totalTransfers: beneficiary.totalTransfers,
      }));
    } catch (error: any) {
      throw new TransferError(
        error.message || 'Failed to fetch beneficiaries',
        'FETCH_FAILED',
        error
      );
    }
  }

  /**
   * Add a new beneficiary
   */
  async addBeneficiary(
    beneficiary: Omit<Beneficiary, 'id' | 'totalTransfers' | 'lastUsed'>
  ): Promise<Beneficiary> {
    try {
      const response = await APIService.makeRequest('POST', '/api/beneficiaries', beneficiary);

      if (!response.success) {
        throw new TransferError(response.message || 'Failed to add beneficiary', 'ADD_FAILED');
      }

      const newBeneficiary = response.data;
      return {
        id: newBeneficiary.id,
        name: newBeneficiary.name,
        accountNumber: newBeneficiary.accountNumber,
        bankCode: newBeneficiary.bankCode,
        bankName: newBeneficiary.bankName,
        nickname: newBeneficiary.nickname,
        isFrequent: newBeneficiary.isFrequent,
        lastUsed: new Date(newBeneficiary.lastUsed),
        totalTransfers: newBeneficiary.totalTransfers,
      };
    } catch (error: any) {
      throw new TransferError(
        error.message || 'Failed to add beneficiary',
        'ADD_FAILED',
        error
      );
    }
  }

  /**
   * Delete a beneficiary
   */
  async deleteBeneficiary(beneficiaryId: string): Promise<boolean> {
    try {
      const response = await APIService.makeRequest('DELETE', `/api/beneficiaries/${beneficiaryId}`);
      return response.success;
    } catch (error: any) {
      throw new TransferError(
        error.message || 'Failed to delete beneficiary',
        'DELETE_FAILED',
        error
      );
    }
  }

  /**
   * Get transfer limits for an account
   */
  async getTransferLimits(accountId: string): Promise<TransferLimits> {
    try {
      const response = await APIService.makeRequest('GET', `/api/accounts/${accountId}/limits`);

      if (!response.success) {
        throw new TransferError(response.message || 'Failed to fetch transfer limits', 'FETCH_FAILED');
      }

      return {
        daily: response.data.daily,
        monthly: response.data.monthly,
        perTransaction: response.data.perTransaction,
        currency: response.data.currency,
      };
    } catch (error: any) {
      throw new TransferError(
        error.message || 'Failed to fetch transfer limits',
        'FETCH_FAILED',
        error
      );
    }
  }

  /**
   * Validate recipient account
   */
  async validateRecipient(
    accountNumber: string,
    bankCode: string
  ): Promise<{ isValid: boolean; accountName?: string; bankName?: string }> {
    try {
      const response = await APIService.makeRequest('POST', '/api/validation/account', {
        accountNumber,
        bankCode,
      });

      return {
        isValid: response.success,
        accountName: response.data?.accountName,
        bankName: response.data?.bankName,
      };
    } catch (error: any) {
      return {
        isValid: false,
      };
    }
  }

  /**
   * Request OTP for transfer verification
   */
  async requestOTP(transferId: string): Promise<boolean> {
    try {
      const response = await APIService.makeRequest('POST', `${this.baseUrl}/${transferId}/otp`);
      return response.success;
    } catch (error: any) {
      throw new TransferError(
        error.message || 'Failed to request OTP',
        'OTP_REQUEST_FAILED',
        error
      );
    }
  }

  /**
   * Verify OTP for transfer
   */
  async verifyOTP(request: OTPRequest): Promise<OTPResponse> {
    try {
      const response = await APIService.makeRequest('POST', `${this.baseUrl}/${request.transferId}/verify-otp`, {
        otpCode: request.otpCode,
      });

      return {
        isValid: response.success,
        message: response.message,
        attemptsRemaining: response.data?.attemptsRemaining,
      };
    } catch (error: any) {
      return {
        isValid: false,
        message: error.message || 'OTP verification failed',
        attemptsRemaining: error.data?.attemptsRemaining,
      };
    }
  }

  /**
   * Get user accounts
   */
  async getUserAccounts(userId: string): Promise<UserAccount[]> {
    try {
      const response = await APIService.makeRequest('GET', '/api/accounts', { userId });

      if (!response.success) {
        throw new TransferError(response.message || 'Failed to fetch accounts', 'FETCH_FAILED');
      }

      return response.data.map((account: any) => ({
        id: account.id,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        balance: account.balance,
        accountType: account.accountType,
        currency: account.currency,
        isDefault: account.isDefault,
      }));
    } catch (error: any) {
      throw new TransferError(
        error.message || 'Failed to fetch accounts',
        'FETCH_FAILED',
        error
      );
    }
  }

  /**
   * Get list of supported banks
   */
  async getBanks(): Promise<Bank[]> {
    try {
      const response = await APIService.makeRequest('GET', '/api/banks');

      if (!response.success) {
        throw new TransferError(response.message || 'Failed to fetch banks', 'FETCH_FAILED');
      }

      return response.data.map((bank: any) => ({
        code: bank.code,
        name: bank.name,
        sortCode: bank.sortCode,
        logo: bank.logo,
        isActive: bank.isActive,
        transferFee: bank.transferFee,
        maxTransferLimit: bank.maxTransferLimit,
      }));
    } catch (error: any) {
      throw new TransferError(
        error.message || 'Failed to fetch banks',
        'FETCH_FAILED',
        error
      );
    }
  }

  /**
   * Process bulk transfers
   */
  async processBulkTransfer(request: BulkTransferRequest): Promise<TransferResponse[]> {
    try {
      const response = await APIService.makeRequest('POST', `${this.baseUrl}/bulk`, request);

      if (!response.success) {
        throw new TransferError(response.message || 'Bulk transfer failed', 'BULK_TRANSFER_FAILED');
      }

      return response.data.map((transfer: any) => ({
        id: transfer.id,
        reference: transfer.reference,
        status: transfer.status,
        amount: transfer.amount,
        fees: transfer.fees,
        totalAmount: transfer.totalAmount,
        recipient: transfer.recipient,
        scheduledDate: transfer.scheduledDate ? new Date(transfer.scheduledDate) : undefined,
        processedAt: transfer.processedAt ? new Date(transfer.processedAt) : undefined,
        message: transfer.message,
      }));
    } catch (error: any) {
      throw new TransferError(
        error.message || 'Bulk transfer failed',
        'BULK_TRANSFER_FAILED',
        error
      );
    }
  }

  /**
   * Get transaction fees for a transfer
   */
  async getTransferFees(
    transferType: string,
    amount: number,
    bankCode?: string
  ): Promise<{ fee: number; totalAmount: number }> {
    try {
      const response = await APIService.makeRequest('GET', '/api/fees/calculate', {
        type: transferType,
        amount,
        bankCode,
      });

      if (!response.success) {
        throw new TransferError(response.message || 'Failed to calculate fees', 'FEE_CALCULATION_FAILED');
      }

      return {
        fee: response.data.fee,
        totalAmount: response.data.totalAmount,
      };
    } catch (error: any) {
      // Return default fees if calculation fails
      let defaultFee = 0;

      switch (transferType) {
        case 'internal':
          defaultFee = 0;
          break;
        case 'external':
          defaultFee = 52.50;
          break;
        case 'bill_payment':
          defaultFee = 50;
          break;
        case 'international':
          defaultFee = 2500;
          break;
      }

      return {
        fee: defaultFee,
        totalAmount: amount + defaultFee,
      };
    }
  }
}

// Export singleton instance
export const transferService = new TransferService();
export default transferService;