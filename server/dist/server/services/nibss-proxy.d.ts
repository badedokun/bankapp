/**
 * NIBSS Proxy Service
 * Routes NIBSS API requests through GCP server for local development
 */
export declare class NIBSSProxyService {
    private proxyAgent;
    constructor();
    /**
     * Make proxied request to NIBSS API
     */
    makeProxiedRequest(url: string, options?: any): Promise<any>;
}
export declare const nibssProxyService: NIBSSProxyService;
//# sourceMappingURL=nibss-proxy.d.ts.map