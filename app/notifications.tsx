import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { 
  getAllNotifications, 
  markNotificationAsRead, 
  deleteNotification, 
  markAllNotificationsAsRead,
  deleteAllNotifications
} from '@/services/api';
import { Notification } from '@/types/api';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Colors } from '@/constants/Colors';

const getIconName = (iconString: string): keyof typeof Ionicons.glyphMap => {
  // Map heroicon names to Ionicons
  const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
    'heroicon-o-building-office-2': 'business-outline',
    'heroicon-o-bell': 'notifications-outline',
    'heroicon-o-star': 'star-outline',
    'heroicon-o-heart': 'heart-outline',
    'heroicon-o-chat-bubble-left-right': 'chatbubbles-outline',
    'heroicon-o-gift': 'gift-outline',
    'heroicon-o-megaphone': 'megaphone-outline',
    'heroicon-o-exclamation-triangle': 'warning-outline',
    'heroicon-o-information-circle': 'information-circle-outline',
    'heroicon-o-check-circle': 'checkmark-circle-outline',
  };
  
  return iconMap[iconString] || 'notifications-outline';
};

const getColorForNotification = (color: string): string => {
  const colorMap: { [key: string]: string } = {
    'warning': '#FF8C00',
    'danger': '#FF3B30',
    'success': '#34C759',
    'info': '#007AFF',
    'primary': '#6366f1',
  };
  
  return colorMap[color] || '#6366f1';
};

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
  onMarkAsRead: () => void;
  onDelete: () => void;
  colors: any;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onMarkAsRead,
  onDelete,
  colors,
}) => (
  <TouchableOpacity
    style={[
      styles.notificationItem,
      { backgroundColor: colors.card },
      !notification.is_read && { backgroundColor: colors.buttonPrimary + '10' }
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.notificationContent}>
      <View style={styles.notificationHeader}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={getIconName(notification.icon)}
            size={24}
            color={getColorForNotification(notification.color)}
          />
          {!notification.is_read && (
            <View style={[styles.unreadDot, { backgroundColor: colors.buttonPrimary }]} />
          )}
        </View>
        <View style={styles.notificationBody}>
          <Text style={[styles.notificationTitle, { color: colors.text }]} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={[styles.notificationMessage, { color: colors.icon }]} numberOfLines={2}>
            {notification.body}
          </Text>
          <Text style={[styles.notificationTime, { color: colors.icon }]}>
            {notification.time_ago}
          </Text>
        </View>
        <View style={styles.notificationActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color={colors.icon} />
          </TouchableOpacity>
          {!notification.is_read && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onMarkAsRead}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.buttonPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

export default function NotificationsScreen() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { refreshNotifications, markAsRead, removeNotification, clearAllNotifications } = useNotifications();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await getAllNotifications(pageNum);
      
      if (response.success) {
        if (pageNum === 1 || refresh) {
          setNotifications(response.data.notifications);
        } else {
          setNotifications(prev => [...prev, ...response.data.notifications]);
        }
        setHasMore(response.data.pagination.has_more);
        setPage(pageNum);
      } else {
        Alert.alert('Error', 'Failed to load notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to load notifications. Please check your internet connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    await fetchNotifications(1, true);
    await refreshNotifications();
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      fetchNotifications(page + 1);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      try {
        await markNotificationAsRead(notification.id);
        markAsRead(notification.id);
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notification.id 
              ? { ...notif, is_read: true, read_at: new Date().toISOString() }
              : notif
          )
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    // Handle navigation based on notification type if needed
    // For now, just mark as read
  };

  const handleMarkAsRead = async (notification: Notification) => {
    try {
      await markNotificationAsRead(notification.id);
      markAsRead(notification.id);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notification.id 
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const handleDeleteNotification = async (notification: Notification) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNotification(notification.id);
              removeNotification(notification.id);
              setNotifications(prev => prev.filter(notif => notif.id !== notification.id));
            } catch (error) {
              console.error('Error deleting notification:', error);
              Alert.alert('Error', 'Failed to delete notification');
            }
          }
        }
      ]
    );
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      );
      await refreshNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const handleClearAll = async () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllNotifications();
              setNotifications([]);
              clearAllNotifications();
            } catch (error) {
              console.error('Error clearing all notifications:', error);
              Alert.alert('Error', 'Failed to clear all notifications');
            }
          }
        }
      ]
    );
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <NotificationItem
      notification={item}
      onPress={() => handleNotificationPress(item)}
      onMarkAsRead={() => handleMarkAsRead(item)}
      onDelete={() => handleDeleteNotification(item)}
      colors={colors}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.tint} />
      </View>
    );
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>
        
        {notifications.length > 0 && (
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={[styles.headerAction, { backgroundColor: colors.buttonPrimary + '20' }]}
                onPress={handleMarkAllAsRead}
              >
                <Ionicons name="checkmark-done" size={18} color={colors.buttonPrimary} />
                <Text style={[styles.headerActionText, { color: colors.buttonPrimary }]}>
                  Mark All Read
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.headerAction, { backgroundColor: '#FF3B30' + '20' }]}
              onPress={handleClearAll}
            >
              <Ionicons name="trash" size={18} color="#FF3B30" />
              <Text style={[styles.headerActionText, { color: '#FF3B30' }]}>
                Clear All
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.icon }]}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.tint}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="notifications-outline" size={80} color={colors.icon} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notifications</Text>
              <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
                You're all caught up! We'll notify you when something important happens.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  headerActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
  },
  notificationItem: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
    marginTop: 2,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationBody: {
    flex: 1,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  notificationActions: {
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});
