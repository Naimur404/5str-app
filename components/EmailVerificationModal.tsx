import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useToastGlobal } from '@/contexts/ToastContext';
import Toast from '@/components/Toast';
import { verifyEmail, resendVerificationCode, EmailVerifyRequest, EmailResendRequest } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect, useRef } from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface EmailVerificationModalProps {
  visible: boolean;
  email: string;
  expiresAt?: string;
  onSuccess: (user: any, token: string) => void;
  onClose: () => void;
  onError?: (message: string) => void; // Made optional
}

export default function EmailVerificationModal({
  visible,
  email,
  expiresAt,
  onSuccess,
  onClose,
  onError,
}: EmailVerificationModalProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [retryAfter, setRetryAfter] = useState(0);
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const [localToast, setLocalToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  
  // Refs for the TextInput components
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { showSuccess: globalShowSuccess, showError: globalShowError } = useToastGlobal();

  // Local toast functions that work within the modal
  const showSuccess = (message: string) => {
    setLocalToast({ visible: true, message, type: 'success' });
  };

  const showError = (message: string) => {
    setLocalToast({ visible: true, message, type: 'error' });
  };

  const hideLocalToast = () => {
    setLocalToast(prev => ({ ...prev, visible: false }));
  };

  // Calculate initial time left
  useEffect(() => {
    if (expiresAt && visible) {
      const expiresAtDate = new Date(expiresAt);
      const now = new Date();
      const difference = Math.max(0, Math.floor((expiresAtDate.getTime() - now.getTime()) / 1000));
      setTimeLeft(difference);
    }
  }, [expiresAt, visible]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // Retry after countdown
  useEffect(() => {
    if (retryAfter > 0) {
      const timer = setTimeout(() => {
        setRetryAfter(retryAfter - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [retryAfter]);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setCode(['', '', '', '', '', '']);
      setIsVerifying(false);
      setIsResending(false);
      setRetryAfter(0);
      setLocalToast({ visible: false, message: '', type: 'success' });
    }
  }, [visible]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (text: string, index: number) => {
    if (text.length > 1) {
      // Handle paste
      const digits = text.slice(0, 6).split('');
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (i < 6 && /^\d$/.test(digit)) {
          newCode[i] = digit;
        }
      });
      setCode(newCode);
      
      // Focus on the last filled input or the next empty one
      const lastIndex = Math.min(digits.length - 1, 5);
      inputRefs.current[lastIndex]?.focus();
    } else {
      const newCode = [...code];
      newCode[index] = text;
      setCode(newCode);

      // Auto-focus next input
      if (text && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      showError('Please enter the complete 6-digit verification code');
      return;
    }

    setIsVerifying(true);
    try {
      const verificationData: EmailVerifyRequest = {
        email,
        code: verificationCode,
      };

      const response = await verifyEmail(verificationData);

      if (response.success && response.data) {
        onSuccess(response.data.user, response.data.token);
      } else {
        showError(response.message || 'Invalid or expired verification code');
      }
    } catch (error: any) {
      showError(error.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const resendData: EmailResendRequest = { email };
      const response = await resendVerificationCode(resendData);

      if (response.success) {
        showSuccess('New verification code sent to your email');
        
        // Reset the timer if new expiration is provided
        if (response.data?.verification_expires_at) {
          const expiresAtDate = new Date(response.data.verification_expires_at);
          const now = new Date();
          const difference = Math.max(0, Math.floor((expiresAtDate.getTime() - now.getTime()) / 1000));
          setTimeLeft(difference);
        }
        
        // Clear the current code
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        if (response.retry_after_seconds) {
          setRetryAfter(response.retry_after_seconds);
        }
        showError(response.message || 'Failed to resend verification code');
      }
    } catch (error: any) {
      showError(error.message || 'Failed to resend verification code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <StatusBar backgroundColor="rgba(0, 0, 0, 0.7)" barStyle="light-content" />
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* App Icon */}
          <View style={styles.iconContainer}>
            <Image 
              source={require('@/assets/images/icon.png')} 
              style={styles.appIcon}
              resizeMode="contain"
            />
          </View>

          {/* Title and Description */}
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>Verify Your Email</Text>
            <Text style={[styles.subtitle, { color: colors.icon }]}>
              {!expiresAt || timeLeft === 0 ? (
                <>
                  Your verification code has expired.{'\n'}
                  Please request a new code for{'\n'}
                  <Text style={[styles.email, { color: colors.text }]}>{email}</Text>
                </>
              ) : (
                <>
                  We've sent a 6-digit verification code to{'\n'}
                  <Text style={[styles.email, { color: colors.text }]}>{email}</Text>
                </>
              )}
            </Text>

            {/* Code Input */}
            <View style={styles.codeContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.codeInput,
                    {
                      borderColor: digit ? colors.tint : colors.icon + '40',
                      backgroundColor: colors.card,
                      color: colors.text,
                    }
                  ]}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="numeric"
                  maxLength={6} // Allow paste
                  selectTextOnFocus
                  textAlign="center"
                  autoComplete="off"
                  textContentType="none"
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              ))}
            </View>

            {/* Timer */}
            {timeLeft > 0 && (
              <Text style={[styles.timer, { color: colors.icon }]}>
                Code expires in {formatTime(timeLeft)}
              </Text>
            )}

            {/* Expired Message */}
            {timeLeft === 0 && expiresAt && (
              <Text style={[styles.expired, { color: '#FF6B6B' }]}>
                Verification code has expired
              </Text>
            )}

            {/* Verify Button */}
            <TouchableOpacity
              style={[styles.verifyButton, { opacity: isVerifying ? 0.7 : 1 }]}
              onPress={handleVerify}
              disabled={isVerifying || code.join('').length !== 6 || (!expiresAt && timeLeft === 0)}
            >
              <LinearGradient
                colors={colors.buttonPrimary ? [colors.buttonPrimary, colors.buttonPrimary] : ['#667eea', '#764ba2']}
                style={styles.verifyButtonGradient}
              >
                {isVerifying ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.verifyButtonText}>
                    {(!expiresAt && timeLeft === 0) ? 'Request New Code First' : 'Verify Email'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Resend Section */}
            <View style={styles.resendContainer}>
              {(!expiresAt || timeLeft === 0) ? (
                // Show prominent resend when expired or no code
                <>
                  <Text style={[styles.resendText, { color: colors.icon }]}>
                    {!expiresAt ? 'No active verification code.' : 'Code has expired.'}{' '}
                  </Text>
                  
                  {retryAfter > 0 ? (
                    <Text style={[styles.retryAfter, { color: colors.icon }]}>
                      Wait {retryAfter}s
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={handleResend}
                      disabled={isResending}
                      style={[styles.resendButton, styles.prominentResend]}
                    >
                      {isResending ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text style={[styles.resendLink, styles.prominentResendText]}>
                          Send New Code
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                // Normal resend when code is active
                <>
                  <Text style={[styles.resendText, { color: colors.icon }]}>
                    Didn't receive the code?{' '}
                  </Text>
                  
                  {retryAfter > 0 ? (
                    <Text style={[styles.retryAfter, { color: colors.icon }]}>
                      Wait {retryAfter}s
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={handleResend}
                      disabled={isResending}
                      style={styles.resendButton}
                    >
                      {isResending ? (
                        <ActivityIndicator size="small" color={colors.tint} />
                      ) : (
                        <Text style={[styles.resendLink, { color: colors.tint }]}>
                          Resend Code
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>

            {/* Help Text */}
            <Text style={[styles.helpText, { color: colors.icon }]}>
              Check your spam folder if you don't see the email
            </Text>
          </View>

          {/* Local Toast for Modal */}
          <Toast
            visible={localToast.visible}
            message={localToast.message}
            type={localToast.type}
            onHide={hideLocalToast}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  closeButton: {
    padding: 8,
  },
  iconContainer: {
    marginBottom: 20,
  },
  appIcon: {
    width: 60,
    height: 60,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 30,
  },
  email: {
    fontWeight: '600',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 12,
  },
  codeInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderRadius: 8,
    fontSize: 20,
    fontWeight: '600',
  },
  timer: {
    fontSize: 14,
    marginBottom: 20,
  },
  expired: {
    fontSize: 14,
    marginBottom: 20,
    fontWeight: '500',
  },
  verifyButton: {
    width: '100%',
    marginBottom: 20,
  },
  verifyButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  resendText: {
    fontSize: 14,
  },
  resendButton: {
    paddingHorizontal: 4,
  },
  prominentResend: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  prominentResendText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  retryAfter: {
    fontSize: 14,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});