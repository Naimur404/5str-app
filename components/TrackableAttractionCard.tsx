import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { AttractionListItem } from '@/types/api';
import { useThemeColor } from '@/hooks/useThemeColor';
import { formatDistance } from '@/utils/distanceUtils';
import { Ionicons } from '@expo/vector-icons';
import SmartImage from './SmartImage';

const { width } = Dimensions.get('window');

interface TrackableAttractionCardProps {
  attraction: AttractionListItem;
  position?: number;
  section?: string;
  source?: string;
  searchQuery?: string;
  onPress?: () => void;
  showDistance?: boolean;
  style?: any;
}

/**
 * Enhanced Attraction Card with Distance Formatting
 * 
 * This component displays attraction information in a card format with
 * proper distance formatting and touch interactions.
 */
export default function TrackableAttractionCard({
  attraction,
  position = 1,
  section = 'unknown',
  source = 'attraction_list',
  searchQuery,
  onPress,
  showDistance = true,
  style,
}: TrackableAttractionCardProps) {
  const backgroundColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

  // Handle main card click
  const handleCardPress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  const formatRating = (rating: string | number) => {
    const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
    return isNaN(numRating) ? '0.0' : numRating.toFixed(1);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return '#4CAF50';
      case 'moderate':
        return '#FF9800';
      case 'hard':
        return '#F44336';
      default:
        return iconColor;
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'walk-outline';
      case 'moderate':
        return 'trail-sign-outline';
      case 'hard':
        return 'triangle-outline';
      default:
        return 'location-outline';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor,
        },
        style,
      ]}
      onPress={handleCardPress}
      activeOpacity={0.8}
    >
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <SmartImage
          source={{ uri: attraction.cover_image_url }}
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* Featured Badge */}
        {attraction.is_featured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={10} color="white" />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}

        {/* Free Badge */}
        {attraction.is_free && (
          <View style={styles.freeBadge}>
            <Text style={styles.freeText}>Free</Text>
          </View>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {attraction.name}
          </Text>
          
          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={[styles.rating, { color: iconColor }]}>
              {formatRating(attraction.overall_rating)}
            </Text>
          </View>
        </View>

        {/* Category and Location */}
        <View style={styles.metaRow}>
          <View style={styles.categoryContainer}>
            <Ionicons name="grid-outline" size={12} color={iconColor} />
            <Text style={[styles.category, { color: iconColor }]} numberOfLines={1}>
              {attraction.category}
            </Text>
          </View>
          
          {showDistance && attraction.distance && (
            <View style={styles.distanceContainer}>
              <Ionicons name="location-outline" size={12} color={tintColor} />
              <Text style={[styles.distance, { color: tintColor }]}>
                {formatDistance(attraction.distance)}
              </Text>
            </View>
          )}
        </View>

        {/* Description */}
        {attraction.description && (
          <Text style={[styles.description, { color: iconColor }]} numberOfLines={2}>
            {attraction.description}
          </Text>
        )}

        {/* Bottom Info Row */}
        <View style={styles.bottomRow}>
          {/* Difficulty */}
          {attraction.difficulty_level && (
            <View style={styles.infoItem}>
              <Ionicons 
                name={getDifficultyIcon(attraction.difficulty_level)} 
                size={12} 
                color={getDifficultyColor(attraction.difficulty_level)} 
              />
              <Text style={[
                styles.infoText, 
                { color: getDifficultyColor(attraction.difficulty_level) }
              ]}>
                {attraction.difficulty_level.charAt(0).toUpperCase() + attraction.difficulty_level.slice(1)}
              </Text>
            </View>
          )}

          {/* Duration */}
          {attraction.estimated_duration_minutes > 0 && (
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={12} color={iconColor} />
              <Text style={[styles.infoText, { color: iconColor }]}>
                {formatDuration(attraction.estimated_duration_minutes)}
              </Text>
            </View>
          )}

          {/* Reviews Count */}
          <View style={styles.infoItem}>
            <Ionicons name="chatbubble-outline" size={12} color={iconColor} />
            <Text style={[styles.infoText, { color: iconColor }]}>
              {attraction.total_reviews}
            </Text>
          </View>

          {/* Views Count */}
          <View style={styles.infoItem}>
            <Ionicons name="eye-outline" size={12} color={iconColor} />
            <Text style={[styles.infoText, { color: iconColor }]}>
              {attraction.total_views}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: width - 40,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 180,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  featuredText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  freeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  freeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  category: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distance: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    opacity: 0.8,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 11,
    fontWeight: '500',
  },
});