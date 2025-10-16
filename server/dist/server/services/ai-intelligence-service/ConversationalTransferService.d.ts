/**
 * Conversational Transfer Service
 * Handles step-by-step transfer flow through AI chat
 */
export interface ConversationalResponse {
    message: string;
    suggestions?: string[];
    data?: any;
    completed?: boolean;
    error?: boolean;
}
export declare class ConversationalTransferService {
    private static readonly NIGERIAN_BANKS;
    private static readonly TRANSFER_STEPS;
    /**
     * Process message in conversational transfer flow
     */
    static processTransferConversation(message: string, userId: string, conversationId: string, tenantId: string): Promise<ConversationalResponse>;
    /**
     * Execute the transfer with collected information
     */
    private static executeTransfer;
    /**
     * Verify transaction PIN
     */
    private static verifyPIN;
    /**
     * Check if user has sufficient balance
     */
    private static checkBalance;
    /**
     * Create transfer record
     */
    private static createTransfer;
    /**
     * Get list of Nigerian banks
     */
    static getBankList(): typeof ConversationalTransferService.NIGERIAN_BANKS;
}
export default ConversationalTransferService;
//# sourceMappingURL=ConversationalTransferService.d.ts.map