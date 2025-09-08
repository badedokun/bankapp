/**
 * API Service Layer
 * Centralized API communication with authentication handling
 */

import { Storage } from '../utils/storage';
import JWTManager from '../utils/jwt';

// API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.orokii.com' 
  : 'http://localhost:3001';

interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

interface LoginRequest {
  email: string;
  password: string;
  tenantId?: string;
  deviceInfo?: any;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    status: string;
    mfaEnabled: boolean;
    biometricEnabled: boolean;
    kycStatus: string;
    kycLevel: number;
    profileData: any;
    aiPreferences: any;
    tenant: {
      id: string;
      name: string;
      displayName: string;
      branding: any;
    };
    wallet?: {
      number: string;
      balance: string;
      availableBalance: string;
    };
  };
  tokens: {
    access: string;
    refresh: string;
    expiresIn: string;
  };
  session: {
    id: string;
    expiresAt: string;
  };
}

interface RefreshTokenResponse {
  tokens: {
    access: string;
    refresh: string;
    expiresIn: string;
  };
}

class APIService {
  private static instance: APIService;
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  private constructor() {
    this.baseURL = API_BASE_URL;
    this.loadTokensFromStorage();
  }

  static getInstance(): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  /**
   * Load stored tokens
   */
  private async loadTokensFromStorage() {
    try {
      this.accessToken = await Storage.getItem('access_token');
      this.refreshToken = await Storage.getItem('refresh_token');
    } catch (error) {
      console.error('Error loading tokens from storage:', error);
    }
  }

  /**
   * Save tokens to storage
   */
  private async saveTokensToStorage(accessToken: string, refreshToken: string) {
    try {
      await Storage.setItem('access_token', accessToken);
      await Storage.setItem('refresh_token', refreshToken);
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
    } catch (error) {
      console.error('Error saving tokens to storage:', error);
    }
  }

  /**
   * Clear stored tokens
   */
  private async clearTokensFromStorage() {
    try {
      await Storage.removeItem('access_token');
      await Storage.removeItem('refresh_token');
      await Storage.removeItem('demo_mode');
      this.accessToken = null;
      this.refreshToken = null;
    } catch (error) {
      console.error('Error clearing tokens from storage:', error);
    }
  }

  /**
   * Get current tenant ID from JWT token or domain
   */
  private getTenantId(): string {
    // Try to get from current access token
    if (this.accessToken) {
      try {
        const payload = JWTManager.parseToken(this.accessToken);
        if (payload && payload.tenantId) {
          return payload.tenantId;
        }
      } catch (error) {
        console.log('Could not extract tenant from token:', error);
      }
    }

    // Try to get from current domain
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const subdomain = hostname.split('.')[0];
      
      // Map subdomains to tenant names
      const subdomainMap: Record<string, string> = {
        'fmfb': 'fmfb',
        'localhost': 'fmfb', // Default to FMFB for local development
        'dev': 'development'
      };

      return subdomainMap[subdomain] || 'fmfb';
    }

