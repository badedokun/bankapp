/**
 * Enhanced Global Polyfills for React Native
 * Provides missing browser globals and fixes Android APK compatibility
 */

// Robust React Native environment detection
const isReactNative = typeof navigator !== 'undefined' &&
                      navigator.product === 'ReactNative';

// Enhanced global polyfills for React Native
if (isReactNative && typeof global !== 'undefined') {

  // Critical: Add missing crypto support for Android
  if (typeof global.crypto === 'undefined') {
    global.crypto = {
      getRandomValues: (arr) => {
        // Use Math.random() fallback for missing crypto.getRandomValues
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
      randomUUID: () => {
        // Simple UUID v4 generator fallback
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
    };
  }

  // Critical: Add missing TextEncoder/TextDecoder for Android
  if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = class TextEncoder {
      encode(str) {
        // Simple UTF-8 encoding
        const utf8 = [];
        for (let i = 0; i < str.length; i++) {
          let charcode = str.charCodeAt(i);
          if (charcode < 0x80) utf8.push(charcode);
          else if (charcode < 0x800) {
            utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
          } else if (charcode < 0xd800 || charcode >= 0xe000) {
            utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
          }
        }
        return new Uint8Array(utf8);
      }
    };
  }

  if (typeof global.TextDecoder === 'undefined') {
    global.TextDecoder = class TextDecoder {
      decode(bytes) {
        // Simple UTF-8 decoding
        let result = '';
        for (let i = 0; i < bytes.length; i++) {
          result += String.fromCharCode(bytes[i]);
        }
        return result;
      }
    };
  }

  // Enhanced window object with better Android compatibility
  if (typeof global.window === 'undefined') {
    const storage = {};

    global.window = {
      // Enhanced location object
      location: {
        hostname: 'localhost',
        origin: 'http://localhost',
        href: 'http://localhost',
        pathname: '/',
        search: '',
        hash: '',
        port: '',
        protocol: 'http:',
        host: 'localhost',
        reload: () => {},
        assign: () => {},
        replace: () => {}
      },

      // Enhanced navigator object
      navigator: {
        userAgent: 'React Native Android',
        platform: 'Android',
        language: 'en-US',
        languages: ['en-US', 'en'],
        onLine: true,
        cookieEnabled: false,
        doNotTrack: null
      },

      // Enhanced document object
      document: {
        createElement: (tag) => ({
          tagName: tag,
          style: {},
          setAttribute: () => {},
          getAttribute: () => null,
          appendChild: () => {},
          removeChild: () => {},
          addEventListener: () => {},
          removeEventListener: () => {}
        }),
        createTextNode: (text) => ({ nodeValue: text }),
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {},
        removeEventListener: () => {},
        body: {
          style: {},
          appendChild: () => {},
          removeChild: () => {}
        },
        head: {
          appendChild: () => {},
          removeChild: () => {}
        },
        readyState: 'complete',
        cookie: ''
      },

      // Enhanced event handling
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,

      // Timer functions
      setTimeout: global.setTimeout,
      clearTimeout: global.clearTimeout,
      setInterval: global.setInterval,
      clearInterval: global.clearInterval,
      requestAnimationFrame: global.requestAnimationFrame || ((cb) => setTimeout(cb, 16)),
      cancelAnimationFrame: global.cancelAnimationFrame || clearTimeout,

      // Enhanced localStorage with error handling
      localStorage: {
        getItem: (key) => {
          try {
            return storage[key] || null;
          } catch (e) {
            return null;
          }
        },
        setItem: (key, value) => {
          try {
            storage[key] = String(value);
          } catch (e) {
            // Ignore storage errors
          }
        },
        removeItem: (key) => {
          try {
            delete storage[key];
          } catch (e) {
            // Ignore storage errors
          }
        },
        clear: () => {
          try {
            Object.keys(storage).forEach(key => delete storage[key]);
          } catch (e) {
            // Ignore storage errors
          }
        },
        get length() {
          try {
            return Object.keys(storage).length;
          } catch (e) {
            return 0;
          }
        },
        key: (index) => {
          try {
            return Object.keys(storage)[index] || null;
          } catch (e) {
            return null;
          }
        }
      },

      // Window properties for compatibility
      innerWidth: 375,
      innerHeight: 667,
      outerWidth: 375,
      outerHeight: 667,
      devicePixelRatio: 2,
      screen: {
        width: 375,
        height: 667,
        availWidth: 375,
        availHeight: 667
      },

      // Crypto reference
      crypto: global.crypto,

      // Console reference
      console: global.console
    };

    // Set sessionStorage to use the same storage
    global.window.sessionStorage = global.window.localStorage;
  }

  // Set global references for better compatibility
  if (typeof global.document === 'undefined') {
    global.document = global.window.document;
  }

  if (typeof global.navigator === 'undefined') {
    global.navigator = global.window.navigator;
  }

  if (typeof global.localStorage === 'undefined') {
    global.localStorage = global.window.localStorage;
  }

  if (typeof global.sessionStorage === 'undefined') {
    global.sessionStorage = global.window.sessionStorage;
  }

  // Critical: Add missing btoa/atob for base64 encoding (common crash cause)
  if (typeof global.btoa === 'undefined') {
    global.btoa = (str) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      let result = '';
      let i = 0;
      while (i < str.length) {
        const a = str.charCodeAt(i++);
        const b = i < str.length ? str.charCodeAt(i++) : 0;
        const c = i < str.length ? str.charCodeAt(i++) : 0;
        const bitmap = (a << 16) | (b << 8) | c;
        result += chars.charAt((bitmap >> 18) & 63) +
                 chars.charAt((bitmap >> 12) & 63) +
                 (i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '=') +
                 (i - 1 < str.length ? chars.charAt(bitmap & 63) : '=');
      }
      return result;
    };
  }

  if (typeof global.atob === 'undefined') {
    global.atob = (str) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      let result = '';
      str = str.replace(/[^A-Za-z0-9+/]/g, '');
      for (let i = 0; i < str.length; i += 4) {
        const encoded1 = chars.indexOf(str[i]);
        const encoded2 = chars.indexOf(str[i + 1]);
        const encoded3 = chars.indexOf(str[i + 2]);
        const encoded4 = chars.indexOf(str[i + 3]);
        const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
        result += String.fromCharCode((bitmap >> 16) & 255);
        if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
        if (encoded4 !== 64) result += String.fromCharCode(bitmap & 255);
      }
      return result;
    };
  }

  // Critical: Add Buffer polyfill for Node.js compatibility (common crash cause)
  if (typeof global.Buffer === 'undefined') {
    global.Buffer = {
      from: (data, encoding = 'utf8') => {
        if (typeof data === 'string') {
          if (encoding === 'base64') {
            return { data: global.atob(data), toString: (enc) => enc === 'base64' ? global.btoa(this.data) : this.data };
          }
          return { data, toString: (enc) => enc === 'base64' ? global.btoa(data) : data };
        }
        return { data, toString: () => String(data) };
      },
      alloc: (size, fill = 0) => {
        const arr = new Array(size).fill(fill);
        return { data: arr, toString: () => arr.join('') };
      },
      isBuffer: (obj) => obj && typeof obj.data !== 'undefined'
    };
  }

  // Additional Android-specific polyfills
  if (typeof global.fetch === 'undefined') {
    // Ensure fetch is available (should be provided by React Native)
    global.fetch = global.fetch || (() => Promise.reject(new Error('Fetch not available')));
  }

  // Polyfill for missing Array methods (Android compatibility)
  if (!Array.prototype.flatMap) {
    Array.prototype.flatMap = function(callback, thisArg) {
      return this.map(callback, thisArg).flat();
    };
  }

  if (!Array.prototype.flat) {
    Array.prototype.flat = function(depth = 1) {
      const stack = [...this.map(item => [item, depth])];
      const result = [];
      while (stack.length > 0) {
        const [item, currentDepth] = stack.pop();
        if (Array.isArray(item) && currentDepth > 0) {
          stack.push(...item.map(subItem => [subItem, currentDepth - 1]));
        } else {
          result.push(item);
        }
      }
      return result.reverse();
    };
  }
}

// Export for manual import if needed
export default {};