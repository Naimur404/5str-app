import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushNotificationData {
  title: string;
  body: string;
  data?: any;
  categoryId?: string;
  sound?: boolean;
  badge?: number;
}

class PushNotificationService {
  private expoPushToken: string | null = null;

  // Register for push notifications and get token
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          enableVibrate: true,
          showBadge: true,
        });

        // Create additional channels for different types
        await Notifications.setNotificationChannelAsync('orders', {
          name: 'Order Updates',
          description: 'Notifications about your orders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          enableVibrate: true,
          showBadge: true,
        });

        await Notifications.setNotificationChannelAsync('promotions', {
          name: 'Promotions & Offers',
          description: 'Special offers and promotions',
          importance: Notifications.AndroidImportance.DEFAULT,
          enableVibrate: false,
          showBadge: true,
        });

        await Notifications.setNotificationChannelAsync('general', {
          name: 'General Updates',
          description: 'General app notifications',
          importance: Notifications.AndroidImportance.DEFAULT,
          enableVibrate: true,
          showBadge: true,
        });
      }

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('Failed to get push token for push notification!');
          return null;
        }

        // Get the expo push token
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        
        if (!projectId) {
          console.log('Project ID not found');
          return null;
        }

        const token = await Notifications.getExpoPushTokenAsync({
          projectId,
        });

        this.expoPushToken = token.data;
        console.log('Expo Push Token:', this.expoPushToken);
        return this.expoPushToken;
      } else {
        console.log('Must use physical device for Push Notifications');
        return null;
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  // Get current push token
  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  // Send token to your backend
  async sendTokenToServer(token: string, userId?: string): Promise<boolean> {
    try {
      // Replace with your actual API endpoint
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/push-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          platform: Platform.OS,
          userId,
          deviceId: Constants.installationId,
        }),
      });

      const result = await response.json();
      console.log('Token sent to server:', result);
      return result.success;
    } catch (error) {
      console.error('Error sending token to server:', error);
      return false;
    }
  }

  // Schedule a local notification (for testing)
  async scheduleLocalNotification(notification: PushNotificationData, delay: number = 0): Promise<string> {
    if (delay > 0) {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound !== false ? 'default' : undefined,
          badge: notification.badge,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: delay },
      });
      return identifier;
    } else {
      await this.showLocalNotification(notification);
      return 'immediate';
    }
  }

  // Show immediate local notification
  async showLocalNotification(notification: PushNotificationData): Promise<void> {
    await Notifications.presentNotificationAsync({
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      sound: notification.sound !== false ? 'default' : undefined,
      badge: notification.badge,
    });
  }

  // Listen for notification responses (when user taps notification)
  addNotificationResponseReceivedListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Listen for notifications received while app is in foreground
  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  // Cancel all scheduled notifications
  async cancelAllScheduledNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Cancel specific notification
  async cancelNotification(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  // Get badge count
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  // Set badge count
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  // Clear badge
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  // Request permissions explicitly
  async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    return status === 'granted';
  }

  // Check if permissions are granted
  async hasPermissions(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
