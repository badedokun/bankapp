# Book 1: React Native + React Native Web Implementation Guide
## Nigerian PoS Cross-Platform Application Development

**Version:** 1.0  
**Date:** August 2025  
**Target Audience:** Frontend Developers, Mobile Developers, React Native Developers  

---

## Table of Contents

1. [Project Setup and Configuration](#1-project-setup-and-configuration)
2. [Cross-Platform Component Development](#2-cross-platform-component-development)
3. [State Management Implementation](#3-state-management-implementation)
4. [Authentication and Frontend Security](#4-authentication-and-frontend-security)
5. [Offline Capabilities and Storage](#5-offline-capabilities-and-storage)
6. [Device API Integration](#6-device-api-integration)
7. [Cross-Platform Testing Strategies](#7-cross-platform-testing-strategies)
8. [Performance Optimization](#8-performance-optimization)

---

## 1. Project Setup and Configuration

### 1.1 Environment Setup

#### 1.1.1 Prerequisites Installation

```bash
# Install Node.js 18+ LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install React Native CLI and Expo CLI
npm install -g @react-native-community/cli
npm install -g @expo/cli

# Install platform-specific requirements
# For iOS (macOS only)
sudo gem install cocoapods

# For Android
# Install Android Studio and configure SDK
```

#### 1.1.2 Project Initialization

```bash
# Create new React Native project with TypeScript
npx react-native init NigerianPoSApp --template react-native-template-typescript

cd NigerianPoSApp

# Install React Native Web dependencies
npm install react-native-web react-dom

# Install additional dependencies
npm install @reduxjs/toolkit react-redux @tanstack/react-query
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage
npm install react-native-keychain react-native-biometrics
npm install react-native-vector-icons
```

#### 1.1.3 Project Structure

```bash
NigerianPoSApp/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/         # Platform-agnostic components
│   │   ├── forms/          # Form components
│   │   └── ui/             # Base UI components
│   ├── screens/            # Application screens
│   │   ├── auth/          # Authentication screens
│   │   ├── transaction/   # Transaction screens
│   │   └── dashboard/     # Dashboard screens
│   ├── navigation/         # Navigation configuration
│   ├── services/          # API services and business logic
│   ├── store/             # Redux store configuration
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   ├── hooks/             # Custom React hooks
│   └── constants/         # App constants
├── web/                    # Web-specific configurations
├── ios/                    # iOS native code
├── android/               # Android native code
├── __tests__/             # Test files
└── package.json
```

### 1.2 React Native Web Configuration

#### 1.2.1 Webpack Configuration

**web/webpack.config.js:**
```javascript
const path = require('path');
const webpack = require('webpack');

const appDirectory = path.resolve(__dirname, '../');

// This is needed for webpack to compile JavaScript.
// Many OSS React Native packages are not compiled to ES5 before being
// published. If you depend on uncompiled packages they may cause webpack build
// errors. To fix this webpack can be configured to compile to the necessary
// `node_module`.
const babelLoaderConfiguration = {
  test: /\.js$|tsx?$/,
  // Add every directory that needs to be compiled by Babel during the build.
  include: [
    path.resolve(__dirname, 'index.js'), // Entry to your application
    path.resolve(appDirectory, 'src'),
    path.resolve(appDirectory, 'node_modules/react-native-vector-icons'),
    path.resolve(appDirectory, 'node_modules/@react-native'),
    path.resolve(appDirectory, 'node_modules/react-native'),
  ],
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      presets: [
        '@babel/preset-react',
        ['@babel/preset-env', { useBuiltIns: 'usage', corejs: 3 }],
        '@babel/preset-typescript',
      ],
      plugins: [
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-transform-runtime',
      ],
    },
  },
};

const imageLoaderConfiguration = {
  test: /\.(gif|jpe?g|png|svg)$/,
  use: {
    loader: 'url-loader',
    options: {
      name: '[name].[ext]',
      esModule: false,
    },
  },
};

module.exports = {
  entry: [path.join(appDirectory, 'web/index.js')],
  output: {
    path: path.resolve(appDirectory, 'web/dist'),
    publicPath: '/',
    filename: 'bundle.js',
  },
  resolve: {
    alias: {
      'react-native$': 'react-native-web',
      'react-native-vector-icons': 'react-native-vector-icons/dist',
    },
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.js', '.js'],
    modules: ['node_modules', path.join(appDirectory, 'node_modules')],
  },
  module: {
    rules: [babelLoaderConfiguration, imageLoaderConfiguration],
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
  devServer: {
    historyApiFallback: true,
    contentBase: path.join(appDirectory, 'web/public'),
    hot: true,
    port: 3000,
  },
};
```

#### 1.2.2 Web Entry Point

**web/index.js:**
```javascript
import { AppRegistry } from 'react-native';
import App from '../src/App';

// Register the app for web
AppRegistry.registerComponent('NigerianPoSApp', () => App);

// Run the app
AppRegistry.runApplication('NigerianPoSApp', {
  rootTag: document.getElementById('root'),
});

// Enable hot module replacement
if (module.hot) {
  module.hot.accept();
}
```

**web/public/index.html:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#1a365d">
    <title>Nigerian PoS System</title>
    
    <!-- PWA Configuration -->
    <link rel="manifest" href="manifest.json">
    <link rel="icon" type="image/png" href="favicon.png">
    
    <!-- Preconnect to API domains -->
    <link rel="preconnect" href="https://api.nibss.com">
    <link rel="preconnect" href="https://api.interswitch.com">
    
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f7fafc;
        }
        #root {
            height: 100vh;
            overflow: hidden;
        }
        .loading-screen {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #1a365d;
            color: white;
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div id="root">
        <div class="loading-screen">
            Loading Nigerian PoS System...
        </div>
    </div>
    <script src="bundle.js"></script>
</body>
</html>
```

### 1.3 TypeScript Configuration

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "esnext",
    "lib": [
      "es2017",
      "es2018",
      "es2019",
      "es2020",
      "esnext.asynciterable",
      "esnext.array",
      "esnext.bigint",
      "esnext.intl",
      "esnext.symbol"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/screens/*": ["./screens/*"],
      "@/services/*": ["./services/*"],
      "@/store/*": ["./store/*"],
      "@/utils/*": ["./utils/*"],
      "@/types/*": ["./types/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/constants/*": ["./constants/*"]
    }
  },
  "include": [
    "src/**/*",
    "web/**/*"
  ],
  "exclude": [
    "node_modules",
    "ios",
    "android"
  ]
}
```

---

## 2. Cross-Platform Component Development

### 2.1 Base UI Components

#### 2.1.1 Platform-Agnostic Button Component

**src/components/ui/Button.tsx:**
```typescript
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  testID,
}) => {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    loading && styles.loading,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      // Web-specific props
      {...(Platform.OS === 'web' && {
        onMouseEnter: () => {},
        onMouseLeave: () => {},
      })}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? '#fff' : '#1a365d'} 
          size="small"
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        userSelect: 'none',
        outline: 'none',
        transition: 'all 0.2s ease',
      },
    }),
  },
  // Variants
  primary: {
    backgroundColor: '#1a365d',
    borderWidth: 1,
    borderColor: '#1a365d',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1a365d',
  },
  danger: {
    backgroundColor: '#e53e3e',
    borderWidth: 1,
    borderColor: '#e53e3e',
  },
  success: {
    backgroundColor: '#38a169',
    borderWidth: 1,
    borderColor: '#38a169',
  },
  // Sizes
  small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 32,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  large: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 56,
  },
  // States
  disabled: {
    opacity: 0.6,
    ...Platform.select({
      web: {
        cursor: 'not-allowed',
      },
    }),
  },
  loading: {
    opacity: 0.8,
  },
  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#1a365d',
  },
  dangerText: {
    color: '#ffffff',
  },
  successText: {
    color: '#ffffff',
  },
  disabledText: {
    opacity: 0.6,
  },
  // Text sizes
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
});
```

#### 2.1.2 Cross-Platform Input Component

**src/components/ui/Input.tsx:**
```typescript
import React, { useState, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  ViewStyle,
  TextInputProps,
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  required?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  required = false,
  style,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const inputStyles = [
    styles.input,
    isFocused && styles.inputFocused,
    error && styles.inputError,
    leftIcon && styles.inputWithLeftIcon,
    rightIcon && styles.inputWithRightIcon,
    style,
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View style={styles.inputContainer}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          ref={ref}
          style={inputStyles}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          placeholderTextColor="#9ca3af"
          {...props}
          // Web-specific props
          {...(Platform.OS === 'web' && {
            autoComplete: props.autoComplete || 'off',
            spellCheck: false,
          })}
        />
        
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  required: {
    color: '#e53e3e',
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
    minHeight: 44,
    ...Platform.select({
      web: {
        outline: 'none',
        transition: 'border-color 0.2s ease',
      },
    }),
  },
  inputFocused: {
    borderColor: '#1a365d',
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 3px rgba(26, 54, 93, 0.1)',
      },
    }),
  },
  inputError: {
    borderColor: '#e53e3e',
  },
  inputWithLeftIcon: {
    paddingLeft: 40,
  },
  inputWithRightIcon: {
    paddingRight: 40,
  },
  leftIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  rightIcon: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
  },
  errorText: {
    fontSize: 12,
    color: '#e53e3e',
    marginTop: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
});
```

### 2.2 Transaction Components

#### 2.2.1 Transaction Form Component

**src/components/forms/TransactionForm.tsx:**
```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Picker } from '@/components/ui/Picker';
import { useTransaction } from '@/hooks/useTransaction';
import { TransactionType } from '@/types/transaction';

interface TransactionFormProps {
  onSuccess?: (transactionId: string) => void;
  onError?: (error: string) => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSuccess,
  onError,
}) => {
  const [formData, setFormData] = useState({
    type: '' as TransactionType,
    amount: '',
    sourceAccount: '',
    destinationAccount: '',
    cardNumber: '',
    pin: '',
    description: '',
    phoneNumber: '',
    network: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const { processTransaction, loading } = useTransaction();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.type) {
      newErrors.type = 'Transaction type is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    } else if (parseFloat(formData.amount) < 100) {
      newErrors.amount = 'Minimum amount is ₦100';
    } else if (parseFloat(formData.amount) > 500000) {
      newErrors.amount = 'Maximum amount is ₦500,000';
    }

    // Type-specific validations
    switch (formData.type) {
      case TransactionType.CASH_WITHDRAWAL:
        if (!formData.cardNumber) {
          newErrors.cardNumber = 'Card number is required';
        }
        if (!formData.pin || formData.pin.length !== 4) {
          newErrors.pin = 'Valid 4-digit PIN is required';
        }
        break;

      case TransactionType.MONEY_TRANSFER:
        if (!formData.sourceAccount) {
          newErrors.sourceAccount = 'Source account is required';
        }
        if (!formData.destinationAccount) {
          newErrors.destinationAccount = 'Destination account is required';
        }
        break;

      case TransactionType.AIRTIME_PURCHASE:
        if (!formData.phoneNumber) {
          newErrors.phoneNumber = 'Phone number is required';
        }
        if (!formData.network) {
          newErrors.network = 'Network provider is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const result = await processTransaction({
        type: formData.type,
        amount: parseFloat(formData.amount),
        sourceAccount: formData.sourceAccount || undefined,
        destinationAccount: formData.destinationAccount || undefined,
        cardNumber: formData.cardNumber || undefined,
        pin: formData.pin || undefined,
        description: formData.description || undefined,
        metadata: {
          phoneNumber: formData.phoneNumber || undefined,
          network: formData.network || undefined,
        },
      });

      if (result.success) {
        onSuccess?.(result.transactionId);
        // Reset form
        setFormData({
          type: '' as TransactionType,
          amount: '',
          sourceAccount: '',
          destinationAccount: '',
          cardNumber: '',
          pin: '',
          description: '',
          phoneNumber: '',
          network: '',
        });
        
        if (Platform.OS === 'web') {
          alert('Transaction processed successfully!');
        } else {
          Alert.alert('Success', 'Transaction processed successfully!');
        }
      } else {
        onError?.(result.message || 'Transaction failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      onError?.(errorMessage);
      
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMessage}`);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case TransactionType.CASH_WITHDRAWAL:
        return (
          <>
            <Input
              label="Card Number"
              value={formData.cardNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, cardNumber: text }))}
              error={errors.cardNumber}
              placeholder="Enter card number"
              keyboardType="numeric"
              maxLength={19}
              required
            />
            <Input
              label="PIN"
              value={formData.pin}
              onChangeText={(text) => setFormData(prev => ({ ...prev, pin: text }))}
              error={errors.pin}
              placeholder="Enter 4-digit PIN"
              keyboardType="numeric"
              secureTextEntry
              maxLength={4}
              required
            />
          </>
        );

      case TransactionType.MONEY_TRANSFER:
        return (
          <>
            <Input
              label="Source Account"
              value={formData.sourceAccount}
              onChangeText={(text) => setFormData(prev => ({ ...prev, sourceAccount: text }))}
              error={errors.sourceAccount}
              placeholder="Enter source account number"
              keyboardType="numeric"
              maxLength={10}
              required
            />
            <Input
              label="Destination Account"
              value={formData.destinationAccount}
              onChangeText={(text) => setFormData(prev => ({ ...prev, destinationAccount: text }))}
              error={errors.destinationAccount}
              placeholder="Enter destination account number"
              keyboardType="numeric"
              maxLength={10}
              required
            />
            <Input
              label="Description"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Transfer description (optional)"
              maxLength={100}
            />
          </>
        );

      case TransactionType.AIRTIME_PURCHASE:
        return (
          <>
            <Input
              label="Phone Number"
              value={formData.phoneNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phoneNumber: text }))}
              error={errors.phoneNumber}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              maxLength={14}
              required
            />
            <Picker
              label="Network Provider"
              value={formData.network}
              onValueChange={(value) => setFormData(prev => ({ ...prev, network: value }))}
              error={errors.network}
              items={[
                { label: 'Select provider', value: '' },
                { label: 'MTN', value: 'MTN' },
                { label: 'Airtel', value: 'AIRTEL' },
                { label: 'Glo', value: 'GLO' },
                { label: '9Mobile', value: '9MOBILE' },
              ]}
              required
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        <Text style={styles.title}>Process Transaction</Text>
        
        <Picker
          label="Transaction Type"
          value={formData.type}
          onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as TransactionType }))}
          error={errors.type}
          items={[
            { label: 'Select transaction type', value: '' },
            { label: 'Cash Withdrawal', value: TransactionType.CASH_WITHDRAWAL },
            { label: 'Money Transfer', value: TransactionType.MONEY_TRANSFER },
            { label: 'Bill Payment', value: TransactionType.BILL_PAYMENT },
            { label: 'Airtime Purchase', value: TransactionType.AIRTIME_PURCHASE },
          ]}
          required
        />

        <Input
          label="Amount (₦)"
          value={formData.amount}
          onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
          error={errors.amount}
          placeholder="Enter amount"
          keyboardType="numeric"
          required
        />

        {renderTypeSpecificFields()}

        <Button
          title={loading ? 'Processing...' : 'Process Transaction'}
          onPress={handleSubmit}
          disabled={loading}
          loading={loading}
          variant="primary"
          size="large"
          style={styles.submitButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  form: {
    padding: 20,
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 20,
  },
});
```

### 2.3 Navigation Setup

#### 2.3.1 Navigation Configuration

**src/navigation/AppNavigator.tsx:**
```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';

