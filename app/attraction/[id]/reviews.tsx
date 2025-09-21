import CustomAlert from '@/components/CustomAlert';
import { SimpleReviewsSkeleton } from '@/components/SkeletonLoader';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useToastGlobal } from '@/contexts/ToastContext';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import {
    getAttractionReviews,
    isAuthenticated,
    voteAttractionReviewHelpful,
    voteAttractionReviewNotHelpful
} from '@/services/api';
import { AttractionReview } from '@/types/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import {
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function AttractionReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { showSuccess, showError } = useToastGlobal();
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();

  // State
  const [reviews, setReviews] = useState<AttractionReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [votingReviewId, setVotingReviewId] = useState<number | null>(null);

  // Load reviews data
  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchReviews();
        checkAuthentication();
      }
    }, [id])
  );

  const checkAuthentication = async () => {
    try {
      const authStatus = await isAuthenticated();
      setIsUserAuthenticated(authStatus);
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsUserAuthenticated(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await getAttractionReviews(parseInt(id as string), 1, 50, 'helpful');
      
      if (response.success) {
        setReviews(response.data.data);
      } else {
        showError('Failed to load reviews');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      showError('Network error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleWriteReview = async () => {
    if (!isUserAuthenticated) {
      showAlert({
        type: 'info',
        title: 'Sign Up to Write Reviews',
        message: 'Create an account to share your experiences and help other travelers',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Up', onPress: () => router.push('/welcome' as any) }
        ]
      });
      return;
    }
    router.push(`/attraction/${id}/write-review`);
  };

  const handleReviewVote = async (reviewId: number, isHelpful: boolean) => {
    if (!isUserAuthenticated) {
      showAlert({
        type: 'info',
        title: 'Sign Up to Vote',
        message: 'Create an account to help other travelers by voting on reviews',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Up', onPress: () => router.push('/welcome' as any) }
        ]
      });
      return;
    }

    try {
      setVotingReviewId(reviewId);
      
      // Find the current review to check existing vote
      const currentReview = reviews.find(review => review.id === reviewId);
      if (!currentReview) return;

      // Check if user is clicking the same vote they already made (to remove it)
      const isRemovingVote = (isHelpful && currentReview.user_vote_status?.is_upvoted) || 
                             (!isHelpful && currentReview.user_vote_status?.is_downvoted);
      
      const voteFunction = isHelpful ? voteAttractionReviewHelpful : voteAttractionReviewNotHelpful;
      const response = await voteFunction(parseInt(id as string), reviewId);
      
      // Check if the API response indicates success
      if (response.success === false) {
        // API returned an error (like "You cannot vote on your own review")
        console.log('Vote failed - API returned success: false');
        console.log('Showing error toast:', response.message);
        showError(response.message || 'Failed to vote on review');
        return;
      }
      
      // Update the review in the local state
      setReviews(prevReviews =>
        prevReviews.map(review =>
          review.id === reviewId
            ? {
                ...review,
                helpful_votes: response.data?.helpful_votes || review.helpful_votes || 0,
                total_votes: response.data?.total_votes || review.total_votes || 0,
                helpful_percentage: response.data?.helpful_percentage || review.helpful_percentage || 0,
                // Update vote status using new structure
                user_vote_status: isRemovingVote 
                  ? { has_voted: false, is_upvoted: false, is_downvoted: false, vote_details: null }
                  : { 
                      has_voted: true, 
                      is_upvoted: isHelpful, 
                      is_downvoted: !isHelpful, 
                      vote_details: null 
                    }
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
      
      // Log the helpful percentage for popular badge calculation
      const helpfulPercentage = ((response.data?.helpful_votes || 0) / (response.data?.total_votes || 1)) * 100;
      console.log(`Review ${reviewId} helpful percentage: ${helpfulPercentage.toFixed(1)}%`);
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews();
  };

  if (loading && reviews.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} translucent={false} />
        <SimpleReviewsSkeleton colors={colors} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} translucent={false} />
      <CustomAlert {...alertConfig} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Reviews ({reviews.length})
        </Text>
        <TouchableOpacity onPress={handleWriteReview}>
          <Ionicons name="add-circle-outline" size={24} color={colors.tint} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {reviews && reviews.length > 0 ? (
          reviews.map((review) => (
            <View key={review.id} style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewUserInfo}>
                  <Text style={[styles.reviewUserName, { color: colors.text }]}>{review.user.name}</Text>
                  <View style={styles.reviewRating}>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons
                        key={i}
                        name="star"
                        size={12}
                        color={i < parseFloat(review.rating) ? "#FFD700" : colors.icon}
                      />
                    ))}
                    <Text style={[styles.reviewRatingText, { color: colors.text }]}>
                      {parseFloat(review.rating).toFixed(1)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.reviewTime, { color: colors.icon }]}>{review.time_ago}</Text>
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
                  {review.experience_tags.map((tag, index) => (
                    <View key={index} style={[styles.reviewTag, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}>
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
                      backgroundColor: review.user_vote_status?.is_upvoted ? colors.tint + '15' : 'transparent'
                    }
                  ]}
                  onPress={() => handleReviewVote(review.id, true)}
                  disabled={votingReviewId === review.id}
                >
                  <Ionicons 
                    name={votingReviewId === review.id ? "hourglass-outline" : "thumbs-up"}
                    size={16} 
                    color={review.user_vote_status?.is_upvoted ? colors.tint : colors.icon} 
                  />
                  <Text style={[
                    styles.reviewVoteText, 
                    { color: review.user_vote_status?.is_upvoted ? colors.tint : colors.icon }
                  ]}>
                    {votingReviewId === review.id ? 'Voting...' : `Helpful (${review.helpful_votes || 0})`}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.reviewVoteButton, 
                    { 
                      opacity: votingReviewId === review.id ? 0.6 : 1,
                      backgroundColor: review.user_vote_status?.is_downvoted ? colors.tint + '15' : 'transparent'
                    }
                  ]}
                  onPress={() => handleReviewVote(review.id, false)}
                  disabled={votingReviewId === review.id}
                >
                  <Ionicons 
                    name={votingReviewId === review.id ? "hourglass-outline" : "thumbs-down"}
                    size={16} 
                    color={review.user_vote_status?.is_downvoted ? colors.tint : colors.icon} 
                  />
                  <Text style={[
                    styles.reviewVoteText, 
                    { color: review.user_vote_status?.is_downvoted ? colors.tint : colors.icon }
                  ]}>
                    {votingReviewId === review.id ? 'Voting...' : `Not Helpful (${Math.max(0, (review.total_votes || 0) - (review.helpful_votes || 0))})`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noReviewsContainer}>
            <Ionicons name="chatbubble-outline" size={48} color={colors.icon} />
            <Text style={[styles.noReviewsTitle, { color: colors.text }]}>No reviews yet</Text>
            <Text style={[styles.noReviewsText, { color: colors.icon }]}>
              Be the first to share your experience!
            </Text>
            <TouchableOpacity 
              style={[styles.firstReviewButton, { backgroundColor: colors.tint }]}
              onPress={handleWriteReview}
            >
              <Text style={styles.firstReviewButtonText}>Write First Review</Text>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  reviewCard: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
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
    gap: 2,
  },
  reviewRatingText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  reviewTime: {
    fontSize: 12,
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
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  reviewTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reviewTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  reviewVoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewVoteText: {
    fontSize: 13,
    fontWeight: '500',
  },
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  noReviewsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  noReviewsText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  firstReviewButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  firstReviewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});