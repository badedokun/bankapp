/**
 * NIBSS Authentication Service
 * Handles OAuth2 token generation and request signing for NIBSS API
 */
export declare class NIBSSAuthService {
    private config;
    private accessToken;
    private tokenExpiry;
    constructor();
    /**
     * Get OAuth2 access token using client credentials flow
     */
    getAccessToken(): Promise<string>;
    /**
     * Generate HMAC256 signature for request (NIBSS custom authentication)
     */
    generateSignature(method: string, path: string, body?: string): {
        nonce: string;
        signature: string;
    };
    /**
     * Build authentication headers for NIBSS API requests
     */
    buildAuthHeaders(method: string, path: string, body?: string): Promise<Record<string, string>>;
    /**
     * Make authenticated request to NIBSS API
     */
    makeRequest(method: string, endpoint: string, body?: any): Promise<any>;
    /**
     * Test authentication by calling a simple endpoint
     */
    testAuthentication(): Promise<boolean>;
}
export declare const nibssAuthService: NIBSSAuthService;
//# sourceMappingURL=nibss-auth.d.ts.map