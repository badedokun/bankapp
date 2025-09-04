/**
 * Loading Screen Component
 * Shows loading state with tenant branding
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTenantTheme } from '@/tenants/TenantContext';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading OrokiiPay...' 
}) => {
  const theme = useTenantTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.xl,
    },
    logo: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    logoText: {
      fontSize: theme.typography.sizes.xxxl,
      fontWeight: theme.typography.weights.bold as any,
      color: '#ffffff',
    },
    message: {
      fontSize: theme.typography.sizes.lg,
      color: '#ffffff',
      textAlign: 'center',
      marginBottom: theme.spacing.md,
      fontFamily: theme.typography.fontFamily,
    },
    spinner: {
      marginTop: theme.spacing.md,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>O</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
      <ActivityIndicator size="large" color="#ffffff" style={styles.spinner} />
    </View>
  );
};

export default LoadingScreen;