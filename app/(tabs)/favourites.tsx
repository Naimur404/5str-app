import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { getUserFavorites, isAuthenticated, removeFromFavorites, type Favorite } from '@/services/api';
import { getImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/CustomAlert';
import { useToastGlobal } from '@/contexts/ToastContext';
import { FavouritesPageSkeleton } from '@/components/SkeletonLoader';
import SmartImage, { BusinessLogo, OfferingImage } from '@/components/SmartImage';

const filterOptions = ['All', 'Businesses', 'Offerings', 'Attractions'];

export default function FavouritesScreen() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [filteredFavorites, setFilteredFavorites] = useState<Favorite[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { alertConfig, showError, showSuccess, showConfirm, hideAlert } = useCustomAlert();
  const { showSuccess: showToast } = useToastGlobal();

  useEffect(() => {
    checkAuthAndLoadFavorites();
  }, []);

  useEffect(() => {
    filterFavorites();
  }, [searchQuery, selectedFilter, favorites]);

  const checkAuthAndLoadFavorites = async () => {
    try {
      console.log('Checking authentication...');
      const authenticated = await isAuthenticated();
      console.log('Authentication result:', authenticated);
      setIsUserAuthenticated(authenticated);
      
      if (authenticated) {
        console.log('User is authenticated, loading favorites...');
        // Pass the authenticated status directly to avoid state timing issues
        await loadFavoritesWithAuth(true);
      } else {
        console.log('User not authenticated');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsUserAuthenticated(false);
      setLoading(false);
    }
  };

  // Helper function that takes authentication status as parameter
  const loadFavoritesWithAuth = async (isAuthenticated: boolean, page: number = 1, isRefresh: boolean = false) => {
    console.log('loadFavoritesWithAuth called. isAuthenticated:', isAuthenticated, 'page:', page, 'isRefresh:', isRefresh);
    
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping favorites load');
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      console.log('Making getUserFavorites API call...');
      const response = await getUserFavorites(page);
      console.log('Favorites response:', response);
      
      if (response.success) {
        console.log('Favorites data:', response.data);
        console.log('Number of favorites on this page:', response.data.favorites.length);
        
        if (page === 1 || isRefresh) {
          setFavorites(response.data.favorites);
          setCurrentPage(1);
        } else {
          setFavorites(prev => [...prev, ...response.data.favorites]);
        }
        
        setCurrentPage(page);
        setHasMorePages(response.data.pagination.has_more);
        
        console.log('Updated favorites state. Total favorites now:', response.data.favorites.length);
      } else {
        console.log('Favorites API returned success: false');
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      showError('Error', 'Failed to load favorites. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const loadFavorites = async (page: number = 1, isRefresh: boolean = false) => {
    return loadFavoritesWithAuth(isUserAuthenticated, page, isRefresh);
  };

  const onRefresh = useCallback(async () => {
    console.log('onRefresh called');
    const authenticated = await isAuthenticated();
    if (authenticated) {
      setIsUserAuthenticated(true);
      loadFavoritesWithAuth(true, 1, true);
    } else {
      setIsUserAuthenticated(false);
      checkAuthAndLoadFavorites();
    }
  }, []);

  const loadMore = () => {
    if (hasMorePages && !loadingMore) {
      loadFavorites(currentPage + 1);
    }
  };

  const filterFavorites = () => {
    let filtered = favorites;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((item: Favorite) => {
        const name = item.type === 'business' 
          ? item.business?.business_name || ''
          : item.type === 'offering'
          ? item.offering?.name || ''
          : item.attraction?.name || '';
        const category = item.type === 'business'
          ? item.business?.category_name || ''
          : item.type === 'offering'
          ? item.offering?.offering_type || ''
          : item.attraction?.category || '';
        
        return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               category.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // Filter by type
    if (selectedFilter !== 'All') {
      const filterType = selectedFilter.toLowerCase();
      filtered = filtered.filter((item: Favorite) => {
        if (filterType === 'businesses') return item.type === 'business';
        if (filterType === 'offerings') return item.type === 'offering';
        if (filterType === 'attractions') return item.type === 'attraction';
        return true;
      });
    }

    setFilteredFavorites(filtered);
  };

  const removeFavorite = (favoriteId: number, name: string) => {
    if (!isUserAuthenticated) {
      showError(
        'Login Required',
        'Please login first to manage your favorites',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/auth/login' as any) }
        ]
      );
      return;
    }

    showConfirm(
      'Remove Favourite',
      `Are you sure you want to remove "${name}" from your favourites?`,
      async () => {
        try {
          const response = await removeFromFavorites(favoriteId);
          if (response.success) {
            setFavorites(prev => prev.filter(item => item.id !== favoriteId));
            showToast('Removed from favourites');
          } else {
            throw new Error(response.message || 'Failed to remove from favorites');
          }
        } catch (error: any) {
          console.error('Error removing favorite:', error);
          
          if (error.message && error.message.includes('401')) {
            showError('Error', 'Please login again to manage favorites');
            setIsUserAuthenticated(false);
          } else {
            showError('Error', 'Failed to remove from favourites. Please try again.');
          }
        }
      }
    );
  };

  const handleItemPress = (favorite: Favorite) => {
    if (favorite.type === 'business' && favorite.business) {
      // Navigate to business details: /api/v1/businesses/1
      router.push(`/business/${favorite.business.id}` as any);
    } else if (favorite.type === 'offering' && favorite.offering) {
      // Navigate to offering details: /api/v1/businesses/1/offerings/1
      const businessId = favorite.offering.business_id;
      const offeringId = favorite.offering.id;
      router.push(`/offering/${businessId}/${offeringId}` as any);
    } else if (favorite.type === 'attraction' && favorite.attraction) {
      // Navigate to attraction details: /attraction/1
      router.push(`/attraction/${favorite.attraction.id}` as any);
    }
  };

  const renderFavoriteItem = ({ item }: { item: Favorite }) => {
    const isBusinessFavorite = item.type === 'business';
    const isOfferingFavorite = item.type === 'offering';
    const isAttractionFavorite = item.type === 'attraction';
    
    const name = isBusinessFavorite 
      ? item.business?.business_name 
      : isOfferingFavorite
      ? item.offering?.name
      : item.attraction?.name;
      
    const category = isBusinessFavorite 
      ? item.business?.category_name 
      : isOfferingFavorite
      ? item.offering?.offering_type
      : item.attraction?.category;
      
    const rating = isBusinessFavorite 
      ? item.business?.overall_rating 
      : isOfferingFavorite
      ? item.offering?.average_rating
      : item.attraction?.overall_rating;
      
    const reviewCount = isBusinessFavorite 
      ? item.business?.total_reviews 
      : isOfferingFavorite
      ? item.offering?.total_reviews
      : item.attraction?.total_reviews;
      
    const image = isBusinessFavorite 
      ? item.business?.logo_image 
      : isOfferingFavorite
      ? item.offering?.image_url
      : item.attraction?.cover_image;
      
    const priceRange = isBusinessFavorite 
      ? `${'$'.repeat(item.business?.price_range || 1)}`
      : isOfferingFavorite
      ? item.offering?.price_range
      : item.attraction?.is_free 
        ? 'Free'
        : `${item.attraction?.entry_fee} ${item.attraction?.currency}`;

    return (
      <TouchableOpacity 
        style={[styles.favoriteCard, { backgroundColor: colors.card }]}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.favoriteRow}>
          <View style={styles.favoriteImageContainer}>
            {isBusinessFavorite ? (
              <BusinessLogo
                source={image}
                businessName={name}
                width={80}
                height={80}
                borderRadius={12}
              />
            ) : isOfferingFavorite ? (
              <OfferingImage
                source={image}
                width={80}
                height={80}
                borderRadius={12}
              />
            ) : (
              <SmartImage
                source={image}
                type="general"
                width={80}
                height={80}
                borderRadius={12}
              />
            )}
            <TouchableOpacity
              style={styles.heartButton}
              onPress={() => removeFavorite(item.id, name || '')}
              activeOpacity={0.8}
            >
              <Ionicons name="heart" size={18} color="#FF6B6B" />
            </TouchableOpacity>
          </View>

          <View style={styles.favoriteContent}>
            <View style={styles.favoriteMainInfo}>
              <Text style={[styles.favoriteName, { color: colors.text }]} numberOfLines={1}>
                {name}
              </Text>
              <Text style={[styles.favoriteCategory, { color: colors.icon }]} numberOfLines={1}>
                {category}
              </Text>
            </View>
            
            <View style={styles.favoriteMetrics}>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={[styles.ratingText, { color: colors.text }]}>
                  {parseFloat(rating || '0').toFixed(1)}
                </Text>
                <Text style={[styles.reviewCountText, { color: colors.icon }]}>
                  ({reviewCount})
                </Text>
              </View>
              
              {priceRange && (
                <Text style={[styles.priceText, { color: colors.buttonPrimary }]}>{priceRange}</Text>
              )}
            </View>

            {isBusinessFavorite && item.business?.landmark && (
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={12} color={colors.icon} />
                <Text style={[styles.locationText, { color: colors.icon }]} numberOfLines={1}>
                  {item.business.landmark}
                </Text>
              </View>
            )}
            
            {isAttractionFavorite && item.attraction?.area && (
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={12} color={colors.icon} />
                <Text style={[styles.locationText, { color: colors.icon }]} numberOfLines={1}>
                  {item.attraction.area}, {item.attraction.city}
                </Text>
              </View>
            )}

            {isAttractionFavorite && item.attraction?.estimated_duration_minutes && (
              <View style={styles.locationContainer}>
                <Ionicons name="time-outline" size={12} color={colors.icon} />
                <Text style={[styles.locationText, { color: colors.icon }]} numberOfLines={1}>
                  ~{Math.round(item.attraction.estimated_duration_minutes / 60)}h duration
                </Text>
              </View>
            )}
          </View>

          <View style={styles.favoriteActions}>
            <View style={[styles.typeBadge, { backgroundColor: colors.buttonPrimary + '20' }]}>
              <Text style={[styles.typeBadgeText, { color: colors.buttonPrimary }]}>
                {isBusinessFavorite ? 'Business' : isOfferingFavorite ? 'Item' : 'Attraction'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        {
          backgroundColor: selectedFilter === item ? colors.buttonPrimary : colors.background,
          borderColor: selectedFilter === item ? colors.buttonPrimary : colors.icon + '30',
        },
      ]}
      onPress={() => setSelectedFilter(item)}
    >
      <Text
        style={[
          styles.filterText,
          { color: selectedFilter === item ? colors.buttonText : colors.text },
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      {/* Header */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="heart" size={32} color="white" style={styles.headerIcon} />
            <View>
              <Text style={styles.headerTitle}>My Favourites</Text>
              <Text style={styles.headerSubtitle}>
                {isUserAuthenticated 
                  ? `${favorites.length} saved item${favorites.length !== 1 ? 's' : ''}`
                  : 'Login to view your favorites'
                }
              </Text>
            </View>
          </View>
        </View>
        
        {/* Search Bar */}
        {isUserAuthenticated && (
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color={colors.icon} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search your favourites..."
                placeholderTextColor={colors.icon}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.icon} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Filter Options */}
      <View style={[styles.filtersContainer, { borderBottomColor: colors.card }]}>
        <FlatList
          data={filterOptions}
          renderItem={renderFilterItem}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        />
      </View>

      {/* Favourites List */}
      {!isUserAuthenticated ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.buttonPrimary + '20' }]}>
            <Ionicons name="log-in-outline" size={48} color={colors.buttonPrimary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Login Required</Text>
          <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
            Please login to view and manage your favorites
          </Text>
          <TouchableOpacity 
            style={[styles.exploreButton, { backgroundColor: colors.buttonPrimary }]}
            onPress={() => router.push('/auth/login' as any)}
          >
            <Text style={[styles.exploreButtonText, { color: colors.buttonText }]}>Login Now</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <FavouritesPageSkeleton colors={colors} />
      ) : filteredFavorites.length > 0 ? (
        <FlatList
          data={filteredFavorites}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.favoritesList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={colors.buttonPrimary} />
              </View>
            ) : null
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.icon + '20' }]}>
            <Ionicons 
              name={searchQuery || selectedFilter !== 'All' ? "search-outline" : "heart-outline"} 
              size={48} 
              color={colors.icon} 
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {searchQuery || selectedFilter !== 'All' ? 'No Results Found' : 'No Favourites Yet'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
            {searchQuery || selectedFilter !== 'All' 
              ? 'Try adjusting your search or filter'
              : 'Start exploring and save your favourite businesses'
            }
          </Text>
          {!searchQuery && selectedFilter === 'All' && (
            <TouchableOpacity 
              style={[styles.exploreButton, { backgroundColor: colors.buttonPrimary }]}
              onPress={() => router.push('/(tabs)/index' as any)}
            >
              <Text style={[styles.exploreButtonText, { color: colors.buttonText }]}>Explore Now</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
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
    paddingTop: 45,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    height: 165,
  },
  headerContent: {
    marginBottom: 12,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    opacity: 0.9,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'white',
    opacity: 0.9,
  },
  searchContainer: {
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filters: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  loadingMore: {
    padding: 20,
    alignItems: 'center',
  },
  favoritesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
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
  heartButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 11,
    opacity: 0.6,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
    lineHeight: 22,
  },
  exploreButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
