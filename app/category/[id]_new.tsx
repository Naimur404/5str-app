import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { Business, Category, getCategoryBusinesses } from '@/services/api';
import { getImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { CategoryBusinessSkeleton } from '@/components/SkeletonLoader';

export default function CategoryBusinessesScreen() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const categoryId = parseInt(params.id as string);
  const categoryName = params.name as string;
  const categoryColor = params.color as string || '#6366f1';
  
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  useEffect(() => {
    if (categoryId) {
      getUserLocation();
    }
  }, [categoryId]);

  const getUserLocation = async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Location permission denied');
        // Load businesses without location
        loadBusinesses();
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      console.log('User location obtained:', coords);
      setUserLocation(coords);
      
      // Load businesses with location
      loadBusinesses(1, false, coords);
    } catch (error) {
      console.error('Error getting location:', error);
      // Load businesses without location
      loadBusinesses();
    }
  };

  const loadBusinesses = async (
    page: number = 1, 
    isRefresh: boolean = false, 
    location?: { latitude: number; longitude: number }
  ) => {
    try {
      if (page === 1) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      // Use provided location or stored user location
      const coords = location || userLocation;
      
      console.log('Loading businesses with coordinates:', coords);
      
      const response = await getCategoryBusinesses(
        categoryId, 
        page,
        coords?.latitude,
        coords?.longitude
      );
      
      if (response.success) {
        const newBusinesses = response.data.businesses;
        
        if (isRefresh || page === 1) {
          setBusinesses(newBusinesses);
          setCategory(response.data.category);
        } else {
          setBusinesses(prev => [...prev, ...newBusinesses]);
        }
        
        setHasMore(response.data.pagination.has_more);
        setCurrentPage(page);
      } else {
        setError('Failed to load businesses');
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
      setError('Unable to connect to server. Please check your internet connection.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBusinesses(1, true);
  };

  const loadMore = async () => {
    if (!loadingMore && hasMore) {
      await loadBusinesses(currentPage + 1);
    }
  };

  const getPriceRangeText = (priceRange: number) => {
    const ranges = {
      1: '$',
      2: '$$',
      3: '$$$',
      4: '$$$$'
    };
    return ranges[priceRange as keyof typeof ranges] || '$$';
  };

  const getBusinessImage = (business: Business) => {
    return getImageUrl(business.logo_image) || getFallbackImageUrl('business');
  };

  const renderBusinessItem = ({ item }: { item: Business }) => (
    <TouchableOpacity 
      style={[styles.businessCard, { backgroundColor: colors.card }]}
      onPress={() => {
        console.log('Business card clicked:', item.business_name, 'ID:', item.id);
        router.push(`/business/${item.id}` as any);
      }}
    >
      <View style={styles.businessContent}>
        <Image 
          source={{ uri: getBusinessImage(item) }} 
          style={styles.businessImage}
        />
        
        <View style={styles.businessInfo}>
          <View style={styles.businessHeader}>
            <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={1}>
              {item.business_name}
            </Text>
            {item.is_verified && (
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            )}
          </View>
          
          <Text style={[styles.businessDescription, { color: colors.icon }]} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.businessMeta}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={[styles.rating, { color: colors.text }]}>
                {parseFloat(item.overall_rating).toFixed(1)}
              </Text>
              <Text style={[styles.reviewCount, { color: colors.icon }]}>
                ({item.total_reviews})
              </Text>
            </View>
            
            <View style={styles.priceContainer}>
              <Text style={[styles.priceRange, { color: colors.tint }]}>
                {getPriceRangeText(item.price_range)}
              </Text>
            </View>
          </View>
          
          <View style={styles.businessFeatures}>
            <Text style={[styles.locationText, { color: colors.icon }]} numberOfLines={1}>
              {item.area}, {item.city}
            </Text>
            
            <View style={styles.features}>
              {item.has_delivery && (
                <View style={[styles.featureTag, { backgroundColor: colors.tint + '20' }]}>
                  <Ionicons name="bicycle" size={10} color={colors.tint} />
                  <Text style={[styles.featureText, { color: colors.tint }]}>Delivery</Text>
                </View>
              )}
              {item.has_pickup && (
                <View style={[styles.featureTag, { backgroundColor: colors.tint + '20' }]}>
                  <Ionicons name="bag" size={10} color={colors.tint} />
                  <Text style={[styles.featureText, { color: colors.tint }]}>Pickup</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.icon }]}>Loading more businesses...</Text>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (error) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Connection Error</Text>
          <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
            {error}
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={() => loadBusinesses(1, true)}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="business-outline" size={64} color={colors.icon} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Businesses Found</Text>
        <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
          We couldn't find any businesses in this category for your location yet.
        </Text>
        <Text style={[styles.emptyHint, { color: colors.icon }]}>
          Try refreshing or check back later as new businesses are added regularly.
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: categoryColor }]}>
        <StatusBar style="light" backgroundColor={categoryColor} />
        {/* Header */}
        <LinearGradient
          colors={[categoryColor, categoryColor + 'DD']}
          style={styles.header}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{categoryName || 'Category'}</Text>
            <Text style={styles.headerSubtitle}>Discovering businesses...</Text>
          </View>
        </LinearGradient>

        {/* Skeleton Loading */}
        <View style={styles.content}>
          {[...Array(5)].map((_, index) => (
            <CategoryBusinessSkeleton key={index} colors={colors} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: categoryColor }]}>
      <StatusBar style="light" backgroundColor={categoryColor} />
      {/* Header */}
      <LinearGradient
        colors={[categoryColor, categoryColor + 'DD']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {category?.name || categoryName || 'Category'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {businesses.length} business{businesses.length !== 1 ? 'es' : ''} found
          </Text>
        </View>
      </LinearGradient>

      {/* Businesses List */}
      {businesses.length > 0 ? (
        <FlatList
          data={businesses}
          renderItem={renderBusinessItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.tint]}
              tintColor={colors.tint}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyState()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 24,
    top: 50,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  businessCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 4,
  },
  businessContent: {
    flexDirection: 'row',
    padding: 16,
  },
  businessImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  businessInfo: {
    flex: 1,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  businessDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  businessMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 12,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceRange: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  businessFeatures: {
    gap: 6,
  },
  locationText: {
    fontSize: 12,
  },
  features: {
    flexDirection: 'row',
    gap: 8,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  featureText: {
    fontSize: 10,
    fontWeight: '500',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
    marginBottom: 12,
  },
  emptyHint: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
