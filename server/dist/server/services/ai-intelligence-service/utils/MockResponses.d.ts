export interface MockResponse {
    intent: string;
    response: string;
    confidence: number;
    suggestions?: string[];
}
export declare const mockResponses: Record<string, MockResponse>;
export declare function getMockResponse(intent: string): MockResponse;
export declare function getAllMockIntents(): string[];
//# sourceMappingURL=MockResponses.d.ts.map