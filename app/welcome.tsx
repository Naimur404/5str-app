import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AppState } from '@/utils/appState';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colorScheme === 'dark' ? ['#151718', '#2a2d31'] : ['#ffffff', '#f8f9fa']}
        style={styles.gradient}
      >
        {/* Header with Logo and Branding */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.logoContainer}
          >
            <Text style={styles.logoText}>5str</Text>
          </LinearGradient>
          
          <Text style={[styles.appName, { color: colors.text }]}>5str</Text>
          <Text style={[styles.tagline, { color: colors.icon }]}>
            Discover Amazing Local Businesses
          </Text>
        </View>

        {/* Feature Highlights */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: colors.tint + '20' }]}>
              <Ionicons name="business-outline" size={24} color={colors.tint} />
            </View>
            <Text style={[styles.featureText, { color: colors.text }]}>
              Find local businesses and services near you
            </Text>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: colors.tint + '20' }]}>
              <Ionicons name="star-outline" size={24} color={colors.tint} />
            </View>
            <Text style={[styles.featureText, { color: colors.text }]}>
              Read reviews and ratings from real customers
            </Text>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: colors.tint + '20' }]}>
              <Ionicons name="location-outline" size={24} color={colors.tint} />
            </View>
            <Text style={[styles.featureText, { color: colors.text }]}>
              Get directions and contact information instantly
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('auth/login' as any)}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.loginButtonGradient}
            >
              <Text style={styles.loginButtonText}>Sign In</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, { borderColor: colors.tint }]}
            onPress={() => router.push('auth/register' as any)}
          >
            <Text style={[styles.registerButtonText, { color: colors.tint }]}>
              Create Account
            </Text>
          </TouchableOpacity>

          {/* Skip Button */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={[styles.skipButtonText, { color: colors.icon }]}>
              Continue as Guest
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.icon }]}>
            Sign up to save favorites, write reviews, and get personalized recommendations
          </Text>
          <Text style={[styles.footerText, { color: colors.icon }]}>
            By continuing, you agree to our{' '}
            <Text style={[styles.footerLink, { color: colors.tint }]}>Terms</Text>
            {' '}and{' '}
            <Text style={[styles.footerLink, { color: colors.tint }]}>Privacy Policy</Text>
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 60,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: 60,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  actionContainer: {
    marginBottom: 40,
  },
  loginButton: {
    marginBottom: 16,
  },
  loginButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    fontWeight: '600',
  },
});
