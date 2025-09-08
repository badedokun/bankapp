/**
 * Secure Login Screen Component
 * Multi-tenant login with comprehensive security features
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { useTenant, useTenantTheme, useTenantBranding } from '@/tenants/TenantContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { SecurityMonitor, SecurityConfig } from '@/utils/security';
import APIService from '@/services/api';
import DeploymentManager from '@/config/deployment';

const { width: screenWidth } = Dimensions.get('window');

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginScreenProps {
  onLogin?: (credentials: LoginFormData) => Promise<void>;
  onForgotPassword?: () => void;
  onBiometricAuth?: (type: 'fingerprint' | 'faceId' | 'voice') => void;
  navigation?: any; // React Navigation prop
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onForgotPassword,
  onBiometricAuth,
  navigation,
}) => {
  const { currentTenant, isLoading } = useTenant();
  const theme = useTenantTheme();
  const branding = useTenantBranding();
  const deploymentBranding = DeploymentManager.getDeploymentBranding();

  // Form state with security validation
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  
  const [formErrors, setFormErrors] = useState<Partial<LoginFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  
  // Refs for input fields
  const passwordInputRef = useRef<any>(null);

  // Security monitoring
  useEffect(() => {
    // Reset login attempts when component mounts or tenant changes
    if (currentTenant?.id) {
      setLoginAttempts(0);
    }
  }, [currentTenant?.id]);

  // Handle form field changes with validation
  const handleFieldChange = useCallback((field: keyof LoginFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [formErrors]);

  // Validate individual fields
  const handleEmailValidation = useCallback((isValid: boolean, error?: string) => {
    if (!isValid && error) {
      setFormErrors(prev => ({ ...prev, email: error }));
    } else {
      setFormErrors(prev => ({ ...prev, email: undefined }));
    }
  }, []);

  const handlePasswordValidation = useCallback((isValid: boolean, error?: string) => {
    if (!isValid && error) {
      setFormErrors(prev => ({ ...prev, password: error }));
    } else {
      setFormErrors(prev => ({ ...prev, password: undefined }));
    }
  }, []);

  // Handle form submission with security checks
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    // Check if user is blocked due to too many attempts
    const attemptCheck = SecurityMonitor.trackLoginAttempt(formData.email || 'anonymous');
    if (attemptCheck.blocked) {
      Alert.alert(
        'Account Temporarily Locked',
        'Too many failed login attempts. Please try again in 1 hour or contact support.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Validate form data
    const hasErrors = Object.values(formErrors).some(error => error !== undefined);
    if (hasErrors || !formData.email || !formData.password) {
      Alert.alert('Validation Error', 'Please fix the errors and try again.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (onLogin) {
        // Use custom login handler if provided
        await onLogin(formData);
        SecurityMonitor.resetLoginAttempts(formData.email);
      } else {
        // Use API service for authentication
        console.log('Attempting API login with:', {
          tenant: currentTenant?.id,
          email: formData.email,
          timestamp: new Date().toISOString(),
        });
        
        const loginResponse = await APIService.login({
          email: formData.email,
          password: formData.password,
          tenantId: currentTenant?.id,
          deviceInfo: {
            rememberMe: formData.rememberMe,
            platform: Platform.OS,
            screenSize: `${screenWidth}x${Dimensions.get('window').height}`,
          }
        });
        
        // Reset attempts on successful login
        SecurityMonitor.resetLoginAttempts(formData.email);
        
        Alert.alert(
          'Login Successful',
          `Welcome back, ${loginResponse.user.firstName}! You have ${loginResponse.user.wallet?.availableBalance ? `₦${loginResponse.user.wallet.availableBalance}` : '₦0'} available.`,
          [
            {
              text: 'Continue',
              onPress: () => {
                console.log('Login successful, user data:', {
                  id: loginResponse.user.id,
                  name: `${loginResponse.user.firstName} ${loginResponse.user.lastName}`,
                  tenant: loginResponse.user.tenant.displayName,
                  balance: loginResponse.user.wallet?.availableBalance
                });
                
                // Navigate to main app (would be handled by navigation prop)
                if (navigation) {
                  navigation.replace('MainApp');
                }
              }
            }
          ]
        );
      }
      
    } catch (error: any) {
      console.error('Login error:', error);
      setLoginAttempts(prev => prev + 1);
      
      // Handle different error types
      let errorMessage = 'Invalid email or password. Please try again.';
      let errorTitle = 'Login Failed';
      
      if (error?.message) {
        if (error.message.includes('Account locked') || error.message.includes('too many')) {
          errorTitle = 'Account Locked';
          errorMessage = 'Too many failed attempts. Please try again later or contact support.';
        } else if (error.message.includes('Account is inactive') || error.message.includes('suspended')) {
          errorTitle = 'Account Inactive';
          errorMessage = 'Your account is currently inactive. Please contact support.';
        } else if (error.message.includes('Server is not accessible')) {
          errorTitle = 'Connection Error';
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
        } else if (error.message.includes('Invalid credentials')) {
          errorMessage = 'The email or password you entered is incorrect. Please try again.';
        }
      }
      
      Alert.alert(errorTitle, errorMessage, [{ text: 'OK' }]);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, formErrors, isSubmitting, onLogin, currentTenant]);

  // Handle biometric authentication
  const handleBiometricAuth = useCallback((type: 'fingerprint' | 'faceId' | 'voice') => {
    if (onBiometricAuth) {
      onBiometricAuth(type);
    } else {
      Alert.alert(
        `${type.charAt(0).toUpperCase() + type.slice(1)} Authentication`,
        `${type} authentication would be triggered here in a real app.`,
        [{ text: 'OK' }]
      );
    }
  }, [onBiometricAuth]);

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // Handle forgot password
  const handleForgotPassword = useCallback(() => {
    if (onForgotPassword) {
      onForgotPassword();
    } else {
      Alert.alert('Forgot Password', 'Password reset functionality would be triggered here.');
    }
  }, [onForgotPassword]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: `linear-gradient(135deg, ${theme.colors.primary}22 0%, ${theme.colors.secondary}22 100%)`,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.xl,
    },
    loginCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      marginHorizontal: screenWidth > 600 ? '20%' : 0,
      maxWidth: 400,
      alignSelf: 'center',
      width: '100%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 10,
    },
    tenantHeader: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.xl,
      paddingHorizontal: theme.spacing.lg,
      alignItems: 'center',
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
    },
    tenantLogo: {
      width: 70,
      height: 70,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 35,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      overflow: 'hidden',
    },
    tenantLogoText: {
      fontSize: theme.typography.sizes.xxxl,
      fontWeight: theme.typography.weights.bold as any,
      color: '#ffffff',
    },
    tenantLogoImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
    },
    tenantName: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.semibold as any,
      color: '#ffffff',
      marginBottom: theme.spacing.xs,
    },
    tenantSubtitle: {
      fontSize: theme.typography.sizes.sm,
      color: 'rgba(255, 255, 255, 0.9)',
    },
    formContainer: {
      padding: theme.spacing.xl,
    },
    welcomeSection: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    welcomeTitle: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.semibold as any,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    welcomeSubtitle: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    formSection: {
      marginBottom: theme.spacing.lg,
    },
    rememberForgotContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    rememberContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rememberText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text,
      marginLeft: theme.spacing.sm,
    },
    forgotPasswordButton: {
      padding: theme.spacing.xs,
    },
    forgotPasswordText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.primary,
      fontWeight: theme.typography.weights.medium as any,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: theme.spacing.lg,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: '#e1e5e9',
    },
    dividerText: {
      paddingHorizontal: theme.spacing.md,
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
    },
    biometricContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: theme.spacing.md,
    },
    biometricButton: {
      width: 60,
      height: 60,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      borderWidth: 2,
      borderColor: '#e1e5e9',
      justifyContent: 'center',
      alignItems: 'center',
    },
    biometricButtonActive: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}10`,
    },
    biometricIcon: {
      fontSize: 24,
    },
    securityInfo: {
      marginTop: theme.spacing.lg,
      padding: theme.spacing.md,
      backgroundColor: `${theme.colors.info}10`,
      borderRadius: theme.borderRadius.sm,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.info,
    },
    securityText: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: theme.colors.text }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get tenant logo initials
  const getTenantLogoInitials = () => {
    if (!currentTenant?.displayName) return 'O';
    return currentTenant.displayName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.loginCard}>
          {/* Tenant Header */}
          <View style={styles.tenantHeader}>
            <View style={[
              styles.tenantLogo,
              currentTenant?.id === 'fmfb' && { backgroundColor: '#FFFFFF' }
            ]}>
              {currentTenant?.id === 'fmfb' ? (
                <Image 
                  source={{ uri: `http://localhost:3001/api/tenants/by-name/fmfb/assets/logo/default` }}
                  style={styles.tenantLogoImage}
                  resizeMode="contain"
                  onError={() => console.log('Failed to load FMFB logo, falling back to initials')}
                />
              ) : (
                <Text style={styles.tenantLogoText}>
                  {getTenantLogoInitials()}
                </Text>
              )}
            </View>
            <Text style={styles.tenantName}>
              {currentTenant?.displayName || deploymentBranding.loginPageTitle}
            </Text>
            <Text style={styles.tenantSubtitle}>
              {currentTenant ? 'Secure Money Transfer' : 'AI-Enhanced Banking Platform'}
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Welcome Back</Text>
              <Text style={styles.welcomeSubtitle}>
                Sign in to your account to continue
              </Text>
            </View>

            <View style={styles.formSection}>
              <Input
                label="Email or Phone"
                placeholder="Enter your email or phone number"
                validationType="email"
                value={formData.email}
                onChangeText={(text) => handleFieldChange('email', text)}
                onValidationChange={handleEmailValidation}
                enableSecurityValidation={true}
                returnKeyType="next"
                onSubmitEditing={() => {
                  // Focus password field when enter is pressed
                  passwordInputRef.current?.focus();
                }}
              />

              <Input
                ref={passwordInputRef}
                label="Password"
                placeholder="Enter your password"
                validationType="password"
                sensitive={true}
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(text) => handleFieldChange('password', text)}
                onValidationChange={handlePasswordValidation}
                enableSecurityValidation={true}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                rightIcon={
                  <Text style={{ fontSize: 18 }}>
                    {showPassword ? '🙈' : '👁️'}
                  </Text>
                }
                onRightIconPress={togglePasswordVisibility}
              />
            </View>

            <View style={styles.rememberForgotContainer}>
              <TouchableOpacity 
                style={styles.rememberContainer}
                onPress={() => handleFieldChange('rememberMe', !formData.rememberMe)}
              >
                <Text style={{ fontSize: 16 }}>
                  {formData.rememberMe ? '☑️' : '☐'}
                </Text>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.forgotPasswordButton}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotPasswordText}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Sign In"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting || Object.values(formErrors).some(error => error !== undefined)}
              fullWidth
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Biometric Authentication */}
            <View style={styles.biometricContainer}>
              <TouchableOpacity
                style={[styles.biometricButton]}
                onPress={() => handleBiometricAuth('fingerprint')}
              >
                <Text style={styles.biometricIcon}>👆</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.biometricButton]}
                onPress={() => handleBiometricAuth('faceId')}
              >
                <Text style={styles.biometricIcon}>😊</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.biometricButton]}
                onPress={() => handleBiometricAuth('voice')}
              >
                <Text style={styles.biometricIcon}>🎤</Text>
              </TouchableOpacity>
            </View>

            {/* Security Info */}
            <View style={styles.securityInfo}>
              <Text style={styles.securityText}>
                🔐 Your data is protected with bank-level security and encryption
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LoginScreen;