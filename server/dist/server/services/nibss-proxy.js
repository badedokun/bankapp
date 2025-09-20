"use strict";
/**
 * NIBSS Proxy Service
 * Routes NIBSS API requests through GCP server for local development
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nibssProxyService = exports.NIBSSProxyService = void 0;
const https_proxy_agent_1 = require("https-proxy-agent");
const node_fetch_1 = __importDefault(require("node-fetch"));
class NIBSSProxyService {
    constructor() {
        this.proxyAgent = null;
        if (process.env.NODE_ENV === 'development' && process.env.NIBSS_PROXY_URL) {
            console.log('🚇 Using NIBSS proxy for local development');
            this.proxyAgent = new https_proxy_agent_1.HttpsProxyAgent(process.env.NIBSS_PROXY_URL);
        }
    }
    /**
     * Make proxied request to NIBSS API
     */
    async makeProxiedRequest(url, options = {}) {
        const fetchOptions = {
            ...options,
            agent: this.proxyAgent || undefined,
        };
        // For local testing with self-signed certificates
        if (process.env.NODE_ENV === 'development' && url.includes('localhost')) {
            process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
        }
        try {
            console.log(`🌐 ${options.method || 'GET'} ${url}`);
            const response = await (0, node_fetch_1.default)(url, fetchOptions);
            const text = await response.text();
            // Reset TLS verification
            process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
            if (response.ok) {
                try {
                    return JSON.parse(text);
                }
                catch {
                    return text;
                }
            }
            else {
                throw new Error(`HTTP ${response.status}: ${text}`);
            }
        }
        catch (error) {
            // Reset TLS verification on error
            process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
            throw error;
        }
    }
}
exports.NIBSSProxyService = NIBSSProxyService;
exports.nibssProxyService = new NIBSSProxyService();
//# sourceMappingURL=nibss-proxy.js.map