/**
 * NIBSS Payment Provider
 *
 * Nigeria Inter-Bank Settlement System (NIBSS) implementation
 * Supports:
 * - NIP (NIBSS Instant Payment)
 * - Account name verification
 * - Nigerian bank transfers
 */

import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import {
  BasePaymentProvider,
  AccountValidationRequest,
  AccountValidationResult,
  TransferRequest,
  TransferResponse,
  TransferStatusRequest,
  TransferStatusResponse,
  BankListRequest,
  BankInfo,
  TransferLimits,
  ProviderCapabilities
} from './IPaymentProvider';

interface NIBSSConfig {
  baseUrl: string;
  organizationCode: string;
  apiKey: string;
  secretKey: string;
  environment: 'sandbox' | 'production';
}

interface NIBSSAccountEnquiryResponse {
  ResponseCode: string;
  AccountNumber: string;
  AccountName: string;
  BankCode: string;
  SessionID: string;
}

interface NIBSSTransferResponse {
  ResponseCode: string;
  TransactionReference: string;
  SessionID: string;
  ResponseDescription: string;
}

export class NIBSSProvider extends BasePaymentProvider {
  readonly name = 'NIBSS';
  readonly region = 'Nigeria';
  readonly capabilities: ProviderCapabilities = {
    supportsAccountValidation: true,
    supportsInstantTransfer: true,
    supportsScheduledTransfer: false,
    supportsInternationalTransfer: false,
    supportedCurrencies: ['NGN'],
    supportedCountries: ['NG'],
    averageProcessingTime: 'instant'
  };

  private client: AxiosInstance | null = null;
  private nibssConfig: NIBSSConfig | null = null;

