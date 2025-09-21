import React, { useState } from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { AttractionInteractionButton } from './AttractionInteractionButton';
import { RecordVisitModal } from './RecordVisitModal';
import { useAttractionInteraction } from '@/hooks/useAttractionInteraction';
import { useAttractionTracking } from '@/hooks/useAttractionTracking';
import { useThemeColor } from '@/hooks/useThemeColor';
import { FeaturedAttraction } from '@/types/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 cards per row with padding

interface AttractionCardProps {
  attraction: FeaturedAttraction;
  style?: any;
  onPress?: () => void;
}

export const AttractionCard: React.FC<AttractionCardProps> = ({
  attraction,
  style,
  onPress,
}) => {
  const [showVisitModal, setShowVisitModal] = useState(false);
  
  const {
    isLiked,
    isBookmarked,
    loading,
    like,
    bookmark,
  } = useAttractionInteraction(attraction.id);

  // Attraction tracking
  const { trackClick, trackLike, trackBookmark, trackShare } = useAttractionTracking(attraction.id, {
    autoTrackView: true,
    viewSource: 'attraction_card',
  });

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = useThemeColor({}, 'tabIconDefault');
  const borderColor = useThemeColor({}, 'border');

  const handleCardPress = () => {
    trackClick({ element: 'card' });
    if (onPress) {
      onPress();
    } else {
      router.push(`/attraction/${attraction.id}`);
    }
  };

  const handleLike = async () => {
    try {
      await like();
      trackLike(!isLiked, { element: 'like_button' });
    } catch (error) {
      console.error('Error liking attraction:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      await bookmark();
      trackBookmark(!isBookmarked, { element: 'bookmark_button' });
    } catch (error) {
      console.error('Error bookmarking attraction:', error);
    }
  };

  const handleRecordVisit = () => {
    setShowVisitModal(true);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatRating = (rating: number) => {
    return rating.toFixed(1);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.container,
          { backgroundColor, borderColor },
          style,
        ]}
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: attraction.cover_image_url }}
            style={styles.image}
            resizeMode="cover"
          />
          
          {/* Overlay for interactions */}
          <View style={styles.overlay}>
            <View style={styles.topRow}>
              {attraction.is_free && (
                <View style={styles.freeTag}>
                  <ThemedText style={styles.freeText}>FREE</ThemedText>
                </View>
              )}
              
              <AttractionInteractionButton
                type="bookmark"
                isActive={isBookmarked}
                loading={loading}
                onPress={handleBookmark}
                size="small"
                showCount={false}
                style={styles.bookmarkButton}
              />
            </View>
            
            <View style={styles.bottomRow}>
              <AttractionInteractionButton
                type="like"
                isActive={isLiked}
                loading={loading}
                onPress={handleLike}
                size="small"
                showCount={false}
                style={styles.likeButton}
              />
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <ThemedText style={styles.name} numberOfLines={2}>
            {attraction.name}
          </ThemedText>
          
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={secondaryTextColor} />
            <ThemedText style={[styles.location, { color: secondaryTextColor }]} numberOfLines={1}>
              {attraction.area}, {attraction.city}
            </ThemedText>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <ThemedText style={styles.rating}>
                {formatRating(attraction.overall_rating)}
              </ThemedText>
              <ThemedText style={[styles.reviewCount, { color: secondaryTextColor }]}>
                ({attraction.total_reviews})
              </ThemedText>
            </View>
            
            {attraction.estimated_duration_minutes > 0 && (
              <View style={styles.durationContainer}>
                <Ionicons name="time-outline" size={14} color={secondaryTextColor} />
                <ThemedText style={[styles.duration, { color: secondaryTextColor }]}>
                  {formatDuration(attraction.estimated_duration_minutes)}
                </ThemedText>
              </View>
            )}
          </View>

          {!attraction.is_free && (
            <View style={styles.priceRow}>
              <ThemedText style={styles.price}>
                {attraction.entry_fee} {attraction.currency}
              </ThemedText>
            </View>
          )}

          <TouchableOpacity
            style={styles.visitButton}
            onPress={handleRecordVisit}
          >
            <Ionicons name="add-circle-outline" size={16} color="#007AFF" />
            <ThemedText style={styles.visitButtonText}>Record Visit</ThemedText>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      <RecordVisitModal
        visible={showVisitModal}
        onClose={() => setShowVisitModal(false)}
        attractionId={attraction.id}
        attractionName={attraction.name}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    height: 140,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 8,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  freeTag: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bookmarkButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 6,
  },
  likeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 6,
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 2,
  },
  location: {
    fontSize: 12,
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 12,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  duration: {
    fontSize: 12,
  },
  priceRow: {
    marginBottom: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  visitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 4,
  },
  visitButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
});