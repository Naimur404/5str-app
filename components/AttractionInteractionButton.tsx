import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { ThemedText } from './ThemedText';

interface AttractionInteractionButtonProps {
  type: 'like' | 'bookmark' | 'share' | 'wishlist';
  isActive: boolean;
  loading?: boolean;
  onPress: () => void;
  count?: number;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
  style?: any;
  disabled?: boolean;
}

const iconMap = {
  like: 'heart-outline' as const,
  bookmark: 'bookmark-outline' as const,
  share: 'share-outline' as const,
  wishlist: 'star-outline' as const,
};

const activeIconMap = {
  like: 'heart' as const,
  bookmark: 'bookmark' as const,
  share: 'share' as const,
  wishlist: 'star' as const,
};

const sizeMap = {
  small: {
    icon: 20,
    padding: 8,
    fontSize: 11,
    borderRadius: 10,
  },
  medium: {
    icon: 24,
    padding: 8,
    fontSize: 14,
    borderRadius: 8,
  },
  large: {
    icon: 28,
    padding: 12,
    fontSize: 16,
    borderRadius: 12,
  },
};

export const AttractionInteractionButton: React.FC<AttractionInteractionButtonProps> = ({
  type,
  isActive,
  loading = false,
  onPress,
  count,
  size = 'medium',
  showCount = true,
  style,
  disabled = false,
}) => {
  const primaryColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({}, 'card'); // Use card color instead of background
  const secondaryText = useThemeColor({}, 'tabIconDefault');
  
  const sizeConfig = sizeMap[size];
  
  const getActiveColor = () => {
    switch (type) {
      case 'like':
        return '#FF6B6B';
      case 'bookmark':
        return '#4ECDC4';
      case 'wishlist':
        return '#FFD93D';
      case 'share':
        return primaryColor;
      default:
        return primaryColor;
    }
  };

  const iconColor = isActive ? getActiveColor() : secondaryText;
  const countColor = isActive ? getActiveColor() : secondaryText;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          padding: sizeConfig.padding,
          opacity: disabled ? 0.5 : 1,
          backgroundColor: isActive ? getActiveColor() + '18' : 'transparent',
          borderWidth: isActive ? 1.5 : 0,
          borderColor: isActive ? getActiveColor() + '40' : 'transparent',
          borderRadius: sizeConfig.borderRadius,
          minWidth: 44, // Better touch target
          minHeight: 36, // Better touch target for small buttons
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.6}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={iconColor} />
        ) : (
          <Ionicons
            name={isActive ? activeIconMap[type] : iconMap[type]}
            size={sizeConfig.icon}
            color={iconColor}
          />
        )}
        
        {showCount && count !== undefined && count > 0 && (
          <ThemedText
            style={[
              styles.count,
              {
                color: countColor,
                fontSize: sizeConfig.fontSize,
                marginLeft: 4,
              },
            ]}
          >
            {count > 999 ? `${Math.floor(count / 1000)}k` : count.toString()}
          </ThemedText>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    // borderRadius will be set dynamically
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontWeight: '600',
    marginTop: 1, // Small adjustment for better alignment
  },
});