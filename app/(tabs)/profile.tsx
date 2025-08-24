import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';
import {
    getAuthToken,
    getUserProfile,
    getUserReviews,
    logout,
    Review,
    User,
    updateProfile,
    UpdateProfilePayload
} from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import EditProfileModal from '@/components/EditProfileModal';

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
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      
      if (token) {
        setIsAuthenticated(true);
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
        }
        
        if (reviewsResponse.success) {
          setReviews(reviewsResponse.data.reviews);
        }
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
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            setIsAuthenticated(false);
            setUser(null);
            setReviews([]);
            router.replace('/auth/login' as any);
          },
        },
      ]
    );
  };

  const handleLogin = () => {
    router.push('/auth/login' as any);
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
      id: 'dark-mode',
      title: 'Dark Mode',
      subtitle: 'Switch to dark theme',
      icon: 'moon-outline',
      type: 'toggle' as const,
      value: darkModeEnabled,
      onToggle: setDarkModeEnabled,
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
        style={[styles.settingItem, { backgroundColor: colors.background }]}
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
      <StatusBar style="light" />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading profile...</Text>
        </View>
      ) : (
        <>
          {/* Fixed Header */}
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
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
              <Image 
                source={{ 
                  uri: getImageUrl(currentUser.profile_image) || getFallbackImageUrl('user')
                }}
                style={styles.profileImage}
                defaultSource={{ uri: getFallbackImageUrl('user') }}
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
            <View style={[styles.statCard, { backgroundColor: colors.background }]}>
              <Ionicons name="star" size={24} color="#FFD700" />
              <Text style={[styles.statNumber, { color: colors.text }]}>{currentUser.total_reviews}</Text>
              <Text style={[styles.statLabel, { color: colors.icon }]}>Reviews</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.background }]}>
              <Ionicons name="heart" size={24} color="#FF6B6B" />
              <Text style={[styles.statNumber, { color: colors.text }]}>{currentUser.total_favorites}</Text>
              <Text style={[styles.statLabel, { color: colors.icon }]}>Favourites</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.background }]}>
              <Ionicons name="trophy" size={24} color="#4CAF50" />
              <Text style={[styles.statNumber, { color: colors.text }]}>{currentUser.total_points}</Text>
              <Text style={[styles.statLabel, { color: colors.icon }]}>Points</Text>
            </View>
          </View>

          {/* User Level Progress (Only for authenticated users) */}
          {isAuthenticated && user && user.user_level && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Level Progress</Text>
              <View style={[styles.levelCard, { backgroundColor: colors.background }]}>
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
                    <View key={review.id} style={[styles.reviewCard, { backgroundColor: colors.background }]}>
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
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 24,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    borderWidth: 3,
    borderColor: 'white',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    borderWidth: 3,
    borderColor: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginBottom: 8,
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  userLevel: {
    fontSize: 14,
    color: 'white',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '500',
  },
  userJoinDate: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
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
    marginVertical: 12,
  },
  reviewsSection: {
    marginVertical: 12,
    marginBottom: 32, // More space at the bottom for better visibility
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  levelCard: {
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  levelHeader: {
    marginBottom: 16,
  },
  levelName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
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
});
