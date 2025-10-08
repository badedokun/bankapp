/**
 * Web-Compatible Navigator
 * Simplified navigation for React Native Web testing
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import {
  LoginScreen,
  ModernDashboardScreen,
  CompleteTransferFlowScreen,
  CompleteTransferFlow,
  ModernTransferMenuScreen,
  ExternalTransferScreen,
  BillPaymentScreen,
  ModernSavingsMenuScreen,
  FlexibleSavingsScreen,
  ModernLoansMenuScreen,
  PersonalLoanScreen,
  TransactionHistoryScreen,
  TransactionDetailsScreen,
  SettingsScreen,
  ModernAIChatScreen,
  ModernRBACManagementScreen,
} from '../screens';
import CBNComplianceScreen from '../screens/security/CBNComplianceScreen';

/**
 * React Native Compatibility Check
 * Determines if running in React Native environment
 */
const isReactNative = (): boolean => {
  return typeof window === 'undefined' && typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
};
import PCIDSSComplianceScreen from '../screens/security/PCIDSSComplianceScreen';
import SecurityMonitoringScreen from '../screens/security/SecurityMonitoringScreen';

type Screen = 'Login' | 'Dashboard' | 'Transfer' | 'History' | 'TransactionDetails' | 'Settings' | 'CBNCompliance' | 'PCICompliance' | 'SecurityMonitoring' | 'AIChat' | 'RBACManagement' | 'Savings' | 'FlexibleSavings' | 'Loans' | 'PersonalLoan';

interface WebNavigatorProps {
  isAuthenticated: boolean;
  onLogin: () => void;
}

