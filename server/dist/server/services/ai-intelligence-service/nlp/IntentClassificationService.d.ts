import { ConversationContext } from '../core/ConversationalAIService';
export interface Intent {
    name: string;
    confidence: number;
    parameters?: {
        [key: string]: any;
    };
}
export interface TrainingData {
    text: string;
    intent: string;
    entities?: {
        [key: string]: any;
    };
}
export declare class IntentClassificationService {
    private tokenizer;
    private stemmer;
    private model;
    private vocabulary;
    private intents;
    private isInitialized;
    constructor();
    private initializeService;
    private loadPretrainedIntents;
    classifyIntent(text: string, context?: ConversationContext): Promise<Intent>;
    private preprocessText;
    private extractFeatures;
    private buildModel;
    private generateTrainingData;
    private prepareTrainingData;
    private fallbackClassification;
    private extractParameters;
    getIntentSuggestions(partialText: string): Promise<string[]>;
    dispose(): void;
}
export default IntentClassificationService;
//# sourceMappingURL=IntentClassificationService.d.ts.map