/**
 * AI Actions Service
 * Handles actionable AI intents like initiating transfers, bill payments, etc.
 */

// No database queries needed in this service - it only prepares actions

export interface AIActionResponse {
  action: string;
  status: 'ready' | 'needs_confirmation' | 'needs_info' | 'executed' | 'error';
  message: string;
  data?: any;
  nextStep?: string;
  requiredFields?: string[];
  suggestions?: string[];
}

export interface TransferParameters {
  amount?: number;
  recipientAccount?: string;
  recipientName?: string;
  recipientBank?: string;
  description?: string;
}

export class AIActionsService {
  /**
   * Process transfer money intent
   */
  static async processTransferIntent(
    userId: string,
    message: string,
    parameters: TransferParameters = {}
  ): Promise<AIActionResponse> {
    try {
      // Extract parameters from message if not provided
      const extractedParams = this.extractTransferParameters(message);
      const mergedParams = { ...extractedParams, ...parameters };

      // Check which parameters are missing
      const missingFields = [];
      if (!mergedParams.amount) missingFields.push('amount');
      if (!mergedParams.recipientAccount) missingFields.push('recipient account number');
      if (!mergedParams.recipientName) missingFields.push('recipient name');

      // If missing critical info, prompt user
      if (missingFields.length > 0) {
        return {
          action: 'transfer_money',
          status: 'needs_info',
          message: this.buildPromptMessage(mergedParams, missingFields),
          data: mergedParams,
          requiredFields: missingFields,
          nextStep: 'collect_transfer_info',
          suggestions: this.getTransferSuggestions(mergedParams, missingFields)
        };
      }

      // All parameters present, prepare for confirmation
      const formattedAmount = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
      }).format(mergedParams.amount!);

