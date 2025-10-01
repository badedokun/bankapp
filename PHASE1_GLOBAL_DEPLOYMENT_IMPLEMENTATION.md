# Phase 1: Core Internationalization Implementation Plan
## Global Deployment Enhancement - Week 1-4

**Branch**: `feature/global-deployment-enhancement`
**Start Date**: September 30, 2025
**Duration**: 4 weeks (160 hours)
**Goal**: Enable multi-currency, multi-locale, multi-timezone support

---

## 📋 Overview

Phase 1 establishes the foundation for global deployment by implementing:
1. ✅ Multi-currency support (₦, $, €, £, CAD)
2. ✅ Internationalization (i18n) framework
3. ✅ Dynamic locale/timezone handling
4. ✅ Database schema updates for regional flexibility

**Success Criteria**:
- Platform can onboard tenants with any supported currency
- UI displays currency symbols dynamically based on tenant
- Date/time formats adapt to tenant locale
- i18n framework ready for translation additions
- No hardcoded currencies, locales, or timezones remain

---

## 🎯 Week 1: Database Schema & Currency Foundation

### Day 1-2: Database Schema Updates

#### Task 1.1: Create Migration File
**File**: `database/migrations/012_global_support_currency_locale.sql`

```sql
-- ============================================================
-- Migration 012: Global Deployment Support
-- Add currency, locale, timezone to platform.tenants
-- ============================================================

BEGIN;

-- Add new columns to platform.tenants
ALTER TABLE platform.tenants
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'NGN' CHECK (currency IN ('NGN', 'USD', 'EUR', 'GBP', 'CAD')),
  ADD COLUMN IF NOT EXISTS locale VARCHAR(10) DEFAULT 'en-NG' CHECK (locale ~ '^[a-z]{2}-[A-Z]{2}$'),
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Africa/Lagos',
  ADD COLUMN IF NOT EXISTS date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  ADD COLUMN IF NOT EXISTS number_format JSONB DEFAULT '{"decimal": ".", "thousands": ",", "precision": 2}'::jsonb;

-- Update existing FMFB tenant
UPDATE platform.tenants
SET
  currency = 'NGN',
  locale = 'en-NG',
  timezone = 'Africa/Lagos',
  date_format = 'DD/MM/YYYY'
WHERE name = 'fmfb';

-- Create index for currency lookups
CREATE INDEX IF NOT EXISTS idx_tenants_currency ON platform.tenants(currency);

-- Add comments
COMMENT ON COLUMN platform.tenants.currency IS 'ISO 4217 currency code (NGN, USD, EUR, GBP, CAD)';
COMMENT ON COLUMN platform.tenants.locale IS 'BCP 47 locale code (e.g., en-US, en-NG, fr-CA)';
COMMENT ON COLUMN platform.tenants.timezone IS 'IANA timezone identifier (e.g., America/New_York, Europe/London)';
COMMENT ON COLUMN platform.tenants.date_format IS 'Display format for dates (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)';
COMMENT ON COLUMN platform.tenants.number_format IS 'Number formatting configuration (decimal, thousands separator)';

-- Extend region CHECK constraint
ALTER TABLE platform.tenants
  DROP CONSTRAINT IF EXISTS tenants_region_check;

ALTER TABLE platform.tenants
  ADD CONSTRAINT tenants_region_check CHECK (region IN (
    -- Africa
    'africa-west', 'africa-east', 'africa-south', 'africa-north', 'africa-central',
    -- North America
    'north-america-east', 'north-america-west', 'north-america-central',
    -- Europe
    'europe-west', 'europe-central', 'europe-east', 'europe-north', 'europe-south',
    -- Asia Pacific
    'asia-pacific-east', 'asia-pacific-southeast', 'asia-pacific-south',
    -- Middle East
    'middle-east',
    -- South America
    'south-america-east', 'south-america-west',
    -- Legacy (for backward compatibility)
    'nigeria-west'
  ));

-- Update legacy region value
UPDATE platform.tenants
SET region = 'africa-west'
WHERE region = 'nigeria-west';

COMMIT;

-- Verification query
SELECT
  name,
  subdomain,
  currency,
  locale,
  timezone,
  date_format,
  region,
  created_at
FROM platform.tenants
ORDER BY created_at DESC;
```

