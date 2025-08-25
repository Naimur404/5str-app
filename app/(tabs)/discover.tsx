import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { getCategories, getTodayTrending } from '@/services/api';
import { Category, TrendingBusiness, TrendingOffering } from '@/types/api';
import { getImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';
import { DiscoveryPageSkeleton } from '@/components/SkeletonLoader';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import {
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    RefreshControl,
    Alert
} from 'react-native';
import * as Location from 'expo-location';

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [trendingBusinesses, setTrendingBusinesses] = useState<TrendingBusiness[]>([]);
  const [trendingOfferings, setTrendingOfferings] = useState<TrendingOffering[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    await requestLocationPermission();
    fetchAllData();
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      }
    } catch (error) {
      console.warn('Location permission denied or error:', error);
      // Continue without location
    }
  };

  const fetchAllData = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // Fetch both categories and trending data
      const [categoriesResponse, trendingResponse] = await Promise.all([
        getCategories(1, 50),
        getTodayTrending(location?.latitude, location?.longitude)
      ]);

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data || []);
      }

      if (trendingResponse.success) {
        setTrendingBusinesses(trendingResponse.data.trending_businesses || []);
        setTrendingOfferings(trendingResponse.data.trending_offerings || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Unable to load data. Please check your internet connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchAllData(true);
  };

  const handleCategoryPress = (category: Category) => {
    router.push(`/category/${category.id}?name=${encodeURIComponent(category.name)}&color=${encodeURIComponent(category.color_code)}`);
  };

  const getServiceIcon = (slug: string): any => {
    const iconMap: { [key: string]: any } = {
      'restaurants': 'restaurant',
      'shopping': 'bag',
      'services': 'construct',
      'entertainment': 'game-controller',
      'health-wellness': 'medical',
      'education': 'school',
      'automotive': 'car',
      'real-estate': 'home',
      'beauty': 'cut',
      'fitness': 'fitness',
      'technology': 'laptop',
      'travel': 'airplane',
    };
    return iconMap[slug] || 'business';
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity 
      style={[styles.categoryCard, { backgroundColor: colors.card }]}
      onPress={() => handleCategoryPress(item)}
    >
      <View style={[styles.categoryIcon, { backgroundColor: item.color_code + '20' }]}>
        <Ionicons name={getServiceIcon(item.slug)} size={32} color={item.color_code} />
      </View>
      <Text style={[styles.categoryName, { color: colors.text }]}>{item.name}</Text>
      <Text style={[styles.categoryCount, { color: colors.icon }]}>{item.total_businesses} businesses</Text>
    </TouchableOpacity>
  );

  const renderTrendingBusinessItem = ({ item }: { item: TrendingBusiness }) => (
    <TouchableOpacity 
      style={styles.trendingCard}
      onPress={() => router.push(`/business/${item.id}`)}
    >
      <Image 
        source={{ 
          uri: getImageUrl(item.images.logo) || getFallbackImageUrl('business')
        }} 
        style={styles.trendingImage} 
      />
      <View style={styles.trendingBadge}>
        <Ionicons name="trending-up" size={12} color="white" />
        <Text style={styles.trendingRank}>#{item.trend_rank}</Text>
      </View>
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.trendingOverlay}
      >
        <Text style={styles.trendingTitle} numberOfLines={1}>{item.business_name}</Text>
        <Text style={styles.trendingSubtitle} numberOfLines={1}>{item.category_name}</Text>
        <View style={styles.trendingMetrics}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={10} color="#FFD700" />
            <Text style={styles.ratingText}>{parseFloat(item.overall_rating).toFixed(1)}</Text>
          </View>
          <Text style={styles.priceRangeText}>{'$'.repeat(item.price_range)}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderTrendingOfferingItem = ({ item }: { item: TrendingOffering }) => (
    <TouchableOpacity 
      style={styles.trendingCard}
      onPress={() => router.push(`/offering/${item.business.id}/${item.id}`)}
    >
      <Image 
        source={{ 
          uri: getImageUrl(item.image_url) || getFallbackImageUrl('offering')
        }} 
        style={styles.trendingImage} 
      />
      <View style={styles.trendingBadge}>
        <Ionicons name="flame" size={12} color="white" />
        <Text style={styles.trendingRank}>#{item.trend_rank}</Text>
      </View>
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.trendingOverlay}
      >
        <Text style={styles.trendingTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.trendingSubtitle} numberOfLines={1}>{item.business.business_name}</Text>
        <View style={styles.trendingMetrics}>
          <Text style={styles.priceText}>৳{item.price}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      {/* Fixed Header */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Discover</Text>
        <Text style={styles.headerSubtitle}>Explore categories and find what you need</Text>
        
        {/* Search Bar */}
        <TouchableOpacity 
          style={styles.searchContainer}
          onPress={() => router.push('/search' as any)}
          activeOpacity={1}
        >
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={colors.icon} />
            <Text style={[styles.searchPlaceholder, { color: colors.icon }]}>
              Search categories, businesses...
            </Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>

      {/* Show skeleton loader while loading */}
      {loading ? (
        <DiscoveryPageSkeleton colors={colors} />
      ) : (
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.tint}
            />
          }
        >

        {/* Trending Section */}
        {(trendingBusinesses.length > 0 || trendingOfferings.length > 0) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Trending Today</Text>
            
            {/* Trending Businesses */}
            {trendingBusinesses.length > 0 && (
              <View style={styles.subsection}>
                <Text style={[styles.subsectionTitle, { color: colors.icon }]}>Trending Businesses</Text>
                <FlatList
                  data={trendingBusinesses}
                  renderItem={renderTrendingBusinessItem}
                  keyExtractor={(item) => `business-${item.id}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.trendingContainer}
                />
              </View>
            )}

            {/* Trending Offerings */}
            {trendingOfferings.length > 0 && (
              <View style={styles.subsection}>
                <Text style={[styles.subsectionTitle, { color: colors.icon }]}>Trending Offers</Text>
                <FlatList
                  data={trendingOfferings}
                  renderItem={renderTrendingOfferingItem}
                  keyExtractor={(item) => `offering-${item.id}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.trendingContainer}
                />
              </View>
            )}
          </View>
        )}

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Browse Categories</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.tint} />
              <Text style={[styles.loadingText, { color: colors.icon }]}>Loading categories...</Text>
            </View>
          ) : categories.length > 0 ? (
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={styles.categoriesContainer}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.icon }]}>
                No categories available at the moment.
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
              <Ionicons name="location-outline" size={24} color={colors.tint} />
              <Text style={[styles.actionText, { color: colors.text }]}>Nearby</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
              <Ionicons name="star-outline" size={24} color={colors.tint} />
              <Text style={[styles.actionText, { color: colors.text }]}>Top Rated</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
              <Ionicons name="time-outline" size={24} color={colors.tint} />
              <Text style={[styles.actionText, { color: colors.text }]}>Open Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
              <Ionicons name="pricetag-outline" size={24} color={colors.tint} />
              <Text style={[styles.actionText, { color: colors.text }]}>Offers</Text>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: 45,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    height: 165,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'white',
    opacity: 0.9,
    marginBottom: 12,
  },
  searchContainer: {
    marginBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
  },
  section: {
    marginVertical: 20,
  },
  subsection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 24,
    marginBottom: 12,
    opacity: 0.8,
  },
  trendingContainer: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 8,
  },
  trendingCard: {
    width: 200,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
  },
  trendingImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  trendingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendingRank: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  trendingOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  trendingTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  trendingSubtitle: {
    color: 'white',
    fontSize: 12,
    opacity: 0.9,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  trendingMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  ratingText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  priceRangeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priceText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: 'rgba(46, 204, 113, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoriesContainer: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 32,
  },
  categoryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyState: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
