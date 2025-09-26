/**
 * Web-Compatible Navigator
 * Simplified navigation for React Native Web testing
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  LoginScreen,
  DashboardScreen,
  AITransferScreen,
  TransactionHistoryScreen,
  TransactionDetailsScreen,
  SettingsScreen,
  AIChatScreen,
  RBACManagementScreen,
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

type Screen = 'Login' | 'Dashboard' | 'Transfer' | 'History' | 'TransactionDetails' | 'Settings' | 'CBNCompliance' | 'PCICompliance' | 'SecurityMonitoring' | 'AIChat' | 'RBACManagement';

interface WebNavigatorProps {
  isAuthenticated: boolean;
  onLogin: () => void;
}

const WebNavigator: React.FC<WebNavigatorProps> = ({ isAuthenticated, onLogin }) => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(isAuthenticated ? 'Dashboard' : 'Login');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>('');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [transactionCache, setTransactionCache] = useState<Record<string, any>>({});

  const navigate = (screen: Screen) => {
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
          <DashboardScreen
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
                default:
                  break;
              }
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
        return (
          <AITransferScreen
            onTransferComplete={() => navigate('Dashboard')}
            onBack={() => navigate('Dashboard')}
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
        return <AIChatScreen onBack={() => navigate('Dashboard')} />;
      case 'RBACManagement':
        return <RBACManagementScreen onGoBack={() => navigate('Dashboard')} />;
      default:
        return (
          <DashboardScreen
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
                default:
                  break;
              }
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
    backgroundColor: '#ffffff',
  },
  screen: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    paddingVertical: 8,
    height: 80,
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