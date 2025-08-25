import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/CustomAlert';
import { getImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';
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
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ReviewCard from '@/components/ReviewCard';
import { OfferDetailsSkeleton } from '@/components/SkeletonLoader';

const { width } = Dimensions.get('window');

export default function OfferingDetailsScreen() {
  const [offering, setOffering] = useState<Offering | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const params = useLocalSearchParams();
  const businessId = parseInt(params.businessId as string);
  const offeringId = parseInt(params.offeringId as string);
  
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();

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
      showAlert({
        type: 'info',
        title: 'Sign Up to Write Reviews',
        message: 'Create an account to share your experience and help others discover great offerings',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Up', onPress: () => router.push('/welcome' as any) }
        ]
      });
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
        <OfferDetailsSkeleton colors={colors} />
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
            style={[styles.retryButton, { backgroundColor: colors.buttonPrimary }]}
            onPress={loadOfferingData}
          >
            <Text style={[styles.retryButtonText, { color: colors.buttonText }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      {/* Hero Section with Image */}
      <View style={styles.heroSection}>
        <Image 
          source={{ uri: getImageUrl(offering.image_url) || getFallbackImageUrl('offering') }} 
          style={styles.heroImage} 
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.heroOverlay}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.heroContent}>
            <Text style={styles.offeringName}>{offering.name}</Text>
            <Text style={styles.offeringType}>
              {offering.offering_type === 'product' ? 'Product' : 'Service'}
            </Text>
            <View style={styles.heroMeta}>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingBadgeText}>{parseFloat(offering.average_rating).toFixed(1)}</Text>
                <Text style={styles.ratingBadgeText}>({offering.total_reviews})</Text>
              </View>
              <Text style={styles.priceBadge}>{offering.price_range}</Text>
              {offering.is_popular && (
                <View style={styles.popularBadge}>
                  <Ionicons name="trending-up" size={14} color="#FF6B6B" />
                  <Text style={styles.popularText}>Popular</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Offering Details Card */}
        <View style={[styles.detailsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
          
          <Text style={[styles.description, { color: colors.text }]}>{offering.description}</Text>
          
          {/* Pricing Section */}
          <View style={styles.pricingSection}>
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: colors.icon }]}>Price Range</Text>
              <Text style={[styles.priceValue, { color: colors.tint }]}>{offering.price_range}</Text>
            </View>
            {offering.price && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: colors.icon }]}>Starting Price</Text>
                <Text style={[styles.priceValue, { color: colors.tint }]}>
                  {offering.currency} {offering.price}
                  {offering.price_max && ` - ${offering.currency} ${offering.price_max}`}
                </Text>
              </View>
            )}
          </View>

          {/* Features */}
          <View style={styles.featuresSection}>
            <Text style={[styles.featuresTitle, { color: colors.text }]}>Features</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons 
                  name={offering.is_available ? "checkmark-circle" : "close-circle"} 
                  size={16} 
                  color={offering.is_available ? "#4CAF50" : "#FF6B6B"} 
                />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  {offering.is_available ? "Available" : "Currently Unavailable"}
                </Text>
              </View>
              
              {offering.is_featured && (
                <View style={styles.featureItem}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={[styles.featureText, { color: colors.text }]}>Featured Item</Text>
                </View>
              )}
              
              {offering.is_popular && (
                <View style={styles.featureItem}>
                  <Ionicons name="trending-up" size={16} color="#FF6B6B" />
                  <Text style={[styles.featureText, { color: colors.text }]}>Popular Choice</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Business Info Card */}
        {offering.business && (
          <View style={[styles.businessCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>From This Business</Text>
            <TouchableOpacity 
              style={styles.businessInfo}
              onPress={() => router.push(`/business/${offering.business?.id}` as any)}
            >
              <View style={styles.businessDetails}>
                <Text style={[styles.businessName, { color: colors.text }]}>
                  {offering.business.business_name}
                </Text>
                <Text style={[styles.businessSubtext, { color: colors.icon }]}>
                  View all offerings from this business
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.icon} />
            </TouchableOpacity>
          </View>
        )}

        {/* Reviews Section */}
        <View style={[styles.reviewsCard, { backgroundColor: colors.card }]}>
          <View style={styles.reviewsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Reviews ({reviews.length})
            </Text>
            <TouchableOpacity 
              style={[styles.writeReviewButton, { backgroundColor: colors.buttonPrimary }]}
              onPress={handleWriteReview}
            >
              <Ionicons name="create-outline" size={16} color={colors.buttonText} />
              <Text style={[styles.writeReviewText, { color: colors.buttonText }]}>Write Review</Text>
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
              <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
                <Ionicons name="chatbubble-outline" size={48} color={colors.icon} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Reviews Yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
                Be the first to share your experience with this {offering.offering_type}
              </Text>
              <TouchableOpacity 
                style={[styles.writeFirstReviewButton, { backgroundColor: colors.buttonPrimary }]}
                onPress={handleWriteReview}
              >
                <Text style={[styles.writeFirstReviewText, { color: colors.buttonText }]}>
                  Write the First Review
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
    fontSize: 16,
    fontWeight: '600',
  },
  heroSection: {
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  heroContent: {
    alignSelf: 'stretch',
  },
  offeringName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  offeringType: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  priceBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  popularText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  detailsCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  businessCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewsCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  pricingSection: {
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  featuresSection: {
    marginTop: 8,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  businessDetails: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  businessSubtext: {
    fontSize: 14,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  writeReviewText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
  },
  writeFirstReviewButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  writeFirstReviewText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
