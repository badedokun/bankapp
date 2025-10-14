/**
 * User Context
 * Manages authenticated user data throughout the application
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Storage } from '../utils/storage';

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  mfaEnabled: boolean;
  biometricEnabled: boolean;
  kycStatus: string;
  kycLevel: number;
  profileData: any;
  aiPreferences: any;
  tenant: {
    id: string;
    name: string;
    displayName: string;
    branding: any;
  };
  wallet?: {
    number: string;
    balance: string;
    availableBalance: string;
  };
  permissions?: Record<string, string>;
}

interface UserContextType {
  user: UserData | null;
  setUser: (user: UserData | null) => void;
  clearUser: () => void;
  loadUserFromStorage: () => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data from storage on mount
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      setIsLoading(true);
      const storedUser = await Storage.getItem('user_data');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUserState(userData);
      }
    } catch (error) {
      // Error loading user data
    } finally {
      setIsLoading(false);
    }
  };

  const setUser = async (userData: UserData | null) => {
    try {
      setUserState(userData);
      if (userData) {
        await Storage.setItem('user_data', JSON.stringify(userData));
      } else {
        await Storage.removeItem('user_data');
      }
    } catch (error) {
      // Error saving user data
    }
  };

  const clearUser = async () => {
    try {
      setUserState(null);
      await Storage.removeItem('user_data');
    } catch (error) {
      // Error clearing user data
    }
  };

  return (
    <UserContext.Provider value={{
      user,
      setUser,
      clearUser,
      loadUserFromStorage,
      isLoading
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;