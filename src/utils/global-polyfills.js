/**
 * Global Polyfills for React Native
 * Provides missing browser globals in React Native environment
 */

// Simple check for React Native environment without importing Platform
// This avoids potential circular dependencies
const isReactNative = typeof navigator !== 'undefined' && 
                      navigator.product === 'ReactNative';

if (isReactNative && typeof global !== 'undefined') {
  // Polyfill window object with minimal implementation
  if (typeof global.window === 'undefined') {
    const storage = {};
    
    global.window = {
      location: {
        hostname: 'localhost',
        origin: 'http://localhost',
        href: 'http://localhost',
        pathname: '/',
        search: '',
        hash: '',
        port: '',
        protocol: 'http:',
        reload: () => {} // Add reload method that does nothing
      },
      navigator: {
        userAgent: 'React Native',
        platform: 'ReactNative'
      },
      document: {
        createElement: () => ({}),
        addEventListener: () => {},
        removeEventListener: () => {},
        body: {}
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      setTimeout: global.setTimeout,
      clearTimeout: global.clearTimeout,
      setInterval: global.setInterval,
      clearInterval: global.clearInterval,
      // Add localStorage directly to window
      localStorage: {
        getItem: (key) => storage[key] || null,
        setItem: (key, value) => { storage[key] = String(value); },
        removeItem: (key) => { delete storage[key]; },
        clear: () => { Object.keys(storage).forEach(key => delete storage[key]); },
        get length() { return Object.keys(storage).length; },
        key: (index) => Object.keys(storage)[index] || null
      }
    };
    
    // Also set sessionStorage to use the same storage
    global.window.sessionStorage = global.window.localStorage;
  }

  // Polyfill document if it doesn't exist
  if (typeof global.document === 'undefined') {
    global.document = global.window.document;
  }

  // Polyfill navigator if it doesn't exist
  if (typeof global.navigator === 'undefined') {
    global.navigator = global.window.navigator;
  }

  // Polyfill localStorage at global level
  if (typeof global.localStorage === 'undefined') {
    global.localStorage = global.window.localStorage;
  }

  // Polyfill sessionStorage at global level
  if (typeof global.sessionStorage === 'undefined') {
    global.sessionStorage = global.window.sessionStorage;
  }
}