/**
 * OrokiiPay Multi-Tenant Money Transfer System
 * Main App Component with Navigation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import { TenantProvider, useTenant, useTenantTheme } from './src/tenants/TenantContext';
import { BankingAlertProvider } from './src/services/AlertService';
import LoadingScreen from './src/components/common/LoadingScreen';
import WebNavigator from './src/navigation/WebNavigator';
import APIService from './src/services/api';
import DemoAuthManager from './src/utils/demoAuth';
import DeploymentManager from './src/config/deployment';
import './src/utils/authTestHelper'; // Import test helper for development

const AppContent: React.FC = () => {
  const { currentTenant, isLoading, error } = useTenant();
  const theme = useTenantTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const isAuth = await APIService.isAuthenticated();
      setIsAuthenticated(isAuth);
    } catch (error) {
      console.log('Authentication check failed:', error);
      setIsAuthenticated(false);
    }
  };

  const handleLogin = useCallback(async () => {
    setIsAuthenticated(true);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await APIService.logout();
      await DemoAuthManager.clearDemoAuth();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
      setIsAuthenticated(false);
    }
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.error }]}>
        <Text style={[styles.errorTitle, { color: '#ffffff' }]}>
          Error Loading App
        </Text>
        <Text style={[styles.errorMessage, { color: '#ffffff' }]}>
          {error.message}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <BankingAlertProvider>
      <WebNavigator 
        isAuthenticated={isAuthenticated}
        onLogin={handleLogin}
      />
    </BankingAlertProvider>
  );
};

const App: React.FC = () => {
  return (
    <TenantProvider>
      <AppContent />
    </TenantProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});

export default App;