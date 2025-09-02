import { API_CONFIG, getApiUrl } from '@/constants/Api';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocation } from '@/contexts/LocationContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationBadge } from '@/components/NotificationBadge';
import { getImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';
import { fetchWithJsonValidation, getUserProfile, isAuthenticated, User, getMainRecommendations, MainRecommendationsResponse, RecommendationBusiness } from '@/services/api';
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
    View,
    Animated
} from 'react-native';
import { HomePageSkeleton } from '@/components/SkeletonLoader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToastGlobal } from '@/contexts/ToastContext';
import { LocationHeader } from '@/components/LocationHeader';
import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { addTrackingToPress } from '@/hooks/useFlatListTracking';

// Dynamic Hero Section Component with Time-Based Themes
const DynamicHeroSection = React.memo(({ 
  colors, 
  colorScheme
}: {
  colors: any;
  colorScheme: string;
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();
  
  // Animation values for different elements
  const sunAnimation = useRef(new Animated.Value(0)).current;
  const moonAnimation = useRef(new Animated.Value(0)).current;
  const starAnimation = useRef(new Animated.Value(0)).current;
  const birdAnimation = useRef(new Animated.Value(0)).current;
  const cloudAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Start animations
    startAnimations();

    return () => {
      clearInterval(timeInterval);
      stopAnimations();
    };
  }, []);

  const startAnimations = () => {
    // Sun/Moon rotation animation
    Animated.loop(
      Animated.timing(sunAnimation, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    // Star twinkling animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(starAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(starAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Bird flying animation
    Animated.loop(
      Animated.timing(birdAnimation, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();

    // Cloud floating animation
    Animated.loop(
      Animated.timing(cloudAnimation, {
        toValue: 1,
        duration: 15000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopAnimations = () => {
    sunAnimation.stopAnimation();
    moonAnimation.stopAnimation();
    starAnimation.stopAnimation();
    birdAnimation.stopAnimation();
    cloudAnimation.stopAnimation();
  };

  // Get time-based theme
  const getTimeTheme = () => {
    const hour = currentTime.getHours();
    
    if (hour >= 5 && hour < 12) {
      // Morning (5 AM - 12 PM)
      return {
        type: 'morning',
        gradientColors: colorScheme === 'dark' 
          ? ['#FF9A56', '#FF6B35', '#FF4757'] 
          : ['#FF9A56', '#FFAD56', '#FFC048'],
        bgGradient: colorScheme === 'dark'
          ? ['#1a1a2e', '#16213e', '#FF6B35']
          : ['#87CEEB', '#98D8E8', '#FFE4B5'],
        textColor: 'white',
        showSun: true,
        showBirds: true,
        showClouds: true,
        sunColor: '#FFD700',
        cloudColor: 'rgba(255, 255, 255, 0.8)'
      };
    } else if (hour >= 12 && hour < 17) {
      // Afternoon (12 PM - 5 PM)
      return {
        type: 'afternoon',
        gradientColors: colorScheme === 'dark'
          ? ['#3B82F6', '#1E40AF', '#1E3A8A']
          : ['#87CEEB', '#4682B4', '#1E90FF'],
        bgGradient: colorScheme === 'dark'
          ? ['#1a1a2e', '#16213e', '#3B82F6']
          : ['#87CEEB', '#6495ED', '#4169E1'],
        textColor: 'white',
        showSun: true,
        showClouds: true,
        sunColor: '#FFD700',
        cloudColor: 'rgba(255, 255, 255, 0.9)'
      };
    } else if (hour >= 17 && hour < 20) {
      // Evening (5 PM - 8 PM)
      return {
        type: 'evening',
        gradientColors: colorScheme === 'dark'
          ? ['#FF6B35', '#E55100', '#BF360C']
          : ['#FF8A50', '#FF7043', '#FF5722'],
        bgGradient: colorScheme === 'dark'
          ? ['#1a1a2e', '#BF360C', '#FF6B35']
          : ['#FF8A65', '#FF7043', '#FF5722'],
        textColor: 'white',
        showSun: true,
        showClouds: true,
        sunColor: '#FF6B35',
        cloudColor: 'rgba(255, 182, 193, 0.8)'
      };
    } else {
      // Night (8 PM - 5 AM)
      return {
        type: 'night',
        gradientColors: colorScheme === 'dark'
          ? ['#0F172A', '#1E293B', '#334155']
          : ['#1E1B4B', '#312E81', '#4C1D95'],
        bgGradient: colorScheme === 'dark'
          ? ['#0F172A', '#1E293B', '#334155']
          : ['#1E1B4B', '#312E81', '#4C1D95'],
        textColor: 'white',
        showMoon: true,
        showStars: true,
        showClouds: true,
        moonColor: '#FFF8DC', // Cornsilk - warm, attractive moon color
        starColor: '#FFFACD',
        cloudColor: 'rgba(70, 130, 180, 0.3)'
      };
    }
  };

  const theme = getTimeTheme();

  // Animation interpolations
  const sunRotation = sunAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sunScale = sunAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.1, 1],
  });

  const starOpacity = starAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  const birdTranslateX = birdAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [width + 50, -100], // Right to left movement
  });

  const birdTranslateY = birdAnimation.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [0, -12, 8, -8, 12, -5], // More realistic bird flying pattern
  });

  const birdRotate = birdAnimation.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['0deg', '-2deg', '1deg', '-1deg', '0deg'], // Slight wing tilt
  });

  const cloudTranslateX = cloudAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, width + 100],
  });

  return (
    <>
      {/* Sun Animation */}
      {theme.showSun && (
        <Animated.View 
          style={[
            dynamicHeroStyles.sun,
            {
              backgroundColor: theme.sunColor,
              transform: [
                { rotate: sunRotation },
                { scale: sunScale }
              ]
            }
          ]}
        >
          <View style={[dynamicHeroStyles.sunRays, { borderColor: theme.sunColor }]} />
        </Animated.View>
      )}

      {/* Moon Animation */}
      {theme.showMoon && (
        <Animated.View 
          style={[
            dynamicHeroStyles.moon,
            { backgroundColor: theme.moonColor }
          ]}
        >
          {/* Multiple moon craters for realistic look */}
          <View style={dynamicHeroStyles.moonCrater1} />
          <View style={dynamicHeroStyles.moonCrater2} />
          <View style={dynamicHeroStyles.moonCrater3} />
          <View style={dynamicHeroStyles.moonCrater4} />
          <View style={dynamicHeroStyles.moonCrater5} />
        </Animated.View>
      )}

      {/* Stars Animation */}
      {theme.showStars && (
        <View style={dynamicHeroStyles.starsContainer}>
          {[...Array(12)].map((_, index) => (
            <Animated.View
              key={index}
              style={[
                dynamicHeroStyles.star,
                {
                  backgroundColor: theme.starColor,
                  opacity: starOpacity,
                  left: `${10 + (index * 7)}%`,
                  top: `${15 + (index % 3) * 20}%`,
                }
              ]}
            />
          ))}
        </View>
      )}

      {/* Flying Birds Animation */}
      {theme.showBirds && (
        <Animated.View 
          style={[
            dynamicHeroStyles.birdContainer,
            {
              transform: [
                { translateX: birdTranslateX },
                { translateY: birdTranslateY },
                { rotate: birdRotate }
              ]
            }
          ]}
        >
          <Text style={dynamicHeroStyles.bird}>🐦</Text>
          <Text style={[dynamicHeroStyles.bird, { marginLeft: 15, marginTop: 8 }]}>🐦</Text>
          <Text style={[dynamicHeroStyles.bird, { marginLeft: 25, marginTop: -5 }]}>🐦</Text>
        </Animated.View>
      )}

      {/* Floating Clouds Animation */}
      {theme.showClouds && (
        <Animated.View 
          style={[
            dynamicHeroStyles.cloudContainer,
            {
              transform: [{ translateX: cloudTranslateX }]
            }
          ]}
        >
          <View style={[dynamicHeroStyles.cloud, { backgroundColor: theme.cloudColor }]} />
          <View style={[dynamicHeroStyles.cloud2, { backgroundColor: theme.cloudColor }]} />
        </Animated.View>
      )}
    </>
  );
});

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - 48;
const SERVICE_ITEM_WIDTH = (width - 72) / 4;

