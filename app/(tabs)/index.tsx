import { API_CONFIG, getApiUrl } from '@/constants/Api';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocation } from '@/contexts/LocationContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationBadge } from '@/components/NotificationBadge';
import { getImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';
import { fetchWithJsonValidation, getUserProfile, isAuthenticated, User } from '@/services/api';
import cacheService from '@/services/cacheService';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/CustomAlert';
import { Banner, Business, HomeResponse, SpecialOffer, TopService } from '@/types/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToastGlobal } from '@/contexts/ToastContext';
import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState('Chittagong, Bangladesh');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [loginMessageShown, setLoginMessageShown] = useState(false);
  const [showLoginMessage, setShowLoginMessage] = useState(false);

  // Sample banner data for display when no API data is available
  const bannerRef = useRef<FlatList<Banner>>(null);
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const { colorScheme } = useTheme();
  const { unreadCount } = useNotifications();
  const { getCoordinatesForAPI, requestLocationUpdate, location, isUpdating } = useLocation();
  const { showSuccess, showToast } = useToastGlobal();
  const colors = Colors[colorScheme];
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();

  // Check login success immediately when component initializes (before any renders)
  useLayoutEffect(() => {
    const checkLoginImmediately = async () => {
      try {
        // Check URL parameter first (most immediate)
        if (searchParams.loginSuccess === 'true' && !loginMessageShown) {
          console.log('URL parameter login success - showing message immediately');
          setLoginMessageShown(true);
          setShowLoginMessage(true);
          showSuccess('Welcome back! Login successful');
          console.log('Message shown from URL parameter');
          
          // Clear the URL parameter
          router.replace('/(tabs)');
          
          // Clear AsyncStorage flags
          await AsyncStorage.removeItem('loginSuccess');
          await AsyncStorage.removeItem('loginSuccessTime');
          
          setTimeout(() => {
            setShowLoginMessage(false);
          }, 3000);
          return;
        }
        
        // Fallback to AsyncStorage check
        const loginSuccess = await AsyncStorage.getItem('loginSuccess');
        if (loginSuccess === 'true' && !loginMessageShown) {
          console.log('AsyncStorage login success check - showing message');
          await AsyncStorage.removeItem('loginSuccess');
          await AsyncStorage.removeItem('loginSuccessTime');
          setLoginMessageShown(true);
          setShowLoginMessage(true);
          showSuccess('Welcome back! Login successful');
          console.log('Message shown during skeleton loading');
          
          setTimeout(() => {
            setShowLoginMessage(false);
          }, 3000);
        }
      } catch (error) {
        console.error('Error in immediate login check:', error);
      }
    };
    checkLoginImmediately();
  }, [showSuccess, searchParams.loginSuccess]);

  // Get banners from API response, fallback to empty array
  const banners = homeData?.banners || [];

  // Reset banner index when banners change
  useEffect(() => {
    if (banners.length > 0 && currentBannerIndex >= banners.length) {
      setCurrentBannerIndex(0);
    }
  }, [banners, currentBannerIndex]);

  // Update location display when location context changes
  useEffect(() => {
    if (location?.address) {
      setUserLocation(location.address);
    } else if (location) {
      // Fallback based on source if no address
      if (location.source === 'gps') {
        setUserLocation('Current Location');
      } else if (location.source === 'cache') {
        setUserLocation('Cached Location');
      } else {
        setUserLocation('Chittagong, Bangladesh');
      }
    }
  }, [location]);

  // Run main initialization after login check
  useEffect(() => {
    const initializeApp = async () => {
      // First, try to preload cached data for instant display
      const cachedData = await cacheService.preloadCachedData();
      
      if (cachedData.homeData) {
        console.log('Displaying cached home data immediately');
        setHomeData(cachedData.homeData);
        setLoading(false);
      }
      
      if (cachedData.userProfile) {
        console.log('Displaying cached user profile immediately');
        setUser(cachedData.userProfile);
        setIsUserAuthenticated(true);
      }

      // Then fetch fresh data in parallel
      await Promise.all([
        checkAuthAndLoadUser(),
        fetchHomeData(),
        clearOldLoginFlags()
      ]);
    };
    
    initializeApp();
  }, []);

  // Clean up any stale login success flags when app loads (except fresh ones)
  const clearOldLoginFlags = async () => {
    try {
      // Only clear if the flag has been there for more than 10 seconds (stale)
      const loginFlagTime = await AsyncStorage.getItem('loginSuccessTime');
      const currentTime = Date.now();
      
      if (loginFlagTime) {
        const flagAge = currentTime - parseInt(loginFlagTime);
        if (flagAge > 10000) { // 10 seconds
          await AsyncStorage.removeItem('loginSuccess');
          await AsyncStorage.removeItem('loginSuccessTime');
        }
      }
    } catch (error) {
      console.error('Error clearing old login flags:', error);
    }
  };

  // Check for login success message when screen becomes focused (for navigation back scenarios)
  useFocusEffect(
    useCallback(() => {
      // Only check again if we haven't shown the message yet
      if (!loginMessageShown) {
        checkLoginSuccess();
      }
    }, [loginMessageShown])
  );

  const checkLoginSuccess = async () => {
    try {
      console.log('checkLoginSuccess called, loginMessageShown:', loginMessageShown);
      // Prevent showing multiple messages
      if (loginMessageShown) return;
      
      const loginSuccess = await AsyncStorage.getItem('loginSuccess');
      console.log('loginSuccess flag:', loginSuccess);
      if (loginSuccess === 'true') {
        console.log('Login success detected, showing message immediately');
        // Clear the flag and timestamp immediately
        await AsyncStorage.removeItem('loginSuccess');
        await AsyncStorage.removeItem('loginSuccessTime');
        // Mark message as shown
        setLoginMessageShown(true);
        // Show message immediately during skeleton loading - no delay
        showSuccess('Welcome back! Login successful');
        console.log('Success message triggered');
      }
    } catch (error) {
      console.error('Error checking login success:', error);
    }
  };

  const checkAuthAndLoadUser = async () => {
    try {
      const authenticated = await isAuthenticated();
      setIsUserAuthenticated(authenticated);
      
      if (authenticated) {
        // Try to get cached user profile first
        const cachedUser = await cacheService.getUserProfile();
        if (cachedUser) {
          console.log('Using cached user profile');
          setUser(cachedUser);
          return;
        }

        console.log('Fetching fresh user profile');
        const userResponse = await getUserProfile();
        if (userResponse.success && userResponse.data.user) {
          setUser(userResponse.data.user);
          // Cache the user profile
          await cacheService.setUserProfile(userResponse.data.user);
          console.log('User profile cached until logout/update');
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

  // Location is now handled by LocationContext - instant, no permission delays!

  const handleChangeLocation = async () => {
    try {
      showAlert({
        type: 'info',
        title: 'Update Location',
        message: 'Do you want to update your current location? This will require location permission.',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Update Location', 
            onPress: async () => {
              try {
                const result = await requestLocationUpdate();
                
                if (result.success) {
                  showSuccess(result.message);
                  // Clear home data cache since location changed
                  await cacheService.clearHomeData();
                  // Refresh home data with new location
                  await fetchHomeData();
                } else {
                  // Use setTimeout to avoid alert conflict
                  setTimeout(() => {
                    showAlert({
                      type: 'warning',
                      title: 'Location Update Failed',
                      message: result.message,
                      buttons: [{ text: 'OK' }]
                    });
                  }, 100);
                }
              } catch (error) {
                console.error('Error updating location:', error);
                // Use setTimeout to avoid alert conflict
                setTimeout(() => {
                  showAlert({
                    type: 'error',
                    title: 'Update Failed',
                    message: 'Failed to update location. Please try again.',
                    buttons: [{ text: 'OK' }]
                  });
                }, 100);
              }
            }
          }
        ]
      });
    } catch (error) {
      console.error('Error showing location update dialog:', error);
    }
  };

  const handleNotificationPress = () => {
    if (!isUserAuthenticated) {
      showAlert({
        type: 'warning',
        title: 'Login Required',
        message: 'Please login to view your notifications.',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/auth/login') }
        ]
      });
      return;
    }
    router.push('/notifications');
  };

  const fetchHomeData = async () => {
    try {
      // Get coordinates from LocationContext (instant, no permission delays!)
      const coordinates = getCoordinatesForAPI();
      
      // Try to get cached data first
      const cachedData = await cacheService.getHomeData(coordinates);
      if (cachedData) {
        console.log('Using cached home data');
        setHomeData(cachedData);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      console.log('Fetching fresh home data');
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.HOME)}?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&radius=15`;
      const data: HomeResponse = await fetchWithJsonValidation(url);

      if (data.success) {
        setHomeData(data.data);
        // Cache the new data
        await cacheService.setHomeData(data.data, coordinates);
        console.log('Home data cached for 5 minutes');
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
                  name="location" 
                  size={16} 
                  color="white" 
                />
                <Text style={[styles.location, { color: "white" }]}>
                  {isUpdating ? 'Updating...' : userLocation}
                </Text>
                <Ionicons name="chevron-down" size={14} color="white" />
                <Text style={styles.changeLocation}>Change</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationPress}>
              <Ionicons name="notifications-outline" size={24} color="white" />
              {isUserAuthenticated && unreadCount > 0 && (
                <View style={styles.badgeContainer}>
                  <NotificationBadge count={unreadCount} size="small" />
                </View>
              )}
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
                name="location" 
                size={16} 
                color="white" 
              />
              <Text style={[styles.location, { color: "white" }]}>
                {isUpdating ? 'Updating...' : userLocation}
              </Text>
              <Ionicons name="chevron-down" size={14} color="white" />
              <Text style={styles.changeLocation}>Change</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationPress}>
            <Ionicons name="notifications-outline" size={24} color="white" />
            {isUserAuthenticated && unreadCount > 0 && (
              <View style={styles.badgeContainer}>
                <NotificationBadge count={unreadCount} size="small" />
              </View>
            )}
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
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: 6,
    right: 6,
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
