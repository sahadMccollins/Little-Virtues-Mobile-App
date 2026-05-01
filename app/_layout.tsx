import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { RevenueCatProvider } from '../context/RevenueCatProvider';

// Prevent splash screen from auto-hiding until we're ready
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isLoading, hasViewedOnboarding, user, isGuest, bedtimeMode } = useAuth();
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

  // Calculate if it's currently bedtime
  const currentHour = new Date().getHours();
  // Standard hours: currentHour >= 20 || currentHour < 6
  // We use testing hours (8AM to 6PM) to allow the user to see the effect immediately
  const isBedtimeHours = currentHour >= 8 && currentHour <= 18; 
  const shouldDim = bedtimeMode && isBedtimeHours;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="profile" options={{ headerShown: true, title: 'Your Profile', headerBackTitle: 'Back' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        {shouldDim && (
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 9999 }} />
        )}
      </View>
      <StatusBar style={shouldDim ? "light" : "auto"} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RevenueCatProvider>
        <RootLayoutNav />
      </RevenueCatProvider>
    </AuthProvider>
  );
}
