import { ConversationContext } from '../core/ConversationalAIService';
export interface Entity {
    type: string;
    value: any;
    confidence: number;
    position: {
        start: number;
        end: number;
    };
    raw: string;
}
export interface ExtractionResult {
    entities: Entity[];
    sanitizedText: string;
    metadata: {
        processingTime: number;
        confidence: number;
    };
}
export declare class EntityExtractionService {
    private nigerianBanks;
    private nigerianStates;
    private commonNames;
    private phonePattern;
    private accountPattern;
    private amountPattern;
    private datePattern;
    private emailPattern;
    constructor();
    private initializePatterns;
    private initializeNigerianData;
    extractEntities(text: string, context?: ConversationContext): Promise<ExtractionResult>;
    private extractAmounts;
    private extractPhoneNumbers;
    private extractAccountNumbers;
    private extractEmails;
    private extractDates;
    private extractNames;
    private extractBanks;
    private extractLocations;
    private extractBankingTerms;
    private extractTransactionTypes;
    private extractBillTypes;
    private normalizePhoneNumber;
    private sanitizeText;
    private calculateOverallConfidence;
    validateExtractedEntities(entities: Entity[], context?: ConversationContext): Promise<Entity[]>;
    private validateAmount;
    private validatePhoneNumber;
    private validateAccountNumber;
    private validateEmail;
    getEntityTypes(): string[];
}
export default EntityExtractionService;
//# sourceMappingURL=EntityExtractionService.d.ts.map