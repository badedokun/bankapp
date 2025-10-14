/**
 * Cross-platform Storage Utilities
 * Provides consistent storage interface across web and mobile platforms
 */

import { Platform } from 'react-native';

// Web storage implementation
const WebStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('Failed to get item from localStorage:', error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('Failed to set item in localStorage:', error);
      throw error;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove item from localStorage:', error);
      throw error;
    }
  },

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
      throw error;
    }
  }
};

// Mobile storage implementation (lazy loaded)
let MobileStorage: any = null;

const getMobileStorage = async () => {
  if (!MobileStorage) {
    try {
      // Dynamic import only on mobile platforms
      if (Platform.OS !== 'web') {
        const AsyncStorageModule = await import('@react-native-async-storage/async-storage');
        MobileStorage = AsyncStorageModule.default;
      } else {
        // Use web storage for web platform
        MobileStorage = WebStorage;
      }
    } catch (error) {
      console.warn('AsyncStorage not available, using fallback:', error);
      // Fallback to in-memory storage for development
      const memoryStorage = new Map<string, string>();
      MobileStorage = {
        async getItem(key: string): Promise<string | null> {
          return memoryStorage.get(key) || null;
        },
        async setItem(key: string, value: string): Promise<void> {
          memoryStorage.set(key, value);
        },
        async removeItem(key: string): Promise<void> {
          memoryStorage.delete(key);
        },
        async clear(): Promise<void> {
          memoryStorage.clear();
        }
      };
    }
  }
  return MobileStorage;
};

// Cross-platform storage interface
export const Storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return WebStorage.getItem(key);
    } else {
      const asyncStorage = await getMobileStorage();
      return asyncStorage.getItem(key);
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      return WebStorage.setItem(key, value);
    } else {
      const asyncStorage = await getMobileStorage();
      return asyncStorage.setItem(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      return WebStorage.removeItem(key);
    } else {
      const asyncStorage = await getMobileStorage();
      return asyncStorage.removeItem(key);
    }
  },

  async clear(): Promise<void> {
    if (Platform.OS === 'web') {
      return WebStorage.clear();
    } else {
      const asyncStorage = await getMobileStorage();
      return asyncStorage.clear();
    }
  }
};

// Export default for compatibility with AsyncStorage imports
export default Storage;