import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ColorScheme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  themePreference: ColorScheme;
  setThemePreference: (theme: ColorScheme) => Promise<void>;
  colorScheme: 'light' | 'dark';
  isDarkMode: boolean;
  isAutoMode: boolean;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_preference';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ColorScheme>('auto');
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference on app start
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
        setThemePreferenceState(savedTheme as ColorScheme);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemePreference = async (theme: ColorScheme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
      setThemePreferenceState(theme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Determine the actual color scheme to use
  const getEffectiveColorScheme = (): 'light' | 'dark' => {
    if (themePreference === 'auto') {
      return systemColorScheme || 'light';
    }
    return themePreference === 'dark' ? 'dark' : 'light';
  };

  const colorScheme = getEffectiveColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const isAutoMode = themePreference === 'auto';

  const value: ThemeContextType = {
    themePreference,
    setThemePreference,
    colorScheme,
    isDarkMode,
    isAutoMode,
    isLoading,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
