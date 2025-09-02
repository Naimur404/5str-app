import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { AuthProvider } from '@/contexts/AuthContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ThemeProvider as CustomThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { TrackingProvider } from '@/components/TrackingProvider';
import { useErrorHandler } from '@/services/errorHandler';

// Automatically disable ALL console logs in production builds
// No need to change any existing code - this handles everything!
if (!__DEV__) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.info = () => {};
  console.debug = () => {};
}

function RootLayoutInner() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  
  // Initialize global error handler
  useErrorHandler();
  
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Create custom theme with proper background colors
  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
      card: colors.card,
      border: colors.border,
      text: colors.text,
      primary: colors.tint,
    },
  };

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: colors.background,
      card: colors.card,
      border: colors.border,
      text: colors.text,
      primary: colors.tint,
    },
  };

  if (!loaded) {
    // Show loading screen with proper background color during font loading
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Optional: Add a simple loading indicator */}
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? customDarkTheme : customLightTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'none',
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="onboarding" options={{ 
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }} />
        <Stack.Screen name="welcome" options={{ 
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }} />
        <Stack.Screen name="(tabs)" options={{ 
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }} />
        <Stack.Screen name="search" options={{ 
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }} />
        <Stack.Screen name="auth/login" options={{ 
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }} />
        <Stack.Screen name="auth/register" options={{ 
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }} />
        <Stack.Screen name="category/[id]" options={{ 
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }} />
        <Stack.Screen name="business/[id]" options={{ 
          headerShown: false,
          statusBarStyle: 'light',
          statusBarBackgroundColor: 'transparent',
          contentStyle: { backgroundColor: colors.background },
        }} />
        <Stack.Screen name="offer/[id]" options={{ 
          headerShown: false,
          statusBarStyle: 'light',
          statusBarBackgroundColor: 'transparent',
          contentStyle: { backgroundColor: colors.background },
        }} />
        <Stack.Screen name="offering/[businessId]/[offeringId]" options={{ 
          headerShown: false,
          statusBarStyle: 'light',
          statusBarBackgroundColor: 'transparent',
          contentStyle: { backgroundColor: colors.background },
        }} />
        <Stack.Screen name="reviews" options={{ 
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }} />
        <Stack.Screen name="reviews/write" options={{ 
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }} />
        <Stack.Screen name="notifications" options={{ 
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <CustomThemeProvider>
      <NotificationProvider>
        <LocationProvider>
          <ToastProvider>
            <AuthProvider>
              <TrackingProvider>
                <RootLayoutInner />
              </TrackingProvider>
            </AuthProvider>
          </ToastProvider>
        </LocationProvider>
      </NotificationProvider>
    </CustomThemeProvider>
  );
}