// Screens
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { TransactionScreen } from '@/screens/transaction/TransactionScreen';
import { HistoryScreen } from '@/screens/transaction/HistoryScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';

// Icons
import Icon from 'react-native-vector-icons/MaterialIcons';

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Transaction: undefined;
  History: undefined;
  Profile: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: Platform.OS === 'ios',
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
};

const MainNavigator = () => {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'dashboard' : 'dashboard';
              break;
            case 'Transaction':
              iconName = focused ? 'payment' : 'payment';
              break;
            case 'History':
              iconName = focused ? 'history' : 'history';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1a365d',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
          ...Platform.select({
            web: {
              boxShadow: '0 -1px 3px rgba(0, 0, 0, 0.1)',
            },
          }),
        },
        headerStyle: {
          backgroundColor: '#1a365d',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <MainTab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <MainTab.Screen 
        name="Transaction" 
        component={TransactionScreen}
        options={{ title: 'New Transaction' }}
      />
      <MainTab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{ title: 'Transaction History' }}
      />
      <MainTab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </MainTab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const isAuthenticated = true; // This would come from your auth context

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
```

---

## 3. State Management Implementation

### 3.1 Redux Toolkit Setup

#### 3.1.1 Store Configuration

**src/store/index.ts:**
```typescript
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Reducers
import authReducer from './slices/authSlice';
import transactionReducer from './slices/transactionSlice';
import userReducer from './slices/userSlice';
import offlineReducer from './slices/offlineSlice';

