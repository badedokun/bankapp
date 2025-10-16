/**
 * Conversation State Manager
 * Manages multi-step conversational flows for AI assistant
 */
interface ConversationState {
    userId: string;
    conversationId: string;
    currentFlow?: 'transfer' | 'bill_payment' | null;
    step: number;
    data: Record<string, any>;
    lastUpdated: Date;
}
declare class ConversationStateManager {
    private states;
    private readonly TIMEOUT_MS;
    /**
     * Get or create conversation state for user
     */
    getState(userId: string, conversationId: string): ConversationState;
    /**
     * Update conversation state
     */
    updateState(userId: string, conversationId: string, updates: Partial<ConversationState>): void;
    /**
     * Clear conversation state
     */
    clearState(userId: string, conversationId: string): void;
    /**
     * Set data field in current conversation
     */
    setData(userId: string, conversationId: string, field: string, value: any): void;
    /**
     * Get data field from current conversation
     */
    getData(userId: string, conversationId: string, field: string): any;
    /**
     * Advance to next step
     */
    nextStep(userId: string, conversationId: string): void;
    /**
     * Clean up old states (run periodically)
     */
    cleanup(): void;
}
export declare const conversationStateManager: ConversationStateManager;
export default conversationStateManager;
//# sourceMappingURL=ConversationStateManager.d.ts.map