// Function to get notification icon color based on time and theme
const getNotificationIconColor = (colorScheme: string) => {
  // Always use white with shadow for better visibility
  return 'white';
};

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
  const [recommendations, setRecommendations] = useState<RecommendationBusiness[]>([]);

  // Debug logging for state changes
  useEffect(() => {
    console.log('🎯 HOME SCREEN STATE UPDATE:');
    console.log('- isUserAuthenticated:', isUserAuthenticated);
    console.log('- recommendations.length:', recommendations.length);
    console.log('- shouldShowRecommendations:', isUserAuthenticated && recommendations.length > 0);
  }, [isUserAuthenticated, recommendations]);

  // Sample banner data for display when no API data is available
  const bannerRef = useRef<FlatList<Banner>>(null);
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const { colorScheme } = useTheme();
  const { unreadCount } = useNotifications();
  const { getCoordinatesForAPI, requestLocationUpdate, location, isUpdating, getCurrentLocationInfo, onLocationChange, manualLocation, isLocationChanging } = useLocation();
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
    const locationInfo = getCurrentLocationInfo();
    
    if (locationInfo.isManual) {
      // Manual location selected
      setUserLocation(`${locationInfo.name}${locationInfo.division ? `, ${locationInfo.division}` : ''}`);
    } else if (location?.address) {
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
    } else {
      setUserLocation('Chittagong, Bangladesh');
    }
  }, [location, manualLocation]); // Include manualLocation to track manual location changes

  // Listen for location changes and refresh data
  useEffect(() => {
    console.log('🎬 Setting up location change listener...');
    const cleanup = onLocationChange(async () => {
      console.log('� LOCATION CHANGE TRIGGERED!');
      const oldCoords = homeData ? 'cached data exists' : 'no cached data';
      const newCoords = getCoordinatesForAPI();
      console.log('�🔄 Location changed, refreshing home data...');
      console.log('📍 Old state:', oldCoords);
      console.log('📍 New coordinates:', newCoords);
      
      // Set loading state to show skeleton immediately
      setLoading(true);
      // Clear current data to force fresh fetch
      setHomeData(null);
      console.log('🗑️ HomeData cleared');
      
      // Force clear all cache to ensure fresh data
      await cacheService.forceRefreshHomeData();
      console.log('🗑️ All cache forcefully cleared');
      
      // Fetch fresh data with new location (guaranteed fresh)
      await fetchFreshHomeData();
      showSuccess('Home data updated for new location');
    });

    console.log('✅ Location change listener setup complete');
    return cleanup;
  }, []); // Empty dependency array since we only want this to run once

  // Run main initialization after login check
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 HOME SCREEN: Initializing app...');
      
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

      console.log('🚀 Starting parallel data loading (auth + home data)...');
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
    console.log('🔐 checkAuthAndLoadUser called');
    try {
      const authenticated = await isAuthenticated();
      console.log('🔐 isAuthenticated result:', authenticated);
      setIsUserAuthenticated(authenticated);
      
      if (authenticated) {
        console.log('✅ User is authenticated, loading profile and recommendations');
        // Try to get cached user profile first
        const cachedUser = await cacheService.getUserProfile();
        if (cachedUser) {
          console.log('Using cached user profile');
          setUser(cachedUser);
        } else {
          console.log('Fetching fresh user profile');
          const userResponse = await getUserProfile();
          if (userResponse.success && userResponse.data.user) {
            setUser(userResponse.data.user);
            // Cache the user profile
            await cacheService.setUserProfile(userResponse.data.user);
            console.log('User profile cached until logout/update');
          }
        }
        
        // Load main recommendations for authenticated users
        console.log('🎯 About to call loadMainRecommendations');
        loadMainRecommendations();
      } else {
        console.log('❌ User is not authenticated, skipping profile and recommendations');
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

  const handleRecommendationsPress = () => {
    router.push('/recommendations');
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

  // Fetch fresh data bypassing cache (used when location changes)
  const fetchFreshHomeData = async () => {
    try {
      // Get coordinates from LocationContext
      const coordinates = getCoordinatesForAPI();
      
      console.log('🔄 Fetching fresh home data for new location:', coordinates);
      
      // Force clear any existing cache first
      await cacheService.forceRefreshHomeData();
      
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.HOME)}?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&radius=15`;
      console.log('🌐 API URL:', url);
      
      const data: HomeResponse = await fetchWithJsonValidation(url);

      if (data.success) {
        console.log('✅ Fresh data received:', {
          banners: data.data.banners?.length || 0,
          topServices: data.data.top_services?.length || 0,
          businesses: data.data.featured_businesses?.length || 0
        });
        
        setHomeData(data.data);
        // Cache the new data with new coordinates
        await cacheService.setHomeData(data.data, coordinates);
        console.log('💾 Fresh home data cached for new location');
      } else {
        showAlert({
          type: 'error',
          title: 'Loading Error',
          message: 'Failed to load home data. Please try again.',
          buttons: [{ text: 'OK' }]
        });
      }
    } catch (error) {
      console.error('Error fetching fresh home data:', error);
      showAlert({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to fetch data for new location. Please try again.',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => fetchFreshHomeData() }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  // Load Main Recommendations (only for authenticated users)
  const loadMainRecommendations = async () => {
    console.log('🎯 loadMainRecommendations called');
    console.log('🔐 isUserAuthenticated:', isUserAuthenticated);
    
    if (!isUserAuthenticated) {
      console.log('❌ User not authenticated, skipping recommendations');
      return;
    }

    try {
      const coordinates = getCoordinatesForAPI();
      console.log('📍 Coordinates for API:', coordinates);
      console.log('🎯 Loading main recommendations for authenticated user');
      
      const response = await getMainRecommendations(
        coordinates.latitude,
        coordinates.longitude,
        10 // Load 10 recommendations for home screen
      );

      console.log('📡 Main recommendations API response:', response);
      console.log('📡 Response success:', response.success);
      console.log('📡 Response data:', response.data);

      if (response.success) {
        console.log('📡 Recommendations:', response.data.recommendations);
        console.log('📡 Recommendations length:', response.data.recommendations?.length);
        
        setRecommendations(response.data.recommendations || []);
        console.log(`✅ Loaded ${response.data.recommendations?.length || 0} main recommendations`);
      } else {
        console.log('❌ Failed to load main recommendations - response not successful');
        console.log('❌ Response data:', response.data);
      }
    } catch (error) {
      console.error('❌ Error loading main recommendations:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      // Don't show error alert for recommendations - it's optional content
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

  const renderBusinessCard = ({ item, index, section }: { item: Business, index?: number, section?: string }) => {
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

    // Create the original onPress handler
    const originalOnPress = () => {
      router.push(`/business/${item.id}` as any);
    };

    // Add tracking if section and index are provided
    const onPressWithTracking = section && typeof index === 'number' 
      ? addTrackingToPress(originalOnPress, item.id, index, section)
      : originalOnPress;

    return (
      <TouchableOpacity 
        style={[styles.businessCard, { backgroundColor: colors.card }]}
        onPress={onPressWithTracking}
      >
        <Image source={{ uri: getBusinessImage() }} style={styles.businessImage} />
        
        {/* Trending Badge for trending businesses */}
        {section === 'trending_businesses' && item.trend_score && parseFloat(item.trend_score) > 20 && (
          <View style={[styles.trendingBadge, { backgroundColor: '#FF6B35' }]}>
            <Ionicons name="trending-up" size={10} color="white" />
            <Text style={styles.trendingText}>🔥</Text>
          </View>
        )}
        
        <View style={styles.businessInfo}>
          <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={1}>
            {item.business_name}
          </Text>
          <Text style={[styles.businessCategory, { color: colors.icon }]} numberOfLines={1}>
            {item.category_name}{item.subcategory_name ? ` • ${item.subcategory_name}` : ''}
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

  // Render recommendation card with trending indicators
  const renderRecommendationCard = ({ item, index }: { item: RecommendationBusiness, index?: number }) => {
    const business = item.business; // Extract the business object
    
    // Create the original onPress handler
    const originalOnPress = () => {
      router.push(`/business/${business.id}` as any);
    };

    // Add tracking with section for recommendations
    const onPressWithTracking = typeof index === 'number' 
      ? addTrackingToPress(originalOnPress, business.id, index, 'main_recommendations')
      : originalOnPress;

    return (
      <TouchableOpacity 
        style={[styles.businessCard, styles.recommendationCard, { backgroundColor: colors.card }]}
        onPress={onPressWithTracking}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: getImageUrl(business.logo_image?.image_url) || getFallbackImageUrl('business') }} 
          style={styles.businessImage}
        />
        
        {/* Trending Badge - using final_score as indicator */}
        {item.final_score && item.final_score > 80 && (
          <View style={[styles.trendingBadge, { backgroundColor: '#FF6B35' }]}>
            <Ionicons name="trending-up" size={10} color="white" />
            <Text style={styles.trendingText}>Hot</Text>
          </View>
        )}
        
        <View style={styles.businessInfo}>
          <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={1}>
            {business.business_name}
          </Text>
          <Text style={[styles.businessCategory, { color: colors.icon }]} numberOfLines={1}>
            {business.categories?.[0]?.name || 'Business'} • {business.area}
          </Text>
          {business.landmark && (
            <Text style={[styles.businessLandmark, { color: colors.icon }]} numberOfLines={1}>
              {business.landmark}
            </Text>
          )}
          <View style={styles.businessMeta}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={[styles.rating, { color: colors.text }]}>{business.overall_rating}</Text>
            </View>
            <View style={styles.metaRight}>
              <Text style={[styles.distance, { color: colors.icon }]}>
                {parseFloat(business.distance).toFixed(1)}km
              </Text>
              <Text style={[styles.priceRange, { color: colors.icon }]}>
                {business.price_range ? `${'$'.repeat(business.price_range)}` : '$'}
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

  if (loading && !homeData || isLocationChanging) {
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
              <TouchableOpacity 
                style={styles.locationContainer} 
                onPress={() => router.push('/location-selection')}
              >
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
              <Ionicons 
                name="notifications-outline" 
                size={24} 
                color={getNotificationIconColor(colorScheme)}
                style={{ 
                  textShadowColor: 'rgba(0, 0, 0, 0.8)',
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 3,
                }}
              />
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
      
      {/* Fixed Header with Time-Based Animations */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={styles.header}
      >
        {/* Time-Based Animation Elements */}
        <DynamicHeroSection 
          colors={colors}
          colorScheme={colorScheme}
        />
        
        <View style={styles.headerTop}>
          <View style={styles.welcomeSection}>
            <Text style={styles.greeting}>
              {getGreeting()}, {user?.name ? getFirstName(user.name) : (isUserAuthenticated ? 'User' : 'Guest')}
            </Text>
            <TouchableOpacity 
              style={styles.locationContainer} 
              onPress={() => router.push('/location-selection')}
            >
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
            <Ionicons 
              name="notifications-outline" 
              size={24} 
              color={getNotificationIconColor(colorScheme)}
              style={{ 
                textShadowColor: 'rgba(0, 0, 0, 0.8)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 3,
              }}
            />
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
        {/* Banners Section */}
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

        {/* Recommendations Quick Access */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.recommendationsBanner, { backgroundColor: colors.card }]}
            onPress={handleRecommendationsPress}
            activeOpacity={0.7}
          >
            <View style={styles.recommendationsBannerContent}>
              <View style={[styles.recommendationsIcon, { backgroundColor: colors.tint }]}>
                <Ionicons name="compass" size={16} color="white" />
              </View>
              <View style={styles.recommendationsText}>
                <Text style={[styles.recommendationsTitle, { color: colors.text }]}>
                  Discover Places for You
                </Text>
                <Text style={[styles.recommendationsSubtitle, { color: colors.icon }]}>
                  Personalized recommendations based on your location
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.tint} />
            </View>
          </TouchableOpacity>
        </View>

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

        {/* Recommended for You - Only show for authenticated users */}
        {isUserAuthenticated && recommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.recommendationHeaderMain}>
                <View style={[styles.aiIcon, { backgroundColor: colors.tint }]}>
                  <Ionicons name="sparkles" size={16} color="white" />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 8 }]}>
                  Recommended for You
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/recommendations' as any)}>
                <Text style={[styles.viewAll, { color: colors.tint }]}>View All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={recommendations.slice(0, 6)} // Show only first 6 recommendations
              renderItem={({ item, index }) => renderRecommendationCard({ item, index })}
              keyExtractor={(item) => item.business.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.businessContainer}
            />
          </View>
        )}

        {/* AI Picks Button - Only show for authenticated users */}
        {isUserAuthenticated && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={[styles.recommendationsBanner, { backgroundColor: colors.card, borderWidth: 2, borderColor: '#8B5CF6' }]}
              onPress={() => router.push('/ai-recommendations' as any)}
              activeOpacity={0.7}
            >
              <View style={styles.recommendationsBannerContent}>
                <View style={[styles.recommendationsIcon, { backgroundColor: '#8B5CF6' }]}>
                  <Ionicons name="bulb" size={24} color="white" />
                </View>
                <View style={styles.recommendationsText}>
                  <Text style={[styles.recommendationsTitle, { color: colors.text }]}>
                    AI Picks
                  </Text>
                  <Text style={[styles.recommendationsSubtitle, { color: colors.icon }]}>
                    Discover smart recommendations powered by AI
                  </Text>
                </View>
                <View style={[styles.discountBadge, { backgroundColor: '#8B5CF6', position: 'relative', top: 0, right: 0 }]}>
                  <Ionicons name="sparkles" size={10} color="white" />
                  <Text style={[styles.discountText, { marginLeft: 2 }]}>NEW</Text>
                </View>
              </View>
            </TouchableOpacity>
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
              renderItem={({ item, index }) => renderBusinessCard({ item, index, section: 'trending_businesses' })}
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
              renderItem={({ item, index }) => renderBusinessCard({ item, index, section: 'popular_nearby' })}
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
              renderItem={({ item, index }) => renderBusinessCard({ item, index, section: section.section_slug })}
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
              renderItem={({ item, index }) => renderBusinessCard({ item, index, section: 'featured_businesses' })}
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
    zIndex: 10, // Higher z-index to be above animated elements
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recommendationsButton: {
    padding: 8,
  },
  recommendationsBanner: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 12,
  },
  recommendationsBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recommendationsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationsText: {
    flex: 1,
  },
  recommendationsTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  recommendationsSubtitle: {
    fontSize: 12,
    opacity: 0.7,
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
  // Recommendation styles
  recommendationHeaderMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationCard: {
    position: 'relative',
  },
  trendingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 1,
  },
  trendingText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '600',
    marginLeft: 2,
  },
});

// Dynamic Hero Styles
const dynamicHeroStyles = StyleSheet.create({
  heroContainer: {
    height: 280,
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 3,
    padding: 20,
  },
  greetingContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  subGreetingText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  animatedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  bannerList: {
    zIndex: 2,
  },
  greetingOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  // Sun Animation
  sun: {
    position: 'absolute',
    top: 45, // Moved down from 35
    right: 70, // Moved left (increased right value)
    width: 40, // Smaller than moon (50)
    height: 40, // Smaller than moon (50)
    borderRadius: 20, // Adjusted for smaller size
    zIndex: 2,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15, // Adjusted glow for smaller size
    elevation: 10,
  },
  sunRays: {
    position: 'absolute',
    top: -5, // Adjusted for smaller sun
    left: -5, // Adjusted for smaller sun  
    width: 50, // Smaller to match 40px sun
    height: 50, // Smaller to match 40px sun
    borderRadius: 25, // Adjusted for smaller size
    borderWidth: 2, // Thinner border for smaller size
    borderStyle: 'dashed',
    opacity: 0.6,
  },
  // Moon Animation
  moon: {
    position: 'absolute',
    top: 35,
    right: 60,
    width: 50, // Slightly larger for full moon
    height: 50,
    borderRadius: 25,
    zIndex: 2,
    shadowColor: '#F5F5DC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20, // Stronger glow
    elevation: 15,
    overflow: 'visible', // Show full moon with glow
  },
  moonCrescent: {
    // Remove crescent for full moon
    display: 'none',
  },
  moonCrater1: {
    position: 'absolute',
    top: 12,
    left: 15,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(169, 169, 169, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  moonCrater2: {
    position: 'absolute',
    top: 25,
    right: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(169, 169, 169, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
  },
  moonCrater3: {
    position: 'absolute',
    top: 8,
    right: 20,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128, 128, 128, 0.4)',
  },
  moonCrater4: {
    position: 'absolute',
    top: 30,
    left: 8,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(169, 169, 169, 0.4)',
  },
  moonCrater5: {
    position: 'absolute',
    top: 18,
    left: 28,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(128, 128, 128, 0.5)',
  },
  // Stars Animation
  starsContainer: {
    position: 'absolute',
    top: 30, // Moved down to avoid status bar
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  star: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    shadowColor: '#FFFACD',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 5,
  },
  // Birds Animation
  birdContainer: {
    position: 'absolute',
    top: 55, // Moved down to avoid status bar
    zIndex: 2,
    flexDirection: 'row',
  },
  bird: {
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  // Clouds Animation
  cloudContainer: {
    position: 'absolute',
    top: 50, // Moved down to avoid status bar
    zIndex: 2,
  },
  cloud: {
    width: 60,
    height: 25,
    borderRadius: 25,
    opacity: 0.8,
  },
  cloud2: {
    width: 40,
    height: 20,
    borderRadius: 20,
    marginTop: -15,
    marginLeft: 20,
    opacity: 0.6,
  },
});
