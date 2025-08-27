import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { usePushNotifications } from '@/contexts/PushNotificationContext';
import { Colors } from '@/constants/Colors';

export default function NotificationSettingsScreen() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const {
    hasPermissions,
    isInitialized,
    requestPermissions,
    scheduleTestNotification,
    expoPushToken,
    sendTokenToServer,
  } = usePushNotifications();

  const [notificationsEnabled, setNotificationsEnabled] = useState(hasPermissions);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setNotificationsEnabled(hasPermissions);
  }, [hasPermissions]);

  const handleToggleNotifications = async (value: boolean) => {
    if (value && !hasPermissions) {
      setLoading(true);
      const granted = await requestPermissions();
      
      if (granted) {
        setNotificationsEnabled(true);
        Alert.alert(
          '🎉 Notifications Enabled!',
          'You will now receive push notifications for orders, offers, and important updates.',
          [{ text: 'OK' }]
        );
        
        // Send token to server
        if (expoPushToken) {
          await sendTokenToServer();
        }
      } else {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive important updates.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              // In a real app, you'd open device settings
              console.log('Open device settings');
            }}
          ]
        );
      }
      setLoading(false);
    } else if (!value) {
      setNotificationsEnabled(false);
      Alert.alert(
        'Notifications Disabled',
        'You can re-enable notifications anytime from this screen.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleTestNotification = async () => {
    if (!hasPermissions) {
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications first to test them.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await scheduleTestNotification(3);
      Alert.alert(
        '📱 Test Scheduled',
        'A test notification will appear in 3 seconds!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to schedule test notification. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  if (!isInitialized) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        <LinearGradient
          colors={[colors.headerGradientStart, colors.headerGradientEnd]}
          style={styles.gradientHeader}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notification Settings</Text>
          </View>
        </LinearGradient>
        
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Initializing notifications...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={styles.gradientHeader}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Settings</Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {/* Push Notifications Setting */}
        <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
          <View style={styles.settingHeader}>
            <View style={styles.settingIcon}>
              <Ionicons name="notifications" size={24} color={colors.buttonPrimary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Push Notifications
              </Text>
              <Text style={[styles.settingDescription, { color: colors.icon }]}>
                Receive notifications about orders, offers, and updates
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              disabled={loading}
              trackColor={{ false: colors.icon + '30', true: colors.buttonPrimary + '50' }}
              thumbColor={notificationsEnabled ? colors.buttonPrimary : colors.icon}
            />
          </View>
        </View>

        {/* Status Info */}
        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statusTitle, { color: colors.text }]}>Status</Text>
          
          <View style={styles.statusItem}>
            <Text style={[styles.statusLabel, { color: colors.icon }]}>Permissions:</Text>
            <Text style={[
              styles.statusValue,
              { color: hasPermissions ? '#34C759' : '#FF3B30' }
            ]}>
              {hasPermissions ? 'Granted' : 'Not Granted'}
            </Text>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={[styles.statusLabel, { color: colors.icon }]}>Push Token:</Text>
            <Text style={[
              styles.statusValue,
              { color: expoPushToken ? '#34C759' : colors.icon }
            ]}>
              {expoPushToken ? 'Available' : 'Not Available'}
            </Text>
          </View>
        </View>

        {/* Test Notification */}
        {hasPermissions && (
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.buttonPrimary }]}
            onPress={handleTestNotification}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={20} color="white" />
            <Text style={styles.testButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
        )}

        {/* Info Section */}
        <View style={[styles.infoCard, { backgroundColor: colors.buttonPrimary + '10' }]}>
          <Ionicons 
            name="information-circle" 
            size={20} 
            color={colors.buttonPrimary} 
            style={styles.infoIcon}
          />
          <Text style={[styles.infoText, { color: colors.text }]}>
            Push notifications will appear on your lock screen and notification bar even when the app is closed.
            You'll receive notifications for:
          </Text>
          <View style={styles.featureList}>
            <Text style={[styles.featureItem, { color: colors.icon }]}>• Order confirmations and updates</Text>
            <Text style={[styles.featureItem, { color: colors.icon }]}>• Special offers and promotions</Text>
            <Text style={[styles.featureItem, { color: colors.icon }]}>• New businesses and services</Text>
            <Text style={[styles.featureItem, { color: colors.icon }]}>• Important app announcements</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  settingCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.8,
  },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 20,
    gap: 8,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
  },
  infoIcon: {
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  featureList: {
    gap: 4,
  },
  featureItem: {
    fontSize: 13,
    lineHeight: 18,
  },
});
