/**
 * Banking Type Definitions
 * Shared types for banking operations across the application
 */

/**
 * Bank entity representing a financial institution
 */
export interface Bank {
  /** 3-digit bank code (e.g., "044" for Access Bank) */
  code: string;

  /** Full bank name (e.g., "Access Bank Plc") */
  name: string;

  /** URL-friendly bank identifier (optional) */
  slug?: string;

  /** Extended bank code for NIBSS (optional) */
  longCode?: string;

  /** Whether bank is active and available for transactions */
  active?: boolean;
}

/**
 * Bank selection result from API
 */
export interface BankListResponse {
  success: boolean;
  banks: Bank[];
  error?: string;
}

/**
 * Transfer recipient information
 */
export interface TransferRecipient {
  /** Recipient account number (10 digits) */
  accountNumber: string;

  /** Recipient account name (from bank inquiry) */
  accountName?: string;

  /** Recipient bank */
  bank: Bank;

  /** Optional nickname for saved recipients */
  nickname?: string;
}

/**
 * Transfer form data structure
 */
export interface TransferFormData {
  /** Recipient details */
  recipient: TransferRecipient;

  /** Transfer amount in Naira */
  amount: number;

  /** Transfer description/narration */
  description: string;

  /** Transaction PIN for authorization */
  pin: string;
}

/**
 * Account inquiry result
 */
export interface AccountInquiryResult {
  /** Whether account inquiry was successful */
  isValid: boolean;

  /** Account holder name (if valid) */
  accountName?: string;

  /** Bank name (if valid) */
  bankName?: string;

  /** Error message (if invalid) */
  error?: string;
}

/**
 * Transfer validation rules
 */
export interface TransferValidationRules {
  /** Minimum transfer amount */
  minAmount: number;

  /** Maximum transfer amount */
  maxAmount: number;

  /** Maximum transfers per day */
  dailyLimit: number;

  /** Maximum monthly transfer volume */
  monthlyLimit: number;
}