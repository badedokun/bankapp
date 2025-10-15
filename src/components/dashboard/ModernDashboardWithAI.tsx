/**
 * Modern Dashboard with AI Assistant - Glassmorphism Design
 * Matches the dashboard-modern-with-ai.html mockup exactly
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  Platform,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';
import { useTenantTheme } from '../../context/TenantThemeContext';
import Typography from '../ui/Typography';
import { TierProgressIndicator } from '../rewards';
import APIService from '../../services/api';
import ENV_CONFIG, { buildApiUrl } from '../../config/environment';

const { width: screenWidth } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface ModernDashboardWithAIProps {
  userContext: any;
  dashboardData: any;
  onNavigateToTransactionDetails: (transactionId: string) => void;
  onFeatureNavigation: (feature: string, params?: any) => void;
  onAIAssistantPress: () => void;
  onLogout?: () => void;
  onSettings?: () => void;
  theme: any;
}

export const ModernDashboardWithAI: React.FC<ModernDashboardWithAIProps> = ({
  userContext,
  dashboardData,
  onNavigateToTransactionDetails,
  onFeatureNavigation,
  onAIAssistantPress,
  onLogout,
  onSettings,
  theme,
}) => {
  const { theme: tenantTheme, currentTenant } = useTenantTheme() as any;
  const styles = useMemo(() => getStyles(tenantTheme), [tenantTheme]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [aiInput, setAIInput] = useState('');
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const profileMenuRef = useRef<any>(null);
  const profileButtonRef = useRef<any>(null);

  // AI Chat state
  const [aiMessages, setAIMessages] = useState<Array<{id: string; text: string; sender: 'user' | 'ai'; timestamp: Date}>>([
    {
      id: '1',
      text: 'Hello! I can help you with transfers, account inquiries, bill payments, and financial planning. What would you like to do today?',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [isAITyping, setIsAITyping] = useState(false);
  const conversationIdRef = useRef(`conv_${Date.now()}`);

  // AI Suggestions state
  const [aiSuggestions, setAISuggestions] = useState<{
    savings?: { title: string; description: string; potentialSavings: number; action: string };
    investment?: { title: string; description: string; action: string };
    bills?: { title: string; description: string; totalAmount: number; billCount: number; action: string };
  }>({});
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  // Debug effect to log showProfileMenu state changes
  useEffect(() => {
    console.log('🟢 showProfileMenu state changed to:', showProfileMenu);
  }, [showProfileMenu]);

  // Update screen width on resize
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(Dimensions.get('window').width);
    };

    if (Platform.OS === 'web') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    } else {
      const subscription = Dimensions.addEventListener('change', handleResize);
      return () => subscription?.remove();
    }
  }, []);

  // Get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Handle click outside to close menu
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleClickOutside = (event: any) => {
      if (!showProfileMenu) return;

      const target = event.target as HTMLElement;

      // Check if click is outside both the menu and the button
      const menuElement = document.getElementById('profile-dropdown-menu');
      const isClickInsideMenu = menuElement?.contains(target);
      const isClickOnButton = profileButtonRef.current && (profileButtonRef.current as any).contains?.(target);

      if (!isClickInsideMenu && !isClickOnButton) {
        console.log('🔴 Click outside detected, closing menu');
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      // Add listener with a slight delay to prevent immediate closing
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showProfileMenu]);

  // AI Chat Functions
  const sendToAIService = async (text: string) => {
    try {
      const token = APIService.getAccessToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Get user context
      let userProfile = null;
      let recentTransactions = [];

      try {
        userProfile = await APIService.getProfile();
      } catch (error) {
        // Could not fetch user profile
      }

      try {
        const transactionsData = await APIService.getTransferHistory({ page: 1, limit: 5 });
        if (transactionsData?.transactions) {
          recentTransactions = transactionsData.transactions.slice(0, 3);
        }
      } catch (error) {
        // Could not fetch transactions
      }

      const response = await fetch(buildApiUrl('ai/chat'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantTheme.tenantCode || 'platform',
        },
        body: JSON.stringify({
          message: text,
          userId: userProfile?.id || 'current-user',
          context: {
            conversationId: conversationIdRef.current,
            page: 'dashboard',
            userName: userProfile ? `${userProfile.firstName} ${userProfile.lastName}`.trim() : 'User',
            accountType: userProfile?.role || 'customer',
            recentTransactions: recentTransactions,
            timestamp: new Date().toISOString(),
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      const data = await response.json();

      return {
        message: data.response || data.message || data.text || 'I understand. How can I help you further?',
        suggestions: data.suggestions || [],
      };
    } catch (error) {
      console.error('Error calling AI service:', error);
      throw error;
    }
  };

  // Fetch AI Smart Suggestions
  const fetchAISuggestions = async () => {
    try {
      setIsSuggestionsLoading(true);
      const token = APIService.getAccessToken();
      if (!token) {
        return;
      }

      const response = await fetch(buildApiUrl('ai/suggestions/smart'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantTheme.tenantCode || 'platform',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch suggestions: ${response.status}`);
      }

      const data = await response.json();

      // Process suggestions and categorize them
      const processed: any = {};

      if (data.suggestions && Array.isArray(data.suggestions)) {
        data.suggestions.forEach((suggestion: any) => {
          // Validate suggestion has required properties
          if (!suggestion || !suggestion.title || typeof suggestion.title !== 'string') {
            return; // Skip invalid suggestions
          }

          const title = suggestion.title.toLowerCase();

          // Categorize by title keywords
          if (title.includes('saving') || title.includes('save')) {
            processed.savings = {
              title: suggestion.title,
              description: suggestion.description || '',
              potentialSavings: suggestion.metadata?.suggestedAmount || 0,
              action: 'Set up automatic transfer'
            };
          } else if (title.includes('investment') || title.includes('invest') || title.includes('opportunity')) {
            processed.investment = {
              title: suggestion.title,
              description: suggestion.description || '',
              action: 'View investment options'
            };
          } else if (title.includes('bill') || title.includes('payment') || title.includes('recurring')) {
            processed.bills = {
              title: suggestion.title,
              description: suggestion.description || '',
              totalAmount: suggestion.metadata?.totalAmount || 0,
              billCount: suggestion.metadata?.recurringCount || 0,
              action: 'View pending bills'
            };
          }
        });
      }

      setAISuggestions(processed);
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
    } finally {
      setIsSuggestionsLoading(false);
    }
  };

  // Fetch AI suggestions on component mount
  useEffect(() => {
    fetchAISuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user' as const,
      timestamp: new Date(),
    };

    setAIMessages(prev => [...prev, userMessage]);
    setAIInput('');
    setIsAITyping(true);

    try {
      const response = await sendToAIService(text.trim());

      const aiResponse = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        sender: 'ai' as const,
        timestamp: new Date(),
      };

      setAIMessages(prev => [...prev, aiResponse]);
      setIsAITyping(false);
    } catch (error) {
      console.error('Error sending message to AI:', error);
      setIsAITyping(false);

      const errorResponse = {
        id: (Date.now() + 1).toString(),
        text: 'I apologize, but I\'m having trouble connecting to the service. Please try again in a moment.',
        sender: 'ai' as const,
        timestamp: new Date(),
      };
      setAIMessages(prev => [...prev, errorResponse]);
    }
  };

  // Use dynamic theme colors
  const primaryColor = theme?.colors?.primary || '#010080';
  const secondaryColor = theme?.colors?.secondary || '#FFD700';
  const gradientStart = primaryColor;
  const gradientEnd = theme?.colors?.primaryGradientEnd || secondaryColor;

  return (
    <View style={[styles.container, {
      ...Platform.select({
        web: {
          backgroundImage: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
        },
        default: {
          backgroundColor: primaryColor,
        },
      }),
    }]}>
      <ScrollView
        style={[styles.scrollContainer, { overflow: 'visible' }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { overflow: 'visible' }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.headerContent, { overflow: 'visible' }]}>
            {/* First row: Logo + Notification + Profile (always visible) */}
            <View style={[screenWidth < 768 ? styles.headerRow : { flexDirection: 'row', flex: 1, justifyContent: 'space-between', alignItems: 'center' }]}>
              <View style={styles.logoSection}>
                {theme?.brandLogo ? (
                  <Image
                    source={{ uri: theme.brandLogo }}
                    style={styles.logoImage as any}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={[styles.logo, {
                    ...Platform.select({
                      web: {
                        backgroundImage: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                      },
                      default: {
                        backgroundColor: primaryColor,
                      },
                    }),
                  }]}>
                    <Text style={styles.logoText}>{theme?.brandCode || currentTenant?.branding?.code || '🏦'}</Text>
                  </View>
                )}
                {screenWidth >= 540 && (
                  <Text style={[styles.bankName, {
                    ...Platform.select({
                      web: {
                        backgroundImage: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      },
                      default: {
                        color: primaryColor,
                      },
                    }),
                  }]} numberOfLines={1} ellipsizeMode="tail">{theme?.brandName || currentTenant?.branding?.appTitle || ''}</Text>
                )}
              </View>

              <View style={[styles.headerActions, { zIndex: 999999 }]}>
                {screenWidth >= 768 && (
                  <View style={styles.searchBox}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search..."
                      value={searchText}
                      onChangeText={setSearchText}
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                )}

                <TouchableOpacity
                  style={styles.notificationBtn}
                  onPress={() => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch (e) {
                      // Haptics not available on web
                    }
                  }}
                >
                  <Text style={styles.notificationIcon}>🔔</Text>
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationCount}>3</Text>
                  </View>
                </TouchableOpacity>

                <View style={{ position: 'relative', zIndex: 999999, overflow: 'visible' }}>
                  <TouchableOpacity
                  ref={profileButtonRef}
                  style={styles.userProfile}
                  onPress={() => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch (e) {
                      // Haptics not available on web
                    }
                    console.log('🔴 PROFILE CLICKED - Current state:', showProfileMenu);
                    setShowProfileMenu(!showProfileMenu);
                    console.log('🔴 PROFILE CLICKED - New state will be:', !showProfileMenu);
                  }}
                >
                  <Text style={styles.profileIcon}>👤</Text>
                </TouchableOpacity>

                {showProfileMenu && (
                  <View
                    ref={profileMenuRef}
                    style={styles.profileMenu}
                    nativeID="profile-dropdown-menu"
                  >
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        console.log('Profile menu item clicked');
                        setShowProfileMenu(false);
                      }}
                    >
                      <Text style={styles.menuIcon}>👤</Text>
                      <Text style={styles.menuText}>Profile</Text>
                    </TouchableOpacity>
                    <View style={styles.menuDivider} />
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        console.log('Settings menu item clicked');
                        setShowProfileMenu(false);
                        onSettings?.();
                      }}
                    >
                      <Text style={styles.menuIcon}>⚙️</Text>
                      <Text style={styles.menuText}>Settings</Text>
                    </TouchableOpacity>
                    <View style={styles.menuDivider} />
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        console.log('Logout menu item clicked');
                        setShowProfileMenu(false);
                        onLogout?.();
                      }}
                    >
                      <Text style={[styles.menuIcon, styles.logoutText]}>↗</Text>
                      <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
            </View>

            {/* Second row: Search field (mobile only) */}
            {screenWidth < 768 && (
              <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search..."
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            )}
          </View>
        </View>

        {/* Hero Section with Glassmorphism */}
        <View style={styles.heroSection}>
          <View style={styles.welcomeSection}>
            <Typography.BodyLarge color={theme?.colors?.textSecondary || '#6c757d'}>
              {getTimeBasedGreeting()}! Welcome back,
            </Typography.BodyLarge>
            <Typography.DisplayMedium
              style={{
                ...Platform.select({
                  web: {
                    backgroundImage: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  },
                  default: {
                    color: primaryColor,
                  },
                }),
                marginBottom: 12,
              }}
            >
              {userContext.firstName} {userContext.lastName}
            </Typography.DisplayMedium>
            <View style={[styles.roleBadge, {
              ...Platform.select({
                web: {
                  backgroundImage: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                },
                default: {
                  backgroundColor: primaryColor,
                },
              }),
            }]}>
              <Text style={styles.roleText}>
                {userContext.role === 'admin' ? 'CEO / Platform Admin' : userContext.role}
              </Text>
            </View>
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.quickStats}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(102, 126, 234, 0.1)' }]}>
                <Text style={styles.statIconText}>💰</Text>
              </View>
              <Typography.LabelMedium>Total Balance</Typography.LabelMedium>
              <Typography.Amount
                value={dashboardData.totalBalance || 2450000}
                currency={'NGN'}
                variant="small"
                style={{ marginVertical: 4 }}
              />
              <Typography.Caption color={theme?.colors?.success} style={{ fontWeight: '500' }}>
                ↑ 12.5%
              </Typography.Caption>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(79, 172, 254, 0.1)' }]}>
                <Text style={styles.statIconText}>💳</Text>
              </View>
              <Typography.LabelMedium>Available Balance</Typography.LabelMedium>
              <Typography.Amount
                value={1850000}
                currency={'NGN'}
                variant="small"
                style={{ marginVertical: 4 }}
              />
              <Typography.Caption color={theme?.colors?.success} style={{ fontWeight: '500' }}>
                ↑ 8.2%
              </Typography.Caption>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(67, 233, 123, 0.1)' }]}>
                <Text style={styles.statIconText}>📊</Text>
              </View>
              <Typography.LabelMedium>Monthly Activity</Typography.LabelMedium>
              <Typography.HeadlineSmall style={{ marginVertical: 4 }}>
                247
              </Typography.HeadlineSmall>
              <Typography.Caption color={theme?.colors?.danger} style={{ fontWeight: '500' }}>
                ↓ 3.1%
              </Typography.Caption>
            </View>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onFeatureNavigation('rewards');
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.statIcon, { backgroundColor: 'rgba(192, 192, 192, 0.15)' }]}>
                <Text style={styles.statIconText}>🥈</Text>
              </View>
              <Typography.LabelMedium>Your Tier</Typography.LabelMedium>
              <Typography.TitleMedium style={{ marginVertical: 4, fontWeight: '700', color: theme.colors.textTertiary }}>
                Silver
              </Typography.TitleMedium>
              <Typography.Caption color={theme?.colors?.primary} style={{ fontWeight: '500' }}>
                1,500 points 🎉
              </Typography.Caption>
            </TouchableOpacity>
          </View>

          {/* Rewards Progress Widget */}
          <TouchableOpacity
            style={styles.rewardsWidget}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onFeatureNavigation('rewards');
            }}
            activeOpacity={0.9}
          >
            <View style={styles.rewardsWidgetHeader}>
              <Typography.TitleMedium style={{ fontWeight: '700' }}>
                🎮 Rewards & Achievements
              </Typography.TitleMedium>
              <Typography.LabelMedium color={theme?.colors?.primary} style={{ fontWeight: '600' }}>
                View All →
              </Typography.LabelMedium>
            </View>
            <TierProgressIndicator
              currentTier={{
                tierName: 'Silver',
                tierLevel: 2,
                icon: '🥈',
                color: theme.colors.textTertiary,
              }}
              totalPoints={1500}
              pointsToNextTier={3500}
              nextTier={{
                tierName: 'Gold',
                pointsRequired: 5000,
                icon: '🥇',
              }}
              compact={true}
            />
            <View style={styles.achievementPreview}>
              <View style={styles.achievementBadgeSmall}>
                <Text style={{ fontSize: 20 }}>💸</Text>
              </View>
              <View style={styles.achievementBadgeSmall}>
                <Text style={{ fontSize: 20 }}>🌱</Text>
              </View>
              <View style={[styles.achievementBadgeSmall, { opacity: 0.3 }]}>
                <Text style={{ fontSize: 20, filter: 'grayscale(1)' }}>🚀</Text>
              </View>
              <View style={styles.achievementCounter}>
                <Typography.Caption color={theme?.colors?.textSecondary}>
                  2/9 unlocked
                </Typography.Caption>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* AI Assistant Panel with Chat Interface */}
        <View style={styles.aiAssistantPanel}>
          <View style={styles.aiHeader}>
            <View style={styles.aiTitleSection}>
              <View style={styles.aiIconContainer}>
                <Text style={styles.aiIcon}>🤖</Text>
              </View>
              <View>
                <Text style={styles.aiTitle}>AI Banking Assistant</Text>
                <Text style={styles.aiSubtitle}>Your intelligent banking companion</Text>
              </View>
            </View>
            <View style={styles.aiStatus}>
              <View style={styles.aiStatusDot} />
              <Text style={styles.aiStatusText}>Online</Text>
            </View>
          </View>

          {/* AI Suggestions Cards */}
          <View style={styles.aiSuggestions}>
            {isSuggestionsLoading ? (
              <View style={styles.aiSuggestionCard}>
                <Text style={styles.aiSuggestionDescription}>Loading personalized suggestions...</Text>
              </View>
            ) : (
              <>
                {/* Savings Optimization Card */}
                {aiSuggestions.savings && (
                  <TouchableOpacity
                    style={styles.aiSuggestionCard}
                    onPress={() => onFeatureNavigation('savings')}
                  >
                    <Text style={styles.aiSuggestionIcon}>💡</Text>
                    <Text style={styles.aiSuggestionTitle}>{aiSuggestions.savings.title}</Text>
                    <Text style={styles.aiSuggestionDescription}>
                      {aiSuggestions.savings.description}
                    </Text>
                    <View style={styles.aiSuggestionAction}>
                      <Text style={[styles.aiActionText, { color: primaryColor }]}>
                        {aiSuggestions.savings.action}
                      </Text>
                      <Text style={[styles.aiActionArrow, { color: primaryColor }]}>→</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Investment Opportunity Card */}
                {aiSuggestions.investment && (
                  <TouchableOpacity
                    style={styles.aiSuggestionCard}
                    onPress={() => onFeatureNavigation('investments')}
                  >
                    <Text style={styles.aiSuggestionIcon}>📈</Text>
                    <Text style={styles.aiSuggestionTitle}>{aiSuggestions.investment.title}</Text>
                    <Text style={styles.aiSuggestionDescription}>
                      {aiSuggestions.investment.description}
                    </Text>
                    <View style={styles.aiSuggestionAction}>
                      <Text style={[styles.aiActionText, { color: primaryColor }]}>
                        {aiSuggestions.investment.action}
                      </Text>
                      <Text style={[styles.aiActionArrow, { color: primaryColor }]}>→</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Bill Payment Reminder Card */}
                {aiSuggestions.bills && (
                  <TouchableOpacity
                    style={styles.aiSuggestionCard}
                    onPress={() => onFeatureNavigation('bills')}
                  >
                    <Text style={styles.aiSuggestionIcon}>🎯</Text>
                    <Text style={styles.aiSuggestionTitle}>{aiSuggestions.bills.title}</Text>
                    <Text style={styles.aiSuggestionDescription}>
                      {aiSuggestions.bills.description}
                    </Text>
                    <View style={styles.aiSuggestionAction}>
                      <Text style={[styles.aiActionText, { color: primaryColor }]}>
                        {aiSuggestions.bills.action}
                      </Text>
                      <Text style={[styles.aiActionArrow, { color: primaryColor }]}>→</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Show default message if no suggestions */}
                {!aiSuggestions.savings && !aiSuggestions.investment && !aiSuggestions.bills && (
                  <View style={styles.aiSuggestionCard}>
                    <Text style={styles.aiSuggestionIcon}>💡</Text>
                    <Text style={styles.aiSuggestionTitle}>No Suggestions Yet</Text>
                    <Text style={styles.aiSuggestionDescription}>
                      Start using your account to receive personalized financial insights and recommendations.
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* AI Chat Messages */}
          <View style={styles.aiChatSection}>
            <ScrollView>
              {aiMessages.slice(-3).map((message) => (
                <View key={message.id} style={[
                  styles.aiMessage,
                  message.sender === 'user' && { justifyContent: 'flex-end' }
                ]}>
                  {message.sender === 'ai' && (
                    <View style={[styles.aiAvatar, { backgroundColor: primaryColor }]}>
                      <Text style={styles.aiAvatarText}>AI</Text>
                    </View>
                  )}
                  <View style={[
                    styles.aiMessageBubble,
                    message.sender === 'user' && {
                      backgroundColor: primaryColor,
                      marginLeft: 'auto',
                      marginRight: 0
                    }
                  ]}>
                    <Text style={[
                      styles.aiMessageText,
                      message.sender === 'user' && { color: '#FFFFFF' }
                    ]}>
                      {message.text}
                    </Text>
                  </View>
                </View>
              ))}
              {isAITyping && (
                <View style={styles.aiMessage}>
                  <View style={[styles.aiAvatar, { backgroundColor: primaryColor }]}>
                    <Text style={styles.aiAvatarText}>AI</Text>
                  </View>
                  <View style={styles.aiMessageBubble}>
                    <Text style={styles.aiMessageText}>Typing...</Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>

          {/* AI Input Field */}
          <View style={styles.aiInputSection}>
            <TextInput
              style={[styles.aiInputField, {
                color: theme.colors.text,
                borderWidth: 2,
                borderColor: primaryColor
              }]}
              placeholder="Ask me anything about your banking..."
              value={aiInput}
              onChangeText={setAIInput}
              onSubmitEditing={() => handleSendMessage(aiInput)}
              placeholderTextColor={`${primaryColor}99`}
            />
            <TouchableOpacity
              style={[styles.aiSendButton, { backgroundColor: primaryColor }]}
              onPress={() => handleSendMessage(aiInput)}
            >
              <Text style={styles.aiSendIcon}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, { color: 'white' }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {/* Money Transfer */}
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => onFeatureNavigation('money_transfer_operations')}
            >
              <View style={styles.quickActionContent}>
                <View style={styles.quickActionHeader}>
                  <Text style={styles.quickActionEmoji}>💸</Text>
                  <Text style={styles.quickActionArrow}>→</Text>
                </View>
                <Text style={styles.quickActionTitle}>Money Transfer</Text>
                <Text style={styles.quickActionDescription}>
                  Send & receive money instantly. All transfer services in one place.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Savings Products */}
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => onFeatureNavigation('savings_products')}
            >
              <View style={styles.quickActionContent}>
                <View style={styles.quickActionHeader}>
                  <Text style={styles.quickActionEmoji}>💰</Text>
                  <Text style={styles.quickActionArrow}>→</Text>
                </View>
                <Text style={styles.quickActionTitle}>Savings Products</Text>
                <Text style={styles.quickActionDescription}>
                  Grow your money with flexible savings options.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Loan Products */}
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => onFeatureNavigation('loan_products')}
            >
              <View style={styles.quickActionContent}>
                <View style={styles.quickActionHeader}>
                  <Text style={styles.quickActionEmoji}>💳</Text>
                  <Text style={styles.quickActionArrow}>→</Text>
                </View>
                <Text style={styles.quickActionTitle}>Loan Products</Text>
                <Text style={styles.quickActionDescription}>
                  Quick credit access with competitive rates.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Operations */}
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => onFeatureNavigation('operations_management')}
            >
              <View style={styles.quickActionContent}>
                <View style={styles.quickActionHeader}>
                  <Text style={styles.quickActionEmoji}>⚙️</Text>
                  <Text style={styles.quickActionArrow}>→</Text>
                </View>
                <Text style={styles.quickActionTitle}>Operations</Text>
                <Text style={styles.quickActionDescription}>
                  Banking operations & compliance management.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Reports & Analytics */}
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => onFeatureNavigation('management_reports')}
            >
              <View style={styles.quickActionContent}>
                <View style={styles.quickActionHeader}>
                  <Text style={styles.quickActionEmoji}>📊</Text>
                  <Text style={styles.quickActionArrow}>→</Text>
                </View>
                <Text style={styles.quickActionTitle}>Reports & Analytics</Text>
                <Text style={styles.quickActionDescription}>
                  Insights, analytics and management reports.
                </Text>
              </View>
            </TouchableOpacity>

            {/* RBAC Management */}
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => onFeatureNavigation('rbac_management')}
            >
              <View style={styles.quickActionContent}>
                <View style={styles.quickActionHeader}>
                  <Text style={styles.quickActionEmoji}>🛡️</Text>
                  <Text style={styles.quickActionArrow}>→</Text>
                </View>
                <Text style={styles.quickActionTitle}>RBAC Management</Text>
                <Text style={styles.quickActionDescription}>
                  Manage roles and permissions.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Activity</Text>
            <TouchableOpacity onPress={() => onFeatureNavigation('transaction_history')}>
              <Text style={[styles.viewAllText, { color: primaryColor }]}>View All →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityList}>
            {dashboardData.recentTransactions?.slice(0, 5).map((transaction: any, index: number) => (
              <TouchableOpacity
                key={transaction.id || index}
                style={styles.activityItem}
                onPress={() => onNavigateToTransactionDetails(transaction.id)}
              >
                <View style={[
                  styles.activityIcon,
                  transaction.type === 'deposit' ? styles.creditIcon : styles.debitIcon
                ]}>
                  <Text style={styles.activityIconText}>
                    {transaction.type === 'deposit' ? '💰' : '💸'}
                  </Text>
                </View>
                <View style={styles.activityDetails}>
                  <Text style={styles.activityTitle}>
                    {transaction.description || transaction.recipient_name || 'Transaction'}
                  </Text>
                  <Text style={styles.activityTime}>
                    {(() => {
                      const dateValue = transaction.created_at || transaction.date || transaction.transaction_date;
                      if (!dateValue) return 'Date unavailable';
                      const date = new Date(dateValue);
                      return isNaN(date.getTime())
                        ? 'Date unavailable'
                        : date.toLocaleString('en-NG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                    })()}
                  </Text>
                </View>
                <Text style={[
                  styles.activityAmount,
                  transaction.type === 'deposit' ? styles.creditAmount : styles.debitAmount
                ]}>
                  {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(Number(transaction.amount), 'NGN', { locale: 'en-NG' })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating AI Assistant Button */}
      <TouchableOpacity
        style={[styles.floatingAIButton, {
          backgroundColor: 'white',
          shadowColor: '#000',
        }]}
        onPress={onAIAssistantPress}
        activeOpacity={0.8}
      >
        <Text style={styles.floatingAIIcon}>🤖</Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    overflow: 'visible',
  },
  scrollContent: {
    paddingBottom: 100,
    overflow: 'visible',
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginLeft: 20,
    marginRight: 20,
    marginTop: 0,
    marginBottom: 0,
    borderRadius: 12,
    paddingTop: Platform.OS === 'web' ? 12 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'visible',
    zIndex: 9999,
    position: 'relative',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
      },
    }),
  },
  headerContent: {
    flexDirection: screenWidth < 768 ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: screenWidth < 768 ? 'stretch' : 'center',
    minHeight: 60,
    gap: screenWidth < 768 ? 12 : 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: screenWidth >= 768 ? 12 : 8,
    flex: screenWidth < 768 ? 0 : 1,
    maxWidth: screenWidth < 768 ? 'auto' : undefined,
  },
  logo: {
    width: screenWidth >= 768 ? 72 : 60,
    height: screenWidth >= 768 ? 72 : 60,
    borderRadius: screenWidth >= 768 ? 14 : 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  logoImage: {
    width: screenWidth >= 768 ? 72 : 60,
    height: screenWidth >= 768 ? 72 : 60,
    borderRadius: screenWidth >= 768 ? 14 : 12,
    flexShrink: 0,
  },
  logoText: {
    color: 'white',
    fontSize: screenWidth >= 768 ? 30 : 27,
    fontWeight: 'bold',
  },
  bankName: {
    fontSize: screenWidth >= 900 ? 18 : screenWidth >= 540 ? 16 : 14,
    fontWeight: '700',
    flexWrap: 'nowrap',
    maxWidth: screenWidth >= 1200 ? 550 : screenWidth >= 768 ? Math.max(screenWidth - 550, 220) : screenWidth >= 540 ? Math.max(screenWidth - 280, 160) : 160,
    overflow: 'hidden',
    flexShrink: 1,
    ...Platform.select({
      web: {
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
      },
    }),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
    overflow: 'visible',
    justifyContent: 'flex-end',
    flexWrap: 'nowrap',
    flexShrink: 0,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flex: screenWidth < 768 ? undefined : 1,
    width: screenWidth < 768 ? '100%' : undefined,
    minWidth: 0,
    maxWidth: screenWidth >= 768 ? 300 : undefined,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
      },
    }),
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: theme.colors.text,
    minWidth: 0,
    paddingRight: 5,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
      },
    }),
  },
  notificationIcon: {
    fontSize: 18,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, #ef4444, #dc2626)',
      },
      default: {
        backgroundColor: theme.colors.error,
      },
    }),
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userProfile: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
      },
    }),
  },
  profileIcon: {
    fontSize: 18,
  },
  profileMenu: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 100,
    zIndex: 9999999,
    minWidth: 200,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuText: {
    fontSize: 15,
    color: theme.colors.text,
  },
  logoutText: {
    color: theme.colors.danger || theme.colors.error,
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.background,
    marginVertical: 4,
  },
  heroSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 20,
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
      },
    }),
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  userName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
  },
  quickStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    flex: screenWidth >= 768 ? 1 : undefined,
    width: screenWidth < 768 ? '100%' : undefined,
    minWidth: screenWidth >= 768 ? 200 : '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    padding: screenWidth > 768 ? 20 : 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
      },
    }),
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIconText: {
    fontSize: 20,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statChange: {
    fontSize: 12,
    fontWeight: '500',
  },
  positive: {
    color: theme.colors.success,
  },
  negative: {
    color: theme.colors.error,
  },
  rewardsWidget: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(192, 192, 192, 0.2)',
    gap: 12,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
        transition: 'all 0.2s ease',
      },
    }),
  },
  rewardsWidgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  achievementPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  achievementBadgeSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(192, 192, 192, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(192, 192, 192, 0.3)',
  },
  achievementCounter: {
    flex: 1,
    alignItems: 'flex-end',
  },
  aiAssistantPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 20,
    marginTop: 0,
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
      },
    }),
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  aiTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiIcon: {
    fontSize: 24,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  aiSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  aiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(67, 233, 123, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  aiStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
    marginRight: 6,
  },
  aiStatusText: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '500',
  },
  aiSuggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  aiSuggestionCard: {
    flex: 1,
    minWidth: screenWidth > 768 ? 300 : '100%',
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
  },
  aiSuggestionIcon: {
    fontSize: 24,
    marginBottom: 12,
  },
  aiSuggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  aiSuggestionDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  aiSuggestionAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  aiActionArrow: {
    fontSize: 18,
  },
  aiChatSection: {
    marginBottom: 16,
  },
  aiMessage: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiAvatarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  aiMessageBubble: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    padding: 12,
  },
  aiMessageText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  aiInputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiInputField: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: theme.colors.text,
  },
  aiSendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiSendIcon: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  quickActionsSection: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: screenWidth > 768 ? 16 : 12,
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (screenWidth > 768 ? 'calc(33.33% - 11px)' : screenWidth > 480 ? 'calc(50% - 8px)' : '100%') as any,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: screenWidth > 768 ? 24 : 16,
    marginBottom: screenWidth > 768 ? 16 : 12,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
        },
      },
    }),
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickActionEmoji: {
    fontSize: 32,
  },
  quickActionArrow: {
    fontSize: 24,
    color: theme.colors.textTertiary,
  },
  quickActionTitle: {
    fontSize: screenWidth > 768 ? 18 : 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  quickActionDescription: {
    fontSize: screenWidth > 768 ? 14 : 13,
    color: theme.colors.textSecondary,
    lineHeight: screenWidth > 768 ? 20 : 18,
  },
  activitySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 20,
    marginTop: 0,
    borderRadius: 20,
    padding: 24,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
      },
    }),
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  creditIcon: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  debitIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  activityIconText: {
    fontSize: 20,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  activityAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  creditAmount: {
    color: theme.colors.success,
  },
  debitAmount: {
    color: theme.colors.error,
  },
  floatingAIButton: {
    position: 'absolute',
    bottom: 32,
    right: 32,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingAIIcon: {
    fontSize: 28,
  },
});

export default ModernDashboardWithAI;