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
const cardWidth = (width - 48) / 2; // 2 cards per row with gaps
const imageHeight = 120; // Compact image height

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
  const formatDuration = (minutes: number | null | undefined) => {
    if (!minutes || minutes === 0) {
      return 'Duration N/A';
    }
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
      style={[styles.attractionCard, { 
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border
      }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: getImageUrl(attraction.cover_image_url) || getFallbackImageUrl('general') }} 
          style={styles.attractionImage}
        />
        
        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          style={styles.imageGradient}
        />
        
        {/* Badges on Image */}
        <View style={styles.badgesContainer}>
          {attraction.is_featured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={12} color="white" />
              <Text style={styles.featuredBadgeText}>Featured</Text>
            </View>
          )}
          <View style={[styles.priceBadge, { 
            backgroundColor: attraction.is_free ? '#22C55E' : '#3B82F6' 
          }]}>
            <Text style={styles.priceBadgeText}>
              {attraction.is_free ? 'FREE' : `${attraction.currency} ${attraction.entry_fee}`}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Content Container */}
      <View style={styles.attractionContent}>
        {/* Title & Location */}
        <View style={styles.titleSection}>
          <Text style={[styles.attractionName, { color: colors.text }]} numberOfLines={2}>
            {attraction.name}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={11} color={colors.tint} />
            <Text style={[styles.attractionLocation, { color: colors.icon }]} numberOfLines={1}>
              {attraction.area}, {attraction.city}
            </Text>
          </View>
        </View>

        {/* Category & Rating Row */}
        <View style={styles.categoryRatingRow}>
          <View style={[styles.categoryBadge, { 
            backgroundColor: colors.tint + '15',
            borderColor: colors.tint + '30'
          }]}>
            <Text style={[styles.categoryText, { color: colors.tint }]} numberOfLines={1}>
              {attraction.category}
            </Text>
          </View>
          
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={[styles.rating, { color: colors.text }]}>
              {typeof attraction.overall_rating === 'string' ? parseFloat(attraction.overall_rating).toFixed(1) : attraction.overall_rating.toFixed(1)}
            </Text>
            <Text style={[styles.reviewCount, { color: colors.icon }]}>
              ({attraction.total_reviews})
            </Text>
          </View>
        </View>

        {/* Info Pills with Distance */}
        <View style={styles.infoPills}>
          {attraction.estimated_duration_minutes && attraction.estimated_duration_minutes > 0 && (
            <View style={[styles.infoPill, { 
              backgroundColor: colors.background,
              borderColor: colors.border
            }]}>
              <Ionicons name="time-outline" size={11} color={colors.icon} />
              <Text style={[styles.infoPillText, { color: colors.text }]}>
                {formatDuration(attraction.estimated_duration_minutes)}
              </Text>
            </View>
          )}
          
          {attraction.difficulty_level && (
            <View style={[styles.infoPill, { 
              backgroundColor: getDifficultyColor(attraction.difficulty_level) + '15',
              borderColor: getDifficultyColor(attraction.difficulty_level) + '40'
            }]}>
              <Ionicons name="fitness-outline" size={11} color={getDifficultyColor(attraction.difficulty_level)} />
              <Text style={[styles.infoPillText, { color: getDifficultyColor(attraction.difficulty_level) }]}>
                {attraction.difficulty_level.charAt(0).toUpperCase() + attraction.difficulty_level.slice(1)}
              </Text>
            </View>
          )}
          
          <View style={[styles.infoPill, { 
            backgroundColor: colors.background,
            borderColor: colors.border
          }]}>
            <Ionicons name="eye-outline" size={11} color={colors.icon} />
            <Text style={[styles.infoPillText, { color: colors.text }]}>
              {attraction.total_views}
            </Text>
          </View>
          
          <View style={[styles.infoPill, { 
            backgroundColor: colors.tint + '15',
            borderColor: colors.tint + '30'
          }]}>
            <Ionicons name="navigate" size={10} color={colors.tint} />
            <Text style={[styles.infoPillText, { color: colors.tint }]}>
              {formatDistance(attraction.distance_km || attraction.distance || 0)}
            </Text>
          </View>
        </View>
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
        numColumns={2}
        columnWrapperStyle={styles.row}
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
    paddingBottom: 80,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  attractionCard: {
    width: cardWidth,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  attractionImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  badgesContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 3,
  },
  featuredBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  priceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  priceBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  attractionContent: {
    padding: 8,
    gap: 6,
  },
  titleSection: {
    gap: 3,
  },
  attractionName: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  attractionLocation: {
    fontSize: 11,
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '600',
  },
  categoryRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rating: {
    fontSize: 12,
    fontWeight: '700',
  },
  reviewCount: {
    fontSize: 10,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 2,
  },
  distance: {
    fontSize: 10,
    fontWeight: '600',
  },
  infoPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    gap: 2,
  },
  infoPillText: {
    fontSize: 9,
    fontWeight: '600',
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