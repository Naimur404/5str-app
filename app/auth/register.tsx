import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { register } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/CustomAlert';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    city: '',
    current_latitude: '',
    current_longitude: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { alertConfig, showError, showSuccess, hideAlert } = useCustomAlert();

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    const { name, email, phone, password, password_confirmation } = formData;
    
    if (!name || !email || !phone || !password || !password_confirmation) {
      showError('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== password_confirmation) {
      showError('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      showError('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        name,
        email,
        phone,
        password,
        password_confirmation,
        ...(formData.city && { city: formData.city }),
        ...(formData.current_latitude && { 
          current_latitude: parseFloat(formData.current_latitude) 
        }),
        ...(formData.current_longitude && { 
          current_longitude: parseFloat(formData.current_longitude) 
        }),
      };

      const data = await register(requestData);

      if (data.success) {
        showSuccess('Success', 'Registration successful! Welcome to 5str! You can now login.');
        // Add a small delay to show the success message before navigation
        setTimeout(() => {
          router.replace('/auth/login');
        }, 2000);
      } else {
        showError('Error', data.message || 'Registration failed');
      }
    } catch (error) {
      showError('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
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
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: colors.icon }]}>
              Join 5str and discover amazing local businesses
            </Text>
          </View>

          {/* Logo/Brand */}
          <View style={styles.brandContainer}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.brandCircle}
            >
              <Text style={styles.brandText}>5str</Text>
            </LinearGradient>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Name Input */}
            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, { borderColor: colors.icon }]}>
                <Ionicons name="person-outline" size={20} color={colors.icon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Full Name *"
                  placeholderTextColor={colors.icon}
                  value={formData.name}
                  onChangeText={(value) => updateField('name', value)}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, { borderColor: colors.icon }]}>
                <Ionicons name="mail-outline" size={20} color={colors.icon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Email *"
                  placeholderTextColor={colors.icon}
                  value={formData.email}
                  onChangeText={(value) => updateField('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, { borderColor: colors.icon }]}>
                <Ionicons name="call-outline" size={20} color={colors.icon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Phone Number *"
                  placeholderTextColor={colors.icon}
                  value={formData.phone}
                  onChangeText={(value) => updateField('phone', value)}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
              </View>
            </View>

            {/* City Input */}
            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, { borderColor: colors.icon }]}>
                <Ionicons name="location-outline" size={20} color={colors.icon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="City (Optional)"
                  placeholderTextColor={colors.icon}
                  value={formData.city}
                  onChangeText={(value) => updateField('city', value)}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Location Coordinates */}
            <View style={styles.locationRow}>
              <View style={[styles.locationInput, styles.inputContainer]}>
                <View style={[styles.inputWrapper, { borderColor: colors.icon }]}>
                  <Ionicons name="navigate-outline" size={20} color={colors.icon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Latitude"
                    placeholderTextColor={colors.icon}
                    value={formData.current_latitude}
                    onChangeText={(value) => updateField('current_latitude', value)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={[styles.locationInput, styles.inputContainer]}>
                <View style={[styles.inputWrapper, { borderColor: colors.icon }]}>
                  <Ionicons name="navigate-outline" size={20} color={colors.icon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Longitude"
                    placeholderTextColor={colors.icon}
                    value={formData.current_longitude}
                    onChangeText={(value) => updateField('current_longitude', value)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, { borderColor: colors.icon }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.icon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Password *"
                  placeholderTextColor={colors.icon}
                  value={formData.password}
                  onChangeText={(value) => updateField('password', value)}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
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

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, { borderColor: colors.icon }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.icon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Confirm Password *"
                  placeholderTextColor={colors.icon}
                  value={formData.password_confirmation}
                  onChangeText={(value) => updateField('password_confirmation', value)}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="new-password"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={colors.icon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <Text style={[styles.termsText, { color: colors.icon }]}>
                By signing up, you agree to our{' '}
                <Text style={[styles.termsLink, { color: colors.tint }]}>
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text style={[styles.termsLink, { color: colors.tint }]}>
                  Privacy Policy
                </Text>
              </Text>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={loading}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.registerButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.registerButtonText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Sign In Link */}
          <View style={styles.signinContainer}>
            <Text style={[styles.signinText, { color: colors.icon }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.replace('auth/login' as any)}>
              <Text style={[styles.signinLink, { color: colors.tint }]}>Sign In</Text>
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
    marginTop: 60,
    marginBottom: 30,
  },
  backButton: {
    marginBottom: 20,
    alignSelf: 'flex-start',
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
    marginBottom: 30,
  },
  brandCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  formContainer: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
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
  locationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  locationInput: {
    flex: 1,
  },
  termsContainer: {
    marginBottom: 30,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  termsLink: {
    fontWeight: '600',
  },
  registerButton: {
    marginBottom: 20,
  },
  registerButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 30,
  },
  signinText: {
    fontSize: 14,
  },
  signinLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
