# 🏦 OrokiiPay Multi-Tenant Banking Platform - Project Overview

## 🚨 **VERY IMPORTANT - MUST READ FOR ALL DEVELOPERS** 🚨

> **⚠️ CRITICAL: This section contains the established technology stack and architecture patterns that MUST be followed. Do NOT deviate from these patterns without explicit architectural review and approval.**

---

## 🏛️ **CRITICAL MULTI-TENANT PRINCIPLE - NEVER HARDCODE TENANT DATA**

### ⚠️ **THIS IS A MULTI-TENANT PLATFORM - ALL TENANT DATA MUST BE DYNAMIC**

**❌ NEVER HARDCODE TENANT-SPECIFIC VALUES IN THE CODEBASE ❌**

This platform serves **multiple banks/financial institutions** using a **single codebase**. Hardcoding tenant data breaks the entire multi-tenant architecture and makes the platform unusable for other tenants.

### ✅ **CORRECT: Always Load Tenant Data Dynamically**

**Approved Sources for Tenant Data (in order of preference):**

1. **JWT Token** (Primary Source)
   ```typescript
   const userProfile = await APIService.getProfile();
   const tenantCode = userProfile.tenant.name;        // e.g., 'fmfb', 'gtb', 'access'
   const tenantName = userProfile.tenant.displayName; // e.g., 'Firstmidas Microfinance Bank Limited'
   ```

2. **Theme Context** (Loaded from API)
   ```typescript
   const { theme } = useTenantTheme();
   const tenantCode = theme.tenantCode;    // From API
   const tenantName = theme.brandName;     // From API
   const tenantColors = theme.colors;      // From API
   ```

3. **Subdomain** (For initial tenant resolution)
   ```typescript
   const subdomain = window.location.hostname.split('.')[0]; // 'fmfb' from 'fmfb.orokii.com'
   ```

4. **Environment Variables** (For defaults/fallback ONLY)
   ```typescript
   const defaultTenant = process.env.REACT_APP_DEFAULT_TENANT || 'platform';
   ```

### ❌ **WRONG: Examples of What NOT to Do**

```typescript
// ❌ WRONG - Hardcoded tenant bank code
const bank = 'FMFB';
const bankCode = 'fmfb';

// ❌ WRONG - Hardcoded tenant bank name
const bankName = 'Firstmidas Microfinance Bank Limited';

// ❌ WRONG - Hardcoded tenant colors
const primaryColor = '#010080'; // FMFB's color

// ❌ WRONG - Hardcoded tenant logo
const logo = '/assets/fmfb-logo.png';

// ❌ WRONG - Tenant-specific business logic
if (tenantCode === 'fmfb') {
  // Special FMFB logic - THIS BREAKS OTHER TENANTS
}
```

### ✅ **CORRECT: Examples of Multi-Tenant Code**

```typescript
// ✅ CORRECT - Dynamic tenant from JWT
const userProfile = await APIService.getProfile();
const bank = userProfile.tenant.name;
const bankName = userProfile.tenant.displayName;

// ✅ CORRECT - Dynamic tenant from theme context
const { theme } = useTenantTheme();
const primaryColor = theme.colors.primary;
const logo = theme.brandLogo;
const bankName = theme.brandName;

// ✅ CORRECT - Tenant-agnostic business logic
const transferFee = calculateFee(amount, transferType); // Same logic for all tenants
```

### 📋 **Examples of Tenant-Specific Data (NEVER HARDCODE)**

- ✘ Tenant/Bank codes: `'fmfb'`, `'gtb'`, `'access'`, `'zenith'`, etc.
- ✘ Bank names: `'Firstmidas Microfinance Bank'`, `'Guaranty Trust Bank'`, etc.
- ✘ Bank logos, colors, typography, branding
- ✘ Tenant-specific URLs, endpoints, or configurations
- ✘ Tenant-specific business rules or workflows

### 🎯 **Why This Matters**

1. **Platform Scalability**: Enables onboarding new banks without code changes
2. **Maintenance**: Single codebase serves all tenants
3. **White-Label**: Each bank gets their own branded experience
4. **Cost Efficiency**: One deployment serves multiple institutions
5. **Security**: Proper tenant isolation prevents data leakage

### 🔍 **How to Check Your Code**

Before committing, search for hardcoded tenant references:
```bash
# Search for hardcoded tenant names
grep -r "FMFB\|'fmfb'\|GTB\|'gtb'" src/ --include="*.tsx" --include="*.ts"

# Ensure theme colors are used instead of hex codes
grep -r "#010080\|#FFD700" src/ --include="*.tsx" --include="*.ts"
```

**If you find hardcoded tenant data in your code, REFACTOR IMMEDIATELY before committing.**

---

## 🗄️ **CRITICAL DATABASE ARCHITECTURE - MUST READ BEFORE ANY DATABASE QUERIES**

### ⚠️ **READ THIS DOCUMENT FIRST: [DATABASE_ARCHITECTURE.md](./docs/DATABASE_ARCHITECTURE.md)**

**This platform uses a database-per-tenant isolation model with TWO distinct database layers:**

1. **Platform Database** (`bank_app_platform`) - Tenant registry and platform-wide data ONLY
2. **Tenant Databases** (`tenant_fmfb_db`, `tenant_acme_db`, etc.) - ALL tenant-specific data

### 🚨 **CRITICAL DATABASE RULES**

#### **Rule 1: Know Which Database to Use**

| Data Type | Database | Connection Method |
|-----------|----------|-------------------|
| Tenant registry | `bank_app_platform` | `dbManager.queryPlatform()` |
| Users | `tenant_{slug}_db` | `dbManager.queryTenant(tenant.id, ...)` |
| Wallets | `tenant_{slug}_db` | `dbManager.queryTenant(tenant.id, ...)` |
| Transactions | `tenant_{slug}_db` | `dbManager.queryTenant(tenant.id, ...)` |
| Transfers | `tenant_{slug}_db` | `dbManager.queryTenant(tenant.id, ...)` |
| Disputes | `tenant_{slug}_db` | `dbManager.queryTenant(tenant.id, ...)` |

#### **Rule 2: NEVER Store Tenant Data in Platform Database**

```typescript
// ❌ WRONG - Breaks regulatory compliance
await dbManager.queryPlatform('INSERT INTO platform.transactions ...');

// ✅ CORRECT - Maintains tenant isolation
await dbManager.queryTenant(tenant.id, 'INSERT INTO tenant.transactions ...');
```

#### **Rule 3: ALWAYS Use dbManager for Multi-Tenant Queries**

```typescript
// ❌ WRONG - Bypasses multi-tenant routing
import { query } from '../config/database';
await query('SELECT * FROM tenant.users');

// ✅ CORRECT - Properly routes to tenant database
import dbManager from '../config/multi-tenant-database';
const tenant = (req as any).tenant;
await dbManager.queryTenant(tenant.id, 'SELECT * FROM tenant.users WHERE id = $1', [userId]);
```

#### **Why Database Architecture Matters**

1. **Banking Regulations**: CBN and PCI DSS require complete data isolation between tenants
2. **Data Security**: Physical database separation prevents cross-tenant data leakage
3. **Compliance**: Each tenant's data must be queryable and auditable independently
4. **Performance**: Dedicated database per tenant enables better resource allocation

