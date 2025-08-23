import { API_CONFIG, getApiUrl } from '@/constants/Api';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Banner, Business, HomeResponse, SpecialOffer, TopService } from '@/types/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - 48;
const SERVICE_ITEM_WIDTH = (width - 72) / 4;

export default function HomeScreen() {
  const [homeData, setHomeData] = useState<HomeResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState('Chittagong');
  
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (location) {
      fetchHomeData();
    }
  }, [location]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to discover nearby businesses.',
          [
            { text: 'Skip', onPress: () => setDefaultLocation() },
            { text: 'Retry', onPress: () => requestLocationPermission() }
          ]
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      // Get address from coordinates
      const addresses = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (addresses.length > 0) {
        const address = addresses[0];
        setUserLocation(address.city || address.district || 'Current Location');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setDefaultLocation();
    }
  };

  const setDefaultLocation = () => {
    // Default location (Chittagong)
    setLocation({ latitude: 22.3569, longitude: 91.7832 });
    setUserLocation('Chittagong');
  };

  const fetchHomeData = async () => {
    if (!location) return;

    try {
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.HOME)}?latitude=${location.latitude}&longitude=${location.longitude}&radius=15`;
      const response = await fetch(url);
      const data: HomeResponse = await response.json();

      if (data.success) {
        setHomeData(data.data);
      } else {
        Alert.alert('Error', 'Failed to load home data');
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchQuery)}` as any);
  };

  const renderBanner = ({ item }: { item: Banner }) => (
    <TouchableOpacity style={styles.bannerItem}>
      <Image source={{ uri: item.image_url }} style={styles.bannerImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.bannerOverlay}
      >
        <Text style={styles.bannerTitle}>{item.title}</Text>
        <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderServiceItem = ({ item }: { item: TopService }) => (
    <TouchableOpacity 
      style={styles.serviceItem}
      onPress={() => {
        router.push(`/category/${item.id}?name=${encodeURIComponent(item.name)}&color=${encodeURIComponent(item.color_code)}`);
      }}
    >
      <View style={[styles.serviceIcon, { backgroundColor: item.color_code + '20' }]}>
        <Ionicons 
          name={getServiceIcon(item.slug)} 
          size={24} 
          color={item.color_code} 
        />
      </View>
      <Text style={[styles.serviceName, { color: colors.text }]} numberOfLines={2}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderBusinessCard = ({ item }: { item: Business }) => (
    <TouchableOpacity 
      style={[styles.businessCard, { backgroundColor: colors.background }]}
      onPress={() => {
        router.push(`/business/${item.id}` as any);
      }}
    >
      <Image source={{ uri: item.logo_image }} style={styles.businessImage} />
      <View style={styles.businessInfo}>
        <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={1}>
          {item.business_name}
        </Text>
        <Text style={[styles.businessCategory, { color: colors.icon }]} numberOfLines={1}>
          {item.category_name} • {item.subcategory_name}
        </Text>
        <Text style={[styles.businessLandmark, { color: colors.icon }]} numberOfLines={1}>
          {item.landmark}
        </Text>
        <View style={styles.businessMeta}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={[styles.rating, { color: colors.text }]}>{item.overall_rating}</Text>
          </View>
          <Text style={[styles.priceRange, { color: colors.icon }]}>
            {'$'.repeat(item.price_range)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderOfferCard = ({ item }: { item: SpecialOffer }) => (
    <TouchableOpacity 
      style={[styles.offerCard, { backgroundColor: colors.background }]}
      onPress={() => {
        router.push(`/offer/${item.id}` as any);
      }}
    >
      <Image source={{ uri: item.business.logo_image }} style={styles.offerImage} />
      <View style={styles.discountBadge}>
        <Text style={styles.discountText}>{item.discount_percentage}% OFF</Text>
      </View>
      <View style={styles.offerInfo}>
        <Text style={[styles.offerTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.offerDescription, { color: colors.icon }]} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={[styles.offerBusiness, { color: colors.icon }]}>
          {item.business.business_name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const getServiceIcon = (slug: string): any => {
    const iconMap: { [key: string]: any } = {
      'restaurants': 'restaurant',
      'shopping': 'bag',
      'services': 'construct',
      'entertainment': 'game-controller',
      'health-wellness': 'medical',
    };
    return iconMap[slug] || 'business';
  };

  if (loading && !homeData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={['#6366f1', '#8b5cf6', '#a855f7']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View style={styles.welcomeSection}>
              <Text style={styles.greeting}>Hello, Naimur</Text>
              <TouchableOpacity style={styles.locationContainer}>
                <Ionicons name="location-outline" size={16} color="white" />
                <Text style={styles.location}>{userLocation}</Text>
                <Ionicons name="airplane-outline" size={16} color="white" />
                <Text style={styles.changeLocation}>Change</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <TouchableOpacity 
            style={styles.searchContainer}
            onPress={() => router.push('/search' as any)}
          >
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color={colors.icon} />
              <Text style={[styles.searchPlaceholder, { color: colors.icon }]}>
                Search for nearby restaurants...
              </Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>

        {/* Hero Banners */}
        {homeData?.banners && homeData.banners.filter(b => b.position === 'hero').length > 0 && (
          <View style={styles.section}>
            <FlatList
              data={homeData.banners.filter(b => b.position === 'hero')}
              renderItem={renderBanner}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bannerContainer}
              snapToInterval={BANNER_WIDTH + 16}
              decelerationRate="fast"
            />
          </View>
        )}

        {/* Top Services */}
        {homeData?.top_services && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Services</Text>
            <View style={styles.servicesGrid}>
              {homeData.top_services.slice(0, 4).map((item) => (
                <View key={item.id}>
                  {renderServiceItem({ item })}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Popular Services Nearby */}
        {homeData?.popular_nearby && homeData.popular_nearby.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Services Nearby</Text>
              <TouchableOpacity>
                <Text style={[styles.viewAll, { color: colors.tint }]}>View All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={homeData.popular_nearby}
              renderItem={renderBusinessCard}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.businessContainer}
            />
          </View>
        )}

        {/* Dynamic Sections */}
        {homeData?.dynamic_sections && homeData.dynamic_sections.map((section) => (
          <View key={section.section_slug} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.section_name}</Text>
              <TouchableOpacity>
                <Text style={[styles.viewAll, { color: colors.tint }]}>View All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={section.businesses}
              renderItem={renderBusinessCard}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.businessContainer}
            />
          </View>
        ))}

        {/* Special Offers */}
        {homeData?.special_offers && homeData.special_offers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Special Offers</Text>
              <TouchableOpacity>
                <Text style={[styles.viewAll, { color: colors.tint }]}>View All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={homeData.special_offers}
              renderItem={renderOfferCard}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.businessContainer}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  welcomeSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    color: 'white',
    fontSize: 14,
  },
  changeLocation: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  notificationButton: {
    padding: 8,
  },
  searchContainer: {
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
  },
  section: {
    marginVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  bannerContainer: {
    paddingHorizontal: 20,
  },
  bannerItem: {
    width: BANNER_WIDTH,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 4,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  bannerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  bannerSubtitle: {
    color: 'white',
    fontSize: 15,
    opacity: 0.95,
    lineHeight: 20,
  },
  servicesContainer: {
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  serviceItem: {
    alignItems: 'center',
    width: SERVICE_ITEM_WIDTH,
    paddingVertical: 8,
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  businessContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  businessCard: {
    width: 200,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  businessImage: {
    width: '100%',
    height: 120,
  },
  businessInfo: {
    padding: 12,
  },
  businessName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  businessCategory: {
    fontSize: 12,
    marginBottom: 2,
  },
  businessLandmark: {
    fontSize: 12,
    marginBottom: 8,
  },
  businessMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 12,
    fontWeight: '500',
  },
  priceRange: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  offerCard: {
    width: 280,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 4,
  },
  offerImage: {
    width: '100%',
    height: 140,
  },
  offerInfo: {
    padding: 16,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  offerDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  offerBusiness: {
    fontSize: 13,
    fontWeight: '500',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
