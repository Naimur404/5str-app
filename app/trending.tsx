import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { getTodayTrending } from '@/services/api';
import { TrendingBusiness, TrendingOffering } from '@/types/api';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocation } from '@/contexts/LocationContext';
import { Colors } from '@/constants/Colors';
import { getImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';
import { BusinessListSkeleton } from '@/components/SkeletonLoader';

// Business Card Component
interface BusinessCardProps {
  business: TrendingBusiness;
  onPress: () => void;
  colors: any;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business, onPress, colors }) => (
  <TouchableOpacity 
    style={[styles.serviceCard, { backgroundColor: colors.card }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.serviceRow}>
      <View style={styles.serviceImageContainer}>
        <Image
          source={{ 
            uri: getImageUrl(business?.images?.logo) || getFallbackImageUrl('business')
          }}
          style={styles.serviceImage}
        />
        {business?.is_verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          </View>
        )}
      </View>

      <View style={styles.serviceContent}>
        <View style={styles.serviceMainInfo}>
          <Text style={[styles.serviceName, { color: colors.text }]} numberOfLines={1}>
            {business?.business_name || 'Business Name'}
          </Text>
          <Text style={[styles.serviceCategory, { color: colors.icon }]} numberOfLines={1}>
            {business?.category?.name || 'Category'} • {business?.subcategory?.name || 'Subcategory'}
          </Text>
          {business?.area && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color={colors.icon} />
              <Text style={[styles.locationText, { color: colors.icon }]} numberOfLines={1}>
                {business.area}
              </Text>
            </View>
          )}
          
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, styles.trendingBadge]}>
              <Ionicons name="trending-up" size={10} color="#FFFFFF" />
              <Text style={styles.badgeText}>Trending</Text>
            </View>
            {business?.is_featured && (
              <View style={[styles.badge, styles.featuredBadge]}>
                <Ionicons name="star" size={10} color="#FFFFFF" />
                <Text style={styles.badgeText}>Featured</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.serviceActions}>
        <View style={[styles.serviceCountBadge, { backgroundColor: colors.buttonPrimary + '20' }]}>
          <Text style={[styles.serviceCountBadgeText, { color: colors.buttonPrimary }]}>
            #{business?.trend_rank || 'N/A'}
          </Text>
        </View>
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={colors.icon} 
          style={{ marginTop: 8 }}
        />
      </View>
    </View>
  </TouchableOpacity>
);

// Offering Card Component  
interface OfferingCardProps {
  offering: TrendingOffering;
  onPress: () => void;
  colors: any;
}

const OfferingCard: React.FC<OfferingCardProps> = ({ offering, onPress, colors }) => (
  <TouchableOpacity 
    style={[styles.serviceCard, { backgroundColor: colors.card }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.serviceRow}>
      <View style={styles.serviceImageContainer}>
        <Image
          source={{ 
            uri: getImageUrl(offering?.image_url) || getFallbackImageUrl('offering')
          }}
          style={styles.serviceImage}
        />
      </View>

      <View style={styles.serviceContent}>
        <View style={styles.serviceMainInfo}>
          <Text style={[styles.serviceName, { color: colors.text }]} numberOfLines={1}>
            {offering?.name || 'Offering Name'}
          </Text>
          <Text style={[styles.serviceCategory, { color: colors.icon }]} numberOfLines={1}>
            {offering?.business?.business_name || 'Business Name'}
          </Text>
          <Text style={[styles.offeringDescription, { color: colors.icon }]} numberOfLines={1}>
            {offering?.description || 'No description available'}
          </Text>
          
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, styles.offeringBadge]}>
              <Ionicons name="pricetag" size={10} color="#FFFFFF" />
              <Text style={styles.badgeText}>{offering?.offering_type || 'Service'}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.serviceActions}>
        <View style={[styles.serviceCountBadge, { backgroundColor: colors.buttonPrimary + '20' }]}>
          <Text style={[styles.serviceCountBadgeText, { color: colors.buttonPrimary }]}>
            #{offering?.trend_rank || 'N/A'}
          </Text>
        </View>
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={colors.icon} 
          style={{ marginTop: 8 }}
        />
      </View>
    </View>
  </TouchableOpacity>
);