      return {
        action: 'transfer_money',
        status: 'needs_confirmation',
        message: `I can help you transfer ${formattedAmount} to ${mergedParams.recipientName} (${mergedParams.recipientAccount}).\n\nTo complete this transfer, please go to the Transfer Money screen where you can:\n1. Verify the recipient details\n2. Enter your transaction PIN\n3. Complete the secure transfer\n\nWould you like me to take you to the Transfer Money screen?`,
        data: {
          ...mergedParams,
          formattedAmount,
          readyToExecute: true
        },
        nextStep: 'navigate_to_transfer',
        suggestions: [
          'Yes, take me to transfers',
          'No, cancel this',
          'Change the amount'
        ]
      };
    } catch (error) {
      console.error('Error processing transfer intent:', error);
      return {
        action: 'transfer_money',
        status: 'error',
        message: 'I encountered an error while processing your transfer request. Please try using the Transfer Money screen directly.',
        suggestions: ['Go to Transfer Money', 'Check my balance']
      };
    }
  }

  /**
   * Extract transfer parameters from natural language
   */
  private static extractTransferParameters(message: string): TransferParameters {
    const params: TransferParameters = {};

    // Extract amount (handles various formats)
    const amountPatterns = [
      /(?:transfer|send|pay)\s+(?:₦|NGN|naira|N)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
      /(?:₦|NGN|naira|N)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s+(?:naira|NGN)/i
    ];

    for (const pattern of amountPatterns) {
      const match = message.match(pattern);
      if (match) {
        params.amount = parseFloat(match[1].replace(/,/g, ''));
        break;
      }
    }

    // Extract account number (10 digits)
    const accountMatch = message.match(/\b(\d{10})\b/);
    if (accountMatch) {
      params.recipientAccount = accountMatch[1];
    }

    // Extract recipient name (after "to" or "for")
    const namePatterns = [
      /(?:to|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
      /(?:transfer|send|pay)\s+(?:money\s+)?(?:to|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
    ];

    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match) {
        params.recipientName = match[1].trim();
        break;
      }
    }

    // Extract description
    const descMatch = message.match(/(?:for|description:|note:)\s+(.+)$/i);
    if (descMatch) {
      params.description = descMatch[1].trim();
    }

    return params;
  }

  /**
   * Build prompt message for missing fields
   */
  private static buildPromptMessage(params: TransferParameters, missingFields: string[]): string {
    const knownInfo = [];
    if (params.amount) {
      const formattedAmount = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
      }).format(params.amount);
      knownInfo.push(`Amount: ${formattedAmount}`);
    }
    if (params.recipientName) {
      knownInfo.push(`Recipient: ${params.recipientName}`);
    }
    if (params.recipientAccount) {
      knownInfo.push(`Account: ${params.recipientAccount}`);
    }

    let message = 'I can help you make a transfer!';

    if (knownInfo.length > 0) {
      message += '\n\nHere is what I have so far:\n' + knownInfo.join('\n');
    }

    message += '\n\nTo complete the transfer, I need:\n';
    missingFields.forEach((field, index) => {
      message += `${index + 1}. ${field.charAt(0).toUpperCase() + field.slice(1)}\n`;
    });

    message += '\nPlease provide the missing information, or use the Transfer Money screen to complete your transaction securely.';

    return message;
  }

  /**
   * Get contextual suggestions based on missing fields
   */
  private static getTransferSuggestions(_params: TransferParameters, missingFields: string[]): string[] {
    const suggestions = [];

    if (missingFields.includes('amount')) {
      suggestions.push('Transfer ₦5,000', 'Transfer ₦10,000', 'Transfer ₦50,000');
    } else if (missingFields.includes('recipient account number')) {
      suggestions.push('Use saved beneficiary', 'Go to Transfer Money screen');
    } else if (missingFields.includes('recipient name')) {
      suggestions.push('Go to Transfer Money screen', 'Cancel transfer');
    } else {
      suggestions.push('Confirm transfer', 'Cancel transfer', 'Change amount');
    }

    return suggestions;
  }

  /**
   * Process bill payment intent
   */
  static async processBillPaymentIntent(
    userId: string,
    message: string,
    parameters: any = {}
  ): Promise<AIActionResponse> {
    // Extract bill type
    const billTypes = ['electricity', 'water', 'internet', 'phone', 'cable', 'tv', 'airtime', 'data'];
    const billMatch = billTypes.find(type => message.toLowerCase().includes(type));

    if (!billMatch) {
      return {
        action: 'bill_payment',
        status: 'needs_info',
        message: 'I can help you pay bills! What type of bill would you like to pay?\n\nI can help with:\n- Electricity\n- Water\n- Internet\n- Phone/Airtime\n- Cable TV\n- Data',
        requiredFields: ['bill_type'],
        suggestions: ['Pay electricity bill', 'Buy airtime', 'Pay cable TV']
      };
    }

    return {
      action: 'bill_payment',
      status: 'needs_info',
      message: `Great! I can help you pay your ${billMatch} bill.\n\nPlease use the Bill Payment screen to:\n1. Select your ${billMatch} provider\n2. Enter your customer number\n3. Enter the amount\n4. Complete the payment securely`,
      data: { billType: billMatch },
      nextStep: 'navigate_to_bills',
      suggestions: ['Go to Bill Payment', 'Cancel']
    };
  }

  /**
   * Determine if message requires an action
   */
  static requiresAction(intent: string): boolean {
    const actionableIntents = [
      'transfer_money',
      'bill_payment',
      'airtime_purchase',
      'data_purchase'
    ];
    return actionableIntents.includes(intent);
  }

  /**
   * Route intent to appropriate action handler
   */
  static async processActionIntent(
    intent: string,
    userId: string,
    message: string,
    parameters: any = {}
  ): Promise<AIActionResponse> {
    switch (intent) {
      case 'transfer_money':
        return this.processTransferIntent(userId, message, parameters);

      case 'bill_payment':
      case 'airtime_purchase':
      case 'data_purchase':
        return this.processBillPaymentIntent(userId, message, parameters);

      default:
        return {
          action: intent,
          status: 'error',
          message: 'I can provide information about this, but I cannot execute this action directly. Please use the appropriate screen in the app.',
          suggestions: ['Check balance', 'View transactions']
        };
    }
  }
}

export default AIActionsService;