**Estimated Time**: 4 hours

---

#### Task 1.2: Create Currency Configuration Table
**File**: `database/migrations/013_currency_configuration.sql`

```sql
-- ============================================================
-- Migration 013: Currency Configuration
-- Master currency configuration and exchange rates
-- ============================================================

BEGIN;

-- Create currency configuration table
CREATE TABLE IF NOT EXISTS platform.currency_config (
  code VARCHAR(3) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  symbol VARCHAR(5) NOT NULL,
  decimal_places SMALLINT DEFAULT 2,
  symbol_position VARCHAR(10) DEFAULT 'before' CHECK (symbol_position IN ('before', 'after')),
  enabled BOOLEAN DEFAULT true,
  countries JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert supported currencies
INSERT INTO platform.currency_config (code, name, symbol, decimal_places, symbol_position, countries) VALUES
  ('NGN', 'Nigerian Naira', '₦', 2, 'before', '["NG"]'::jsonb),
  ('USD', 'US Dollar', '$', 2, 'before', '["US"]'::jsonb),
  ('EUR', 'Euro', '€', 2, 'before', '["DE", "FR", "IT", "ES", "NL"]'::jsonb),
  ('GBP', 'British Pound', '£', 2, 'before', '["GB"]'::jsonb),
  ('CAD', 'Canadian Dollar', '$', 2, 'before', '["CA"]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- Create exchange rates table (for future FX conversion)
CREATE TABLE IF NOT EXISTS platform.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(3) NOT NULL REFERENCES platform.currency_config(code),
  to_currency VARCHAR(3) NOT NULL REFERENCES platform.currency_config(code),
  rate DECIMAL(20, 8) NOT NULL,
  source VARCHAR(50) DEFAULT 'manual',
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create unique index for currency pairs
CREATE UNIQUE INDEX IF NOT EXISTS idx_exchange_rates_pair
  ON platform.exchange_rates(from_currency, to_currency, valid_from);

-- Insert sample exchange rates (as of Sept 2025)
INSERT INTO platform.exchange_rates (from_currency, to_currency, rate, source) VALUES
  ('NGN', 'USD', 0.0013, 'manual'),
  ('USD', 'NGN', 769.00, 'manual'),
  ('NGN', 'EUR', 0.0012, 'manual'),
  ('EUR', 'NGN', 833.00, 'manual'),
  ('USD', 'EUR', 0.92, 'manual'),
  ('EUR', 'USD', 1.09, 'manual'),
  ('USD', 'GBP', 0.79, 'manual'),
  ('GBP', 'USD', 1.27, 'manual'),
  ('USD', 'CAD', 1.36, 'manual'),
  ('CAD', 'USD', 0.74, 'manual')
ON CONFLICT DO NOTHING;

-- Add comments
COMMENT ON TABLE platform.currency_config IS 'Master configuration for supported currencies';
COMMENT ON TABLE platform.exchange_rates IS 'Exchange rates for currency conversion';

COMMIT;

-- Verification
SELECT * FROM platform.currency_config ORDER BY code;
```

**Estimated Time**: 3 hours

---

### Day 3-4: TypeScript Utilities

#### Task 1.3: Currency Utility Functions
**File**: `src/utils/currency.ts`