// Web storage fallback
const webStorage = {
  getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key: string, value: string) => Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
};

const storage = Platform.OS === 'web' ? webStorage : AsyncStorage;

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'user', 'offline'], // Only persist certain reducers
  blacklist: ['transaction'], // Don't persist transaction state
};

const rootReducer = combineReducers({
  auth: authReducer,
  transaction: transactionReducer,
  user: userReducer,
  offline: offlineReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: __DEV__,
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

#### 3.1.2 Auth Slice

**src/store/slices/authSlice.ts:**
```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthService } from '@/services/AuthService';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phoneNumber: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string; otp?: string }) => {
    const response = await AuthService.login(credentials);
    return response.data;
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState }) => {
    const state = getState() as { auth: AuthState };
    if (state.auth.token) {
      await AuthService.logout();
    }
  }
);

export const refreshAccessToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    const { refreshToken } = state.auth;
    
    if (!refreshToken) {
      return rejectWithValue('No refresh token available');
    }

    try {
      const response = await AuthService.refreshToken(refreshToken);
      return response.data;
    } catch (error) {
      return rejectWithValue('Token refresh failed');
    }
  }
);

export const verifyBiometric = createAsyncThunk(
  'auth/verifyBiometric',
  async () => {
    const result = await AuthService.verifyBiometric();
    return result;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setTokens: (state, action: PayloadAction<{ token: string; refreshToken: string }>) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Login failed';
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      // Refresh Token
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      })
      // Biometric Verification
      .addCase(verifyBiometric.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyBiometric.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success) {
          state.isAuthenticated = true;
        }
      })
      .addCase(verifyBiometric.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Biometric verification failed';
      });
  },
});

export const { clearError, updateUser, setTokens } = authSlice.actions;
export default authSlice.reducer;
```

#### 3.1.3 Transaction Slice

**src/store/slices/transactionSlice.ts:**
```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TransactionService } from '@/services/TransactionService';
import { Transaction, TransactionRequest } from '@/types/transaction';

interface TransactionState {
  currentTransaction: Transaction | null;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const initialState: TransactionState = {
  currentTransaction: null,
  transactions: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
  },
};

// Async thunks
export const processTransaction = createAsyncThunk(
  'transaction/process',
  async (request: TransactionRequest) => {
    const response = await TransactionService.processTransaction(request);
    return response;
  }
);

export const fetchTransactions = createAsyncThunk(
  'transaction/fetchTransactions',
  async (params: { page?: number; limit?: number; status?: string } = {}) => {
    const response = await TransactionService.getTransactions(params);
    return response.data;
  }
);

export const fetchTransactionById = createAsyncThunk(
  'transaction/fetchById',
  async (transactionId: string) => {
    const response = await TransactionService.getTransactionById(transactionId);
    return response.data;
  }
);

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentTransaction: (state) => {
      state.currentTransaction = null;
    },
    updateTransactionStatus: (state, action: PayloadAction<{ id: string; status: string }>) => {
      const transaction = state.transactions.find(t => t.id === action.payload.id);
      if (transaction) {
        transaction.status = action.payload.status;
      }
      if (state.currentTransaction?.id === action.payload.id) {
        state.currentTransaction.status = action.payload.status;
      }
    },
    resetPagination: (state) => {
      state.pagination = {
        page: 1,
        limit: 20,
        total: 0,
      };
      state.transactions = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Process Transaction
      .addCase(processTransaction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(processTransaction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTransaction = action.payload.data;
        // Add to transactions list if successful
        if (action.payload.success && action.payload.data) {
          state.transactions.unshift(action.payload.data);
        }
      })
      .addCase(processTransaction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Transaction processing failed';
      })
      // Fetch Transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.pagination.page === 1) {
          state.transactions = action.payload.transactions;
        } else {
          state.transactions.push(...action.payload.transactions);
        }
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch transactions';
      })
      // Fetch Transaction by ID
      .addCase(fetchTransactionById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTransactionById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTransaction = action.payload;
      })
      .addCase(fetchTransactionById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch transaction';
      });
  },
});

export const { 
  clearError, 
  clearCurrentTransaction, 
  updateTransactionStatus,
  resetPagination 
} = transactionSlice.actions;

export default transactionSlice.reducer;
```

### 3.2 React Query Integration

#### 3.2.1 Query Client Setup

**src/services/queryClient.ts:**
```typescript
import { QueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      refetchOnWindowFocus: Platform.OS === 'web',
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Network-aware query client for mobile
if (Platform.OS !== 'web') {
  NetInfo.addEventListener(state => {
    if (state.isConnected) {
      queryClient.resumePausedMutations();
      queryClient.invalidateQueries();
    }
  });
}

export { queryClient };
```

#### 3.2.2 Custom Hooks with React Query

**src/hooks/useTransaction.ts:**
```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { TransactionService } from '@/services/TransactionService';
import { processTransaction as processTransactionAction } from '@/store/slices/transactionSlice';
import { RootState, AppDispatch } from '@/store';
import { TransactionRequest } from '@/types/transaction';

export const useTransaction = () => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const { isLoading, error } = useSelector((state: RootState) => state.transaction);

  const processTransactionMutation = useMutation({
    mutationFn: (request: TransactionRequest) => TransactionService.processTransaction(request),
    onSuccess: (data) => {
      // Invalidate and refetch transaction queries
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['balance']);
      
      // Update Redux state
      dispatch(processTransactionAction(data as any));
    },
    onError: (error) => {
      console.error('Transaction processing failed:', error);
    },
  });

  const processTransaction = async (request: TransactionRequest) => {
    try {
      const result = await processTransactionMutation.mutateAsync(request);
      return result;
    } catch (error) {
      throw error;
    }
  };

  return {
    processTransaction,
    loading: isLoading || processTransactionMutation.isLoading,
    error: error || processTransactionMutation.error,
  };
};

export const useTransactionHistory = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => TransactionService.getTransactions(params || {}),
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useTransactionDetails = (transactionId: string) => {
  return useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: () => TransactionService.getTransactionById(transactionId),
    enabled: !!transactionId,
  });
};

export const useBalance = () => {
  return useQuery({
    queryKey: ['balance'],
    queryFn: () => TransactionService.getBalance(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};
```

---

## 4. Authentication and Frontend Security

### 4.1 Biometric Authentication

#### 4.1.1 Biometric Service Setup

**src/services/BiometricService.ts:**
```typescript
import ReactNativeBiometrics from 'react-native-biometrics';
import { Platform } from 'react-native';

interface BiometricResult {
  success: boolean;
  signature?: string;
  error?: string;
}

class BiometricService {
  private rnBiometrics = new ReactNativeBiometrics({
    allowDeviceCredentials: true,
  });

  async isAvailable(): Promise<boolean> {
    if (Platform.OS === 'web') {
      // Web Authentication API for biometric support
      return !!(window.navigator && 'credentials' in window.navigator);
    }

    try {
      const { available } = await this.rnBiometrics.isSensorAvailable();
      return available;
    } catch (error) {
      console.error('Biometric availability check failed:', error);
      return false;
    }
  }

  async getSupportedBiometricType(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return 'WebAuthn';
    }

    try {
      const { biometryType } = await this.rnBiometrics.isSensorAvailable();
      return biometryType || null;
    } catch (error) {
      console.error('Failed to get biometric type:', error);
      return null;
    }
  }

  async createKeys(): Promise<boolean> {
    if (Platform.OS === 'web') {
      // Web implementation would use WebAuthn API
      return true;
    }

    try {
      const { publicKey } = await this.rnBiometrics.createKeys();
      // Store public key securely for server verification
      return !!publicKey;
    } catch (error) {
      console.error('Failed to create biometric keys:', error);
      return false;
    }
  }

  async authenticate(promptMessage: string = 'Authenticate to continue'): Promise<BiometricResult> {
    if (Platform.OS === 'web') {
      return this.webAuthenticate();
    }

    try {
      const { success, signature } = await this.rnBiometrics.createSignature({
        promptMessage,
        payload: 'authentication_payload',
      });

      return {
        success,
        signature: signature || undefined,
      };
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }

  private async webAuthenticate(): Promise<BiometricResult> {
    try {
      if (!window.navigator?.credentials) {
        throw new Error('WebAuthn not supported');
      }

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: {
            name: 'Nigerian PoS System',
            id: window.location.hostname,
          },
          user: {
            id: new Uint8Array(16),
            name: 'user@example.com',
            displayName: 'User',
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
          attestation: 'direct',
        },
      });

      return {
        success: !!credential,
        signature: credential ? 'web_signature' : undefined,
      };
    } catch (error) {
      console.error('Web authentication failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Web authentication failed',
      };
    }
  }

  async deleteKeys(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return true;
    }

    try {
      const result = await this.rnBiometrics.deleteKeys();
      return result;
    } catch (error) {
      console.error('Failed to delete biometric keys:', error);
      return false;
    }
  }
}

export default new BiometricService();
```

#### 4.1.2 Biometric Authentication Component

**src/components/auth/BiometricAuth.tsx:**
```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Button } from '@/components/ui/Button';
import BiometricService from '@/services/BiometricService';

interface BiometricAuthProps {
  onSuccess: (signature?: string) => void;
  onError: (error: string) => void;
  onSkip?: () => void;
  title?: string;
  description?: string;
  skipable?: boolean;
}

export const BiometricAuth: React.FC<BiometricAuthProps> = ({
  onSuccess,
  onError,
  onSkip,
  title = 'Biometric Authentication',
  description = 'Use your biometric to authenticate',
  skipable = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const available = await BiometricService.isAvailable();
      setIsAvailable(available);

      if (available) {
        const type = await BiometricService.getSupportedBiometricType();
        setBiometricType(type);
      }
    } catch (error) {
      console.error('Failed to check biometric availability:', error);
      setIsAvailable(false);
    }
  };

  const handleBiometricAuth = async () => {
    setIsLoading(true);

    try {
      const result = await BiometricService.authenticate(
        'Authenticate to access your account'
      );

      if (result.success) {
        onSuccess(result.signature);
      } else {
        onError(result.error || 'Biometric authentication failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'TouchID':
      case 'Biometrics':
        return 'fingerprint';
      case 'FaceID':
        return 'face';
      case 'WebAuthn':
        return 'security';
      default:
        return 'fingerprint';
    }
  };

  const getBiometricLabel = () => {
    switch (biometricType) {
      case 'TouchID':
        return 'Touch ID';
      case 'FaceID':
        return 'Face ID';
      case 'Biometrics':
        return 'Fingerprint';
      case 'WebAuthn':
        return 'Biometric';
      default:
        return 'Biometric';
    }
  };

  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <Icon name="warning" size={48} color="#f59e0b" />
        <Text style={styles.title}>Biometric Not Available</Text>
        <Text style={styles.description}>
          Biometric authentication is not available on this device
        </Text>
        {skipable && (
          <Button
            title="Continue without Biometric"
            onPress={onSkip}
            variant="secondary"
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Icon 
        name={getBiometricIcon()} 
        size={64} 
        color="#1a365d" 
        style={styles.icon}
      />
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      
      <View style={styles.buttonContainer}>
        <Button
          title={`Use ${getBiometricLabel()}`}
          onPress={handleBiometricAuth}
          loading={isLoading}
          disabled={isLoading}
          variant="primary"
          size="large"
        />
        
        {skipable && (
          <Button
            title="Skip"
            onPress={onSkip}
            variant="secondary"
            style={styles.skipButton}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  skipButton: {
    marginTop: 12,
  },
});
```

### 4.2 Secure Storage Implementation

#### 4.2.1 Cross-Platform Secure Storage

**src/services/SecureStorage.ts:**
```typescript
import { Platform } from 'react-native';
import Keychain from 'react-native-keychain';
import CryptoJS from 'crypto-js';

interface StorageItem {
  key: string;
  value: string;
  encrypted?: boolean;
}

class SecureStorage {
  private static readonly ENCRYPTION_KEY = 'nigerian_pos_secure_key';

  // Web implementation using encrypted localStorage
  private static async webSetItem(key: string, value: string, encrypted = true): Promise<void> {
    try {
      let dataToStore = value;
      
      if (encrypted) {
        dataToStore = CryptoJS.AES.encrypt(value, this.ENCRYPTION_KEY).toString();
      }
      
      localStorage.setItem(`secure_${key}`, dataToStore);
    } catch (error) {
      throw new Error(`Failed to store item: ${error}`);
    }
  }

  private static async webGetItem(key: string, encrypted = true): Promise<string | null> {
    try {
      const storedData = localStorage.getItem(`secure_${key}`);
      
      if (!storedData) {
        return null;
      }
      
      if (encrypted) {
        const bytes = CryptoJS.AES.decrypt(storedData, this.ENCRYPTION_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
      }
      
      return storedData;
    } catch (error) {
      console.error('Failed to retrieve item:', error);
      return null;
    }
  }

  private static async webRemoveItem(key: string): Promise<void> {
    localStorage.removeItem(`secure_${key}`);
  }

  // Mobile implementation using Keychain
  private static async mobileSetItem(key: string, value: string): Promise<void> {
    try {
      await Keychain.setInternetCredentials(key, key, value);
    } catch (error) {
      throw new Error(`Failed to store item in keychain: ${error}`);
    }
  }

  private static async mobileGetItem(key: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(key);
      
      if (credentials && credentials.password) {
        return credentials.password;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to retrieve item from keychain:', error);
      return null;
    }
  }

  private static async mobileRemoveItem(key: string): Promise<void> {
    try {
      await Keychain.resetInternetCredentials(key);
    } catch (error) {
      console.error('Failed to remove item from keychain:', error);
    }
  }

  // Public API
  static async setItem(key: string, value: string, encrypted = true): Promise<void> {
    if (Platform.OS === 'web') {
      return this.webSetItem(key, value, encrypted);
    } else {
      return this.mobileSetItem(key, value);
    }
  }

  static async getItem(key: string, encrypted = true): Promise<string | null> {
    if (Platform.OS === 'web') {
      return this.webGetItem(key, encrypted);
    } else {
      return this.mobileGetItem(key);
    }
  }

  static async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      return this.webRemoveItem(key);
    } else {
      return this.mobileRemoveItem(key);
    }
  }

  static async clear(): Promise<void> {
    if (Platform.OS === 'web') {
      // Clear all secure items from localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('secure_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } else {
      // For mobile, we'll need to track and remove individual items
      // This is a simplified approach - in production, you might want to maintain a list
      try {
        await Keychain.resetInternetCredentials('auth_token');
        await Keychain.resetInternetCredentials('refresh_token');
        await Keychain.resetInternetCredentials('user_credentials');
        await Keychain.resetInternetCredentials('biometric_key');
      } catch (error) {
        console.error('Failed to clear keychain:', error);
      }
    }
  }

  // Specific methods for common secure storage needs
  static async setAuthToken(token: string): Promise<void> {
    return this.setItem('auth_token', token);
  }

  static async getAuthToken(): Promise<string | null> {
    return this.getItem('auth_token');
  }

  static async setRefreshToken(token: string): Promise<void> {
    return this.setItem('refresh_token', token);
  }

  static async getRefreshToken(): Promise<string | null> {
    return this.getItem('refresh_token');
  }

  static async setUserCredentials(credentials: { email: string; encryptedPassword: string }): Promise<void> {
    return this.setItem('user_credentials', JSON.stringify(credentials));
  }

  static async getUserCredentials(): Promise<{ email: string; encryptedPassword: string } | null> {
    const credentials = await this.getItem('user_credentials');
    return credentials ? JSON.parse(credentials) : null;
  }

  static async setBiometricKey(key: string): Promise<void> {
    return this.setItem('biometric_key', key);
  }

  static async getBiometricKey(): Promise<string | null> {
    return this.getItem('biometric_key');
  }
}

export default SecureStorage;
```

---

## 5. Offline Capabilities and Storage

### 5.1 AsyncStorage Wrapper for Cross-Platform

**src/services/StorageService.ts:**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface StorageData {
  [key: string]: any;
}

class StorageService {
  private static readonly PREFIX = 'nigerian_pos_';

  // Web localStorage fallback
  private static webStorage = {
    getItem: async (key: string): Promise<string | null> => {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error('Web storage getItem error:', error);
        return null;
      }
    },
    setItem: async (key: string, value: string): Promise<void> => {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('Web storage setItem error:', error);
        throw error;
      }
    },
    removeItem: async (key: string): Promise<void> => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Web storage removeItem error:', error);
      }
    },
    getAllKeys: async (): Promise<readonly string[]> => {
      try {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) keys.push(key);
        }
        return keys;
      } catch (error) {
        console.error('Web storage getAllKeys error:', error);
        return [];
      }
    },
  };

  private static get storage() {
    return Platform.OS === 'web' ? this.webStorage : AsyncStorage;
  }

  private static getKey(key: string): string {
    return `${this.PREFIX}${key}`;
  }

  static async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await this.storage.setItem(this.getKey(key), jsonValue);
    } catch (error) {
      console.error(`StorageService.setItem error for key ${key}:`, error);
      throw error;
    }
  }

  static async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await this.storage.getItem(this.getKey(key));
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`StorageService.getItem error for key ${key}:`, error);
      return null;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      await this.storage.removeItem(this.getKey(key));
    } catch (error) {
      console.error(`StorageService.removeItem error for key ${key}:`, error);
    }
  }

  static async multiGet<T>(keys: string[]): Promise<{ [key: string]: T | null }> {
    try {
      const prefixedKeys = keys.map(key => this.getKey(key));
      const result: { [key: string]: T | null } = {};

      if (Platform.OS === 'web') {
        // Web implementation
        for (const originalKey of keys) {
          result[originalKey] = await this.getItem<T>(originalKey);
        }
      } else {
        // Mobile implementation
        const pairs = await AsyncStorage.multiGet(prefixedKeys);
        pairs.forEach(([key, value], index) => {
          const originalKey = keys[index];
          result[originalKey] = value ? JSON.parse(value) : null;
        });
      }

      return result;
    } catch (error) {
      console.error('StorageService.multiGet error:', error);
      return {};
    }
  }

  static async multiSet(data: StorageData): Promise<void> {
    try {
      const pairs = Object.entries(data).map(([key, value]) => [
        this.getKey(key),
        JSON.stringify(value),
      ]);

      if (Platform.OS === 'web') {
        // Web implementation
        for (const [key, value] of pairs) {
          localStorage.setItem(key, value);
        }
      } else {
        // Mobile implementation
        await AsyncStorage.multiSet(pairs as [string, string][]);
      }
    } catch (error) {
      console.error('StorageService.multiSet error:', error);
      throw error;
    }
  }

  static async getAllKeys(): Promise<string[]> {
    try {
      const allKeys = await this.storage.getAllKeys();
      return allKeys
        .filter(key => key.startsWith(this.PREFIX))
        .map(key => key.replace(this.PREFIX, ''));
    } catch (error) {
      console.error('StorageService.getAllKeys error:', error);
      return [];
    }
  }

  static async clear(): Promise<void> {
    try {
      const keys = await this.getAllKeys();
      const prefixedKeys = keys.map(key => this.getKey(key));

      if (Platform.OS === 'web') {
        // Web implementation
        prefixedKeys.forEach(key => localStorage.removeItem(key));
      } else {
        // Mobile implementation
        await AsyncStorage.multiRemove(prefixedKeys);
      }
    } catch (error) {
      console.error('StorageService.clear error:', error);
    }
  }

  // Specific methods for app data
  static async setTransactionQueue(transactions: any[]): Promise<void> {
    return this.setItem('transaction_queue', transactions);
  }

  static async getTransactionQueue(): Promise<any[]> {
    return (await this.getItem('transaction_queue')) || [];
  }

  static async addToTransactionQueue(transaction: any): Promise<void> {
    const queue = await this.getTransactionQueue();
    queue.push({ ...transaction, timestamp: Date.now() });
    return this.setTransactionQueue(queue);
  }

  static async removeFromTransactionQueue(transactionId: string): Promise<void> {
    const queue = await this.getTransactionQueue();
    const filteredQueue = queue.filter(t => t.id !== transactionId);
    return this.setTransactionQueue(filteredQueue);
  }

  static async setUserPreferences(preferences: any): Promise<void> {
    return this.setItem('user_preferences', preferences);
  }

  static async getUserPreferences(): Promise<any> {
    return this.getItem('user_preferences');
  }

  static async setCachedData(key: string, data: any, ttl?: number): Promise<void> {
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl: ttl || 0,
    };
    return this.setItem(`cache_${key}`, cacheData);
  }

  static async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.getItem<{ data: T; timestamp: number; ttl: number }>(`cache_${key}`);
      
      if (!cached) {
        return null;
      }

      // Check if cache has expired
      if (cached.ttl > 0 && Date.now() - cached.timestamp > cached.ttl) {
        await this.removeItem(`cache_${key}`);
        return null;
      }

      return cached.data;
    } catch (error) {
      console.error(`Error getting cached data for key ${key}:`, error);
      return null;
    }
  }
}

