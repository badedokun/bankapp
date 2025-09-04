/**
 * OrokiiPay Multi-Tenant Money Transfer System
 * Main App Component
 */

import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { TenantProvider, useTenant, useTenantTheme } from '@/tenants/TenantContext';
import LoadingScreen from '@/components/common/LoadingScreen';
import LoginScreen from '@/screens/auth/LoginScreen';

const AppContent: React.FC = () => {
  const { currentTenant, isLoading, error, switchTenant } = useTenant();
  const theme = useTenantTheme();
  const [showDemo, setShowDemo] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  // Show login screen if not authenticated
  if (!isAuthenticated && !showDemo) {
    return (
      <LoginScreen 
        onLogin={async (credentials) => {
          console.log('Login attempt:', credentials);
          // Simulate authentication
          await new Promise(resolve => setTimeout(resolve, 1000));
          setIsAuthenticated(true);
        }}
      />
    );
  }

  const handleTenantSwitch = async (tenantId: string) => {
    try {
      await switchTenant(tenantId);
    } catch (err) {
      console.error('Failed to switch tenant:', err);
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.lg,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: theme.typography.sizes.xxl,
      fontWeight: theme.typography.weights.bold as any,
      color: '#ffffff',
      marginBottom: theme.spacing.xs,
    },
    headerSubtitle: {
      fontSize: theme.typography.sizes.md,
      color: 'rgba(255, 255, 255, 0.9)',
    },
    content: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    welcomeCard: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    welcomeTitle: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.semibold as any,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    welcomeText: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.textSecondary,
      lineHeight: 22,
    },
    tenantInfo: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.lg,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    tenantLabel: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: theme.spacing.xs,
    },
    tenantName: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.semibold as any,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    tenantId: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      fontFamily: 'monospace',
    },
    demoSection: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
    },
    demoTitle: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.semibold as any,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    demoButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    demoButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      marginRight: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    demoButtonText: {
      color: '#ffffff',
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.medium as any,
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>OrokiiPay</Text>
        <Text style={dynamicStyles.headerSubtitle}>AI-Enhanced Money Transfer System</Text>
      </View>

      <View style={dynamicStyles.content}>
        <View style={dynamicStyles.welcomeCard}>
          <Text style={dynamicStyles.welcomeTitle}>Welcome to OrokiiPay!</Text>
          <Text style={dynamicStyles.welcomeText}>
            Your multi-tenant money transfer system is now running with React Native and React Native Web support.
          </Text>
        </View>

        <View style={dynamicStyles.tenantInfo}>
          <Text style={dynamicStyles.tenantLabel}>Current Tenant</Text>
          <Text style={dynamicStyles.tenantName}>{currentTenant?.displayName}</Text>
          <Text style={dynamicStyles.tenantId}>ID: {currentTenant?.id}</Text>
        </View>

        <View style={dynamicStyles.demoSection}>
          <Text style={dynamicStyles.demoTitle}>Demo: Switch Tenants</Text>
          <View style={dynamicStyles.demoButtons}>
            <TouchableOpacity 
              style={dynamicStyles.demoButton} 
              onPress={() => handleTenantSwitch('bank-a')}
            >
              <Text style={dynamicStyles.demoButtonText}>Bank A</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={dynamicStyles.demoButton} 
              onPress={() => handleTenantSwitch('bank-b')}
            >
              <Text style={dynamicStyles.demoButtonText}>Bank B</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={dynamicStyles.demoButton} 
              onPress={() => handleTenantSwitch('bank-c')}
            >
              <Text style={dynamicStyles.demoButtonText}>Bank C</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={dynamicStyles.demoButton} 
              onPress={() => handleTenantSwitch('default')}
            >
              <Text style={dynamicStyles.demoButtonText}>Default</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={dynamicStyles.demoSection}>
          <Text style={dynamicStyles.demoTitle}>Authentication Demo</Text>
          <View style={dynamicStyles.demoButtons}>
            <TouchableOpacity 
              style={dynamicStyles.demoButton} 
              onPress={() => setIsAuthenticated(false)}
            >
              <Text style={dynamicStyles.demoButtonText}>Show Login</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={dynamicStyles.demoButton} 
              onPress={() => setShowDemo(true)}
            >
              <Text style={dynamicStyles.demoButtonText}>Show Demo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
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