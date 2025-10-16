/**
 * AI Actions Service
 * Handles actionable AI intents like initiating transfers, bill payments, etc.
 */
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
export declare class AIActionsService {
    /**
     * Process transfer money intent
     */
    static processTransferIntent(userId: string, message: string, parameters?: TransferParameters): Promise<AIActionResponse>;
    /**
     * Extract transfer parameters from natural language
     */
    private static extractTransferParameters;
    /**
     * Build prompt message for missing fields
     */
    private static buildPromptMessage;
    /**
     * Get contextual suggestions based on missing fields
     */
    private static getTransferSuggestions;
    /**
     * Process bill payment intent
     */
    static processBillPaymentIntent(userId: string, message: string, parameters?: any): Promise<AIActionResponse>;
    /**
     * Determine if message requires an action
     */
    static requiresAction(intent: string): boolean;
    /**
     * Route intent to appropriate action handler
     */
    static processActionIntent(intent: string, userId: string, message: string, parameters?: any): Promise<AIActionResponse>;
}
export default AIActionsService;
//# sourceMappingURL=AIActionsService.d.ts.map