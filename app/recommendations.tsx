import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocation } from '@/contexts/LocationContext';
import { 
  getLocationRecommendations, 
  LocationRecommendation, 
  LocationRecommendationsResponse 
} from '@/services/api';
import { getImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';
import CustomAlert from '@/components/CustomAlert';
import { useCustomAlert } from '@/hooks/useCustomAlert';

// Simple animated skeleton line component
const SkeletonLine = ({ width, height, style }: { width: number | string; height: number; style?: any }) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: 4,
          opacity,
        },
        style,
      ]}
    />
  );
};

export default function RecommendationsScreen() {
  const [recommendations, setRecommendations] = useState<LocationRecommendation[]>([]);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { getCoordinatesForAPI, getCurrentLocationInfo } = useLocation();
  const { alertConfig, showError, hideAlert } = useCustomAlert();

  // Load recommendations when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadRecommendations();
    }, [])
  );

  const loadRecommendations = async (isRefresh: boolean = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);

      // Get current coordinates
      const coordinates = getCoordinatesForAPI();
      const locationInfo = getCurrentLocationInfo();

      console.log('📍 Loading recommendations for:', coordinates);

      const response: LocationRecommendationsResponse = await getLocationRecommendations(
        coordinates.latitude,
        coordinates.longitude,
        20, // limit
        15  // radius in km
      );

      if (response.success) {
        setRecommendations(response.data.recommendations);
        setUserLocation(response.data.user_location);
        setMetadata(response.data.metadata);
        console.log(`✅ Loaded ${response.data.recommendations.length} recommendations`);
      } else {
        throw new Error('Failed to load recommendations');
      }
    } catch (error) {
      console.error('❌ Error loading recommendations:', error);
      setError(error instanceof Error ? error.message : 'Failed to load recommendations');
      showError(
        'Error Loading Recommendations',
        'Unable to load location-based recommendations. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRecommendations(true);
  };

  const getPriceRangeInfo = (priceRange: number) => {
    const ranges = {
      1: { symbol: '৳', label: 'Budget-friendly' },
      2: { symbol: '৳৳', label: 'Moderate' },
      3: { symbol: '৳৳৳', label: 'Expensive' },
      4: { symbol: '৳৳৳৳', label: 'Very Expensive' },
      5: { symbol: '৳৳৳৳৳', label: 'Luxury' }
    };
    return ranges[priceRange as keyof typeof ranges] || { symbol: '৳', label: 'Budget-friendly' };
  };

  const handleBusinessPress = (recommendation: LocationRecommendation) => {
    router.push(`/business/${recommendation.id}` as any);
  };

  const renderRecommendationCard = (recommendation: LocationRecommendation, index: number) => {
    const priceInfo = getPriceRangeInfo(recommendation.price_range);
    
    return (
      <TouchableOpacity
        key={recommendation.id}
        style={[styles.recommendationCard, { backgroundColor: colors.card }]}
        onPress={() => handleBusinessPress(recommendation)}
        activeOpacity={0.7}
      >
        <View style={styles.recommendationRow}>
          {/* Business Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ 
                uri: getImageUrl(recommendation.logo_image) || getFallbackImageUrl('business') 
              }}
              style={styles.businessImage}
              resizeMode="cover"
            />
            
            {/* Featured Badge */}
            {recommendation.is_featured && (
              <View style={[styles.featuredBadge, { backgroundColor: colors.tint }]}>
                <Ionicons name="star" size={10} color="white" />
              </View>
            )}
          </View>

          {/* Business Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.mainInfo}>
              <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={1}>
                {recommendation.business_name}
              </Text>
              <Text style={[styles.subcategory, { color: colors.icon }]} numberOfLines={1}>
                {recommendation.category.name} • {recommendation.subcategory.name}
              </Text>
              {recommendation.landmark && (
                <Text style={[styles.landmark, { color: colors.icon }]} numberOfLines={1}>
                  📍 {recommendation.landmark}
                </Text>
              )}
            </View>
            
            <View style={styles.metrics}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={[styles.rating, { color: colors.text }]}>
                  {recommendation.overall_rating}
                </Text>
                <Text style={[styles.reviewCount, { color: colors.icon }]}>
                  ({recommendation.total_reviews})
                </Text>
              </View>
              
              <Text style={[styles.priceSymbol, { color: colors.tint }]}>
                {priceInfo.symbol}
              </Text>
            </View>

            {/* Recommendation Reason */}
            <View style={[styles.reasonContainer, { backgroundColor: colors.background + '80' }]}>
              <Ionicons name="bulb-outline" size={10} color={colors.tint} />
              <Text style={[styles.reasonText, { color: colors.tint }]}>
                {recommendation.recommendation_reason} • {recommendation.area_relevance_score.toFixed(1)}% match
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        
        {/* Header */}
        <LinearGradient
          colors={[colors.headerGradientStart || colors.tint, colors.headerGradientEnd || colors.tint + '90']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTextSection}>
              <Text style={styles.headerTitle}>Recommendations</Text>
              <Text style={styles.headerSubtitle}>Discover places just for you</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Loading Skeleton */}
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.skeletonContainer}
        >
          {/* Location Info Skeleton */}
          <View style={[styles.locationInfo, { backgroundColor: colors.card }]}>
            <View style={styles.locationHeader}>
              <SkeletonLine width={20} height={20} style={{ backgroundColor: colors.tint + '40', borderRadius: 10 }} />
              <SkeletonLine width={100} height={16} style={{ backgroundColor: colors.icon + '20', marginLeft: 8 }} />
            </View>
            <SkeletonLine width="60%" height={14} style={{ backgroundColor: colors.icon + '15', marginTop: 8 }} />
            <SkeletonLine width="40%" height={12} style={{ backgroundColor: colors.icon + '15', marginTop: 4 }} />
          </View>

          {/* Section Header Skeleton */}
          <View style={styles.sectionHeader}>
            <SkeletonLine width={150} height={20} style={{ backgroundColor: colors.icon + '20' }} />
            <SkeletonLine width={100} height={14} style={{ backgroundColor: colors.icon + '15', marginTop: 4 }} />
          </View>

          {/* Recommendations List Skeleton */}
          <View style={styles.recommendationsList}>
            {[...Array(6)].map((_, index) => (
              <View key={index} style={[styles.recommendationCard, { backgroundColor: colors.card }]}>
                <View style={styles.recommendationRow}>
                  {/* Image skeleton */}
                  <View style={styles.imageContainer}>
                    <SkeletonLine 
                      width={80} 
                      height={80} 
                      style={{ 
                        backgroundColor: colors.icon + '20',
                        borderRadius: 12
                      }} 
                    />
                  </View>

                  {/* Content skeleton */}
                  <View style={styles.detailsContainer}>
                    <View style={styles.mainInfo}>
                      <SkeletonLine width="70%" height={16} style={{ backgroundColor: colors.icon + '20' }} />
                      <SkeletonLine width="50%" height={13} style={{ backgroundColor: colors.icon + '15', marginTop: 4 }} />
                      <SkeletonLine width="60%" height={12} style={{ backgroundColor: colors.icon + '15', marginTop: 2 }} />
                    </View>
                    
                    <View style={styles.metrics}>
                      <SkeletonLine width={60} height={12} style={{ backgroundColor: colors.icon + '15' }} />
                      <SkeletonLine width={30} height={14} style={{ backgroundColor: colors.tint + '40' }} />
                    </View>

                    <View style={[styles.reasonContainer, { backgroundColor: colors.background + '80' }]}>
                      <SkeletonLine width="80%" height={10} style={{ backgroundColor: colors.tint + '30' }} />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Footer Spacing */}
          <View style={styles.footerSpacing} />
        </ScrollView>
      </View>
    );
  }

  if (error && recommendations.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        
        {/* Header */}
        <LinearGradient
          colors={[colors.headerGradientStart || colors.tint, colors.headerGradientEnd || colors.tint + '90']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTextSection}>
              <Text style={styles.headerTitle}>Recommendations</Text>
              <Text style={styles.headerSubtitle}>Discover places just for you</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Error State */}
        <View style={styles.errorContainer}>
          <Ionicons name="location-outline" size={64} color={colors.icon} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Unable to Load Recommendations
          </Text>
          <Text style={[styles.errorSubtitle, { color: colors.icon }]}>
            We couldn't find recommendations for your location. Please try again.
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={() => loadRecommendations()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>

        <CustomAlert
          visible={alertConfig.visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={hideAlert}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <LinearGradient
        colors={[colors.headerGradientStart || colors.tint, colors.headerGradientEnd || colors.tint + '90']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTextSection}>
            <Text style={styles.headerTitle}>Recommendations</Text>
            <Text style={styles.headerSubtitle}>Discover places just for you</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.tint]}
            tintColor={colors.tint}
          />
        }
      >
        {/* Location Info */}
        {userLocation && (
          <View style={[styles.locationInfo, { backgroundColor: colors.card }]}>
            <View style={styles.locationHeader}>
              <Ionicons name="location" size={20} color={colors.tint} />
              <Text style={[styles.locationTitle, { color: colors.text }]}>
                Your Location
              </Text>
            </View>
            <Text style={[styles.locationText, { color: colors.icon }]}>
              {userLocation.specific_area}
            </Text>
            <Text style={[styles.precisionText, { color: colors.icon }]}>
              {userLocation.precision_level} • {metadata?.search_radius_km}km radius
            </Text>
          </View>
        )}

        {/* Recommendations Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recommended for You
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.icon }]}>
            {metadata?.total_found} places found nearby
          </Text>
        </View>

        {/* Recommendations List */}
        <View style={styles.recommendationsList}>
          {recommendations.map((recommendation, index) => 
            renderRecommendationCard(recommendation, index)
          )}
        </View>

        {/* Footer Spacing */}
        <View style={styles.footerSpacing} />
      </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
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
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTextSection: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  locationInfo: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  locationText: {
    fontSize: 14,
    marginBottom: 4,
  },
  precisionText: {
    fontSize: 12,
    opacity: 0.7,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  recommendationsList: {
    gap: 8,
  },
  recommendationCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  businessImage: {
    width: '100%',
    height: '100%',
  },
  featuredBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  recommendationRow: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  mainInfo: {
    marginBottom: 6,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },

  subcategory: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  landmark: {
    fontSize: 12,
  },
  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 2,
  },
  reviewCount: {
    fontSize: 12,
    marginLeft: 2,
  },
  priceSymbol: {
    fontSize: 14,
    fontWeight: '700',
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reasonText: {
    fontSize: 10,
    fontWeight: '500',
    flex: 1,
    marginLeft: 2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footerSpacing: {
    height: 32,
  },
  skeletonContainer: {
    paddingBottom: 20,
    paddingTop: 8,
  },
});
