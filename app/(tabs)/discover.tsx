import { DiscoveryPageSkeleton } from '@/components/SkeletonLoader';
import { Colors } from '@/constants/Colors';
import { useLocation } from '@/contexts/LocationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getCategories, getTodayTrending } from '@/services/api';
import { Category, TrendingBusiness, TrendingOffering } from '@/types/api';
import { getFallbackImageUrl, getImageUrl } from '@/utils/imageUtils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [trendingBusinesses, setTrendingBusinesses] = useState<TrendingBusiness[]>([]);
  const [trendingOfferings, setTrendingOfferings] = useState<TrendingOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { getCoordinatesForAPI } = useLocation();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // Get coordinates from location service
      const coordinates = getCoordinatesForAPI();

      // Fetch categories and trending data
      const [categoriesResponse, trendingResponse] = await Promise.all([
        getCategories(1, 50),
        getTodayTrending(coordinates.latitude, coordinates.longitude)
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

  const renderCategoryItem = ({ item, index }: { item: Category; index: number }) => (
    <TouchableOpacity 
      style={[
        styles.categoryCard, 
        { 
          backgroundColor: colors.card,
          borderWidth: colorScheme === 'dark' ? 1 : 0,
          borderColor: colorScheme === 'dark' ? colors.border : 'transparent'
        }
      ]}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.8}
    >
      <View style={[styles.categoryIcon, { backgroundColor: item.color_code + '20' }]}>
        <Ionicons name={getServiceIcon(item.slug)} size={24} color={item.color_code} />
      </View>
      <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
      <View style={styles.categoryMeta}>
        <View style={[styles.businessCountBadge, { backgroundColor: colors.tint + '15' }]}>
          <Ionicons name="business-outline" size={12} color={colors.tint} />
          <Text style={[styles.categoryCount, { color: colors.tint }]}>{item.total_businesses}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTrendingBusinessItem = ({ item }: { item: TrendingBusiness }) => (
    <TouchableOpacity 
      style={[
        styles.trendingCard,
        {
          shadowColor: colorScheme === 'dark' ? '#000' : '#000',
          shadowOpacity: colorScheme === 'dark' ? 0.4 : 0.2,
        }
      ]}
      onPress={() => router.push(`/business/${item.id}`)}
      activeOpacity={0.9}
    >
      <Image 
        source={{ 
          uri: getImageUrl(item.images.logo) || getFallbackImageUrl('business')
        }} 
        style={styles.trendingImage} 
      />
      <View style={[styles.trendingBadge, { backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255, 255, 255, 0.95)' }]}>
        <Ionicons name="trending-up" size={12} color="#FF6B35" />
        <Text style={[styles.trendingRank, { color: colorScheme === 'dark' ? '#fff' : colors.text }]}>#{item.trend_rank}</Text>
      </View>
      <LinearGradient
        colors={colorScheme === 'dark' 
          ? ['transparent', 'rgba(0,0,0,0.9)'] 
          : ['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.trendingOverlay}
      >
        <Text style={styles.trendingTitle} numberOfLines={1}>{item.business_name}</Text>
        <Text style={styles.trendingSubtitle} numberOfLines={1}>{item.category.name}</Text>
        <View style={styles.trendingMetrics}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={10} color="#FFD700" />
            <Text style={styles.ratingText}>{parseFloat(item.overall_rating).toFixed(1)}</Text>
          </View>
          <View style={styles.priceRangeBadge}>
            <Text style={styles.priceRangeText}>{'$'.repeat(item.price_range)}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderTrendingOfferingItem = ({ item }: { item: TrendingOffering }) => (
    <TouchableOpacity 
      style={[
        styles.trendingCard,
        {
          shadowColor: colorScheme === 'dark' ? '#000' : '#000',
          shadowOpacity: colorScheme === 'dark' ? 0.4 : 0.2,
        }
      ]}
      onPress={() => router.push(`/offering/${item.business.id}/${item.id}`)}
      activeOpacity={0.9}
    >
      <Image 
        source={{ 
          uri: getImageUrl(item.image_url) || getFallbackImageUrl('offering')
        }} 
        style={styles.trendingImage} 
      />
      <View style={[styles.trendingBadge, { backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255, 255, 255, 0.95)' }]}>
        <Ionicons name="flame" size={12} color="#FF6B35" />
        <Text style={[styles.trendingRank, { color: colorScheme === 'dark' ? '#fff' : colors.text }]}>#{item.trend_rank}</Text>
      </View>
      <LinearGradient
        colors={colorScheme === 'dark' 
          ? ['transparent', 'rgba(0,0,0,0.9)'] 
          : ['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.trendingOverlay}
      >
        <Text style={styles.trendingTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.trendingSubtitle} numberOfLines={1}>{item.business.business_name}</Text>
        <View style={styles.trendingMetrics}>
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>৳{item.price}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Enhanced Header with Gradient */}
      <LinearGradient
        colors={colorScheme === 'dark' 
          ? [colors.headerGradientStart, colors.headerGradientEnd]
          : [colors.headerGradientStart, colors.headerGradientEnd]}
        style={styles.header}
      >
        <View>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Discover</Text>
            <View style={styles.headerBadge}>
              <Ionicons name="compass" size={14} color="white" />
              <Text style={styles.headerBadgeText}>Explore</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>Find amazing places and experiences around you</Text>
          
          {/* Enhanced Search Bar */}
          <TouchableOpacity 
            style={styles.searchContainer}
            onPress={() => router.push('/search' as any)}
            activeOpacity={0.9}
          >
            <View style={[
              styles.searchBar, 
              { 
                backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#ffffff',
                borderWidth: colorScheme === 'dark' ? 1 : 0,
                borderColor: colorScheme === 'dark' ? '#444444' : 'transparent'
              }
            ]}>
              <View style={[styles.searchIconContainer, { backgroundColor: colors.tint + '20' }]}>
                <Ionicons name="search" size={14} color={colors.tint} />
              </View>
              <Text style={[
                styles.searchPlaceholder, 
                { color: colorScheme === 'dark' ? '#999999' : colors.icon }
              ]}>
                Search categories, businesses...
              </Text>
              <Ionicons name="mic-outline" size={16} color={colorScheme === 'dark' ? '#999999' : colors.icon} />
            </View>
          </TouchableOpacity>
        </View>
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
              progressBackgroundColor={colorScheme === 'dark' ? '#333' : '#fff'}
            />
          }
        >

        {/* Trending Section with improved design */}
        {(trendingBusinesses.length > 0 || trendingOfferings.length > 0) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="flame" size={20} color="#FF6B35" />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Trending Today</Text>
              </View>
              <View style={[styles.trendingIndicator, { backgroundColor: colors.tint + '20' }]}>
                <Ionicons name="trending-up" size={14} color={colors.tint} />
                <Text style={[styles.trendingIndicatorText, { color: colors.tint }]}>Hot</Text>
              </View>
            </View>
            
            {/* Trending Businesses */}
            {trendingBusinesses.length > 0 && (
              <View style={styles.subsection}>
                <View style={styles.subsectionHeader}>
                  <Text style={[styles.subsectionTitle, { color: colors.icon }]}>🏢 Trending Businesses</Text>
                  <TouchableOpacity onPress={() => router.push('/trending')}>
                    <Text style={[styles.viewAllText, { color: colors.tint }]}>View All</Text>
                  </TouchableOpacity>
                </View>
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
                <View style={styles.subsectionHeader}>
                  <Text style={[styles.subsectionTitle, { color: colors.icon }]}>🎯 Trending Offers</Text>
                  <TouchableOpacity onPress={() => router.push('/trending')}>
                    <Text style={[styles.viewAllText, { color: colors.tint }]}>View All</Text>
                  </TouchableOpacity>
                </View>
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



        {/* Enhanced Categories Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="grid" size={20} color={colors.tint} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Browse Categories</Text>
            </View>
          </View>
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
              <Ionicons name="albums-outline" size={48} color={colors.icon} />
              <Text style={[styles.emptyText, { color: colors.icon }]}>
                No categories available at the moment.
              </Text>
            </View>
          )}
        </View>

        {/* Enhanced Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="flash" size={20} color={colors.tint} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
            </View>
          </View>
          <View style={styles.quickActions}>
            {[
              { icon: 'compass', text: 'Attractions', route: '/attractions', color: '#9C27B0' },
              { icon: 'time', text: 'Open Now', route: '/open-now', color: '#4CAF50' },
              { icon: 'location', text: 'Nearby', route: '/popular-nearby', color: '#2196F3' },
              { icon: 'star', text: 'Top Rated', route: '/top-rated', color: '#FFD700' },
              { icon: 'pricetag', text: 'Offers', route: '/special-offers', color: '#FF6B35' }
            ].map((action, index) => (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.actionButton, 
                  { 
                    backgroundColor: colors.card,
                    borderWidth: colorScheme === 'dark' ? 1 : 0,
                    borderColor: colorScheme === 'dark' ? colors.border : 'transparent'
                  }
                ]}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: action.color + '20' }]}>
                  <Ionicons name={action.icon as any} size={20} color={action.color} />
                </View>
                <Text style={[styles.actionText, { color: colors.text }]}>{action.text}</Text>
              </TouchableOpacity>
            ))}
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    height: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  headerBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'white',
    opacity: 0.9,
    marginBottom: 14,
    lineHeight: 16,
  },
  searchContainer: {
    marginBottom: 0,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  section: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  trendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendingIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
  },
  subsection: {
    marginBottom: 16,
  },
  subsectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendingContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 6,
  },
  trendingCard: {
    width: 180,
    height: 110,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  trendingRank: {
    fontSize: 9,
    fontWeight: '700',
  },
  trendingOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  trendingTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  trendingSubtitle: {
    color: 'white',
    fontSize: 11,
    opacity: 0.9,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.6)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  ratingText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '700',
  },
  priceRangeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priceRangeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  priceBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  priceText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  categoryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 110,
    justifyContent: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 16,
  },
  categoryMeta: {
    alignItems: 'center',
  },
  businessCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  categoryCount: {
    fontSize: 10,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 75,
    justifyContent: 'center',
    width: '18%', // Ensures 5 cards fit in one row with proper spacing
    minWidth: 60,
  },
  actionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
});
