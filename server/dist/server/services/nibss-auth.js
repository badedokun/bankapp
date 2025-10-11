"use strict";
/**
 * NIBSS Authentication Service
 * Handles OAuth2 token generation and request signing for NIBSS API
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nibssAuthService = exports.NIBSSAuthService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const node_fetch_1 = __importDefault(require("node-fetch"));
class NIBSSAuthService {
    constructor() {
        this.accessToken = null;
        this.tokenExpiry = null;
        this.config = {
            baseUrl: process.env.NIBSS_BASE_URL || 'https://apitest.nibss-plc.com.ng',
            clientId: process.env.NIBSS_CLIENT_ID || '',
            clientSecret: process.env.NIBSS_CLIENT_SECRET || '',
            apiKey: process.env.NIBSS_API_KEY || '',
        };
    }
    /**
     * Get OAuth2 access token using client credentials flow
     */
    async getAccessToken() {
        // Check if we have a valid cached token
        if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
            return this.accessToken;
        }
        console.log('🔑 Requesting new NIBSS access token...');
        try {
            // Try OAuth2 token endpoint
            const tokenUrl = `${this.config.baseUrl}/v2/auth/token`;
            // Create basic auth header for client credentials
            const authHeader = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
            const response = await (0, node_fetch_1.default)(tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${authHeader}`,
                },
                body: 'grant_type=client_credentials',
            });
            if (response.ok) {
                const data = await response.json();
                // Cache the token
                this.accessToken = data.access_token;
                // Calculate token expiry (subtract 60 seconds for safety)
                const expiresIn = (data.expires_in || 3600) - 60;
                this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
                console.log('✅ Access token obtained successfully');
                return this.accessToken;
            }
            else {
                console.log(`⚠️ Token endpoint returned ${response.status}, trying alternative auth method`);
                // Fall back to API key authentication
                return this.config.apiKey;
            }
        }
        catch (error) {
            console.log('⚠️ OAuth2 token request failed, using API key authentication');
            // If OAuth2 fails, return API key for bearer token
            return this.config.apiKey;
        }
    }
    /**
     * Generate HMAC256 signature for request (NIBSS custom authentication)
     */
    generateSignature(method, path, body) {
        // Generate unique nonce
        const nonce = crypto_1.default.randomBytes(16).toString('hex') + Date.now();
        // Prepare data to sign
        let dataToSign = nonce;
        if (method === 'POST' && body) {
            dataToSign = nonce + body;
        }
        // Create HMAC256 signature
        const hmac = crypto_1.default.createHmac('sha256', this.config.clientSecret);
        hmac.update(dataToSign);
        const signature = hmac.digest('base64');
        return { nonce, signature };
    }
    /**
     * Build authentication headers for NIBSS API requests
     */
    async buildAuthHeaders(method, path, body) {
        // Get access token (OAuth2 or API key)
        const token = await this.getAccessToken();
        // Generate signature for request
        const { nonce, signature } = this.generateSignature(method, path, body);
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Client-ID': this.config.clientId,
            'X-API-Key': this.config.apiKey,
            'X-Nonce': nonce,
            'X-Signature': signature,
            'X-Timestamp': Date.now().toString(),
        };
    }
    /**
     * Make authenticated request to NIBSS API
     */
    async makeRequest(method, endpoint, body) {
        const url = `${this.config.baseUrl}${endpoint}`;
        const bodyString = body ? JSON.stringify(body) : undefined;
        const headers = await this.buildAuthHeaders(method, endpoint, bodyString);
        console.log(`🔄 ${method} ${endpoint}`);
        try {
            const response = await (0, node_fetch_1.default)(url, {
                method,
                headers,
                body: bodyString,
            });
            const responseText = await response.text();
            if (response.ok) {
                try {
                    return JSON.parse(responseText);
                }
                catch {
                    return responseText;
                }
            }
            else {
                console.error(`❌ Request failed: ${response.status} ${response.statusText}`);
                console.error(`Response: ${responseText}`);
                // Try to parse error response
                try {
                    const errorData = JSON.parse(responseText);
                    throw new Error(errorData.message || errorData.error || `NIBSS API Error: ${response.status}`);
                }
                catch {
                    throw new Error(`NIBSS API Error: ${response.status} - ${responseText}`);
                }
            }
        }
        catch (error) {
            console.error('❌ Request error:', error);
            throw error;
        }
    }
    /**
     * Test authentication by calling a simple endpoint
     */
    async testAuthentication() {
        try {
            // Try to get bank list as a test
            const result = await this.makeRequest('GET', '/api/v1/banks');
            console.log('✅ Authentication test successful');
            return true;
        }
        catch (error) {
            console.error('❌ Authentication test failed:', error);
            // Try alternative endpoints
            try {
                const result = await this.makeRequest('GET', '/api/banks');
                console.log('✅ Authentication test successful (alternative endpoint)');
                return true;
            }
            catch {
                return false;
            }
        }
    }
}
exports.NIBSSAuthService = NIBSSAuthService;
exports.nibssAuthService = new NIBSSAuthService();
//# sourceMappingURL=nibss-auth.js.map