import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { AppState, AppStateStatus, Alert } from 'react-native';
import { getUnreadNotifications, isAuthenticated } from '@/services/api';
import { Notification, NotificationStats } from '@/types/api';

interface NotificationContextType {
  unreadCount: number;
  notifications: Notification[];
  stats: NotificationStats | null;
  loading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => void;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  clearError: () => void;
  newNotifications: Notification[]; // Add this to track new notifications
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newNotifications, setNewNotifications] = useState<Notification[]>([]);
  const previousNotificationIds = useRef<Set<string>>(new Set());

  const refreshNotifications = async () => {
    console.log('[NotificationContext] refreshNotifications called');
    try {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        setUnreadCount(0);
        setNotifications([]);
        setStats(null);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      console.log('[NotificationContext] Fetching notifications...');
      const response = await getUnreadNotifications();
      
      if (response.success) {
        const newNotifications = response.data.notifications;
        const currentNotificationIds = new Set(newNotifications.map(n => n.id));
        
        // Check for new notifications (only if we have previous data)
        if (previousNotificationIds.current.size > 0) {
          const newNotifs = newNotifications.filter(notif => 
            !previousNotificationIds.current.has(notif.id) && !notif.is_read
          );
          
          console.log('[NotificationContext] Previous IDs:', Array.from(previousNotificationIds.current));
          console.log('[NotificationContext] Current IDs:', Array.from(currentNotificationIds));
          console.log('[NotificationContext] New notifications found:', newNotifs.length);
          
          // Show popup alert for new notifications
          if (newNotifs.length > 0) {
            console.log('[NotificationContext] Showing alert for new notifications');
            if (newNotifs.length === 1) {
              const latestNotif = newNotifs[0];
              // Create a messenger-style notification
              const message = latestNotif.body.length > 80 
                ? `${latestNotif.body.substring(0, 77)}...` 
                : latestNotif.body;
              Alert.alert('📢 New Notification', `${latestNotif.title}\n\n${message}`, 
                [{ text: 'OK', style: 'default' }],
                { cancelable: true }
              );
            } else {
              Alert.alert('📢 New Notifications', `You have ${newNotifs.length} new notifications`, 
                [{ text: 'OK', style: 'default' }],
                { cancelable: true }
              );
            }
            
            // Set new notifications for screen-level alerts too
            setNewNotifications(newNotifs);
            // Clear after a short delay to prevent showing multiple times
            setTimeout(() => setNewNotifications([]), 5000);
          }
        }
        
        // Update state
        setNotifications(newNotifications);
        setStats(response.data.stats);
        setUnreadCount(response.data.stats.unread_count);
        
        // Update previous notification IDs for next comparison
        previousNotificationIds.current = currentNotificationIds;
      } else {
        setError('Failed to fetch notifications');
        console.error('Failed to fetch notifications');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notifications';
      setError(errorMessage);
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, is_read: true, read_at: new Date().toISOString() }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    if (stats) {
      setStats(prev => prev ? {
        ...prev,
        unread_count: Math.max(0, prev.unread_count - 1),
        read_count: prev.read_count + 1
      } : null);
    }
  };

  const removeNotification = (notificationId: string) => {
    const notification = notifications.find(notif => notif.id === notificationId);
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    
    if (notification && !notification.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    if (stats) {
      setStats(prev => prev ? {
        ...prev,
        total_count: prev.total_count - 1,
        unread_count: notification && !notification.is_read 
          ? Math.max(0, prev.unread_count - 1) 
          : prev.unread_count,
        read_count: notification && notification.is_read 
          ? Math.max(0, prev.read_count - 1) 
          : prev.read_count
      } : null);
    }
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    setStats(null);
    previousNotificationIds.current.clear();
  };

  // Initial load
  useEffect(() => {
    refreshNotifications();
  }, []);

  // Refresh notifications every 30 seconds for testing (normally 2 minutes)
  useEffect(() => {
    const interval = setInterval(refreshNotifications, 30000); // 30 seconds for testing
    return () => clearInterval(interval);
  }, []);

  // Handle app state changes to refresh when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Refresh notifications when app becomes active
        refreshNotifications();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  const value: NotificationContextType = {
    unreadCount,
    notifications,
    stats,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    removeNotification,
    clearAllNotifications,
    clearError,
    newNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
