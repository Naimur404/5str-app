import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Collection } from '@/types/api';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { getImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';
import ProfileAvatar from './ProfileAvatar';
import SmartImage from './SmartImage';

const { width } = Dimensions.get('window');

interface CollectionCardProps {
  collection: Collection;
  onPress: () => void;
  onFollow?: () => void;
  onUnfollow?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showFollowButton?: boolean;
  showOwner?: boolean;
  showActions?: boolean;
  style?: any;
}

const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  onPress,
  onFollow,
  onUnfollow,
  onEdit,
  onDelete,
  showFollowButton = false,
  showOwner = true,
  showActions = false,
  style,
}) => {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  const handleFollowPress = (e: any) => {
    e.stopPropagation();
    if (collection.is_following && onUnfollow) {
      onUnfollow();
    } else if (onFollow) {
      onFollow();
    }
  };

  const getCoverImageUrl = () => {
    if (collection.cover_image) {
      // Handle base64 images
      if (collection.cover_image.startsWith('data:image/')) {
        return collection.cover_image;
      }
      // Handle URL images
      return getImageUrl(collection.cover_image);
    }
    // Use first business image as fallback
    if (collection.businesses && collection.businesses.length > 0) {
      return getImageUrl(collection.businesses[0].image_url);
    }
    return null;
  };

  return (
    <TouchableOpacity 
      style={[styles.favoriteCard, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.favoriteRow}>
        <View style={styles.favoriteImageContainer}>
          <SmartImage
            source={getCoverImageUrl()}
            type="business"
            style={styles.favoriteImage}
          />
          
          {/* Privacy indicator */}
          {!collection.is_public && (
            <View style={styles.privacyBadge}>
              <Ionicons name="lock-closed" size={10} color="#FFFFFF" />
            </View>
          )}
        </View>

        <View style={styles.favoriteContent}>
          <View style={styles.favoriteMainInfo}>
            <Text style={[styles.favoriteName, { color: colors.text }]} numberOfLines={1}>
              {collection.name}
            </Text>
            {collection.description && (
              <Text style={[styles.favoriteCategory, { color: colors.icon }]} numberOfLines={1}>
                {collection.description}
              </Text>
            )}
          </View>
          
          <View style={styles.favoriteMetrics}>
            <View style={styles.ratingRow}>
              <Ionicons name="business" size={12} color="#6366F1" />
              <Text style={[styles.ratingText, { color: colors.text }]}>
                {collection.businesses_count}
              </Text>
              {collection.is_public && (
                <>
                  <Ionicons name="people" size={12} color="#6366F1" style={{ marginLeft: 8 }} />
                  <Text style={[styles.reviewCountText, { color: colors.text }]}>
                    {collection.followers_count}
                  </Text>
                </>
              )}
            </View>
            
            <Text style={[styles.dateText, { color: colors.icon }]}>
              {new Date(collection.updated_at).toLocaleDateString()}
            </Text>
          </View>

          {showOwner && collection.user && (
            <View style={styles.locationContainer}>
              <ProfileAvatar
                profileImage={collection.user.profile_image || null}
                userName={collection.user.name}
                size={16}
                style={styles.ownerAvatar}
              />
              <Text style={[styles.locationText, { color: colors.icon }]} numberOfLines={1}>
                by {collection.user.name}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.favoriteActions}>
          {showFollowButton ? (
            <TouchableOpacity
              style={[
                styles.followButton,
                {
                  backgroundColor: collection.is_following ? 'transparent' : colors.buttonPrimary,
                  borderWidth: collection.is_following ? 1 : 0,
                  borderColor: collection.is_following ? colors.border : 'transparent',
                }
              ]}
              onPress={handleFollowPress}
            >
              <Ionicons 
                name={collection.is_following ? "checkmark" : "add"} 
                size={12} 
                color={collection.is_following ? colors.text : colors.buttonText} 
              />
            </TouchableOpacity>
          ) : showActions ? (
            <View style={styles.actionButtons}>
              {onEdit && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.buttonPrimary + '20' }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={16} color={colors.buttonPrimary} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={[styles.typeBadge, { backgroundColor: colors.buttonPrimary + '20' }]}>
              <Text style={[styles.typeBadgeText, { color: colors.buttonPrimary }]}>
                {collection.is_public ? 'Public' : 'Private'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  favoriteCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  favoriteRow: {
    flexDirection: 'row',
    padding: 12,
  },
  favoriteImageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  favoriteImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  privacyBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  favoriteContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  favoriteMainInfo: {
    marginBottom: 6,
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 20,
  },
  favoriteCategory: {
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.7,
  },
  favoriteMetrics: {
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
    marginRight: 4,
  },
  reviewCountText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  dateText: {
    fontSize: 11,
    opacity: 0.6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ownerAvatar: {
    marginRight: 4,
  },
  locationText: {
    fontSize: 12,
    flex: 1,
    opacity: 0.6,
  },
  favoriteActions: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CollectionCard;
