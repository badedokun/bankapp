/**
 * Locale and Timezone Utilities for Global Support
 *
 * Provides formatting for dates, times, and numbers across different
 * locales and timezones for global multi-region deployment
 *
 * Supported Locales:
 * - en-NG (English - Nigeria)
 * - en-US (English - United States)
 * - en-GB (English - United Kingdom)
 * - en-CA (English - Canada)
 * - fr-CA (French - Canada)
 * - de-DE (German - Germany)
 * - fr-FR (French - France)
 */

export interface LocaleConfig {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  timeFormat: string;
  firstDayOfWeek: number; // 0 = Sunday, 1 = Monday
}

export const SUPPORTED_LOCALES: Record<string, LocaleConfig> = {
  // English Locales
  'en-NG': {
    code: 'en-NG',
    name: 'English (Nigeria)',
    nativeName: 'English (Nigeria)',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 1, // Monday
  },
  'en-US': {
    code: 'en-US',
    name: 'English (United States)',
    nativeName: 'English (US)',
    direction: 'ltr',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'hh:mm A',
    firstDayOfWeek: 0, // Sunday
  },
  'en-GB': {
    code: 'en-GB',
    name: 'English (United Kingdom)',
    nativeName: 'English (UK)',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 1, // Monday
  },
  'en-CA': {
    code: 'en-CA',
    name: 'English (Canada)',
    nativeName: 'English (Canada)',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'hh:mm A',
    firstDayOfWeek: 0, // Sunday
  },
  'en-ZA': {
    code: 'en-ZA',
    name: 'English (South Africa)',
    nativeName: 'English (South Africa)',
    direction: 'ltr',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 1, // Monday
  },

  // French Locales
  'fr-CA': {
    code: 'fr-CA',
    name: 'French (Canada)',
    nativeName: 'Français (Canada)',
    direction: 'ltr',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 0, // Sunday
  },
  'fr-FR': {
    code: 'fr-FR',
    name: 'French (France)',
    nativeName: 'Français',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 1, // Monday
  },

  // German Locale
  'de-DE': {
    code: 'de-DE',
    name: 'German (Germany)',
    nativeName: 'Deutsch',
    direction: 'ltr',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 1, // Monday
  },
};

/**
 * Format date according to locale
 *
 * @param date - Date object or ISO string
 * @param locale - BCP 47 locale code (default: 'en-NG')
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date('2025-09-30'), 'en-US') // Returns '09/30/2025'
 * formatDate(new Date('2025-09-30'), 'en-GB') // Returns '30/09/2025'
 * formatDate(new Date('2025-09-30'), 'de-DE') // Returns '30.09.2025'
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
 *
 * @param date - Date object or ISO string
 * @param locale - BCP 47 locale code (default: 'en-NG')
 * @param timezone - IANA timezone (e.g., 'America/New_York')
 * @returns Formatted date and time string
 *
 * @example
 * formatDateTime(new Date(), 'en-US', 'America/New_York')
 * // Returns '09/30/2025, 3:45 PM'
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
 *
 * @param date - Date object or ISO string
 * @param locale - BCP 47 locale code (default: 'en-NG')
 * @param timezone - IANA timezone
 * @returns Formatted time string
 *
 * @example
 * formatTime(new Date(), 'en-US') // Returns '3:45 PM'
 * formatTime(new Date(), 'en-GB') // Returns '15:45'
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
 * Format date with month name (long format)
 *
 * @param date - Date object or ISO string
 * @param locale - BCP 47 locale code
 * @returns Formatted date with month name
 *
 * @example
 * formatDateLong(new Date('2025-09-30'), 'en-US')
 * // Returns 'September 30, 2025'
 * formatDateLong(new Date('2025-09-30'), 'fr-FR')
 * // Returns '30 septembre 2025'
 */
export const formatDateLong = (
  date: Date | string,
  locale: string = 'en-NG'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return new Intl.DateTimeFormat(locale, options).format(dateObj);
};

/**
 * Format date with short month name
 *
 * @param date - Date object or ISO string
 * @param locale - BCP 47 locale code
 * @returns Formatted date with abbreviated month
 *
 * @example
 * formatDateShort(new Date('2025-09-30'), 'en-US')
 * // Returns 'Sep 30, 2025'
 */