    // Default to FMFB
    return 'fmfb';
  }

  /**
   * Make HTTP request with automatic token refresh
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const tenantId = this.getTenantId();

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      ...((options.headers as Record<string, string>) || {})
    };

    // Add authorization header if token exists
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data: APIResponse<T> = await response.json();

      // Handle token expiration
      if (response.status === 401 && data.code === 'TOKEN_EXPIRED') {
        console.log('Token expired, attempting refresh...');
        const refreshSuccess = await this.refreshAccessToken();
        
        if (refreshSuccess && this.accessToken) {
          // Retry request with new token
          headers.Authorization = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, { ...options, headers });
          return await retryResponse.json();
        } else {
          // Refresh failed, clear tokens and redirect to login
          await this.clearTokensFromStorage();
          throw new Error('Session expired. Please log in again.');
        }
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': this.getTenantId()
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken
        })
      });

      if (response.ok) {
        const data: APIResponse<RefreshTokenResponse> = await response.json();
        if (data.success && data.data) {
          await this.saveTokensToStorage(
            data.data.tokens.access,
            data.data.tokens.refresh
          );
          return true;
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const tenantId = credentials.tenantId || this.getTenantId();
    
    const response = await this.makeRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        ...credentials,
        tenantId,
        deviceInfo: {
          platform: typeof window !== 'undefined' ? 'web' : 'mobile',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          timestamp: new Date().toISOString(),
          ...credentials.deviceInfo
        }
      })
    });

    if (response.success && response.data) {
      // Save tokens
      await this.saveTokensToStorage(
        response.data.tokens.access,
        response.data.tokens.refresh
      );
      
      // Clear demo mode
      await Storage.removeItem('demo_mode');
      
      return response.data;
    }

    throw new Error(response.error || 'Login failed');
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      if (this.accessToken) {
        await this.makeRequest('/api/auth/logout', {
          method: 'POST'
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local cleanup even if API call fails
    } finally {
      await this.clearTokensFromStorage();
    }
  }

  /**
   * Logout from all devices
   */
  async logoutAll(): Promise<void> {
    try {
      if (this.accessToken) {
        await this.makeRequest('/api/auth/logout-all', {
          method: 'POST'
        });
      }
    } catch (error) {
      console.error('Logout all API call failed:', error);
    } finally {
      await this.clearTokensFromStorage();
    }
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<LoginResponse['user']> {
    const response = await this.makeRequest<{ user: LoginResponse['user'] }>('/api/auth/profile');
    
    if (response.success && response.data) {
      return response.data.user;
    }

    throw new Error(response.error || 'Failed to fetch profile');
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    profileData?: any;
    aiPreferences?: any;
  }): Promise<void> {
    const response = await this.makeRequest('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to update profile');
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await this.makeRequest('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to change password');
    }
  }

  /**
   * Get user sessions
   */
  async getSessions(): Promise<any[]> {
    const response = await this.makeRequest<{ sessions: any[] }>('/api/auth/sessions');
    
    if (response.success && response.data) {
      return response.data.sessions;
    }

    throw new Error(response.error || 'Failed to fetch sessions');
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    if (!this.accessToken) {
      await this.loadTokensFromStorage();
    }

    if (!this.accessToken) {
      return false;
    }

    try {
      // Try to verify token by making a profile request
      await this.getProfile();
      return true;
    } catch (error) {
      console.log('Authentication check failed:', error);
      return false;
    }
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Check server health
   */
  async healthCheck(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return await response.json();
    } catch (error) {
      throw new Error('Server is not accessible');
    }
  }

  // Transfer Methods

  /**
   * Initiate money transfer
   */
  async initiateTransfer(transferData: {
    recipientAccountNumber: string;
    recipientBankCode: string;
    recipientName?: string;
    amount: number;
    description?: string;
    pin: string;
  }): Promise<{
    transactionId: string;
    referenceNumber: string;
    amount: number;
    recipient: {
      accountNumber: string;
      bankCode: string;
      name: string;
    };
    status: string;
    createdAt: string;
  }> {
    const response = await this.makeRequest<any>('/api/transfers/initiate', {
      method: 'POST',
      body: JSON.stringify(transferData)
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Transfer initiation failed');
  }

  /**
   * Get transfer history
   */
  async getTransferHistory(options?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  }): Promise<{
    transactions: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.status) params.append('status', options.status);
    if (options?.type) params.append('type', options.type);

    const response = await this.makeRequest<any>(`/api/transfers/history?${params.toString()}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch transfer history');
  }

  /**
   * Get transfer details by ID
   */
  async getTransferDetails(transactionId: string): Promise<any> {
    const response = await this.makeRequest<any>(`/api/transfers/${transactionId}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch transfer details');
  }

  /**
   * Validate recipient account
   */
  async validateRecipient(accountNumber: string, bankCode: string): Promise<{
    accountNumber: string;
    bankCode: string;
    bankName: string;
    accountName: string;
    isValid: boolean;
  }> {
    const response = await this.makeRequest<any>('/api/transfers/validate-recipient', {
      method: 'POST',
      body: JSON.stringify({ accountNumber, bankCode })
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Account validation failed');
  }

  /**
   * Get supported banks
   */
  async getBanks(): Promise<{
    banks: Array<{
      code: string;
      name: string;
      slug: string;
    }>;
  }> {
    const response = await this.makeRequest<any>('/api/transfers/banks');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch banks');
  }

  // Wallet Methods

  /**
   * Get wallet balance
   */
  async getWalletBalance(): Promise<{
    walletNumber: string;
    accountType: string;
    balance: number;
    availableBalance: number;
    currency: string;
    status: string;
    owner: {
      name: string;
    };
    createdAt: string;
    updatedAt: string;
  }> {
    const response = await this.makeRequest<any>('/api/wallets/balance');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch wallet balance');
  }

  /**
   * Get wallet statement
   */
  async getWalletStatement(options?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<{
    walletNumber: string;
    statement: {
      openingBalance: number | null;
      transactions: any[];
      pagination: {
        page: number;
        limit: number;
        hasMore: boolean;
      };
    };
  }> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.type) params.append('type', options.type);

    const response = await this.makeRequest<any>(`/api/wallets/statement?${params.toString()}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch wallet statement');
  }

  /**
   * Set transaction PIN
   */
  async setTransactionPin(newPin: string, confirmPin: string, currentPin?: string): Promise<void> {
    const response = await this.makeRequest('/api/wallets/set-pin', {
      method: 'POST',
      body: JSON.stringify({ newPin, confirmPin, currentPin })
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to set transaction PIN');
    }
  }

  /**
   * Verify transaction PIN
   */
  async verifyTransactionPin(pin: string): Promise<{ isValid: boolean }> {
    const response = await this.makeRequest<any>('/api/wallets/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ pin })
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'PIN verification failed');
  }

  /**
   * Get transaction limits
   */
  async getTransactionLimits(): Promise<{
    limits: {
      daily: {
        limit: number;
        used: number;
        remaining: number;
      };
      monthly: {
        limit: number;
        used: number;
        remaining: number;
      };
    };
  }> {
    const response = await this.makeRequest<any>('/api/wallets/limits');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch transaction limits');
  }

  /**
   * Request transaction limit increase
   */
  async requestLimitIncrease(type: 'daily' | 'monthly', requestedAmount: number, reason: string): Promise<{
    requestId: string;
    submittedAt: string;
  }> {
    const response = await this.makeRequest<any>('/api/wallets/request-limit-increase', {
      method: 'POST',
      body: JSON.stringify({ type, requestedAmount, reason })
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to submit limit increase request');
  }
}

export default APIService.getInstance();