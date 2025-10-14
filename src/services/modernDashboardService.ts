/**
 * Modern Dashboard Service
 * Handles data fetching and API integration for modern dashboard components
 * Supports multi-tenant and RBAC-aware data filtering
 */

import { APIClient } from './api';

export interface DashboardMetrics {
  totalBalance: number;
  monthlyTransactions: number;
  accountStatus: string;
  availableCredit: number;
  spendingTrend: 'up' | 'down' | 'stable';
  savingsGoalProgress: number;
}

export interface AIInsight {
  id: string;
  type: 'recommendation' | 'alert' | 'insight' | 'tip';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  actionLabel?: string;
  actionData?: any;
  createdAt: string;
}

export interface SmartSuggestion {
  id: string;
  category: 'transfer' | 'savings' | 'spending' | 'investment';
  title: string;
  description: string;
  confidence: number;
  estimatedBenefit?: string;
  actionRequired: boolean;
}

class ModernDashboardService {
  private apiClient: APIClient;

  constructor() {
    this.apiClient = new APIClient();
  }

  /**
   * Fetch comprehensive dashboard metrics with RBAC filtering
   */
  async getDashboardMetrics(userId: string, permissions: Record<string, string>): Promise<DashboardMetrics> {
    try {
      const response = await this.apiClient.get(`/analytics/dashboard/${userId}`, {
        include_permissions: Object.keys(permissions).join(',')
      });

      return {
        totalBalance: response.data.balance || 0,
        monthlyTransactions: response.data.transaction_count || 0,
        accountStatus: response.data.account_status || 'active',
        availableCredit: response.data.credit_limit || 0,
        spendingTrend: response.data.spending_trend || 'stable',
        savingsGoalProgress: response.data.savings_progress || 0
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get AI-powered insights based on user behavior and permissions
   */
  async getAIInsights(userId: string, userRole: string, permissions: Record<string, string>): Promise<AIInsight[]> {
    try {
      const response = await this.apiClient.post('/ai/insights', {
        user_id: userId,
        user_role: userRole,
        permissions: permissions,
        context: 'dashboard'
      });

      return response.data.insights || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get smart suggestions for financial actions
   */
  async getSmartSuggestions(userId: string, permissions: Record<string, string>): Promise<SmartSuggestion[]> {
    try {
      const response = await this.apiClient.get(`/ai/suggestions/${userId}`, {
        permissions: Object.keys(permissions).join(','),
        limit: 4
      });

      return response.data.suggestions || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Submit AI chat interaction with context
   */
  async submitAIInteraction(
    userId: string,
    message: string,
    context: {
      userRole: string;
      permissions: Record<string, string>;
      currentPage: string;
      dashboardData?: any;
    }
  ): Promise<{ response: string; actions?: any[] }> {
    try {
      const response = await this.apiClient.post('/ai/chat', {
        user_id: userId,
        message: message,
        context: {
          ...context,
          timestamp: new Date().toISOString()
        }
      });

      return {
        response: response.data.response,
        actions: response.data.suggested_actions || []
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get real-time notifications with RBAC filtering
   */
  async getNotifications(userId: string, permissions: Record<string, string>): Promise<any[]> {
    try {
      const response = await this.apiClient.get(`/notifications/${userId}`, {
        include_permissions: Object.keys(permissions).join(','),
        limit: 10
      });

      return response.data.notifications || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Track user interaction for analytics
   */
  async trackInteraction(
    userId: string,
    interaction: {
      type: string;
      feature: string;
      data?: any;
    }
  ): Promise<void> {
    try {
      await this.apiClient.post('/analytics/interactions', {
        user_id: userId,
        interaction_type: interaction.type,
        feature: interaction.feature,
        data: interaction.data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Non-blocking - analytics failures shouldn't affect UX
    }
  }

  /**
   * Get tenant-specific feature configuration
   */
  async getTenantFeatures(tenantId: string): Promise<{ [feature: string]: boolean }> {
    try {
      const response = await this.apiClient.get(`/tenants/${tenantId}/features`);
      return response.data.features || {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Refresh dashboard data with optimistic updates
   */
  async refreshDashboardData(userId: string, permissions: Record<string, string>) {
    const promises = [
      this.getDashboardMetrics(userId, permissions),
      this.getAIInsights(userId, 'user', permissions),
      this.getSmartSuggestions(userId, permissions),
      this.getNotifications(userId, permissions)
    ];

    try {
      const [metrics, insights, suggestions, notifications] = await Promise.allSettled(promises);

      return {
        metrics: metrics.status === 'fulfilled' ? metrics.value : null,
        insights: insights.status === 'fulfilled' ? insights.value : [],
        suggestions: suggestions.status === 'fulfilled' ? suggestions.value : [],
        notifications: notifications.status === 'fulfilled' ? notifications.value : [],
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      throw error;
    }
  }
}

export const modernDashboardService = new ModernDashboardService();
export default modernDashboardService;