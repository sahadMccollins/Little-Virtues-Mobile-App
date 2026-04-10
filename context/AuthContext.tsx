import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  user: any | null;
  isLoading: boolean;
  hasViewedOnboarding: boolean;
  isGuest: boolean;
  login: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  hasViewedOnboarding: false,
  isGuest: false,
  login: async () => {},
  logout: async () => {},
  completeOnboarding: async () => {},
  continueAsGuest: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasViewedOnboarding, setHasViewedOnboarding] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Load initial state from storage
    const loadState = async () => {
      try {
        const onboardingValue = await AsyncStorage.getItem('@has_viewed_onboarding');
        if (onboardingValue === 'true') {
          setHasViewedOnboarding(true);
        }

        const guestMode = await AsyncStorage.getItem('@is_guest');
        if (guestMode === 'true') {
          setIsGuest(true);
        } else {
          // If not guest, check for user
          const userStr = await AsyncStorage.getItem('@user_data');
          if (userStr) {
            setUser(JSON.parse(userStr));
          }
        }
      } catch (e) {
        console.error('Failed to load initial state', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadState();
  }, []);

  const login = async (userData: any) => {
    setIsLoading(true);
    try {
      await AsyncStorage.setItem('@user_data', JSON.stringify(userData));
      await AsyncStorage.removeItem('@is_guest');
      setUser(userData);
      setIsGuest(false);
    } catch (e) {
      console.error('Error logging in', e);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.removeItem('@user_data');
      await AsyncStorage.removeItem('@is_guest');
      setUser(null);
      setIsGuest(false);
    } catch (e) {
      console.error('Error logging out', e);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@has_viewed_onboarding', 'true');
      setHasViewedOnboarding(true);
    } catch (e) {
      console.error('Error saving onboarding data', e);
    }
  };

  const continueAsGuest = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.setItem('@is_guest', 'true');
      setIsGuest(true);
      setUser(null);
    } catch (e) {
      console.error('Error entering guest mode', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        hasViewedOnboarding,
        isGuest,
        login,
        logout,
        completeOnboarding,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
