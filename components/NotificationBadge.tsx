import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NotificationBadgeProps {
  count: number;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  textColor?: string;
  maxCount?: number;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  size = 'medium',
  color = '#FF3B30',
  textColor = 'white',
  maxCount = 99,
}) => {
  if (count <= 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  
  const sizeConfig = {
    small: { minWidth: 16, height: 16, fontSize: 10, borderRadius: 8 },
    medium: { minWidth: 20, height: 20, fontSize: 11, borderRadius: 10 },
    large: { minWidth: 24, height: 24, fontSize: 12, borderRadius: 12 },
  };

  const config = sizeConfig[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color,
          minWidth: config.minWidth,
          height: config.height,
          borderRadius: config.borderRadius,
        },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            color: textColor,
            fontSize: config.fontSize,
          },
        ]}
      >
        {displayCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