export const formatDateShort = (
  date: Date | string,
  locale: string = 'en-NG'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  return new Intl.DateTimeFormat(locale, options).format(dateObj);
};

/**
 * Convert date to specific timezone
 *
 * @param date - Date object or ISO string
 * @param timezone - IANA timezone identifier (default: 'Africa/Lagos')
 * @param locale - Locale for formatting
 * @returns Date string in target timezone
 *
 * @example
 * convertToTimezone(new Date(), 'America/New_York', 'en-US')
 * convertToTimezone(new Date(), 'Europe/London', 'en-GB')
 */
export const convertToTimezone = (
  date: Date | string,
  timezone: string = 'Africa/Lagos',
  locale: string = 'en-US'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  return dateObj.toLocaleString(locale, { timeZone: timezone });
};

/**
 * Get relative time (e.g., "2 hours ago", "in 3 days")
 *
 * @param date - Date object or ISO string
 * @param locale - BCP 47 locale code
 * @param baseDate - Base date for comparison (default: now)
 * @returns Relative time string
 *
 * @example
 * getRelativeTime(new Date(Date.now() - 3600000), 'en-US')
 * // Returns '1 hour ago'
 * getRelativeTime(new Date(Date.now() + 86400000), 'en-US')
 * // Returns 'in 1 day'
 */
