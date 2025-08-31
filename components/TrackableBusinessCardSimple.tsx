import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBusinessTracking } from '@/hooks/useBusinessTracking';
import { Business } from '@/types/api';
import { getImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';

interface TrackableBusinessCardProps {
  business: Business;
  section: string;
  position: number;
  searchQuery?: string;
  colors: any;
}

/**
 * Enhanced Business Card with User Interaction Tracking
 * Drop-in replacement for existing business cards
 */
export const TrackableBusinessCard: React.FC<TrackableBusinessCardProps> = ({
  business,
  section,
  position,
  searchQuery,
  colors,
}) => {
  const router = useRouter();
  
  // Initialize tracking for this business
  const { trackClick, trackSearchClick } = useBusinessTracking(business.id, {
    autoTrackView: true,
    viewSource: 'home_screen',
    viewContext: {
      section,
      position,
      search_query: searchQuery,
    },
  });

  // Handle business card press with tracking
  const handlePress = () => {
    // Track the appropriate interaction type
    if (searchQuery) {
      trackSearchClick({
        section,
        position,
        search_query: searchQuery,
        element: 'business_card',
      });
    } else {
      trackClick({
        section,
        position,
        element: 'business_card',
      });
    }
    
    // Navigate to business details
    router.push(`/business/${business.id}` as any);
  };

  // Handle both old and new image structure
  const getBusinessImage = () => {
    if (business.images?.logo) {
      return getImageUrl(business.images.logo);
    }
    if (business.logo_image) {
      return getImageUrl(business.logo_image);
    }
    return getFallbackImageUrl('business');
  };

  // Format distance for display
  const formatDistance = (distance?: number | string) => {
    if (!distance) return null;
    if (typeof distance === 'string') {
      const numDistance = parseFloat(distance);
      if (numDistance < 1) {
        return `${Math.round(numDistance * 1000)}m`;
      }
      return `${numDistance.toFixed(1)}km`;
    }
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const distanceText = formatDistance(business.distance);

  return (
    <TouchableOpacity 
      style={[styles.businessCard, { backgroundColor: colors.card }]}
      onPress={handlePress}
    >
      <Image source={{ uri: getBusinessImage() }} style={styles.businessImage} />
      <View style={styles.businessInfo}>
        <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={1}>
          {business.business_name}
        </Text>
        <Text style={[styles.businessCategory, { color: colors.icon }]} numberOfLines={1}>
          {business.category_name} • {business.subcategory_name}
        </Text>
        {business.landmark && (
          <Text style={[styles.businessLandmark, { color: colors.icon }]} numberOfLines={1}>
            {business.landmark}
          </Text>
        )}
        <View style={styles.businessMeta}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={[styles.rating, { color: colors.text }]}>{business.overall_rating}</Text>
          </View>
          <View style={styles.metaRight}>
            {distanceText && (
              <Text style={[styles.distance, { color: colors.icon }]}>{distanceText}</Text>
            )}
            <Text style={[styles.priceRange, { color: colors.icon }]}>
              {'$'.repeat(business.price_range)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  businessCard: {
    width: 160,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  businessImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  businessInfo: {
    padding: 12,
  },
  businessName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  businessCategory: {
    fontSize: 12,
    marginBottom: 4,
  },
  businessLandmark: {
    fontSize: 11,
    marginBottom: 6,
  },
  businessMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distance: {
    fontSize: 11,
    marginRight: 8,
  },
  priceRange: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default TrackableBusinessCard;
