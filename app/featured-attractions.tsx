import { AttractionListSkeleton } from '@/components/SkeletonLoader';
import { Colors } from '@/constants/Colors';
import { useLocation } from '@/contexts/LocationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getFeaturedAttractions } from '@/services/api';
import { handleApiError } from '@/services/errorHandler';
import { FeaturedAttraction, FeaturedAttractionsResponse } from '@/types/api';
import { getFallbackImageUrl, getImageUrl } from '@/utils/imageUtils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');
const cardWidth = width - 32; // Account for padding
const imageHeight = 120; // Reduced from 160

interface AttractionCardProps {
  attraction: FeaturedAttraction;
  onPress: () => void;
  colors: any;
}

const AttractionCard: React.FC<AttractionCardProps> = ({ attraction, onPress, colors }) => {
  // Format distance for display
  const formatDistance = (distance: number | string) => {
    const distanceNum = typeof distance === 'string' ? parseFloat(distance) : distance;
    if (distanceNum < 1) {
      return `${Math.round(distanceNum * 1000)}m`;
    }
    return `${distanceNum.toFixed(1)}km`;
  };

  // Format estimated duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
  };

  // Get difficulty color
  const getDifficultyColor = (level: string | null | undefined) => {
    if (!level || typeof level !== 'string') {
      return colors.icon;
    }
    
    switch (level.toLowerCase()) {
      case 'easy':
        return '#22C55E'; // Green
      case 'moderate':
        return '#F59E0B'; // Amber
      case 'hard':
        return '#EF4444'; // Red
      default:
        return colors.icon;
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.attractionCard, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: getImageUrl(attraction.cover_image_url) || getFallbackImageUrl('general') }} 
        style={[styles.attractionImage, { height: imageHeight }]}
      />
      
      {/* Free/Paid Badge */}
      <View style={[styles.priceBadge, { backgroundColor: attraction.is_free ? '#22C55E' : '#3B82F6' }]}>
        <Text style={styles.priceBadgeText}>
          {attraction.is_free ? 'FREE' : `${attraction.currency} ${attraction.entry_fee}`}
        </Text>
      </View>

      {/* Featured Badge */}
      {attraction.is_featured && (
        <View style={[styles.featuredBadge, { backgroundColor: '#FFD700' }]}>
          <Ionicons name="star" size={10} color="white" />
          <Text style={styles.featuredBadgeText}>Featured</Text>
        </View>
      )}
      
      <View style={styles.attractionContent}>
        <View style={styles.attractionMainInfo}>
          <Text style={[styles.attractionName, { color: colors.text }]} numberOfLines={2}>
            {attraction.name}
          </Text>
          <Text style={[styles.attractionCategory, { color: colors.icon }]} numberOfLines={1}>
            {attraction.category} • {attraction.subcategory}
          </Text>
          <Text style={[styles.attractionLocation, { color: colors.icon }]} numberOfLines={1}>
            <Ionicons name="location-outline" size={12} color={colors.icon} />
            {' '}{attraction.area}, {attraction.city}
          </Text>
        </View>
        
        <View style={styles.attractionMeta}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={[styles.rating, { color: colors.text }]}>
              {typeof attraction.overall_rating === 'string' ? parseFloat(attraction.overall_rating).toFixed(1) : attraction.overall_rating.toFixed(1)}
            </Text>
            <Text style={[styles.reviewCount, { color: colors.icon }]}>
              ({attraction.total_reviews})
            </Text>
          </View>
          
          <Text style={[styles.distance, { color: colors.buttonPrimary }]}>
            {formatDistance(attraction.distance_km || attraction.distance || 0)}
          </Text>
        </View>

        {/* Additional attraction info */}
        <View style={styles.attractionDetails}>
          <View style={styles.attractionDetailItem}>
            <Ionicons name="time-outline" size={14} color={colors.icon} />
            <Text style={[styles.attractionDetailText, { color: colors.icon }]}>
              {formatDuration(attraction.estimated_duration_minutes)}
            </Text>
          </View>
          
          {attraction.difficulty_level && (
            <View style={styles.attractionDetailItem}>
              <Ionicons name="fitness-outline" size={14} color={getDifficultyColor(attraction.difficulty_level)} />
              <Text style={[styles.attractionDetailText, { color: getDifficultyColor(attraction.difficulty_level) }]}>
                {attraction.difficulty_level}
              </Text>
            </View>
          )}
          
          <View style={styles.attractionDetailItem}>
            <Ionicons name="people-outline" size={14} color={colors.icon} />
            <Text style={[styles.attractionDetailText, { color: colors.icon }]}>
              {attraction.total_views} views
            </Text>
          </View>
        </View>

        {attraction.description && (
          <Text style={[styles.attractionDescription, { color: colors.icon }]} numberOfLines={2}>
            {attraction.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const FeaturedAttractionsScreen: React.FC = () => {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme || 'light'];
  const { location } = useLocation();
  
  const [attractions, setAttractions] = useState<FeaturedAttraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadFeaturedAttractions = useCallback(async (pageNum: number = 1, isRefresh: boolean = false) => {
    if (!location?.latitude || !location?.longitude) {
      console.log('No location available for featured attractions');
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response: FeaturedAttractionsResponse = await getFeaturedAttractions(
        location.latitude,
        location.longitude,
        20, // limit
        15, // radiusKm
        pageNum
      );

      if (response.success && response.data) {
        // API returns data as array directly, not wrapped in { attractions: [...] }
        const newAttractions = Array.isArray(response.data) ? response.data : [];
        
        if (pageNum === 1 || isRefresh) {
          setAttractions(newAttractions);
        } else {
          setAttractions(prev => [...prev, ...newAttractions]);
        }

        // Since API doesn't return pagination info, assume no more pages if less than limit
        const hasMoreResults = newAttractions.length >= 20;
        setHasMore(hasMoreResults);
        setPage(pageNum);
      } else {
        console.log('Featured attractions API response not successful');
        setAttractions([]);
      }
    } catch (error) {
      console.error('Error loading featured attractions:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [location]);

  const handleRefresh = useCallback(() => {
    setPage(1);
    setHasMore(true);
    loadFeaturedAttractions(1, true);
  }, [loadFeaturedAttractions]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      loadFeaturedAttractions(nextPage, false);
    }
  }, [loadingMore, hasMore, page, loadFeaturedAttractions]);

  const handleAttractionPress = (attractionId: number) => {
    router.push(`/attraction/${attractionId}` as any);
  };

  useFocusEffect(
    useCallback(() => {
      if (location?.latitude && location?.longitude) {
        loadFeaturedAttractions();
      }
    }, [location, loadFeaturedAttractions])
  );

  const renderAttraction = ({ item }: { item: FeaturedAttraction }) => {
    // Add safety check for required fields
    if (!item || !item.id) {
      return null;
    }
    
    return (
      <AttractionCard
        attraction={item}
        onPress={() => handleAttractionPress(item.id)}
        colors={colors}
      />
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <AttractionListSkeleton colors={colors} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="location-outline" size={64} color={colors.icon} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No Featured Attractions Found
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
          We couldn't find any featured attractions in your area. Try refreshing or check back later.
        </Text>
      </View>
    );
  };

  if (loading && attractions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        
        {/* Fixed Header */}
        <LinearGradient
          colors={[colors.headerGradientStart, colors.headerGradientEnd]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Featured Attractions</Text>
            
            <View style={styles.headerRight} />
          </View>
        </LinearGradient>

        <AttractionListSkeleton colors={colors} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Fixed Header */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Featured Attractions</Text>
          
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <FlatList
        data={attractions || []}
        renderItem={renderAttraction}
        keyExtractor={(item, index) => item?.id ? item.id.toString() : `attraction-${index}`}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.buttonPrimary]}
            tintColor={colors.buttonPrimary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        // Remove debug props that might cause issues
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 44,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    width: 40,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80, // Reduced from 100
  },
  attractionCard: {
    width: cardWidth,
    borderRadius: 12, // Reduced from 16
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, // Reduced shadow
    shadowOpacity: 0.08, // Reduced from 0.1
    shadowRadius: 4, // Reduced from 8
    elevation: 3, // Reduced from 4
    marginBottom: 12, // Reduced from 16
  },
  attractionImage: {
    width: '100%',
    height: 120, // Reduced from 160
    resizeMode: 'cover',
  },
  attractionContent: {
    padding: 12, // Reduced from 16
  },
  attractionMainInfo: {
    marginBottom: 8, // Reduced from 12
  },
  attractionName: {
    fontSize: 16, // Reduced from 18
    fontWeight: '700',
    marginBottom: 3, // Reduced from 4
    lineHeight: 20, // Reduced from 24
  },
  attractionCategory: {
    fontSize: 13, // Reduced from 14
    marginBottom: 3, // Reduced from 4
    opacity: 0.7,
  },
  attractionLocation: {
    fontSize: 13, // Reduced from 14
    opacity: 0.7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  attractionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // Reduced from 12
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    marginLeft: 4,
    opacity: 0.7,
  },
  distance: {
    fontSize: 14,
    fontWeight: '600',
  },
  attractionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // Reduced from 12
  },
  attractionDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3, // Reduced from 4
  },
  attractionDetailText: {
    fontSize: 11, // Reduced from 12
    fontWeight: '500',
  },
  attractionDescription: {
    fontSize: 13, // Reduced from 14
    lineHeight: 18, // Reduced from 20
    opacity: 0.8,
  },
  priceBadge: {
    position: 'absolute',
    top: 8, // Reduced from 12
    right: 8, // Reduced from 12
    paddingHorizontal: 6, // Reduced from 8
    paddingVertical: 3, // Reduced from 4
    borderRadius: 6, // Reduced from 8
    zIndex: 1,
  },
  priceBadgeText: {
    color: 'white',
    fontSize: 10, // Reduced from 12
    fontWeight: '600',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8, // Reduced from 12
    left: 8, // Reduced from 12
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6, // Reduced from 8
    paddingVertical: 3, // Reduced from 4
    borderRadius: 8, // Reduced from 12
    zIndex: 1,
  },
  featuredBadgeText: {
    color: 'white',
    fontSize: 9, // Reduced from 11
    fontWeight: '600',
    marginLeft: 2,
  },
  loadingMore: {
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.7,
  },
});

export default FeaturedAttractionsScreen;