import { API_CONFIG, getApiUrl } from '@/constants/Api';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { getImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';
import { fetchWithJsonValidation, getUserProfile, isAuthenticated, User } from '@/services/api';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/CustomAlert';
import { Banner, Business, HomeResponse, SpecialOffer, TopService } from '@/types/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
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
import { HomePageSkeleton } from '@/components/SkeletonLoader';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - 48;
const SERVICE_ITEM_WIDTH = (width - 72) / 4;

// Function to get dynamic greeting based on time
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Good Morning';
  } else if (hour < 17) {
    return 'Good Afternoon';
  } else {
    return 'Good Evening';
  }
};

// Function to get first name from full name
const getFirstName = (fullName: string) => {
  if (!fullName) return '';
  return fullName.split(' ')[0];
};

export default function HomeScreen() {
  const [homeData, setHomeData] = useState<HomeResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState('Chittagong');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);

  // Sample banner data for display when no API data is available
  const bannerRef = useRef<FlatList<Banner>>(null);
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();

  // Get banners from API response, fallback to empty array
  const banners = homeData?.banners || [];

  // Reset banner index when banners change
  useEffect(() => {
    if (banners.length > 0 && currentBannerIndex >= banners.length) {
      setCurrentBannerIndex(0);
    }
  }, [banners, currentBannerIndex]);

  useEffect(() => {
    checkAuthAndLoadUser();
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (location) {
      fetchHomeData();
    }
  }, [location]);

  const checkAuthAndLoadUser = async () => {
    try {
      const authenticated = await isAuthenticated();
      setIsUserAuthenticated(authenticated);
      
      if (authenticated) {
        const userResponse = await getUserProfile();
        if (userResponse.success && userResponse.data.user) {
          setUser(userResponse.data.user);
        }
      }
    } catch (error) {
      console.error('Error checking auth or loading user:', error);
    }
  };

  // Auto-scroll banners every 4 seconds
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentBannerIndex(prevIndex => {
        const nextIndex = prevIndex === banners.length - 1 ? 0 : prevIndex + 1;
        // Use a timeout to ensure the ref is ready
        setTimeout(() => {
          try {
            if (bannerRef.current && banners.length > 0) {
              bannerRef.current.scrollToOffset({ 
                offset: nextIndex * (width - 48), 
                animated: true 
              });
            }
          } catch (error) {
            console.warn('Auto-scroll failed:', error);
          }
        }, 50);
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [banners.length, width]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationPermissionDenied(true);
        showAlert({
          type: 'warning',
          title: 'Location Permission Required',
          message: 'Please enable location services to discover nearby businesses and get personalized recommendations.',
          buttons: [
            { text: 'Skip', style: 'cancel', onPress: () => setDefaultLocation() },
            { text: 'Try Again', onPress: () => requestLocationPermission() },
            { text: 'Settings', onPress: () => openLocationSettings() }
          ]
        });
        return;
      }

      setLocationPermissionDenied(false);
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      // Get address from coordinates with timeout and fallback
      try {
        // Create a promise that rejects after 5 seconds
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Reverse geocoding timeout')), 5000);
        });

        // Race between reverseGeocode and timeout
        const addresses = await Promise.race([
          Location.reverseGeocodeAsync({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          }),
          timeoutPromise
        ]) as any[];

        if (addresses && addresses.length > 0) {
          const address = addresses[0];
          setUserLocation(address.city || address.district || address.region || 'Current Location');
        } else {
          setUserLocation('Current Location');
        }
      } catch (geocodeError) {
        console.warn('Reverse geocoding failed:', geocodeError);
        // Fallback to coordinates or default
        setUserLocation('Current Location');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Unable to get your current location. Using default location.';
      let errorTitle = 'Location Error';
      
      if (error instanceof Error) {
        if (error.message.includes('DEADLINE_EXCEEDED') || error.message.includes('timeout')) {
          errorTitle = 'Network Timeout';
          errorMessage = 'Location service is taking too long to respond. Using default location.';
        } else if (error.message.includes('Network')) {
          errorTitle = 'Network Error';
          errorMessage = 'Please check your internet connection and try again.';
        } else if (error.message.includes('Location request failed')) {
          errorTitle = 'GPS Error';
          errorMessage = 'Unable to get GPS location. Please ensure location services are enabled.';
        }
      }
      
      showAlert({
        type: 'warning',
        title: errorTitle,
        message: errorMessage,
        buttons: [
          { text: 'Use Default', onPress: () => setDefaultLocation() },
          { text: 'Try Again', onPress: () => requestLocationPermission() }
        ]
      });
      
      // Always set a fallback location
      setDefaultLocation();
    }
  };

  const openLocationSettings = () => {
    // You could use expo-linking to open device settings
    // For now, we'll just retry location permission
    requestLocationPermission();
  };

  const setDefaultLocation = () => {
    // Default location (Chittagong)
    setLocation({ latitude: 22.3569, longitude: 91.7832 });
    setUserLocation('Chittagong');
  };

  const handleChangeLocation = () => {
    if (locationPermissionDenied) {
      showAlert({
        type: 'info',
        title: 'Change Location',
        message: 'To change your location, please enable location services and try again.',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable Location', onPress: () => requestLocationPermission() }
        ]
      });
    } else {
      showAlert({
        type: 'info',
        title: 'Update Location',
        message: 'This will refresh your current location and update nearby businesses.',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Update', onPress: () => requestLocationPermission() }
        ]
      });
    }
  };

  const fetchHomeData = async () => {
    if (!location) return;

    try {
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.HOME)}?latitude=${location.latitude}&longitude=${location.longitude}&radius=15`;
      const data: HomeResponse = await fetchWithJsonValidation(url);

      if (data.success) {
        setHomeData(data.data);
      } else {
        showAlert({
          type: 'error',
          title: 'Loading Error',
          message: 'Failed to load home data. Please try again.',
          buttons: [{ text: 'OK' }]
        });
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error. Please check your connection.';
      showAlert({
        type: 'error',
        title: 'Network Error',
        message: errorMessage,
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: () => fetchHomeData() }
        ]
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  const handleBannerPress = (banner: Banner) => {
    if (banner.link_type === 'category' && banner.link_id) {
      router.push(`/category/${banner.link_id}` as any);
    } else if (banner.link_type === 'business' && banner.link_id) {
      router.push(`/business/${banner.link_id}` as any);
    } else if (banner.link_type === 'offer' && banner.link_id) {
      router.push(`/offer/${banner.link_id}` as any);
    } else if (banner.link_url) {
      // Handle external URLs if needed
      console.log('External URL:', banner.link_url);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchQuery)}` as any);
  };

  const handleViewAllTopServices = async () => {
    // Navigate to the top services page
    router.push('/top-services');
  };

  const handleViewAllPopularNearby = () => {
    router.push('/popular-nearby');
  };

  const handleViewAllFeaturedBusinesses = () => {
    router.push('/featured-businesses');
  };

  const handleViewAllSpecialOffers = () => {
    router.push('/special-offers');
  };

  const handleViewAllTopRated = () => {
    router.push('/top-rated');
  };

  const handleViewAllOpenNow = () => {
    router.push('/open-now');
  };

  const handleViewAllTrending = () => {
    router.push('/trending' as any);
  };

  const handleViewAllDynamicSection = (sectionSlug: string) => {
    router.push(`/dynamic-section/${sectionSlug}`);
  };

  const handleBannerScroll = useCallback((event: any) => {
    const slideSize = width - 48;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setCurrentBannerIndex(index);
  }, [width]);

  const renderBannerItem = useCallback(({ item }: { item: Banner }) => (
    <TouchableOpacity 
      style={styles.heroSlide}
      onPress={() => handleBannerPress(item)}
    >
      <Image 
        source={{ uri: getImageUrl(item.image_url) || getFallbackImageUrl('general') }} 
        style={styles.heroImage}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={styles.heroOverlay}
      >
        <Text style={styles.heroTitle}>{item.title}</Text>
        <Text style={styles.heroSubtitle}>{item.subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  ), []);

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

  const renderBusinessCard = ({ item }: { item: Business }) => {
    // Handle both old and new image structure
    const getBusinessImage = () => {
      if (item.images?.logo) {
        return getImageUrl(item.images.logo);
      }
      if (item.logo_image) {
        return getImageUrl(item.logo_image);
      }
      return getFallbackImageUrl('business');
    };

    // Format distance for display
    const formatDistance = (distance?: number | string) => {
      if (!distance) return null;
      if (typeof distance === 'string') {
        const numDistance = parseFloat(distance);
        if (numDistance < 1) {
          return `${Math.round(numDistance * 1000)}m`;
        }
        return `${numDistance.toFixed(1)}km`;
      }
      if (distance < 1) {
        return `${Math.round(distance * 1000)}m`;
      }
      return `${distance.toFixed(1)}km`;
    };

    const distanceText = formatDistance(item.distance);

    return (
      <TouchableOpacity 
        style={[styles.businessCard, { backgroundColor: colors.card }]}
        onPress={() => {
          router.push(`/business/${item.id}` as any);
        }}
      >
        <Image source={{ uri: getBusinessImage() }} style={styles.businessImage} />
        <View style={styles.businessInfo}>
          <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={1}>
            {item.business_name}
          </Text>
          <Text style={[styles.businessCategory, { color: colors.icon }]} numberOfLines={1}>
            {item.category_name} • {item.subcategory_name}
          </Text>
          {item.landmark && (
            <Text style={[styles.businessLandmark, { color: colors.icon }]} numberOfLines={1}>
              {item.landmark}
            </Text>
          )}
          <View style={styles.businessMeta}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={[styles.rating, { color: colors.text }]}>{item.overall_rating}</Text>
            </View>
            <View style={styles.metaRight}>
              {distanceText && (
                <Text style={[styles.distance, { color: colors.icon }]}>{distanceText}</Text>
              )}
              <Text style={[styles.priceRange, { color: colors.icon }]}>
                {'$'.repeat(item.price_range)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderOfferCard = ({ item }: { item: SpecialOffer }) => (
    <TouchableOpacity 
      style={[styles.offerCard, { backgroundColor: colors.card }]}
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
        <Text style={[styles.offerValidity, { color: colors.icon }]}>
          Valid until: {new Date(item.valid_to).toLocaleDateString()}
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
        
        {/* Fixed Header */}
        <LinearGradient
          colors={[colors.headerGradientStart, colors.headerGradientEnd]}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View style={styles.welcomeSection}>
              <Text style={styles.greeting}>
                {getGreeting()}, {user?.name ? getFirstName(user.name) : (isUserAuthenticated ? 'User' : 'Guest')}
              </Text>
              <TouchableOpacity style={styles.locationContainer} onPress={handleChangeLocation}>
                <Ionicons 
                  name={locationPermissionDenied ? "location-outline" : "location"} 
                  size={16} 
                  color={locationPermissionDenied ? "#FFB800" : "white"} 
                />
                <Text style={[styles.location, { color: locationPermissionDenied ? "#FFB800" : "white" }]}>
                  {locationPermissionDenied ? "Enable Location" : userLocation}
                </Text>
                {locationPermissionDenied && (
                  <Ionicons name="warning" size={12} color="#FFB800" />
                )}
                <Ionicons name="chevron-down" size={14} color="white" />
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
            activeOpacity={1}
          >
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color={colors.icon} />
              <Text style={[styles.searchPlaceholder, { color: colors.icon }]}>
                Search for nearby restaurants...
              </Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>

        {/* Skeleton Content */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <HomePageSkeleton colors={colors} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      {/* Fixed Header */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.welcomeSection}>
            <Text style={styles.greeting}>
              {getGreeting()}, {user?.name ? getFirstName(user.name) : (isUserAuthenticated ? 'User' : 'Guest')}
            </Text>
            <TouchableOpacity style={styles.locationContainer} onPress={handleChangeLocation}>
              <Ionicons 
                name={locationPermissionDenied ? "location-outline" : "location"} 
                size={16} 
                color={locationPermissionDenied ? "#FFB800" : "white"} 
              />
              <Text style={[styles.location, { color: locationPermissionDenied ? "#FFB800" : "white" }]}>
                {locationPermissionDenied ? "Enable Location" : userLocation}
              </Text>
              {locationPermissionDenied && (
                <Ionicons name="warning" size={12} color="#FFB800" />
              )}
              <Ionicons name="chevron-down" size={14} color="white" />
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
          activeOpacity={1}
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
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banners - Use API Response */}
        {banners.length > 0 && (
          <View style={styles.heroSection}>
            <FlatList
              ref={bannerRef}
              key="banner-flatlist"
              data={banners}
              renderItem={renderBannerItem}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleBannerScroll}
              scrollEventThrottle={16}
            />
            
            {/* Banner Pagination Dots */}
            <View style={styles.bannerPagination}>
              {banners.map((_, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    { backgroundColor: index === currentBannerIndex ? colors.buttonPrimary : colors.icon + '30' },
                    index === currentBannerIndex && styles.paginationDotActive
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Top Services */}
        {homeData?.top_services && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Services</Text>
              <TouchableOpacity onPress={handleViewAllTopServices}>
                <Text style={[styles.viewAll, { color: colors.tint }]}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.servicesGrid}>
              {homeData.top_services.slice(0, 4).map((item) => (
                <View key={item.id}>
                  {renderServiceItem({ item })}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Trending Businesses */}
        {homeData?.trending_businesses && homeData.trending_businesses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Trending Now</Text>
              <TouchableOpacity onPress={handleViewAllTrending}>
                <Text style={[styles.viewAll, { color: colors.tint }]}>View All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={homeData.trending_businesses}
              renderItem={renderBusinessCard}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.businessContainer}
            />
          </View>
        )}

        {/* Popular Services Nearby */}
        {homeData?.popular_nearby && homeData.popular_nearby.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Services Nearby</Text>
              <TouchableOpacity onPress={handleViewAllPopularNearby}>
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
              <TouchableOpacity onPress={() => handleViewAllDynamicSection(section.section_slug)}>
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

        {/* Featured Businesses */}
        {homeData?.featured_businesses && homeData.featured_businesses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Businesses</Text>
              <TouchableOpacity onPress={handleViewAllFeaturedBusinesses}>
                <Text style={[styles.viewAll, { color: colors.tint }]}>View All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={homeData.featured_businesses}
              renderItem={renderBusinessCard}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.businessContainer}
            />
          </View>
        )}

        {/* Special Offers */}
        {homeData?.special_offers && homeData.special_offers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Special Offers</Text>
              <TouchableOpacity onPress={handleViewAllSpecialOffers}>
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
  scrollViewContent: {
    paddingBottom: 24,
  },
  header: {
    paddingTop: 45,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    height: 165,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  welcomeSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 3,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    color: 'white',
    fontSize: 13,
  },
  changeLocation: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
  },
  notificationButton: {
    padding: 8,
  },
  searchContainer: {
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
  },
  section: {
    marginVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 10,
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
    paddingBottom: 8,
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
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distance: {
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.8,
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
  offerValidity: {
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.6,
    marginTop: 2,
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
  bannerPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paginationDotActive: {
    width: 24,
    borderRadius: 4,
  },
});