  async initialize(config: Record<string, any>): Promise<void> {
    await super.initialize(config);

    this.nibssConfig = {
      baseUrl: config.baseUrl || process.env.NIBSS_BASE_URL || 'https://api.nibss-plc.com.ng',
      organizationCode: config.organizationCode || process.env.NIBSS_ORG_CODE || '',
      apiKey: config.apiKey || process.env.NIBSS_API_KEY || '',
      secretKey: config.secretKey || process.env.NIBSS_SECRET_KEY || '',
      environment: config.environment || 'sandbox'
    };

    this.client = axios.create({
      baseURL: this.nibssConfig.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'OrganizationCode': this.nibssConfig.organizationCode
      }
    });
  }

  /**
   * Validate Nigerian bank account using NIBSS Name Enquiry
   */
  async validateAccount(request: AccountValidationRequest): Promise<AccountValidationResult> {
    this.ensureInitialized();

    try {
      if (!this.client || !this.nibssConfig) {
        throw new Error('NIBSS client not initialized');
      }

      // Nigerian account numbers are 10 digits
      if (request.accountNumber.length !== 10) {
        return {
          isValid: false,
          errorMessage: 'Nigerian account numbers must be 10 digits',
          errorCode: 'INVALID_LENGTH'
        };
      }

      const payload = {
        AccountNumber: request.accountNumber,
        DestinationInstitutionCode: request.bankCode,
        ChannelCode: '6' // Web channel
      };

      const signature = this.generateSignature(payload);

      const response = await this.client.post<NIBSSAccountEnquiryResponse>(
        '/nip/nameenquiry',
        payload,
        {
          headers: {
            'Signature': signature,
            'SignatureMethod': 'SHA512'
          }
        }
      );

      if (response.data.ResponseCode === '00') {
        return {
          isValid: true,
          accountName: response.data.AccountName,
          accountNumber: response.data.AccountNumber,
          bankName: this.getBankName(request.bankCode)
        };
      } else {
        return {
          isValid: false,
          errorMessage: 'Account validation failed',
          errorCode: response.data.ResponseCode
        };
      }
    } catch (error: any) {
      return {
        isValid: false,
        errorMessage: error.message || 'Account validation error',
        errorCode: 'NIBSS_ERROR'
      };
    }
  }

  /**
   * Initiate NIBSS Instant Payment (NIP) transfer
   */
  async initiateTransfer(request: TransferRequest): Promise<TransferResponse> {
    this.ensureInitialized();

    try {
      if (!this.client || !this.nibssConfig) {
        throw new Error('NIBSS client not initialized');
      }

      // Validate currency
      if (request.currency !== 'NGN') {
        return {
          success: false,
          transactionReference: request.reference,
          status: 'failed',
          message: 'NIBSS only supports NGN currency',
          errorCode: 'INVALID_CURRENCY'
        };
      }

      const fee = await this.calculateFee(request.amount, request.currency, request.transferType);
      const totalAmount = request.amount + fee;

      const payload = {
        FromAccount: request.fromAccountNumber,
        ToAccount: request.toAccountNumber,
        Amount: request.amount,
        Currency: '566', // NGN currency code
        DestinationInstitutionCode: request.toBankCode,
        OriginatorInstitutionCode: request.fromBankCode || this.nibssConfig.organizationCode,
        Narration: request.narration.substring(0, 30), // NIBSS limits narration to 30 chars
        TransactionReference: request.reference,
        BeneficiaryName: request.toAccountName,
        OriginatorName: request.fromAccountName,
        ChannelCode: '6' // Web channel
      };

      const signature = this.generateSignature(payload);

      const response = await this.client.post<NIBSSTransferResponse>(
        '/nip/fundsTransfer',
        payload,
        {
          headers: {
            'Signature': signature,
            'SignatureMethod': 'SHA512'
          }
        }
      );

      if (response.data.ResponseCode === '00') {
        return {
          success: true,
          transactionReference: request.reference,
          providerReference: response.data.SessionID,
          status: 'completed',
          message: 'Transfer successful',
          fee,
          totalAmount
        };
      } else {
        return {
          success: false,
          transactionReference: request.reference,
          providerReference: response.data.SessionID,
          status: 'failed',
          message: response.data.ResponseDescription || 'Transfer failed',
          errorCode: response.data.ResponseCode
        };
      }
    } catch (error: any) {
      return {
        success: false,
        transactionReference: request.reference,
        status: 'failed',
        message: error.message || 'Transfer error',
        errorCode: 'NIBSS_ERROR'
      };
    }
  }

  /**
   * Get transfer status from NIBSS
   */
  async getTransferStatus(request: TransferStatusRequest): Promise<TransferStatusResponse> {
    this.ensureInitialized();

    // NIBSS doesn't provide a direct status check API
    // Status is determined immediately during transfer
    return {
      transactionReference: request.transactionReference,
      providerReference: request.providerReference,
      status: 'completed',
      metadata: {
        note: 'NIBSS transfers are instant, status determined at transfer time'
      }
    };
  }

  /**
   * Get list of Nigerian banks from NIBSS
   */
  async getBankList(request?: BankListRequest): Promise<BankInfo[]> {
    // Static list of major Nigerian banks
    // In production, this would be fetched from NIBSS API
    return [
      {
        bankCode: '058',
        bankName: 'Guaranty Trust Bank (GTBank)',
        bankCodeType: 'NIBSS',
        country: 'NG',
        currency: 'NGN',
        swiftCode: 'GTBINGLA',
        active: true
      },
      {
        bankCode: '033',
        bankName: 'United Bank for Africa (UBA)',
        bankCodeType: 'NIBSS',
        country: 'NG',
        currency: 'NGN',
        swiftCode: 'UNAFNGLA',
        active: true
      },
      {
        bankCode: '011',
        bankName: 'First Bank of Nigeria',
        bankCodeType: 'NIBSS',
        country: 'NG',
        currency: 'NGN',
        swiftCode: 'FBNINGLA',
        active: true
      },
      {
        bankCode: '044',
        bankName: 'Access Bank',
        bankCodeType: 'NIBSS',
        country: 'NG',
        currency: 'NGN',
        swiftCode: 'ABNGNGLA',
        active: true
      },
      {
        bankCode: '057',
        bankName: 'Zenith Bank',
        bankCodeType: 'NIBSS',
        country: 'NG',
        currency: 'NGN',
        swiftCode: 'ZEIBNGLA',
        active: true
      },
      {
        bankCode: '214',
        bankName: 'First City Monument Bank (FCMB)',
        bankCodeType: 'NIBSS',
        country: 'NG',
        currency: 'NGN',
        swiftCode: 'FCMBNGLA',
        active: true
      },
      {
        bankCode: '035',
        bankName: 'Wema Bank',
        bankCodeType: 'NIBSS',
        country: 'NG',
        currency: 'NGN',
        swiftCode: 'WEMANGLA',
        active: true
      },
      {
        bankCode: '232',
        bankName: 'Sterling Bank',
        bankCodeType: 'NIBSS',
        country: 'NG',
        currency: 'NGN',
        swiftCode: 'NAMENGLA',
        active: true
      }
    ];
  }

  /**
   * Get NIBSS transfer limits
   */
  async getTransferLimits(currency: string): Promise<TransferLimits> {
    if (currency !== 'NGN') {
      throw new Error('NIBSS only supports NGN currency');
    }

    // CBN-mandated NIP limits
    return {
      minAmount: 100,
      maxAmount: 10000000, // ₦10M per transaction
      dailyLimit: 50000000, // ₦50M per day
      monthlyLimit: 200000000, // ₦200M per month
      currency: 'NGN'
    };
  }

  /**
   * Calculate NIBSS transfer fee
   * Based on CBN fee structure
   */
  async calculateFee(amount: number, currency: string, transferType: string): Promise<number> {
    if (currency !== 'NGN') {
      throw new Error('NIBSS only supports NGN currency');
    }

    // CBN NIP fee structure
    if (amount <= 5000) {
      return 10.75;
    } else if (amount <= 50000) {
      return 26.88;
    } else {
      return 53.75;
    }
  }

  /**
   * Generate NIBSS request signature
   */
  private generateSignature(payload: any): string {
    if (!this.nibssConfig) {
      throw new Error('NIBSS config not initialized');
    }

    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha512', this.nibssConfig.secretKey)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Get bank name from bank code
   */
  private getBankName(bankCode: string): string {
    const bankMap: Record<string, string> = {
      '058': 'GTBank',
      '033': 'UBA',
      '011': 'First Bank',
      '044': 'Access Bank',
      '057': 'Zenith Bank',
      '214': 'FCMB',
      '035': 'Wema Bank',
      '232': 'Sterling Bank'
    };
    return bankMap[bankCode] || 'Unknown Bank';
  }
}