```typescript
/**
 * Currency Utilities for Global Multi-Currency Support
 */

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  symbolPosition: 'before' | 'after';
  enabled: boolean;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  NGN: {
    code: 'NGN',
    name: 'Nigerian Naira',
    symbol: '₦',
    decimalPlaces: 2,
    symbolPosition: 'before',
    enabled: true,
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimalPlaces: 2,
    symbolPosition: 'before',
    enabled: true,
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimalPlaces: 2,
    symbolPosition: 'before',
    enabled: true,
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    decimalPlaces: 2,
    symbolPosition: 'before',
    enabled: true,
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: '$',
    decimalPlaces: 2,
    symbolPosition: 'before',
    enabled: true,
  },
};

/**
 * Get currency symbol from currency code
 */
export const getCurrencySymbol = (currencyCode: string): string => {
  return SUPPORTED_CURRENCIES[currencyCode]?.symbol || currencyCode;
};

/**
 * Format amount with currency symbol
 */
export const formatCurrency = (
  amount: number,
  currencyCode: string = 'NGN',
  options?: {
    showSymbol?: boolean;
    showCode?: boolean;
    locale?: string;
  }
): string => {
  const config = SUPPORTED_CURRENCIES[currencyCode];
  if (!config) {
    return amount.toFixed(2);
  }

  const { showSymbol = true, showCode = false, locale = 'en-US' } = options || {};

  // Format number with locale-specific formatting
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: config.decimalPlaces,
    maximumFractionDigits: config.decimalPlaces,
  }).format(amount);

  // Add currency symbol
  if (showSymbol) {
    return config.symbolPosition === 'before'
      ? `${config.symbol}${formatted}`
      : `${formatted}${config.symbol}`;
  }

  // Add currency code
  if (showCode) {
    return `${formatted} ${config.code}`;
  }

  return formatted;
};

/**
 * Parse currency string to number
 */
export const parseCurrency = (value: string, currencyCode: string = 'NGN'): number => {
  const config = SUPPORTED_CURRENCIES[currencyCode];
  if (!config) {
    return parseFloat(value) || 0;
  }

  // Remove currency symbol and non-numeric characters except decimal
  const cleaned = value
    .replace(config.symbol, '')
    .replace(/[^\d.-]/g, '')
    .trim();

  return parseFloat(cleaned) || 0;
};

/**
 * Validate currency code
 */
export const isValidCurrency = (currencyCode: string): boolean => {
  return currencyCode in SUPPORTED_CURRENCIES && SUPPORTED_CURRENCIES[currencyCode].enabled;
};

/**
 * Get all enabled currencies
 */
export const getEnabledCurrencies = (): CurrencyConfig[] => {
  return Object.values(SUPPORTED_CURRENCIES).filter(currency => currency.enabled);
};

/**
 * Format amount with thousand separators
 */
export const formatAmount = (
  amount: number | string,
  decimalPlaces: number = 2
): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return '0.00';
  }

  return numAmount.toFixed(decimalPlaces).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Convert amount between currencies
 * Note: Requires exchange rate from backend
 */
export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // TODO: Implement actual API call to get exchange rate
  // For now, return the amount as-is
  console.warn('Currency conversion not yet implemented');
  return amount;
};
```

**Estimated Time**: 4 hours

---

#### Task 1.4: Locale & Timezone Utilities
**File**: `src/utils/locale.ts`

