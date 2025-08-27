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
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { useToastGlobal } from '@/contexts/ToastContext';
import { Colors } from '@/constants/Colors';
import { NotificationPageSkeleton } from '@/components/SkeletonLoader';
import CustomAlert from '@/components/CustomAlert';
import { useCustomAlert } from '@/hooks/useCustomAlert';

const { width } = Dimensions.get('window');

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
      !notification.is_read && { 
        backgroundColor: colors.buttonPrimary + '08',
        borderLeftWidth: 4,
        borderLeftColor: colors.buttonPrimary
      }
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.notificationContent}>
      <View style={styles.notificationMain}>
        <View style={styles.iconContainer}>
          <View style={[
            styles.iconWrapper,
            { backgroundColor: getColorForNotification(notification.color) + '15' }
          ]}>
            <Ionicons
              name={getIconName(notification.icon)}
              size={18}
              color={getColorForNotification(notification.color)}
            />
          </View>
          {!notification.is_read && (
            <View style={[styles.unreadIndicator, { backgroundColor: colors.buttonPrimary }]} />
          )}
        </View>
        
        <View style={styles.notificationBody}>
          <View style={styles.notificationHeader}>
            <Text style={[styles.notificationTitle, { color: colors.text }]} numberOfLines={1}>
              {notification.title}
            </Text>
            <Text style={[styles.notificationTime, { color: colors.icon }]}>
              {notification.time_ago}
            </Text>
          </View>
          <Text style={[styles.notificationMessage, { color: colors.icon }]} numberOfLines={2}>
            {notification.body}
          </Text>
          
          {/* Status indicator */}
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusDot,
              { backgroundColor: notification.is_read ? colors.icon + '30' : colors.buttonPrimary }
            ]} />
            <Text style={[styles.statusText, { color: colors.icon }]}>
              {notification.is_read ? 'Read' : 'Unread'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.icon + '10' }]}
          onPress={onDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={16} color="#FF3B30" />
        </TouchableOpacity>
        {!notification.is_read && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.buttonPrimary + '15' }]}
            onPress={onMarkAsRead}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="checkmark" size={16} color={colors.buttonPrimary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

export default function NotificationsScreen() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { refreshNotifications, markAsRead, removeNotification, clearAllNotifications, newNotifications } = useNotifications();
  const { alertConfig, showConfirm, hideAlert } = useCustomAlert();
  const { showSuccess, showInfo } = useToastGlobal();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Watch for new notifications and show alerts
  useEffect(() => {
    if (newNotifications.length > 0) {
      if (newNotifications.length === 1) {
        const latestNotif = newNotifications[0];
        // Create a messenger-style notification
        const message = latestNotif.body.length > 50 
          ? `${latestNotif.body.substring(0, 47)}...` 
          : latestNotif.body;
        showInfo(`📢 ${latestNotif.title}\n${message}`, 5000);
      } else {
        showInfo(`📢 ${newNotifications.length} new notifications received`, 4000);
      }
    }
  }, [newNotifications, showInfo]);

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
    showConfirm(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications? This action cannot be undone.',
      async () => {
        try {
          console.log('Attempting to clear all notifications...');
          const response = await deleteAllNotifications();
          console.log('Clear all notifications response:', response);
          
          if (response.success) {
            setNotifications([]);
            clearAllNotifications();
            showSuccess('All clear! Your notifications have been deleted successfully');
          } else {
            console.error('Failed to clear notifications:', response);
            Alert.alert('Error', response.message || 'Failed to clear all notifications');
          }
        } catch (error) {
          console.error('Error clearing all notifications:', error);
          Alert.alert('Error', 'Failed to clear all notifications. Please try again.');
        }
      }
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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <NotificationPageSkeleton colors={colors} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      {/* Header with gradient */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={styles.gradientHeader}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Notifications</Text>
              <View style={styles.subtitleRow}>
                {unreadCount > 0 ? (
                  <Text style={styles.headerSubtitle}>
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </Text>
                ) : (
                  <Text style={styles.headerSubtitle}>
                    All notifications are read
                  </Text>
                )}
                
                {/* Action buttons */}
                {notifications.length > 0 && (
                  <View style={styles.actionButtonsRow}>
                    {unreadCount > 0 && (
                      <TouchableOpacity
                        style={[styles.headerActionButton, { backgroundColor: colors.buttonPrimary }]}
                        onPress={handleMarkAllAsRead}
                      >
                        <Ionicons name="checkmark-done" size={16} color="white" />
                        <Text style={styles.headerActionText}>Mark All Read</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.headerActionButton, styles.deleteButton]}
                      onPress={handleClearAll}
                    >
                      <Ionicons name="trash" size={16} color="white" />
                      <Text style={styles.headerActionText}>Clear All</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
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
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.buttonPrimary + '20' }]}>
              <Ionicons name="notifications-outline" size={48} color={colors.buttonPrimary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notifications</Text>
            <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
              You're all caught up! We'll notify you when something important happens.
            </Text>
          </View>
        }
      />

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
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
    paddingHorizontal: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    flex: 1,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.3)',
  },
  headerActionText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
  },
  listContainer: {
    paddingVertical: 12,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
  },
  notificationItem: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    // Removed shadow properties for cleaner look
  },
  notificationContent: {
    padding: 12,
  },
  notificationMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadIndicator: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: 'white',
  },
  notificationBody: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  notificationTime: {
    fontSize: 11,
    opacity: 0.7,
    marginTop: 2,
  },
  notificationMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
    opacity: 0.8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.7,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.7,
  },
});
