import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUnreadNotifications, isAuthenticated } from '@/services/api';
import { Notification, NotificationStats } from '@/types/api';

interface NotificationContextType {
  unreadCount: number;
  notifications: Notification[];
  stats: NotificationStats | null;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => void;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
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

  const refreshNotifications = async () => {
    try {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        setUnreadCount(0);
        setNotifications([]);
        setStats(null);
        return;
      }

      setLoading(true);
      const response = await getUnreadNotifications();
      
      if (response.success) {
        setNotifications(response.data.notifications);
        setStats(response.data.stats);
        setUnreadCount(response.data.stats.unread_count);
      } else {
        console.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
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
  };

  // Initial load
  useEffect(() => {
    refreshNotifications();
  }, []);

  // Refresh notifications every 30 seconds if user is on the app
  useEffect(() => {
    const interval = setInterval(refreshNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const value: NotificationContextType = {
    unreadCount,
    notifications,
    stats,
    loading,
    refreshNotifications,
    markAsRead,
    removeNotification,
    clearAllNotifications,
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