### 📚 **REQUIRED READING**

Before writing ANY database queries, you MUST read:
- **[Database Architecture Guide](./docs/DATABASE_ARCHITECTURE.md)** - Complete database architecture reference
  - Explains platform vs tenant databases
  - Shows correct connection methods
  - Lists all common mistakes and how to avoid them
  - Provides troubleshooting guide

**Failure to follow database architecture will result in:**
- ❌ Regulatory compliance violations
- ❌ Data isolation breaches
- ❌ Security vulnerabilities
- ❌ Code that doesn't work for other tenants

---

### **🎨 MANDATORY UI DESIGN SYSTEM**
> **ALL UI DEVELOPMENT MUST FOLLOW THE MODERN DESIGN SYSTEM**
>
> 📖 **Required Reading**: [MODERN_UI_DESIGN_SYSTEM.md](./MODERN_UI_DESIGN_SYSTEM.md)
>
> **Key Requirements**:
> - ✅ Glassmorphism effects on all cards and panels
> - ✅ Dynamic tenant-based color theming (NO hardcoded colors)
> - ✅ Gradient backgrounds using tenant primary/secondary colors
> - ✅ Responsive layouts with defined breakpoints
> - ✅ Consistent component patterns across all screens
> - ✅ Modern notification system with toasts and modals (NO Material Design)
> - 🔴 **CRITICAL: 2-column grid on desktop/tablet, 1-column on mobile for ALL menu screens**
>
> **⚠️ Code without proper theming will be REJECTED**

### **✅ CONFIRMED: Modern React Native + React Web Architecture**

This banking application follows **industry-leading best practices** for cross-platform development:

- **Single Codebase**: React Native 0.81.1 + React Native Web for iOS, Android, and Web
- **TypeScript Throughout**: Strict typing with comprehensive interfaces
- **Modern State Management**: Redux Toolkit + TanStack Query (React Query)
- **Enterprise Navigation**: React Navigation v7 with deep linking
- **Material Design 3**: React Native Paper with custom banking components
- **Cross-Platform Build**: Webpack 5 with react-native-web aliasing

### **🛠️ MANDATORY Technology Stack (DO NOT CHANGE)**

#### **Core Framework**
```json
{
  "react": "^18.2.0",
  "react-native": "0.81.1",
  "react-native-web": "^0.21.1",
  "typescript": "^5.0.4"
}
```

#### **State & Data Management**
- **Global State**: `@reduxjs/toolkit` ^2.9.0
- **Server State**: `@tanstack/react-query` ^5.86.0
- **Form State**: `react-hook-form` ^7.54.2
- **Local Storage**: `@react-native-async-storage/async-storage`

#### **UI Components & Styling**
- **Component Library**: `react-native-paper` ^5.14.0 (Material Design)
- **Icons**: `react-native-vector-icons` ^10.2.0
- **Animations**: `react-native-reanimated` ^3.17.1
- **Gestures**: `react-native-gesture-handler` ^2.21.2

#### **Navigation**
- **Primary**: `@react-navigation/native` ^7.0.14
- **Stack**: `@react-navigation/native-stack` ^7.1.13
- **Bottom Tabs**: `@react-navigation/bottom-tabs` ^7.1.9

#### **Backend Architecture**
- **API Server**: Express.js 5.1.0 with TypeScript
- **Database**: PostgreSQL 15+ with multi-tenant schemas
- **Authentication**: JWT with refresh tokens
- **AI Integration**: OpenAI GPT-4 for intelligent features

### **📁 MANDATORY Project Structure**

```
/bankapp
├── src/
│   ├── components/        # Reusable UI components
│   ├── screens/           # Screen components (pages)
│   ├── navigation/        # Navigation configuration
│   ├── store/            # Redux store & slices
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API service layer
│   ├── context/          # React contexts (Theme, User, etc.)
│   ├── styles/           # Modern UI styles & design system
│   ├── design-system/    # Design tokens & themes
│   └── types/            # TypeScript definitions
├── server/               # Express.js backend
├── database/            # PostgreSQL schemas
├── tests/              # Comprehensive test suite
└── MODERN_UI_DESIGN_SYSTEM.md  # UI Design Guidelines (REQUIRED READING)
```

### **⚠️ CRITICAL PATTERNS TO FOLLOW**

1. **ALWAYS use React Native components** (View, Text, ScrollView)
2. **NEVER use HTML elements** (div, span, p)
3. **Platform-specific code MUST use Platform API**
4. **Styles MUST use StyleSheet.create()**
5. **API calls MUST use RTK Query**
6. **Forms MUST use React Hook Form**
7. **TypeScript interfaces REQUIRED for all props**
8. **ALWAYS use useTenantTheme() for colors** (NO hardcoded colors)
9. **MUST implement glassmorphism on cards** (see MODERN_UI_DESIGN_SYSTEM.md)
10. **MUST use gradient backgrounds with tenant colors**
11. **MUST use ModernNotificationService for all user feedback** (NO AlertService)
12. **🔴 MUST use responsive grid: 2 columns on ≥768px, 1 column on <768px for menu screens**
13. **🔴 MUST maintain consistent card dimensions: minHeight: 180px for ALL menu cards**
14. **🔴 MUST follow standardized card content structure: Header → Title → Footer (no complex layouts)**

---

## 📋 **CRITICAL: Read This First**
This document is essential for any Claude Code agent working on this project. It contains the complete project architecture, database structure, and key implementation details to prevent rework of existing functionality.

---

## 🎯 **Project Identity**
- **Name**: OrokiiPay Multi-Tenant Banking Platform
- **Version**: 0.0.1
- **Type**: Cross-platform financial technology application
- **Architecture**: Multi-tenant SaaS with database-per-tenant isolation

---

## 🏗️ **System Architecture Overview**

