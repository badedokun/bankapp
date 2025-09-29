/**
 * OrokiiPay Multi-Tenant Money Transfer System
 * Main App Component with Navigation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import { TenantProvider, useTenant } from './src/tenants/TenantContext';
import { TenantThemeProvider, useTenantTheme } from './src/context/TenantThemeContext';
import { BankingAlertProvider } from './src/services/AlertService';
import LoadingScreen from './src/components/common/LoadingScreen';
import WebNavigator from './src/navigation/WebNavigator';
import APIService from './src/services/api';
import DemoAuthManager from './src/utils/demoAuth';
import DeploymentManager from './src/config/deployment';
import './src/utils/authTestHelper'; // Import test helper for development

const AppContent: React.FC = () => {
  const { currentTenant, isLoading, error } = useTenant();
  const { theme } = useTenantTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on app start
  useEffect(() => {
    // SECURITY: Clear all authentication on app launch to prevent bypass
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    sessionStorage.clear();
    setIsAuthenticated(false);

    // Listen for storage changes (in case login happens in another tab or component)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token') {
        if (e.newValue) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom auth events
    const handleAuthChange = (e: CustomEvent) => {
      checkAuthStatus();
    };

    window.addEventListener('authStateChanged' as any, handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged' as any, handleAuthChange);
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      // First check if we have a token in localStorage
      const token = localStorage.getItem('access_token');
      if (token) {
        setIsAuthenticated(true);
        // Verify token validity in background (don't block UI)
        APIService.isAuthenticated().then((valid) => {
          if (!valid) {
            setIsAuthenticated(false);
          }
        }).catch(() => {
          // Token validation failed, but keep user logged in for now
        });
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
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
      setIsAuthenticated(false);
    }
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.danger }]}>
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
      <TenantThemeProvider>
        <AppContent />
      </TenantThemeProvider>
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