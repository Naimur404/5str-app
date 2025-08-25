import { AppState } from '@/utils/appState';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

export default function Index() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const isFirstLaunch = await AppState.isFirstLaunch();
        
        // If it's the first launch, show onboarding
        if (isFirstLaunch) {
          router.replace('/onboarding');
        } else {
          // Go directly to the main app (tabs) for returning users
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        // Fallback to main app if there's an error (safer for returning users)
        router.replace('/(tabs)');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [router]);

  // Show loading screen while determining where to navigate
  if (isLoading) {
    return <View style={styles.container} />;
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
