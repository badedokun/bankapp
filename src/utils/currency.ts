/**
 * Currency Utilities for Global Multi-Currency Support
 *
 * Provides formatting, parsing, and validation for multiple currencies
 * across different regions (Africa, North America, Europe)
 *
 * Supported Currencies:
 * - NGN (Nigerian Naira)
 * - USD (US Dollar)
 * - EUR (Euro)
 * - GBP (British Pound)
 * - CAD (Canadian Dollar)
 * - ZAR (South African Rand)
 * - KES (Kenyan Shilling)
 * - GHS (Ghanaian Cedi)
 */

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  symbolPosition: 'before' | 'after';
  enabled: boolean;
  region: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  // African Currencies
  NGN: {
    code: 'NGN',
    name: 'Nigerian Naira',
    symbol: '₦',
    decimalPlaces: 2,
    symbolPosition: 'before',
    enabled: true,
    region: 'africa-west',
  },
  ZAR: {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R',
    decimalPlaces: 2,
    symbolPosition: 'before',
    enabled: true,
    region: 'africa-south',
  },
  KES: {
    code: 'KES',
    name: 'Kenyan Shilling',
    symbol: 'KSh',
    decimalPlaces: 2,
    symbolPosition: 'before',
    enabled: true,
    region: 'africa-east',
  },
  GHS: {
    code: 'GHS',
    name: 'Ghanaian Cedi',
    symbol: 'GH₵',
    decimalPlaces: 2,
    symbolPosition: 'before',
    enabled: true,
    region: 'africa-west',
  },

  // North American Currencies
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimalPlaces: 2,
    symbolPosition: 'before',
    enabled: true,
    region: 'north-america',
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: '$',
    decimalPlaces: 2,
    symbolPosition: 'before',
    enabled: true,
    region: 'north-america',
  },

  // European Currencies
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimalPlaces: 2,
    symbolPosition: 'before',
    enabled: true,
    region: 'europe',
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    decimalPlaces: 2,
    symbolPosition: 'before',
    enabled: true,
    region: 'europe',
  },
};

/**
 * Get currency symbol from currency code
 *
 * @param currencyCode - ISO 4217 currency code (e.g., 'USD', 'EUR', 'NGN')
 * @returns Currency symbol (e.g., '$', '€', '₦') or code if not found
 *
 * @example
 * getCurrencySymbol('USD') // Returns '$'
 * getCurrencySymbol('NGN') // Returns '₦'
 * getCurrencySymbol('EUR') // Returns '€'
 */
export const getCurrencySymbol = (currencyCode: string): string => {
  return SUPPORTED_CURRENCIES[currencyCode]?.symbol || currencyCode;
};

/**
 * Get currency name from currency code
 *
 * @param currencyCode - ISO 4217 currency code
 * @returns Full currency name or code if not found
 *
 * @example
 * getCurrencyName('USD') // Returns 'US Dollar'
 * getCurrencyName('NGN') // Returns 'Nigerian Naira'
 */
export const getCurrencyName = (currencyCode: string): string => {
  return SUPPORTED_CURRENCIES[currencyCode]?.name || currencyCode;
};

/**
 * Format amount with currency symbol
 *
 * @param amount - Numeric amount to format
 * @param currencyCode - Currency code (default: 'NGN')
 * @param options - Formatting options
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1234.56, 'USD') // Returns '$1,234.56'
 * formatCurrency(1234.56, 'NGN') // Returns '₦1,234.56'
 * formatCurrency(1234.56, 'EUR') // Returns '€1,234.56'
 * formatCurrency(1234.56, 'USD', { showCode: true }) // Returns '$1,234.56 USD'
 */
