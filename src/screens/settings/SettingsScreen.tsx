/**
 * Settings & Profile Screen Component
 * Complete settings management with profile, security, and preferences
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Dimensions,
  Switch,
} from 'react-native';
import { useTenant, useTenantTheme } from '../../tenants/TenantContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import APIService from '../../services/api';

const { width: screenWidth } = Dimensions.get('window');

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  kycStatus: string;
  kycLevel: number;
  tier: string;
}

interface SecuritySettings {
  mfaEnabled: boolean;
  biometricEnabled: boolean;
  pinEnabled: boolean;
  loginNotifications: boolean;
}

interface AppPreferences {
  language: string;
  currency: string;
  theme: string;
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
    marketing: boolean;
  };
  aiAssistant: {
    enabled: boolean;
    suggestions: boolean;
    voiceCommands: boolean;
  };
}

type SettingsSection = 'profile' | 'security' | 'preferences' | 'ai' | 'notifications' | 'privacy' | 'support';

export interface SettingsScreenProps {
  onBack?: () => void;
  onLogout?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  onLogout,
}) => {
  const { currentTenant } = useTenant();
  const theme = useTenantTheme();
  
  // State
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    mfaEnabled: false,
    biometricEnabled: false,
    pinEnabled: true,
    loginNotifications: true,
  });
  const [appPreferences, setAppPreferences] = useState<AppPreferences>({
    language: 'en',
    currency: 'NGN',
    theme: 'auto',
    notifications: {
      push: true,
      email: true,
      sms: false,
      marketing: false,
    },
    aiAssistant: {
      enabled: true,
      suggestions: true,
      voiceCommands: false,
    },
  });

  // Load user profile and settings
  const loadUserData = useCallback(async () => {
    try {
      const profile = await APIService.getProfile();
      
      // Mock user profile data
      setUserProfile({
        firstName: profile.firstName || 'John',
        lastName: profile.lastName || 'Doe',
        email: profile.email || 'john.doe@example.com',
        phoneNumber: profile.profileData?.phoneNumber || '+2348012345678',
        dateOfBirth: '1990-05-15',
        gender: 'male',
        address: {
          street: '123 Lekki Phase 1',
          city: 'Lagos',
          state: 'Lagos',
          postalCode: '101001',
          country: 'Nigeria',
        },
        kycStatus: profile.kycStatus || 'verified',
        kycLevel: profile.kycLevel || 2,
        tier: 'Premium Account',
      });

      // Mock settings from profile
      setSecuritySettings({
        mfaEnabled: profile.mfaEnabled || false,
        biometricEnabled: profile.biometricEnabled || false,
        pinEnabled: true,
        loginNotifications: true,
      });
    } catch (error) {
      console.error('Failed to load user data:', error);
      Alert.alert('Error', 'Failed to load user data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Save profile changes
  const handleSaveProfile = useCallback(async () => {
    if (!userProfile) return;
    
    setIsSaving(true);
    try {
      await APIService.updateProfile({
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        phoneNumber: userProfile.phoneNumber,
      });
      
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  }, [userProfile]);

  // Navigation items
  const navigationItems = [
    { key: 'profile', icon: '👤', label: 'Profile Information' },
    { key: 'security', icon: '🔒', label: 'Security Settings' },
    { key: 'preferences', icon: '⚙️', label: 'App Preferences' },
    { key: 'ai', icon: '🤖', label: 'AI Assistant' },
    { key: 'notifications', icon: '🔔', label: 'Notifications' },
    { key: 'privacy', icon: '🛡️', label: 'Privacy & Data' },
    { key: 'support', icon: '💬', label: 'Help & Support' },
  ] as const;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    backButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '500',
    },
    headerTitle: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitleText: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 5,
    },
    headerSubtitle: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.9)',
    },
    saveButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: 20,
    },
    saveButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '500',
    },
    mainContainer: {
      flex: 1,
      flexDirection: 'row',
    },
    sidebar: {
      width: screenWidth < 768 ? screenWidth : 300,
      backgroundColor: '#ffffff',
      borderRightWidth: screenWidth >= 768 ? 1 : 0,
      borderRightColor: '#e1e5e9',
    },
    profileHeader: {
      alignItems: 'center',
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
    },
    profileAvatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
      position: 'relative',
    },
    avatarText: {
      color: '#ffffff',
      fontSize: 32,
      fontWeight: 'bold',
    },
    avatarUpload: {
      position: 'absolute',
      bottom: -5,
      right: -5,
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: theme.colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    uploadIcon: {
      fontSize: 16,
    },
    profileName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 4,
    },
    profileEmail: {
      fontSize: 14,
      color: '#666',
      marginBottom: 4,
    },
    profileTier: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '500',
      backgroundColor: theme.colors.primary + '20',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      borderRadius: 12,
    },
    navMenu: {
      padding: theme.spacing.md,
    },
    navItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderRadius: 12,
      marginBottom: theme.spacing.xs,
    },
    activeNavItem: {
      backgroundColor: theme.colors.primary + '20',
    },
    navIcon: {
      fontSize: 20,
      marginRight: theme.spacing.md,
      width: 24,
      textAlign: 'center',
    },
    navLabel: {
      fontSize: 16,
      color: '#333',
      fontWeight: '500',
    },
    activeNavLabel: {
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    contentArea: {
      flex: 1,
      backgroundColor: '#ffffff',
    },
    contentHeader: {
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
    },
    contentTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: theme.spacing.xs,
    },
    contentSubtitle: {
      fontSize: 16,
      color: '#666',
      lineHeight: 22,
    },
    contentBody: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    formSection: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: theme.spacing.md,
    },
    formGrid: {
      gap: theme.spacing.md,
    },
    formRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    formGroup: {
      flex: 1,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
    },
    settingLabel: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: '#333',
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 14,
      color: '#666',
    },
    settingControl: {
      marginLeft: theme.spacing.md,
    },
    actionButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: 12,
      alignItems: 'center',
      marginVertical: theme.spacing.sm,
    },
    actionButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    dangerButton: {
      backgroundColor: theme.colors.error,
    },
    supportItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
    },
    supportIcon: {
      fontSize: 24,
      marginRight: theme.spacing.md,
      width: 32,
      textAlign: 'center',
    },
    supportContent: {
      flex: 1,
    },
    supportTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: '#333',
      marginBottom: 2,
    },
    supportDescription: {
      fontSize: 14,
      color: '#666',
    },
    supportArrow: {
      fontSize: 16,
      color: '#999',
    },
  });

  const renderProfileSection = () => (
    <ScrollView style={dynamicStyles.contentArea} showsVerticalScrollIndicator={false}>
      <View style={dynamicStyles.contentHeader}>
        <Text style={dynamicStyles.contentTitle}>👤 Profile Information</Text>
        <Text style={dynamicStyles.contentSubtitle}>
          Update your personal details and account information
        </Text>
      </View>
      
      <View style={dynamicStyles.contentBody}>
        {userProfile && (
          <>
            <View style={dynamicStyles.formSection}>
              <Text style={dynamicStyles.sectionTitle}>📝 Personal Details</Text>
              <View style={dynamicStyles.formGrid}>
                <View style={dynamicStyles.formRow}>
                  <View style={dynamicStyles.formGroup}>
                    <Input
                      label="First Name"
                      value={userProfile.firstName}
                      onChangeText={(text) => setUserProfile({...userProfile, firstName: text})}
                      placeholder="Enter your first name"
                    />
                  </View>
                  <View style={dynamicStyles.formGroup}>
                    <Input
                      label="Last Name"
                      value={userProfile.lastName}
                      onChangeText={(text) => setUserProfile({...userProfile, lastName: text})}
                      placeholder="Enter your last name"
                    />
                  </View>
                </View>
                
                <Input
                  label="Email Address"
                  value={userProfile.email}
                  onChangeText={(text) => setUserProfile({...userProfile, email: text})}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                />
                
                <Input
                  label="Phone Number"
                  value={userProfile.phoneNumber}
                  onChangeText={(text) => setUserProfile({...userProfile, phoneNumber: text})}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={dynamicStyles.formSection}>
              <Text style={dynamicStyles.sectionTitle}>📍 Address Information</Text>
              <View style={dynamicStyles.formGrid}>
                <Input
                  label="Street Address"
                  value={userProfile.address.street}
                  onChangeText={(text) => setUserProfile({
                    ...userProfile, 
                    address: {...userProfile.address, street: text}
                  })}
                  placeholder="Enter your street address"
                />
                
                <View style={dynamicStyles.formRow}>
                  <View style={dynamicStyles.formGroup}>
                    <Input
                      label="City"
                      value={userProfile.address.city}
                      onChangeText={(text) => setUserProfile({
                        ...userProfile, 
                        address: {...userProfile.address, city: text}
                      })}
                      placeholder="Enter your city"
                    />
                  </View>
                  <View style={dynamicStyles.formGroup}>
                    <Input
                      label="State"
                      value={userProfile.address.state}
                      onChangeText={(text) => setUserProfile({
                        ...userProfile, 
                        address: {...userProfile.address, state: text}
                      })}
                      placeholder="Enter your state"
                    />
                  </View>
                </View>
              </View>
            </View>

            <Button
              title={isSaving ? "Saving..." : "💾 Save Changes"}
              onPress={handleSaveProfile}
              loading={isSaving}
              style={dynamicStyles.actionButton}
            />
          </>
        )}
      </View>
    </ScrollView>
  );

  const renderSecuritySection = () => (
    <ScrollView style={dynamicStyles.contentArea} showsVerticalScrollIndicator={false}>
      <View style={dynamicStyles.contentHeader}>
        <Text style={dynamicStyles.contentTitle}>🔒 Security Settings</Text>
        <Text style={dynamicStyles.contentSubtitle}>
          Manage your account security and authentication methods
        </Text>
      </View>
      
      <View style={dynamicStyles.contentBody}>
        <View style={dynamicStyles.formSection}>
          <Text style={dynamicStyles.sectionTitle}>🛡️ Authentication</Text>
          
          <View style={dynamicStyles.settingItem}>
            <View style={dynamicStyles.settingLabel}>
              <Text style={dynamicStyles.settingTitle}>Two-Factor Authentication</Text>
              <Text style={dynamicStyles.settingDescription}>
                Add an extra layer of security to your account
              </Text>
            </View>
            <Switch
              value={securitySettings.mfaEnabled}
              onValueChange={(value) => setSecuritySettings({...securitySettings, mfaEnabled: value})}
            />
          </View>

          <View style={dynamicStyles.settingItem}>
            <View style={dynamicStyles.settingLabel}>
              <Text style={dynamicStyles.settingTitle}>Biometric Authentication</Text>
              <Text style={dynamicStyles.settingDescription}>
                Use fingerprint or face recognition for quick access
              </Text>
            </View>
            <Switch
              value={securitySettings.biometricEnabled}
              onValueChange={(value) => setSecuritySettings({...securitySettings, biometricEnabled: value})}
            />
          </View>

          <View style={dynamicStyles.settingItem}>
            <View style={dynamicStyles.settingLabel}>
              <Text style={dynamicStyles.settingTitle}>Login Notifications</Text>
              <Text style={dynamicStyles.settingDescription}>
                Get notified when someone logs into your account
              </Text>
            </View>
            <Switch
              value={securitySettings.loginNotifications}
              onValueChange={(value) => setSecuritySettings({...securitySettings, loginNotifications: value})}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={dynamicStyles.actionButton}
          onPress={() => Alert.alert('Change Password', 'Password change feature coming soon!')}
        >
          <Text style={dynamicStyles.actionButtonText}>🔑 Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[dynamicStyles.actionButton, dynamicStyles.dangerButton]}
          onPress={onLogout}
        >
          <Text style={dynamicStyles.actionButtonText}>🚪 Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderSupportSection = () => (
    <ScrollView style={dynamicStyles.contentArea} showsVerticalScrollIndicator={false}>
      <View style={dynamicStyles.contentHeader}>
        <Text style={dynamicStyles.contentTitle}>💬 Help & Support</Text>
        <Text style={dynamicStyles.contentSubtitle}>
          Get help, report issues, and contact our support team
        </Text>
      </View>
      
      <View style={dynamicStyles.contentBody}>
        <TouchableOpacity style={dynamicStyles.supportItem}>
          <Text style={dynamicStyles.supportIcon}>❓</Text>
          <View style={dynamicStyles.supportContent}>
            <Text style={dynamicStyles.supportTitle}>Frequently Asked Questions</Text>
            <Text style={dynamicStyles.supportDescription}>Find answers to common questions</Text>
          </View>
          <Text style={dynamicStyles.supportArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={dynamicStyles.supportItem}>
          <Text style={dynamicStyles.supportIcon}>💬</Text>
          <View style={dynamicStyles.supportContent}>
            <Text style={dynamicStyles.supportTitle}>Live Chat Support</Text>
            <Text style={dynamicStyles.supportDescription}>Chat with our support team</Text>
          </View>
          <Text style={dynamicStyles.supportArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={dynamicStyles.supportItem}>
          <Text style={dynamicStyles.supportIcon}>📧</Text>
          <View style={dynamicStyles.supportContent}>
            <Text style={dynamicStyles.supportTitle}>Email Support</Text>
            <Text style={dynamicStyles.supportDescription}>Send us an email</Text>
          </View>
          <Text style={dynamicStyles.supportArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={dynamicStyles.supportItem}>
          <Text style={dynamicStyles.supportIcon}>🐛</Text>
          <View style={dynamicStyles.supportContent}>
            <Text style={dynamicStyles.supportTitle}>Report a Bug</Text>
            <Text style={dynamicStyles.supportDescription}>Help us improve the app</Text>
          </View>
          <Text style={dynamicStyles.supportArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection();
      case 'security':
        return renderSecuritySection();
      case 'support':
        return renderSupportSection();
      default:
        return (
          <View style={[dynamicStyles.contentArea, { alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 48, marginBottom: theme.spacing.md }}>🚧</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#666', marginBottom: theme.spacing.sm }}>
              Coming Soon
            </Text>
            <Text style={{ fontSize: 14, color: '#999', textAlign: 'center' }}>
              This feature is under development and will be available soon!
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <View style={dynamicStyles.header}>
        <View style={dynamicStyles.headerContent}>
          <TouchableOpacity style={dynamicStyles.backButton} onPress={onBack}>
            <Text style={dynamicStyles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          <View style={dynamicStyles.headerTitle}>
            <Text style={dynamicStyles.headerTitleText}>Settings & Profile</Text>
            <Text style={dynamicStyles.headerSubtitle}>Manage your account and preferences</Text>
          </View>

          {activeSection === 'profile' && (
            <TouchableOpacity style={dynamicStyles.saveButton} onPress={handleSaveProfile}>
              <Text style={dynamicStyles.saveButtonText}>💾 Save</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={dynamicStyles.mainContainer}>
        {/* Sidebar */}
        {screenWidth < 768 ? (
          // Mobile: Show sections as tabs or modal
          <></>
        ) : (
          <View style={dynamicStyles.sidebar}>
            {/* Profile Header */}
            {userProfile && (
              <View style={dynamicStyles.profileHeader}>
                <View style={dynamicStyles.profileAvatar}>
                  <Text style={dynamicStyles.avatarText}>
                    {userProfile.firstName[0]}{userProfile.lastName[0]}
                  </Text>
                  <View style={dynamicStyles.avatarUpload}>
                    <Text style={dynamicStyles.uploadIcon}>📷</Text>
                  </View>
                </View>
                <Text style={dynamicStyles.profileName}>
                  {userProfile.firstName} {userProfile.lastName}
                </Text>
                <Text style={dynamicStyles.profileEmail}>{userProfile.email}</Text>
                <Text style={dynamicStyles.profileTier}>{userProfile.tier}</Text>
              </View>
            )}

            {/* Navigation Menu */}
            <View style={dynamicStyles.navMenu}>
              {navigationItems.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    dynamicStyles.navItem,
                    activeSection === item.key && dynamicStyles.activeNavItem
                  ]}
                  onPress={() => setActiveSection(item.key as SettingsSection)}
                >
                  <Text style={dynamicStyles.navIcon}>{item.icon}</Text>
                  <Text style={[
                    dynamicStyles.navLabel,
                    activeSection === item.key && dynamicStyles.activeNavLabel
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Content Area */}
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SettingsScreen;