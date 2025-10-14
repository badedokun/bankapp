/**
 * AI Assistant Panel Component
 * Enhanced AI interface with role-based suggestions and preserved conversational features
 * Maintains existing AI capabilities while adding Nigerian banking context
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface AISuggestion {
  id: string;
  type: 'repeat' | 'bills' | 'budget' | 'compliance' | 'operations' | 'analysis' | 'approval';
  icon: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  roleSpecific: string[];
}

interface AIAssistantPanelProps {
  aiSuggestions: AISuggestion[];
  userRole: string;
  onNavigateToAIChat?: () => void;
  onSuggestionPress: (suggestionId: string, params?: any) => void;
  theme?: any;
}

// Generate role-specific AI suggestions for Nigerian banking
const generateRoleSpecificSuggestions = (role: string): AISuggestion[] => {
  const roleSuggestions: Record<string, AISuggestion[]> = {
    platform_admin: [
      {
        id: 'platform_health_check',
        type: 'operations',
        icon: '⚡',
        title: 'Platform Health Check',
        description: 'Review system performance across all tenant banks and identify optimization opportunities.',
        priority: 'high',
        roleSpecific: ['platform_admin']
      },
      {
        id: 'tenant_onboarding_review',
        type: 'operations',
        icon: '🏦',
        title: 'Tenant Onboarding Pipeline',
        description: 'Check pending bank applications and accelerate high-priority onboarding processes.',
        priority: 'medium',
        roleSpecific: ['platform_admin']
      },
      {
        id: 'revenue_optimization',
        type: 'analysis',
        icon: '💎',
        title: 'Revenue Optimization Analysis',
        description: 'Analyze subscription patterns and identify upselling opportunities across tenants.',
        priority: 'medium',
        roleSpecific: ['platform_admin']
      }
    ],

    ceo: [
      {
        id: 'regulatory_compliance_summary',
        type: 'compliance',
        icon: '📊',
        title: 'CBN Compliance Summary',
        description: 'Generate comprehensive compliance report for board meeting and regulatory submissions.',
        priority: 'high',
        roleSpecific: ['ceo']
      },
      {
        id: 'strategic_performance_review',
        type: 'analysis',
        icon: '🎯',
        title: 'Strategic Performance Review',
        description: 'Analyze bank performance against KPIs and market competitors in Nigerian microfinance sector.',
        priority: 'high',
        roleSpecific: ['ceo']
      },
      {
        id: 'risk_management_overview',
        type: 'analysis',
        icon: '🛡️',
        title: 'Enterprise Risk Assessment',
        description: 'Review credit risk, operational risk, and regulatory risk across all banking operations.',
        priority: 'medium',
        roleSpecific: ['ceo']
      }
    ],

    deputy_md: [
      {
        id: 'operations_efficiency_analysis',
        type: 'operations',
        icon: '⚙️',
        title: 'Operations Efficiency Analysis',
        description: 'Identify bottlenecks in daily operations and recommend process improvements.',
        priority: 'high',
        roleSpecific: ['deputy_md']
      },
      {
        id: 'staff_performance_review',
        type: 'operations',
        icon: '👥',
        title: 'Staff Performance Insights',
        description: 'Review team performance metrics and identify training or recognition opportunities.',
        priority: 'medium',
        roleSpecific: ['deputy_md']
      },
      {
        id: 'approval_workflow_optimization',
        type: 'operations',
        icon: '⏳',
        title: 'Approval Workflow Review',
        description: 'Streamline pending approvals and optimize authorization processes.',
        priority: 'high',
        roleSpecific: ['deputy_md']
      }
    ],

    branch_manager: [
      {
        id: 'branch_performance_analysis',
        type: 'analysis',
        icon: '🏦',
        title: 'Branch Performance Analysis',
        description: 'Deep dive into branch metrics, customer satisfaction, and revenue generation.',
        priority: 'high',
        roleSpecific: ['branch_manager']
      },
      {
        id: 'customer_relationship_insights',
        type: 'analysis',
        icon: '🤝',
        title: 'Customer Relationship Insights',
        description: 'Identify high-value customers, retention opportunities, and cross-selling potential.',
        priority: 'medium',
        roleSpecific: ['branch_manager']
      },
      {
        id: 'staff_scheduling_optimization',
        type: 'operations',
        icon: '📅',
        title: 'Staff Scheduling Optimization',
        description: 'Optimize branch staffing based on transaction patterns and customer flow.',
        priority: 'low',
        roleSpecific: ['branch_manager']
      }
    ],

    operations_manager: [
      {
        id: 'transaction_pattern_analysis',
        type: 'analysis',
        icon: '📈',
        title: 'Transaction Pattern Analysis',
        description: 'Analyze transaction flows, peak times, and capacity planning requirements.',
        priority: 'high',
        roleSpecific: ['operations_manager']
      },
      {
        id: 'system_performance_monitoring',
        type: 'operations',
        icon: '💻',
        title: 'System Performance Monitoring',
        description: 'Monitor banking system performance and predict maintenance requirements.',
        priority: 'high',
        roleSpecific: ['operations_manager']
      },
      {
        id: 'process_automation_opportunities',
        type: 'operations',
        icon: '🔄',
        title: 'Process Automation Review',
        description: 'Identify manual processes that can be automated to improve efficiency.',
        priority: 'medium',
        roleSpecific: ['operations_manager']
      }
    ],

    credit_manager: [
      {
        id: 'credit_risk_portfolio_analysis',
        type: 'analysis',
        icon: '📊',
        title: 'Credit Risk Portfolio Analysis',
        description: 'Comprehensive review of loan portfolio health, default predictions, and risk mitigation.',
        priority: 'critical',
        roleSpecific: ['credit_manager']
      },
      {
        id: 'loan_approval_insights',
        type: 'analysis',
        icon: '💳',
        title: 'Loan Approval Insights',
        description: 'Analyze approval patterns, success rates, and recommend policy adjustments.',
        priority: 'high',
        roleSpecific: ['credit_manager']
      },
      {
        id: 'market_credit_trends',
        type: 'analysis',
        icon: '🌍',
        title: 'Nigerian Credit Market Trends',
        description: 'Review market trends in Nigerian microfinance and adjust lending strategies.',
        priority: 'medium',
        roleSpecific: ['credit_manager']
      }
    ],

    compliance_officer: [
      {
        id: 'cbn_regulatory_updates',
        type: 'compliance',
        icon: '⚖️',
        title: 'CBN Regulatory Updates',
        description: 'Latest Central Bank of Nigeria regulations and compliance requirements for MFBs.',
        priority: 'critical',
        roleSpecific: ['compliance_officer']
      },
      {
        id: 'aml_transaction_monitoring',
        type: 'compliance',
        icon: '🔍',
        title: 'AML Transaction Monitoring',
        description: 'Review suspicious transaction patterns and ensure BSA/AML compliance.',
        priority: 'high',
        roleSpecific: ['compliance_officer']
      },
      {
        id: 'audit_preparation_checklist',
        type: 'compliance',
        icon: '📋',
        title: 'Audit Preparation Checklist',
        description: 'Prepare comprehensive documentation for upcoming regulatory audits.',
        priority: 'high',
        roleSpecific: ['compliance_officer']
      }
    ],

    relationship_manager: [
      {
        id: 'customer_portfolio_optimization',
        type: 'analysis',
        icon: '🎯',
        title: 'Customer Portfolio Optimization',
        description: 'Optimize your customer portfolio for maximum relationship value and satisfaction.',
        priority: 'high',
        roleSpecific: ['relationship_manager']
      },
      {
        id: 'cross_selling_opportunities',
        type: 'analysis',
        icon: '💡',
        title: 'Cross-Selling Opportunities',
        description: 'Identify customers who would benefit from additional banking products.',
        priority: 'medium',
        roleSpecific: ['relationship_manager']
      },
      {
        id: 'customer_retention_strategies',
        type: 'analysis',
        icon: '🤝',
        title: 'Customer Retention Strategies',
        description: 'Proactive strategies to retain high-value customers and improve satisfaction.',
        priority: 'medium',
        roleSpecific: ['relationship_manager']
      }
    ],

    loan_officer: [
      {
        id: 'loan_application_prioritization',
        type: 'operations',
        icon: '📄',
        title: 'Loan Application Prioritization',
        description: 'Prioritize your loan queue based on risk scores and approval likelihood.',
        priority: 'high',
        roleSpecific: ['loan_officer']
      },
      {
        id: 'credit_scoring_insights',
        type: 'analysis',
        icon: '🎯',
        title: 'Credit Scoring Insights',
        description: 'Improve credit assessment accuracy with AI-powered scoring insights.',
        priority: 'high',
        roleSpecific: ['loan_officer']
      },
      {
        id: 'loan_performance_tracking',
        type: 'analysis',
        icon: '📈',
        title: 'Loan Performance Tracking',
        description: 'Track performance of loans you have approved and identify success patterns.',
        priority: 'medium',
        roleSpecific: ['loan_officer']
      }
    ],

    customer_service: [
      {
        id: 'customer_issue_resolution',
        type: 'operations',
        icon: '🎫',
        title: 'Customer Issue Resolution',
        description: 'AI-powered recommendations for resolving customer complaints efficiently.',
        priority: 'high',
        roleSpecific: ['customer_service']
      },
      {
        id: 'service_quality_improvement',
        type: 'analysis',
        icon: '⭐',
        title: 'Service Quality Insights',
        description: 'Analyze customer feedback and identify service improvement opportunities.',
        priority: 'medium',
        roleSpecific: ['customer_service']
      },
      {
        id: 'customer_education_opportunities',
        type: 'operations',
        icon: '📚',
        title: 'Customer Education Opportunities',
        description: 'Identify customers who would benefit from financial literacy programs.',
        priority: 'low',
        roleSpecific: ['customer_service']
      }
    ],

    head_teller: [
      {
        id: 'cash_flow_optimization',
        type: 'operations',
        icon: '💰',
        title: 'Cash Flow Optimization',
        description: 'Optimize cash drawer levels and predict cash requirements.',
        priority: 'high',
        roleSpecific: ['head_teller']
      },
      {
        id: 'teller_performance_monitoring',
        type: 'operations',
        icon: '📊',
        title: 'Teller Performance Monitoring',
        description: 'Monitor teller efficiency and identify training opportunities.',
        priority: 'medium',
        roleSpecific: ['head_teller']
      },
      {
        id: 'transaction_accuracy_analysis',
        type: 'analysis',
        icon: '✅',
        title: 'Transaction Accuracy Analysis',
        description: 'Review transaction accuracy rates and implement error reduction strategies.',
        priority: 'medium',
        roleSpecific: ['head_teller']
      }
    ],

    bank_teller: [
      {
        id: 'daily_transaction_summary',
        type: 'operations',
        icon: '📝',
        title: 'Daily Transaction Summary',
        description: 'Review your daily transaction performance and cash balancing status.',
        priority: 'high',
        roleSpecific: ['bank_teller']
      },
      {
        id: 'customer_service_tips',
        type: 'operations',
        icon: '💡',
        title: 'Customer Service Tips',
        description: 'AI-powered tips to improve customer interactions and service quality.',
        priority: 'low',
        roleSpecific: ['bank_teller']
      },
      {
        id: 'efficiency_improvements',
        type: 'operations',
        icon: '⚡',
        title: 'Efficiency Improvements',
        description: 'Personalized suggestions to improve your transaction processing speed.',
        priority: 'medium',
        roleSpecific: ['bank_teller']
      }
    ],

    credit_analyst: [
      {
        id: 'credit_model_optimization',
        type: 'analysis',
        icon: '🧮',
        title: 'Credit Model Optimization',
        description: 'Improve credit scoring models based on recent performance data.',
        priority: 'high',
        roleSpecific: ['credit_analyst']
      },
      {
        id: 'risk_pattern_analysis',
        type: 'analysis',
        icon: '📈',
        title: 'Risk Pattern Analysis',
        description: 'Identify emerging risk patterns in loan applications and market trends.',
        priority: 'high',
        roleSpecific: ['credit_analyst']
      },
      {
        id: 'market_research_insights',
        type: 'analysis',
        icon: '🔍',
        title: 'Market Research Insights',
        description: 'Latest insights on Nigerian microfinance market and lending trends.',
        priority: 'medium',
        roleSpecific: ['credit_analyst']
      }
    ]
  };

  return roleSuggestions[role] || [];
};

// Fallback theme for when theme is not available
const FALLBACK_THEME = {
  colors: {
    surface: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    primary: '#010080', // Navy blue (FMFB-compatible fallback)
    background: '#F9FAFB',
  }
};

const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  aiSuggestions,
  userRole,
  onNavigateToAIChat,
  onSuggestionPress,
  theme = FALLBACK_THEME
}) => {
  // Ensure theme has all required properties
  const safeTheme = {
    colors: {
      surface: theme?.colors?.surface || FALLBACK_THEME.colors.surface,
      text: theme?.colors?.text || FALLBACK_THEME.colors.text,
      textSecondary: theme?.colors?.textSecondary || FALLBACK_THEME.colors.textSecondary,
      primary: theme?.colors?.primary || FALLBACK_THEME.colors.primary,
      background: theme?.colors?.background || FALLBACK_THEME.colors.background,
    }
  };
  // Combine provided suggestions with role-specific ones
  const roleSpecificSuggestions = generateRoleSpecificSuggestions(userRole);
  const allSuggestions = [...(aiSuggestions || []), ...roleSpecificSuggestions].slice(0, 4); // Limit to 4 suggestions

  const getPriorityColor = (priority: string): string => {
    const colors = {
      critical: '#ef4444',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#10b981'
    };
    return colors[priority] || colors.medium;
  };

  const getPriorityIcon = (priority: string): string => {
    const icons = {
      critical: '🚨',
      high: '⚡',
      medium: '💡',
      low: '✨'
    };
    return icons[priority] || icons.medium;
  };

  return (
    <View style={[styles.container, { backgroundColor: safeTheme.colors.surface }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: safeTheme.colors.text }]}>
            🤖 AI Banking Assistant
          </Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
            <Text style={[styles.statusText, { color: '#22c55e' }]}>
              Online & Ready
            </Text>
          </View>
        </View>
        <Text style={[styles.roleIndicator, { color: safeTheme.colors.textSecondary }]}>
          {userRole.replace('_', ' ').toUpperCase()}
        </Text>
      </View>

      {/* AI Chat Button - Preserved from original */}
      <TouchableOpacity
        style={[styles.aiChatButton, { backgroundColor: safeTheme.colors.primary }]}
        onPress={onNavigateToAIChat}
      >
        <Text style={styles.aiChatButtonIcon}>💬</Text>
        <Text style={styles.aiChatButtonText}>Open AI Chat</Text>
        <Text style={styles.aiChatButtonSubtext}>
          Full conversational assistant with Nigerian banking expertise
        </Text>
      </TouchableOpacity>

      {/* Role-Specific AI Suggestions */}
      {allSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={[styles.suggestionsTitle, { color: safeTheme.colors.text }]}>
            Smart Suggestions for {userRole.replace('_', ' ')}
          </Text>

          {allSuggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion.id}
              style={[
                styles.suggestionCard,
                {
                  backgroundColor: safeTheme.colors.background,
                  borderColor: getPriorityColor(suggestion.priority)
                }
              ]}
              onPress={() => onSuggestionPress(suggestion.type, { suggestion })}
              activeOpacity={0.7}
            >
              <View style={styles.suggestionHeader}>
                <View style={styles.suggestionIconContainer}>
                  <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
                  <Text style={styles.priorityIcon}>
                    {getPriorityIcon(suggestion.priority)}
                  </Text>
                </View>
                <View style={styles.suggestionContent}>
                  <Text style={[styles.suggestionTitle, { color: safeTheme.colors.text }]}>
                    {suggestion.title}
                  </Text>
                  <Text style={[styles.suggestionDescription, { color: safeTheme.colors.textSecondary }]}>
                    {suggestion.description}
                  </Text>
                  <View style={styles.suggestionMeta}>
                    <View style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityColor(suggestion.priority) }
                    ]}>
                      <Text style={styles.priorityText}>
                        {suggestion.priority.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.typeText, { color: safeTheme.colors.textSecondary }]}>
                      {suggestion.type.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* AI Capabilities Summary */}
      <View style={[styles.capabilitiesContainer, { backgroundColor: safeTheme.colors.background }]}>
        <Text style={[styles.capabilitiesTitle, { color: safeTheme.colors.text }]}>
          💡 AI Capabilities
        </Text>
        <Text style={[styles.capabilitiesText, { color: safeTheme.colors.textSecondary }]}>
          Your AI assistant can help with balance inquiries, transaction analysis, loan processing,
          compliance monitoring, risk assessment, customer insights, and Nigerian banking regulations.
          Simply ask in natural language or click suggestions above.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  roleIndicator: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  aiChatButton: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  aiChatButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  aiChatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  aiChatButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  suggestionsContainer: {
    marginBottom: 16,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  suggestionCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  suggestionHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  suggestionIconContainer: {
    position: 'relative',
  },
  suggestionIcon: {
    fontSize: 20,
  },
  priorityIcon: {
    position: 'absolute',
    top: -2,
    right: -2,
    fontSize: 10,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  suggestionDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  suggestionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  typeText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  capabilitiesContainer: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  capabilitiesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  capabilitiesText: {
    fontSize: 11,
    lineHeight: 15,
  },
});

export default AIAssistantPanel;