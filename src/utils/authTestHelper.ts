/**
 * Authentication Test Helper
 * Utilities for testing the API integration
 */

import APIService from '../services/api';
import { Storage } from './storage';

export class AuthTestHelper {
  /**
   * Clear all authentication data
   */
  static async clearAuth(): Promise<void> {
    try {
      await Storage.removeItem('access_token');
      await Storage.removeItem('refresh_token');
      await Storage.removeItem('demo_mode');
      console.log('✅ Authentication data cleared');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  /**
   * Test API connectivity
   */
  static async testAPIConnection(): Promise<boolean> {
    try {
      const health = await APIService.healthCheck();
      console.log('✅ API Server Health:', health);
      return true;
    } catch (error) {
      console.error('❌ API Server not accessible:', error);
      return false;
    }
  }

  /**
   * Test login with demo credentials
   */
  static async testLogin(): Promise<boolean> {
    try {
      console.log('🧪 Testing login with demo@fmfb.com...');
      
      const loginResponse = await APIService.login({
        email: 'demo@fmfb.com',
        password: 'Demo@123!',
        tenantId: 'fmfb'
      });

      console.log('✅ Login successful:', {
        user: `${loginResponse.user.firstName} ${loginResponse.user.lastName}`,
        email: loginResponse.user.email,
        tenant: loginResponse.user.tenant.displayName,
        balance: loginResponse.user.wallet?.availableBalance,
        hasToken: !!loginResponse.tokens.access
      });

      return true;
    } catch (error) {
      console.error('❌ Login test failed:', error);
      return false;
    }
  }

  /**
   * Test profile retrieval
   */
  static async testProfile(): Promise<boolean> {
    try {
      console.log('🧪 Testing profile retrieval...');
      
      const profile = await APIService.getProfile();
      
      console.log('✅ Profile retrieved:', {
        user: `${profile.firstName} ${profile.lastName}`,
        email: profile.email,
        role: profile.role,
        tenant: profile.tenant.displayName,
        kycStatus: profile.kycStatus,
        balance: profile.wallet?.availableBalance
      });

      return true;
    } catch (error) {
      console.error('❌ Profile test failed:', error);
      return false;
    }
  }

  /**
   * Run all tests
   */
  static async runAllTests(): Promise<void> {
    console.log('🚀 Starting Authentication Tests...\n');

    // Clear existing auth
    await this.clearAuth();

    // Test API connection
    const apiConnected = await this.testAPIConnection();
    if (!apiConnected) {
      console.log('❌ API tests aborted - server not accessible');
      return;
    }

    console.log(''); // Add spacing

    // Test login
    const loginSuccess = await this.testLogin();
    if (!loginSuccess) {
      console.log('❌ Remaining tests skipped due to login failure');
      return;
    }

    console.log(''); // Add spacing

    // Test profile
    await this.testProfile();

    console.log('\n🎉 All authentication tests completed!');
  }
}

// Make it available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).authTest = AuthTestHelper;
  (window as any).apiService = APIService;
  console.log('🔧 Development tools loaded: window.authTest, window.apiService');
}