```typescript
/**
 * Locale and Timezone Utilities for Global Support
 */

export interface LocaleConfig {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  timeFormat: string;
}

export const SUPPORTED_LOCALES: Record<string, LocaleConfig> = {
  'en-NG': {
    code: 'en-NG',
    name: 'English (Nigeria)',
    nativeName: 'English (Nigeria)',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
  },
  'en-US': {
    code: 'en-US',
    name: 'English (United States)',
    nativeName: 'English (US)',
    direction: 'ltr',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'hh:mm A',
  },
  'en-GB': {
    code: 'en-GB',
    name: 'English (United Kingdom)',
    nativeName: 'English (UK)',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
  },
  'en-CA': {
    code: 'en-CA',
    name: 'English (Canada)',
    nativeName: 'English (Canada)',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'hh:mm A',
  },
  'fr-CA': {
    code: 'fr-CA',
    name: 'French (Canada)',
    nativeName: 'Français (Canada)',
    direction: 'ltr',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm',
  },
  'de-DE': {
    code: 'de-DE',
    name: 'German (Germany)',
    nativeName: 'Deutsch',
    direction: 'ltr',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
  },
  'fr-FR': {
    code: 'fr-FR',
    name: 'French (France)',
    nativeName: 'Français',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
  },
};

/**
 * Format date according to locale
 */
export const formatDate = (
  date: Date | string,
  locale: string = 'en-NG',
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options,
  };

  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
};

/**
 * Format date and time according to locale
 */
export const formatDateTime = (
  date: Date | string,
  locale: string = 'en-NG',
  timezone?: string
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  };

  return new Intl.DateTimeFormat(locale, options).format(dateObj);
};

/**
 * Format time according to locale
 */
export const formatTime = (
  date: Date | string,
  locale: string = 'en-NG',
  timezone?: string
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  };

  return new Intl.DateTimeFormat(locale, options).format(dateObj);
};

/**
 * Convert date to specific timezone
 */
export const convertToTimezone = (
  date: Date | string,
  timezone: string = 'Africa/Lagos'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  return dateObj.toLocaleString('en-US', { timeZone: timezone });
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (
  date: Date | string,
  locale: string = 'en-US'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(dateObj, locale);
  }
};

/**
 * Validate locale code
 */
export const isValidLocale = (locale: string): boolean => {
  return locale in SUPPORTED_LOCALES;
};

/**
 * Get locale configuration
 */
export const getLocaleConfig = (locale: string): LocaleConfig | null => {
  return SUPPORTED_LOCALES[locale] || null;
};
```

**Estimated Time**: 4 hours

---

### Day 5: Update Tenant Theme Context

#### Task 1.5: Extend TenantThemeContext
**File**: `src/context/TenantThemeContext.tsx` (update existing)

```typescript
// Add to existing interface
export interface TenantTheme {
  // ... existing fields

  // NEW: Global support fields
  currency: string;
  locale: string;
  timezone: string;
  dateFormat: string;
  numberFormat: {
    decimal: string;
    thousands: string;
    precision: number;
  };
}

// Update loadTenantTheme function to fetch new fields from database
```

**Estimated Time**: 3 hours

---

## 📊 Week 1 Summary

**Total Time**: ~22 hours
**Deliverables**:
- ✅ Database migrations for currency/locale/timezone
- ✅ Currency configuration table
- ✅ TypeScript utility functions
- ✅ Updated TenantThemeContext

**Testing Checklist**:
- [ ] Run database migrations successfully
- [ ] Verify currency_config table populated
- [ ] Test formatCurrency() with all currencies
- [ ] Test formatDate() with all locales
- [ ] Verify TenantThemeContext returns new fields

---

## 🌐 Week 2: i18n Framework & Translation Infrastructure

### Day 1-2: Install & Configure i18next

#### Task 2.1: Install Dependencies
```bash
npm install react-i18next i18next i18next-http-backend i18next-browser-languagedetector
npm install --save-dev @types/react-i18next
```

#### Task 2.2: Create i18n Configuration
**File**: `src/i18n/config.ts`

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false,
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    ns: ['common', 'auth', 'dashboard', 'transfers', 'errors'],
    defaultNS: 'common',
  });

export default i18n;
```

**Estimated Time**: 4 hours

---

### Day 3-5: Create Translation Files

#### Task 2.3: Create Translation Structure
**Directory**: `public/locales/`

```
public/locales/
├── en/
│   ├── common.json
│   ├── auth.json
│   ├── dashboard.json
│   ├── transfers.json
│   └── errors.json
├── fr/
│   └── (same structure)
└── de/
    └── (same structure)