### **Multi-Tier Architecture**
```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                       │
│  React Native + React Native Web (Cross-Platform)      │
│  Port 3000 (React Native) + Port 8080 (Web)           │
└─────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────┐
│                   API GATEWAY LAYER                     │
│         Express.js Backend API (Port 3001)             │
│    JWT Auth + Multi-Tenant Middleware + Rate Limiting  │
└─────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────┐
│                  DATABASE LAYER                         │
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────────┐   │
│  │   PLATFORM DB       │  │    TENANT DATABASES     │   │
│  │ (tenant registry)   │  │ (per-tenant isolation)  │   │
│  │ PostgreSQL          │  │ PostgreSQL              │   │
│  └─────────────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### **Multi-Tenant Model**
- **Database-per-tenant**: Each tenant has isolated database (`tenant_{name}_mt`)
- **Shared application code**: Single codebase serves all tenants
- **Tenant routing**: Via subdomain, header, or JWT token context

### **🚨 CRITICAL: Platform Administration Architecture**

**UNIFIED APPLICATION APPROACH** (Industry Best Practice)
Following proven patterns from **Slack, GitHub, GitLab, Atlassian**:

- ✅ **Same Application**: Single React Native + Web codebase serves both platform admin and tenant users
- ✅ **Same Database**: Single PostgreSQL with role-based query scoping
- ✅ **Same Infrastructure**: Cost-efficient unified deployment
- ✅ **Subdomain-Based Access**:
  - `admin.orokiipay.com` → Platform admin interface (OrokiiPay team)
  - `{tenant}.orokiipay.com` → Bank-specific interface (e.g., fmfb.orokiipay.com)
- ✅ **JWT Context**: Role-based access control with dynamic UI rendering
- ✅ **Security Separation**: Enhanced security for platform admin, standard for tenants

**REFERENCE DOCUMENTS:**
- 📄 **`TENANT_MANAGEMENT_SAAS_UNIFIED.md`** - Complete architecture specification
- 📄 **`FRONTEND_UNIFIED_IMPLEMENTATION.md`** - Frontend implementation plan
- 🎨 **`MODERN_UI_DESIGN_SYSTEM.md`** - Mandatory UI/UX design guidelines

**DO NOT implement separate applications or databases for platform admin!**

---

## 🛠️ **Technology Stack**

### **Frontend**
- **React Native**: 0.81.1 (Mobile iOS/Android)
- **React Native Web**: 0.21.1 (Web browser support)
- **Navigation**: React Navigation v7 (Stack & Bottom Tabs)
- **State Management**: Redux Toolkit + React Query
- **Build Tools**: Webpack 5, Babel, TypeScript
- **Testing**: Jest + React Native Testing Library
- **UI Design System**: Modern glassmorphic with dynamic tenant theming
  - 📖 See [MODERN_UI_DESIGN_SYSTEM.md](./MODERN_UI_DESIGN_SYSTEM.md) for mandatory UI guidelines
  - Dynamic gradients based on tenant colors from database
  - Glassmorphism effects with backdrop blur
  - Responsive layouts with defined breakpoints

  **🔴 CRITICAL UI Consistency Requirements:**
  - **Menu Card Dimensions**: All menu selection cards MUST have `minHeight: 180px`
  - **Content Structure**: Standardized 3-section layout (Header/Title/Footer)
  - **Grid Layout**: 2-column on desktop/tablet (≥768px), 1-column on mobile
  - **No Complex Layouts**: Avoid feature chips, action buttons, or multi-row content in cards
  - **Visual Weight**: All cards must appear similar in size and content density

- **Notification System**: ModernNotificationService with glassmorphic toasts/modals
  - Toast notifications for non-blocking feedback
  - Modal dialogs for critical confirmations
  - Dynamic tenant color theming
  - Smooth animations and stack management

### **Backend**
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js 5.1.0
- **Authentication**: JWT + Refresh Tokens (jsonwebtoken 9.0.2)
- **Security**: Helmet, CORS, Rate Limiting, bcrypt hashing
- **Database**: PostgreSQL with `pg` driver
- **Validation**: express-validator
- **Phone Validation**: libphonenumber-js (international validation for 9 countries)
- **Internationalization**: i18next + react-i18next (4 languages: en, fr, de, es)
- **Development**: ts-node, nodemon

### **Database**
- **Primary**: PostgreSQL 15+ with extensions
- **Connection**: Connection pooling per tenant
- **Extensions**: uuid-ossp, pgcrypto, pg_stat_statements, btree_gin
- **Backup**: Automated with configurable schedules

### **DevOps & Testing**
- **Testing**: Jest multi-project configuration (Frontend/Backend/Integration)
- **Scripts**: ts-node for database operations and tenant provisioning
- **Environment**: dotenv with multiple environment configurations
- **CI/CD Ready**: Jest CI configuration with coverage

---

## 📊 **Database Architecture**

### **Platform Database** (`bank_app_platform`)
**Schemas**: `platform`, `audit`, `analytics`, `public`

**Key Tables**:
```sql
-- Central tenant registry
platform.tenants {
    id: UUID (Primary Key)
    name: VARCHAR(255) UNIQUE
    display_name: VARCHAR(255) 
    subdomain: VARCHAR(100) UNIQUE
    status: ENUM('active', 'suspended', 'inactive', 'pending', 'provisioning')
    tier: ENUM('basic', 'premium', 'enterprise')
    database_config: JSONB -- Connection details
    configuration: JSONB -- Business rules & settings
    branding: JSONB -- Custom styling & assets
    ai_configuration: JSONB -- AI features per tenant
    security_settings: JSONB -- Security policies
}

-- Tenant asset storage (Base64 encoded)
platform.tenant_assets {
    tenant_id: UUID FK -> platform.tenants.id
    asset_type: VARCHAR(50) -- 'logo', 'favicon', 'hero_image', etc.
    asset_name: VARCHAR(255)
    asset_data: TEXT -- Base64 encoded binary data
    mime_type: VARCHAR(100)
    file_size: INTEGER
    dimensions: JSONB -- width/height for images
}
```

### **Tenant Databases** (`tenant_{name}_mt`)
**Schemas**: `tenant`, `ai`, `analytics`, `audit`

**Key Tables**:
```sql
-- Tenant metadata (single record per database)
tenant.tenant_metadata {
    tenant_id: UUID NOT NULL
    tenant_name: VARCHAR(255)
    schema_version: VARCHAR(50)
}

-- User management per tenant
tenant.users {
    id: UUID PRIMARY KEY
    tenant_id: UUID NOT NULL
    email: VARCHAR(255) UNIQUE NOT NULL
    phone_number: VARCHAR(20) UNIQUE
    password_hash: VARCHAR(255)
    first_name, last_name: VARCHAR(100)
    role: ENUM('customer', 'agent', 'manager', 'admin')
    status: ENUM('active', 'inactive', 'suspended', 'pending')
    permissions: JSONB
    kyc_status: ENUM('pending', 'submitted', 'approved', 'rejected')
    mfa_enabled: BOOLEAN
    biometric_enabled: BOOLEAN
}

-- Financial wallets
tenant.wallets {
    id: UUID PRIMARY KEY
    user_id: UUID FK -> tenant.users.id
    wallet_number: VARCHAR(20) UNIQUE
    wallet_type: ENUM('main', 'savings', 'business')
    currency: VARCHAR(3) DEFAULT 'NGN'
    balance: DECIMAL(15,2)
    available_balance: DECIMAL(15,2)
    status: ENUM('active', 'frozen', 'closed')
}

