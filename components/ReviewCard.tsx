import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/CustomAlert';
import { Review, voteReview, removeVote, getAuthToken } from '@/services/api';
import { useRouter } from 'expo-router';

interface ReviewCardProps {
  review: Review;
  onVoteUpdate?: (reviewId: number, newHelpfulCount: number, newNotHelpfulCount: number, userVoteStatus: any) => void;
  flat?: boolean; // New prop to control card styling
}

export default function ReviewCard({ review, onVoteUpdate, flat = false }: ReviewCardProps) {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();
  const [isVoting, setIsVoting] = useState(false);
  const [localReview, setLocalReview] = useState(review);

  // Update local state when review prop changes
  React.useEffect(() => {
    setLocalReview(review);
  }, [review]);

  const handleVote = async (isHelpful: boolean) => {
    try {
      // Check if user is authenticated
      const token = await getAuthToken();
      if (!token) {
        showAlert({
          type: 'info',
          title: 'Sign Up to Vote',
          message: 'Create an account to vote on reviews and help others discover great places',
          buttons: [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Up', onPress: () => router.push('/welcome' as any) }
          ]
        });
        return;
      }

      setIsVoting(true);

      // Optimistic UI update for immediate feedback
      const currentHasVoted = localReview.user_vote_status?.has_voted;
      const currentUserVote = localReview.user_vote_status?.user_vote;
      let newHelpfulCount = localReview.helpful_count;
      let newNotHelpfulCount = localReview.not_helpful_count || 0;
      let newUserVoteStatus = { has_voted: true, user_vote: isHelpful };

      // Calculate the expected count changes
      if (currentHasVoted && currentUserVote === isHelpful) {
        // Removing vote
        if (isHelpful) {
          newHelpfulCount = Math.max(0, newHelpfulCount - 1);
        } else {
          newNotHelpfulCount = Math.max(0, newNotHelpfulCount - 1);
        }
        newUserVoteStatus = { has_voted: false, user_vote: false };
      } else if (currentHasVoted && currentUserVote !== isHelpful) {
        // Changing vote
        if (currentUserVote) {
          newHelpfulCount = Math.max(0, newHelpfulCount - 1);
        } else {
          newNotHelpfulCount = Math.max(0, newNotHelpfulCount - 1);
        }
        if (isHelpful) {
          newHelpfulCount += 1;
        } else {
          newNotHelpfulCount += 1;
        }
      } else {
        // Adding new vote
        if (isHelpful) {
          newHelpfulCount += 1;
        } else {
          newNotHelpfulCount += 1;
        }
      }

      // Update local state immediately
      setLocalReview(prev => ({
        ...prev,
        helpful_count: newHelpfulCount,
        not_helpful_count: newNotHelpfulCount,
        user_vote_status: newUserVoteStatus
      }));

      let response;
      
      // If user has already voted and clicking the same vote, remove vote
      if (review.user_vote_status?.has_voted && review.user_vote_status.user_vote === isHelpful) {
        response = await removeVote(review.id);
      } else {
        // Vote or change vote
        response = await voteReview(review.id, isHelpful);
      }

      if (response.success && response.data) {
        // Update parent component with server response
        onVoteUpdate?.(
          review.id, 
          response.data.helpful_count, 
          response.data.not_helpful_count || 0, // Fallback to 0 if not provided
          response.data.user_vote_status
        );
      } else {
        // Revert optimistic update on error
        setLocalReview(review);
        showAlert({
          type: 'error',
          title: 'Vote Failed',
          message: response.message || 'Failed to vote',
          buttons: [{ text: 'OK' }]
        });
      }
    } catch (error) {
      console.error('Error voting:', error);
      // Revert optimistic update on error
      setLocalReview(review);
      showAlert({
        type: 'error',
        title: 'Vote Failed',
        message: 'Failed to vote. Please try again.',
        buttons: [{ text: 'OK' }]
      });
    } finally {
      setIsVoting(false);
    }
  };

  const handleLoginPrompt = () => {
    showAlert({
      type: 'info',
      title: 'Sign Up to Vote',
      message: 'Create an account to vote on reviews and help others discover great places',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Up', onPress: () => router.push('/welcome' as any) }
      ]
    });
  };

  return (
    <View style={[
      flat ? styles.reviewCardFlat : styles.reviewCard, 
      { 
        backgroundColor: colorScheme === 'dark' ? '#1f2937' : colors.card, 
        borderColor: colors.border
      }
    ]}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewUser}>
          <View style={[styles.userAvatar, { backgroundColor: colors.buttonPrimary }]}>
            <Text style={styles.userInitial}>
              {localReview.user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.reviewUserInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{localReview.user.name}</Text>
            <Text style={[styles.reviewDate, { color: colors.icon }]}>
              {new Date(localReview.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </Text>
          </View>
        </View>
        <View style={styles.reviewRatingContainer}>
          <View style={styles.reviewRating}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name="star"
                size={14}
                color={star <= localReview.overall_rating ? '#FFD700' : colors.icon}
              />
            ))}
          </View>
          <Text style={[styles.reviewRatingText, { color: colors.text }]}>
            {localReview.overall_rating}/5
          </Text>
        </View>
      </View>
      
      <Text style={[styles.reviewText, { color: colors.text }]}>{localReview.review_text}</Text>
      
      {/* Voting Section */}
      <View style={styles.reviewFooter}>
        <View style={styles.voteContainer}>
          <TouchableOpacity 
            style={[
              styles.voteButton,
              localReview.user_vote_status?.has_voted && localReview.user_vote_status.user_vote === true && styles.voteButtonActive,
              { borderColor: colors.icon + '30' }
            ]}
            onPress={() => handleVote(true)}
            disabled={isVoting}
          >
            <Ionicons 
              name="thumbs-up" 
              size={16} 
              color={
                localReview.user_vote_status?.has_voted && localReview.user_vote_status.user_vote === true 
                  ? colors.buttonPrimary 
                  : colors.icon
              } 
            />
            <Text style={[
              styles.voteText, 
              { 
                color: localReview.user_vote_status?.has_voted && localReview.user_vote_status.user_vote === true 
                  ? colors.buttonPrimary 
                  : colors.icon 
              }
            ]}>
              {localReview.helpful_count}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.voteButton,
              localReview.user_vote_status?.has_voted && localReview.user_vote_status.user_vote === false && styles.voteButtonActive,
              { borderColor: colors.icon + '30' }
            ]}
            onPress={() => handleVote(false)}
            disabled={isVoting}
          >
            <Ionicons 
              name="thumbs-down" 
              size={16} 
              color={
                localReview.user_vote_status?.has_voted && localReview.user_vote_status.user_vote === false 
                  ? '#FF6B6B' 
                  : colors.icon
              } 
            />
            <Text style={[
              styles.voteText, 
              { 
                color: localReview.user_vote_status?.has_voted && localReview.user_vote_status.user_vote === false 
                  ? '#FF6B6B' 
                  : colors.icon 
              }
            ]}>
              {localReview.not_helpful_count || 0}
            </Text>
          </TouchableOpacity>
        </View>
        
        {localReview.helpful_count > 0 && (
          <Text style={[styles.helpfulSummary, { color: colors.icon }]}>
            {localReview.helpful_count} {localReview.helpful_count === 1 ? 'person found' : 'people found'} this helpful
          </Text>
        )}
      </View>

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
  reviewCard: {
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  reviewCardFlat: {
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 0,
    borderRadius: 8,
    borderWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInitial: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewUserInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
  },
  reviewRatingContainer: {
    alignItems: 'flex-end',
  },
  reviewRating: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  reviewRatingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  reviewFooter: {
    gap: 12,
  },
  voteContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 60,
    justifyContent: 'center',
  },
  voteButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  voteText: {
    fontSize: 12,
    fontWeight: '500',
  },
  helpfulSummary: {
    fontSize: 12,
    textAlign: 'center',
  },
});
