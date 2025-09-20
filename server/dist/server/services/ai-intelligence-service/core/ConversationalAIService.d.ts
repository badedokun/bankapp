export interface ConversationContext {
    userId: string;
    tenantId: string;
    conversationId: string;
    language: string;
    bankingContext: BankingContext;
}
export interface BankingContext {
    accountBalance?: number;
    recentTransactions?: any[];
    userProfile?: any;
    capabilities?: string[];
}
export interface AIResponse {
    message: string;
    intent?: string;
    entities?: any;
    confidence: number;
    actions?: string[];
    followUp?: string[];
}
export declare class ConversationalAIService {
    private openai;
    private tenantConfig;
    constructor();
    private initializeAI;
    processMessage(message: string, context: ConversationContext): Promise<AIResponse>;
    private buildSystemPrompt;
    private preprocessMessage;
    private extractIntent;
    private extractEntities;
    private suggestActions;
    processVoiceCommand(audioData: Buffer, context: ConversationContext): Promise<AIResponse>;
    generateSuggestions(context: ConversationContext): Promise<string[]>;
    private translateSuggestions;
}
export default ConversationalAIService;
//# sourceMappingURL=ConversationalAIService.d.ts.map