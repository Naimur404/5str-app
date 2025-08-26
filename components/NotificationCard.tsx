import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Notification } from '@/types/api';

interface NotificationCardProps {
  notification: Notification;
  onPress: () => void;
  onMarkAsRead?: () => void;
  onDelete?: () => void;
  colors: any;
  showActions?: boolean;
}

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

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
  onMarkAsRead,
  onDelete,
  colors,
  showActions = true,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.card },
        !notification.is_read && { backgroundColor: colors.buttonPrimary + '10' }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
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
          
          <View style={styles.body}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {notification.title}
            </Text>
            <Text style={[styles.message, { color: colors.icon }]} numberOfLines={2}>
              {notification.body}
            </Text>
            <Text style={[styles.time, { color: colors.icon }]}>
              {notification.time_ago}
            </Text>
          </View>
          
          {showActions && (
            <View style={styles.actions}>
              {onDelete && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={onDelete}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.icon} />
                </TouchableOpacity>
              )}
              {!notification.is_read && onMarkAsRead && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={onMarkAsRead}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.buttonPrimary} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
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
  content: {
    padding: 16,
  },
  header: {
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
  body: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
    opacity: 0.7,
  },
  actions: {
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
});