export const getRelativeTime = (
  date: Date | string,
  locale: string = 'en-US',
  baseDate: Date = new Date()
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const diffMs = baseDate.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(Math.abs(diffMs) / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  const isPast = diffMs > 0;

  if (diffSeconds < 30) {
    return 'just now';
  } else if (diffSeconds < 60) {
    return isPast ? 'a moment ago' : 'in a moment';
  } else if (diffMinutes === 1) {
    return isPast ? '1 minute ago' : 'in 1 minute';
  } else if (diffMinutes < 60) {
    return isPast
      ? `${diffMinutes} minutes ago`
      : `in ${diffMinutes} minutes`;
  } else if (diffHours === 1) {
    return isPast ? '1 hour ago' : 'in 1 hour';
  } else if (diffHours < 24) {
    return isPast ? `${diffHours} hours ago` : `in ${diffHours} hours`;
  } else if (diffDays === 1) {
    return isPast ? 'yesterday' : 'tomorrow';
  } else if (diffDays < 7) {
    return isPast ? `${diffDays} days ago` : `in ${diffDays} days`;
  } else if (diffWeeks < 4) {
    return isPast
      ? `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`
      : `in ${diffWeeks} week${diffWeeks > 1 ? 's' : ''}`;
  } else if (diffMonths < 12) {
    return isPast
      ? `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
      : `in ${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
  } else {
    return isPast
      ? `${diffYears} year${diffYears > 1 ? 's' : ''} ago`
      : `in ${diffYears} year${diffYears > 1 ? 's' : ''}`;
  }
};

/**
 * Validate locale code format
 *
 * @param locale - Locale code to validate
 * @returns True if valid BCP 47 format
 *
 * @example
 * isValidLocale('en-US') // Returns true
 * isValidLocale('en_US') // Returns false
 * isValidLocale('invalid') // Returns false
 */
export const isValidLocale = (locale: string): boolean => {
  // BCP 47 format: language-COUNTRY
  const localeRegex = /^[a-z]{2}-[A-Z]{2}$/;
  return localeRegex.test(locale) && locale in SUPPORTED_LOCALES;
};

/**
 * Get locale configuration
 *
 * @param locale - Locale code
 * @returns Locale configuration or null if not found
 *
 * @example
 * const config = getLocaleConfig('en-US');
 */
export const getLocaleConfig = (locale: string): LocaleConfig | null => {
  return SUPPORTED_LOCALES[locale] || null;
};

/**
 * Get all supported locales
 *
 * @returns Array of all locale configurations
 */
export const getSupportedLocales = (): LocaleConfig[] => {
  return Object.values(SUPPORTED_LOCALES);
};

/**
 * Get day name in locale
 *
 * @param dayIndex - Day index (0 = Sunday, 6 = Saturday)
 * @param locale - Locale code
 * @param format - 'long' or 'short'
 * @returns Localized day name
 *
 * @example
 * getDayName(0, 'en-US', 'long') // Returns 'Sunday'
 * getDayName(0, 'fr-FR', 'long') // Returns 'dimanche'
 */
export const getDayName = (
  dayIndex: number,
  locale: string = 'en-US',
  format: 'long' | 'short' = 'long'
): string => {
  // Create a date for a known Sunday (2025-01-05)
  const date = new Date(2025, 0, 5 + dayIndex);
  const options: Intl.DateTimeFormatOptions = {
    weekday: format,
  };

  return new Intl.DateTimeFormat(locale, options).format(date);
};

/**
 * Get month name in locale
 *
 * @param monthIndex - Month index (0 = January, 11 = December)
 * @param locale - Locale code
 * @param format - 'long' or 'short'
 * @returns Localized month name
 *
 * @example
 * getMonthName(0, 'en-US', 'long') // Returns 'January'
 * getMonthName(0, 'fr-FR', 'long') // Returns 'janvier'
 */
export const getMonthName = (
  monthIndex: number,
  locale: string = 'en-US',
  format: 'long' | 'short' = 'long'
): string => {
  const date = new Date(2025, monthIndex, 1);
  const options: Intl.DateTimeFormatOptions = {
    month: format,
  };

  return new Intl.DateTimeFormat(locale, options).format(date);
};

/**
 * Format number according to locale
 *
 * @param number - Number to format
 * @param locale - Locale code
 * @param options - Number format options
 * @returns Formatted number string
 *
 * @example
 * formatNumber(1234.56, 'en-US') // Returns '1,234.56'
 * formatNumber(1234.56, 'de-DE') // Returns '1.234,56'
 */
export const formatNumber = (
  number: number,
  locale: string = 'en-US',
  options?: Intl.NumberFormatOptions
): string => {
  return new Intl.NumberFormat(locale, options).format(number);
};

/**
 * Parse date string according to locale format
 *
 * @param dateString - Date string to parse
 * @param locale - Locale code for format interpretation
 * @returns Date object or null if invalid
 *
 * @example
 * parseDate('09/30/2025', 'en-US') // Interprets as September 30, 2025
 * parseDate('30/09/2025', 'en-GB') // Interprets as September 30, 2025
 */
export const parseDate = (
  dateString: string,
  locale: string = 'en-US'
): Date | null => {
  const config = getLocaleConfig(locale);

  if (!config) {
    return null;
  }

  // Try to parse based on locale date format
  const parts = dateString.split(/[\/.-]/);

  if (parts.length !== 3) {
    return null;
  }

  let year: number, month: number, day: number;

  const format = config.dateFormat;

  if (format.startsWith('DD')) {
    // DD/MM/YYYY or DD.MM.YYYY
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    year = parseInt(parts[2], 10);
  } else if (format.startsWith('MM')) {
    // MM/DD/YYYY
    month = parseInt(parts[0], 10) - 1;
    day = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
  } else if (format.startsWith('YYYY')) {
    // YYYY-MM-DD or YYYY/MM/DD
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    day = parseInt(parts[2], 10);
  } else {
    return null;
  }

  const date = new Date(year, month, day);

  // Validate the date is real
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

/**
 * Get timezone offset string
 *
 * @param timezone - IANA timezone identifier
 * @param date - Date for which to get offset (default: now)
 * @returns Offset string (e.g., '+01:00', '-05:00')
 *
 * @example
 * getTimezoneOffset('America/New_York') // Returns '-05:00' (EDT)
 * getTimezoneOffset('Europe/London') // Returns '+00:00' or '+01:00' (BST)
 */
export const getTimezoneOffset = (
  timezone: string,
  date: Date = new Date()
): string => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'longOffset',
  });

  const parts = formatter.formatToParts(date);
  const offsetPart = parts.find((part) => part.type === 'timeZoneName');

  return offsetPart?.value.replace('GMT', '') || '+00:00';
};

export default {
  SUPPORTED_LOCALES,
  formatDate,
  formatDateTime,
  formatTime,
  formatDateLong,
  formatDateShort,
  convertToTimezone,
  getRelativeTime,
  isValidLocale,
  getLocaleConfig,
  getSupportedLocales,
  getDayName,
  getMonthName,
  formatNumber,
  parseDate,
  getTimezoneOffset,
};
