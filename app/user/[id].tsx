import { ProfilePageSkeleton } from '@/components/SkeletonLoader';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { getPublicUserProfile, PublicUserProfileResponse } from '@/services/api';
import { getImageUrl } from '@/utils/imageUtils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

export default function PublicUserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  const [profile, setProfile] = useState<PublicUserProfileResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) {
      loadProfile();
    }
  }, [id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await getPublicUserProfile(parseInt(id as string));
      if (response.success) {
        setProfile(response.data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        <LinearGradient
          colors={[colors.headerGradientStart, colors.headerGradientEnd]}
          style={styles.heroHeader}
        >
          <View style={styles.heroTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.heroTitle}>Profile</Text>
            <View style={{ width: 44 }} />
          </View>
        </LinearGradient>
        <ProfilePageSkeleton colors={colors} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        <LinearGradient
          colors={[colors.headerGradientStart, colors.headerGradientEnd]}
          style={styles.heroHeader}
        >
          <View style={styles.heroTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.heroTitle}>Profile</Text>
            <View style={{ width: 44 }} />
          </View>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Ionicons name="person-circle-outline" size={80} color={colors.icon} />
          <Text style={[styles.errorText, { color: colors.text }]}>Profile not found</Text>
          <TouchableOpacity 
            style={[styles.errorButton, { backgroundColor: colors.tint }]}
            onPress={() => router.back()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      {/* Hero Header with Gradient */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={styles.heroHeader}
      >
        <View style={styles.heroTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Profile</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ 
                uri: getImageUrl(profile.profile.profile_image) 
              }}
              style={styles.profileImage}
              defaultSource={require('@/assets/images/icon.png')}
            />
            {profile.profile.is_verified_reviewer && (
              <View style={[styles.verifiedBadge, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="checkmark-circle" size={12} color="white" />
              </View>
            )}
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{profile.profile.name}</Text>
            <View style={styles.userMetaRow}>
              <Text style={styles.userLocation}>
                <Ionicons name="location" size={12} color="white" /> {profile.profile.city}
              </Text>
              <Text style={styles.userMemberSince}>
                Member since {profile.profile.member_since}
              </Text>
            </View>
            {/* User Level Badge */}
            {profile.profile.user_level && (
              <View style={styles.userBadges}>
                <View style={[styles.levelBadge, { 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                }]}>
                  <Text style={{ fontSize: 12 }}>{profile.profile.user_level.icon}</Text>
                  <Text style={styles.levelBadgeText}>
                    {profile.profile.user_level.title}
                  </Text>
                </View>
                <View style={styles.pointsBadge}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.pointsBadgeText}>
                    {profile.profile.total_points || 0}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIconCircle, { backgroundColor: '#4CAF50' + '20' }]}>
              <Ionicons name="chatbubbles" size={24} color="#4CAF50" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{profile.statistics.total_reviews}</Text>
            <Text style={[styles.statLabel, { color: colors.icon }]}>Reviews</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIconCircle, { backgroundColor: colors.tint + '20' }]}>
              <Ionicons name="shield-checkmark" size={24} color={colors.tint} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{profile.profile.trust_level}</Text>
            <Text style={[styles.statLabel, { color: colors.icon }]}>Trust Level</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIconCircle, { backgroundColor: '#FFD700' + '20' }]}>
              <Ionicons name="star" size={24} color="#FFD700" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {profile.profile.total_points || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.icon }]}>Points</Text>
          </View>
        </View>

        {/* Achievements */}
        {profile.profile.achievements && profile.profile.achievements.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Achievements</Text>
            <View style={styles.achievementsGrid}>
              {profile.profile.achievements.map((achievement, index) => (
                <View key={index} style={[styles.achievementItem, { backgroundColor: colors.background }]}>
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <Text style={[styles.achievementName, { color: colors.text }]}>{achievement.name}</Text>
                  <Text style={[styles.achievementDesc, { color: colors.icon }]}>{achievement.description}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Statistics */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Statistics</Text>
          <View style={styles.statsList}>
            <View style={styles.statsListItem}>
              <Text style={[styles.statsLabel, { color: colors.icon }]}>Businesses Reviewed</Text>
              <Text style={[styles.statsValue, { color: colors.text }]}>{profile.statistics.total_businesses_reviewed}</Text>
            </View>
            <View style={styles.statsListItem}>
              <Text style={[styles.statsLabel, { color: colors.icon }]}>Offerings Reviewed</Text>
              <Text style={[styles.statsValue, { color: colors.text }]}>{profile.statistics.total_offerings_reviewed}</Text>
            </View>
            <View style={styles.statsListItem}>
              <Text style={[styles.statsLabel, { color: colors.icon }]}>Helpful Votes Received</Text>
              <Text style={[styles.statsValue, { color: colors.text }]}>{profile.statistics.total_helpful_votes_received}</Text>
            </View>
            <View style={styles.statsListItem}>
              <Text style={[styles.statsLabel, { color: colors.icon }]}>Average Rating Given</Text>
              <Text style={[styles.statsValue, { color: colors.text }]}>{profile.statistics.average_rating_given.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        {/* Recent Reviews */}
        {profile.recent_reviews && profile.recent_reviews.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Reviews</Text>
            {profile.recent_reviews.map((review) => (
              <TouchableOpacity
                key={review.id}
                style={[styles.reviewItem, { backgroundColor: colors.background }]}
                onPress={() => router.push(`/reviews/${review.id}` as any)}
              >
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewRating}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name="star"
                        size={12}
                        color={star <= review.overall_rating ? '#FFD700' : colors.icon}
                      />
                    ))}
                  </View>
                  <Text style={[styles.reviewDate, { color: colors.icon }]}>{review.created_at}</Text>
                </View>
                {review.title && (
                  <Text style={[styles.reviewTitle, { color: colors.text }]}>{review.title}</Text>
                )}
                <Text style={[styles.reviewText, { color: colors.text }]} numberOfLines={3}>
                  {review.review_text}
                </Text>
                {review.business && (
                  <Text style={[styles.reviewBusiness, { color: colors.tint }]}>
                    {review.business.name}
                  </Text>
                )}
                {review.offering && (
                  <Text style={[styles.reviewBusiness, { color: colors.tint }]}>
                    {review.offering.name} • {review.offering.business_name}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Collections */}
        {profile.recent_collections && profile.recent_collections.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Public Collections</Text>
            {profile.recent_collections.map((collection) => (
              <TouchableOpacity
                key={collection.id}
                style={[styles.collectionItem, { backgroundColor: colors.background }]}
                onPress={() => router.push(`/collection/${collection.id}` as any)}
              >
                <View style={styles.collectionHeader}>
                  <Text style={[styles.collectionName, { color: colors.text }]}>{collection.name}</Text>
                  {collection.is_featured && (
                    <View style={[styles.featuredBadge, { backgroundColor: colors.tint + '20' }]}>
                      <Ionicons name="star" size={12} color={colors.tint} />
                      <Text style={[styles.featuredText, { color: colors.tint }]}>Featured</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.collectionDesc, { color: colors.icon }]}>{collection.description}</Text>
                <View style={styles.collectionFooter}>
                  <Text style={[styles.collectionCount, { color: colors.icon }]}>
                    {collection.businesses_count} businesses
                  </Text>
                  <Text style={[styles.collectionUpdated, { color: colors.icon }]}>
                    Updated {collection.updated_at}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
  },
  errorButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  errorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  heroHeader: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'white',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  userLocation: {
    fontSize: 13,
    color: 'white',
    opacity: 0.9,
  },
  userMemberSince: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
  },
  userBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  levelBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  pointsBadgeText: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  statIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementItem: {
    width: (width - 60) / 2,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  achievementIcon: {
    fontSize: 40,
  },
  achievementName: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  achievementDesc: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
  statsList: {
    gap: 16,
  },
  statsListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  statsLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  statsValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  reviewItem: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 3,
  },
  reviewDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    opacity: 0.8,
  },
  reviewBusiness: {
    fontSize: 14,
    fontWeight: '600',
  },
  collectionItem: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  collectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  featuredText: {
    fontSize: 11,
    fontWeight: '700',
  },
  collectionDesc: {
    fontSize: 14,
    marginBottom: 12,
    opacity: 0.7,
  },
  collectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  collectionCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  collectionUpdated: {
    fontSize: 12,
    opacity: 0.6,
  },
});
