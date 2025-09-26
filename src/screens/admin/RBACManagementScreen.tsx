/**
 * RBAC Management Screen
 * Provides role-based access control management interface
 */

import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { RBACDashboardMobile } from '../../components/admin/RBACDashboardMobile';
import { useTenantTheme } from '../../tenants/TenantContext';

export interface RBACManagementScreenProps {
  onGoBack?: () => void;
}

export const RBACManagementScreen: React.FC<RBACManagementScreenProps> = ({
  onGoBack,
}) => {
  const theme = useTenantTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      <RBACDashboardMobile onGoBack={onGoBack} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default RBACManagementScreen;