-- Transaction records
tenant.transactions {
    id: UUID PRIMARY KEY
    reference_number: VARCHAR(50) UNIQUE
    sender_user_id: UUID FK -> tenant.users.id
    sender_wallet_id: UUID FK -> tenant.wallets.id
    recipient_name: VARCHAR(255)
    recipient_account_number: VARCHAR(20)
    recipient_bank_code: VARCHAR(10)
    amount: DECIMAL(15,2) NOT NULL
    fees: DECIMAL(15,2) DEFAULT 0
    transaction_type: ENUM('money_transfer', 'cash_withdrawal', 'bill_payment')
    status: ENUM('pending', 'processing', 'completed', 'failed', 'cancelled')
    description: TEXT
}
```

---

## 🚀 **Development Commands**

### **Frontend Development**
```bash
npm start                 # Start React Native Metro bundler
npm run web              # Start web development server (port 8080)  
npm run ios              # Run on iOS simulator
npm run android          # Run on Android emulator
npm run web:build        # Production web build
```

### **Backend Development**
```bash
npm run server           # Start backend API server (port 3001)
npm run server:dev       # Start with nodemon auto-reload
npm run server:build     # Compile TypeScript to JavaScript  
npm run server:prod      # Production build + start
```

### **Database Operations**
```bash
npm run db:setup         # Initialize platform database
npm run db:seed          # Seed with sample data
npm run db:reset         # Reset database (DESTRUCTIVE)
npm run provision-tenant # Create new tenant database
```

### **Testing** (COMPREHENSIVE FRAMEWORK)
```bash
npm test                 # Run all tests (Frontend + Backend + Integration)
npm run test:frontend    # React Native component tests
npm run test:backend     # API and database tests
npm run test:integration # Frontend-backend integration tests with real API responses
npm run test:ux          # User experience validation tests
npm run test:e2e         # End-to-end user journey tests (Playwright)
npm run test:all         # Complete test suite (all layers)
npm run test:feature     # Test only files related to staged changes
npm run test:coverage    # Generate coverage report
npm run test:pre-commit  # Quick tests run before every commit
npm run test:pre-push    # Full validation before pushing code

# Phase 4 Global Deployment Validation Tests
node tests/validate-phone-library.js      # International phone validation (32 tests)
node tests/validate-translations.js       # Multi-language translations (198 tests)
node tests/validate-i18n-config.js        # i18n configuration (67 tests)
```

---

## 🔐 **Enterprise Security Architecture**

### **Zero Trust Security Framework**
- **Never Trust, Always Verify**: Continuous verification of users, devices, and transactions
- **Micro-segmentation**: Network and application-level isolation
- **Least Privilege Access**: Minimal access rights for all system components
- **Continuous Monitoring**: Real-time security event analysis and response

### **Multi-Tenant Security Boundaries**
```typescript
interface SecurityBoundaries {
  hardBoundaries: {
    databaseAccess: 'Complete isolation - no cross-tenant queries possible';
    encryptionKeys: 'AES-256-GCM unique keys per tenant, no shared secrets';
    userSessions: 'Tenant-scoped JWT tokens with cryptographic binding';
    storageAccess: 'Tenant-specific encrypted storage containers';
  };
  softBoundaries: {
    platformServices: 'Shared services with strict tenant context validation';
    aggregatedAnalytics: 'Anonymized cross-tenant insights with differential privacy';
    platformManagement: 'Admin access with comprehensive audit logging';
  };
}
```

### **Regulatory Compliance Framework**
- **CBN (Central Bank of Nigeria)**: Data localization, cybersecurity framework, incident reporting
- **PCI DSS Level 1**: Cardholder data protection, network segmentation, monitoring
- **ISO 27001 ISMS**: Information security management system implementation
- **Nigerian Data Protection**: NDPR compliance with customer data localization

### **Advanced Security Components**
1. **HSM Key Management**: Hardware security modules for encryption key storage and rotation
2. **WAF Protection**: Web Application Firewall with OWASP Top 10 protection
3. **SIEM Integration**: Security Information and Event Management with real-time alerting
4. **AI-Powered Fraud Detection**: ML-based behavioral analysis and risk scoring (< 500ms)
5. **Biometric Security**: Multi-factor authentication with behavioral biometrics
6. **Nigerian Threat Intelligence**: Local cybercrime pattern recognition and mitigation

### **Security Middleware Stack**
1. **Zero Trust Gateway**: Identity verification and continuous trust evaluation
2. **WAF Layer**: OWASP protection and request sanitization
3. **Rate Limiter**: Advanced tenant-aware throttling with AI anomaly detection
4. **JWT Middleware**: Enhanced token verification with tenant binding
5. **Tenant Context Validator**: Strict boundary enforcement and audit logging
6. **AI Security Monitor**: Real-time threat detection and automated response

---

## 📁 **Project Structure**

```
bankapp/
├── 📱 Frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── screens/             # Screen components (navigation routes)
│   │   │   ├── auth/            # Login, register screens
│   │   │   ├── dashboard/       # Dashboard screen  
│   │   │   ├── history/         # Transaction history
│   │   │   └── transfer/        # Money transfer screens
│   │   ├── design-system/       # 🎨 COMPREHENSIVE DESIGN SYSTEM
│   │   │   ├── tokens.ts        # Design tokens (colors, typography, spacing)
│   │   │   ├── theme.ts         # Multi-tenant theme engine
│   │   │   ├── components.ts    # Component style generators
│   │   │   ├── widgets.ts       # Banking-specific widgets
│   │   │   ├── navigation.ts    # Navigation components
│   │   │   └── index.ts         # Main exports
│   │   ├── services/            # API client and data services
│   │   ├── utils/               # Helper utilities
│   │   └── types/               # TypeScript type definitions
│   ├── App.tsx                  # Main app component
│   └── index.js                 # React Native entry point
│
├── 🎨 Public Design System
│   ├── public/design-system/
│   │   ├── orokii-pay-theme.css     # Complete CSS implementation (1700+ lines)
│   │   ├── style-guide.html         # Visual style guide & documentation
│   │   ├── navigation-showcase.html # Navigation components demo
│   │   └── widget-showcase.html     # Banking widgets showcase
│
├── 🖥️ Backend
│   ├── server/
│   │   ├── routes/              # API route handlers
│   │   │   ├── auth.ts          # Authentication endpoints
│   │   │   ├── users.ts         # User management
│   │   │   ├── wallets.ts       # Wallet operations  
│   │   │   ├── transfers.ts     # Money transfer APIs
│   │   │   ├── tenants.ts       # Tenant management
│   │   │   └── assets.ts        # Asset serving (logos, etc.)
│   │   ├── middleware/          # Express middleware
│   │   │   ├── auth.ts          # JWT authentication
│   │   │   ├── tenant.ts        # Multi-tenant context
│   │   │   ├── security.ts      # Zero Trust security controls
│   │   │   ├── waf.ts           # Web Application Firewall
│   │   │   ├── rateLimiter.ts   # AI-enhanced rate limiting
│   │   │   └── errorHandler.ts  # Error handling
│   │   ├── services/            # Security and AI services
│   │   │   ├── fraud-service/   # AI fraud detection
│   │   │   ├── ai-intelligence/ # Conversational AI
│   │   │   ├── security/        # Security monitoring
│   │   │   ├── compliance/      # CBN/PCI DSS compliance
│   │   │   └── encryption/      # HSM key management
│   │   ├── config/              # Configuration files
│   │   │   ├── database.ts      # Database connection management
│   │   │   ├── security.ts      # Security configuration
│   │   │   └── compliance.ts    # Regulatory compliance
│   │   └── index.ts             # Express server entry point
│
├── 🗄️ Database  
│   ├── migrations/              # SQL migration files
│   │   ├── 001_initial_platform_setup.sql
│   │   └── 002_tenant_template_schema.sql
│   └── seeds/                   # Sample data scripts
│
├── 📋 Scripts
│   ├── setup-database.ts       # Database initialization
│   ├── provision-tenant-database.ts  # New tenant setup
│   └── insert-fmfb-mock-data-final.sql  # FMFB test data
│
├── 🧪 Tests (COMPREHENSIVE FRAMEWORK)
│   ├── backend/                 # Backend API tests (existing)
│   ├── integration/             # Frontend-backend integration tests  
│   ├── ux/                      # User experience validation tests
│   ├── e2e/                     # End-to-end user journey tests (Playwright)
│   ├── utils/                   # Universal test helpers and utilities
│   ├── framework/               # Testing framework documentation
│   └── src/                     # Frontend component tests
│
├── ⚙️ Configuration
│   ├── .env*                    # Environment configurations
│   ├── jest.config.js           # Multi-project test configuration
│   ├── webpack.config.js        # Web build configuration
│   └── tsconfig.json            # TypeScript configuration
```

---

## 🌐 **API Endpoints Overview**

### **Authentication** (`/api/auth`)
- `POST /login` - User authentication with tenant context
- `POST /refresh` - Token refresh
- `POST /logout` - Session termination  

### **User Management** (`/api/users`)
- `GET /` - List tenant users (admin only)
- `GET /:id` - Get user details
- `PUT /:id` - Update user information

### **Wallet Operations** (`/api/wallets`)  
- `GET /balance` - Get wallet balance
- `GET /statement` - Transaction history
- `PUT /set-pin` - Set transaction PIN
- `POST /verify-pin` - Verify transaction PIN

### **Money Transfers** (`/api/transfers`)
- `POST /initiate` - Start money transfer
- `GET /history` - Transfer history  
- `GET /:id` - Get transfer details
- `POST /validate-recipient` - Validate recipient account

### **Tenant Management** (`/api/tenants`)
- `GET /` - List all tenants (platform admin)
- `GET /:id` - Get tenant details
- `GET /:tenantId/assets/:assetType/:assetName` - Serve tenant assets

---

## 🎨 **OrokiiPay Design System** (COMPREHENSIVE)

### **📋 Design System Overview**
The OrokiiPay Design System is a complete, enterprise-grade design system built specifically for multi-tenant banking applications. It provides consistent UI/UX across all platforms (mobile, web, desktop) while allowing tenant-specific branding and customization.

### **🏗️ Design System Architecture**

```typescript
// Complete Design System Structure
OrokiiPayDesignSystem/
├── 🎨 Design Tokens (Foundation)
│   ├── Colors: Primary, Secondary, Neutral, Semantic (Success, Error, Warning)
│   ├── Typography: Font families, sizes, weights, line heights
│   ├── Spacing: Consistent 8px grid system (xs, sm, md, lg, xl, 2xl, 3xl)
│   ├── Shadows: Elevation system for depth and hierarchy
│   └── Border Radius: Corner rounding for modern UI (sm, md, lg, xl)
│
├── 🎯 Multi-Tenant Theme Engine
│   ├── Base Theme: Default OrokiiPay brand colors and styling
│   ├── Tenant Themes: Custom branding for each banking institution
│   ├── CSS Variables: Dynamic theming with CSS custom properties
│   ├── React Native Styles: Cross-platform style generation
│   └── Theme Switching: Runtime theme changes for white-label support
│
├── 🧩 Component System (50+ Components)
│   ├── Buttons: Primary, Secondary, Outline, Ghost variants
│   ├── Inputs: Text, Email, Password, Number with validation states
│   ├── Cards: Transaction, Account, Dashboard components
│   ├── Navigation: Header, Sidebar, Bottom tabs, Breadcrumbs
│   ├── Badges: Status indicators, notifications, counters
│   └── Avatars: User profile images with fallbacks
│
└── 🏦 Banking Widgets (Specialized)
    ├── Date Picker: Professional calendar input with Nigerian date formats
    ├── Phone Formatter: Nigerian phone number input (+234 support)
    ├── Currency Formatter: Naira (₦) and multi-currency support
    ├── Account Number: 10-digit Nigerian account validation
    ├── PIN/OTP Input: Secure 4/6-digit PIN entry with auto-advance
    ├── File Upload: KYC document upload with drag & drop
    └── Search Widget: Transaction and account search functionality
