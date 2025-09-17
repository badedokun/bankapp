# OrokiiPay Banking Application

This is a [**React Native**](https://reactnative.dev) multi-tenant banking platform with web support, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

## 🏦 Multi-Platform Banking Solution
- **React Native Mobile App** (iOS & Android)
- **React Web Application** (Progressive Web App)
- **Multi-tenant Architecture** (FMFB, SaaS, Demo tenants)
- **Centralized Environment Configuration** for seamless deployments

## 🌍 Environment Configuration System

This application uses a **centralized environment configuration system** that automatically detects deployment environments and configures URLs accordingly. This eliminates the need for manual URL changes when switching between local development and cloud deployments.

### Quick Environment Setup

#### For Local Development:
```bash
# Copy the local environment template
cp .env.local.example .env.local

# Edit the values as needed (optional - defaults work for most cases)
nano .env.local

# Start the applications
npm run server  # API server on port 3001
npm run web     # Web app on port 3000
```

#### For Cloud Deployment:
```bash
# Copy the cloud environment template
cp .env.cloud.example .env

# Edit with your cloud-specific values
nano .env

# Deploy using your deployment script
./deploy.sh
```

### Environment Features:
- **🔍 Automatic Detection**: Local vs Cloud environment detection
- **🔗 Smart URL Resolution**: Absolute URLs locally, relative URLs in cloud
- **🎯 Zero Configuration**: Switch environments without code changes
- **🛠️ Development Friendly**: Easy local development setup
- **☁️ Cloud Ready**: Supports GCP, AWS, Vercel, Netlify, Heroku

## Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

### Prerequisites

1. **Environment Setup** (Required for deployment):
   ```bash
   # For local development
   cp .env.local.example .env.local
   
   # For cloud deployment
   cp .env.cloud.example .env
   ```

2. **Verify Environment Configuration**:
   ```bash
   node test-environment-config.js
   # Should show 100% success rate for all environment tests
   ```

3. **Database Setup** (if running backend):
   ```bash
   npm run db:migrate
   npm run db:verify-schema
   ```

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

#### Development (Debug Mode)
```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

#### Production APK Build
```sh
# Clean build directory
./android/gradlew clean -p android

# Build debug APK
./android/gradlew assembleDebug -p android

# Build release APK (for production)
./android/gradlew assembleRelease -p android
```

**APK Locations:**
- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release APK: `android/app/build/outputs/apk/release/app-release.apk`

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

## 📚 Documentation

### Core Documentation
- **[ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md)** - Comprehensive environment configuration guide
- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Step-by-step migration from hardcoded URLs
- **[docs/DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md)** - Banking application development guide
- **[docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md)** - Project architecture and overview
- **[docs/ENVIRONMENT_VARIABLES_CHANGELOG.md](docs/ENVIRONMENT_VARIABLES_CHANGELOG.md)** - Complete environment variables reference

### Environment Configuration Files
- **`.env.local.example`** - Local development environment template
- **`.env.cloud.example`** - Cloud deployment environment template
- **`test-environment-config.js`** - Environment configuration validation

### Important Commands

#### Environment Management
```bash
# Test environment configuration
node test-environment-config.js

# Local development setup
cp .env.local.example .env.local
npm run server & npm run web

# Cloud deployment setup  
cp .env.cloud.example .env
# Edit .env with your cloud settings
./deploy.sh
```

#### Banking Application Commands
```bash
# Database operations
npm run db:migrate
npm run db:verify-schema
npm run db:status

# Testing
npm run test:integration
npm run test

# Development
npm run server    # Backend API (port 3001)
npm run web       # Web application (port 3000)

# Mobile APK Build
./android/gradlew clean -p android          # Clean build
./android/gradlew assembleDebug -p android  # Debug APK
./android/gradlew assembleRelease -p android # Release APK
```

## 🏗️ Architecture

This banking application uses:
- **Multi-tenant architecture** (FMFB, SaaS, Demo tenants)
- **Cross-platform deployment** (React Native mobile + React web)
- **Centralized environment management** for seamless deployments
- **Real database testing** for banking transaction integrity
- **Security-first design** with proper authentication and validation

## 🧩 Reusable Components

### Banking Alert System
The application includes a React Native Web-compatible alert system that replaces native Alert.alert() calls:

```typescript
import { useBankingAlert } from '../services/AlertService';

const { showAlert, showConfirm } = useBankingAlert();

// Simple alert
showAlert('Success', 'Transaction completed successfully');

// Confirmation dialog
showConfirm(
  'Confirm Transfer',
  'Are you sure you want to proceed?',
  () => console.log('Confirmed'),
  () => console.log('Cancelled')
);
```

**Why use this instead of Alert.alert():**
- ✅ Works on both React Native and React Native Web
- ✅ Consistent styling across platforms
- ✅ Tenant-aware theming
- ✅ Banking-specific UX patterns

### BackButton Component
Reusable back navigation component with consistent styling:

```typescript
import BackButton from '../components/ui/BackButton';

<BackButton
  onPress={() => navigation.goBack()}
  variant="transparent"  // 'primary' | 'transparent' | 'light'
  size="medium"         // 'small' | 'medium' | 'large'
  title="Back"          // Optional custom text
  showArrow={true}      // Show/hide arrow
/>
```

## 🔒 Security Notes

- **Production deployments**: Always use strong secrets and encrypted connections
- **Environment variables**: Never commit `.env` files with real credentials
- **Database connections**: Use encrypted connections in production
- **API endpoints**: Always validate and authenticate requests
- **Testing**: Use real database connections for banking operations (no mocks)

## 🚀 Deployment

The application supports multiple deployment scenarios:
1. **Local Development**: Automatic localhost configuration
2. **Single Server**: Same-domain deployment with relative URLs
3. **Microservices**: Separate API and web deployments
4. **Multi-cloud**: GCP, AWS, Vercel, Netlify, Heroku support

See [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) for detailed deployment instructions.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
