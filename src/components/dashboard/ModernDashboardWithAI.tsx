/**
 * Modern Dashboard with AI Assistant - Glassmorphism Design
 * Matches the dashboard-modern-with-ai.html mockup exactly
 */

import React, { useState, useEffect, useRef } from 'react';
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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [aiInput, setAIInput] = useState('');
  const profileMenuRef = useRef<any>(null);
  const profileButtonRef = useRef<any>(null);

  // Get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showProfileMenu &&
          profileMenuRef.current &&
          !profileMenuRef.current.contains(event.target) &&
          profileButtonRef.current &&
          !profileButtonRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showProfileMenu]);

  // Use dynamic theme colors
  const primaryColor = theme?.colors?.primary || '#010080';
  const secondaryColor = theme?.colors?.secondary || '#FFD700';
  const gradientStart = primaryColor;
  const gradientEnd = theme?.colors?.primaryGradientEnd || secondaryColor;

  return (
    <View style={[styles.container, {
      ...Platform.select({
        web: {
          background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
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
        <View style={[styles.header, { zIndex: 9999, position: 'relative' }]}>
          <View style={styles.headerContent}>
            <View style={styles.logoSection}>
              {theme?.brandLogo ? (
                <Image
                  source={{ uri: theme.brandLogo }}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.logo, {
                  ...Platform.select({
                    web: {
                      background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                    },
                    default: {
                      backgroundColor: primaryColor,
                    },
                  }),
                }]}>
                  <Text style={styles.logoText}>FMFB</Text>
                </View>
              )}
              {screenWidth > 480 && (
                <Text style={[styles.bankName, {
                  ...Platform.select({
                    web: {
                      background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    },
                    default: {
                      color: primaryColor,
                    },
                  }),
                }]}>{theme?.brandName || 'Firstmidas Microfinance Bank Limited'}</Text>
              )}
            </View>

            <View style={[styles.headerActions, { zIndex: 999999 }]}>
              {screenWidth > 360 && (
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

              <TouchableOpacity style={styles.notificationBtn}>
                <Text style={styles.notificationIcon}>🔔</Text>
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationCount}>3</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                ref={profileButtonRef}
                style={styles.userProfile}
                onPress={() => setShowProfileMenu(!showProfileMenu)}
              >
                <Text style={styles.profileIcon}>👤</Text>
              </TouchableOpacity>

              {showProfileMenu && (
                <View ref={profileMenuRef} style={styles.profileMenu}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
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
                      setShowProfileMenu(false);
                      onLogout?.();
                    }}
                  >
                    <Text style={styles.menuIcon}>🚪</Text>
                    <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Hero Section with Glassmorphism */}
        <View style={styles.heroSection}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>{getTimeBasedGreeting()}! Welcome back,</Text>
            <Text style={[styles.userName, {
              ...Platform.select({
                web: {
                  background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                },
                default: {
                  color: primaryColor,
                },
              }),
            }]}>
              {userContext.firstName} {userContext.lastName}
            </Text>
            <View style={[styles.roleBadge, {
              ...Platform.select({
                web: {
                  background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
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
              <Text style={styles.statLabel}>Total Balance</Text>
              <Text style={styles.statValue}>
                ₦{dashboardData.totalBalance?.toLocaleString() || '2,450,000'}
              </Text>
              <Text style={[styles.statChange, styles.positive]}>↑ 12.5%</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(79, 172, 254, 0.1)' }]}>
                <Text style={styles.statIconText}>💳</Text>
              </View>
              <Text style={styles.statLabel}>Available Balance</Text>
              <Text style={styles.statValue}>₦1,850,000</Text>
              <Text style={[styles.statChange, styles.positive]}>↑ 8.2%</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(67, 233, 123, 0.1)' }]}>
                <Text style={styles.statIconText}>📊</Text>
              </View>
              <Text style={styles.statLabel}>Monthly Activity</Text>
              <Text style={styles.statValue}>247</Text>
              <Text style={[styles.statChange, styles.negative]}>↓ 3.1%</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(240, 147, 251, 0.1)' }]}>
                <Text style={styles.statIconText}>🎯</Text>
              </View>
              <Text style={styles.statLabel}>Savings Goal</Text>
              <Text style={styles.statValue}>₦500,000</Text>
              <Text style={[styles.statChange, styles.positive]}>65% achieved</Text>
            </View>
          </View>
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
            <TouchableOpacity
              style={styles.aiSuggestionCard}
              onPress={() => onFeatureNavigation('savings')}
            >
              <Text style={styles.aiSuggestionIcon}>💡</Text>
              <Text style={styles.aiSuggestionTitle}>Optimize Your Savings</Text>
              <Text style={styles.aiSuggestionDescription}>
                Based on your spending patterns, you could save an additional ₦50,000 monthly by transferring to high-yield savings.
              </Text>
              <View style={styles.aiSuggestionAction}>
                <Text style={[styles.aiActionText, { color: primaryColor }]}>Set up automatic transfer</Text>
                <Text style={[styles.aiActionArrow, { color: primaryColor }]}>→</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.aiSuggestionCard}
              onPress={() => onFeatureNavigation('investments')}
            >
              <Text style={styles.aiSuggestionIcon}>📈</Text>
              <Text style={styles.aiSuggestionTitle}>Investment Opportunity</Text>
              <Text style={styles.aiSuggestionDescription}>
                Your balance qualifies for our premium investment portfolio with 15% annual returns.
              </Text>
              <View style={styles.aiSuggestionAction}>
                <Text style={[styles.aiActionText, { color: primaryColor }]}>View investment options</Text>
                <Text style={[styles.aiActionArrow, { color: primaryColor }]}>→</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.aiSuggestionCard}
              onPress={() => onFeatureNavigation('bills')}
            >
              <Text style={styles.aiSuggestionIcon}>🎯</Text>
              <Text style={styles.aiSuggestionTitle}>Bill Payment Reminder</Text>
              <Text style={styles.aiSuggestionDescription}>
                You have 3 upcoming bills totaling ₦45,000 due this week. Set up auto-pay to avoid late fees.
              </Text>
              <View style={styles.aiSuggestionAction}>
                <Text style={[styles.aiActionText, { color: primaryColor }]}>Review bills</Text>
                <Text style={[styles.aiActionArrow, { color: primaryColor }]}>→</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* AI Chat Messages */}
          <View style={styles.aiChatSection}>
            <View style={styles.aiMessage}>
              <View style={[styles.aiAvatar, { backgroundColor: primaryColor }]}>
                <Text style={styles.aiAvatarText}>AI</Text>
              </View>
              <View style={styles.aiMessageBubble}>
                <Text style={styles.aiMessageText}>
                  Hello! I noticed you frequently transfer to savings on the 25th of each month. Would you like me to automate this for you?
                </Text>
              </View>
            </View>

            <View style={styles.aiMessage}>
              <View style={[styles.aiAvatar, { backgroundColor: primaryColor }]}>
                <Text style={styles.aiAvatarText}>AI</Text>
              </View>
              <View style={styles.aiMessageBubble}>
                <Text style={styles.aiMessageText}>
                  I can help you with transfers, account inquiries, bill payments, and financial planning. What would you like to do today?
                </Text>
              </View>
            </View>
          </View>

          {/* AI Input Field */}
          <View style={styles.aiInputSection}>
            <TextInput
              style={[styles.aiInputField, {
                color: '#1a1a2e',
                borderWidth: 2,
                borderColor: primaryColor
              }]}
              placeholder="Ask me anything about your banking..."
              value={aiInput}
              onChangeText={setAIInput}
              placeholderTextColor={`${primaryColor}99`}
            />
            <TouchableOpacity style={[styles.aiSendButton, { backgroundColor: primaryColor }]}>
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
            <Text style={[styles.sectionTitle, { color: '#1a1a2e' }]}>Recent Activity</Text>
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
                    {new Date(transaction.created_at).toLocaleString()}
                  </Text>
                </View>
                <Text style={[
                  styles.activityAmount,
                  transaction.type === 'deposit' ? styles.creditAmount : styles.debitAmount
                ]}>
                  {transaction.type === 'deposit' ? '+' : '-'}₦{Number(transaction.amount).toLocaleString()}
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

const styles = StyleSheet.create({
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
    paddingHorizontal: screenWidth > 480 ? 20 : 10,
    paddingTop: Platform.OS === 'web' ? 20 : 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'visible',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 60,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: screenWidth > 480 ? 12 : 8,
    flex: screenWidth <= 480 ? 0 : 1,
  },
  logo: {
    width: screenWidth > 480 ? 120 : 50,
    height: screenWidth > 480 ? 120 : 50,
    borderRadius: screenWidth > 480 ? 24 : 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: screenWidth > 480 ? 120 : 50,
    height: screenWidth > 480 ? 120 : 50,
    borderRadius: screenWidth > 480 ? 24 : 12,
  },
  logoText: {
    color: 'white',
    fontSize: screenWidth > 480 ? 36 : 18,
    fontWeight: 'bold',
  },
  bankName: {
    fontSize: screenWidth > 600 ? 20 : 16,
    fontWeight: '700',
    flexWrap: 'wrap',
    maxWidth: screenWidth > 600 ? 'auto' : screenWidth - 160,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
    overflow: 'visible',
    justifyContent: 'flex-end',
    flexWrap: 'nowrap',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    paddingHorizontal: screenWidth > 600 ? 15 : 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flex: 1,
    minWidth: 0,
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
    fontSize: screenWidth > 600 ? 14 : 13,
    color: '#1a1a2e',
    minWidth: 0,
    paddingRight: 5,
  },
  notificationBtn: {
    width: screenWidth > 600 ? 40 : 36,
    height: screenWidth > 600 ? 40 : 36,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    flexShrink: 0,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
      },
    }),
  },
  notificationIcon: {
    fontSize: screenWidth > 600 ? 20 : 18,
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
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      },
      default: {
        backgroundColor: '#ef4444',
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
    width: screenWidth > 600 ? 40 : 36,
    height: screenWidth > 600 ? 40 : 36,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
      },
    }),
  },
  profileIcon: {
    fontSize: screenWidth > 600 ? 20 : 18,
  },
  profileMenu: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 100,
    zIndex: 9999999,
    minWidth: 200,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
        position: 'fixed' as any,
        marginTop: -10,
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
    color: '#1a1a2e',
  },
  logoutText: {
    color: '#ef4444',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
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
    color: '#6c757d',
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
    flex: screenWidth > 480 ? 1 : undefined,
    width: screenWidth <= 480 ? '100%' : undefined,
    minWidth: screenWidth > 768 ? 200 : screenWidth > 480 ? '48%' : '100%',
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
    color: '#6c757d',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  statChange: {
    fontSize: 12,
    fontWeight: '500',
  },
  positive: {
    color: '#10b981',
  },
  negative: {
    color: '#ef4444',
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
    color: '#1a1a2e',
  },
  aiSubtitle: {
    fontSize: 12,
    color: '#6c757d',
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
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  aiStatusText: {
    fontSize: 12,
    color: '#10b981',
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
    color: '#1a1a2e',
    marginBottom: 8,
  },
  aiSuggestionDescription: {
    fontSize: 13,
    color: '#6c757d',
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
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: 12,
  },
  aiMessageText: {
    fontSize: 14,
    color: '#1a1a2e',
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
    color: '#1a1a2e',
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
    width: screenWidth > 768 ? 'calc(33.33% - 11px)' : screenWidth > 480 ? 'calc(50% - 8px)' : '100%',
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
    color: '#94a3b8',
  },
  quickActionTitle: {
    fontSize: screenWidth > 768 ? 18 : 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  quickActionDescription: {
    fontSize: screenWidth > 768 ? 14 : 13,
    color: '#6c757d',
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
    color: '#1a1a2e',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  activityAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  creditAmount: {
    color: '#10b981',
  },
  debitAmount: {
    color: '#ef4444',
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