```

### **🌍 Nigerian Banking Compliance**

All design components follow Nigerian banking regulations and best practices:

```typescript
// Nigerian Banking Standards
interface NigerianBankingCompliance {
  phoneNumbers: {
    format: '+234 XX XXXX XXXX';
    validation: '11-digit Nigerian mobile numbers';
    carriers: ['MTN', 'Airtel', 'Glo', '9mobile'];
  };
  
  currency: {
    primary: 'NGN (Nigerian Naira - ₦)';
    formatting: '₦1,500,000.00';
    precision: 2; // Kobo precision
  };
  
  identification: {
    bvn: '11-digit Bank Verification Number';
    nin: '11-digit National Identity Number';
    accountNumber: '10-digit bank account numbers';
  };
  
  compliance: {
    cbnerequirements: 'Central Bank of Nigeria regulations';
    kycDocuments: ['National ID', 'Driver License', 'Passport', 'Utility Bill'];
    dataLocalization: 'Nigerian customer data must remain in Nigeria';
  };
}
```

### **📱 Cross-Platform Support**

The design system supports all major platforms:

```typescript
// Platform Coverage
interface PlatformSupport {
  mobile: {
    reactNative: 'iOS 12+, Android 8.0+ support';
    gestures: 'Touch gestures, biometric authentication';
    offline: 'Offline-first design with sync capabilities';
  };
  
  web: {
    browsers: 'Chrome 90+, Safari 14+, Firefox 88+, Edge 90+';
    responsive: 'Mobile-first responsive design (320px to 4K)';
    pwa: 'Progressive Web App capabilities';
  };
  
  accessibility: {
    wcag: 'WCAG 2.1 AA compliance';
    screenReaders: 'VoiceOver, TalkBack, NVDA support';
    keyboardNavigation: 'Full keyboard navigation support';
  };
}
```

### **🎯 Theme System Usage**

```typescript
// Multi-Tenant Theme Implementation
import { createTenantTheme, createButtonStyles } from '@/design-system';

// Create custom tenant theme
const fmfbTheme = createTenantTheme({
  id: 'fmfb',
  name: 'First Midas Microfinance Bank',
  primaryColor: '#1a5f3f',      // FMFB green
  secondaryColor: '#f4b942',    // FMFB gold
  logoUrl: '/assets/fmfb-logo.png',
  customCSS: `
    .hero-section {
      background: linear-gradient(135deg, #1a5f3f 0%, #2d8659 100%);
    }
  `
});

// Generate component styles with theme
const buttonStyles = createButtonStyles(fmfbTheme, {
  variant: 'primary',
  size: 'md',
  fullWidth: true
});
```

### **🧩 Widget System Usage**

```typescript
// Banking Widget Implementation
import { 
  createCurrencyFormatterStyles, 
  createPhoneFormatterStyles,
  widgetUtils 
} from '@/design-system/widgets';

// Currency input for transfers
const currencyStyles = createCurrencyFormatterStyles(theme, {
  currency: 'NGN',
  showSymbol: true,
  size: 'lg'
});

// Nigerian phone number formatter
const phoneStyles = createPhoneFormatterStyles(theme, {
  countryCode: '+234',
  format: 'national',
  allowCountrySelection: true
});