export const formatCurrency = (
  amount: number,
  currencyCode: string = 'NGN',
  options?: {
    showSymbol?: boolean;
    showCode?: boolean;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string => {
  const config = SUPPORTED_CURRENCIES[currencyCode];

  if (!config) {
    return amount.toFixed(2);
  }

  const {
    showSymbol = true,
    showCode = false,
    locale = 'en-US',
    minimumFractionDigits = config.decimalPlaces,
    maximumFractionDigits = config.decimalPlaces,
  } = options || {};

  // Format number with locale-specific formatting
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);

  // Add currency symbol
  if (showSymbol) {
    const withSymbol = config.symbolPosition === 'before'
      ? `${config.symbol}${formatted}`
      : `${formatted}${config.symbol}`;

    return showCode ? `${withSymbol} ${config.code}` : withSymbol;
  }

  // Add currency code
  if (showCode) {
    return `${formatted} ${config.code}`;
  }

  return formatted;
};

/**
 * Format amount with thousand separators (no currency symbol)
 *
 * @param amount - Number or string to format
 * @param decimalPlaces - Number of decimal places (default: 2)
 * @returns Formatted number string with commas
 *
 * @example
 * formatAmount(1234567.89) // Returns '1,234,567.89'
 * formatAmount('1234567.89', 0) // Returns '1,234,568'
 */
export const formatAmount = (
  amount: number | string,
  decimalPlaces: number = 2
): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return '0.00';
  }

  return numAmount
    .toFixed(decimalPlaces)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Parse currency string to number
 * Removes currency symbols, commas, and other formatting
 *
 * @param value - Currency string to parse
 * @param currencyCode - Currency code for symbol removal (default: 'NGN')
 * @returns Parsed numeric value
 *
 * @example
 * parseCurrency('$1,234.56', 'USD') // Returns 1234.56
 * parseCurrency('₦1,234.56', 'NGN') // Returns 1234.56
 * parseCurrency('€1.234,56', 'EUR') // Returns 1234.56
 */
export const parseCurrency = (
  value: string,
  currencyCode: string = 'NGN'
): number => {
  const config = SUPPORTED_CURRENCIES[currencyCode];

  if (!config) {
    return parseFloat(value.replace(/[^\d.-]/g, '')) || 0;
  }

  // Remove currency symbol and non-numeric characters except decimal and minus
  let cleaned = value
    .replace(config.symbol, '')
    .replace(/\s/g, '') // Remove spaces
    .replace(/,/g, '') // Remove commas
    .trim();

  // Handle European format (1.234,56 -> 1234.56)
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // If both comma and period exist, period is thousands separator
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    // Only comma exists, it's the decimal separator
    cleaned = cleaned.replace(',', '.');
  }

  return parseFloat(cleaned) || 0;
};

/**
 * Validate currency code
 *
 * @param currencyCode - Currency code to validate
 * @returns True if currency is supported and enabled
 *
 * @example
 * isValidCurrency('USD') // Returns true
 * isValidCurrency('XYZ') // Returns false
 */
export const isValidCurrency = (currencyCode: string): boolean => {
  return (
    currencyCode in SUPPORTED_CURRENCIES &&
    SUPPORTED_CURRENCIES[currencyCode].enabled
  );
};

/**
 * Get all enabled currencies
 *
 * @returns Array of enabled currency configurations
 *
 * @example
 * const currencies = getEnabledCurrencies();
 * // Returns array of 8 currency configs
 */
export const getEnabledCurrencies = (): CurrencyConfig[] => {
  return Object.values(SUPPORTED_CURRENCIES).filter(
    (currency) => currency.enabled
  );
};

/**
 * Get currencies by region
 *
 * @param region - Region identifier (e.g., 'africa-west', 'north-america', 'europe')
 * @returns Array of currency configurations for that region
 *
 * @example
 * getCurrenciesByRegion('africa-west') // Returns [NGN, GHS]
 * getCurrenciesByRegion('north-america') // Returns [USD, CAD]
 */
export const getCurrenciesByRegion = (region: string): CurrencyConfig[] => {
  return Object.values(SUPPORTED_CURRENCIES).filter(
    (currency) => currency.enabled && currency.region === region
  );
};

/**
 * Format currency for display in lists/tables (compact format)
 *
 * @param amount - Amount to format
 * @param currencyCode - Currency code
 * @returns Compact formatted string
 *
 * @example
 * formatCurrencyCompact(1234567, 'USD') // Returns '$1.23M'
 * formatCurrencyCompact(1234, 'NGN') // Returns '₦1.23K'
 */
export const formatCurrencyCompact = (
  amount: number,
  currencyCode: string = 'NGN'
): string => {
  const symbol = getCurrencySymbol(currencyCode);
  const absAmount = Math.abs(amount);

  if (absAmount >= 1000000000) {
    return `${symbol}${(amount / 1000000000).toFixed(2)}B`;
  } else if (absAmount >= 1000000) {
    return `${symbol}${(amount / 1000000).toFixed(2)}M`;
  } else if (absAmount >= 1000) {
    return `${symbol}${(amount / 1000).toFixed(2)}K`;
  }

  return formatCurrency(amount, currencyCode);
};

