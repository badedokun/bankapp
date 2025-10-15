/**
 * Centralized Environment Configuration
 * Manages all environment-specific URLs and settings
 * Supports easy switching between local development and cloud deployment
 */

export interface EnvironmentConfig {
  // API Configuration
  API_BASE_URL: string;
  API_TIMEOUT: number;
  
  // Frontend URLs
  WEB_URL: string;
  WEB_PORT: number;
  
  // WebSocket Configuration  
  WS_URL: string;
  
  // Development Tools
  ENABLE_DEVTOOLS: boolean;
  ENABLE_LOGGER: boolean;
  
  // Security
  ENABLE_HTTPS: boolean;
  
  // Environment Info
  ENVIRONMENT: 'local' | 'development' | 'staging' | 'production';
  IS_CLOUD_DEPLOYMENT: boolean;
}

/**
 * React Native Compatibility Check
 * Determines if running in React Native environment
 */
const isReactNative = (): boolean => {
  return typeof window === 'undefined' && typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
};

/**
 * Environment Detection
 * Automatically detects if running in cloud or local environment
 * Compatible with both web and React Native
 */
const detectEnvironment = (): 'local' | 'development' | 'staging' | 'production' => {
  // Check for explicit environment variable first
  if (process.env.REACT_APP_ENV) {
    return process.env.REACT_APP_ENV as any;
  }
  
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  
  // Check if running in cloud (common cloud environment indicators)
  if (
    process.env.CLOUD_PROVIDER ||
    process.env.VERCEL ||
    process.env.NETLIFY ||
    process.env.HEROKU ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.GOOGLE_CLOUD_PROJECT
  ) {
    return 'development'; // Cloud development environment
  }
  
  // Check web environment (only if not React Native)
  if (!isReactNative() && typeof window !== 'undefined' && window.location?.hostname !== 'localhost') {
    return 'development'; // Web cloud environment
  }
  
  return 'local';
};

/**
 * Get Base URLs based on environment
 */
const getBaseUrls = (environment: string, isCloudDeployment: boolean) => {
  // For React Native (APK) - always use production FMFB URLs
  if (isReactNative()) {
    return {
      API_BASE_URL: 'https://fmfb-34-59-143-25.nip.io/api',
      WEB_URL: 'https://fmfb-34-59-143-25.nip.io',
      WS_URL: 'wss://fmfb-34-59-143-25.nip.io'
    };
  }

  // For cloud deployment (web browser), use relative URLs or environment-specific URLs
  if (isCloudDeployment) {
    const webUrl = process.env.REACT_APP_WEB_URL ||
                   (!isReactNative() && typeof window !== 'undefined' && window.location?.origin) ||
                   '';

    return {
      API_BASE_URL: process.env.REACT_APP_API_URL || '/api', // Relative URL for same-origin requests
      WEB_URL: webUrl,
      WS_URL: process.env.REACT_APP_WS_URL || ''
    };
  }

  // For local development
  const API_PORT = process.env.REACT_APP_API_PORT || '3001';
  const WEB_PORT = process.env.REACT_APP_WEB_PORT || '3000';

  return {
    API_BASE_URL: process.env.REACT_APP_API_URL || `http://localhost:${API_PORT}`,
    WEB_URL: process.env.REACT_APP_WEB_URL || `http://localhost:${WEB_PORT}`,
    WS_URL: process.env.REACT_APP_WS_URL || `ws://localhost:${WEB_PORT}`
  };
};

/**
 * Create Environment Configuration
 */
const createEnvironmentConfig = (): EnvironmentConfig => {
  const environment = detectEnvironment();
  const isCloudDeployment = environment !== 'local';
  const baseUrls = getBaseUrls(environment, isCloudDeployment);
  
  const config: EnvironmentConfig = {
    // API Configuration
    API_BASE_URL: baseUrls.API_BASE_URL,
    API_TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT || '30000'),
    
    // Frontend URLs
    WEB_URL: baseUrls.WEB_URL,
    WEB_PORT: parseInt(process.env.REACT_APP_WEB_PORT || '3000'),
    
    // WebSocket Configuration
    WS_URL: baseUrls.WS_URL,
    
    // Development Tools
    ENABLE_DEVTOOLS: environment === 'local' || environment === 'development',
    ENABLE_LOGGER: environment !== 'production',
    
    // Security
    ENABLE_HTTPS: isCloudDeployment || (environment as any) === 'production',
    
    // Environment Info
    ENVIRONMENT: environment,
    IS_CLOUD_DEPLOYMENT: isCloudDeployment
  };
  
  // Log configuration in development
  if (config.ENABLE_LOGGER) {
    console.log('🔧 Environment Configuration:', {
      environment: config.ENVIRONMENT,
      isCloudDeployment: config.IS_CLOUD_DEPLOYMENT,
      apiBaseUrl: config.API_BASE_URL || 'relative',
      webUrl: config.WEB_URL,
      enableDevtools: config.ENABLE_DEVTOOLS
    });
  }
  
  return config;
};

// Export the configuration
export const ENV_CONFIG = createEnvironmentConfig();

// Export helper functions
export const isLocal = () => ENV_CONFIG.ENVIRONMENT === 'local';
export const isDevelopment = () => ENV_CONFIG.ENVIRONMENT === 'development';
export const isProduction = () => ENV_CONFIG.ENVIRONMENT === 'production';
export const isCloudDeployment = () => ENV_CONFIG.IS_CLOUD_DEPLOYMENT;

// Export URL builders
export const buildApiUrl = (endpoint: string): string => {
  if (!ENV_CONFIG.API_BASE_URL) {
    // For relative URLs, ensure endpoint starts with /api/
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `/api/${cleanEndpoint}`;
  }
  
  // Remove leading slash from endpoint if base URL exists
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Check if API_BASE_URL already includes /api
  if (ENV_CONFIG.API_BASE_URL.endsWith('/api')) {
    return `${ENV_CONFIG.API_BASE_URL}/${cleanEndpoint}`;
  } else {
    return `${ENV_CONFIG.API_BASE_URL}/api/${cleanEndpoint}`;
  }
};

export const buildWebUrl = (path: string = ''): string => {
  if (!path) return ENV_CONFIG.WEB_URL;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${ENV_CONFIG.WEB_URL}/${cleanPath}`;
};

export default ENV_CONFIG;