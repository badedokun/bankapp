export interface MockResponse {
    intent: string;
    response: string;
    confidence: number;
    suggestions?: string[];
}
export declare const mockResponses: Record<string, MockResponse>;
export declare function getMockResponse(intent: string): MockResponse;
export declare function getAllMockIntents(): string[];
export declare class MockAIResponseGenerator {
    static generateConversationalResponse(message: string, context: any): any;
    static generateSmartSuggestions(category: string, limit: number): any[];
    static generateAnalyticsInsights(type: string, timeframe: string): any;
}
//# sourceMappingURL=MockResponses.d.ts.map