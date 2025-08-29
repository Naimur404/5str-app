import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Modal,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttons?: AlertButton[];
  onClose?: () => void;
}

export default function CustomAlert({
  visible,
  title,
  message,
  type = 'info',
  buttons = [{ text: 'OK', style: 'default' }],
  onClose,
}: CustomAlertProps) {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      setIsProcessing(false); // Reset processing state when alert shows
    }
  }, [visible]);

  const getIconAndColor = () => {
    const isDark = colorScheme === 'dark';
    switch (type) {
      case 'success':
        return { 
          icon: 'checkmark-circle', 
          color: '#10b981', 
          bgColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5' 
        };
      case 'error':
        return { 
          icon: 'close-circle', 
          color: '#ef4444', 
          bgColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fef2f2' 
        };
      case 'warning':
        return { 
          icon: 'warning', 
          color: '#f59e0b', 
          bgColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fffbeb' 
        };
      default:
        return { 
          icon: 'information-circle', 
          color: '#3b82f6', 
          bgColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff' 
        };
    }
  };

  const handleOverlayPress = () => {
    // Prevent multiple rapid presses on overlay
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    // Close immediately for better responsiveness
    if (onClose) {
      onClose();
    }
    
    // Reset processing state after brief delay
    setTimeout(() => {
      setIsProcessing(false);
    }, 100); // Reduced from 150ms
  };

  const { icon, color, bgColor } = getIconAndColor();

  const handleButtonPress = (button: AlertButton) => {
    // Prevent multiple rapid presses - buttons are always ready now
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    // Execute button action immediately without delay
    if (button.onPress) {
      try {
        button.onPress();
      } catch (error) {
        console.error('Error in button press handler:', error);
      }
    }
    
    // Close the alert immediately for better responsiveness
    if (onClose) {
      onClose();
    }
    
    // Reset processing state after a brief delay
    setTimeout(() => {
      setIsProcessing(false);
    }, 100);
  };

  const getButtonStyle = (buttonStyle: string) => {
    const isDark = colorScheme === 'dark';
    switch (buttonStyle) {
      case 'destructive':
        return { backgroundColor: '#ef4444', color: '#ffffff' };
      case 'cancel':
        return { 
          backgroundColor: isDark ? colors.border : '#f3f4f6', 
          color: isDark ? colors.text : '#374151' 
        };
      default:
        return { backgroundColor: colors.buttonPrimary, color: colors.buttonText };
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent={false}
      onRequestClose={handleOverlayPress}
    >
      <Pressable 
        style={styles.overlay}
        onPress={handleOverlayPress}
      >
        <Pressable 
          style={[
            styles.alertContainer,
            {
              backgroundColor: colors.card,
              borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            },
          ]}
          onPress={(e) => e.stopPropagation()} // Prevent dismissing when tapping the alert
        >
          <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
            <Ionicons name={icon as any} size={32} color={color} />
          </View>
          
          <View style={styles.contentContainer}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            {message && <Text style={[styles.message, { color: colors.icon }]}>{message}</Text>}
          </View>

          <View style={buttons.length > 2 ? styles.buttonContainerVertical : styles.buttonContainer}>
            {buttons.map((button, index) => {
              const buttonStyle = getButtonStyle(button.style || 'default');
              return (
                <Pressable
                  key={index}
                  style={({ pressed }) => [
                    buttons.length > 2 ? styles.buttonVertical : styles.button,
                    { backgroundColor: buttonStyle.backgroundColor },
                    buttons.length === 1 && styles.singleButton,
                    isProcessing && styles.buttonDisabled,
                    pressed && !isProcessing && styles.buttonPressed,
                  ]}
                  onPress={() => handleButtonPress(button)}
                  disabled={isProcessing}
                  android_ripple={{
                    color: 'rgba(255, 255, 255, 0.1)',
                    borderless: false,
                  }}
                >
                  <Text style={[
                    styles.buttonText, 
                    { color: buttonStyle.color },
                    isProcessing && styles.buttonTextDisabled
                  ]}>
                    {button.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay
  },
  containerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    // No background color - completely transparent
  },
  alertContainer: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    minWidth: 280,
    // Enhanced styling for visibility without overlay
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
    borderWidth: 1,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  contentContainer: {
    alignItems: 'center',
    marginBottom: 24,
    minHeight: 60,
    maxHeight: 200,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 4,
    flexShrink: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    minHeight: 48,
    alignItems: 'stretch',
  },
  buttonContainerVertical: {
    gap: 8,
    minHeight: 48,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonVertical: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  singleButton: {
    flex: 1,
    minWidth: 120,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonTextDisabled: {
    opacity: 0.7,
  },
});