// Utility functions for data formatting
const formattedAmount = widgetUtils.formatCurrency(150000, 'NGN', 2);
// Result: "₦150,000.00"

const isValidBVN = widgetUtils.validateBVN('12345678901');
// Result: true for 11-digit BVN
```

### **🚀 Design System Access Points**

**Live Documentation & Showcases:**
- **Style Guide**: `http://localhost:3001/design-system/style-guide.html`
  - Complete visual style guide with color palettes, typography, spacing
  - Interactive examples of all design tokens and components
  - Multi-tenant theme previews for different banking institutions

- **Widget Showcase**: `http://localhost:3001/design-system/widget-showcase.html`  
  - Interactive demos of all 7 banking widgets
  - Live JavaScript functionality (PIN auto-advance, formatting, validation)
  - Nigerian banking context examples (BVN, NIN, Naira currency)

- **Navigation Showcase**: `http://localhost:3001/design-system/navigation-showcase.html`
  - Mobile and desktop navigation patterns
  - Bottom tabs, sidebar, header, breadcrumb examples
  - Responsive behavior demonstrations

**Code Integration:**
```typescript
// TypeScript Integration
import { 
  OrokiiPayTheme, 
  createButtonStyles, 
  createCurrencyFormatterStyles,
  widgetUtils 
} from '@/design-system';

// CSS Integration  
@import './design-system/orokii-pay-theme.css';

// HTML/React Integration
<div className="orokii-button primary md">Transfer Money</div>
<div className="widget-currency full-width">
  <label className="widget-label">Amount</label>
  <input className="widget-input md default with-symbol" />
</div>
```

### **📊 Design System Statistics**

```
Design System Metrics:
├── CSS Classes: 500+ utility and component classes
├── TypeScript Functions: 25+ style generators and utilities  
├── Color Tokens: 120+ semantic color definitions
├── Component Variants: 200+ combinations (size × variant × state)
├── Widget Components: 7 banking-specific widgets
├── Navigation Patterns: 5 responsive navigation types
├── Platform Support: iOS, Android, Web, Desktop
├── Nigerian Banking: Full CBN compliance and local standards
└── Documentation: 3 interactive showcase pages
```

### **🔧 Design System Development Commands**

```bash
# Development
npm run design-system:build    # Build design system assets
npm run design-system:watch    # Watch for changes during development
npm run design-system:test     # Test component styles and functionality

# Documentation
npm run design-system:docs     # Generate design system documentation
npm run design-system:showcase # Start showcase server locally
```

### **⚠️ CRITICAL DESIGN SYSTEM NOTES**

### **✅ Currently Working (DO NOT MODIFY)**
1. **Complete Implementation**: All 5 design system modules fully functional
2. **Multi-Tenant Theming**: Dynamic theme switching for white-label banking
3. **Nigerian Compliance**: BVN, NIN, Naira currency validation and formatting  
4. **Cross-Platform**: React Native + Web support with consistent styling
5. **Interactive Showcases**: 3 comprehensive demo pages with live functionality
6. **1700+ Lines CSS**: Production-ready stylesheet with all components

### **🎯 Design System Integration Priority**
1. **Use Existing Components**: Always check design system before creating new UI
2. **Follow Token System**: Use design tokens for consistent spacing, colors, typography
3. **Maintain Theme Support**: Ensure all new components support multi-tenant theming
4. **Nigerian Banking Context**: Use specialized widgets for banking operations
5. **Cross-Platform Consistency**: Test components on both mobile and web platforms

---

## 🌐 **Production Deployment**

### **Cloud Infrastructure**
- **Provider**: Google Cloud Platform (GCP)
- **Server IP**: 34.59.143.25
- **SSL/TLS**: Let's Encrypt certificates (auto-renewing)
- **Process Manager**: PM2 with automated restart
- **Deployment Method**: Git-based (3-5 min deployments)

### **Production URLs**
- **HTTPS (FMFB)**: https://fmfb-34-59-143-25.nip.io
- **HTTPS (OrokiiPay)**: https://orokii-34-59-143-25.nip.io
- **Backend API**: Port 3001 (proxied via Nginx)
- **Frontend**: Served via Nginx on port 443

### **⚡ Fast Deployment Process**
```bash
# Single command deployment (3-5 minutes)
./simple-deploy.sh

# What it does:
# 1. Commits local changes (10 sec)
# 2. Pushes to GitHub (10 sec)
# 3. SSH to server, git pull (20 sec)
# 4. npm ci (90 sec)
# 5. Build server (60 sec)
# 6. Restart service (30 sec)
# 7. Health check (10 sec)
```

**Documentation**: See `FAST_DEPLOYMENT_GUIDE.md` for complete guide

---

## 🔧 **Environment Configuration**

### **Environment Files**
- **`.env`**: Default development configuration
- **`.env.fmfb`**: FMFB tenant-specific settings
- **`.env.saas`**: SaaS platform configuration
- **`.env.test`**: Testing environment

### **Key Environment Variables**
```bash
# Database
DATABASE_URL=postgresql://bisiadedokun:orokiipay_secure_banking_2024!@#@localhost:5432/bank_app_platform
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bank_app_platform
DB_USER=bisiadedokun
DB_PASSWORD=orokiipay_secure_banking_2024!@#

# NOTE: Using Homebrew PostgreSQL 14 (not PostgreSQL 17)
# The postgres user doesn't exist - use 'bisiadedokun' (Mac username) as superuser

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=your-refresh-token-secret

# Server Configuration  
NODE_ENV=development
PORT=3001
WEB_PORT=8080

# Multi-Tenant
DEFAULT_TENANT=fmfb
```

---

## ⚠️ **CRITICAL WORKING COMPONENTS**

### **✅ Currently Working (DO NOT MODIFY)**
1. **Database Integration**: Real data from FMFB tenant database
2. **API Endpoints**: All core routes functional (auth, wallets, transfers)  
3. **Frontend Components**: Dashboard, transaction history screens
4. **Multi-Tenant System**: Tenant detection and context switching
5. **JWT Authentication**: Token generation, validation, refresh
6. **🧪 COMPREHENSIVE TESTING FRAMEWORK**: 4-layer testing (Unit, Integration, UX, E2E) with automated quality gates, universal test helpers, and mandatory test requirements that prevent integration issues
7. **🎨 Complete Design System**: Enterprise-grade design system with 1700+ CSS classes, 7 banking widgets, multi-tenant theming, Nigerian compliance, and 3 interactive showcases

### **🔒 Security Components Required (CRITICAL GAPS)**
1. **Zero Trust Architecture**: Never trust, always verify implementation needed
2. **CBN Compliance**: Nigerian regulatory compliance framework missing
3. **PCI DSS Level 1**: Cardholder data protection standards required
4. **AI Fraud Detection**: Real-time fraud scoring and behavioral analysis needed  
5. **HSM Key Management**: Hardware security modules for encryption keys missing
6. **WAF Protection**: Web Application Firewall with OWASP protection required
7. **SIEM Integration**: Security monitoring and incident response needed

### **🔄 Recent Major Changes**
1. **Database Integration**: Removed hardcoded mock data, connected to real PostgreSQL
2. **TypeScript Fixes**: Resolved critical compilation errors in server routes
3. **Test Infrastructure**: Comprehensive test suite with backend/frontend separation
4. **Asset Management**: Base64 asset storage and serving system

