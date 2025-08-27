import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { AppState, AppStateStatus } from 'react-native';
import { pushNotificationService } from '@/services/pushNotifications';

interface PushNotificationContextType {
  expoPushToken: string | null;
  hasPermissions: boolean;
  isInitialized: boolean;
  requestPermissions: () => Promise<boolean>;
  sendTokenToServer: (userId?: string) => Promise<boolean>;
  scheduleTestNotification: (delay?: number) => Promise<void>;
  setBadgeCount: (count: number) => Promise<void>;
  clearBadge: () => Promise<void>;
}

const PushNotificationContext = createContext<PushNotificationContextType | undefined>(undefined);

export const usePushNotifications = () => {
  const context = useContext(PushNotificationContext);
  if (!context) {
    throw new Error('usePushNotifications must be used within a PushNotificationProvider');
  }
  return context;
};

interface PushNotificationProviderProps {
  children: React.ReactNode;
}

export const PushNotificationProvider: React.FC<PushNotificationProviderProps> = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    initializePushNotifications();

    // Set up listeners
    notificationListener.current = pushNotificationService.addNotificationReceivedListener(
      handleNotificationReceived
    );

    responseListener.current = pushNotificationService.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    // App state listener
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      appStateSubscription?.remove();
    };
  }, []);

  const initializePushNotifications = async () => {
    try {
      console.log('Initializing push notifications...');
      
      // Check current permissions
      const hasPerms = await pushNotificationService.hasPermissions();
      setHasPermissions(hasPerms);

      if (hasPerms) {
        // Register and get token
        const token = await pushNotificationService.registerForPushNotifications();
        if (token) {
          setExpoPushToken(token);
          console.log('Push notification token obtained:', token);
          
          // Optionally send to server immediately
          // await pushNotificationService.sendTokenToServer(token);
        }
      } else {
        console.log('Push notification permissions not granted');
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      setIsInitialized(true);
    }
  };

  const handleNotificationReceived = (notification: Notifications.Notification) => {
    console.log('📱 Notification received in foreground:', notification);
    
    // You can customize foreground notification behavior here
    // For example, show a custom in-app banner or update UI
    
    // The notification will still show in the system notification bar
    // thanks to the notification handler configuration
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    console.log('📱 User tapped notification:', response);
    
    const data = response.notification.request.content.data;
    
    // Handle navigation based on notification data
    if (data?.type === 'order') {
      // Navigate to order details
      console.log('Navigate to order:', data.orderId);
    } else if (data?.type === 'business') {
      // Navigate to business details
      console.log('Navigate to business:', data.businessId);
    } else if (data?.type === 'offer') {
      // Navigate to offer details
      console.log('Navigate to offer:', data.offerId);
    }
    
    // You can use your navigation system here
    // router.push(`/business/${data.businessId}`);
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to the foreground!');
      // Clear badge when app becomes active
      pushNotificationService.clearBadge();
    }
    appState.current = nextAppState;
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const granted = await pushNotificationService.requestPermissions();
      setHasPermissions(granted);
      
      if (granted) {
        // Register for notifications if permissions granted
        const token = await pushNotificationService.registerForPushNotifications();
        if (token) {
          setExpoPushToken(token);
        }
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  const sendTokenToServer = async (userId?: string): Promise<boolean> => {
    if (!expoPushToken) {
      console.log('No push token available');
      return false;
    }
    
    try {
      return await pushNotificationService.sendTokenToServer(expoPushToken, userId);
    } catch (error) {
      console.error('Error sending token to server:', error);
      return false;
    }
  };

  const scheduleTestNotification = async (delay: number = 5): Promise<void> => {
    try {
      await pushNotificationService.scheduleLocalNotification({
        title: '🎉 Test Notification',
        body: 'This is a test notification from your 5str app!',
        data: { type: 'test', timestamp: Date.now() },
        sound: true,
        badge: 1,
      }, delay);
      
      console.log(`Test notification scheduled for ${delay} seconds`);
    } catch (error) {
      console.error('Error scheduling test notification:', error);
    }
  };

  const setBadgeCount = async (count: number): Promise<void> => {
    try {
      await pushNotificationService.setBadgeCount(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  };

  const clearBadge = async (): Promise<void> => {
    try {
      await pushNotificationService.clearBadge();
    } catch (error) {
      console.error('Error clearing badge:', error);
    }
  };

  const value: PushNotificationContextType = {
    expoPushToken,
    hasPermissions,
    isInitialized,
    requestPermissions,
    sendTokenToServer,
    scheduleTestNotification,
    setBadgeCount,
    clearBadge,
  };

  return (
    <PushNotificationContext.Provider value={value}>
      {children}
    </PushNotificationContext.Provider>
  );
};

export default PushNotificationContext;