export default StorageService;
```

### 5.2 Offline Transaction Queue Management

**src/services/OfflineQueueService.ts:**
```typescript
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import StorageService from './StorageService';
import { TransactionService } from './TransactionService';

interface QueuedTransaction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: number; // Higher number = higher priority
}

interface QueueConfig {
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  autoSync: boolean;
}

class OfflineQueueService {
  private isOnline = true;
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private config: QueueConfig = {
    maxRetries: 3,
    retryDelay: 5000,
    batchSize: 10,
    autoSync: true,
  };

  constructor() {
    this.initializeNetworkListener();
    this.startAutoSync();
  }

  private initializeNetworkListener(): void {
    if (Platform.OS === 'web') {
      // Web network detection
      window.addEventListener('online', () => {
        this.isOnline = true;
        if (this.config.autoSync) {
          this.syncQueue();
        }
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
      });

      this.isOnline = navigator.onLine;
    } else {
      // Mobile network detection
      NetInfo.addEventListener(state => {
        const wasOffline = !this.isOnline;
        this.isOnline = state.isConnected ?? false;
        
        if (wasOffline && this.isOnline && this.config.autoSync) {
          this.syncQueue();
        }
      });
    }
  }

  private startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.config.autoSync) {
        this.syncQueue();
      }
    }, 30000); // Sync every 30 seconds
  }

  async addToQueue(
    type: string,
    data: any,
    priority: number = 1,
    maxRetries: number = this.config.maxRetries
  ): Promise<string> {
    const transaction: QueuedTransaction = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries,
      priority,
    };

    const queue = await this.getQueue();
    queue.push(transaction);
    
    // Sort by priority (higher priority first) and timestamp
    queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.timestamp - b.timestamp;
    });

    await StorageService.setTransactionQueue(queue);

    // Try to sync immediately if online
    if (this.isOnline && this.config.autoSync) {
      this.syncQueue();
    }

    return transaction.id;
  }

  async removeFromQueue(transactionId: string): Promise<void> {
    const queue = await this.getQueue();
    const filteredQueue = queue.filter(t => t.id !== transactionId);
    await StorageService.setTransactionQueue(filteredQueue);
  }

  async getQueue(): Promise<QueuedTransaction[]> {
    return (await StorageService.getTransactionQueue()) || [];
  }

  async getQueueCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  async clearQueue(): Promise<void> {
    await StorageService.setTransactionQueue([]);
  }

  async syncQueue(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing || !this.isOnline) {
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    let successCount = 0;
    let failedCount = 0;

    try {
      const queue = await this.getQueue();
      const batch = queue.slice(0, this.config.batchSize);

      for (const transaction of batch) {
        try {
          await this.processQueuedTransaction(transaction);
          await this.removeFromQueue(transaction.id);
          successCount++;
        } catch (error) {
          console.error(`Failed to sync transaction ${transaction.id}:`, error);
          
          // Increment retry count
          transaction.retryCount++;
          
          if (transaction.retryCount >= transaction.maxRetries) {
            // Remove from queue if max retries reached
            await this.removeFromQueue(transaction.id);
            await this.moveToFailedQueue(transaction, error);
            failedCount++;
          } else {
            // Update the transaction in queue
            await this.updateTransactionInQueue(transaction);
          }
        }
      }

      // Continue syncing if there are more items
      if (queue.length > this.config.batchSize) {
        setTimeout(() => this.syncQueue(), 1000);
      }

    } catch (error) {
      console.error('Queue sync error:', error);
    } finally {
      this.isSyncing = false;
    }

    return { success: successCount, failed: failedCount };
  }

  private async processQueuedTransaction(transaction: QueuedTransaction): Promise<void> {
    switch (transaction.type) {
      case 'PROCESS_TRANSACTION':
        await TransactionService.processTransaction(transaction.data);
        break;
      case 'UPDATE_PROFILE':
        // Add other transaction types as needed
        break;
      default:
        throw new Error(`Unknown transaction type: ${transaction.type}`);
    }
  }

  private async updateTransactionInQueue(transaction: QueuedTransaction): Promise<void> {
    const queue = await this.getQueue();
    const index = queue.findIndex(t => t.id === transaction.id);
    
    if (index !== -1) {
      queue[index] = transaction;
      await StorageService.setTransactionQueue(queue);
    }
  }

  private async moveToFailedQueue(transaction: QueuedTransaction, error: any): Promise<void> {
    const failedQueue = (await StorageService.getItem<QueuedTransaction[]>('failed_queue')) || [];
    
    failedQueue.push({
      ...transaction,
      error: error.message || 'Unknown error',
      failedAt: Date.now(),
    } as any);

    await StorageService.setItem('failed_queue', failedQueue);
  }

  async getFailedQueue(): Promise<QueuedTransaction[]> {
    return (await StorageService.getItem<QueuedTransaction[]>('failed_queue')) || [];
  }

  async retryFailedTransaction(transactionId: string): Promise<void> {
    const failedQueue = await this.getFailedQueue();
    const transaction = failedQueue.find(t => t.id === transactionId);
    
    if (transaction) {
      // Reset retry count and move back to main queue
      transaction.retryCount = 0;
      await this.addToQueue(transaction.type, transaction.data, transaction.priority);
      
      // Remove from failed queue
      const updatedFailedQueue = failedQueue.filter(t => t.id !== transactionId);
      await StorageService.setItem('failed_queue', updatedFailedQueue);
    }
  }

  async clearFailedQueue(): Promise<void> {
    await StorageService.setItem('failed_queue', []);
  }

  // Configuration methods
  setConfig(config: Partial<QueueConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.autoSync !== undefined) {
      if (config.autoSync) {
        this.startAutoSync();
      } else if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }
    }
  }

  getConfig(): QueueConfig {
    return { ...this.config };
  }

  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  isSyncInProgress(): boolean {
    return this.isSyncing;
  }
}

