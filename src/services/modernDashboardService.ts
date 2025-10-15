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
  private apiClient: any;

  constructor() {
    this.apiClient = APIClient.getInstance();
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
   * Backend endpoint: GET /api/ai/analytics/insights
   */
  async getAIInsights(userId: string, userRole: string, permissions: Record<string, string>): Promise<AIInsight[]> {
    try {
      const response = await this.apiClient.get('/ai/analytics/insights');

      // Transform backend insights format to frontend format
      const backendInsights = response.insights || {};
      const insights = backendInsights.insights || [];
      const recommendations = backendInsights.recommendations || [];

      // Map backend insights to frontend AIInsight format
      const mappedInsights: AIInsight[] = insights.map((insight: any, index: number) => ({
        id: `insight-${index}`,
        type: 'insight' as const,
        title: insight.category.charAt(0).toUpperCase() + insight.category.slice(1),
        message: insight.value,
        priority: insight.trend === 'high' ? 'high' as const : 'medium' as const,
        actionable: false,
        createdAt: new Date().toISOString()
      }));

      // Add recommendations as actionable insights
      const mappedRecommendations: AIInsight[] = recommendations.map((rec: string, index: number) => ({
        id: `recommendation-${index}`,
        type: 'recommendation' as const,
        title: 'Financial Recommendation',
        message: rec,
        priority: 'medium' as const,
        actionable: true,
        createdAt: new Date().toISOString()
      }));

      return [...mappedInsights, ...mappedRecommendations];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get smart suggestions for financial actions
   * Backend endpoint: GET /api/ai/suggestions (no userId param)
   */
  async getSmartSuggestions(userId: string, permissions: Record<string, string>): Promise<SmartSuggestion[]> {
    try {
      const response = await this.apiClient.get('/ai/suggestions');

      // Backend returns array of string suggestions
      const suggestions = response.suggestions || [];

      // Transform string suggestions to SmartSuggestion format
      return suggestions.map((suggestion: string, index: number) => ({
        id: `suggestion-${index}`,
        category: this.categorizeSuggestion(suggestion),
        title: suggestion,
        description: `AI-powered suggestion based on your account activity`,
        confidence: 0.85,
        estimatedBenefit: undefined,
        actionRequired: suggestion.toLowerCase().includes('check') || suggestion.toLowerCase().includes('transfer')
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Helper to categorize suggestions
   */
  private categorizeSuggestion(suggestion: string): 'transfer' | 'savings' | 'spending' | 'investment' {
    const lower = suggestion.toLowerCase();
    if (lower.includes('transfer') || lower.includes('send')) return 'transfer';
    if (lower.includes('save') || lower.includes('savings')) return 'savings';
    if (lower.includes('spend') || lower.includes('bill')) return 'spending';
    return 'investment';
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