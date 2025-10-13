/**
 * API Service Layer
 * Centralized API communication with authentication handling
 */

import { Storage } from '../utils/storage';
import JWTManager from '../utils/jwt';
import { ENV_CONFIG, buildApiUrl } from '../config/environment';

/**
 * React Native Compatibility Check
 * Determines if running in React Native environment
 */
const isReactNative = (): boolean => {
  return typeof window === 'undefined' && typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
};

// API Configuration - Use centralized environment config
const API_BASE_URL = ENV_CONFIG.API_BASE_URL;
const API_TIMEOUT = ENV_CONFIG.API_TIMEOUT;

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
  private currentUser: LoginResponse['user'] | null = null;

  private constructor() {
    this.baseURL = API_BASE_URL;
    // Don't load tokens in constructor as it's async
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
      // Error loading tokens from storage
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
      // Error saving tokens to storage
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
      // Error clearing tokens from storage
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
        // Could not extract tenant from token
      }
    }

    // Try to get from current domain (only if not React Native)
    if (!isReactNative() && typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const subdomain = hostname.split('.')[0];
      
      // Map subdomains to tenant names - no hardcoded defaults
      const subdomainMap: Record<string, string> = {
        'fmfb': 'fmfb',
        'dev': 'development'
      };

      // Check for environment variable for localhost development
      if (subdomain === 'localhost') {
        return process.env.REACT_APP_TENANT_CODE || 'platform';
      }

      return subdomainMap[subdomain] || 'platform';
    }

    // Check for environment variable (React Native and fallback)
    if (typeof process !== 'undefined' && process.env) {
      return process.env.REACT_APP_TENANT_CODE || 'platform';
    }

    // Final fallback to platform
    return 'platform';
  }

  /**
   * Make HTTP request with automatic token refresh
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    // Ensure tokens are loaded before making requests
    if (!this.accessToken) {
      await this.loadTokensFromStorage();
    }

    const url = buildApiUrl(endpoint);
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
      const response = await fetch(buildApiUrl('auth/refresh'), {
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
      // Token refresh failed
    }

    return false;
  }

  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const tenantId = credentials.tenantId || this.getTenantId();
    
    const response = await this.makeRequest<LoginResponse>('auth/login', {
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

      // Save user data
      this.currentUser = response.data.user;
      await Storage.setItem('user_data', JSON.stringify(response.data.user));

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
        await this.makeRequest('auth/logout', {
          method: 'POST'
        });
      }
    } catch (error) {
      // Logout API call failed
      // Continue with local cleanup even if API call fails
    } finally {
      await this.clearTokensFromStorage();
      this.currentUser = null;
      await Storage.removeItem('user_data');
    }
  }

  /**
   * Logout from all devices
   */
  async logoutAll(): Promise<void> {
    try {
      if (this.accessToken) {
        await this.makeRequest('auth/logout-all', {
          method: 'POST'
        });
      }
    } catch (error) {
      // Logout all API call failed
    } finally {
      await this.clearTokensFromStorage();
    }
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<LoginResponse['user']> {
    const response = await this.makeRequest<{ user: LoginResponse['user'] }>('auth/profile');
    
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
    const response = await this.makeRequest('auth/profile', {
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
    const response = await this.makeRequest('auth/change-password', {
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
    const response = await this.makeRequest<{ sessions: any[] }>('auth/sessions');
    
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
      // Authentication check failed
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
      const response = await fetch(buildApiUrl('health'));
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
    const response = await this.makeRequest<any>('transfers/initiate', {
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

    const response = await this.makeRequest<any>(`transfers/history?${params.toString()}`);

    if (response.success && response.data) {
      // Transform server response structure to match expected API service format
      return {
        transactions: response.data.transfers || [],
        pagination: response.data.pagination || {
          page: options?.page || 1,
          limit: options?.limit || 20,
          total: response.data.transfers?.length || 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };
    }

    throw new Error(response.error || 'Failed to fetch transfer history');
  }

  /**
   * Get transfer details by ID
   */
  async getTransferDetails(transactionId: string): Promise<any> {
    const response = await this.makeRequest<any>(`transfers/${transactionId}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch transfer details');
  }

  /**
   * Get comprehensive transaction details for transaction details screen
   */
  async getTransactionDetails(transactionId: string): Promise<any> {
    try {
      // Try the dedicated transaction details endpoint first
      const response = await this.makeRequest<any>(`transactions/${transactionId}/details`);

      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      // Dedicated transaction details endpoint not available, falling back to transfer details
    }

    // Fallback to transfer details endpoint
    const response = await this.makeRequest<any>(`transfers/${transactionId}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch transaction details');
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
    const response = await this.makeRequest<any>('transfers/validate-recipient', {
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
    const response = await this.makeRequest<any>('transfers/banks');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch banks');
  }

  /**
   * Get transfer by reference number
   */
  async getTransferByReference(reference: string): Promise<{
    id: string;
    reference: string;
    type: 'debit' | 'credit';
    status: string;
    amount: number;
    currency: string;
    fees: number;
    totalAmount: number;
    sender: {
      name: string;
      accountNumber: string;
      bankName: string;
      bankCode: string;
    };
    recipient: {
      name: string;
      accountNumber: string;
      bankName: string;
      bankCode: string;
    };
    description: string;
    transactionHash: string;
    initiatedAt: string;
    completedAt?: string;
  }> {
    const response = await this.makeRequest<any>(`transfers/${reference}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Transfer not found');
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
    const response = await this.makeRequest<any>('wallets/balance');

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

    const response = await this.makeRequest<any>(`wallets/statement?${params.toString()}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch wallet statement');
  }

  /**
   * Set transaction PIN
   */
  async setTransactionPin(newPin: string, confirmPin: string, currentPin?: string): Promise<void> {
    const response = await this.makeRequest('wallets/set-pin', {
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
    const response = await this.makeRequest<any>('wallets/verify-pin', {
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
    const response = await this.makeRequest<any>('transaction-limits');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch transaction limits');
  }

  /**
   * Update user transaction limits (admin only)
   */
  async updateUserLimits(userEmail: string, dailyLimit: number, monthlyLimit: number): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await this.makeRequest<any>('transaction-limits', {
      method: 'PUT',
      body: JSON.stringify({
        userEmail,
        dailyLimit,
        monthlyLimit,
      }),
    });

    if (response.success) {
      return {
        success: true,
        message: 'Transaction limits updated successfully',
      };
    }

    throw new Error(response.error || 'Failed to update transaction limits');
  }

  /**
   * Request transaction limit increase
   */
  async requestLimitIncrease(type: 'daily' | 'monthly', requestedAmount: number, reason: string): Promise<{
    requestId: string;
    submittedAt: string;
  }> {
    const response = await this.makeRequest<any>('wallets/request-limit-increase', {
      method: 'POST',
      body: JSON.stringify({ type, requestedAmount, reason })
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to submit limit increase request');
  }

  // Phase 1 Security Methods

  // CBN Compliance Methods

  /**
   * Get CBN compliance status
   */
  async getCBNComplianceStatus(): Promise<any> {
    const response = await this.makeRequest<any>('cbn-compliance/status');
    
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch CBN compliance status');
  }

  /**
   * Get CBN compliance dashboard
   */
  async getCBNComplianceDashboard(): Promise<any> {
    const response = await this.makeRequest<any>('cbn-compliance/dashboard');
    
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch CBN compliance dashboard');
  }

  /**
   * Report CBN incident
   */
  async reportCBNIncident(incident: {
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedSystems?: string[];
    customerImpact?: boolean;
  }): Promise<{
    incidentId: string;
    reportedAt: string;
    cbnReportingDeadline: string;
  }> {
    const response = await this.makeRequest<any>('cbn-compliance/incidents', {
      method: 'POST',
      body: JSON.stringify(incident)
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to report CBN incident');
  }

  /**
   * Get CBN incidents
   */
  async getCBNIncidents(options?: {
    page?: number;
    limit?: number;
    status?: string;
    severity?: string;
  }): Promise<{
    incidents: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.status) params.append('status', options.status);
    if (options?.severity) params.append('severity', options.severity);

    const response = await this.makeRequest<any>(`cbn-compliance/incidents?${params.toString()}`);
    
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch CBN incidents');
  }

  /**
   * Check data localization compliance
   */
  async checkDataLocalization(): Promise<{
    compliant: boolean;
    dataLocations: Array<{
      dataType: string;
      location: string;
      compliant: boolean;
    }>;
  }> {
    const response = await this.makeRequest<any>('cbn-compliance/data-localization/check', {
      method: 'POST'
    });
    
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to check data localization');
  }

  // PCI DSS Compliance Methods

  /**
   * Get PCI DSS compliance status
   */
  async getPCIDSSComplianceStatus(): Promise<any> {
    const response = await this.makeRequest<any>('pci-dss-compliance/status');
    
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch PCI DSS compliance status');
  }

  /**
   * Get PCI DSS compliance dashboard
   */
  async getPCIDSSComplianceDashboard(): Promise<any> {
    const response = await this.makeRequest<any>('pci-dss-compliance/dashboard');
    
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch PCI DSS compliance dashboard');
  }

  /**
   * Create PCI DSS assessment
   */
  async createPCIDSSAssessment(assessment: {
    assessmentType: 'self' | 'external';
    scope: string;
    plannedDate: string;
  }): Promise<{
    assessmentId: string;
    createdAt: string;
    status: string;
  }> {
    const response = await this.makeRequest<any>('pci-dss-compliance/assessments', {
      method: 'POST',
      body: JSON.stringify(assessment)
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to create PCI DSS assessment');
  }

  /**
   * Get PCI DSS assessments
   */
  async getPCIDSSAssessments(): Promise<{
    assessments: any[];
  }> {
    const response = await this.makeRequest<any>('pci-dss-compliance/assessments');
    
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch PCI DSS assessments');
  }

  /**
   * Submit vulnerability scan results
   */
  async submitVulnerabilityScan(scan: {
    scanType: 'external' | 'internal';
    scanDate: string;
    findings: Array<{
      vulnerability: string;
      severity: string;
      status: string;
    }>;
  }): Promise<{
    scanId: string;
    submittedAt: string;
  }> {
    const response = await this.makeRequest<any>('pci-dss-compliance/vulnerability-scans', {
      method: 'POST',
      body: JSON.stringify(scan)
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to submit vulnerability scan');
  }

  /**
   * Get vulnerability scans
   */
  async getVulnerabilityScans(): Promise<{
    scans: any[];
  }> {
    const response = await this.makeRequest<any>('pci-dss-compliance/vulnerability-scans');
    
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch vulnerability scans');
  }

  // Security Monitoring (SIEM) Methods

  /**
   * Get security monitoring dashboard
   */
  async getSecurityMonitoringDashboard(): Promise<any> {
    const response = await this.makeRequest<any>('security-monitoring/dashboard');
    
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch security monitoring dashboard');
  }

  /**
   * Get security alerts
   */
  async getSecurityAlerts(options?: {
    page?: number;
    limit?: number;
    severity?: string;
    status?: string;
  }): Promise<{
    alerts: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.severity) params.append('severity', options.severity);
    if (options?.status) params.append('status', options.status);

    const response = await this.makeRequest<any>(`security-monitoring/alerts?${params.toString()}`);
    
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch security alerts');
  }

  /**
   * Log security event
   */
  async logSecurityEvent(event: {
    eventType: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    source: string;
    metadata?: any;
  }): Promise<{
    eventId: string;
    loggedAt: string;
  }> {
    const response = await this.makeRequest<any>('security-monitoring/events', {
      method: 'POST',
      body: JSON.stringify(event)
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to log security event');
  }

  /**
   * Get audit trail
   */
  async getAuditTrail(options?: {
    startDate?: string;
    endDate?: string;
    eventType?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    events: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.eventType) params.append('eventType', options.eventType);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());

    const response = await this.makeRequest<any>(`security-monitoring/audit-trail?${params.toString()}`);
    
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch audit trail');
  }

  // =====================================================
  // RBAC Methods
  // =====================================================

  /**
   * Get user's RBAC permissions
   */
  async getUserPermissions(): Promise<{
    permissions: Record<string, string>;
    roles: Array<{ roleCode: string; roleName: string; }>;
    isAdmin: boolean;
  }> {
    const response = await this.makeRequest<{
      permissions: Record<string, string>;
      roles: Array<{ roleCode: string; roleName: string; }>;
      isAdmin: boolean;
    }>('rbac/permissions');

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get user permissions');
  }

  /**
   * Get available banking features for current user
   */
  async getAvailableFeatures(): Promise<{
    available: string[];
    restricted: string[];
  }> {
    const response = await this.makeRequest<{
      available: string[];
      restricted: string[];
    }>('rbac/available-features');

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get available features');
  }

  /**
   * Get role-based dashboard metrics
   */
  async getRoleBasedMetrics(): Promise<any> {
    const response = await this.makeRequest<any>('rbac/role-based-metrics');

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get role-based metrics');
  }

  /**
   * Check if user has specific permission
   */
  async checkPermission(permissionCode: string, resourceId?: string): Promise<{
    hasPermission: boolean;
    permissionLevel: string;
    permissionCode: string;
  }> {
    const response = await this.makeRequest<{
      hasPermission: boolean;
      permissionLevel: string;
      permissionCode: string;
    }>('rbac/check-permission', 'POST', {
      permissionCode,
      resourceId
    });

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to check permission');
  }

  // =====================================================
  // RBAC ADMIN MANAGEMENT METHODS
  // =====================================================

  /**
   * Get RBAC admin dashboard data
   */
  async getRBACDashboard(): Promise<{
    totalUsers: number;
    activeRoles: number;
    totalPermissions: number;
    recentAssignments: any[];
    roleDistribution: any[];
  }> {
    const response = await this.makeRequest<any>('rbac/admin/dashboard');

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get RBAC dashboard');
  }

  /**
   * Get all platform roles (platform admin only)
   */
  async getPlatformRoles(): Promise<any[]> {
    const response = await this.makeRequest<any[]>('rbac/admin/platform-roles');

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get platform roles');
  }

  /**
   * Get all platform permissions (platform admin only)
   */
  async getPlatformPermissions(): Promise<{
    permissions: any[];
    groupedByCategory: Record<string, any[]>;
  }> {
    const response = await this.makeRequest<any>('rbac/admin/platform-permissions');

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get platform permissions');
  }

  /**
   * Get permissions for a specific role
   */
  async getRolePermissions(roleCode: string, level: 'platform' | 'tenant' = 'platform'): Promise<{
    roleCode: string;
    roleName: string;
    permissions: any[];
    groupedByCategory: Record<string, any[]>;
    totalPermissions: number;
  }> {
    const response = await this.makeRequest<any>(`rbac/admin/role-permissions/${roleCode}?level=${level}`);

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get role permissions');
  }

  /**
   * Update role permissions
   */
  async updateRolePermissions(roleCode: string, permissions: Array<{code: string, level: string}>, level: 'platform' | 'tenant' = 'platform'): Promise<{
    roleCode: string;
    permissionsUpdated: number;
  }> {
    const response = await this.makeRequest<any>(`rbac/admin/role-permissions/${roleCode}`, 'PUT', {
      permissions,
      level
    });

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to update role permissions');
  }

  /**
   * Get all users with their roles
   */
  async getAllUsers(page: number = 1, limit: number = 50): Promise<{
    users: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  }> {
    const response = await this.makeRequest<any>(`rbac/admin/users?page=${page}&limit=${limit}`);

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get users');
  }

  /**
   * Assign role to user
   */
  async assignUserRole(userId: string, roleCode: string, reason?: string, effectiveFrom?: string, effectiveTo?: string): Promise<void> {
    const response = await this.makeRequest<any>('rbac/assign-role', 'POST', {
      userId,
      roleCode,
      reason,
      effectiveFrom,
      effectiveTo
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to assign role');
    }
  }

  /**
   * Get current user data
   */
  async getCurrentUser(): Promise<LoginResponse['user'] | null> {
    // First try to get from memory
    if (this.currentUser) {
      return this.currentUser;
    }

    // Then try to get from storage
    try {
      const storedUser = await Storage.getItem('user_data');
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
        return this.currentUser;
      }
    } catch (error) {
      // Error loading user data from storage
    }

    // If we have a token, try to fetch from API
    if (this.accessToken) {
      try {
        const response = await this.makeRequest<LoginResponse['user']>('auth/me');
        if (response.success && response.data) {
          this.currentUser = response.data;
          await Storage.setItem('user_data', JSON.stringify(response.data));
          return this.currentUser;
        }
      } catch (error) {
        // Error fetching user data from API
      }
    }

    return null;
  }

  /**
   * Remove role from user
   */
  async removeUserRole(userId: string, roleCode: string): Promise<void> {
    const response = await this.makeRequest<any>('rbac/remove-role', 'DELETE', {
      userId,
      roleCode
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to remove role');
    }
  }

  /**
   * Create custom role
   */
  async createCustomRole(role: {
    code: string;
    name: string;
    description?: string;
    level?: number;
    permissions?: Array<{code: string, level: string}>;
  }): Promise<{
    role: any;
    permissionsAssigned: number;
  }> {
    const response = await this.makeRequest<any>('rbac/admin/create-role', 'POST', role);

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to create role');
  }

  /**
   * Get RBAC audit trail
   */
  async getRBACaudit(page: number = 1, limit: number = 50, filters?: {
    userId?: string;
    resource?: string;
    action?: string;
  }): Promise<{
    auditTrail: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.resource) params.append('resource', filters.resource);
    if (filters?.action) params.append('action', filters.action);

    const response = await this.makeRequest<any>(`rbac/audit-trail?${params.toString()}`);

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get audit trail');
  }

  /**
   * Get enhanced dashboard data with complete RBAC context
   * This replaces mock data in EnhancedDashboardScreen
   */
  async getEnhancedDashboardData(): Promise<{
    userContext: {
      id: string;
      email: string;
      fullName: string;
      role: string;
      permissions: Record<string, string>;
      tenantId: string;
      branchId?: string;
      department?: string;
      isActive: boolean;
      lastLogin: Date;
      rbacRoles: any[];
    };
    permissions: Record<string, string>;
    availableFeatures: string[];
    restrictedFeatures: string[];
    roleBasedMetrics: any;
    aiSuggestions: any[];
    pendingApprovals: any[];
    isAdmin: boolean;
  }> {
    const response = await this.makeRequest<any>('rbac/enhanced-dashboard-data');

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get enhanced dashboard data');
  }
}

export default APIService.getInstance();