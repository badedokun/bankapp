/**
 * Conversational Transfer Service
 * Handles step-by-step transfer flow through AI chat
 */

import dbManager from '../../config/multi-tenant-database';
import conversationStateManager from './ConversationStateManager';
import bcrypt from 'bcrypt';
import { generateTransferRef } from '../../utils/referenceGenerator';

interface TransferStep {
  step: number;
  field: string;
  question: string;
  validation?: (value: string) => { valid: boolean; error?: string };
  process?: (value: string, userId: string) => Promise<any>;
}

export interface ConversationalResponse {
  message: string;
  suggestions?: string[];
  data?: any;
  completed?: boolean;
  error?: boolean;
}

export class ConversationalTransferService {
  private static readonly NIGERIAN_BANKS = [
    { code: '000013', name: 'Access Bank' },
    { code: '000014', name: 'Afribank Nigeria Plc' },
    { code: '000005', name: 'Diamond Bank' },
    { code: '000010', name: 'Ecobank Nigeria' },
    { code: '000007', name: 'Fidelity Bank' },
    { code: '000016', name: 'First Bank of Nigeria' },
    { code: '000011', name: 'First City Monument Bank' },
    { code: '000003', name: 'Firstmidas Microfinance Bank' },
    { code: '000008', name: 'GTBank Plc' },
    { code: '000012', name: 'Polaris Bank' },
    { code: '000020', name: 'Sterling Bank' },
    { code: '000004', name: 'United Bank for Africa' },
    { code: '000018', name: 'Union Bank of Nigeria' },
    { code: '000017', name: 'Unity Bank Plc' },
    { code: '000015', name: 'Wema Bank Plc' },
    { code: '000009', name: 'Zenith Bank' },
  ];

  private static readonly TRANSFER_STEPS: TransferStep[] = [
    {
      step: 1,
      field: 'amount',
      question: 'Great! Let\'s start your transfer.\n\nHow much would you like to send?',
      validation: (value: string) => {
        const amount = parseFloat(value.replace(/[₦,]/g, ''));
        if (isNaN(amount) || amount <= 0) {
          return { valid: false, error: 'Please enter a valid amount (e.g., 5000 or ₦5,000)' };
        }
        if (amount > 10000000) {
          return { valid: false, error: 'Maximum transfer amount is ₦10,000,000' };
        }
        return { valid: true };
      }
    },
    {
      step: 2,
      field: 'accountNumber',
      question: 'Please enter the recipient\'s account number (10 digits):',
      validation: (value: string) => {
        const cleaned = value.replace(/\s/g, '');
        if (!/^\d{10}$/.test(cleaned)) {
          return { valid: false, error: 'Please enter a valid 10-digit account number' };
        }
        return { valid: true };
      }
    },
    {
      step: 3,
      field: 'bankCode',
      question: 'Which bank is the recipient\'s account with?',
      validation: (value: string) => {
        const bank = ConversationalTransferService.NIGERIAN_BANKS.find(
          b => b.name.toLowerCase().includes(value.toLowerCase()) || b.code === value
        );
        if (!bank) {
          return { valid: false, error: 'Bank not found. Please select from the suggested banks.' };
        }
        return { valid: true };
      }
    },
    {
      step: 4,
      field: 'accountName',
      question: 'Verifying account details...',
      process: async (accountNumber: string, userId: string) => {
        // In production, this would call NIBSS Name Enquiry
        // For now, return a simulated name
        return {
          accountName: 'John Doe', // This would come from NIBSS API
          verified: true
        };
      }
    },
    {
      step: 5,
      field: 'description',
      question: 'Would you like to add a description? (Optional - press Enter to skip)',
      validation: () => ({ valid: true }) // Always valid, optional field
    },
    {
      step: 6,
      field: 'pin',
      question: 'Please enter your 4-digit transaction PIN to complete the transfer:',
      validation: (value: string) => {
        if (!/^\d{4}$/.test(value)) {
          return { valid: false, error: 'PIN must be exactly 4 digits' };
        }
        return { valid: true };
      }
    }
  ];

