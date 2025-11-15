import { AttractionListSkeleton } from '@/components/SkeletonLoader';
import { Colors } from '@/constants/Colors';
import { useLocation } from '@/contexts/LocationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getPopularAttractions } from '@/services/api';
import { handleApiError } from '@/services/errorHandler';
import { FeaturedAttraction, PopularAttractionsResponse } from '@/types/api';
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
const cardWidth = (width - 48) / 2; // 2 columns: 16 + 8 + 8 + 16 = 48
const imageHeight = 120;

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
      return null;
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
  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'easy':
        return '#22C55E';
      case 'moderate':
        return '#F59E0B';
      case 'hard':
        return '#EF4444';
      default:
        return colors.icon;
    }
  };

  const duration = formatDuration(attraction.estimated_duration_minutes);

  return (
    <TouchableOpacity 
      style={[styles.attractionCard, { backgroundColor: colors.card, width: cardWidth }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: getImageUrl(attraction.cover_image_url) || getFallbackImageUrl('general') }} 
        style={styles.attractionImage}
      />
      
      {/* Popular Badge */}
      <View style={styles.popularBadge}>
        <Ionicons name="trending-up" size={8} color="white" />
        <Text style={styles.popularBadgeText}>Popular</Text>
      </View>
      
      <View style={styles.attractionContent}>
        {/* Title */}
        <Text style={[styles.attractionName, { color: colors.text }]} numberOfLines={2}>
          {attraction.name}
        </Text>
        
        {/* Location */}
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={10} color={colors.icon} />
          <Text style={[styles.attractionLocation, { color: colors.icon }]} numberOfLines={1}>
            {attraction.area}, {attraction.city}
          </Text>
        </View>

        {/* Category and Rating Row */}
        <View style={styles.categoryRatingRow}>
          <Text style={[styles.attractionCategory, { color: colors.icon }]} numberOfLines={1}>
            {attraction.category}
          </Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={10} color="#FFD700" />
            <Text style={[styles.rating, { color: colors.text }]}>
              {typeof attraction.overall_rating === 'string' ? parseFloat(attraction.overall_rating).toFixed(1) : attraction.overall_rating.toFixed(1)}
            </Text>
          </View>
        </View>

        {/* Info Pills */}
        <View style={styles.infoPillsRow}>
          {duration && (
            <View style={[styles.infoPill, { backgroundColor: colors.icon + '15' }]}>
              <Ionicons name="time-outline" size={9} color={colors.icon} />
              <Text style={[styles.infoPillText, { color: colors.icon }]}>{duration}</Text>
            </View>
          )}
          
          {attraction.difficulty_level && (
            <View style={[styles.infoPill, { backgroundColor: getDifficultyColor(attraction.difficulty_level) + '20' }]}>
              <Ionicons name="fitness-outline" size={9} color={getDifficultyColor(attraction.difficulty_level)} />
              <Text style={[styles.infoPillText, { color: getDifficultyColor(attraction.difficulty_level) }]}>
                {attraction.difficulty_level}
              </Text>
            </View>
          )}

          {attraction.total_views > 0 && (
            <View style={[styles.infoPill, { backgroundColor: colors.icon + '15' }]}>
              <Ionicons name="eye-outline" size={9} color={colors.icon} />
              <Text style={[styles.infoPillText, { color: colors.icon }]}>
                {attraction.total_views > 999 ? `${(attraction.total_views / 1000).toFixed(1)}k` : attraction.total_views}
              </Text>
            </View>
          )}

          {(attraction.distance_km || attraction.distance) && (
            <View style={[styles.infoPill, { backgroundColor: colors.buttonPrimary + '20' }]}>
              <Ionicons name="navigate-outline" size={9} color={colors.buttonPrimary} />
              <Text style={[styles.infoPillText, { color: colors.buttonPrimary }]}>
                {formatDistance(attraction.distance_km || attraction.distance || 0)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const PopularAttractionsScreen: React.FC = () => {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme || 'light'];
  const { location } = useLocation();
  
  const [attractions, setAttractions] = useState<FeaturedAttraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPopularAttractions = useCallback(async (pageNum: number = 1, isRefresh: boolean = false) => {
    if (!location?.latitude || !location?.longitude) {
      console.log('No location available for popular attractions');
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

      const response: PopularAttractionsResponse = await getPopularAttractions(
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
        console.log('Popular attractions API response not successful');
        setAttractions([]);
      }
    } catch (error) {
      console.error('Error loading popular attractions:', error);
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
    loadPopularAttractions(1, true);
  }, [loadPopularAttractions]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      loadPopularAttractions(nextPage, false);
    }
  }, [loadingMore, hasMore, page, loadPopularAttractions]);

  const handleAttractionPress = (attractionId: number) => {
    router.push(`/attraction/${attractionId}` as any);
  };

  useFocusEffect(
    useCallback(() => {
      if (location?.latitude && location?.longitude) {
        loadPopularAttractions();
      }
    }, [location, loadPopularAttractions])
  );

  const renderAttraction = ({ item }: { item: FeaturedAttraction }) => {
    // Add safety check for required fields
    if (!item || !item.id) {
      console.warn('⚠️ Invalid attraction item:', item);
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
        <Ionicons name="trending-up-outline" size={64} color={colors.icon} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No Popular Attractions Found
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
          We couldn't find any popular attractions in your area. Try refreshing or check back later.
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
            
            <Text style={styles.headerTitle}>Popular Attractions</Text>
            
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
          
          <Text style={styles.headerTitle}>Popular Attractions</Text>
          
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <FlatList
        data={attractions || []}
        renderItem={renderAttraction}
        keyExtractor={(item, index) => item?.id ? item.id.toString() : `attraction-${index}`}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
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
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  attractionCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  attractionImage: {
    width: '100%',
    height: imageHeight,
    resizeMode: 'cover',
  },
  attractionContent: {
    padding: 8,
    gap: 6,
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
    opacity: 0.7,
    flex: 1,
  },
  categoryRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attractionCategory: {
    fontSize: 11,
    opacity: 0.7,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rating: {
    fontSize: 11,
    fontWeight: '600',
  },
  infoPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  infoPillText: {
    fontSize: 9,
    fontWeight: '600',
  },
  popularBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 2,
    zIndex: 1,
  },
  popularBadgeText: {
    color: 'white',
    fontSize: 8,
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

export default PopularAttractionsScreen;