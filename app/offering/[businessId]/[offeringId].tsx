import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
    getOfferingDetails,
    getOfferingReviews,
    isAuthenticated,
    Offering,
    Review
} from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import ReviewCard from '@/components/ReviewCard';

export default function OfferingDetailsScreen() {
  const [offering, setOffering] = useState<Offering | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const params = useLocalSearchParams();
  const businessId = parseInt(params.businessId as string);
  const offeringId = parseInt(params.offeringId as string);
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    if (businessId && offeringId) {
      loadOfferingData();
    }
  }, [businessId, offeringId]);

  const loadOfferingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load offering details
      const offeringResponse = await getOfferingDetails(businessId, offeringId);
      if (offeringResponse.success) {
        setOffering(offeringResponse.data);
      }

      // Load offering reviews
      const reviewsResponse = await getOfferingReviews(businessId, offeringId);
      if (reviewsResponse.success) {
        setReviews(reviewsResponse.data.reviews);
      }

    } catch (error) {
      console.error('Error loading offering data:', error);
      setError('Failed to load offering information');
    } finally {
      setLoading(false);
    }
  };

  const handleWriteReview = async () => {
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      Alert.alert(
        'Sign Up to Write Reviews',
        'Create an account to share your experience and help others discover great offerings',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Up', onPress: () => router.push('/welcome' as any) }
        ]
      );
      return;
    }

    // Navigate to write review screen
    router.push({
      pathname: '/reviews/write' as any,
      params: {
        type: 'offering',
        id: offeringId.toString(),
        offeringName: offering?.name || 'Offering',
        businessName: offering?.business?.business_name || 'Business'
      }
    });
  };

  const handleVoteUpdate = (reviewId: number, newHelpfulCount: number, newNotHelpfulCount: number, userVoteStatus: any) => {
    setReviews(prevReviews => 
      prevReviews.map(review => 
        review.id === reviewId 
          ? { 
              ...review, 
              helpful_count: newHelpfulCount, 
              not_helpful_count: newNotHelpfulCount,
              user_vote_status: userVoteStatus 
            }
          : review
      )
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading offering details...</Text>
        </View>
      </View>
    );
  }

  if (error || !offering) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Offering Not Found</Text>
          <Text style={[styles.errorSubtitle, { color: colors.icon }]}>
            {error || 'Unable to load offering information'}
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={loadOfferingData}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.tint }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{offering.name}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Offering Details */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={[styles.offeringName, { color: colors.text }]}>{offering.name}</Text>
          <Text style={[styles.offeringDescription, { color: colors.icon }]}>{offering.description}</Text>
          
          <View style={styles.offeringMeta}>
            <Text style={[styles.offeringPrice, { color: colors.tint }]}>{offering.price_range}</Text>
            <View style={styles.offeringRating}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={[styles.ratingText, { color: colors.text }]}>
                {parseFloat(offering.average_rating).toFixed(1)}
              </Text>
              <Text style={[styles.reviewCount, { color: colors.icon }]}>
                ({offering.total_reviews} reviews)
              </Text>
            </View>
          </View>

          {offering.business && (
            <View style={styles.businessInfo}>
              <Text style={[styles.businessLabel, { color: colors.icon }]}>From</Text>
              <Text style={[styles.businessName, { color: colors.text }]}>{offering.business.business_name}</Text>
            </View>
          )}
        </View>

        {/* Reviews Section */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <View style={styles.reviewsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Reviews ({reviews.length})
            </Text>
            <TouchableOpacity 
              style={[styles.writeReviewButton, { backgroundColor: colors.tint }]}
              onPress={handleWriteReview}
            >
              <Text style={styles.writeReviewText}>Write Review</Text>
            </TouchableOpacity>
          </View>
          
          {reviews.length > 0 ? (
            <View>
              {reviews.map((item) => (
                <ReviewCard
                  key={item.id}
                  review={item}
                  onVoteUpdate={handleVoteUpdate}
                  flat={true}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-outline" size={48} color={colors.icon} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Reviews Yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
                Be the first to review this item
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  offeringName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  offeringDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  offeringMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  offeringPrice: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  offeringRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 14,
  },
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  businessLabel: {
    fontSize: 14,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  writeReviewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  writeReviewText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewCard: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitial: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewDate: {
    fontSize: 12,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  helpfulText: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
});