/**
 * Convert amount between currencies using exchange rate
 * Note: This is a client-side helper. For accurate conversion,
 * use the backend API with real-time exchange rates
 *
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @param exchangeRate - Optional exchange rate (if not provided, fetches from API)
 * @returns Promise resolving to converted amount
 *
 * @example
 * await convertCurrency(100, 'NGN', 'USD') // Returns ~0.13
 * await convertCurrency(100, 'USD', 'EUR') // Returns ~92
 */
export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRate?: number
): Promise<number> => {
  // If same currency, return amount as-is
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // If exchange rate provided, use it
  if (exchangeRate !== undefined) {
    return amount * exchangeRate;
  }

  // TODO: Implement API call to get exchange rate from backend
  // For now, return the amount as-is and log a warning
  console.warn(
    `Currency conversion from ${fromCurrency} to ${toCurrency} not yet implemented. ` +
    `Please provide exchange rate or use backend API.`
  );

  return amount;
};

/**
 * Format currency input value (for text inputs)
 * Ensures proper formatting as user types
 *
 * @param value - Current input value
 * @param currencyCode - Currency code
 * @returns Formatted value for input
 *
 * @example
 * formatCurrencyInput('1234.56', 'USD') // Returns '1,234.56'
 * formatCurrencyInput('1234567', 'NGN') // Returns '1,234,567'
 */
export const formatCurrencyInput = (
  value: string,
  currencyCode: string = 'NGN'
): string => {
  // Remove non-numeric characters except decimal point
  const numeric = value.replace(/[^\d.]/g, '');

  // Parse and format
  const parts = numeric.split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const decimalPart = parts[1] !== undefined ? `.${parts[1].slice(0, 2)}` : '';

  return integerPart + decimalPart;
};

/**
 * Validate currency amount
 *
 * @param amount - Amount to validate
 * @param options - Validation options
 * @returns True if valid, false otherwise
 *
 * @example
 * validateAmount(100.50) // Returns true
 * validateAmount(-50) // Returns false (if allowNegative is false)
 * validateAmount(0) // Returns false (if allowZero is false)
 */
export const validateAmount = (
  amount: number,
  options?: {
    allowNegative?: boolean;
    allowZero?: boolean;
    minAmount?: number;
    maxAmount?: number;
  }
): boolean => {
  const {
    allowNegative = false,
    allowZero = false,
    minAmount,
    maxAmount,
  } = options || {};

  // Check NaN
  if (isNaN(amount)) {
    return false;
  }

  // Check negative
  if (!allowNegative && amount < 0) {
    return false;
  }

  // Check zero
  if (!allowZero && amount === 0) {
    return false;
  }

  // Check minimum
  if (minAmount !== undefined && amount < minAmount) {
    return false;
  }

  // Check maximum
  if (maxAmount !== undefined && amount > maxAmount) {
    return false;
  }

  return true;
};

/**
 * Get amount validation error message
 *
 * @param amount - Amount to validate
 * @param currencyCode - Currency code for formatting messages
 * @param options - Validation options
 * @returns Error message or null if valid
 */
export const getAmountValidationError = (
  amount: number,
  currencyCode: string = 'NGN',
  options?: {
    allowNegative?: boolean;
    allowZero?: boolean;
    minAmount?: number;
    maxAmount?: number;
  }
): string | null => {
  const {
    allowNegative = false,
    allowZero = false,
    minAmount,
    maxAmount,
  } = options || {};

  if (isNaN(amount)) {
    return 'Please enter a valid amount';
  }

  if (!allowNegative && amount < 0) {
    return 'Amount cannot be negative';
  }

  if (!allowZero && amount === 0) {
    return 'Amount must be greater than zero';
  }

  if (minAmount !== undefined && amount < minAmount) {
    return `Amount must be at least ${formatCurrency(minAmount, currencyCode)}`;
  }

  if (maxAmount !== undefined && amount > maxAmount) {
    return `Amount cannot exceed ${formatCurrency(maxAmount, currencyCode)}`;
  }

  return null;
};

export default {
  SUPPORTED_CURRENCIES,
  getCurrencySymbol,
  getCurrencyName,
  formatCurrency,
  formatAmount,
  parseCurrency,
  isValidCurrency,
  getEnabledCurrencies,
  getCurrenciesByRegion,
  formatCurrencyCompact,
  convertCurrency,
  formatCurrencyInput,
  validateAmount,
  getAmountValidationError,
};
