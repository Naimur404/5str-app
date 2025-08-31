import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { useBusinessTracking } from '@/hooks/useBusinessTracking';
import { Business } from '@/services/api';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';
import SmartImage from './SmartImage';

interface TrackableBusinessCardProps {
  business: Business;
  position?: number;
  section?: string;
  source?: string;
  searchQuery?: string;
  onPress?: () => void;
  showFavorite?: boolean;
  onFavoritePress?: (businessId: number, isFavoriting: boolean) => void;
}

/**
 * Enhanced Business Card with Comprehensive Tracking
 * 
 * This component demonstrates how to integrate user interaction tracking
 * into your existing business card components.
 */
export default function TrackableBusinessCard({
  business,
  position = 1,
  section = 'unknown',
  source = 'business_list',
  searchQuery,
  onPress,
  showFavorite = true,
  onFavoritePress,
}: TrackableBusinessCardProps) {
  const backgroundColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  
  // Initialize tracking for this business
  const {
    trackClick,
    trackSearchClick,
    trackPhoneCall,
    trackFavorite,
    trackWebsiteClick,
    trackDirectionRequest,
    trackShare,
  } = useBusinessTracking(business.id, {
    autoTrackView: true,
    viewSource: source,
    viewContext: {
      position,
      section,
      search_query: searchQuery,
    },
  });

  // Handle main card click
  const handleCardPress = useCallback(() => {
    // Track the appropriate click type
    if (searchQuery) {
      trackSearchClick({
        position,
        section,
        search_query: searchQuery,
        element: 'business_card',
      });
    } else {
      trackClick({
        position,
        section,
        element: 'business_card',
      });
    }
    
    // Execute the provided onPress callback
    onPress?.();
  }, [searchQuery, trackSearchClick, trackClick, position, section, onPress]);

  // Handle phone call
  const handlePhoneCall = useCallback(() => {
    trackPhoneCall({
      position,
      section,
      phone_number: business.business_phone,
    });
    
    const phoneUrl = `tel:${business.business_phone}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Error', 'Phone calls are not supported on this device');
        }
      })
      .catch((err) => console.error('Error opening phone app:', err));
  }, [trackPhoneCall, business.business_phone, position, section]);

  // Handle favorite toggle
  const handleFavoritePress = useCallback(() => {
    const newFavoriteState = !business.is_favorite;
    
    trackFavorite(newFavoriteState, {
      position,
      section,
      previous_state: business.is_favorite,
    });
    
    onFavoritePress?.(business.id, newFavoriteState);
  }, [trackFavorite, business.is_favorite, business.id, position, section, onFavoritePress]);

  // Handle website click
  const handleWebsiteClick = useCallback(() => {
    if (!business.website_url) return;
    
    trackWebsiteClick({
      position,
      section,
      website_url: business.website_url,
    });
    
    Linking.canOpenURL(business.website_url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(business.website_url!);
        } else {
          Alert.alert('Error', 'Cannot open website');
        }
      })
      .catch((err) => console.error('Error opening website:', err));
  }, [trackWebsiteClick, business.website_url, position, section]);

  // Handle directions request
  const handleDirectionsPress = useCallback(() => {
    trackDirectionRequest({
      position,
      section,
      destination_lat: parseFloat(business.latitude),
      destination_lng: parseFloat(business.longitude),
    });
    
    const mapsUrl = `https://maps.google.com/maps?daddr=${business.latitude},${business.longitude}`;
    Linking.canOpenURL(mapsUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(mapsUrl);
        } else {
          Alert.alert('Error', 'Cannot open maps');
        }
      })
      .catch((err) => console.error('Error opening maps:', err));
  }, [trackDirectionRequest, business.latitude, business.longitude, position, section]);

  // Handle share
  const handleSharePress = useCallback(async () => {
    trackShare({
      position,
      section,
      share_method: 'native_share',
    });
    
    // You can integrate with React Native's Share API here
    Alert.alert('Share', `Share ${business.business_name}`);
  }, [trackShare, business.business_name, position, section]);

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor }]}
      onPress={handleCardPress}
      activeOpacity={0.7}
    >
      {/* Business Image */}
      <View style={styles.imageContainer}>
        <SmartImage
          source={{ uri: business.logo_image?.image_url }}
          style={styles.businessImage}
          fallbackIcon="business"
        />
        {business.is_featured && (
          <View style={[styles.featuredBadge, { backgroundColor: tintColor }]}>
            <Text style={[styles.featuredText, { color: 'white' }]}>Featured</Text>
          </View>
        )}
      </View>

      {/* Business Info */}
      <View style={styles.infoContainer}>
        <Text style={[styles.businessName, { color: textColor }]} numberOfLines={2}>
          {business.business_name}
        </Text>
        
        <Text style={[styles.category, { color: '#666' }]} numberOfLines={1}>
          {business.category.name}
        </Text>
        
        <Text style={[styles.location, { color: '#666' }]} numberOfLines={1}>
          {business.landmark || business.area}
        </Text>
        
        {/* Rating and Reviews */}
        <View style={styles.ratingContainer}>
          <Text style={[styles.rating, { color: tintColor }]}>
            ⭐ {parseFloat(business.overall_rating).toFixed(1)}
          </Text>
          <Text style={[styles.reviewCount, { color: '#666' }]}>
            ({business.total_reviews} reviews)
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {/* Phone Button */}
          {business.business_phone && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#f0f0f0' }]}
              onPress={handlePhoneCall}
            >
              <Text style={[styles.actionText, { color: '#333' }]}>📞</Text>
            </TouchableOpacity>
          )}

          {/* Website Button */}
          {business.website_url && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#f0f0f0' }]}
              onPress={handleWebsiteClick}
            >
              <Text style={[styles.actionText, { color: '#333' }]}>🌐</Text>
            </TouchableOpacity>
          )}

          {/* Directions Button */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#f0f0f0' }]}
            onPress={handleDirectionsPress}
          >
            <Text style={[styles.actionText, { color: '#333' }]}>🗺️</Text>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#f0f0f0' }]}
            onPress={handleSharePress}
          >
            <Text style={[styles.actionText, { color: '#333' }]}>📤</Text>
          </TouchableOpacity>

          {/* Favorite Button */}
          {showFavorite && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#f0f0f0' }]}
              onPress={handleFavoritePress}
            >
              <Text style={[styles.actionText, { color: '#333' }]}>
                {business.is_favorite ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  businessImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  featuredBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    marginBottom: 2,
  },
  location: {
    fontSize: 12,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 12,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
  },
});
