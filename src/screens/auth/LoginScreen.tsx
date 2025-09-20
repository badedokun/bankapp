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
import { useTenant, useTenantTheme, useTenantBranding } from '../../tenants/TenantContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { SecurityMonitor, SecurityConfig } from '../../utils/security';
import APIService from '../../services/api';
import DeploymentManager from '../../config/deployment';
import { useBankingAlert } from '../../services/AlertService';
import { ENV_CONFIG, buildApiUrl } from '../../config/environment';

const { width: screenWidth } = Dimensions.get('window');

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginScreenProps {
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
  const { showAlert } = useBankingAlert();

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
  const [fmfbLogoError, setFmfbLogoError] = useState(false);
  const [fmfbLogoLoading, setFmfbLogoLoading] = useState(true);

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
      showAlert(
        '🔒 Account Security Lock',
        `Your account has been temporarily locked due to multiple failed login attempts.\n\nFor your security, please wait 1 hour before trying again, or contact our support team for immediate assistance.\n\nRemaining attempts will be reset automatically.`,
        [
          {
            text: 'Contact Support',
            onPress: () => {
              // Log security event for support contact
              console.log('User requested support for locked account:', formData.email);
            }
          },
          {
            text: 'OK',
            onPress: () => {},
            style: 'default'
          }
        ]
      );
      return;
    }

    // Validate form data
    const hasErrors = Object.values(formErrors).some(error => error !== undefined);
    if (hasErrors || !formData.email || !formData.password) {
      showAlert(
        '⚠️ Form Validation',
        'Please ensure all fields are filled correctly before proceeding.\n\nCheck that your email address is valid and your password meets the security requirements.',
        [
          {
            text: 'OK',
            onPress: () => {},
            style: 'default'
          }
        ]
      );
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
        
        // Determine tenant from email domain
        let tenantId = currentTenant?.id;
        if (formData.email.includes('@fmfb.com')) {
          tenantId = 'fmfb';
        } else if (formData.email.includes('@default.com')) {
          tenantId = 'default';
        }
        
        const loginResponse = await APIService.login({
          email: formData.email,
          password: formData.password,
          tenantId,
          deviceInfo: {
            rememberMe: formData.rememberMe,
            platform: Platform.OS,
            screenSize: `${screenWidth}x${Dimensions.get('window').height}`,
          }
        });
        
        console.log('🎉 Login API call successful! Response:', loginResponse);
        console.log('👤 User object:', loginResponse.user);
        console.log('💰 Wallet object:', loginResponse.user?.wallet);
        
        // Reset attempts on successful login
        SecurityMonitor.resetLoginAttempts(formData.email);
        
        console.log('📱 About to navigate to dashboard...');
        console.log('Login successful, user data:', {
          id: loginResponse.user.id,
          name: `${loginResponse.user.firstName} ${loginResponse.user.lastName}`,
          tenant: loginResponse.user.tenant.displayName,
          balance: loginResponse.user.wallet?.availableBalance
        });
        
        // Navigate to main app immediately (Alert doesn't work well in web)
        if (navigation) {
          navigation.replace('MainApp');
        } else {
          console.error('❌ Navigation object not available');
        }
      }
      
    } catch (error: any) {
      console.error('Login error:', error);
      setLoginAttempts(prev => prev + 1);
      
      // Handle different error types with professional security messaging
      let errorMessage = 'The credentials you entered are not valid. Please verify your email address and password, then try again.';
      let errorTitle = '🔐 Authentication Failed';
      let buttons: Array<{ text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }> = [];
      
      if (error?.message) {
        if (error.message.includes('Account locked') || error.message.includes('too many')) {
          errorTitle = '🔒 Account Security Lock';
          errorMessage = 'Your account has been temporarily locked for security purposes due to multiple unsuccessful login attempts.\n\nTo protect your account, please wait 1 hour before attempting to sign in again, or contact our support team for immediate assistance.';
          buttons = [
            {
              text: 'Contact Support',
              onPress: () => {
                console.log('User requested support for locked account:', formData.email);
              }
            },
            {
              text: 'OK',
              onPress: () => {},
              style: 'default'
            }
          ];
        } else if (error.message.includes('Account is inactive') || error.message.includes('suspended')) {
          errorTitle = '⚠️ Account Status';
          errorMessage = 'Your account is currently inactive or suspended.\n\nThis may be due to pending verification or security measures. Please contact our support team to restore account access.';
          buttons = [
            {
              text: 'Contact Support',
              onPress: () => {
                console.log('User requested support for inactive account:', formData.email);
              }
            },
            {
              text: 'OK',
              onPress: () => {},
              style: 'default'
            }
          ];
        } else if (error.message.includes('Server is not accessible')) {
          errorTitle = '🌐 Connection Issue';
          errorMessage = 'We\'re unable to connect to our secure servers at the moment.\n\nPlease check your internet connection and try again. If the issue persists, our servers may be temporarily unavailable.';
          buttons = [
            {
              text: 'Retry',
              onPress: () => {
                setTimeout(() => handleSubmit(), 1000);
              }
            },
            {
              text: 'OK',
              onPress: () => {},
              style: 'default'
            }
          ];
        } else if (error.message.includes('Invalid credentials')) {
          errorTitle = '🔐 Authentication Failed';
          errorMessage = 'The email address or password you entered is incorrect.\n\nPlease double-check your credentials and try again. If you\'ve forgotten your password, you can reset it using the "Forgot Password" link.';
          buttons = [
            {
              text: 'Reset Password',
              onPress: () => {
                handleForgotPassword();
              }
            },
            {
              text: 'Try Again',
              onPress: () => {},
              style: 'default'
            }
          ];
        }
      }
      
      // Default buttons if none were set
      if (buttons.length === 0) {
        buttons = [
          {
            text: 'Reset Password',
            onPress: () => {
              handleForgotPassword();
            }
          },
          {
            text: 'Try Again',
            onPress: () => {},
            style: 'default'
          }
        ];
      }
      
      showAlert(errorTitle, errorMessage, buttons);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, formErrors, isSubmitting, onLogin, currentTenant, showAlert, handleForgotPassword]);

  // Handle biometric authentication
  const handleBiometricAuth = useCallback((type: 'fingerprint' | 'faceId' | 'voice') => {
    if (onBiometricAuth) {
      onBiometricAuth(type);
    } else {
      const typeMap = {
        fingerprint: { emoji: '👆', name: 'Fingerprint' },
        faceId: { emoji: '😊', name: 'Face ID' },
        voice: { emoji: '🎤', name: 'Voice' }
      };
      
      showAlert(
        `${typeMap[type].emoji} ${typeMap[type].name} Authentication`,
        `${typeMap[type].name} authentication is not yet configured for this device.\n\nThis feature would securely authenticate using your device's biometric sensors in a production environment.`,
        [
          {
            text: 'Set Up Later',
            onPress: () => {},
            style: 'default'
          }
        ]
      );
    }
  }, [onBiometricAuth, showAlert]);

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // Handle forgot password
  const handleForgotPassword = useCallback(() => {
    if (onForgotPassword) {
      onForgotPassword();
    } else {
      showAlert(
        '🔑 Password Reset',
        'Password reset functionality is not yet available in this demo environment.\n\nIn a production application, you would receive a secure reset link via email to create a new password.',
        [
          {
            text: 'Contact Support',
            onPress: () => {
              console.log('User requested support for password reset');
            }
          },
          {
            text: 'OK',
            onPress: () => {},
            style: 'default'
          }
        ]
      );
    }
  }, [onForgotPassword, showAlert]);

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
                !fmfbLogoError ? (
                  <Image
                    source={{ uri: buildApiUrl('tenants/by-name/fmfb/assets/logo/default') }}
                    style={styles.tenantLogoImage}
                    resizeMode="contain"
                    onLoad={() => {
                      console.log('✅ FMFB logo loaded successfully');
                      setFmfbLogoLoading(false);
                    }}
                    onError={(error) => {
                      console.log('❌ FMFB logo failed to load:', {
                        apiBaseUrl: ENV_CONFIG.API_BASE_URL,
                        fullUrl: buildApiUrl('tenants/by-name/fmfb/assets/logo/default'),
                        error: error.nativeEvent.error,
                        isReactNative: typeof navigator !== 'undefined' && navigator.product === 'ReactNative'
                      });
                      setFmfbLogoError(true);
                      setFmfbLogoLoading(false);
                    }}
                  />
                ) : (
                  <Text style={styles.tenantLogoText}>
                    FMFB
                  </Text>
                )
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
              {currentTenant ? 'Secure Banking App' : 'AI-Enhanced Banking Platform'}
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