---

## 🧪 **COMPREHENSIVE TESTING FRAMEWORK** (CRITICAL)

### **🎯 Framework Purpose**
**PREVENTS INTEGRATION ISSUES**: This testing framework was created after experiencing trial-and-error debugging with the transfer feature. It ensures that the remaining 80-85% of app development flows smoothly without frontend-backend integration issues.

### **🏗️ 4-Layer Testing Architecture**

```typescript
TestingFramework/
├── 1️⃣ Unit Tests (Existing)
│   ├── Component testing with React Native Testing Library
│   ├── API endpoint testing with supertest
│   └── Database operation testing
│
├── 2️⃣ Integration Tests (NEW - CRITICAL)
│   ├── Frontend-backend integration with real API responses
│   ├── API response structure validation 
│   ├── Property access error prevention (e.g., data.amount vs amount)
│   └── Form behavior with actual backend data
│
├── 3️⃣ UX Validation Tests (NEW - CRITICAL)
│   ├── User feedback requirement enforcement
│   ├── Form closure behavior validation
│   ├── Input preservation during auto-fill scenarios
│   ├── Alert dismissal callback verification
│   └── No console spam validation
│
└── 4️⃣ End-to-End Tests (NEW - CRITICAL)
    ├── Complete user workflow testing (Playwright)
    ├── Cross-browser compatibility testing
    ├── Real user interaction simulation
    └── Full system integration validation
```

### **🛡️ Quality Gates & Automation**

**Pre-Commit Hooks**: Automatic test execution before every commit
```bash
# Runs automatically on git commit
- ESLint validation
- Frontend tests for modified files
- Integration tests for modified files  
- UX validation tests for UI components
```

**Pre-Push Hooks**: Comprehensive validation before sharing code
```bash
# Runs automatically on git push
- Full frontend test suite
- Complete backend test suite
- All integration tests
- UX validation tests
- E2E tests (for main branches)
```

**CI/CD Pipeline**: Complete test automation in GitHub Actions
```yaml
# Automated testing on pull requests
- Database setup and seeding
- Backend API validation
- Frontend component testing
- Integration test execution
- UX validation checks
- E2E test execution with Playwright
- Test result artifact uploads
```

### **📋 Mandatory Test Requirements**

**Every new feature MUST include:**

1. **API Response Structure Test**
   ```typescript
   test('should handle real [FEATURE] API response structure', async () => {
     const mockResponse = { /* actual API response */ };
     APIResponseValidator.validateSuccessResponse(mockResponse, requiredFields);
     // Prevents property access errors
   });
   ```

2. **User Feedback Test**
   ```typescript
   test('should provide proper user feedback for [FEATURE]', async () => {
     // Execute feature action
     AlertTestHelper.expectSuccessAlert('Expected Title', 'Expected Message');
     // Ensures users always receive feedback
   });
   ```

3. **Form Behavior Test**
   ```typescript
   test('should preserve user input during [FEATURE] operations', async () => {
     UserInputValidator.validateInputPreservation(input, userValue, apiValue);
     // Prevents auto-fill overriding user input
   });
   ```

4. **Navigation Test**
   ```typescript
   test('should handle [FEATURE] navigation properly', async () => {
     NavigationValidator.validateNoAutoNavigation(mockNavigationFn);
     // Prevents forms closing without user acknowledgment
   });
   ```

### **🔧 Universal Test Utilities**

**Test Helpers** (`tests/utils/test-helpers.ts`):
- `AlertTestHelper`: Validates user feedback patterns
- `APIResponseValidator`: Ensures API response structure compatibility
- `UserInputValidator`: Prevents input preservation issues
- `NavigationValidator`: Validates proper navigation flows
- `FormValidator`: Tests form state management
- `APIMockGenerator`: Creates realistic mock responses

### **🚀 Development Workflow**

**For New Features:**
1. Write failing tests first (TDD approach)
2. Implement backend endpoint
3. Test endpoint with real responses (integration tests)
4. Implement frontend component  
5. Run UX validation tests
6. Implement E2E test for user journey
7. **All tests must pass before merging**

**For Bug Fixes:**
1. Write test that reproduces bug
2. Fix the bug
3. Verify test passes
4. Run full test suite for affected areas

### **📊 Test Coverage Requirements**

```typescript
// jest.config.js coverage thresholds
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80, 
    lines: 80,
    statements: 80,
  },
}
```

### **⚡ Quick Start**

**Install Framework:**
```bash
./scripts/setup-test-framework.sh
```

**Run Tests During Development:**
```bash
npm run test:watch         # Watch mode for active development
npm run test:feature       # Test only files related to your changes
npm run test:all          # Full comprehensive test suite
```

### **🎯 Framework Benefits**

1. **No More Trial-and-Error**: Issues caught at development time, not deployment
2. **Faster Development**: Immediate feedback on integration problems  
3. **Higher Quality**: UX validation ensures proper user experience
4. **Future-Proof**: Framework scales with any feature complexity
5. **Confidence**: Deploy knowing frontend-backend integration works
6. **Consistency**: Standardized testing patterns across all features

### **⚠️ CRITICAL: Framework Usage is MANDATORY**

**❌ DO NOT:**
- Skip integration tests for new features
- Ignore UX validation test failures
- Merge code without passing all test layers
- Create features without proper user feedback tests

**✅ ALWAYS:**
- Run `npm run test:feature` before committing
- Ensure all 4 test layers pass for new features
- Use test helpers for consistent validation
- Write tests that reproduce any reported bugs

---

## 🧪 **Legacy Testing Architecture** (Pre-Framework)

### **Multi-Project Jest Configuration**
- **Frontend Tests**: React Native component testing
- **Backend Tests**: API endpoint and database testing
- **Integration Tests**: Full system integration testing

### **Test Categories**
- **Unit Tests**: Individual function/component testing
- **API Tests**: HTTP endpoint testing with supertest
- **Database Tests**: Database operations and transactions
- **Integration Tests**: End-to-end workflow testing

---

## 🚨 **Common Pitfalls for New Agents**

### **❌ DO NOT**
1. **Recreate existing functionality** - Always check if features already exist
2. **Modify working database connections** - Database integration is functional  
3. **Change multi-tenant architecture** - Core tenant isolation is implemented
4. **Remove real data integration** - We moved away from hardcoded mock data
5. **Break existing API routes** - All routes are tested and working
6. **Skip the testing framework** - 4-layer testing is mandatory for all new features
7. **Ignore integration test failures** - These prevent frontend-backend issues
8. **Create features without UX validation** - User experience tests are required

### **✅ ALWAYS DO**
1. **Read this document first** - Understand the complete architecture
2. **Run comprehensive tests before changes** - Use `npm run test:feature` before committing
3. **Check existing implementations** - Avoid duplicate work
4. **Preserve multi-tenant context** - Maintain tenant isolation
5. **Validate against database schema** - Use real database structure
6. **Use the testing framework** - Follow 4-layer testing for all new features
7. **Write integration tests** - Test frontend-backend integration with real API responses
8. **Validate user experience** - Ensure proper feedback and form behavior

