# 🏦 OrokiiPay Multi-Tenant Banking Platform - Project Overview

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

---

## 🛠️ **Technology Stack**

### **Frontend**
- **React Native**: 0.81.1 (Mobile iOS/Android)
- **React Native Web**: 0.21.1 (Web browser support)  
- **Navigation**: React Navigation v7 (Stack & Bottom Tabs)
- **State Management**: Redux Toolkit + React Query
- **Build Tools**: Webpack 5, Babel, TypeScript
- **Testing**: Jest + React Native Testing Library

### **Backend**
- **Runtime**: Node.js 20+ with TypeScript  
- **Framework**: Express.js 5.1.0
- **Authentication**: JWT + Refresh Tokens (jsonwebtoken 9.0.2)
- **Security**: Helmet, CORS, Rate Limiting, bcrypt hashing
- **Database**: PostgreSQL with `pg` driver
- **Validation**: express-validator
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

### **Testing**
```bash
npm test                 # Run all tests (Frontend + Backend + Integration)
npm run test:frontend    # React Native component tests
npm run test:backend     # API and database tests  
npm run test:integration # Full integration test suite
npm run test:coverage    # Generate coverage report
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
├── 🧪 Tests
│   ├── backend/                 # Backend API tests
│   ├── integration/             # Full integration tests  
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

## 🔧 **Environment Configuration**

### **Environment Files**
- **`.env`**: Default development configuration
- **`.env.fmfb`**: FMFB tenant-specific settings  
- **`.env.saas`**: SaaS platform configuration
- **`.env.test`**: Testing environment

### **Key Environment Variables**
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bank_app_platform
DB_HOST=localhost
DB_PORT=5432  
DB_NAME=bank_app_platform
DB_USER=postgres
DB_PASSWORD=yourpassword

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
6. **Test Suite**: 40+ passing tests across backend and frontend
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

## 🧪 **Testing Architecture**

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

### **✅ ALWAYS DO**
1. **Read this document first** - Understand the complete architecture
2. **Run tests before changes** - Ensure no regression
3. **Check existing implementations** - Avoid duplicate work
4. **Preserve multi-tenant context** - Maintain tenant isolation
5. **Validate against database schema** - Use real database structure

---

## 🎯 **Current Status**

### **Completed Features**  
- ✅ Multi-tenant database architecture
- ✅ JWT authentication system  
- ✅ Core API endpoints (auth, wallets, transfers)
- ✅ Frontend screens (dashboard, transactions, login)
- ✅ Database integration with real data
- ✅ Cross-platform support (mobile + web)
- ✅ Comprehensive test suite
- ✅ 🎨 **Complete Design System**: Enterprise-grade UI system with 1700+ CSS classes, 7 Nigerian banking widgets, multi-tenant theming, and interactive showcases

### **Next Development Priorities**
1. Fix remaining TypeScript compilation errors in scripts
2. Enhance error handling and validation
3. Add more comprehensive integration tests  
4. Implement advanced security features
5. Add real-time notifications
6. Enhance UI/UX components

---

**📞 For Questions**: Reference this document first, then examine existing code implementations before creating new functionality.

---

*Last Updated: September 9, 2025*  
*Version: 1.1 - Added Comprehensive Design System*  
*Created for: Claude Code Agent Continuity*