export default function TrendingScreen() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { location, getCoordinatesForAPI } = useLocation();
  const [trendingBusinesses, setTrendingBusinesses] = useState<TrendingBusiness[]>([]);
  const [trendingOfferings, setTrendingOfferings] = useState<TrendingOffering[]>([]);
  const [allTrendingItems, setAllTrendingItems] = useState<(TrendingBusiness | TrendingOffering)[]>([]);
  const [filteredItems, setFilteredItems] = useState<(TrendingBusiness | TrendingOffering)[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTrendingData();
  }, []);

  useEffect(() => {
    if (location) {
      fetchTrendingData();
    }
  }, [location]);

  useEffect(() => {
    filterItems();
  }, [searchQuery, allTrendingItems]);

  const fetchTrendingData = async () => {
    try {
      setLoading(true);
      
      // Get coordinates from LocationContext (instant, no permission delays!)
      const coordinates = getCoordinatesForAPI();
      
      if (!coordinates || typeof coordinates.latitude !== 'number' || typeof coordinates.longitude !== 'number') {
        throw new Error('Invalid coordinates from location service');
      }
      
      const response = await getTodayTrending(coordinates.latitude, coordinates.longitude);
      
      if (response?.success && response?.data) {
        const businesses = Array.isArray(response.data.trending_businesses) ? response.data.trending_businesses : [];
        const offerings = Array.isArray(response.data.trending_offerings) ? response.data.trending_offerings : [];
        
        setTrendingBusinesses(businesses);
        setTrendingOfferings(offerings);
        
        // Combine and shuffle for mixed display
        const combined = [...businesses, ...offerings];
        setAllTrendingItems(combined);
        setFilteredItems(combined);
      } else {
        console.error('API response error:', response);
        Alert.alert('Error', 'Failed to load trending data. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching trending data:', error);
      Alert.alert('Error', 'Unable to load trending data. Please check your internet connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterItems = () => {
    if (!searchQuery.trim()) {
      setFilteredItems(allTrendingItems);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allTrendingItems.filter((item) => {
      if ('business_name' in item) {
        // Business item
        return (
          item.business_name?.toLowerCase().includes(query) ||
          item.category?.name?.toLowerCase().includes(query) ||
          item.subcategory?.name?.toLowerCase().includes(query) ||
          item.area?.toLowerCase().includes(query)
        );
      } else {
        // Offering item
        return (
          item.name?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.business?.business_name?.toLowerCase().includes(query) ||
          item.offering_type?.toLowerCase().includes(query)
        );
      }
    });

    setFilteredItems(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrendingData();
    setRefreshing(false);
  };

  const handleItemPress = (item: TrendingBusiness | TrendingOffering) => {
    try {
      if ('business_name' in item) {
        // Business item - ensure ID exists
        if (item?.id) {
          router.push(`/business/${item.id}`);
        } else {
          console.error('Business item missing ID:', item);
          Alert.alert('Error', 'Unable to view this business. Missing ID.');
        }
      } else {
        // Offering item - ensure both business ID and offering ID exist
        if (item?.business?.id && item?.id) {
          router.push(`/offering/${item.business.id}/${item.id}`);
        } else {
          console.error('Offering item missing required IDs:', {
            businessId: item?.business?.id,
            offeringId: item?.id,
            item
          });
          Alert.alert('Error', 'Unable to view this offering. Missing required information.');
        }
      }
    } catch (error) {
      console.error('Error navigating to item:', error);
      Alert.alert('Error', 'Unable to open this item. Please try again.');
    }
  };

  const renderItem = ({ item }: { item: TrendingBusiness | TrendingOffering }) => {
    if ('business_name' in item) {
      return (
        <BusinessCard
          business={item}
          onPress={() => handleItemPress(item)}
          colors={colors}
        />
      );
    } else {
      return (
        <OfferingCard
          offering={item}
          onPress={() => handleItemPress(item)}
          colors={colors}
        />
      );
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        
        {/* Header */}
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          style={styles.headerLoading}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTitleContainer}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <Ionicons name="trending-up" size={32} color="white" style={styles.headerIcon} />
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Trending Today</Text>
                <Text style={styles.headerSubtitle}>
                  Discover what's trending now
                </Text>
              </View>
            </View>
          </View>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color={colors.icon} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search trending items..."
                placeholderTextColor={colors.icon}
                value={searchQuery}
                onChangeText={setSearchQuery}
                editable={false}
              />
            </View>
          </View>
        </LinearGradient>

        {/* Skeleton Loading */}
        <BusinessListSkeleton colors={colors} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      {/* Header outside FlatList */}
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        style={styles.headerLoading}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Ionicons name="trending-up" size={32} color="white" style={styles.headerIcon} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Trending Today</Text>
              <Text style={styles.headerSubtitle}>
                {filteredItems.length > 0 
                  ? `${filteredItems.length} trending items found`
                  : 'Discover what\'s trending now'
                }
              </Text>
            </View>
          </View>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={colors.icon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search trending items..."
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
      </LinearGradient>
      
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item, index) => {
          // Ensure unique keys with proper fallbacks
          const itemId = item?.id || index;
          const itemType = 'business_name' in item ? 'business' : 'offering';
          return `trending-${itemType}-${itemId}-${index}`;
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.tint}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="trending-up-outline" size={80} color={colors.icon} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {searchQuery ? 'No Results Found' : 'No Trending Data'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
                {searchQuery 
                  ? `No trending items match "${searchQuery}". Try a different search term.`
                  : "There's no trending data available right now. Check back later!"
                }
              </Text>
              {!searchQuery && (
                <TouchableOpacity 
                  style={[styles.retryButton, { backgroundColor: colors.tint }]}
                  onPress={fetchTrendingData}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
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
    marginHorizontal: -16,
    marginTop: -8,
    marginBottom: 8,
  },
  headerLoading: {
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
    gap: 12,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerIcon: {
    opacity: 0.9,
  },
  headerTextContainer: {
    flex: 1,
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
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  serviceCard: {
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  serviceRow: {
    flexDirection: 'row',
    padding: 12,
  },
  serviceImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f5f9',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 2,
  },
  serviceContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  serviceMainInfo: {
    marginBottom: 6,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 20,
  },
  serviceCategory: {
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.7,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    flex: 1,
    opacity: 0.7,
  },
  offeringDescription: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  featuredBadge: {
    backgroundColor: '#FF3B30',
  },
  trendingBadge: {
    backgroundColor: '#059669',
  },
  offeringBadge: {
    backgroundColor: '#FF6B35',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  serviceActions: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    minHeight: 80,
    paddingVertical: 4,
  },
  serviceCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 32,
    alignItems: 'center',
  },
  serviceCountBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
