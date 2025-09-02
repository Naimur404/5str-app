import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { getUserReviews, Review, isAuthenticated, deleteReview } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
    ScrollView,
} from 'react-native';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/CustomAlert';
import { useToastGlobal } from '@/contexts/ToastContext';
import SmartImage, { BusinessLogo, OfferingImage } from '@/components/SmartImage';
import { getImageUrl, getOptimizedImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';

// Skeleton Loader Component
const ReviewSkeleton = ({ colors }: { colors: any }) => (
  <View style={[styles.reviewCard, { backgroundColor: colors.card }]}>
    <View style={styles.reviewContent}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewMetaLeft}>
          <View style={[styles.skeletonBox, styles.skeletonImage, { backgroundColor: colors.icon + '20' }]} />
          <View style={styles.reviewInfo}>
            <View style={[styles.skeletonBox, styles.skeletonTitle, { backgroundColor: colors.icon + '20' }]} />
            <View style={[styles.skeletonBox, styles.skeletonSubtitle, { backgroundColor: colors.icon + '20' }]} />
          </View>
        </View>
        <View style={styles.reviewMeta}>
          <View style={[styles.skeletonBox, styles.skeletonRating, { backgroundColor: colors.icon + '20' }]} />
          <View style={[styles.skeletonBox, styles.skeletonDate, { backgroundColor: colors.icon + '20' }]} />
        </View>
      </View>
      
      <View style={styles.reviewTextContainer}>
        <View style={[styles.skeletonBox, styles.skeletonText, { backgroundColor: colors.icon + '20' }]} />
        <View style={[styles.skeletonBox, styles.skeletonText, { backgroundColor: colors.icon + '20', width: '80%' }]} />
        <View style={[styles.skeletonBox, styles.skeletonText, { backgroundColor: colors.icon + '20', width: '60%' }]} />
      </View>

      <View style={styles.reviewFooter}>
        <View style={[styles.skeletonBox, styles.skeletonTag, { backgroundColor: colors.icon + '20' }]} />
        <View style={[styles.skeletonBox, styles.skeletonStats, { backgroundColor: colors.icon + '20' }]} />
      </View>
    </View>
  </View>
);

