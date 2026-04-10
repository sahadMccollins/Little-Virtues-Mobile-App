import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Prevent splash screen from auto-hiding until we're ready
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isLoading, hasViewedOnboarding, user, isGuest } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!hasViewedOnboarding && !inOnboarding) {
      // Redirect to onboarding
      router.replace('/onboarding');
    } else if (hasViewedOnboarding && !user && !isGuest && !inAuthGroup) {
      // Redirect to login
      router.replace('/(auth)/login');
    } else if ((user || isGuest) && (inAuthGroup || inOnboarding)) {
      // Redirect to tabs if logged in / guest
      router.replace('/(tabs)');
    }

    // Hide splash screen once we've figured out routing
    SplashScreen.hideAsync();

  }, [isLoading, hasViewedOnboarding, user, isGuest, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
