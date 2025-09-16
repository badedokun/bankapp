/**
 * NIBSS Proxy Service
 * Routes NIBSS API requests through GCP server for local development
 */

import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';

export class NIBSSProxyService {
  private proxyAgent: HttpsProxyAgent | null = null;

  constructor() {
    if (process.env.NODE_ENV === 'development' && process.env.NIBSS_PROXY_URL) {
      console.log('🚇 Using NIBSS proxy for local development');
      this.proxyAgent = new HttpsProxyAgent(process.env.NIBSS_PROXY_URL);
    }
  }

  /**
   * Make proxied request to NIBSS API
   */
  async makeProxiedRequest(url: string, options: any = {}): Promise<any> {
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

      const response = await fetch(url, fetchOptions);
      const text = await response.text();

      // Reset TLS verification
      process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';

      if (response.ok) {
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
    } catch (error) {
      // Reset TLS verification on error
      process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
      throw error;
    }
  }
}

export const nibssProxyService = new NIBSSProxyService();