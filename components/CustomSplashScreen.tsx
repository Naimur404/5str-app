import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

interface CustomSplashScreenProps {
  onReady: () => void;
}

export default function CustomSplashScreen({ onReady }: CustomSplashScreenProps) {
  useEffect(() => {
    // Simulate loading time or actual app initialization
    const timer = setTimeout(() => {
      onReady();
    }, 2000); // 2 seconds delay

    return () => clearTimeout(timer);
  }, [onReady]);

  return (
    <LinearGradient
      colors={['#ffffff', '#f8f9fa']}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>5str</Text>
        <Text style={styles.tagline}>Your Local Service Directory</Text>
      </View>
      
      {/* Loading indicator */}
      <View style={styles.loadingContainer}>
        <View style={styles.loadingBar}>
          <View style={styles.loadingProgress} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    fontWeight: '400',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
    width: 200,
  },
  loadingBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '100%',
    width: '70%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
});