export default function ReviewsScreen() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { alertConfig, showError, showSuccess, showInfo, hideAlert } = useCustomAlert();
  const { showSuccess: showToastSuccess, showError: showToastError } = useToastGlobal();

  useEffect(() => {
    checkAuthAndLoadReviews();
  }, []);

  const checkAuthAndLoadReviews = async () => {
    try {
      const authenticated = await isAuthenticated();
      setIsUserAuthenticated(authenticated);
      
      if (authenticated) {
        await loadReviews();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsUserAuthenticated(false);
      setLoading(false);
    }
  };

  const loadReviews = async (page: number = 1, isRefresh: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await getUserReviews(page);
      
      if (response.success) {
        const newReviews = response.data.reviews;
        
        if (isRefresh || page === 1) {
          setReviews(newReviews);
        } else {
          setReviews(prev => [...prev, ...newReviews]);
        }
        
        setHasMore(response.data.pagination.has_more);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    if (!isUserAuthenticated) return;
    
    setRefreshing(true);
    await loadReviews(1, true);
  };

  const loadMore = async () => {
    if (!loadingMore && hasMore && isUserAuthenticated) {
      await loadReviews(currentPage + 1);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getBusinessImage = (review: Review) => {
    return review.business?.logo_image || 
           review.offering?.image_url;
  };

  const getBusinessName = (review: Review) => {
    return review.business?.business_name || review.offering?.business_name || 'Unknown Business';
  };

  const getItemName = (review: Review) => {
    if (review.type === 'offering' && review.offering) {
      return review.offering.name;
    }
    return review.business?.category_name || 'Service';
  };

  const handleEditReview = (reviewId: number) => {
    router.push(`/reviews/edit/${reviewId}` as any);
  };

  const handleDeleteReview = (reviewId: number) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => confirmDeleteReview(reviewId)
        }
      ]
    );
  };

  const confirmDeleteReview = async (reviewId: number) => {
    try {
      const response = await deleteReview(reviewId);
      
      if (response.success) {
        // Remove review from local state
        setReviews(prev => prev.filter(review => review.id !== reviewId));
        showToastSuccess('Review deleted successfully', 3000);
      } else {
        showToastError('Failed to delete review. Please try again.', 3000);
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      showToastError('Failed to delete review. Please try again.', 3000);
    }
  };

  const renderReviewItem = ({ item }: { item: Review }) => (
    <View style={[styles.reviewCard, { backgroundColor: colors.card }]}>
      <View style={styles.reviewContent}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewMetaLeft}>
            <BusinessLogo
              source={getBusinessImage(item)}
              businessName={getBusinessName(item)}
              width={48}
              height={48}
              borderRadius={8}
            />
            <View style={styles.reviewInfo}>
              <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={1}>
                {getBusinessName(item)}
              </Text>
              <Text style={[styles.itemName, { color: colors.icon }]} numberOfLines={1}>
                {getItemName(item)}
              </Text>
            </View>
          </View>
          
          <View style={styles.reviewMetaRight}>
            <View style={styles.ratingContainer}>
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < item.overall_rating ? "star" : "star-outline"}
                  size={16}
                  color="#FFD700"
                />
              ))}
            </View>
            <Text style={[styles.reviewDate, { color: colors.icon }]}>
              {formatDate(item.created_at)}
            </Text>
            
            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.tint + '15' }]}
                onPress={() => handleEditReview(item.id)}
              >
                <Ionicons name="pencil" size={14} color={colors.tint} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#ef4444' + '15' }]}
                onPress={() => handleDeleteReview(item.id)}
              >
                <Ionicons name="trash" size={14} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <View style={styles.reviewTextContainer}>
          <Text style={[styles.reviewText, { color: colors.text }]}>
            {item.review_text}
          </Text>
        </View>

        {/* Review Images */}
        {item.images && item.images.length > 0 && (
          <View style={styles.reviewImagesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewImagesScroll}>
              {item.images.map((imageUri, index) => (
                <TouchableOpacity key={index} activeOpacity={0.8}>
                  <SmartImage
                    source={imageUri}
                    type="general"
                    width={80}
                    height={80}
                    borderRadius={8}
                    style={styles.reviewImageThumbnail}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.reviewFooter}>
          <View style={styles.reviewTags}>
            <View style={[styles.statusTag, { 
              backgroundColor: item.status === 'approved' ? '#4CAF50' : '#FF9800' 
            }]}>
              <Text style={styles.statusText}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
            {item.is_recommended && (
              <View style={[styles.recommendedTag, { backgroundColor: colors.tint + '20' }]}>
                <Ionicons name="thumbs-up" size={12} color={colors.tint} />
                <Text style={[styles.recommendedText, { color: colors.tint }]}>
                  Recommended
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.helpfulStats}>
            <View style={styles.helpfulItem}>
              <Ionicons name="thumbs-up-outline" size={14} color={colors.icon} />
              <Text style={[styles.helpfulCount, { color: colors.icon }]}>
                {item.helpful_count}
              </Text>
            </View>
            {item.not_helpful_count > 0 && (
              <View style={styles.helpfulItem}>
                <Ionicons name="thumbs-down-outline" size={14} color={colors.icon} />
                <Text style={[styles.helpfulCount, { color: colors.icon }]}>
                  {item.not_helpful_count}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.icon }]}>Loading more reviews...</Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="star-outline" size={64} color={colors.icon} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Reviews Yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
        Start exploring businesses and share your experiences
      </Text>
      <TouchableOpacity 
        style={[styles.exploreButton, { backgroundColor: colors.tint }]}
        onPress={() => router.back()}
      >
        <Text style={styles.exploreButtonText}>Start Exploring</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAuthRequiredState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="person-outline" size={64} color={colors.icon} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Login Required</Text>
      <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
        Please login to view your reviews and share your experiences
      </Text>
      <TouchableOpacity 
        style={[styles.exploreButton, { backgroundColor: colors.tint }]}
        onPress={() => router.push('/auth/login')}
      >
        <Text style={styles.exploreButtonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <LinearGradient
          colors={[colors.headerGradientStart, colors.headerGradientEnd]}
          style={styles.header}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>My Reviews</Text>
          </View>
          <View style={styles.headerRight} />
        </LinearGradient>

        {/* Skeleton Loading */}
        <View style={styles.content}>
          {[...Array(5)].map((_, index) => (
            <ReviewSkeleton key={index} colors={colors} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <LinearGradient
          colors={[colors.headerGradientStart, colors.headerGradientEnd]}
          style={styles.header}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>My Reviews</Text>
            {isUserAuthenticated && (
              <Text style={styles.headerSubtitle}>
                {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
          <View style={styles.headerRight} />
        </LinearGradient>

      {/* Content based on authentication state */}
      {isUserAuthenticated === false ? (
        renderAuthRequiredState()
      ) : reviews.length > 0 ? (
        <FlatList
          data={reviews}
          renderItem={renderReviewItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.tint]}
              tintColor={colors.tint}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      ) : isUserAuthenticated === true ? (
        renderEmptyState()
      ) : null}
      
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
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  reviewCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 4,
  },
  reviewContent: {
    padding: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reviewMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewInfo: {
    flex: 1,
    marginLeft: 12,
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  itemName: {
    fontSize: 14,
  },
  reviewMeta: {
    alignItems: 'flex-end',
  },
  reviewMetaRight: {
    alignItems: 'flex-end',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
  },
  reviewTextContainer: {
    marginBottom: 16,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
  },
  reviewImagesContainer: {
    marginBottom: 16,
  },
  reviewImagesScroll: {
    paddingVertical: 4,
  },
  reviewImageThumbnail: {
    marginRight: 8,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewTags: {
    flexDirection: 'row',
    gap: 8,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },
  recommendedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '600',
  },
  helpfulStats: {
    flexDirection: 'row',
    gap: 12,
  },
  helpfulItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  helpfulCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Skeleton styles
  skeletonBox: {
    borderRadius: 4,
  },
  skeletonImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  skeletonTitle: {
    height: 16,
    width: '70%',
    marginBottom: 6,
  },
  skeletonSubtitle: {
    height: 12,
    width: '50%',
  },
  skeletonRating: {
    height: 16,
    width: 80,
    marginBottom: 4,
  },
  skeletonDate: {
    height: 12,
    width: 60,
  },
  skeletonText: {
    height: 14,
    width: '100%',
    marginBottom: 6,
  },
  skeletonTag: {
    height: 20,
    width: 60,
  },
  skeletonStats: {
    height: 16,
    width: 40,
  },
});