export default new OfflineQueueService();
```

### 5.3 Offline-First Hook

**src/hooks/useOffline.ts:**
```typescript
import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import OfflineQueueService from '@/services/OfflineQueueService';

interface UseOfflineReturn {
  isOnline: boolean;
  isConnected: boolean;
  networkType: string | null;
  queueCount: number;
  isSyncing: boolean;
  addToQueue: (type: string, data: any, priority?: number) => Promise<string>;
  syncQueue: () => Promise<{ success: number; failed: number }>;
  clearQueue: () => Promise<void>;
}

export const useOffline = (): UseOfflineReturn => {
  const [isOnline, setIsOnline] = useState(true);
  const [networkType, setNetworkType] = useState<string | null>(null);
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const updateQueueCount = useCallback(async () => {
    try {
      const count = await OfflineQueueService.getQueueCount();
      setQueueCount(count);
    } catch (error) {
      console.error('Failed to update queue count:', error);
    }
  }, []);

  useEffect(() => {
    // Initialize queue count
    updateQueueCount();

    if (Platform.OS === 'web') {
      // Web network listeners
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      setIsOnline(navigator.onLine);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } else {
      // Mobile network listener
      const unsubscribe = NetInfo.addEventListener(state => {
        setIsOnline(state.isConnected ?? false);
        setNetworkType(state.type || null);
      });

      return unsubscribe;
    }
  }, [updateQueueCount]);

  const addToQueue = useCallback(async (type: string, data: any, priority = 1) => {
    try {
      const transactionId = await OfflineQueueService.addToQueue(type, data, priority);
      await updateQueueCount();
      return transactionId;
    } catch (error) {
      console.error('Failed to add to queue:', error);
      throw error;
    }
  }, [updateQueueCount]);

  const syncQueue = useCallback(async () => {
    if (!isOnline) {
      return { success: 0, failed: 0 };
    }

    setIsSyncing(true);
    try {
      const result = await OfflineQueueService.syncQueue();
      await updateQueueCount();
      return result;
    } catch (error) {
      console.error('Failed to sync queue:', error);
      return { success: 0, failed: 0 };
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, updateQueueCount]);

  const clearQueue = useCallback(async () => {
    try {
      await OfflineQueueService.clearQueue();
      await updateQueueCount();
    } catch (error) {
      console.error('Failed to clear queue:', error);
      throw error;
    }
  }, [updateQueueCount]);

  return {
    isOnline,
    isConnected: isOnline,
    networkType,
    queueCount,
    isSyncing: isSyncing || OfflineQueueService.isSyncInProgress(),
    addToQueue,
    syncQueue,
    clearQueue,
  };
};
```

---

## 6. Device API Integration

### 6.1 Camera Integration for QR Code Scanning

**src/services/CameraService.ts:**
```typescript
import { Platform, PermissionsAndroid } from 'react-native';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';

interface CameraOptions {
  mediaType: 'photo' | 'video';
  includeBase64?: boolean;
  maxHeight?: number;
  maxWidth?: number;
  quality?: number;
}

class CameraService {
  static async requestCameraPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        // Stop the stream immediately, we just wanted to check permission
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch (error) {
        console.error('Camera permission denied:', error);
        return false;
      }
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'Nigerian PoS needs access to your camera to scan QR codes',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        console.error('Camera permission error:', error);
        return false;
      }
    }

    // iOS permissions are handled by react-native-image-picker
    return true;
  }

  static async openCamera(options: CameraOptions = { mediaType: 'photo' }): Promise<ImagePickerResponse> {
    return new Promise((resolve, reject) => {
      const hasPermission = this.requestCameraPermission();
      
      if (!hasPermission) {
        reject(new Error('Camera permission denied'));
        return;
      }

      const defaultOptions = {
        mediaType: 'photo' as const,
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
        quality: 0.8,
        ...options,
      };

      launchCamera(defaultOptions, (response) => {
        if (response.didCancel) {
          reject(new Error('Camera cancelled'));
        } else if (response.errorMessage) {
          reject(new Error(response.errorMessage));
        } else {
          resolve(response);
        }
      });
    });
  }

  static async openImageLibrary(options: CameraOptions = { mediaType: 'photo' }): Promise<ImagePickerResponse> {
    return new Promise((resolve, reject) => {
      const defaultOptions = {
        mediaType: 'photo' as const,
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
        quality: 0.8,
        ...options,
      };

      launchImageLibrary(defaultOptions, (response) => {
        if (response.didCancel) {
          reject(new Error('Image library cancelled'));
        } else if (response.errorMessage) {
          reject(new Error(response.errorMessage));
        } else {
          resolve(response);
        }
      });
    });
  }
}

