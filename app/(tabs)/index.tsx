import CustomAlert from '@/components/CustomAlert';
import { NotificationBadge } from '@/components/NotificationBadge';
import { HomePageSkeleton } from '@/components/SkeletonLoader';
import { API_CONFIG, getApiUrl } from '@/constants/Api';
import { Colors } from '@/constants/Colors';
import { useLocation } from '@/contexts/LocationContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToastGlobal } from '@/contexts/ToastContext';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { addTrackingToPress } from '@/hooks/useFlatListTracking';
import { fetchWithJsonValidation, getMainRecommendations, getUserProfile, isAuthenticated, RecommendationBusiness, User } from '@/services/api';
import cacheService from '@/services/cacheService';
import { handleApiError } from '@/services/errorHandler';
import { WeatherData, weatherService } from '@/services/weatherService';
import { Banner, Business, FeaturedAttraction, HomeResponse, NationalBrand, SpecialOffer, TopService } from '@/types/api';
import { getFallbackImageUrl, getImageUrl } from '@/utils/imageUtils';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Animated,
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

// Dynamic Hero Section Component with Time-Based Themes
const DynamicHeroSection = React.memo(({ 
  colors, 
  colorScheme,
  onWeatherUpdate
}: {
  colors: any;
  colorScheme: string;
  onWeatherUpdate?: (weather: WeatherData) => void;
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const { location } = useLocation();
  const router = useRouter();
  
  // Animation values for different elements
  const sunAnimation = useRef(new Animated.Value(0)).current;
  const moonAnimation = useRef(new Animated.Value(0)).current;
  const starAnimation = useRef(new Animated.Value(0)).current;
  const birdAnimation = useRef(new Animated.Value(0)).current;
  const cloudAnimation = useRef(new Animated.Value(0)).current;
  const weatherIconAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Start animations
    startAnimations();
    
    // Force refresh weather on first load to get real-time data
    fetchCurrentWeather(true);

    // Update weather every 30 minutes
    const weatherInterval = setInterval(() => {
      fetchCurrentWeather();
    }, 30 * 60 * 1000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(weatherInterval);
      stopAnimations();
    };
  }, [location]);

  const fetchCurrentWeather = async (forceRefresh = false) => {
    try {
      // Use location coordinates or default to Chittagong, Bangladesh
      const lat = location?.latitude || 22.3569;
      const lng = location?.longitude || 91.7832;
      
      console.log('🌤️ DynamicHeroSection: Fetching weather...', {
        lat,
        lng,
        forceRefresh,
        hasLocation: !!location,
        locationSource: location?.source
      });
      
      let weatherData;
      if (forceRefresh) {
        console.log('🌤️ DynamicHeroSection: Force refreshing weather data...');
        weatherData = await weatherService.forceRefresh(lat, lng);
      } else {
        weatherData = await weatherService.getCurrentWeather(lat, lng);
      }
      
      console.log('🌤️ DynamicHeroSection: Weather data received:', weatherData);
      
      setCurrentWeather(weatherData);
      
      // Notify parent component
      if (onWeatherUpdate) {
        onWeatherUpdate(weatherData);
      }
      
      // Animate weather icon
      Animated.sequence([
        Animated.timing(weatherIconAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(weatherIconAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
  };

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

  // Get combined time and weather-based theme
  const getTimeTheme = () => {
    const hour = currentTime.getHours();
    const baseTheme = getBaseTimeTheme(hour);
    
    // Only show sun/moon after weather data is loaded
    if (!currentWeather) {
      return {
        ...baseTheme,
        showSun: false,
        showMoon: false,
        showStars: false,
        showClouds: false, // Don't show anything until weather loads
      };
    }
    
    // Enhance theme with weather conditions
    return enhanceThemeWithWeather(baseTheme, currentWeather);
  };

  const getBaseTimeTheme = (hour: number) => {
    if (hour >= 5 && hour < 12) {
      // Morning (5 AM - 12 PM)
      return {
        type: 'morning',
        gradientColors: colorScheme === 'dark' 
          ? ['#FF9A56', '#FFAD56', '#FFC048'] 
          : ['#FFE4B5', '#98D8E8', '#87CEEB'],
        bgGradient: colorScheme === 'dark'
          ? ['#1a1a2e', '#16213e', '#FF9A56']
          : ['#FFE4B5', '#98D8E8', '#87CEEB'],
        textColor: 'white',
        showSun: true,
        showBirds: true,
        showClouds: true,
        sunColor: '#FFD700',
        cloudColor: 'rgba(255, 255, 255, 0.8)'
      };
    } else if (hour >= 12 && hour < 18) {
      // Day (12 PM - 6 PM)
      return {
        type: 'day',
        gradientColors: colorScheme === 'dark' 
          ? ['#3B82F6', '#1E40AF', '#1E3A8A'] 
          : ['#87CEEB', '#4682B4', '#1E90FF'],
        bgGradient: colorScheme === 'dark'
          ? ['#1a1a2e', '#16213e', '#3B82F6']
          : ['#87CEEB', '#4682B4', '#1E90FF'],
        textColor: 'white',
        showSun: true,
        showBirds: true,
        showClouds: true,
        sunColor: '#FFD700',
        cloudColor: 'rgba(255, 255, 255, 0.9)'
      };
    } else if (hour >= 18 && hour < 20) {
      // Evening (6 PM - 8 PM)
      return {
        type: 'evening',
        gradientColors: colorScheme === 'dark'
          ? ['#FF6B35', '#E55100', '#BF360C']
          : ['#FF8A65', '#FF7043', '#FF5722'],
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
        moonColor: '#FFF8DC',
        starColor: '#FFFACD',
        cloudColor: 'rgba(70, 130, 180, 0.3)'
      };
    }
  };

  const enhanceThemeWithWeather = (baseTheme: any, weather: WeatherData) => {
    const weatherTheme = { ...baseTheme };
    
    // Enhance (don't completely override) based on weather conditions
    switch (weather.condition) {
      case 'sunny':
      case 'clear':
        // Keep time-based animations, just adjust for sunny weather
        weatherTheme.showClouds = false;
        weatherTheme.showBirds = true;
        break;
      case 'partly-cloudy':
        // Show both time-based elements and clouds
        weatherTheme.showClouds = true;
        weatherTheme.showBirds = true;
        weatherTheme.cloudOpacity = 0.6;
        break;
      case 'cloudy':
        // Cloudy weather - hide sun completely, show clouds
        weatherTheme.showClouds = true;
        weatherTheme.showBirds = false; // Birds don't fly in heavy clouds
        weatherTheme.cloudOpacity = 0.8;
        // Hide sun completely when it's cloudy
        if (baseTheme.type !== 'night') {
          weatherTheme.showSun = false;
        }
        break;
      case 'rainy':
        // Rainy conditions - just show clouds, no rain animation
        weatherTheme.showClouds = true;
        weatherTheme.showBirds = false;
        weatherTheme.cloudColor = 'rgba(105, 105, 105, 0.9)';
        // Dim sun but don't hide completely
        if (baseTheme.type !== 'night') {
          weatherTheme.sunOpacity = 0.3; // Very dim sun
        }
        break;
      case 'stormy':
        weatherTheme.showClouds = true;
        weatherTheme.showBirds = false;
        weatherTheme.showStorm = true;
        weatherTheme.cloudColor = 'rgba(47, 79, 79, 0.9)';
        if (baseTheme.type !== 'night') {
          weatherTheme.showSun = false;
        }
        break;
      case 'snowy':
        weatherTheme.showClouds = true;
        weatherTheme.showBirds = false;
        weatherTheme.showSnow = true;
        weatherTheme.cloudColor = 'rgba(220, 220, 220, 0.9)';
        if (baseTheme.type !== 'night') {
          weatherTheme.sunOpacity = 0.4; // Dim sun for snowy weather
        }
        break;
      default:
        // If unknown weather, keep all time-based animations
        break;
    }
    
    return weatherTheme;
  };

  const theme = getTimeTheme();

  // Animation interpolations with time-based variations
  const sunRotation = sunAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sunScale = sunAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: theme.type === 'morning' ? [1, 1.2, 1] : [1, 1.1, 1], // Bigger morning sun
  });

  const moonRotation = moonAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '30deg'], // Gentle moon rotation
  });

  const moonGlow = moonAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.2, 0.8], // Pulsing moon glow
  });

  const starOpacity = starAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: theme.type === 'night' ? [0.2, 1, 0.2] : [0.1, 0.6, 0.1], // Brighter at night
  });

  const starTwinkle = starAnimation.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [1, 1.3, 1, 1.5, 1], // Twinkling effect
  });

  const birdTranslateX = birdAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [width + 50, -100], // Right to left movement
  });

  const birdTranslateY = birdAnimation.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: theme.type === 'morning' 
      ? [0, -20, 15, -15, 20, -10] // More active morning flight
      : [0, -12, 8, -8, 12, -5], // Standard flight pattern
  });

  const birdRotate = birdAnimation.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['0deg', '-2deg', '1deg', '-1deg', '0deg'], // Slight wing tilt
  });

  const cloudTranslateX = cloudAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: theme.type === 'evening' 
      ? [-150, width + 150] // Slower evening clouds
      : [-100, width + 100], // Standard cloud movement
  });

  const cloudOpacityAnimation = cloudAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: theme.type === 'morning' 
      ? [0.6, 0.9, 0.6] // Misty morning clouds
      : [0.7, 1, 0.7], // Standard clouds
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
              opacity: theme.sunOpacity || 1, // Use sunOpacity if provided
              transform: [
                { rotate: sunRotation },
                { scale: sunScale }
              ]
            }
          ]}
        >
          <View style={[
            dynamicHeroStyles.sunRays, 
            { 
              borderColor: theme.sunColor,
              opacity: theme.sunOpacity || 1 // Apply opacity to rays too
            }
          ]} />
        </Animated.View>
      )}

      {/* Moon Animation with Enhanced Effects */}
      {theme.showMoon && (
        <View style={dynamicHeroStyles.moonContainer}>
          {/* Moon behind clouds */}
          <Animated.View 
            style={[
              dynamicHeroStyles.moon,
              { 
                backgroundColor: theme.moonColor,
                opacity: theme.moonOpacity || 1,
                transform: [
                  { rotate: moonRotation },
                  { scale: moonGlow }
                ]
              }
            ]}
          >
            {/* Multiple moon craters for realistic look */}
            <View style={dynamicHeroStyles.moonCrater1} />
            <View style={dynamicHeroStyles.moonCrater2} />
            <View style={dynamicHeroStyles.moonCrater3} />
            <View style={dynamicHeroStyles.moonCrater4} />
            <View style={dynamicHeroStyles.moonCrater5} />
          </Animated.View>
          
          {/* Layered clouds covering moon when cloudy */}
          {theme.showClouds && (
            <>
              {/* Front cloud layer */}
              <Animated.View 
                style={[
                  dynamicHeroStyles.moonCloud1,
                  { 
                    backgroundColor: theme.cloudColor,
                    opacity: Animated.multiply(theme.cloudOpacity || 0.8, cloudOpacityAnimation),
                    transform: [{ translateX: cloudTranslateX }]
                  }
                ]} 
              />
              {/* Side cloud layer */}
              <Animated.View 
                style={[
                  dynamicHeroStyles.moonCloud2,
                  { 
                    backgroundColor: theme.cloudColor,
                    opacity: Animated.multiply(
                      Animated.multiply(theme.cloudOpacity || 0.8, 0.7), 
                      cloudOpacityAnimation
                    ),
                    transform: [{ 
                      translateX: cloudTranslateX.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, -15]
                      })
                    }]
                  }
                ]} 
              />
              {/* Background wispy cloud */}
              <Animated.View 
                style={[
                  dynamicHeroStyles.moonCloud3,
                  { 
                    backgroundColor: theme.cloudColor,
                    opacity: Animated.multiply(
                      Animated.multiply(theme.cloudOpacity || 0.8, 0.5), 
                      cloudOpacityAnimation
                    ),
                    transform: [{ 
                      translateX: cloudTranslateX.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-10, 25]
                      })
                    }]
                  }
                ]} 
              />
            </>
          )}
        </View>
      )}

      {/* Enhanced Stars Animation */}
      {theme.showStars && (
        <View style={dynamicHeroStyles.starsContainer}>
          {[...Array(15)].map((_, index) => (
            <Animated.View
              key={index}
              style={[
                dynamicHeroStyles.star,
                {
                  backgroundColor: theme.starColor,
                  opacity: starOpacity,
                  transform: [{ scale: starTwinkle }],
                  left: `${8 + (index * 6)}%`,
                  top: `${10 + (index % 4) * 18}%`,
                  shadowColor: theme.starColor,
                  shadowOpacity: starOpacity,
                  shadowRadius: 4,
                  elevation: 8,
                }
              ]}
            />
          ))}
          {/* Additional smaller stars for more realistic night sky */}
          {theme.type === 'night' && [...Array(8)].map((_, index) => (
            <Animated.View
              key={`small-${index}`}
              style={[
                dynamicHeroStyles.star,
                {
                  backgroundColor: theme.starColor,
                  opacity: Animated.multiply(starOpacity, 0.6),
                  width: 2,
                  height: 2,
                  borderRadius: 1,
                  left: `${20 + (index * 8)}%`,
                  top: `${25 + (index % 3) * 15}%`,
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

      {/* Storm Animation */}
      {theme.showStorm && (
        <Animated.View
          style={[
            dynamicHeroStyles.stormFlash,
            {
              opacity: starAnimation.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0.3, 0],
              }),
            },
          ]}
        />
      )}

      {/* Snow Animation */}
      {theme.showSnow && (
        <View style={dynamicHeroStyles.weatherOverlay}>
          {[...Array(20)].map((_, index) => (
            <Animated.View
              key={`snow-${index}`}
              style={[
                dynamicHeroStyles.snowFlake,
                {
                  left: `${(index * 5) % 100}%`,
                  transform: [
                    {
                      translateY: starAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-10, 250],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
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
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [selectedRadius, setSelectedRadius] = useState<number>(15); // Default 15km radius
  const [showRadiusSelector, setShowRadiusSelector] = useState(false);
  const [radiusLoading, setRadiusLoading] = useState(false); // Track radius change loading

  // Available radius options
  const radiusOptions = [
    { value: 5, label: '5 km', description: 'Very Close' },
    { value: 10, label: '10 km', description: 'Close' },
    { value: 15, label: '15 km', description: 'Nearby' },
    { value: 25, label: '25 km', description: 'Extended' },
    { value: 50, label: '50 km', description: 'Wide Area' },
  ];

  const handleWeatherUpdate = (weather: WeatherData) => {
    setCurrentWeather(weather);
  };

  const getWeatherIconName = (condition: WeatherData['condition']): string => {
    switch (condition) {
      case 'sunny':
      case 'clear':
        return 'sunny';
      case 'partly-cloudy':
        return 'partly-sunny';
      case 'cloudy':
        return 'cloudy';
      case 'rainy':
        return 'rainy';
      case 'stormy':
        return 'thunderstorm';
      case 'snowy':
        return 'snow';
      default:
        return 'partly-sunny';
    }
  };

  const getWeatherColor = (condition: WeatherData['condition']): string => {
    switch (condition) {
      case 'sunny':
      case 'clear':
        return '#FFD700'; // Gold
      case 'partly-cloudy':
        return '#87CEEB'; // Sky blue
      case 'cloudy':
        return '#B0C4DE'; // Light steel blue
      case 'rainy':
        return '#4682B4'; // Steel blue
      case 'stormy':
        return '#483D8B'; // Dark slate blue
      case 'snowy':
        return '#E0E0E0'; // Light gray
      default:
        return '#87CEEB';
    }
  };

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
      // Also reload recommendations with new location if user is authenticated
      if (isUserAuthenticated) {
        console.log('🔄 Location changed: Reloading recommendations...');
        loadMainRecommendations();
      }
      showSuccess('Home data updated for new location');
    });

    console.log('✅ Location change listener setup complete');
    return cleanup;
  }, []); // Empty dependency array since we only want this to run once

  // Run main initialization after login check
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 HOME SCREEN: Initializing app...');
      
      // First load saved radius
      await loadSavedRadius();
      
      // Then, try to preload cached data for instant display
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

  // Refresh data when radius changes
  useEffect(() => {
    console.log('🔍 useEffect[selectedRadius] triggered - selectedRadius:', selectedRadius, 'homeData exists:', !!homeData);
    
    if (selectedRadius && homeData) { // Only run if we have initial data loaded
      console.log(`🔄 Radius changed to ${selectedRadius}km, refreshing data...`);
      setRadiusLoading(true);
      setLoading(true);
      // Clear current data to show skeleton animation
      setHomeData(null);
      saveSelectedRadius(selectedRadius);
      fetchHomeData();
      
      // Also reload recommendations with new radius if user is authenticated
      if (isUserAuthenticated) {
        loadMainRecommendations();
      }
    } else {
      console.log('🔍 useEffect[selectedRadius] - conditions not met, skipping refresh');
    }
  }, [selectedRadius]);

  // Debug: Monitor showRadiusSelector state changes
  useEffect(() => {
    console.log('👁️ showRadiusSelector state changed to:', showRadiusSelector);
  }, [showRadiusSelector]);

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
        
        // Load main recommendations for authenticated users immediately
        console.log('🎯 About to call loadMainRecommendations');
        
        // Load recommendations directly since we know user is authenticated
        try {
          const coordinates = getCoordinatesForAPI();
          console.log('📍 Direct recommendations call - Coordinates:', coordinates);
          
          const response = await getMainRecommendations(
            coordinates.latitude,
            coordinates.longitude,
            10 // Load 10 recommendations for home screen
          );

          if (response.success) {
            console.log(`✅ Direct call: Loaded ${response.data.recommendations?.length || 0} main recommendations`);
            setRecommendations(response.data.recommendations || []);
          } else {
            console.log('❌ Direct call: Failed to load main recommendations');
          }
        } catch (error) {
          console.error('❌ Direct call: Error loading recommendations:', error);
        }
      } else {
        console.log('❌ User is not authenticated, skipping profile and recommendations');
      }
      
      return authenticated; // Return authentication status
    } catch (error) {
      console.error('Error checking auth or loading user:', error);
      return false;
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
      
      // Try to get cached data first (but check if radius changed)
      const cachedData = await cacheService.getHomeData(coordinates);
      if (cachedData && !hasRadiusChanged()) {
        console.log('Using cached home data with same radius');
        setHomeData(cachedData);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      console.log(`Fetching fresh home data with ${selectedRadius}km radius`);
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.HOME)}?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&radius=${selectedRadius}`;
      const data: HomeResponse = await fetchWithJsonValidation(url);

      if (data.success) {
        setHomeData(data.data);
        // Cache the new data
        await cacheService.setHomeData(data.data, coordinates);
        console.log(`Home data cached for ${selectedRadius}km radius`);
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
      // Show success message when radius loading completes
      if (radiusLoading) {
        showSuccess(`Search radius updated to ${selectedRadius}km`);
      }
      setRadiusLoading(false);
    }
  };

  // Check if radius has changed since last cache
  const hasRadiusChanged = async () => {
    try {
      const lastRadius = await AsyncStorage.getItem('lastSelectedRadius');
      return lastRadius !== selectedRadius.toString();
    } catch (error) {
      return true; // If error, assume radius changed to force fresh data
    }
  };

  // Save selected radius
  const saveSelectedRadius = async (radius: number) => {
    try {
      await AsyncStorage.setItem('lastSelectedRadius', radius.toString());
    } catch (error) {
      console.error('Error saving selected radius:', error);
    }
  };

  // Load saved radius on app start
  const loadSavedRadius = async () => {
    try {
      const savedRadius = await AsyncStorage.getItem('lastSelectedRadius');
      console.log('📱 loadSavedRadius - savedRadius from AsyncStorage:', savedRadius);
      console.log('📱 loadSavedRadius - current selectedRadius state:', selectedRadius);
      
      if (savedRadius && savedRadius !== selectedRadius.toString()) {
        const radiusValue = parseInt(savedRadius);
        console.log('📱 Setting saved radius from AsyncStorage:', radiusValue);
        setSelectedRadius(radiusValue);
      } else if (savedRadius) {
        console.log('📱 Saved radius same as current, keeping:', selectedRadius);
      } else {
        console.log('📱 No saved radius found, using default 15km');
        // Set default radius in AsyncStorage
        await AsyncStorage.setItem('lastSelectedRadius', '15');
      }
    } catch (error) {
      console.error('❌ Error loading saved radius:', error);
    }
  };

  // Fetch fresh data bypassing cache (used when location changes)
  const fetchFreshHomeData = async () => {
    try {
      // Get coordinates from LocationContext
      const coordinates = getCoordinatesForAPI();
      
      console.log(`🔄 Fetching fresh home data for new location with ${selectedRadius}km radius:`, coordinates);
      
      // Force clear any existing cache first
      await cacheService.forceRefreshHomeData();
      
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.HOME)}?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&radius=${selectedRadius}`;
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
          { text: 'Retry', onPress: () => {
            fetchFreshHomeData();
            if (isUserAuthenticated) {
              loadMainRecommendations();
            }
          }}
        ]
      });
    } finally {
      setLoading(false);
      setRadiusLoading(false);
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
      // Use global error handler for non-validation errors
      handleApiError(error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
    // Also reload recommendations if user is authenticated
    if (isUserAuthenticated) {
      console.log('🔄 Refreshing: Reloading recommendations...');
      loadMainRecommendations();
    }
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

  const handleRadiusSelect = (radius: number) => {
    console.log('🎯 handleRadiusSelect called with radius:', radius);
    console.log('🎯 Current selectedRadius:', selectedRadius);
    console.log('🎯 Will radius change?', radius !== selectedRadius);
    
    // Always update the state, regardless of current value
    console.log('🔄 Forcing radius update to:', radius);
    
    // Update state immediately
    setSelectedRadius(radius);
    setShowRadiusSelector(false);
    
    // Save to AsyncStorage immediately
    const saveImmediately = async () => {
      try {
        await AsyncStorage.setItem('lastSelectedRadius', radius.toString());
        console.log('💾 Saved radius to AsyncStorage:', radius);
        
        // Verify it was saved
        const verification = await AsyncStorage.getItem('lastSelectedRadius');
        console.log('✅ Verification - AsyncStorage now contains:', verification);
      } catch (error) {
        console.error('❌ Error saving radius:', error);
      }
    };
    
    saveImmediately();
    console.log('✅ Radius selection completed for:', radius);
  };

  const handleRadiusSelectorToggle = () => {
    console.log('🔄 Radius selector toggle clicked - current state:', showRadiusSelector);
    console.log('🔄 Current selectedRadius at toggle:', selectedRadius);
    
    const newState = !showRadiusSelector;
    console.log('🔄 About to set showRadiusSelector to:', newState);
    
    // Update state with callback to ensure it's set
    setShowRadiusSelector(prevState => {
      console.log('🔄 setShowRadiusSelector callback - prevState:', prevState, '-> newState:', !prevState);
      return !prevState;
    });
    
    // Debug: Check AsyncStorage when toggling
    const checkAsyncStorage = async () => {
      try {
        const storedRadius = await AsyncStorage.getItem('lastSelectedRadius');
        console.log('🔍 AsyncStorage check - stored radius:', storedRadius);
        
        // TEMPORARY DEBUG: Clear AsyncStorage to test
        // Uncomment the next line to clear AsyncStorage for testing
        // await AsyncStorage.removeItem('lastSelectedRadius');
        // console.log('🧹 DEBUG: Cleared AsyncStorage for testing');
      } catch (error) {
        console.error('Error checking AsyncStorage:', error);
      }
    };
    checkAsyncStorage();
    
    console.log('✅ Toggle function completed');
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

  const handleViewAllNationalBrands = () => {
    router.push('/top-national-brands' as any);
  };

  const handleViewAllFeaturedAttractions = () => {
    router.push('/featured-attractions' as any);
  };

  const handleViewAllPopularAttractions = () => {
    router.push('/popular-attractions' as any);
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
            {item.category_name || item.category?.name || 'Category'}{item.subcategory_name ? ` • ${item.subcategory_name}` : ''}
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
    // Create the original onPress handler - item is now directly the business
    const originalOnPress = () => {
      router.push(`/business/${item.id}` as any);
    };

    // Add tracking with section for recommendations
    const onPressWithTracking = typeof index === 'number' 
      ? addTrackingToPress(originalOnPress, item.id, index, 'main_recommendations')
      : originalOnPress;

    return (
      <TouchableOpacity 
        style={[styles.businessCard, styles.recommendationCard, { backgroundColor: colors.card }]}
        onPress={onPressWithTracking}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: getImageUrl(item.images?.logo) || getFallbackImageUrl('business') }} 
          style={styles.businessImage}
        />
        
        {/* Trending Badge - using personalization_score as indicator */}
        {item.personalization_score && (
          <View style={[styles.trendingBadge, { backgroundColor: '#FF6B35' }]}>
            <Ionicons name="trending-up" size={10} color="white" />
            <Text style={styles.trendingText}>For You</Text>
          </View>
        )}
        
        <View style={styles.businessInfo}>
          <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.businessCategory, { color: colors.icon }]} numberOfLines={1}>
            {item.category?.name || 'Business'} • {item.address?.area}
          </Text>
          {item.address?.landmark && (
            <Text style={[styles.businessLandmark, { color: colors.icon }]} numberOfLines={1}>
              {item.address.landmark}
            </Text>
          )}
          <View style={styles.businessMeta}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={[styles.rating, { color: colors.text }]}>{item.rating?.overall_rating}</Text>
            </View>
            <View style={styles.metaRight}>
              <Text style={[styles.distance, { color: colors.icon }]}>
                {item.distance?.formatted}
              </Text>
              <Text style={[styles.priceRange, { color: colors.icon }]}>
                {item.price_range ? `${'$'.repeat(item.price_range)}` : '$'}
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

  const renderNationalBrandCard = ({ item, index }: { item: NationalBrand, index?: number }) => {
    // Create the original onPress handler
    const originalOnPress = () => {
      router.push(`/business/${item.id}` as any);
    };

    // Add tracking if index is provided
    const onPressWithTracking = typeof index === 'number' 
      ? addTrackingToPress(originalOnPress, item.id, index, 'top_national_brands')
      : originalOnPress;

    const hasValidImage = item.logo_image && item.logo_image.trim() !== '';

    // Get category color for enhanced theming
    const categoryColor = colors.tint;

    return (
      <TouchableOpacity 
        style={[
          styles.nationalBrandCard, 
          { 
            backgroundColor: colors.card,
            borderColor: categoryColor + '20',
            borderWidth: 1,
            shadowColor: categoryColor + '30',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }
        ]}
        onPress={onPressWithTracking}
        activeOpacity={0.7}
      >
        {/* Enhanced Image Container */}
        <View style={nationalBrandsStyles.nationalBrandImageContainer}>
          {hasValidImage ? (
            <Image 
              source={{ uri: getImageUrl(item.logo_image) }} 
              style={styles.nationalBrandImage}
            />
          ) : (
            <View style={[styles.nationalBrandImagePlaceholder, { backgroundColor: colors.background }]}>
              <Ionicons name="business-outline" size={40} color={colors.text + '40'} />
              <Text style={[styles.noImageText, { color: colors.text + '60' }]}>No Image</Text>
            </View>
          )}
          
          {/* Enhanced National Badge */}
          <View style={[nationalBrandsStyles.enhancedNationalBadge, { backgroundColor: categoryColor }]}>
            <Ionicons name="flag" size={8} color="white" />
            <Text style={nationalBrandsStyles.enhancedNationalBadgeText}>National</Text>
          </View>
          
          {/* Featured Ribbon */}
          <View style={[nationalBrandsStyles.featuredRibbon, { backgroundColor: '#FFD700' }]}>
            <Ionicons name="star" size={10} color="white" />
          </View>
        </View>
        
        <View style={styles.nationalBrandInfo}>
          {/* Enhanced Brand Name */}
          <View style={nationalBrandsStyles.brandNameContainer}>
            <Text style={[styles.nationalBrandName, { color: colors.text }]} numberOfLines={1}>
              {item.business_name}
            </Text>
            <View style={[nationalBrandsStyles.categoryAccent, { backgroundColor: categoryColor }]} />
          </View>
          
          <Text style={[styles.nationalBrandCategory, { color: categoryColor }]} numberOfLines={1}>
            {item.category.name}
          </Text>
          
          <Text style={[styles.nationalBrandDescription, { color: colors.icon }]} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.nationalBrandMeta}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={[styles.rating, { color: colors.text }]}>{item.overall_rating}</Text>
              <Text style={[styles.nationalBrandReviews, { color: colors.icon }]}>({item.total_reviews})</Text>
            </View>
            
            {/* Enhanced Coverage Badge */}
            <View style={[nationalBrandsStyles.enhancedCoverageBadge, { backgroundColor: categoryColor + '15' }]}>
              <Ionicons name="globe-outline" size={10} color={categoryColor} />
              <Text style={[nationalBrandsStyles.enhancedCoverageBadgeText, { color: categoryColor }]}>
                {item.service_coverage === 'national' ? 'Nationwide' : item.service_coverage}
              </Text>
            </View>
          </View>
          
          {/* Trust Score Bar */}
          <View style={nationalBrandsStyles.trustScoreContainer}>
            <Text style={[nationalBrandsStyles.trustScoreLabel, { color: colors.icon }]}>Trust Score</Text>
            <View style={[nationalBrandsStyles.trustScoreBar, { backgroundColor: colors.background }]}>
              <View 
                style={[
                  nationalBrandsStyles.trustScoreFill, 
                  { 
                    backgroundColor: categoryColor,
                    width: `${Math.min(parseFloat(item.overall_rating) * 20, 100)}%`
                  }
                ]} 
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderAttractionCard = ({ item, index }: { item: FeaturedAttraction, index?: number }) => {
    // Create the original onPress handler
    const originalOnPress = () => {
      router.push(`/attraction/${item.id}` as any);
    };

    // Use attraction-specific tracking instead of business tracking
    const onPressWithTracking = () => {
      // Log attraction click tracking (since we don't have a full attraction tracking service, just log it)
      console.log('📊 Featured attraction clicked:', {
        attractionId: item.id,
        position: (index || 0) + 1,
        section: 'featured_attractions',
        element: 'attraction_card',
      });
      originalOnPress();
    };

    // Format distance for display
    const formatDistance = (distance: number) => {
      if (distance < 1) {
        return `${Math.round(distance * 1000)}m`;
      }
      return `${distance.toFixed(1)}km`;
    };

    // Format estimated duration
    const formatDuration = (minutes: number) => {
      if (minutes < 60) {
        return `${minutes}min`;
      }
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours}h`;
      }
      return `${hours}h ${remainingMinutes}min`;
    };

    // Get difficulty color
    const getDifficultyColor = (level: string) => {
      switch (level.toLowerCase()) {
        case 'easy':
          return '#22C55E'; // Green
        case 'moderate':
          return '#F59E0B'; // Amber
        case 'hard':
          return '#EF4444'; // Red
        default:
          return colors.icon;
      }
    };

    return (
      <TouchableOpacity 
        style={[styles.attractionCard, { backgroundColor: colors.card }]}
        onPress={onPressWithTracking}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: getImageUrl(item.cover_image_url) || getFallbackImageUrl('general') }} 
          style={styles.attractionImage}
        />
        
        {/* Free/Paid Badge */}
        <View style={[styles.priceBadge, { backgroundColor: item.is_free ? '#22C55E' : '#3B82F6' }]}>
          <Text style={styles.priceBadgeText}>
            {item.is_free ? 'FREE' : `${item.currency} ${item.entry_fee}`}
          </Text>
        </View>

        {/* Featured Badge */}
        {item.is_featured && (
          <View style={[styles.featuredBadge, { backgroundColor: '#FFD700' }]}>
            <Ionicons name="star" size={10} color="white" />
            <Text style={styles.featuredBadgeText}>Featured</Text>
          </View>
        )}
        
        <View style={styles.attractionInfo}>
          <Text style={[styles.attractionName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.attractionCategory, { color: colors.icon }]} numberOfLines={1}>
            {item.category} • {item.subcategory}
          </Text>
          <Text style={[styles.attractionLocation, { color: colors.icon }]} numberOfLines={1}>
            {item.area}, {item.city}
          </Text>
          
          <View style={styles.attractionMeta}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={[styles.rating, { color: colors.text }]}>{Number(item.overall_rating).toFixed(1)}</Text>
              <Text style={[styles.attractionReviews, { color: colors.icon }]}>({item.total_reviews})</Text>
            </View>
            
            <Text style={[styles.distance, { color: colors.icon }]}>{item.distance_km ? formatDistance(item.distance_km) : 'N/A'}</Text>
          </View>

          {/* Additional attraction info */}
          <View style={styles.attractionDetails}>
            <View style={styles.attractionDetailItem}>
              <Ionicons name="time-outline" size={12} color={colors.icon} />
              <Text style={[styles.attractionDetailText, { color: colors.icon }]}>
                {formatDuration(item.estimated_duration_minutes)}
              </Text>
            </View>
            
            <View style={styles.attractionDetailItem}>
              <Ionicons name="fitness-outline" size={12} color={getDifficultyColor(item.difficulty_level)} />
              <Text style={[styles.attractionDetailText, { color: getDifficultyColor(item.difficulty_level) }]}>
                {item.difficulty_level}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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

  if ((loading && !homeData) || isLocationChanging || radiusLoading) {
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
            onPress={() => {
              console.log('🔍 Search bar pressed - navigating to search page');
              router.push('/search' as any);
            }}
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
          {radiusLoading && (
            <View style={styles.radiusLoadingIndicator}>
              <Text style={[styles.radiusLoadingText, { color: colors.text }]}>
                🔄 Updating search radius to {selectedRadius}km...
              </Text>
            </View>
          )}
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
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
          <DynamicHeroSection 
            colors={colors}
            colorScheme={colorScheme}
            onWeatherUpdate={handleWeatherUpdate}
          />
        </View>
        
        <View style={[styles.headerTop, { zIndex: 20 }]}>
          <View style={styles.welcomeSection}>
            <View style={styles.greetingRow}>
              <Text style={styles.greeting}>
                {getGreeting()}, {user?.name ? getFirstName(user.name) : (isUserAuthenticated ? 'User' : 'Guest')}
              </Text>
              
              {/* Inline Weather Display */}
              <View style={styles.weatherDisplay}>
                <Ionicons 
                  name={currentWeather ? getWeatherIconName(currentWeather.condition) as any : 'partly-sunny'} 
                  size={14} 
                  color={currentWeather ? getWeatherColor(currentWeather.condition) : '#87CEEB'}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.weatherText}>
                  {currentWeather ? currentWeather.temperature : 28}°C
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.locationContainer} 
              onPress={() => {
                console.log('📍 Location change pressed - navigating to location selection');
                router.push('/location-selection');
              }}
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
              keyExtractor={(item) => item.id.toString()}
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

        {/* Featured Attractions */}
        {homeData?.featured_attractions && homeData.featured_attractions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.attractionHeaderMain}>
                <View style={[styles.attractionIcon, { backgroundColor: '#22C55E' }]}>
                  <Ionicons name="location" size={16} color="white" />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 8 }]}>
                  Featured Attractions
                </Text>
              </View>
              <TouchableOpacity onPress={handleViewAllFeaturedAttractions}>
                <Text style={[styles.viewAll, { color: colors.tint }]}>View All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={homeData.featured_attractions}
              renderItem={({ item, index }) => renderAttractionCard({ item, index })}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.businessContainer}
            />
          </View>
        )}

        {/* Popular Attractions */}
        {homeData?.popular_attractions && homeData.popular_attractions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.attractionHeaderMain}>
                <View style={[styles.attractionIcon, { backgroundColor: '#3B82F6' }]}>
                  <Ionicons name="trending-up" size={16} color="white" />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 8 }]}>
                  Popular Attractions
                </Text>
              </View>
              <TouchableOpacity onPress={handleViewAllPopularAttractions}>
                <Text style={[styles.viewAll, { color: colors.tint }]}>View All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={homeData.popular_attractions}
              renderItem={({ item, index }) => renderAttractionCard({ item, index })}
              keyExtractor={(item) => `popular-${item.id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.businessContainer}
            />
          </View>
        )}

        {/* Top National Brands - Enhanced Section */}
        {homeData?.top_national_brands && homeData.top_national_brands.length > 0 && (
          <View style={styles.section}>
            {/* Enhanced Header */}
            <View style={nationalBrandsStyles.nationalBrandsHeader}>
              <View style={nationalBrandsStyles.nationalBrandsHeaderContent}>
                <View style={[nationalBrandsStyles.nationalHeaderIcon, { backgroundColor: colors.tint }]}>
                  <Ionicons name="flag" size={20} color="white" />
                </View>
                <View style={nationalBrandsStyles.nationalHeaderText}>
                  <Text style={[nationalBrandsStyles.nationalBrandsTitle, { color: colors.text }]}>
                    Top National Brands
                  </Text>
                  <Text style={[nationalBrandsStyles.nationalBrandsSubtitle, { color: colors.icon }]}>
                    Leading brands across Bangladesh
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={[nationalBrandsStyles.viewAllNationalButton, { backgroundColor: colors.tint }]}
                onPress={handleViewAllNationalBrands}
              >
                <Text style={nationalBrandsStyles.viewAllNationalButtonText}>View All</Text>
                <Ionicons name="chevron-forward" size={16} color="white" />
              </TouchableOpacity>
            </View>


            {/* Featured Brands Showcase */}
            <>
              {homeData.top_national_brands.map((brandSection, sectionIndex) => (
                <View key={`brand-section-${sectionIndex}`} style={nationalBrandsStyles.brandSection}>
                  <View style={nationalBrandsStyles.brandSectionHeader}>
                    <Text style={[nationalBrandsStyles.brandSectionTitle, { color: colors.text }]}>
                      {brandSection.section_title}
                    </Text>
                    <Text style={[nationalBrandsStyles.brandSectionDescription, { color: colors.icon }]}>
                      {brandSection.section_description}
                    </Text>
                  </View>
                  
                  <FlatList
                    data={brandSection.businesses}
                    renderItem={({ item, index }) => renderNationalBrandCard({ item, index })}
                    keyExtractor={(item) => `brand-${item.id}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.businessContainer}
                  />
                </View>
              ))}
            </>
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

      {/* Floating Radius Selector - Modern Design */}
      <View style={styles.floatingRadiusSelector}>
        {/* Main Floating Button */}
        <TouchableOpacity
          style={[
            styles.floatingRadiusButton,
            { backgroundColor: colors.tint },
            showRadiusSelector && styles.floatingRadiusButtonActive
          ]}
          onPress={() => {
            console.log('🔘 Floating button pressed - current selectedRadius:', selectedRadius);
            handleRadiusSelectorToggle();
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="location" size={18} color="white" />
          <Text style={styles.floatingRadiusButtonText}>
            {selectedRadius}km
          </Text>
        </TouchableOpacity>

        {/* Floating Options Panel */}
        {(() => {
          console.log('📺 RENDERING CHECK: showRadiusSelector =', showRadiusSelector);
          return showRadiusSelector;
        })() && (
          <>
            {/* Backdrop */}
            <TouchableOpacity
              style={styles.floatingRadiusBackdrop}
              activeOpacity={1}
              onPress={() => {
                console.log('📺 Backdrop pressed - closing panel');
                setShowRadiusSelector(false);
              }}
            />
            
            {/* Options Panel */}
            <View style={[styles.floatingRadiusPanel, { backgroundColor: colors.card }]}>
              <View style={styles.floatingRadiusPanelHeader}>
                <Text style={[styles.floatingRadiusPanelTitle, { color: colors.text }]}>Search Radius</Text>
                <TouchableOpacity onPress={() => {
                  console.log('📺 Close button pressed');
                  setShowRadiusSelector(false);
                }}>
                  <Ionicons name="close" size={20} color={colors.icon} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.floatingRadiusOptions}>
                {radiusOptions.map((option, index) => {
                  const isSelected = selectedRadius === option.value;
                  console.log(`🔍 Rendering option ${option.value}km - isSelected:`, isSelected);
                  
                  return (
                    <TouchableOpacity
                      key={`radius-${option.value}`}
                      style={[
                        styles.floatingRadiusOption,
                        isSelected && [
                          styles.floatingRadiusOptionSelected,
                          { backgroundColor: colors.tint + '15', borderColor: colors.tint }
                        ],
                        index === radiusOptions.length - 1 && styles.floatingRadiusOptionLast
                      ]}
                      onPress={() => {
                        console.log('🔘 Radius option PRESSED:', {
                          value: option.value,
                          label: option.label,
                          currentSelected: selectedRadius,
                          isSelected: isSelected
                        });
                        handleRadiusSelect(option.value);
                      }}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Increase touch area
                    >
                      <View style={styles.floatingRadiusOptionContent}>
                        <View style={styles.floatingRadiusOptionMain}>
                          <Text style={[
                            styles.floatingRadiusOptionLabel,
                            { color: isSelected ? colors.tint : colors.text }
                          ]}>
                            {option.label}
                          </Text>
                          <Text style={[styles.floatingRadiusOptionDesc, { color: colors.icon }]}>
                            {option.description}
                          </Text>
                        </View>
                        
                        {isSelected ? (
                          <Ionicons name="checkmark-circle" size={24} color={colors.tint} />
                        ) : (
                          <View style={[styles.floatingRadiusOptionCircle, { borderColor: colors.icon + '30' }]} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </View>
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
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  weatherDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    marginLeft: 8,
  },
  weatherText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 15,
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
    zIndex: 15,
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
  sectionDescription: {
    fontSize: 13,
    opacity: 0.8,
    lineHeight: 16,
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
  attractionHeaderMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attractionIcon: {
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
  // National Brand Styles
  nationalBrandCard: {
    width: 190,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    marginRight: 10,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  nationalBrandHeader: {
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
  },
  nationalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  nationalBrandHeaderContainer: {
    flex: 1,
  },
  breakingNewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  breakingNewsLabel: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 12,
  },
  breakingText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  nationalBrandTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nationalSectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nationalBrandTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
  },
  nationalBrandImage: {
    width: '100%',
    height: 110,
    resizeMode: 'cover',
  },
  nationalBrandImagePlaceholder: {
    width: '100%',
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  noImageText: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
  nationalBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  nationalBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
    letterSpacing: 0.3,
  },
  nationalBrandInfo: {
    padding: 20,
    flex: 1,
  },
  nationalBrandName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 18,
  },
  nationalBrandCategory: {
    fontSize: 12,
    marginBottom: 6,
    opacity: 0.8,
    fontWeight: '500',
  },
  nationalBrandDescription: {
    fontSize: 11,
    marginBottom: 10,
    opacity: 0.7,
    lineHeight: 16,
  },
  nationalBrandMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nationalBrandReviews: {
    fontSize: 10,
    marginLeft: 2,
    opacity: 0.7,
  },
  coverageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  coverageBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  // Featured Attraction Styles
  attractionCard: {
    width: 200,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 4,
  },
  attractionImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  attractionInfo: {
    padding: 12,
  },
  attractionName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 18,
  },
  attractionCategory: {
    fontSize: 11,
    marginBottom: 2,
    opacity: 0.7,
  },
  attractionLocation: {
    fontSize: 11,
    marginBottom: 6,
    opacity: 0.7,
  },
  attractionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  attractionReviews: {
    fontSize: 10,
    marginLeft: 2,
    opacity: 0.7,
  },
  attractionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attractionDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attractionDetailText: {
    fontSize: 10,
    fontWeight: '500',
  },
  priceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 1,
  },
  priceBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 1,
  },
  featuredBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '600',
    marginLeft: 2,
  },
  // Modern Floating Radius Selector
  floatingRadiusSelector: {
    position: 'absolute',
    bottom: 20, // Even lower position - very close to screen bottom
    right: 20, // Slightly closer to edge for better reach
    zIndex: 9999, // Higher zIndex to ensure it's on top
  },
  floatingRadiusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    gap: 7,
    minWidth: 90,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  floatingRadiusButtonActive: {
    transform: [{ scale: 1.05 }],
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  floatingRadiusButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  floatingRadiusBackdrop: {
    position: 'absolute',
    top: -2000, // Large backdrop area
    left: -2000,
    right: -2000,
    bottom: -100,
    zIndex: 9998, // Lower than panel
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent backdrop
  },
  floatingRadiusPanel: {
    position: 'absolute',
    bottom: 70, // Adjusted position above the lower button
    right: 0,
    width: 300, // Wider panel
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 25, // Higher elevation than backdrop
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    zIndex: 9999, // Highest z-index
  },
  floatingRadiusPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  floatingRadiusPanelTitle: {
    fontSize: 19,
    fontWeight: '700',
  },
  floatingRadiusOptions: {
    padding: 8,
    zIndex: 10000, // Ensure options are above everything
  },
  floatingRadiusOption: {
    borderRadius: 12,
    marginVertical: 2,
    borderWidth: 1,
    borderColor: 'transparent',
    zIndex: 10001, // Individual option z-index
  },
  floatingRadiusOptionSelected: {
    borderWidth: 2,
  },
  floatingRadiusOptionLast: {
    marginBottom: 8,
  },
  floatingRadiusOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  floatingRadiusOptionMain: {
    flex: 1,
  },
  floatingRadiusOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  floatingRadiusOptionDesc: {
    fontSize: 13,
    opacity: 0.7,
  },
  floatingRadiusOptionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  // Original Radius Selector Styles (keep for backwards compatibility)
  radiusSelectorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  radiusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  radiusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radiusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  radiusOptions: {
    marginTop: 8,
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  radiusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedRadiusOption: {
    borderWidth: 1,
  },
  radiusOptionInfo: {
    flex: 1,
  },
  radiusOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  radiusOptionDescription: {
    fontSize: 12,
    opacity: 0.7,
  },
  radiusLoadingIndicator: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  radiusLoadingText: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
});

// National Brands Styles
const nationalBrandsStyles = StyleSheet.create({
  nationalBrandsHeader: {
    paddingHorizontal: 24,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  nationalBrandsHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  nationalHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  nationalHeaderText: {
    flex: 1,
  },
  nationalBrandsTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  nationalBrandsSubtitle: {
    fontSize: 13,
    opacity: 0.6,
  },
  viewAllNationalButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  viewAllNationalButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  nationalCategoriesPreview: {
    marginBottom: 16,
  },
  categoryTabsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryTab: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 70,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryTabIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  categoryTabText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  brandSection: {
    marginTop: 12,
    marginBottom: 20,
  },
  brandSectionHeader: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  brandSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
    color: '#1a1a1a',
  },
  brandSectionDescription: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.6,
  },
  nationalBrandImageContainer: {
    position: 'relative',
    height: 100,
    backgroundColor: '#f8f8f8',
  },
  enhancedNationalBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  enhancedNationalBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  featuredRibbon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryAccent: {
    width: 3,
    height: 12,
    borderRadius: 1.5,
    marginLeft: 6,
  },
  enhancedCoverageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  enhancedCoverageBadgeText: {
    fontSize: 8,
    fontWeight: '600',
    marginLeft: 2,
  },
  trustScoreContainer: {
    marginTop: 10,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  trustScoreLabel: {
    fontSize: 9,
    marginBottom: 4,
    fontWeight: '600',
    opacity: 0.7,
  },
  trustScoreBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  trustScoreFill: {
    height: '100%',
    borderRadius: 2,
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
  moonContainer: {
    position: 'absolute',
    top: 30, // Little bit up (reduced from 35)
    right: 120, // Even more left (increased from 100)
    zIndex: 2,
  },
  moon: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 60, // Little bit bigger (increased from 55)
    height: 60, // Little bit bigger (increased from 55)
    borderRadius: 30, // Adjusted for bigger size
    zIndex: 3,
    shadowColor: '#F5F5DC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 22, // Adjusted glow for bigger moon
    elevation: 15,
    overflow: 'visible', // Show full moon with glow
  },
  moonCrescent: {
    // Remove crescent for full moon
    display: 'none',
  },
  moonCrater1: {
    position: 'absolute',
    top: 14, // Adjusted for bigger moon
    left: 18, // Adjusted for bigger moon
    width: 9, // Adjusted crater size
    height: 9,
    borderRadius: 4.5,
    backgroundColor: 'rgba(169, 169, 169, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  moonCrater2: {
    position: 'absolute',
    top: 30, // Adjusted for bigger moon
    right: 14, // Adjusted for bigger moon
    width: 7, // Adjusted crater size
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(169, 169, 169, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
  },
  moonCrater3: {
    position: 'absolute',
    top: 9, // Adjusted for bigger moon
    right: 22, // Adjusted for bigger moon
    width: 5, // Adjusted crater size
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(128, 128, 128, 0.4)',
  },
  moonCrater4: {
    position: 'absolute',
    top: 35, // Adjusted for bigger moon
    left: 9, // Adjusted for bigger moon
    width: 6, // Adjusted crater size
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(169, 169, 169, 0.4)',
  },
  moonCrater5: {
    position: 'absolute',
    top: 20, // Adjusted for bigger moon
    left: 32, // Adjusted for bigger moon
    width: 4, // Adjusted crater size
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128, 128, 128, 0.5)',
  },
  // Moon Cloud Layers
  moonCloud1: {
    position: 'absolute',
    top: 20,
    left: 45,
    width: 70,
    height: 30,
    borderRadius: 25,
    zIndex: 4,
  },
  moonCloud2: {
    position: 'absolute',
    top: 35,
    left: 25,
    width: 55,
    height: 25,
    borderRadius: 20,
    zIndex: 4,
  },
  moonCloud3: {
    position: 'absolute',
    top: 10,
    left: 60,
    width: 45,
    height: 20,
    borderRadius: 15,
    zIndex: 4,
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
  // Weather Animation Overlay
  weatherOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280, // Match hero container height
    zIndex: 3,
    pointerEvents: 'none',
  },
  // Storm Flash Animation
  stormFlash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    opacity: 0,
    zIndex: 4,
  },
  // Snow Animation
  snowFlake: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    opacity: 0.8,
  },
  
  // Enhanced National Brands Section Styles
  nationalBrandsHeader: {
    paddingHorizontal: 24,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  nationalBrandsHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  nationalHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nationalHeaderText: {
    flex: 1,
  },
  nationalBrandsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  nationalBrandsSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  viewAllNationalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewAllNationalButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
  },
  nationalCategoriesPreview: {
    marginBottom: 20,
  },
  categoryTabsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  categoryTab: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    borderRadius: 16,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryTabIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryTabText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  brandSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  brandSectionHeader: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  brandSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    color: '#1a1a1a',
  },
  brandSectionDescription: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.7,
  },
});
