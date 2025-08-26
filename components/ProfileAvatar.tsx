import React from 'react';
import { View, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';
import { getRandomHumanIcon } from '@/utils/avatarUtils';

interface ProfileAvatarProps {
  profileImage: string | null;
  userName: string;
  size?: number;
  style?: ViewStyle | ImageStyle;
  seed?: string; // Used to ensure consistent random icon for same user
}

export default function ProfileAvatar({ 
  profileImage, 
  userName, 
  size = 60, 
  style,
  seed 
}: ProfileAvatarProps) {
  const [imageError, setImageError] = React.useState(false);
  const imageUrl = getImageUrl(profileImage);
  
  // Get random icon based on seed (user email, ID, or name)
  const randomIcon = getRandomHumanIcon(seed || userName);
  
  // Show random icon if no image or image failed to load
  if (!imageUrl || imageError) {
    return (
      <View 
        style={[
          styles.iconContainer, 
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            backgroundColor: randomIcon.color + '20',
          },
          style
        ]}
      >
        <Ionicons 
          name={randomIcon.name} 
          size={size * 0.6} 
          color={randomIcon.color} 
        />
      </View>
    );
  }
  
  return (
    <Image 
      source={{ uri: imageUrl }}
      style={[
        styles.profileImage, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2 
        },
        style as ImageStyle
      ]}
      onError={() => setImageError(true)}
      defaultSource={{ uri: getFallbackImageUrl('user') }}
    />
  );
}

const styles = StyleSheet.create({
  profileImage: {
    borderWidth: 2,
    borderColor: 'white',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
});
