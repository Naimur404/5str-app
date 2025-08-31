import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import {
    getAuthToken,
    getUserProfile,
    getUserReviews,
    logout,
    Review,
    User,
    updateProfile,
    UpdateProfilePayload,
    getPersonalizedRecommendations,
    PersonalizedRecommendationsResponse
} from '@/services/api';
import cacheService from '@/services/cacheService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
    Image,
} from 'react-native';
import EditProfileModal from '@/components/EditProfileModal';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/CustomAlert';
import { ProfilePageSkeleton } from '@/components/SkeletonLoader';
import ProfileAvatar from '@/components/ProfileAvatar';
import { getImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';

// Guest user data
const guestUser = {
  name: 'Guest User',
  email: null,
  phone: null,
  city: null,
  profile_image: null,
  trust_level: 0,
  total_points: 0,
  total_favorites: 0,
  total_reviews: 0,
  user_level: {
    level: 0,
    level_name: 'Guest',
    level_description: 'Sign in to start exploring',
    total_score: 0,
    progress_to_next_level: 0,
    points_contribution: 0,
    activity_contribution: 0,
    trust_contribution: 0,
    next_level_threshold: 0,
  },
  is_active: false,
  role: 'guest',
};

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  type: 'navigation' | 'toggle' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  color?: string;
}

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<any[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});
  const router = useRouter();
  const { colorScheme, themePreference, setThemePreference, isDarkMode, isAutoMode } = useTheme();
  const colors = Colors[colorScheme];
  const { alertConfig, showConfirm, showAlert, hideAlert } = useCustomAlert();

  // Helper function to render business image with fallback
  const renderBusinessImage = (business: any) => {
    const imageKey = `business_${business.id}`;
    const hasImageError = imageErrors[imageKey];
    
    // Get the best available image URL
    let imageUrl = null;
    if (business.image_url) {
      imageUrl = business.image_url;
    } else if (business.logo_image?.image_url) {
      imageUrl = business.logo_image.image_url;
    } else if (business.logo_image) {
      imageUrl = business.logo_image;
    }

    const finalImageUrl = getImageUrl(imageUrl);
    const fallbackUrl = getFallbackImageUrl('business');

    if (hasImageError || !imageUrl) {
      // Show fallback image or placeholder
      return (
        <Image
          source={{ uri: fallbackUrl }}
          style={styles.businessImage}
          onError={() => {
            // If even fallback fails, show placeholder
            console.log('Fallback image failed for business:', business.business_name);
          }}
        />
      );
    }

    return (
      <Image
        source={{ uri: finalImageUrl }}
        style={styles.businessImage}
        onError={() => {
          console.log('Primary image failed for business:', business.business_name);
          setImageErrors(prev => ({ ...prev, [imageKey]: true }));
        }}
        onLoad={() => {
          // Clear any previous error state on successful load
          if (hasImageError) {
            setImageErrors(prev => {
              const newState = { ...prev };
              delete newState[imageKey];
              return newState;
            });
          }
        }}
      />
    );
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const loadPersonalizedRecommendations = async () => {
    if (!isAuthenticated) return;
    
    try {
      setRecommendationsLoading(true);
      // Use default coordinates for now, you can get user's location from context
      const response = await getPersonalizedRecommendations(22.3569, 91.7832, 6);
      
      if (response.success && response.data) {
        // Handle both possible response structures
        let businessesArray: any[] = [];
        const data = response.data as any; // Cast to handle API response structure
        
        if (data.businesses) {
          // Your API response structure with businesses object
          businessesArray = Object.values(data.businesses);
        } else if (data.personalized_businesses) {
          // Interface structure with personalized_businesses array
          businessesArray = data.personalized_businesses;
        }
        
        setPersonalizedRecommendations(businessesArray);
      }
    } catch (error) {
      console.error('Error loading personalized recommendations:', error);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      
      if (token) {
        setIsAuthenticated(true);
        
        // Try to get cached user profile first
        const cachedUser = await cacheService.getUserProfile();
        if (cachedUser) {
          console.log('Using cached user profile in profile page');
          // Ensure user_level exists
          if (!cachedUser.user_level) {
            cachedUser.user_level = guestUser.user_level;
          }
          setUser(cachedUser);
        }

        const [userResponse, reviewsResponse] = await Promise.all([
          getUserProfile(),
          getUserReviews()
        ]);
        
        if (userResponse.success) {
          const userData = userResponse.data.user;
          // Ensure user_level exists
          if (!userData.user_level) {
            userData.user_level = guestUser.user_level;
          }
          setUser(userData);
          // Update cache with fresh data
          await cacheService.setUserProfile(userData);
          console.log('User profile updated in cache');
        }
        
        if (reviewsResponse.success) {
          setReviews(reviewsResponse.data.reviews);
        }

        // Load personalized recommendations for authenticated users
        await loadPersonalizedRecommendations();
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setReviews([]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setIsAuthenticated(false);
      setUser(null);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    // Also reload recommendations on refresh for authenticated users
    if (isAuthenticated) {
      await loadPersonalizedRecommendations();
    }
    setRefreshing(false);
  };

  const handleLogout = () => {
    showConfirm(
      'Sign Out',
      'Are you sure you want to sign out?',
      async () => {
        await logout();
        // Clear all cached data on logout
        await cacheService.clearUserProfile();
        await cacheService.clearHomeData();
        console.log('Cache cleared on logout');
        
        setIsAuthenticated(false);
        setUser(null);
        setReviews([]);
        router.replace('/auth/login' as any);
      }
    );
  };

  const handleLogin = () => {
    router.push('/auth/login' as any);
  };

  const showThemeSelector = () => {
    showAlert({
      title: 'Select Theme',
      message: 'Choose your preferred theme for the app',
      type: 'info',
      buttons: [
        {
          text: `Light ${themePreference === 'light' ? '✓' : ''}`,
          onPress: () => setThemePreference('light'),
          style: 'default',
        },
        {
          text: `Dark ${themePreference === 'dark' ? '✓' : ''}`,
          onPress: () => setThemePreference('dark'),
          style: 'default',
        },
        {
          text: `Auto ${themePreference === 'auto' ? '✓' : ''}`,
          onPress: () => setThemePreference('auto'),
          style: 'default',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
    });
  };

  // Ensure user_level exists, fallback to guestUser.user_level if not
  const currentUser = user ? {
    ...user,
    user_level: user.user_level || guestUser.user_level
  } : guestUser;

  const settingsData: SettingItem[] = [
    ...(isAuthenticated ? [
      {
        id: 'edit-profile',
        title: 'Edit Profile',
        subtitle: 'Update your personal information',
        icon: 'person-outline',
        type: 'navigation' as const,
        onPress: () => setShowEditModal(true),
      },
      {
        id: 'reviews',
        title: 'My Reviews',
        subtitle: `View and manage your ${reviews.length} reviews`,
        icon: 'star-outline',
        type: 'navigation' as const,
        onPress: () => router.push('/reviews' as any),
      },
    ] : []),
    {
      id: 'notifications',
      title: 'Push Notifications',
      subtitle: 'Receive updates about new businesses',
      icon: 'notifications-outline',
      type: 'toggle' as const,
      value: notificationsEnabled,
      onToggle: setNotificationsEnabled,
    },
    {
      id: 'location',
      title: 'Location Services',
      subtitle: 'Allow app to access your location',
      icon: 'location-outline',
      type: 'toggle' as const,
      value: locationEnabled,
      onToggle: setLocationEnabled,
    },
    {
      id: 'theme',
      title: 'Theme',
      subtitle: themePreference === 'auto' ? 'Auto (follows system)' : themePreference === 'dark' ? 'Dark' : 'Light',
      icon: themePreference === 'auto' ? 'phone-portrait-outline' : themePreference === 'dark' ? 'moon-outline' : 'sunny-outline',
      type: 'navigation' as const,
      onPress: () => showThemeSelector(),
    },
    {
      id: 'privacy',
      title: 'Privacy Settings',
      subtitle: 'Manage your privacy preferences',
      icon: 'shield-outline',
      type: 'navigation' as const,
      onPress: () => console.log('Privacy Settings'),
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help or contact support',
      icon: 'help-circle-outline',
      type: 'navigation' as const,
      onPress: () => console.log('Help & Support'),
    },
    {
      id: 'about',
      title: 'About App',
      subtitle: 'Version 1.0.0',
      icon: 'information-circle-outline',
      type: 'navigation' as const,
      onPress: () => console.log('About App'),
    },
    ...(isAuthenticated ? [
      {
        id: 'logout',
        title: 'Sign Out',
        icon: 'log-out-outline',
        type: 'action' as const,
        color: '#FF5722',
        onPress: handleLogout,
      },
    ] : [
      {
        id: 'login',
        title: 'Sign In',
        subtitle: 'Sign in to access all features',
        icon: 'log-in-outline',
        type: 'action' as const,
        color: colors.tint,
        onPress: handleLogin,
      },
    ]),
  ];

  const renderSettingItem = (item: SettingItem) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.settingItem, { backgroundColor: colors.card }]}
        onPress={item.onPress}
        disabled={item.type === 'toggle'}
      >
        <View style={styles.settingContent}>
          <View style={[styles.settingIcon, { backgroundColor: (item.color || colors.tint) + '20' }]}>
            <Ionicons
              name={item.icon as any}
              size={24}
              color={item.color || colors.tint}
            />
          </View>
          <View style={styles.settingText}>
            <Text style={[styles.settingTitle, { color: item.color || colors.text }]}>
              {item.title}
            </Text>
            {item.subtitle && (
              <Text style={[styles.settingSubtitle, { color: colors.icon }]}>
                {item.subtitle}
              </Text>
            )}
          </View>
        </View>
        {item.type === 'toggle' ? (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: colors.icon + '30', true: colors.tint + '30' }}
            thumbColor={item.value ? colors.tint : colors.icon}
          />
        ) : item.type === 'navigation' ? (
          <Ionicons name="chevron-forward" size={20} color={colors.icon} />
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'light'} />
      {loading ? (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <StatusBar style="light" />
          {/* Fixed Header */}
          <LinearGradient
            colors={[colors.headerGradientStart, colors.headerGradientEnd]}
            style={styles.header}
          >
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>Profile</Text>
            </View>
          </LinearGradient>
          <ProfilePageSkeleton colors={colors} />
        </View>
      ) : (
        <>
          {/* Fixed Header */}
          <LinearGradient
            colors={[colors.headerGradientStart, colors.headerGradientEnd]}
            style={styles.header}
          >
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>Profile</Text>
              {isAuthenticated && (
                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={() => setShowEditModal(true)}
                >
                  <Ionicons name="create-outline" size={24} color="white" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.profileSection}>
              <ProfileAvatar
                profileImage={currentUser.profile_image}
                userName={currentUser.name}
                size={60}
                seed={currentUser.email || currentUser.name}
                style={styles.profileImage}
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{currentUser.name}</Text>
                {currentUser.email && (
                  <Text style={styles.userEmail}>{currentUser.email}</Text>
                )}
                <View style={styles.userStats}>
                  <Text style={styles.userLevel}>{currentUser.user_level?.level_name || 'Guest'}</Text>
                  {isAuthenticated && (
                    <Text style={styles.userJoinDate}>
                      {currentUser.total_points} points
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Scrollable Content */}
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.tint]}
                tintColor={colors.tint}
              />
            }
          >

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Ionicons name="star" size={24} color="#FFD700" />
              <Text style={[styles.statNumber, { color: colors.text }]}>{currentUser.total_reviews}</Text>
              <Text style={[styles.statLabel, { color: colors.icon }]}>Reviews</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Ionicons name="heart" size={24} color="#FF6B6B" />
              <Text style={[styles.statNumber, { color: colors.text }]}>{currentUser.total_favorites}</Text>
              <Text style={[styles.statLabel, { color: colors.icon }]}>Favourites</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Ionicons name="trophy" size={24} color="#4CAF50" />
              <Text style={[styles.statNumber, { color: colors.text }]}>{currentUser.total_points}</Text>
              <Text style={[styles.statLabel, { color: colors.icon }]}>Points</Text>
            </View>
          </View>

          {/* User Level Progress (Only for authenticated users) */}
          {isAuthenticated && user && user.user_level && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Level Progress</Text>
              <View style={[styles.levelCard, { backgroundColor: colors.card }]}>
                <View style={styles.levelHeader}>
                  <Text style={[styles.levelName, { color: colors.text }]}>
                    {user.user_level.level_name}
                  </Text>
                  <Text style={[styles.levelDescription, { color: colors.icon }]}>
                    {user.user_level.level_description}
                  </Text>
                </View>
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { backgroundColor: colors.icon + '20' }]}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          backgroundColor: colors.tint,
                          width: `${user.user_level.progress_to_next_level}%`
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.progressText, { color: colors.icon }]}>
                    {user.user_level.progress_to_next_level.toFixed(1)}% to next level
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Personalized Recommendations (Only for authenticated users) */}
          {isAuthenticated && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Taste</Text>
                <TouchableOpacity onPress={() => router.push('/ai-recommendations' as any)}>
                  <Text style={[styles.seeAllText, { color: colors.tint }]}>See All</Text>
                </TouchableOpacity>
              </View>
              
              {recommendationsLoading ? (
                <View style={styles.recommendationsLoading}>
                  <ActivityIndicator size="small" color={colors.tint} />
                  <Text style={[styles.loadingText, { color: colors.icon }]}>
                    Personalizing recommendations...
                  </Text>
                </View>
              ) : personalizedRecommendations.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.recommendationsContainer}>
                    {personalizedRecommendations.slice(0, 4).map((business: any) => (
                      <TouchableOpacity 
                        key={business.id} 
                        style={[styles.recommendationCard, { backgroundColor: colors.card }]}
                        onPress={() => router.push(`/business/${business.id}` as any)}
                      >
                        <View style={styles.businessImageContainer}>
                          {renderBusinessImage(business)}
                        </View>
                        <View style={styles.businessInfo}>
                          <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={2}>
                            {business.business_name || business.name}
                          </Text>
                          <View style={styles.businessDetails}>
                            <View style={styles.ratingContainer}>
                              <Ionicons name="star" size={14} color="#FFD700" />
                              <Text style={[styles.ratingText, { color: colors.icon }]}>
                                {business.overall_rating || 'N/A'}
                              </Text>
                            </View>
                            <Text style={[styles.areaText, { color: colors.icon }]} numberOfLines={1}>
                              {business.area}
                            </Text>
                          </View>
                          {business.recommendation_reasons && business.recommendation_reasons.length > 0 && (
                            <Text style={[styles.recommendationReason, { color: colors.tint }]} numberOfLines={1}>
                              {business.recommendation_reasons[0]}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              ) : (
                <View style={styles.noRecommendations}>
                  <Ionicons name="bulb-outline" size={48} color={colors.icon} />
                  <Text style={[styles.noRecommendationsText, { color: colors.icon }]}>
                    Start reviewing businesses to get personalized recommendations
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Recent Reviews (Only for authenticated users with reviews) */}
          {isAuthenticated && reviews.length > 0 && (
            <View style={[styles.section, styles.reviewsSection]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Reviews</Text>
                <TouchableOpacity onPress={() => router.push('/reviews' as any)}>
                  <Text style={[styles.seeAllText, { color: colors.tint }]}>See All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.reviewsContainer}>
                  {reviews.slice(0, 3).map((review) => (
                    <View key={review.id} style={[styles.reviewCard, { backgroundColor: colors.card }]}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.ratingContainer}>
                          {[...Array(5)].map((_, i) => (
                            <Ionicons
                              key={i}
                              name={i < review.overall_rating ? "star" : "star-outline"}
                              size={16}
                              color="#FFD700"
                            />
                          ))}
                        </View>
                        <Text style={[styles.reviewDate, { color: colors.icon }]}>
                          {new Date(review.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text style={[styles.reviewText, { color: colors.text }]} numberOfLines={3}>
                        {review.review_text}
                      </Text>
                      <Text style={[styles.businessName, { color: colors.tint }]}>
                        {review.business?.business_name || review.offering?.business_name}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>
            <View style={styles.settingsContainer}>
              {settingsData.map(renderSettingItem)}
            </View>
          </View>

          {/* App Version */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.icon }]}>
              5str App v1.0.0
            </Text>
            <Text style={[styles.footerText, { color: colors.icon }]}>
              Made with ❤️ for local businesses
            </Text>
          </View>
        </ScrollView>
        </>
      )}

      {/* Edit Profile Modal */}
      {isAuthenticated && user && (
        <EditProfileModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          user={user}
          onUpdate={(updatedUser) => {
            setUser(updatedUser);
            // Reload the complete profile data to ensure everything is in sync
            loadUserData();
          }}
        />
      )}

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
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollViewContent: {
    paddingBottom: 100, // Add bottom padding to ensure content is not hidden behind tab bar
  },
  header: {
    paddingTop: 45,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    height: 168,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'white',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: 'white',
    opacity: 0.9,
    marginBottom: 4,
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userLevel: {
    fontSize: 12,
    color: 'white',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    fontWeight: '500',
  },
  userJoinDate: {
    fontSize: 11,
    color: 'white',
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginVertical: 8,
  },
  reviewsSection: {
    marginVertical: 8,
    marginBottom: 24, // More space at the bottom for better visibility
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  levelCard: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  levelHeader: {
    marginBottom: 12,
  },
  levelName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  levelDescription: {
    fontSize: 14,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  reviewsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 16,
  },
  reviewCard: {
    width: 200,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  businessName: {
    fontSize: 12,
    fontWeight: '600',
  },
  settingsContainer: {
    paddingHorizontal: 24,
    gap: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
  // Personalized Recommendations Styles
  recommendationsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 12,
  },
  recommendationsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 16,
  },
  recommendationCard: {
    width: 160,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  businessImageContainer: {
    height: 100,
    width: '100%',
  },
  businessImage: {
    width: '100%',
    height: '100%',
  },
  businessImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessInfo: {
    padding: 12,
  },
  businessDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  areaText: {
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },
  recommendationReason: {
    fontSize: 11,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  noRecommendations: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  noRecommendationsText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
});
