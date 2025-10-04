/**
 * Modern Screen Header Component
 * Reusable header with glassmorphic back button and centered title
 */

import React from 'react';
import {
  View,
  Text as RNText,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useTenantTheme } from '../../tenants/TenantContext';
import ModernBackButton from './ModernBackButton';

const { width: screenWidth } = Dimensions.get('window');

export interface ModernScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backgroundColor?: string;
  children?: React.ReactNode;
}

export const ModernScreenHeader: React.FC<ModernScreenHeaderProps> = ({
  title,
  subtitle,
  onBack,
  backgroundColor,
  children,
}) => {
  const tenantTheme = useTenantTheme();
  const isDesktop = screenWidth > 600;

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: isDesktop ? 'flex-start' : 'space-between',
      paddingHorizontal: 16,
      paddingVertical: Platform.OS === 'web' ? 12 : 16,
      paddingTop: Platform.OS === 'web' ? 12 : 20,
      backgroundColor: backgroundColor || tenantTheme.colors.primary,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: isDesktop ? 0 : undefined,
    },
    bankName: {
      fontSize: 18,
      fontWeight: '700',
      color: tenantTheme.colors.textInverse,
      marginRight: 24,
    },
    titleContainer: {
      flex: isDesktop ? 0 : 1,
      marginHorizontal: isDesktop ? 0 : 12,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: tenantTheme.colors.textInverse,
      textAlign: isDesktop ? 'left' : 'center',
    },
    subtitle: {
      fontSize: 14,
      color: tenantTheme.colors.textInverse,
      textAlign: isDesktop ? 'left' : 'center',
      marginTop: 4,
      opacity: 0.9,
    },
    headerSpacer: {
      width: 40,
    },
  });

  return (
    <View style={styles.header}>
      {onBack && (
        <ModernBackButton
          onPress={onBack}
          variant="glass"
          color="light"
          size="medium"
        />
      )}
      {isDesktop && (
        <RNText style={styles.bankName}>{tenantTheme.branding?.appTitle || 'Bank'}</RNText>
      )}
      <View style={styles.titleContainer}>
        <RNText style={styles.title}>{title}</RNText>
        {subtitle && <RNText style={styles.subtitle}>{subtitle}</RNText>}
        {children}
      </View>
      {!isDesktop && <View style={styles.headerSpacer} />}
    </View>
  );
};

export default ModernScreenHeader;
