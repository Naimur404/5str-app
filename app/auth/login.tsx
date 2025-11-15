import CustomAlert from '@/components/CustomAlert';
import EmailVerificationModal from '@/components/EmailVerificationModal';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useToastGlobal } from '@/contexts/ToastContext';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { login } from '@/services/api';
import { signInWithGoogle } from '@/services/googleSignIn';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationExpiresAt, setVerificationExpiresAt] = useState('');
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { alertConfig, showError, hideAlert } = useCustomAlert();
  const { showSuccess } = useToastGlobal();

  const handleLogin = async () => {
    if (!email || !password) {
      showError('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const data = await login(email, password);

      if (data.success) {
        // Check user role - only allow users with role "user" to access the app
        if (data.data?.user?.role === 'super-admin') {
          showError(
            'Access Denied', 
            'Super admin accounts cannot access this application. Please use the admin portal instead.'
          );
          return;
        }

        // Only allow users with role "user"
        if (data.data?.user?.role !== 'user') {
          showError(
            'Access Denied', 
            'Only user accounts can access this application. Please contact support if you believe this is an error.'
          );
          return;
        }

        // Set login success flag with timestamp and navigate immediately
        await AsyncStorage.setItem('loginSuccess', 'true');
        await AsyncStorage.setItem('loginSuccessTime', Date.now().toString());
        
        // Navigate to home with a special parameter to trigger immediate success message
        router.replace('/(tabs)?loginSuccess=true' as any);
      } else {
        // Check if email verification is required
        if (data.verification_required) {
          setVerificationEmail(email);
          
          if (data.verification_expired || !data.verification_expires_at) {
            // Verification code has expired or doesn't exist, show modal directly
            setVerificationExpiresAt('');
            setShowVerificationModal(true);
            // Don't show error alert here - let the modal handle the messaging
          } else {
            // Show verification modal with current expiration time
            setVerificationExpiresAt(data.verification_expires_at || '');
            setShowVerificationModal(true);
            // Show a gentle info message that doesn't block the modal
          }
        } else {
          showError('Error', data.message || 'Login failed');
        }
      }
    } catch (error) {
      showError('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSuccess = (user: any, token: string) => {
    setShowVerificationModal(false);
    showSuccess('Email verified successfully! Welcome back!');
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 1500);
  };

  const handleVerificationClose = () => {
    setShowVerificationModal(false);
  };

  const handleVerificationError = (message: string) => {
    showError('Verification Error', message);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      
      if (result.success) {
        // Check user role - only allow users with role "user" to access the app
        if (result.user?.role === 'super-admin') {
          showError(
            'Access Denied', 
            'Super admin accounts cannot access this application. Please use the admin portal instead.'
          );
          return;
        }

        // Only allow users with role "user" (or undefined/null for Google users without role set)
        if (result.user?.role && result.user.role !== 'user') {
          showError(
            'Access Denied', 
            'Only user accounts can access this application. Please contact support if you believe this is an error.'
          );
          return;
        }

        // Store user data if needed
        if (result.user) {
          await AsyncStorage.setItem('user_data', JSON.stringify(result.user));
        }

        // Set login success flag with timestamp and navigate immediately
        await AsyncStorage.setItem('loginSuccess', 'true');
        await AsyncStorage.setItem('loginSuccessTime', Date.now().toString());
        
        // Show success message
        showSuccess('Google Sign-In successful! Welcome back!');
        
        // Navigate to home
        setTimeout(() => {
          router.replace('/(tabs)?loginSuccess=true' as any);
        }, 1000);
      } else {
        showError('Google Sign-In Failed', result.error || 'Something went wrong. Please try again.');
      }
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      showError('Error', error.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: colors.icon }]}>
              Sign in to discover amazing local businesses
            </Text>
          </View>

          {/* Logo/Brand */}
          <View style={styles.brandContainer}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.card }]}>
              <Image 
                source={require('@/assets/images/icon.png')} 
                style={styles.appIcon}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, { 
                borderColor: colors.icon + '40',
                backgroundColor: colors.card
              }]}>
                <Ionicons name="mail-outline" size={20} color={colors.icon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Email"
                  placeholderTextColor={colors.icon}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, { 
                borderColor: colors.icon + '40',
                backgroundColor: colors.card
              }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.icon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Password"
                  placeholderTextColor={colors.icon}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={colors.icon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={[styles.forgotPasswordText, { color: colors.tint }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={colors.buttonPrimary ? [colors.buttonPrimary, colors.buttonPrimary] : ['#667eea', '#764ba2']}
                style={styles.loginButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Continue as Guest Button */}
            <TouchableOpacity
              style={[styles.guestButton, { 
                borderColor: colors.icon + '30',
                backgroundColor: 'transparent'
              }]}
              onPress={() => router.replace('/(tabs)' as any)}
            >
              <Ionicons name="person-outline" size={20} color={colors.icon} style={{ marginRight: 8 }} />
              <Text style={[styles.guestButtonText, { color: colors.text }]}>
                Skip and Browse as Guest
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: colors.icon + '30' }]} />
              <Text style={[styles.dividerText, { color: colors.icon }]}>OR CONTINUE WITH</Text>
              <View style={[styles.divider, { backgroundColor: colors.icon + '30' }]} />
            </View>

            {/* Google Sign In Button */}
            <TouchableOpacity 
              style={[styles.googleButton, { 
                borderColor: colors.icon + '20',
                backgroundColor: '#FFFFFF',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }]}
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color="#4285F4" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={22} color="#EA4335" />
                  <Text style={[styles.googleButtonText, { color: '#000000' }]}>
                    Continue with Google
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={[styles.signupText, { color: colors.icon }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('auth/register' as any)}>
              <Text style={[styles.signupLink, { color: colors.tint }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <CustomAlert 
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />

      <EmailVerificationModal
        visible={showVerificationModal}
        email={verificationEmail}
        expiresAt={verificationExpiresAt}
        onSuccess={handleVerificationSuccess}
        onClose={handleVerificationClose}
        onError={handleVerificationError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 80,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  appIcon: {
    width: 66,
    height: 66,
  },
  formContainer: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    marginBottom: 30,
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
  guestButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 30,
  },
  guestButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 30,
    gap: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 30,
  },
  signupText: {
    fontSize: 14,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
