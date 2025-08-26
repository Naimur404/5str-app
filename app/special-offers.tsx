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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { getSpecialOffers } from '@/services/api';
import { SpecialOffer } from '@/types/api';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocation } from '@/contexts/LocationContext';
import { Colors } from '@/constants/Colors';
import { getImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';

interface OfferCardProps {
  offer: SpecialOffer;
  onPress: () => void;
  colors: any;
}

const OfferCard: React.FC<OfferCardProps> = ({ offer, onPress, colors }) => (
  <TouchableOpacity 
    style={[styles.offerCard, { backgroundColor: colors.card }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.offerRow}>
      <View style={styles.offerImageContainer}>
        <Image 
          source={{ 
            uri: getImageUrl(offer.business.logo_image) || getFallbackImageUrl('business') 
          }} 
          style={styles.offerImage} 
        />
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>
            {offer.discount_percentage ? `${offer.discount_percentage}%` : 'DEAL'}
          </Text>
        </View>
      </View>

      <View style={styles.offerContent}>
        <View style={styles.offerMainInfo}>
          <Text style={[styles.offerTitle, { color: colors.text }]} numberOfLines={2}>
            {offer.title}
          </Text>
          <Text style={[styles.businessName, { color: colors.icon }]} numberOfLines={1}>
            {offer.business.business_name}
          </Text>
        </View>
        
        <View style={styles.offerMetrics}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={[styles.ratingText, { color: colors.text }]}>
              {parseFloat(offer.business.overall_rating || '0').toFixed(1)}
            </Text>
            <Text style={[styles.reviewCountText, { color: colors.icon }]}>
              ({(offer.business as any).total_reviews || 0})
            </Text>
          </View>
          
          {(offer.business as any).distance_km && (
            <Text style={[styles.distanceText, { color: colors.buttonPrimary }]}>
              {(offer.business as any).distance_km}
            </Text>
          )}
        </View>

        {(offer.valid_to || offer.valid_until) && (
          <View style={styles.expiryContainer}>
            <Ionicons name="time-outline" size={12} color={colors.icon} />
            <Text style={[styles.expiryText, { color: colors.icon }]} numberOfLines={1}>
              Valid until {new Date((offer.valid_to || offer.valid_until)!).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.offerActions}>
        <View style={[styles.savingsBadge, { backgroundColor: colors.buttonPrimary + '20' }]}>
          <Text style={[styles.savingsText, { color: colors.buttonPrimary }]}>
            {offer.discount_percentage}% OFF
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

export default function SpecialOffersScreen() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { getCoordinatesForAPI } = useLocation();
  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<SpecialOffer[]>([]);
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

  const fetchSpecialOffers = async (page: number = 1, isRefresh: boolean = false) => {
    try {
      if (page === 1 && !isRefresh) setLoading(true);
      if (isRefresh) setRefreshing(true);
      if (page > 1) setLoadingMore(true);

      // Get location using LocationContext for instant access
      const coordinates = await getCoordinatesForAPI();
      if (!coordinates) {
        Alert.alert('Location Error', 'Unable to get your location. Please try again.');
        return;
      }

      const response = await getSpecialOffers(
        coordinates.latitude,
        coordinates.longitude,
        20, // limit
        30, // radius
        page
      );

      if (response.success) {
        const newOffers = response.data.offers || [];
        
        if (page === 1 || isRefresh) {
          setOffers(newOffers);
          setCurrentPage(1);
        } else {
          setOffers(prev => [...prev, ...newOffers]);
        }
        
        setCurrentPage(page);
        setHasMorePages(response.data.pagination?.has_more || false);
        setLocation(response.data.location);
      } else {
        Alert.alert('Error', 'Failed to load special offers. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching special offers:', error);
      Alert.alert('Error', 'Unable to load offers. Please check your internet connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchSpecialOffers();
  }, []);

  useEffect(() => {
    filterOffers();
  }, [searchQuery, offers]);

  const filterOffers = () => {
    let filtered = offers;

    if (searchQuery) {
      filtered = filtered.filter((offer: SpecialOffer) => {
        return offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
               offer.business.business_name.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    setFilteredOffers(filtered);
  };

  const handleRefresh = () => {
    fetchSpecialOffers(1, true);
  };

  const loadMore = () => {
    if (hasMorePages && !loadingMore) {
      fetchSpecialOffers(currentPage + 1);
    }
  };

  const handleOfferPress = (offer: SpecialOffer) => {
    router.push(`/offer/${offer.id}`);
  };

  const handleBackPress = () => {
    router.back();
  };

  const renderOfferItem = ({ item }: { item: SpecialOffer }) => (
    <OfferCard
      offer={item}
      onPress={() => handleOfferPress(item)}
      colors={colors}
    />
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
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Ionicons name="gift-outline" size={32} color="white" style={styles.headerIcon} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Special Offers</Text>
              <Text style={styles.headerSubtitle}>
                {location 
                  ? `${offers.length} offers within ${location.radius_km}km`
                  : 'Amazing deals and discounts near you'
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
              placeholder="Search offers..."
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

      {/* Offers List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.buttonPrimary} />
          <Text style={[styles.loadingText, { color: colors.icon }]}>
            Loading special offers...
          </Text>
        </View>
      ) : filteredOffers.length > 0 ? (
        <FlatList
          data={filteredOffers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOfferItem}
          contentContainerStyle={styles.offersList}
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
              name={searchQuery ? "search-outline" : "gift-outline"} 
              size={48} 
              color={colors.icon} 
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {searchQuery ? 'No Results Found' : 'No Special Offers'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
            {searchQuery 
              ? 'Try adjusting your search terms'
              : 'We couldn\'t find any special offers in your area.'
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
  offersList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  offerCard: {
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
  offerRow: {
    flexDirection: 'row',
    padding: 12,
  },
  offerImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  offerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#FF4444',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  offerContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  offerMainInfo: {
    marginBottom: 6,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 20,
  },
  businessName: {
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.7,
  },
  offerMetrics: {
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
    fontWeight: '500',
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryText: {
    fontSize: 12,
    flex: 1,
    opacity: 0.6,
  },
  offerActions: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    minHeight: 80,
    paddingVertical: 4,
  },
  savingsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 36,
    alignItems: 'center',
  },
  savingsText: {
    fontSize: 12,
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