export default CameraService;
```

#### 6.1.1 QR Code Scanner Component

**src/components/common/QRCodeScanner.tsx:**
```typescript
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Button } from '@/components/ui/Button';

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  onClose: () => void;
  title?: string;
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  onScan,
  onError,
  onClose,
  title = 'Scan QR Code',
}) => {
  const [isScanning, setIsScanning] = useState(true);
  const [flashMode, setFlashMode] = useState(false);
  const cameraRef = useRef<RNCamera>(null);

  // Web implementation using HTML5 QR scanner
  const WebQRScanner = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      if (Platform.OS === 'web') {
        startWebScanner();
      }

      return () => {
        if (Platform.OS === 'web') {
          stopWebScanner();
        }
      };
    }, []);

    const startWebScanner = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }

        // Start scanning loop
        scanQRCode();
      } catch (error) {
        onError?.('Failed to access camera');
      }
    };

    const stopWebScanner = () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };

    const scanQRCode = () => {
      if (!videoRef.current || !canvasRef.current || !isScanning) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Here you would integrate with a QR code library like jsQR
        // const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        // if (code) {
        //   setIsScanning(false);
        //   onScan(code.data);
        //   return;
        // }
      }

      if (isScanning) {
        requestAnimationFrame(scanQRCode);
      }
    };

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 250,
          height: 250,
          border: '2px solid #fff',
          borderRadius: 8,
        }} />
      </div>
    );
  };

  const handleBarCodeRead = (event: any) => {
    if (isScanning) {
      setIsScanning(false);
      onScan(event.data);
    }
  };

  const toggleFlash = () => {
    setFlashMode(!flashMode);
  };

  const resetScanner = () => {
    setIsScanning(true);
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.scannerContainer}>
          <WebQRScanner />
        </View>
        <View style={styles.footer}>
          <Text style={styles.instruction}>
            Point your camera at a QR code to scan
          </Text>
          <Button
            title="Reset Scanner"
            onPress={resetScanner}
            variant="secondary"
            style={styles.resetButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RNCamera
        ref={cameraRef}
        style={styles.preview}
        type={RNCamera.Constants.Type.back}
        flashMode={flashMode ? RNCamera.Constants.FlashMode.torch : RNCamera.Constants.FlashMode.off}
        onBarCodeRead={handleBarCodeRead}
        barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
        captureAudio={false}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.scanArea}>
            <View style={styles.scanFrame} />
            <Text style={styles.instruction}>
              Point your camera at a QR code
            </Text>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity onPress={toggleFlash} style={styles.controlButton}>
              <Icon 
                name={flashMode ? "flash-on" : "flash-off"} 
                size={30} 
                color="#fff" 
              />
            </TouchableOpacity>
            
            {!isScanning && (
              <TouchableOpacity onPress={resetScanner} style={styles.controlButton}>
                <Icon name="refresh" size={30} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </RNCamera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  preview: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  instruction: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 40,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
    gap: 40,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  resetButton: {
    marginTop: 10,
  },
});
```

### 6.2 Geolocation Service

**src/services/LocationService.ts:**
```typescript
import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

