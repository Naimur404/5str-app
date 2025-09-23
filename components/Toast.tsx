import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onHide?: () => void;
}

export default function Toast({
  visible,
  message,
  type = 'success',
  duration = 3000,
  onHide,
}: ToastProps) {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) {
        onHide();
      }
    });
  };

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          color: '#10b981',
          backgroundColor: colorScheme === 'dark' ? '#064e3b' : '#ecfdf5',
          borderColor: '#10b981',
        };
      case 'error':
        return {
          icon: 'close-circle',
          color: '#ef4444',
          backgroundColor: colorScheme === 'dark' ? '#7f1d1d' : '#fef2f2',
          borderColor: '#ef4444',
        };
      case 'warning':
        return {
          icon: 'warning',
          color: '#f59e0b',
          backgroundColor: colorScheme === 'dark' ? '#78350f' : '#fffbeb',
          borderColor: '#f59e0b',
        };
      default:
        return {
          icon: 'information-circle',
          color: '#3b82f6',
          backgroundColor: colorScheme === 'dark' ? '#1e3a8a' : '#eff6ff',
          borderColor: '#3b82f6',
        };
    }
  };

  const config = getToastConfig();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: config.backgroundColor,
            borderLeftColor: config.borderColor,
          },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
          <Ionicons name={config.icon as any} size={20} color={config.color} />
        </View>
        <Text
          style={[
            styles.message,
            { color: colorScheme === 'dark' ? colors.text : config.color }
          ]}
          numberOfLines={2}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
});
