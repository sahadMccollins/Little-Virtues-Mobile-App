import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, deleteUser, signInAnonymously, OAuthProvider, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { initUserIfNotExists } from '../services/firebaseService';
import { initUserAndChild } from '../services/firestore';
import { doc, onSnapshot } from 'firebase/firestore';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';

// TODO: Configure Google Sign-In with your web client ID from Firebase Console
GoogleSignin.configure({
  webClientId: '732835593435-b4ae1h47ksuevgh3qlra110no39tgavp.apps.googleusercontent.com', // From Firebase Console -> Project Settings -> General -> Web App / Google Auth
  iosClientId: '732835593435-jal47t25vrseuh4uvcsvn60k6eqhnk2t.apps.googleusercontent.com', // Extracted from GoogleService-Info.plist
});

type AuthContextType = {
  user: any | null;
  isLoading: boolean;
  hasViewedOnboarding: boolean;
  isGuest: boolean;
  login: (credentials: any) => Promise<void>;
  register: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  bedtimeMode: boolean;
  loginWithApple: (identityToken: string, name?: string, email?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  hasViewedOnboarding: false,
  isGuest: false,
  login: async () => { },
  register: async () => { },
  logout: async () => { },
  completeOnboarding: async () => { },
  continueAsGuest: async () => { },
  resetPassword: async () => { },
  deleteAccount: async () => { },
  bedtimeMode: false,
  loginWithApple: async () => { },
  loginWithGoogle: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasViewedOnboarding, setHasViewedOnboarding] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [bedtimeMode, setBedtimeMode] = useState(false);

  useEffect(() => {
    // Check onboarding and guest mode from storage first
    const loadState = async () => {
      try {
        const onboardingValue = await AsyncStorage.getItem('@has_viewed_onboarding');
        if (onboardingValue === 'true') {
          setHasViewedOnboarding(true);
        }

        const guestMode = await AsyncStorage.getItem('@is_guest');
        if (guestMode === 'true') {
          setIsGuest(true);
        }
      } catch (e) {
        console.error('Failed to load initial state', e);
      }
    };

    loadState();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        if (firebaseUser.isAnonymous) {
          setIsGuest(true);
        } else {
          setIsGuest(false);
          await AsyncStorage.removeItem('@is_guest');
        }
      } else {
        setUser(null);
        setIsGuest(false);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setBedtimeMode(false);
      return;
    }
    const userRef = doc(db, `users/${user.uid}`);
    const unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBedtimeMode(!!data.bedtimeMode);
      }
    });
    return () => unsubscribeDoc();
  }, [user]);

  const login = async ({ email, password }: any) => {
    setIsLoading(true);
    try {
      if (!email || !password) throw new Error("Email and password required");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await initUserIfNotExists(userCredential.user);
    } catch (e) {
      console.error('Error logging in', e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithApple = async (identityToken: string, name?: string, email?: string) => {
    setIsLoading(true);
    try {
      if (!identityToken) throw new Error("Apple identity token is missing");
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: identityToken,
      });
      const userCredential = await signInWithCredential(auth, credential);
      await initUserIfNotExists(userCredential.user);

      // If new user or name is provided, ensure child data is initialized
      if (name || email) {
        await initUserAndChild(userCredential.user.uid, email || userCredential.user.email || 'apple_user@apple.com', name || 'Apple User');
      }
    } catch (e) {
      console.error('Error logging in with Apple', e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const { idToken, user: googleUser } = response.data;
        if (!idToken) throw new Error("No ID token found from Google");

        const credential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, credential);
        await initUserIfNotExists(userCredential.user);

        // Ensure child data is initialized
        await initUserAndChild(
          userCredential.user.uid,
          googleUser.email,
          googleUser.name || 'Google User'
        );
      } else {
        console.log('Google sign in was cancelled or failed:', response);
      }
    } catch (e) {
      console.error('Error logging in with Google', e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async ({ email, password, name }: any) => {
    setIsLoading(true);
    try {
      if (!email || !password) throw new Error("Email and password required");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await initUserIfNotExists(userCredential.user);
      await initUserAndChild(userCredential.user.uid, email, name || '');
    } catch (e) {
      console.error('Error registering', e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('@is_guest');
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
      const cred = await signInAnonymously(auth);
      await initUserIfNotExists(cred.user);
      await initUserAndChild(cred.user.uid, 'guest@local.app', 'Guest Child');

      await AsyncStorage.setItem('@is_guest', 'true');
      setIsGuest(true);
    } catch (e) {
      console.error('Error entering guest mode', e);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e) {
      console.error('Error resetting password', e);
      throw e;
    }
  };

  const deleteAccount = async () => {
    setIsLoading(true);
    try {
      if (user) {
        await deleteUser(user);
        setUser(null);
        await AsyncStorage.removeItem('@is_guest');
      }
    } catch (e: any) {
      console.error('Error deleting account', e);
      throw e;
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
        register,
        logout,
        completeOnboarding,
        continueAsGuest,
        resetPassword,
        deleteAccount,
        bedtimeMode,
        loginWithApple,
        loginWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
