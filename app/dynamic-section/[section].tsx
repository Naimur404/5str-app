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
  Image,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { getDynamicSection } from '@/services/api';
import { Business } from '@/types/api';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { getImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';
import * as Location from 'expo-location';

interface BusinessCardProps {
  business: Business;
  onPress: () => void;
  colors: any;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business, onPress, colors }) => (
  <TouchableOpacity 
    style={[styles.businessCard, { backgroundColor: colors.card }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.businessRow}>
      <View style={styles.businessImageContainer}>
        <Image 
          source={{ 
            uri: getImageUrl(business.logo_image) || getFallbackImageUrl('business') 
          }} 
          style={styles.businessImage} 
        />
      </View>

      <View style={styles.businessContent}>
        <View style={styles.businessMainInfo}>
          <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={1}>
            {business.business_name}
          </Text>
          <Text style={[styles.categoryName, { color: colors.icon }]} numberOfLines={1}>
            {business.category_name}
          </Text>
        </View>
        
        <View style={styles.businessMetrics}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={[styles.ratingText, { color: colors.text }]}>
              {parseFloat(business.overall_rating || '0').toFixed(1)}
            </Text>
            <Text style={[styles.reviewCountText, { color: colors.icon }]}>
              ({business.total_reviews || 0})
            </Text>
          </View>
          
          {business.distance_km && (
            <Text style={[styles.distanceText, { color: colors.buttonPrimary }]}>
              {business.distance_km}
            </Text>
          )}
        </View>

        {business.landmark && (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={12} color={colors.icon} />
            <Text style={[styles.locationText, { color: colors.icon }]} numberOfLines={1}>
              {business.landmark}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.businessActions}>
        <View style={[styles.priceRangeBadge, { backgroundColor: colors.buttonPrimary + '20' }]}>
          <Text style={[styles.priceRangeText, { color: colors.buttonPrimary }]}>
            {'$'.repeat(business.price_range || 1)}
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

export default function DynamicSectionScreen() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme || 'light'];
  const { section } = useLocalSearchParams();
  const sectionSlug = Array.isArray(section) ? section[0] : section || 'trending';
  
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [sectionName, setSectionName] = useState('');
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    radius_km: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const getSectionIcon = (slug: string) => {
    if (!slug) return 'grid';
    
    switch (slug.toLowerCase()) {
      case 'trending':
        return 'trending-up';
      case 'nearby':
        return 'location';
      case 'recommended':
        return 'thumbs-up';
      case 'new':
        return 'sparkles';
      case 'popular':
        return 'flame';
      default:
        return 'grid';
    }
  };

  const fetchDynamicSection = async (page: number = 1, isRefresh: boolean = false) => {
    try {
      if (page === 1 && !isRefresh) setLoading(true);
      if (isRefresh) setRefreshing(true);
      if (page > 1) setLoadingMore(true);

      // Get user's current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to show nearby businesses.');
        return;
      }

      const userLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const response = await getDynamicSection(
        sectionSlug,
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        20, // limit
        20, // radius
        page
      );

      if (response.success) {
        const newBusinesses = response.data.businesses || [];
        
        if (page === 1 || isRefresh) {
          setBusinesses(newBusinesses);
          setCurrentPage(1);
        } else {
          setBusinesses(prev => [...prev, ...newBusinesses]);
        }
        
        setCurrentPage(page);
        setHasMorePages(response.data.pagination?.has_more || false);
        setLocation(response.data.location);
        setSectionName(response.data.section_name || sectionSlug);
      } else {
        Alert.alert('Error', `Failed to load ${sectionSlug} businesses. Please try again.`);
      }
    } catch (error) {
      console.error(`Error fetching ${sectionSlug} businesses:`, error);
      Alert.alert('Error', 'Unable to load businesses. Please check your internet connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchDynamicSection();
  }, [sectionSlug]);

  useEffect(() => {
    filterBusinesses();
  }, [searchQuery, businesses]);

  const filterBusinesses = () => {
    let filtered = businesses;

    if (searchQuery) {
      filtered = filtered.filter((business: Business) => {
        const businessName = business.business_name || '';
        const categoryName = business.category_name || '';
        const searchLower = searchQuery.toLowerCase();
        
        return businessName.toLowerCase().includes(searchLower) ||
               categoryName.toLowerCase().includes(searchLower);
      });
    }

    setFilteredBusinesses(filtered);
  };

  const handleRefresh = () => {
    fetchDynamicSection(1, true);
  };

  const loadMore = () => {
    if (hasMorePages && !loadingMore) {
      fetchDynamicSection(currentPage + 1);
    }
  };

  const handleBusinessPress = (business: Business) => {
    router.push(`/business/${business.id}`);
  };

  const handleBackPress = () => {
    router.back();
  };

  const renderBusinessItem = ({ item }: { item: Business }) => (
    <BusinessCard
      business={item}
      onPress={() => handleBusinessPress(item)}
      colors={colors}
    />
  );

  const displaySectionName = sectionName || sectionSlug.charAt(0).toUpperCase() + sectionSlug.slice(1);

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
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Ionicons 
              name={getSectionIcon(sectionSlug) as any} 
              size={32} 
              color="white" 
              style={styles.headerIcon} 
            />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{displaySectionName}</Text>
              <Text style={styles.headerSubtitle}>
                {location 
                  ? `${businesses.length} businesses within ${location.radius_km}km`
                  : `Discover ${displaySectionName.toLowerCase()} businesses near you`
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
              placeholder={`Search ${displaySectionName.toLowerCase()}...`}
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

      {/* Location Info */}
      {location && (
        <View style={[styles.locationInfo, { backgroundColor: colors.background }]}>
          <View style={styles.locationRow}>
            <Ionicons 
              name="location-outline" 
              size={16} 
              color={colors.buttonPrimary} 
            />
            <Text style={[styles.locationInfoText, { color: colors.icon }]}>
              Your location • {location.radius_km}km radius
            </Text>
          </View>
        </View>
      )}

      {/* Businesses List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.buttonPrimary} />
          <Text style={[styles.loadingText, { color: colors.icon }]}>
            Loading {displaySectionName.toLowerCase()}...
          </Text>
        </View>
      ) : filteredBusinesses.length > 0 ? (
        <FlatList
          data={filteredBusinesses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBusinessItem}
          contentContainerStyle={styles.businessesList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.buttonPrimary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          showsVerticalScrollIndicator={false}
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
              name={searchQuery ? "search-outline" : getSectionIcon(sectionSlug) as any} 
              size={48} 
              color={colors.icon} 
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {searchQuery ? 'No Results Found' : `No ${displaySectionName} Found`}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
            {searchQuery 
              ? 'Try adjusting your search terms'
              : `We couldn't find any ${displaySectionName.toLowerCase()} businesses in your area.`
            }
          </Text>
          {searchQuery && (
            <TouchableOpacity 
              style={[styles.exploreButton, { backgroundColor: colors.buttonPrimary }]}
              onPress={() => setSearchQuery('')}
            >
              <Text style={[styles.exploreButtonText, { color: colors.buttonText }]}>
                Clear Search
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
  locationInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationInfoText: {
    fontSize: 14,
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
  businessesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  businessCard: {
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
  businessRow: {
    flexDirection: 'row',
    padding: 12,
  },
  businessImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  businessImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  businessContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  businessMainInfo: {
    marginBottom: 6,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 20,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.7,
  },
  businessMetrics: {
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
  distanceText: {
    fontSize: 12,
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
  businessActions: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    minHeight: 80,
    paddingVertical: 4,
  },
  priceRangeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 36,
    alignItems: 'center',
  },
  priceRangeText: {
    fontSize: 14,
    fontWeight: '700',
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