interface LocationResult {
  coords: LocationCoords;
  timestamp: number;
}

interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

class LocationService {
  static async requestLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve(false);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { timeout: 5000 }
        );
      });
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Nigerian PoS needs access to your location for security and compliance',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        console.error('Location permission error:', error);
        return false;
      }
    }

    // iOS permissions are handled automatically by the system
    return true;
  }

  static async getCurrentLocation(options: LocationOptions = {}): Promise<LocationResult> {
    const hasPermission = await this.requestLocationPermission();
    
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    const defaultOptions: LocationOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
      ...options,
    };

    if (Platform.OS === 'web') {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              coords: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude || undefined,
                heading: position.coords.heading || undefined,
                speed: position.coords.speed || undefined,
              },
              timestamp: position.timestamp,
            });
          },
          (error) => {
            reject(new Error(`Location error: ${error.message}`));
          },
          defaultOptions
        );
      });
    }

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude || undefined,
              heading: position.coords.heading || undefined,
              speed: position.coords.speed || undefined,
            },
            timestamp: position.timestamp,
          });
        },
        (error) => {
          reject(new Error(`Location error: ${error.message}`));
        },
        defaultOptions
      );
    });
  }

  static watchLocation(
    callback: (location: LocationResult) => void,
    errorCallback: (error: Error) => void,
    options: LocationOptions = {}
  ): number {
    const defaultOptions: LocationOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
      ...options,
    };

    if (Platform.OS === 'web') {
      return navigator.geolocation.watchPosition(
        (position) => {
          callback({
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude || undefined,
              heading: position.coords.heading || undefined,
              speed: position.coords.speed || undefined,
            },
            timestamp: position.timestamp,
          });
        },
        (error) => {
          errorCallback(new Error(`Location error: ${error.message}`));
        },
        defaultOptions
      );
    }

    return Geolocation.watchPosition(
      (position) => {
        callback({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
          },
          timestamp: position.timestamp,
        });
      },
      (error) => {
        errorCallback(new Error(`Location error: ${error.message}`));
      },
      defaultOptions
    );
  }

  static clearWatch(watchId: number): void {
    if (Platform.OS === 'web') {
      navigator.geolocation.clearWatch(watchId);
    } else {
      Geolocation.clearWatch(watchId);
    }
  }

  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export default LocationService;
