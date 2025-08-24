import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  FIRST_LAUNCH: '@5str_first_launch',
  ONBOARDING_COMPLETED: '@5str_onboarding_completed',
  USER_PREFERENCES: '@5str_user_preferences',
};

export const AppState = {
  // Check if this is the first time the app is launched
  async isFirstLaunch(): Promise<boolean> {
    try {
      const hasLaunched = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_LAUNCH);
      return hasLaunched === null;
    } catch (error) {
      console.error('Error checking first launch:', error);
      return true; // Default to first launch if error
    }
  },

  // Mark that the app has been launched
  async markAsLaunched(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LAUNCH, 'true');
    } catch (error) {
      console.error('Error marking app as launched:', error);
    }
  },

  // Check if onboarding has been completed
  async isOnboardingCompleted(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      return completed === 'true';
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  },

  // Mark onboarding as completed
  async completeOnboarding(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    } catch (error) {
      console.error('Error marking onboarding as completed:', error);
    }
  },

  // Reset app state (for development/testing)
  async resetAppState(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.FIRST_LAUNCH,
        STORAGE_KEYS.ONBOARDING_COMPLETED,
      ]);
    } catch (error) {
      console.error('Error resetting app state:', error);
    }
  },
};
