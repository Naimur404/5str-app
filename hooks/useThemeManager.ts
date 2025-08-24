import { useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ColorScheme = 'light' | 'dark' | 'auto';

const THEME_STORAGE_KEY = '@app_theme_preference';

export function useThemeManager() {
  const systemColorScheme = useSystemColorScheme();
  const [themePreference, setThemePreference] = useState<ColorScheme>('auto');
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference on app start
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
        setThemePreference(savedTheme as ColorScheme);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveThemePreference = async (theme: ColorScheme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
      setThemePreference(theme);
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

  return {
    themePreference,
    setThemePreference: saveThemePreference,
    colorScheme: getEffectiveColorScheme(),
    isLoading,
    isDarkMode: getEffectiveColorScheme() === 'dark',
    isAutoMode: themePreference === 'auto',
  };
}