```

---

## 7. Cross-Platform Testing Strategies

### 7.1 Testing Configuration

**jest.config.js:**
```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup.ts'
  ],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.(test|spec).{js,jsx,ts,tsx}'
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx): 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-vector-icons)/)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapping: {
    '^@/(.*): '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/node_modules/**'
  ],
  coverageReporters: ['html', 'text', 'text-summary', 'cobertura'],
  testEnvironment: 'jsdom'
};
```

#### 7.1.1 Test Setup

**src/__tests__/setup.ts:**
```typescript
import 'react-native-gesture-handler/jestSetup';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock react-native-keychain
jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn().mockResolvedValue(true),
  getInternetCredentials: jest.fn().mockResolvedValue({
    username: 'test',
    password: 'test'
  }),
  resetInternetCredentials: jest.fn().mockResolvedValue(true),
}));

// Mock react-native-biometrics
jest.mock('react-native-biometrics', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    isSensorAvailable: jest.fn().mockResolvedValue({ available: true, biometryType: 'TouchID' }),
    createKeys: jest.fn().mockResolvedValue({ publicKey: 'mock_public_key' }),
    createSignature: jest.fn().mockResolvedValue({ success: true, signature: 'mock_signature' }),
    deleteKeys: jest.fn().mockResolvedValue(true),
  })),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  NavigationContainer: ({ children }: any) => children,
}));

// Mock react-native-camera
jest.mock('react-native-camera', () => ({
  RNCamera: {
    Constants: {
      Type: { back: 'back', front: 'front' },
      FlashMode: { on: 'on', off: 'off', torch: 'torch' },
      BarCodeType: { qr: 'qr' },
    },
  },
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn().mockResolvedValue({ isConnected: true }),
}));

// Global test utilities
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock window for web-specific tests
Object.defineProperty(window, 'navigator', {
  value: {
    onLine: true,
    geolocation: {
      getCurrentPosition: jest.fn(),
      watchPosition: jest.fn(),
      clearWatch: jest.fn(),
    },
    credentials: {
      create: jest.fn(),
    },
    mediaDevices: {
      getUserMedia: jest.fn().mockResolvedValue({
        getTracks: () => [{ stop: jest.fn() }],
      }),
    },
  },
  writable: true,
});

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    key: jest.fn(),
    length: 0,
  },
  writable: true,
});
```

### 7.2 Component Testing

#### 7.2.1 Button Component Tests

**src/components/ui/__tests__/Button.test.tsx:**
```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders correctly with default props', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={jest.fn()} />
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" onPress={mockOnPress} />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('shows loading indicator when loading', () => {
    const { getByTestId } = render(
      <Button
        title="Test Button"
        onPress={jest.fn()}
        loading={true}
        testID="test-button"
      />
    );
    
    const button = getByTestId('test-button');
    expect(button).toBeTruthy();
    // ActivityIndicator should be present instead of text
  });

  it('is disabled when disabled prop is true', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button
        title="Test Button"
        onPress={mockOnPress}
        disabled={true}
      />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('applies variant styles correctly', () => {
    const { getByText, rerender } = render(
      <Button title="Test Button" onPress={jest.fn()} variant="primary" />
    );
    
    let button = getByText('Test Button').parent;
    // Test primary styles
    
    rerender(
      <Button title="Test Button" onPress={jest.fn()} variant="secondary" />
    );
    
    button = getByText('Test Button').parent;
    // Test secondary styles
  });

  it('applies size styles correctly', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={jest.fn()} size="large" />
    );
    
    const button = getByText('Test Button').parent;
    // Test large size styles
  });
});
```

#### 7.2.2 Input Component Tests

**src/components/ui/__tests__/Input.test.tsx:**
```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../Input';

describe('Input Component', () => {
  it('renders correctly with label', () => {
    const { getByText, getByPlaceholderText } = render(
      <Input
        label="Test Label"
        placeholder="Test placeholder"
        onChangeText={jest.fn()}
      />
    );
    
    expect(getByText('Test Label')).toBeTruthy();
    expect(getByPlaceholderText('Test placeholder')).toBeTruthy();
  });

  it('shows required indicator when required', () => {
    const { getByText } = render(
      <Input
        label="Test Label"
        required={true}
        onChangeText={jest.fn()}
      />
    );
    
    expect(getByText('*')).toBeTruthy();
  });

  it('displays error message when error prop is provided', () => {
    const { getByText } = render(
      <Input
        label="Test Label"
        error="This field is required"
        onChangeText={jest.fn()}
      />
    );
    
    expect(getByText('This field is required')).toBeTruthy();
  });

  it('displays hint when no error', () => {
    const { getByText } = render(
      <Input
        label="Test Label"
        hint="This is a hint"
        onChangeText={jest.fn()}
      />
    );
    
    expect(getByText('This is a hint')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const mockOnChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <Input
        placeholder="Test input"
        onChangeText={mockOnChangeText}
      />
    );
    
    fireEvent.changeText(getByPlaceholderText('Test input'), 'New text');
    expect(mockOnChangeText).toHaveBeenCalledWith('New text');
  });

  it('handles focus and blur events', () => {
    const mockOnFocus = jest.fn();
    const mockOnBlur = jest.fn();
    const { getByPlaceholderText } = render(
      <Input
        placeholder="Test input"
        onFocus={mockOnFocus}
        onBlur={mockOnBlur}
        onChangeText={jest.fn()}
      />
    );
    
    const input = getByPlaceholderText('Test input');
    fireEvent(input, 'focus');
    expect(mockOnFocus).toHaveBeenCalled();
    
    fireEvent(input, 'blur');
    expect(mockOnBlur).toHaveBeenCalled();
  });
});
```

### 7.3 Service Testing

#### 7.3.1 StorageService Tests

**src/services/__tests__/StorageService.test.ts:**
```typescript
import StorageService from '../StorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage is already set up in setup.ts

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setItem', () => {
    it('should store data correctly', async () => {
      const testData = { name: 'John', age: 30 };
      
      await StorageService.setItem('user', testData);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'nigerian_pos_user',
        JSON.stringify(testData)
      );
    });

    it('should handle storage errors', async () => {
      const mockError = new Error('Storage error');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(mockError);
      
      await expect(StorageService.setItem('test', 'data')).rejects.toThrow('Storage error');
    });
  });

  describe('getItem', () => {
    it('should retrieve stored data correctly', async () => {
      const testData = { name: 'John', age: 30 };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(testData));
      
      const result = await StorageService.getItem('user');
      
      expect(result).toEqual(testData);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('nigerian_pos_user');
    });

    it('should return null for non-existent keys', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      
      const result = await StorageService.getItem('nonexistent');
      
      expect(result).toBeNull();
    });

    it('should handle retrieval errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Retrieval error'));
      
      const result = await StorageService.getItem('test');
      
      expect(result).toBeNull();
    });
  });

  describe('removeItem', () => {
    it('should remove item correctly', async () => {
      await StorageService.removeItem('user');
      
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('nigerian_pos_user');
    });
  });

  describe('multiGet', () => {
    it('should retrieve multiple items correctly', async () => {
      const mockPairs = [
        ['nigerian_pos_user1', JSON.stringify({ name: 'John' })],
        ['nigerian_pos_user2', JSON.stringify({ name: 'Jane' })],
      ];
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue(mockPairs);
      
      const result = await StorageService.multiGet(['user1', 'user2']);
      
      expect(result).toEqual({
        user1: { name: 'John' },
        user2: { name: 'Jane' },
      });
    });
  });

  describe('clear', () => {
    it('should clear all app-specific data', async () => {
      const mockKeys = ['nigerian_pos_user', 'nigerian_pos_settings', 'other_app_data'];
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(mockKeys);
      
      await StorageService.clear();
      
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        'nigerian_pos_user',
        'nigerian_pos_settings',
      ]);
    });
  });

  describe('transaction queue methods', () => {
    it('should manage transaction queue correctly', async () => {
      const transactions = [
        { id: '1', type: 'PAYMENT', amount: 100 },
        { id: '2', type: 'TRANSFER', amount: 200 },
      ];
      
      await StorageService.setTransactionQueue(transactions);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'nigerian_pos_transaction_queue',
        JSON.stringify(transactions)
      );
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(transactions));
      const result = await StorageService.getTransactionQueue();
      expect(result).toEqual(transactions);
    });

    it('should add transaction to queue', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));
      
      const newTransaction = { id: '1', type: 'PAYMENT', amount: 100 };
      await StorageService.addToTransactionQueue(newTransaction);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'nigerian_pos_transaction_queue',
        expect.stringContaining('"id":"1"')
      );
    });
  });
});
```

### 7.4 Integration Testing

#### 7.4.1 Authentication Flow Tests

**src/__tests__/integration/AuthenticationFlow.test.tsx:**
```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { AuthService } from '@/services/AuthService';

// Mock AuthService
jest.mock('@/services/AuthService');
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete login flow successfully', async () => {
    mockAuthService.login.mockResolvedValue({
      success: true,
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'AGENT',
          phoneNumber: '+234801234567',
        },
        token: 'mock_token',
        refreshToken: 'mock_refresh_token',
      },
    });

    const { getByPlaceholderText, getByText } = renderWithProviders(<LoginScreen />);
    
    // Fill in login form
    fireEvent.changeText(getByPlaceholderText('Enter email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter password'), 'password123');
    
    // Submit form
    fireEvent.press(getByText('Sign In'));
    
    await waitFor(() => {
      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should handle login failure correctly', async () => {
    mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

    const { getByPlaceholderText, getByText, findByText } = renderWithProviders(<LoginScreen />);
    
    // Fill in login form
    fireEvent.changeText(getByPlaceholderText('Enter email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter password'), 'wrongpassword');
    
    // Submit form
    fireEvent.press(getByText('Sign In'));
    
    // Check for error message
    await findByText('Invalid credentials');
  });

  it('should handle biometric authentication', async () => {
    const mockBiometricService = require('@/services/BiometricService').default;
    mockBiometricService.isAvailable.mockResolvedValue(true);
    mockBiometricService.authenticate.mockResolvedValue({
      success: true,
      signature: 'mock_signature',
    });

    mockAuthService.verifyBiometric.mockResolvedValue({
      success: true,
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'AGENT',
          phoneNumber: '+234801234567',
        },
        token: 'mock_token',
      },
    });

    const { getByText } = renderWithProviders(<LoginScreen />);
    
    // Trigger biometric authentication
    fireEvent.press(getByText('Use Biometric'));
    
    await waitFor(() => {
      expect(mockBiometricService.authenticate).toHaveBeenCalled();
      expect(mockAuthService.verifyBiometric).toHaveBeenCalled();
    });
  });
});
```

---

## 8. Performance Optimization

### 8.1 React Native Performance Optimization

#### 8.1.1 Memoization and Optimization Hooks

**src/hooks/useOptimizedCallback.ts:**
```typescript
import { useCallback, useMemo, useRef } from 'react';

// Optimized callback hook that prevents unnecessary re-renders
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    ((...args: any[]) => callbackRef.current(...args)) as T,
    deps
  );
}

// Memoized component factory
export function createMemoizedComponent<T>(
  component: React.ComponentType<T>,
  arePropsEqual?: (prevProps: T, nextProps: T) => boolean
) {
  return React.memo(component, arePropsEqual);
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const lastRender = useRef<number>(Date.now());

  useMemo(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRender.current;
    
    if (__DEV__) {
      console.log(`[${componentName}] Render #${renderCount.current}, Time since last: ${timeSinceLastRender}ms`);
    }