import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useTheme } from '../../../contexts/ThemeContext';
import { useToastGlobal } from '../../../contexts/ToastContext';
import { useCustomAlert } from '../../../hooks/useCustomAlert';
import {
    getAttractionDetails,
    getAttractionReviews,
    isAuthenticated,
    voteAttractionReviewHelpful,
    voteAttractionReviewNotHelpful
} from '../../../services/api';
import { AttractionDetailResponse, AttractionReview } from '../../../types/api';

const { width } = Dimensions.get('window');

export default function AllReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { showSuccess, showError } = useToastGlobal();
  const { showAlert, hideAlert } = useCustomAlert();

  const [attraction, setAttraction] = useState<AttractionDetailResponse | null>(null);
  const [reviews, setReviews] = useState<AttractionReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [votingReviewId, setVotingReviewId] = useState<number | null>(null);

  const fetchAttractionDetail = async () => {
    if (!id) return;
    
    try {
      const data = await getAttractionDetails(parseInt(id));
      console.log('Attraction data received:', JSON.stringify(data, null, 2));
      setAttraction(data);
    } catch (error: any) {
      console.error('Error fetching attraction detail:', error);
    }
  };

  const fetchReviews = async () => {
    if (!id) return;
    
    try {
      const reviewsData = await getAttractionReviews(parseInt(id));
      if (reviewsData && reviewsData.data && reviewsData.data.data) {
        // Filter out any invalid review objects
        const validReviews = reviewsData.data.data.filter((review: any) => 
          review && 
          typeof review === 'object' && 
          review.id && 
          review.user
        );
        setReviews(validReviews);
      } else {
        console.log('No reviews data received:', reviewsData);
        setReviews([]);
      }
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      if (error.response?.status === 401) {
        console.log('Reviews endpoint requires authentication, but continuing with empty reviews');
        setReviews([]);
      } else {
        setReviews([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const authStatus = await isAuthenticated();
      setIsUserAuthenticated(authStatus);
    } catch (error) {
      setIsUserAuthenticated(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      checkAuthStatus();
      fetchAttractionDetail();
      fetchReviews();
    }, [id])
  );

  const handleReviewVote = async (reviewId: number, isHelpful: boolean) => {
    if (!isUserAuthenticated) {
      showAlert({
        type: 'info',
        title: 'Sign In Required',
        message: 'Please sign in to vote on reviews and help other travelers',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/welcome' as any) }
        ]
      });
      return;
    }

    // Find the current review to check existing vote
    const currentReview = reviews.find(review => review.id === reviewId);
    if (!currentReview) return;

    // Check if user is clicking the same vote they already made (to remove it)
    const isRemovingVote = (isHelpful && currentReview.user_vote === 'helpful') || 
                           (!isHelpful && currentReview.user_vote === 'not_helpful');

    setVotingReviewId(reviewId);
    
    try {
      const response = isHelpful 
        ? await voteAttractionReviewHelpful(parseInt(id!), reviewId)
        : await voteAttractionReviewNotHelpful(parseInt(id!), reviewId);
      
      // Check if the API response indicates success
      if (response.success === false) {
        // API returned an error (like "You cannot vote on your own review")
        console.log('Vote failed - API returned success: false');
        console.log('Showing error toast:', response.message);
        showError(response.message || 'Failed to vote on review');
        return;
      }
      
      // Update the local review data
      setReviews(prevReviews =>
        prevReviews.filter(review => review && review.id).map(review =>
          review.id === reviewId
            ? {
                ...review,
                helpful_votes: response.data?.helpful_votes || review.helpful_votes || 0,
                total_votes: response.data?.total_votes || review.total_votes || 0,
                helpful_percentage: response.data?.helpful_percentage || review.helpful_percentage || 0,
                // Toggle vote logic: if clicking same vote, remove it; otherwise set new vote
                user_vote: isRemovingVote ? null : (isHelpful ? 'helpful' : 'not_helpful')
              }
            : review
        )
      );

      // Show appropriate success message
      if (isRemovingVote && response.message?.toLowerCase().includes('removed')) {
        showSuccess(response.message || 'Vote removed successfully!');
      } else {
        showSuccess(response.message || 'Vote recorded successfully!');
      }
      
    } catch (error: any) {
      console.error('Error voting on review:', error);
      
      // Show error message with actual API response
      const errorMessage = error.response?.data?.message || 'Failed to vote on review';
      console.log('Showing error toast:', errorMessage);
      showError(errorMessage);
      
    } finally {
      setVotingReviewId(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading reviews...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" backgroundColor="transparent" translucent={true} />
      
      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>All Reviews</Text>
            <Text style={styles.headerSubtitle}>{reviews.length} reviews</Text>
          </View>
          <TouchableOpacity 
            style={styles.writeButton}
            onPress={() => router.push(`/attraction/${id}/write-review` as any)}
          >
            <Ionicons name="add-circle" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Attraction Info Card */}

        {reviews.length > 0 ? (
          <View style={styles.reviewsList}>
            {reviews.filter(review => review && typeof review === 'object' && review.id).map((review) => (
              <View key={review.id} style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewUserInfo}>
                    <Text style={[styles.reviewUserName, { color: colors.text }]}>{review.user?.name || 'Anonymous'}</Text>
                    <View style={styles.reviewRating}>
                      {[...Array(5)].map((_, i) => {
                        const rating = review.rating ? parseFloat(review.rating.toString()) : 0;
                        const isValidRating = !isNaN(rating) && rating > 0;
                        return (
                          <Ionicons
                            key={i}
                            name="star"
                            size={14}
                            color={isValidRating && i < Math.floor(rating) ? "#FFD700" : colors.icon}
                          />
                        );
                      })}
                      <Text style={[styles.reviewRatingText, { color: colors.text }]}>
                        {(() => {
                          const rating = review.rating ? parseFloat(review.rating.toString()) : 0;
                          return !isNaN(rating) && rating > 0 ? rating.toFixed(1) : '0.0';
                        })()}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.reviewTime, { color: colors.icon }]}>{review.time_ago || ''}</Text>
                </View>

                {/* Popular Review Badge */}
                {(review.helpful_votes || 0) > 0 && (review.total_votes || 0) > 0 && 
                 ((review.helpful_votes || 0) / (review.total_votes || 0)) >= 0.75 && (
                  <View style={[styles.popularBadge, { backgroundColor: colors.tint + '20', borderColor: colors.tint }]}>
                    <Ionicons name="trophy" size={12} color={colors.tint} />
                    <Text style={[styles.popularBadgeText, { color: colors.tint }]}>Popular Review</Text>
                  </View>
                )}

                {review.title && (
                  <Text style={[styles.reviewTitle, { color: colors.text }]}>{review.title}</Text>
                )}
                
                <Text style={[styles.reviewComment, { color: colors.text }]}>{review.comment}</Text>
                
                {review.experience_tags && Array.isArray(review.experience_tags) && review.experience_tags.length > 0 && (
                  <View style={styles.reviewTags}>
                    {review.experience_tags.map((tag: string, index: number) => (
                      <View key={index} style={[styles.reviewTag, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <Text style={[styles.reviewTagText, { color: colors.icon }]}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
                
                <View style={styles.reviewActions}>
                  <TouchableOpacity
                    style={[
                      styles.reviewVoteButton, 
                      { 
                        opacity: votingReviewId === review.id ? 0.6 : 1,
                        backgroundColor: review.user_vote === 'helpful' ? colors.tint + '15' : 'transparent'
                      }
                    ]}
                    onPress={() => handleReviewVote(review.id, true)}
                    disabled={votingReviewId === review.id}
                  >
                    <Ionicons 
                      name={votingReviewId === review.id ? "hourglass-outline" : "thumbs-up"}
                      size={16} 
                      color={review.user_vote === 'helpful' ? colors.tint : colors.icon} 
                    />
                    <Text style={[
                      styles.reviewVoteText, 
                      { color: review.user_vote === 'helpful' ? colors.tint : colors.icon }
                    ]}>
                      {votingReviewId === review.id ? 'Voting...' : `Helpful (${review.helpful_votes || 0})`}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.reviewVoteButton, 
                      { 
                        opacity: votingReviewId === review.id ? 0.6 : 1,
                        backgroundColor: review.user_vote === 'not_helpful' ? colors.tint + '15' : 'transparent'
                      }
                    ]}
                    onPress={() => handleReviewVote(review.id, false)}
                    disabled={votingReviewId === review.id}
                  >
                    <Ionicons 
                      name={votingReviewId === review.id ? "hourglass-outline" : "thumbs-down"}
                      size={16} 
                      color={review.user_vote === 'not_helpful' ? colors.tint : colors.icon} 
                    />
                    <Text style={[
                      styles.reviewVoteText, 
                      { color: review.user_vote === 'not_helpful' ? colors.tint : colors.icon }
                    ]}>
                      {votingReviewId === review.id ? 'Voting...' : `Not Helpful (${Math.max(0, (review.total_votes || 0) - (review.helpful_votes || 0))})`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noReviewsContainer}>
            <Ionicons name="chatbubble-outline" size={48} color={colors.icon} />
            <Text style={[styles.noReviewsTitle, { color: colors.text }]}>No reviews yet</Text>
            <Text style={[styles.noReviewsMessage, { color: colors.icon }]}>
              Be the first to share your experience!
            </Text>
            <TouchableOpacity 
              style={[styles.writeFirstReviewButton, { backgroundColor: colors.tint }]}
              onPress={() => router.push(`/attraction/${id}/write-review` as any)}
            >
              <Text style={styles.writeFirstReviewText}>Write First Review</Text>
            </TouchableOpacity>
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
  header: {
    paddingTop: 80,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  writeButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  attractionInfo: {
    padding: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  attractionName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  ratingInfo: {
    alignItems: 'flex-start',
  },
  starRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  reviewCount: {
    fontSize: 14,
  },
  reviewsList: {
    paddingBottom: 20,
  },
  reviewCard: {
    padding: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewUserInfo: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewRatingText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  reviewTime: {
    fontSize: 12,
    fontWeight: '400',
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 8,
    gap: 4,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  reviewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  reviewTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  reviewTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 16,
  },
  reviewVoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  reviewVoteText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noReviewsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noReviewsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  noReviewsMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  writeFirstReviewButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  writeFirstReviewText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Card Styles
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});