  /**
   * Process message in conversational transfer flow
   */
  static async processTransferConversation(
    message: string,
    userId: string,
    conversationId: string,
    tenantId: string
  ): Promise<ConversationalResponse> {
    try {
      const state = conversationStateManager.getState(userId, conversationId);

      // Check if starting new transfer
      if (!state.currentFlow || state.currentFlow !== 'transfer') {
        // Initialize transfer flow
        conversationStateManager.updateState(userId, conversationId, {
          currentFlow: 'transfer',
          step: 1,
          data: {}
        });

        return {
          message: this.TRANSFER_STEPS[0].question,
          suggestions: ['₦5,000', '₦10,000', '₦50,000', 'Cancel']
        };
      }

      // Handle cancellation
      if (message.toLowerCase().includes('cancel')) {
        conversationStateManager.clearState(userId, conversationId);
        return {
          message: 'Transfer cancelled. How else can I help you?',
          suggestions: ['Check balance', 'View transactions', 'Start new transfer']
        };
      }

      // Get current step
      const currentStep = this.TRANSFER_STEPS[state.step - 1];

      if (!currentStep) {
        // All steps completed, execute transfer
        return await this.executeTransfer(userId, conversationId, state.data, tenantId);
      }

      // Validate current input
      if (currentStep.validation) {
        const validation = currentStep.validation(message);
        if (!validation.valid) {
          return {
            message: `${validation.error}\n\n${currentStep.question}`,
            error: true
          };
        }
      }

      // Process and store the value
      let processedValue: any = message;

      if (currentStep.field === 'amount') {
        processedValue = parseFloat(message.replace(/[₦,]/g, ''));
      } else if (currentStep.field === 'accountNumber') {
        processedValue = message.replace(/\s/g, '');
      } else if (currentStep.field === 'bankCode') {
        const bank = this.NIGERIAN_BANKS.find(
          b => b.name.toLowerCase().includes(message.toLowerCase()) || b.code === message
        );
        processedValue = bank?.code;
        conversationStateManager.setData(userId, conversationId, 'bankName', bank?.name);
      } else if (currentStep.field === 'description' && !message.trim()) {
        processedValue = 'Transfer from OrokiiPay';
      }

      conversationStateManager.setData(userId, conversationId, currentStep.field, processedValue);

      // Special handling for PIN - validate before advancing
      if (currentStep.field === 'pin') {
        const pinValid = await this.verifyPIN(userId, processedValue, tenantId);
        if (!pinValid) {
          return {
            message: 'Incorrect PIN. Please try again:',
            error: true,
            suggestions: ['Cancel transfer']
          };
        }
      }

      // Move to next step
      conversationStateManager.nextStep(userId, conversationId);
      const updatedState = conversationStateManager.getState(userId, conversationId);
      const nextStep = this.TRANSFER_STEPS[updatedState.step - 1]; // Use updated state

      if (!nextStep) {
        // All steps completed
        return await this.executeTransfer(userId, conversationId, updatedState.data, tenantId);
      }

      // Special handling for account name verification
      if (nextStep.field === 'accountName' && nextStep.process) {
        const accountNumber = conversationStateManager.getData(userId, conversationId, 'accountNumber');
        const result = await nextStep.process(accountNumber, userId);

        conversationStateManager.setData(userId, conversationId, 'accountName', result.accountName);
        conversationStateManager.nextStep(userId, conversationId);
        const afterVerificationState = conversationStateManager.getState(userId, conversationId);
        const descriptionStep = this.TRANSFER_STEPS[afterVerificationState.step - 1];

        const confirmationMessage = `✅ Account verified!\n\n` +
          `Recipient: ${result.accountName}\n` +
          `Account: ${accountNumber}\n` +
          `Bank: ${conversationStateManager.getData(userId, conversationId, 'bankName')}\n` +
          `Amount: ₦${conversationStateManager.getData(userId, conversationId, 'amount').toLocaleString()}\n\n` +
          `${descriptionStep.question}`;

        return {
          message: confirmationMessage,
          suggestions: ['Skip description']
        };
      }

      // Return next question
      let suggestions: string[] | undefined;
      if (nextStep.field === 'bankCode') {
        suggestions = this.NIGERIAN_BANKS.slice(0, 6).map(b => b.name);
        suggestions.push('Show more banks');
      } else if (nextStep.field === 'description') {
        suggestions = ['Skip'];
      }

      return {
        message: nextStep.question,
        suggestions
      };

    } catch (error) {
      console.error('Error in conversational transfer:', error);
      conversationStateManager.clearState(userId, conversationId);
      return {
        message: 'I encountered an error processing your transfer. Please try again.',
        error: true,
        suggestions: ['Start new transfer', 'Check balance']
      };
    }
  }

  /**
   * Execute the transfer with collected information
   */
  private static async executeTransfer(
    userId: string,
    conversationId: string,
    data: Record<string, any>,
    tenantId: string
  ): Promise<ConversationalResponse> {
    try {
      // PIN already validated in the step processing
      // Check balance
      const hasBalance = await this.checkBalance(userId, data.amount, tenantId);
      if (!hasBalance) {
        conversationStateManager.clearState(userId, conversationId);
        return {
          message: 'Insufficient balance for this transfer.',
          error: true,
          suggestions: ['Check balance', 'Fund account']
        };
      }

      // Create transfer record
      const transferResult = await this.createTransfer(userId, data, tenantId);

      // Clear conversation state
      conversationStateManager.clearState(userId, conversationId);

      if (transferResult.success) {
        return {
          message: `✅ Transfer Successful!\n\n` +
            `Amount: ₦${data.amount.toLocaleString()}\n` +
            `Recipient: ${data.accountName}\n` +
            `Account: ${data.accountNumber}\n` +
            `Bank: ${data.bankName}\n` +
            `Reference: ${transferResult.reference}\n\n` +
            `Your transfer has been processed successfully!`,
          completed: true,
          data: transferResult,
          suggestions: ['View receipt', 'Make another transfer', 'Check balance']
        };
      } else {
        return {
          message: `❌ Transfer Failed\n\n${transferResult.error}\n\nPlease try again.`,
          error: true,
          suggestions: ['Try again', 'Contact support']
        };
      }

    } catch (error) {
      console.error('Error executing transfer:', error);
      conversationStateManager.clearState(userId, conversationId);
      return {
        message: 'Failed to process transfer. Please try again or contact support.',
        error: true,
        suggestions: ['Try again', 'Contact support']
      };
    }
  }