---

## 🛠️ **CRITICAL IMPLEMENTATION GUIDANCE**

### **🚨 Platform Administration Implementation**

**UNIFIED APPLICATION APPROACH - MANDATORY FOR ALL AGENTS/DEVELOPERS**

When implementing any platform administration or tenant management features:

#### **✅ DO THIS (Industry Best Practice):**
```typescript
// Enhance existing AuthContext with role-based access
interface AuthState {
  isAuthenticated: boolean;
  user: User;
  isPlatformAdmin: boolean;    // NEW: Platform admin flag
  tenantId: string | null;     // NULL for platform admins
  permissions: string[];       // Fine-grained permissions
  subdomain: string;           // admin vs tenant subdomain
}

// Dynamic UI rendering based on role
const DashboardScreen = () => {
  const { isPlatformAdmin, tenantId } = useAuth();

  if (isPlatformAdmin) {
    // Platform admin sees cross-tenant dashboard
    return <PlatformAdminDashboard />;
  }

  // Tenant users see bank-specific dashboard
  return <TenantBankingDashboard tenantId={tenantId} />;
};

// Subdomain-based access control
app.use('/api/v1/*', (req, res, next) => {
  const subdomain = req.hostname.split('.')[0];
  const isPlatformRequest = subdomain === 'admin';

  // Set context for platform vs tenant access
  req.platformAccess = isPlatformRequest;
  req.tenantId = isPlatformRequest ? null : getTenantIdFromSubdomain(subdomain);
  next();
});
```

#### **❌ NEVER DO THIS:**
- ❌ Create separate applications for platform admin
- ❌ Create separate databases for platform management
- ❌ Duplicate components or services for admin vs tenant
- ❌ Hardcode platform admin features in tenant interfaces

#### **🔐 Security Implementation Pattern:**
```typescript
// JWT token structure with role context
interface OrokiiPayJWT {
  sub: string;              // user_id
  role: string;             // 'platform_admin' | 'bank_admin' | 'bank_user'
  platform_admin: boolean; // Platform access flag
  tenant_id: string | null; // NULL for platform admins
  permissions: string[];    // ['manage_all_tenants', 'view_platform_analytics']
  subdomain: string;        // Requested access context
}

// Role-based middleware
const platformAdminRequired = (req, res, next) => {
  if (!req.user.platform_admin) {
    return res.status(403).json({ error: 'Platform admin access required' });
  }
  next();
};

// Context-aware database queries
const getTenants = async (userId, isPlatformAdmin, tenantId) => {
  if (isPlatformAdmin) {
    // Platform admin sees all tenants
    return await db.query('SELECT * FROM tenants');
  } else {
    // Tenant users see only their tenant
    return await db.query('SELECT * FROM tenants WHERE id = ?', [tenantId]);
  }
};
```

#### **📚 Required Reading for Implementation:**
- **`TENANT_MANAGEMENT_SAAS_UNIFIED.md`** - Complete architecture specification
- **`FRONTEND_UNIFIED_IMPLEMENTATION.md`** - Frontend implementation roadmap

#### **🎯 Implementation Priorities:**
1. **Week 1:** Enhance JWT authentication with role context and subdomain routing
2. **Week 2:** Add platform admin UI components within existing screens
3. **Week 3:** Implement cross-tenant dashboard and tenant management features
4. **Week 4:** Complete tenant onboarding workflow and billing management

#### **✅ Success Criteria:**
- [ ] Same application serves both `admin.orokiipay.com` and `{tenant}.orokiipay.com`
- [ ] JWT tokens contain role context and platform admin flags
- [ ] UI dynamically renders based on user role and subdomain
- [ ] Database queries automatically scope to tenant context
- [ ] Platform admins can manage all tenants, tenants only see their data

---

## 🎯 **Current Status**

### **Completed Features**
- ✅ Multi-tenant database architecture
- ✅ JWT authentication system
- ✅ Core API endpoints (auth, wallets, transfers)
- ✅ Frontend screens (dashboard, transactions, login)
- ✅ Database integration with real data
- ✅ Cross-platform support (mobile + web)
- ✅ 🧪 **COMPREHENSIVE TESTING FRAMEWORK**: 4-layer testing architecture (Unit, Integration, UX, E2E) with automated quality gates, universal test helpers, Git hooks, CI/CD pipeline, and mandatory test requirements that prevent integration issues
- ✅ 🎨 **Complete Design System**: Enterprise-grade UI system with 1700+ CSS classes, 7 Nigerian banking widgets, multi-tenant theming, and interactive showcases
- ✅ 🤖 **AI Intelligence System**: Conversational AI with real database integration, voice interface (push-to-talk + continuous), smart suggestions, analytics insights
- ✅ 🌐 **Cloud Deployment**: Production deployment on GCP (34.59.143.25) with SSL/TLS, PM2 process management
- ✅ ⚡ **Fast Deployment**: Git-based deployment (3-5 min vs 1-2 hours) with automated backups
- ✅ 🌍 **Phase 4: Global Deployment Enhancement** (October 2025):
  - **International Phone Validation**: libphonenumber-js integration with 9 countries (NG, US, GB, DE, FR, ES, ZA, KE, GH)
  - **Multi-Currency Support**: NGN, USD, CAD, GBP, EUR, ZAR with locale-specific formatting
  - **Multi-Language Translations**: Professional French, German, Spanish translations (27 files, 9 namespaces)
  - **Database Backups**: Complete backup suite (schema-only, full, data-only) with timestamp verification
  - **Testing Excellence**: 297 tests (100% pass rate) across phone validation, translations, and i18n config
  - **Production Ready**: All implementations validated and deployed to GitHub

### **Next Development Priorities**

#### **🚨 IMMEDIATE (Week 1-4): Platform Administration**
1. **Platform Admin System** - JWT context + subdomain routing for OrokiiPay team management
2. **Tenant Onboarding** - Automated bank onboarding and configuration workflow
3. **Cross-Tenant Analytics** - Platform-wide business intelligence and revenue tracking
4. **Billing Management** - Subscription and usage-based billing for multiple tenants

#### **📈 HIGH PRIORITY (Week 5-12): Revenue Generation**
1. **Transaction Reversal System** - CBN-compliant reversal management with AI pattern analysis
2. **NIBSS Production Integration** - Name Enquiry, Fund Transfer, Transaction Status Query
3. **Savings & Loans Platform** - 4 savings products, loan system with progressive limits
4. **Frontend Conversion** - Convert 19 HTML mockups to React Native screens

#### **🔧 MEDIUM PRIORITY (Week 13-20): Advanced Features**
1. **Credit Bureau Integration** - Real-time credit checks for loan eligibility
2. **Advanced Security** - 2FA, biometric authentication, enhanced fraud detection
3. **Bill Payments** - Integration with Nigerian biller networks
4. **Third-Party Integrations** - Paystack, investment platforms, insurance products

---

**📞 For Questions**: Reference this document first, then examine existing code implementations before creating new functionality.

---

*Last Updated: September 24, 2025*
*Version: 1.3 - Added Phase 2.5 Real Data Integration, Cloud Deployment, Fast Deployment Method*
*Created for: Claude Code Agent Continuity*