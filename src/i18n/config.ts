/**
 * i18n Configuration for Multi-Language Support
 * Supports English (en), French (fr), German (de), Spanish (es)
 * Integrates with TenantThemeContext for locale detection
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  // Load translations from backend
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Fallback language if translation not found
    fallbackLng: 'en',

    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',

    // Supported languages
    supportedLngs: ['en', 'fr', 'de', 'es'],

    // Namespaces for organizing translations
    ns: ['common', 'auth', 'dashboard', 'transfers', 'transactions', 'savings', 'loans', 'settings', 'errors'],
    defaultNS: 'common',

    // Interpolation settings
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Backend configuration
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // Language detection order
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
    },

    // React specific options
    react: {
      useSuspense: false, // Disable suspense for now
    },
  });

export default i18n;
