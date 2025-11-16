import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  FIRST_LAUNCH: '@5str_first_launch',
  ONBOARDING_COMPLETED: '@5str_onboarding_completed',
  LOCATION_PERMISSION_REQUESTED: '@5str_location_permission_requested',
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

  // Check if location permission has been requested
  async hasRequestedLocationPermission(): Promise<boolean> {
    try {
      const requested = await AsyncStorage.getItem(STORAGE_KEYS.LOCATION_PERMISSION_REQUESTED);
      return requested === 'true';
    } catch (error) {
      console.error('Error checking location permission status:', error);
      return false;
    }
  },

  // Mark that location permission has been requested
  async markLocationPermissionRequested(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LOCATION_PERMISSION_REQUESTED, 'true');
    } catch (error) {
      console.error('Error marking location permission as requested:', error);
    }
  },

  // Reset app state (for development/testing)
  async resetAppState(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.FIRST_LAUNCH,
        STORAGE_KEYS.ONBOARDING_COMPLETED,
        STORAGE_KEYS.LOCATION_PERMISSION_REQUESTED,
      ]);
    } catch (error) {
      console.error('Error resetting app state:', error);
    }
  },
};
