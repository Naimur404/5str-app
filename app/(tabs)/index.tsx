import { API_CONFIG, getApiUrl } from '@/constants/Api';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';
import { Banner, Business, HomeResponse, SpecialOffer, TopService } from '@/types/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
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
const BANNER_WIDTH = width - 48;
const SERVICE_ITEM_WIDTH = (width - 72) / 4;

export default function HomeScreen() {
  const [homeData, setHomeData] = useState<HomeResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState('Chittagong');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Sample banner data for display when no API data is available
  const sampleBanners: Banner[] = [
    {
      id: 1,
      title: "Best Restaurants in Dhaka",
      subtitle: "Discover amazing dining experiences near you",
      image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
      link_type: "category",
      link_id: 1,
      link_url: "",
      position: "hero",
      target_location: null,
      is_active: true,
      sort_order: 1,
      start_date: "",
      end_date: "",
      click_count: 0,
      view_count: 0
    },
    {
      id: 2,
      title: "Shopping Destinations",
      subtitle: "Find the best shops and markets in your area",
      image_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
      link_type: "category",
      link_id: 2,
      link_url: "",
      position: "hero",
      target_location: null,
      is_active: true,
      sort_order: 2,
      start_date: "",
      end_date: "",
      click_count: 0,
      view_count: 0
    },
    {
      id: 3,
      title: "Health & Wellness",
      subtitle: "Your health is our priority - book services now",
      image_url: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2331&q=80",
      link_type: "category",
      link_id: 3,
      link_url: "",
      position: "hero",
      target_location: null,
      is_active: true,
      sort_order: 3,
      start_date: "",
      end_date: "",
      click_count: 0,
      view_count: 0
    }
  ];
  
  const bannerRef = useRef<FlatList<Banner>>(null);
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

  // Auto-scroll banners every 4 seconds
  useEffect(() => {
    if (sampleBanners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentBannerIndex(prevIndex => {
        const nextIndex = prevIndex === sampleBanners.length - 1 ? 0 : prevIndex + 1;
        // Use a timeout to ensure the ref is ready
        setTimeout(() => {
          try {
            bannerRef.current?.scrollToOffset({ 
              offset: nextIndex * (width - 48), 
              animated: true 
            });
          } catch (error) {
            console.warn('Auto-scroll failed');
          }
        }, 50);
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [sampleBanners]);

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
      <Image source={{ uri: getImageUrl(item.logo_image) || getFallbackImageUrl('business') }} style={styles.businessImage} />
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
      <Image source={{ uri: getImageUrl(item.business.logo_image) || getFallbackImageUrl('business') }} style={styles.offerImage} />
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      {/* Fixed Header */}
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

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banners - New Clean Implementation */}
        <View style={styles.heroSection}>
          <FlatList
            ref={bannerRef}
            data={sampleBanners}
            renderItem={({ item, index }) => (
              <View style={styles.heroSlide}>
                <Image 
                  source={{ uri: item.image_url }} 
                  style={styles.heroImage}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.6)']}
                  style={styles.heroOverlay}
                >
                  <Text style={styles.heroTitle}>{item.title}</Text>
                  <Text style={styles.heroSubtitle}>{item.subtitle}</Text>
                </LinearGradient>
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const slideIndex = Math.round(event.nativeEvent.contentOffset.x / (width - 48));
              setCurrentBannerIndex(slideIndex);
            }}
          />
          
          {/* Dots Indicator */}
          <View style={styles.dotsContainer}>
            {sampleBanners.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index === currentBannerIndex 
                      ? '#6366f1' 
                      : 'rgba(255,255,255,0.5)'
                  }
                ]}
              />
            ))}
          </View>
        </View>

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
    </View>
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
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: 60,
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
    marginVertical: 16,
    paddingHorizontal: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '600',
  },
  // New Hero Carousel Styles
  heroSection: {
    marginTop: 16,
    marginBottom: 20,
    marginHorizontal: 24,
  },
  heroSlide: {
    width: width - 48,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 0,
    backgroundColor: '#f0f0f0',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  heroTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  heroSubtitle: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
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
    paddingVertical: 6,
  },
  serviceItem: {
    alignItems: 'center',
    width: SERVICE_ITEM_WIDTH,
    paddingVertical: 6,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  serviceName: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  businessContainer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  businessCard: {
    width: 160,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  businessImage: {
    width: '100%',
    height: 90,
  },
  businessInfo: {
    padding: 10,
  },
  businessName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 3,
    lineHeight: 16,
  },
  businessCategory: {
    fontSize: 11,
    marginBottom: 2,
    opacity: 0.7,
  },
  businessLandmark: {
    fontSize: 11,
    marginBottom: 6,
    opacity: 0.7,
  },
  businessMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rating: {
    fontSize: 11,
    fontWeight: '600',
  },
  priceRange: {
    fontSize: 11,
    fontWeight: '600',
  },
  offerCard: {
    width: 220,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 4,
  },
  offerImage: {
    width: '100%',
    height: 100,
  },
  offerInfo: {
    padding: 12,
  },
  offerTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 18,
  },
  offerDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
    opacity: 0.8,
  },
  offerBusiness: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.7,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  discountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
});
