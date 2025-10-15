/**
 * Modern AI Assistant Component - Enhanced Glassmorphism Design
 * Replaces existing AIAssistantPanel with modern Revolut-style interface
 * Maintains RBAC integration and tenant theming
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface ModernAIAssistantProps {
  theme: any;
  userRole: string;
  userPermissions: Record<string, string>;
  onAIInteraction: () => void;
  isExpanded?: boolean;
}

const ModernAIAssistant: React.FC<ModernAIAssistantProps> = ({
  theme,
  userRole,
  userPermissions,
  onAIInteraction,
  isExpanded = false
}) => {
  const [isMinimized, setIsMinimized] = useState(!isExpanded);

  // Permission checking
  const hasPermission = (permission: string, level: string = 'read') => {
    const userLevel = userPermissions[permission] || 'none';
    const levels = ['none', 'read', 'write', 'full'];
    return levels.indexOf(userLevel) >= levels.indexOf(level);
  };

  // Admin gets everything for development
  const isDevAdmin = userRole === 'admin' || hasPermission('platform_administration', 'full');
  const canAccessAI = isDevAdmin || hasPermission('access_ai_chat');

  if (!canAccessAI) {
    return null;
  }

  // AI capabilities based on role and permissions
  const getAICapabilities = () => {
    const capabilities = [];

    if (hasPermission('view_account_balance') || isDevAdmin) {
      capabilities.push('Balance inquiries');
    }
    if (hasPermission('view_transaction_history') || isDevAdmin) {
      capabilities.push('Transaction analysis');
    }
    if (hasPermission('internal_transfers', 'write') || isDevAdmin) {
      capabilities.push('Transfer assistance');
    }
    if (hasPermission('view_loan_applications') || isDevAdmin) {
      capabilities.push('Loan guidance');
    }
    if (hasPermission('bank_performance_dashboard') || isDevAdmin) {
      capabilities.push('Financial insights');
    }
    if (hasPermission('fraud_detection') || isDevAdmin) {
      capabilities.push('Security alerts');
    }

    return capabilities;
  };

  const capabilities = getAICapabilities();

  // Suggested actions based on permissions
  const getSuggestedActions = () => {
    const actions = [];

    if (hasPermission('view_account_balance') || isDevAdmin) {
      actions.push({ icon: '💰', text: 'Check balance', action: 'balance' });
    }
    if (hasPermission('internal_transfers', 'write') || isDevAdmin) {
      actions.push({ icon: '💸', text: 'Send money', action: 'transfer' });
    }
    if (hasPermission('view_transaction_history') || isDevAdmin) {
      actions.push({ icon: '📊', text: 'Analyze spending', action: 'analysis' });
    }
    if (hasPermission('view_loan_applications') || isDevAdmin) {
      actions.push({ icon: '💳', text: 'Loan options', action: 'loans' });
    }

    return actions.slice(0, 4); // Limit to 4 actions
  };

  const suggestedActions = getSuggestedActions();

  const handleMinimizeToggle = () => {
    setIsMinimized(!isMinimized);
  };

  const handleActionPress = (action: string) => {
    // Handle specific AI actions
    onAIInteraction();
  };

  if (isMinimized) {
    return (
      <TouchableOpacity
        style={[styles.minimizedContainer, {
          backgroundColor: theme.colors.primary,
          shadowColor: theme.colors.primary
        }]}
        onPress={handleMinimizeToggle}
        activeOpacity={0.8}
      >
        <Text style={styles.minimizedIcon}>🤖</Text>
        <Text style={styles.minimizedText}>AI Assistant</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.aiPanel, {
        backgroundColor: theme.colors.glassBackground,
        borderColor: theme.colors.glassBorder
      }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.aiAvatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.aiAvatarText}>🤖</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.aiTitle, { color: theme.colors.text }]}>
                AI Banking Assistant
              </Text>
              <Text style={[styles.aiSubtitle, { color: theme.colors.textSecondary }]}>
                Powered by {theme.brandName || 'OrokiiPay'} Intelligence
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.minimizeButton}
            onPress={handleMinimizeToggle}
            activeOpacity={0.7}
          >
            <Text style={[styles.minimizeIcon, { color: theme.colors.textSecondary }]}>
              ✕
            </Text>
          </TouchableOpacity>
        </View>

        {/* Status */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
            Online • Ready to assist
          </Text>
        </View>

        {/* Capabilities */}
        <View style={styles.capabilitiesContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            I can help you with:
          </Text>
          <View style={styles.capabilitiesList}>
            {capabilities.map((capability, index) => (
              <View key={index} style={styles.capabilityItem}>
                <Text style={[styles.capabilityDot, { color: theme.colors.primary }]}>
                  •
                </Text>
                <Text style={[styles.capabilityText, { color: theme.colors.textSecondary }]}>
                  {capability}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        {suggestedActions.length > 0 && (
          <View style={styles.actionsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Quick Actions:
            </Text>
            <View style={styles.actionsGrid}>
              {suggestedActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.actionButton, {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border
                  }]}
                  onPress={() => handleActionPress(action.action)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionIcon}>{action.icon}</Text>
                  <Text style={[styles.actionText, { color: theme.colors.text }]}>
                    {action.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Chat Button */}
        <TouchableOpacity
          style={[styles.chatButton, {
            backgroundColor: theme.colors.primary,
            shadowColor: theme.colors.primary
          }]}
          onPress={onAIInteraction}
          activeOpacity={0.8}
        >
          <Text style={styles.chatButtonIcon}>💬</Text>
          <Text style={styles.chatButtonText}>Start Conversation</Text>
        </TouchableOpacity>

        {/* Permission Level Indicator */}
        <View style={styles.permissionIndicator}>
          <Text style={[styles.permissionText, { color: theme.colors.textSecondary }]}>
            Access Level: {isDevAdmin ? 'Full Access' :
              hasPermission('access_ai_chat', 'write') ? 'Enhanced' : 'Basic'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  aiPanel: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    // backdropFilter: 'blur(20px)', // Not supported in React Native
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiAvatarText: {
    fontSize: 20,
  },
  headerText: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  aiSubtitle: {
    fontSize: 12,
  },
  minimizeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minimizeIcon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  capabilitiesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  capabilitiesList: {
    gap: 8,
  },
  capabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  capabilityDot: {
    fontSize: 16,
    marginRight: 8,
    fontWeight: 'bold',
  },
  capabilityText: {
    fontSize: 12,
    flex: 1,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    width: (screenWidth - 88) / 2,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  chatButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  permissionIndicator: {
    alignItems: 'center',
  },
  permissionText: {
    fontSize: 10,
    fontWeight: '500',
  },
  minimizedContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 1000,
  },
  minimizedIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  minimizedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
}) as any;

export default ModernAIAssistant;