  /**
   * Verify transaction PIN
   */
  private static async verifyPIN(userId: string, pin: string, tenantId: string): Promise<boolean> {
    try {
      const result = await dbManager.queryTenant(tenantId,
        'SELECT transaction_pin_hash FROM tenant.users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0 || !result.rows[0].transaction_pin_hash) {
        return false;
      }

      const pinHash = result.rows[0].transaction_pin_hash;
      const isValid = await bcrypt.compare(pin, pinHash);

      return isValid;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  }

  /**
   * Check if user has sufficient balance
   */
  private static async checkBalance(userId: string, amount: number, tenantId: string): Promise<boolean> {
    try {
      // Try to get wallet with any common wallet type
      const result = await dbManager.queryTenant(tenantId,
        `SELECT balance, wallet_type FROM tenant.wallets
         WHERE user_id = $1
         AND wallet_type IN ('primary', 'main', 'default', 'checking')
         ORDER BY
           CASE wallet_type
             WHEN 'main' THEN 1
             WHEN 'primary' THEN 2
             WHEN 'default' THEN 3
             ELSE 4
           END
         LIMIT 1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return false;
      }

      const balance = parseFloat(result.rows[0].balance);
      const hasBalance = balance >= amount;

      return hasBalance;
    } catch (error) {
      console.error('Error checking balance:', error);
      return false;
    }
  }

  /**
   * Create transfer record
   */
  private static async createTransfer(userId: string, data: Record<string, any>, tenantId: string): Promise<any> {
    try {
      // Get tenant's bank code for reference generation
      const tenantResult = await dbManager.queryPlatform(
        'SELECT bank_code FROM platform.tenants WHERE id = $1',
        [tenantId]
      );

      const bankCode = tenantResult.rows[0]?.bank_code || 'ORP';

      // Generate secure ULID-based reference
      const reference = generateTransferRef(bankCode);

      // Insert transfer record
      const transferResult = await dbManager.queryTenant(tenantId,
        `INSERT INTO tenant.transfers (
          sender_id, tenant_id, reference, amount, fee, description,
          source_account_number, source_bank_code,
          recipient_account_number, recipient_bank_code, recipient_name,
          status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        RETURNING id, reference`,
        [
          userId,
          tenantId,
          reference,
          data.amount,
          0, // Fee
          data.description || 'AI-initiated transfer',
          '0000000000', // Source account - would get from user's wallet
          '000003', // Source bank code - OrokiiPay
          data.accountNumber,
          data.bankCode,
          data.accountName,
          'successful' // Set as successful immediately (would normally be pending)
        ]
      );

      // Debit user's wallet - use same priority logic as balance check
      // First get the correct wallet ID
      const walletResult = await dbManager.queryTenant(tenantId,
        `SELECT id, wallet_type FROM tenant.wallets
         WHERE user_id = $1
         AND wallet_type IN ('primary', 'main', 'default', 'checking')
         ORDER BY
           CASE wallet_type
             WHEN 'main' THEN 1
             WHEN 'primary' THEN 2
             WHEN 'default' THEN 3
             ELSE 4
           END
         LIMIT 1`,
        [userId]
      );

      if (walletResult.rows.length === 0) {
        throw new Error('No wallet found for user');
      }

      const walletId = walletResult.rows[0].id;

      // Now update that specific wallet
      await dbManager.queryTenant(tenantId,
        `UPDATE tenant.wallets
         SET balance = balance - $1, updated_at = NOW()
         WHERE id = $2`,
        [data.amount, walletId]
      );

      return {
        success: true,
        reference: reference,
        transferId: transferResult.rows[0].id
      };

    } catch (error) {
      console.error('Error creating transfer:', error);
      return {
        success: false,
        error: `Failed to process transfer: ${(error as Error).message}`
      };
    }
  }

  /**
   * Get list of Nigerian banks
   */
  static getBankList(): typeof ConversationalTransferService.NIGERIAN_BANKS {
    return this.NIGERIAN_BANKS;
  }
}

export default ConversationalTransferService;
