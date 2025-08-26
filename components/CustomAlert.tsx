import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
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
  
  const scaleValue = React.useRef(new Animated.Value(0)).current;
  const opacityValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
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

  const { icon, color, bgColor } = getIconAndColor();

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onClose) {
      onClose();
    }
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
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={[styles.overlay, { backgroundColor: colorScheme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)' }]}
        activeOpacity={1}
        onPress={onClose}
      >
        <BlurView intensity={20} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <TouchableOpacity 
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <Animated.View
            style={[
              styles.alertContainer,
              {
                backgroundColor: colors.card,
                transform: [{ scale: scaleValue }],
                opacity: opacityValue,
              },
            ]}
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
                  <TouchableOpacity
                    key={index}
                    style={[
                      buttons.length > 2 ? styles.buttonVertical : styles.button,
                      { backgroundColor: buttonStyle.backgroundColor },
                      buttons.length === 1 && styles.singleButton,
                    ]}
                    onPress={() => handleButtonPress(button)}
                    activeOpacity={0.8}
                    delayPressIn={0}
                  >
                    <Text style={[styles.buttonText, { color: buttonStyle.color }]}>
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  alertContainer: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
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
});