```

**File**: `public/locales/en/common.json`

```json
{
  "app": {
    "name": "OrokiiPay",
    "tagline": "Empowering African Banking"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "transfers": "Transfers",
    "transactions": "Transactions",
    "savings": "Savings",
    "loans": "Loans",
    "settings": "Settings"
  },
  "actions": {
    "submit": "Submit",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "back": "Back",
    "next": "Next",
    "confirm": "Confirm"
  },
  "status": {
    "success": "Success",
    "error": "Error",
    "pending": "Pending",
    "completed": "Completed",
    "failed": "Failed"
  }
}
```

**Estimated Time**: 12 hours for all translation files

---

## 🔄 Week 3: Component Updates

### Task 3.1: Update Currency Components

**Files to Update**:
1. `src/components/transfers/CompleteTransferFlow.tsx`
2. `MODERN_UI_DESIGN_SYSTEM.md` (ModernAmountInput)
3. All components using `₦` hardcoded

**Pattern**:
```typescript
import { useTenantTheme } from '@/context/TenantThemeContext';
import { formatCurrency, getCurrencySymbol } from '@/utils/currency';

const Component = () => {
  const { theme } = useTenantTheme();
  const currencySymbol = getCurrencySymbol(theme.currency);

  // Use formatCurrency() instead of hardcoded
  const formatted = formatCurrency(amount, theme.currency);
};
```

**Estimated Time**: 20 hours

---

### Task 3.2: Update Date Formatting

**Files**: All files using `toLocaleDateString('en-NG')`

**Pattern**:
```typescript
import { formatDate, formatDateTime } from '@/utils/locale';
import { useTenantTheme } from '@/context/TenantThemeContext';

const Component = () => {
  const { theme } = useTenantTheme();

  // Use dynamic locale
  const formatted = formatDate(date, theme.locale, theme.timezone);
};
```

**Estimated Time**: 16 hours

---

## 🧪 Week 4: Testing & Documentation

### Task 4.1: Create Test Tenants

```sql
-- US tenant (Dollar)
INSERT INTO platform.tenants (name, subdomain, currency, locale, timezone, region)
VALUES ('us-bank', 'usbank', 'USD', 'en-US', 'America/New_York', 'north-america-east');

-- Canada tenant (Canadian Dollar)
INSERT INTO platform.tenants (name, subdomain, currency, locale, timezone, region)
VALUES ('ca-bank', 'cabank', 'CAD', 'en-CA', 'America/Toronto', 'north-america-east');

-- Europe tenant (Euro)
INSERT INTO platform.tenants (name, subdomain, currency, locale, timezone, region)
VALUES ('eu-bank', 'eubank', 'EUR', 'de-DE', 'Europe/Berlin', 'europe-central');
```

**Estimated Time**: 8 hours for testing

---

### Task 4.2: Documentation

**File**: `PHASE1_IMPLEMENTATION_COMPLETE.md`

Document all changes, migration steps, testing results.

**Estimated Time**: 8 hours

---

## 📈 Phase 1 Completion Checklist

- [ ] Database migrations executed successfully
- [ ] Currency utility functions working
- [ ] Locale utility functions working
- [ ] i18n framework configured
- [ ] Translation files created (English minimum)
- [ ] TenantThemeContext updated
- [ ] All currency references use dynamic values
- [ ] All date formatting uses dynamic locale
- [ ] Test tenants created (NGN, USD, EUR, CAD)
- [ ] Documentation completed
- [ ] All tests passing
- [ ] Code reviewed and committed

---

## 🎯 Success Metrics

After Phase 1:
1. ✅ 0 hardcoded currency symbols in codebase
2. ✅ 0 hardcoded locale strings
3. ✅ 4+ test tenants with different currencies
4. ✅ i18n framework ready for new languages
5. ✅ All date/currency displays dynamic

**Timeline**: 4 weeks
**Budget**: 160 hours
**Status**: 🟡 In Progress

---

**Next Phase**: Phase 2 - Payment Gateway Abstraction (ACH, SEPA, Interac)