const WebNavigator: React.FC<WebNavigatorProps> = ({ isAuthenticated, onLogin }) => {
  // SECURITY: Always default to login page for security
  const [currentScreen, setCurrentScreen] = useState<Screen>('Login');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>('');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [transactionCache, setTransactionCache] = useState<Record<string, any>>({});
  const [showTransferFlow, setShowTransferFlow] = useState(false);
  const [transferFlowType, setTransferFlowType] = useState<'interbank' | 'same-bank' | 'international' | 'card'>('same-bank');

  // Dashboard refresh function ref
  const dashboardRefreshRef = React.useRef<(() => Promise<void>) | null>(null);

  // Update currentScreen when isAuthenticated prop changes
  useEffect(() => {
    if (isAuthenticated && currentScreen === 'Login') {
      setCurrentScreen('Dashboard');
    } else if (!isAuthenticated && currentScreen !== 'Login') {
      setCurrentScreen('Login');
    }
  }, [isAuthenticated]);

  const navigate = (screen: Screen) => {
    // If navigating back to dashboard from transfers, refresh recent activity
    if (screen === 'Dashboard' && currentScreen === 'Transfer' && dashboardRefreshRef.current) {
      // Trigger dashboard refresh after navigation
      setTimeout(() => {
        dashboardRefreshRef.current?.();
      }, 100);
    }
    setCurrentScreen(screen);
  };

  const handleTransactionDetails = (transactionId: string, transaction?: any) => {

    // Cache the transaction data for reliable access
    if (transaction) {
      setTransactionCache(prev => ({ ...prev, [transactionId]: transaction }));
    }

    // Use React 18's automatic batching by wrapping in a callback
    React.startTransition(() => {
      setSelectedTransactionId(transactionId);
      setSelectedTransaction(transaction);
      setCurrentScreen('TransactionDetails');
    });
  };

  const renderScreen = () => {
    if (!isAuthenticated && currentScreen !== 'Login') {
      setCurrentScreen('Login');
      return null;
    }

    switch (currentScreen) {
      case 'Login':
        return (
          <LoginScreen
            // Don't override onLogin - let LoginScreen use APIService.login
            navigation={{
              replace: (screen: string) => {
                if (screen === 'MainApp') {
                  onLogin();
                  setCurrentScreen('Dashboard');
                }
              }
            } as any}
          />
        );
      case 'Dashboard':
        return (
          <ModernDashboardScreen
            onNavigateToTransfer={() => navigate('Transfer')}
            onNavigateToHistory={() => navigate('History')}
            onNavigateToSettings={() => navigate('Settings')}
            onNavigateToTransactionDetails={handleTransactionDetails}
            onNavigateToAIChat={() => navigate('AIChat')}
            onNavigateToFeature={(feature: string, params?: any) => {
              // Handle specific feature navigation
              switch (feature) {
                case 'rbac_management':
                  navigate('RBACManagement');
                  break;
                case 'money_transfer_operations':
                  navigate('Transfer');
                  break;
                case 'savings_products':
                  navigate('Savings');
                  break;
                case 'loan_products':
                  navigate('Loans');
                  break;
                case 'bill_payments':
                  navigate('BillPayment');
                  break;
                case 'transaction_history':
                  navigate('History');
                  break;
                case 'operations_management':
                  // TODO: Create OperationsManagementScreen for consolidated operations
                  navigate('Dashboard');
                  break;
                case 'management_reports':
                  // TODO: Create ManagementReportsScreen for consolidated reporting
                  navigate('Dashboard');
                  break;
                // Legacy support for individual features (if still accessed directly)
                case 'external_transfers':
                  navigate('ExternalTransfer');
                  break;
                case 'flexible_savings':
                  navigate('FlexibleSavings');
                  break;
                case 'personal_loans':
                  navigate('PersonalLoan');
                  break;
                default:
                  break;
              }
            }}
            onDashboardRefresh={(refreshFunction) => {
              dashboardRefreshRef.current = refreshFunction;
            }}
            onLogout={async () => {
              // Properly logout through API to clear tokens
              const APIService = await import('../services/api');
              await APIService.default.logout();
              navigate('Login');
              // Force reload to clear state (web only)
              if (!isReactNative() && typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
          />
        );
      case 'Transfer':
        // Show CompleteTransferFlow if showTransferFlow is true
        if (showTransferFlow) {
          return (
            <CompleteTransferFlow
              transferType={transferFlowType}
              onBack={() => {
                setShowTransferFlow(false);
              }}
              onComplete={() => {
                setShowTransferFlow(false);
                navigate('Dashboard');
              }}
            />
          );
        }

        // Show the Modern Transfer Menu (Send Money page)
        return (
          <ModernTransferMenuScreen
            onBack={() => navigate('Dashboard')}
            onSelectTransfer={(type) => {
              // Handle transfer type selection from menu - go directly to form
              if (type === 'internal') {
                setTransferFlowType('same-bank');
                setShowTransferFlow(true);
              } else if (type === 'external') {
                setTransferFlowType('interbank');
                setShowTransferFlow(true);
              } else if (type === 'international') {
                setTransferFlowType('international');
                setShowTransferFlow(true);
              }
            }}
          />
        );
      case 'History':
        return (
          <TransactionHistoryScreen
            onBack={() => navigate('Dashboard')}
            onTransactionDetails={handleTransactionDetails}
          />
        );
      case 'Settings':
        return (
          <SettingsScreen
            onBack={() => navigate('Dashboard')}
            onLogout={async () => {
              // Properly logout through API to clear tokens
              const APIService = await import('../services/api');
              await APIService.default.logout();
              navigate('Login');
              // Force reload to clear state (web only)
              if (!isReactNative() && typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
          />
        );
      case 'TransactionDetails':
        const cachedTransaction = transactionCache[selectedTransactionId];
        const transactionToUse = selectedTransaction || cachedTransaction;

        return (
          <TransactionDetailsScreen
            transactionId={selectedTransactionId}
            transaction={transactionToUse}
            onBack={() => navigate('History')}
            onReport={(transactionId) => {
              // TODO: Implement report functionality
            }}
            onRetry={(transactionId) => {
              navigate('Transfer');
            }}
          />
        );
      case 'AIChat':
        return <ModernAIChatScreen
          navigation={{ goBack: () => navigate('Dashboard') }}
          onBack={() => navigate('Dashboard')}
        />;
      case 'RBACManagement':
        return <ModernRBACManagementScreen
          navigation={{
            goBack: () => navigate('Dashboard'),
          }}
          onGoBack={() => navigate('Dashboard')}
        />;
      case 'ExternalTransfer':
        return <ExternalTransferScreen onBack={() => navigate('Dashboard')} onTransferComplete={() => navigate('Dashboard')} />;
      case 'BillPayment':
        return <BillPaymentScreen onBack={() => navigate('Dashboard')} onPaymentComplete={() => navigate('Dashboard')} />;
      case 'Savings':
        return <ModernSavingsMenuScreen
          navigation={{
            navigate: (screen: string) => {
              if (screen === 'FlexibleSavings') {
                navigate('FlexibleSavings');
              }
            },
            goBack: () => navigate('Dashboard'),
          }}
          onBack={() => navigate('Dashboard')}
          onSelectProduct={(productId) => {
            if (productId === 'flexible') {
              navigate('FlexibleSavings');
            }
          }}
        />;
      case 'Loans':
        return <ModernLoansMenuScreen
          navigation={{
            navigate: (screen: string) => {
              if (screen === 'PersonalLoan') {
                navigate('PersonalLoan');
              }
            },
            goBack: () => navigate('Dashboard'),
          }}
          onBack={() => navigate('Dashboard')}
          onSelectProduct={(productId) => {
            if (productId === 'personal') {
              navigate('PersonalLoan');
            }
          }}
        />;
      case 'FlexibleSavings':
        return <FlexibleSavingsScreen onBack={() => navigate('Dashboard')} onSavingComplete={() => navigate('Dashboard')} />;
      case 'PersonalLoan':
        return <PersonalLoanScreen onBack={() => navigate('Dashboard')} onLoanComplete={() => navigate('Dashboard')} />;
      default:
        return (
          <ModernDashboardScreen
            onNavigateToTransfer={() => navigate('Transfer')}
            onNavigateToHistory={() => navigate('History')}
            onNavigateToSettings={() => navigate('Settings')}
            onNavigateToTransactionDetails={handleTransactionDetails}
            onNavigateToAIChat={() => navigate('AIChat')}
            onNavigateToFeature={(feature: string, params?: any) => {
              // Handle specific feature navigation
              switch (feature) {
                case 'rbac_management':
                  navigate('RBACManagement');
                  break;
                case 'money_transfer_operations':
                  navigate('Transfer');
                  break;
                case 'savings_products':
                  navigate('Savings');
                  break;
                case 'loan_products':
                  navigate('Loans');
                  break;
                case 'bill_payments':
                  navigate('BillPayment');
                  break;
                case 'transaction_history':
                  navigate('History');
                  break;
                case 'operations_management':
                  // TODO: Create OperationsManagementScreen for consolidated operations
                  navigate('Dashboard');
                  break;
                case 'management_reports':
                  // TODO: Create ManagementReportsScreen for consolidated reporting
                  navigate('Dashboard');
                  break;
                // Legacy support for individual features (if still accessed directly)
                case 'external_transfers':
                  navigate('ExternalTransfer');
                  break;
                case 'flexible_savings':
                  navigate('FlexibleSavings');
                  break;
                case 'personal_loans':
                  navigate('PersonalLoan');
                  break;
                default:
                  break;
              }
            }}
            onDashboardRefresh={(refreshFunction) => {
              dashboardRefreshRef.current = refreshFunction;
            }}
            onLogout={async () => {
              // Properly logout through API to clear tokens
              const APIService = await import('../services/api');
              await APIService.default.logout();
              navigate('Login');
              // Force reload to clear state (web only)
              if (!isReactNative() && typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
          />
        );
    }
  };

  const renderTabBar = () => {
    if (!isAuthenticated || currentScreen === 'Login') return null;

    return (
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, currentScreen === 'Dashboard' && styles.activeTab]}
            onPress={() => navigate('Dashboard')}
          >
            <Text style={styles.tabIcon}>🏠</Text>
            <Text style={[styles.tabLabel, currentScreen === 'Dashboard' && styles.activeLabel]}>
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, currentScreen === 'Transfer' && styles.activeTab]}
            onPress={() => navigate('Transfer')}
          >
            <Text style={styles.tabIcon}>💸</Text>
            <Text style={[styles.tabLabel, currentScreen === 'Transfer' && styles.activeLabel]}>
              Send Money
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, currentScreen === 'History' && styles.activeTab]}
            onPress={() => navigate('History')}
          >
            <Text style={styles.tabIcon}>📊</Text>
            <Text style={[styles.tabLabel, currentScreen === 'History' && styles.activeLabel]}>
              History
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, currentScreen === 'AIChat' && styles.activeTab]}
            onPress={() => navigate('AIChat')}
          >
            <Text style={styles.tabIcon}>🤖</Text>
            <Text style={[styles.tabLabel, currentScreen === 'AIChat' && styles.activeLabel]}>
              AI Assistant
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, currentScreen === 'Settings' && styles.activeTab]}
            onPress={() => navigate('Settings')}
          >
            <Text style={styles.tabIcon}>⚙️</Text>
            <Text style={[styles.tabLabel, currentScreen === 'Settings' && styles.activeLabel]}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.screen}>
        {renderScreen()}
      </View>
      {renderTabBar()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  screen: {
    flex: 1,
  },
  tabBarContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  activeLabel: {
    color: '#007bff',
  },
});

export default WebNavigator;