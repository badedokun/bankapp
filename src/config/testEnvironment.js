/**
 * Test Environment Configuration
 * Provides environment-specific URLs for test files
 */

const getApiUrl = () => {
  // Check for explicit test API URL
  if (process.env.TEST_API_URL) {
    return process.env.TEST_API_URL;
  }
  
  // Check if we're in a cloud environment first
  if (
    process.env.CLOUD_PROVIDER ||
    process.env.VERCEL ||
    process.env.NETLIFY ||
    process.env.HEROKU ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.GOOGLE_CLOUD_PROJECT
  ) {
    return ''; // Use relative URLs in cloud
  }
  
  // Check for React app API URL (for frontend tests)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Check for Node environment (only if not in cloud)
  if (process.env.NODE_ENV === 'production') {
    return 'https://api.orokii.com';
  }
  
  // Default to localhost for local development
  const apiPort = process.env.API_PORT || process.env.REACT_APP_API_PORT || '3001';
  return `http://localhost:${apiPort}`;
};

const getWebUrl = () => {
  // Check for explicit test web URL
  if (process.env.TEST_WEB_URL) {
    return process.env.TEST_WEB_URL;
  }
  
  // Check for React app web URL
  if (process.env.REACT_APP_WEB_URL) {
    return process.env.REACT_APP_WEB_URL;
  }
  
  // Check if we're in a cloud environment
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.origin;
  }
  
  // Default to localhost for local development
  const webPort = process.env.WEB_PORT || process.env.REACT_APP_WEB_PORT || '3000';
  return `http://localhost:${webPort}`;
};

module.exports = {
  API_BASE_URL: getApiUrl(),
  WEB_BASE_URL: getWebUrl(),
  API_URL: getApiUrl() + '/api',
  
  // Helper functions
  buildApiUrl: (endpoint) => {
    const baseUrl = getApiUrl();
    if (!baseUrl) {
      // For relative URLs, ensure endpoint starts with /
      return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    }
    
    // Remove leading slash from endpoint if base URL exists
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${baseUrl}/${cleanEndpoint}`;
  },
  
  buildWebUrl: (path = '') => {
    const baseUrl = getWebUrl();
    if (!path) return baseUrl;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${baseUrl}/${cleanPath}`;
  }
};