import CustomAlert from '@/components/CustomAlert';
import ProfileAvatar from '@/components/ProfileAvatar';
import { OfferDetailsSkeleton } from '@/components/SkeletonLoader';
import SmartImage from '@/components/SmartImage';
import { Colors } from '@/constants/Colors';
import { useLocation } from '@/contexts/LocationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToastGlobal } from '@/contexts/ToastContext';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import {
  addToFavorites,
  deleteReview,
  getOfferingDetails,
  getOfferingReviews,
  getUserFavorites,
  getUserProfile,
  isAuthenticated,
  Offering,
  removeFromFavorites,
  Review
} from '@/services/api';
import { getFallbackImageUrl, getImageUrl } from '@/utils/imageUtils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('screen'); // Use 'screen' instead of 'window' for full screen including status bar

export default function OfferingDetailsScreen() {
  const [offering, setOffering] = useState<Offering | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<number | null>(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [showImageHint, setShowImageHint] = useState(true);

  const router = useRouter();
  const params = useLocalSearchParams();
  const businessId = parseInt(params.businessId as string);
  const offeringId = parseInt(params.offeringId as string);
  
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();
  const { showSuccess } = useToastGlobal();
  const { getCoordinatesForAPI } = useLocation();

  useEffect(() => {
    if (businessId && offeringId) {
      checkAuthenticationAndLoadData();
    }
  }, [businessId, offeringId]);

  useEffect(() => {
    // Hide the image hint after 4 seconds
    const timer = setTimeout(() => {
      setShowImageHint(false);
    }, 4000);
    
    return () => clearTimeout(timer);
  }, []);

  const checkAuthenticationAndLoadData = async () => {
    try {
      const authenticated = await isAuthenticated();
      setIsUserAuthenticated(authenticated);
      console.log('User authenticated:', authenticated);
      
      // Load user profile if authenticated
      if (authenticated) {
        try {
          const userResponse = await getUserProfile();
          if (userResponse.success) {
            setCurrentUser(userResponse.data.user);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      }
      
      // Load offering data (which now includes favorite status)
      loadOfferingData();
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsUserAuthenticated(false);
      // Still load offering data even if auth check fails
      loadOfferingData();
    }
  };

  const loadOfferingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get coordinates from location service
      const coordinates = getCoordinatesForAPI();

      // Load offering details
      const offeringResponse = await getOfferingDetails(businessId, offeringId, coordinates.latitude, coordinates.longitude);
      if (offeringResponse.success) {
        setOffering(offeringResponse.data);
        // Set favorite status from API response
        setIsFavorite(offeringResponse.data.is_favorite || false);
        console.log('Offering favorite status from API:', offeringResponse.data.is_favorite);
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

  const toggleFavorite = async () => {
    console.log('toggleFavorite called. isUserAuthenticated:', isUserAuthenticated, 'isFavorite:', isFavorite, 'favoriteId:', favoriteId);
    
    if (!isUserAuthenticated) {
      showAlert({
        type: 'info',
        title: 'Sign Up to Save Favorites',
        message: 'Create an account to save your favorite offerings and get personalized recommendations',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Up', onPress: () => router.push('/welcome' as any) }
        ]
      });
      return;
    }

    if (favoriteLoading) {
      console.log('Already loading, skipping...');
      return;
    }
    
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        // If we have favoriteId, use it; otherwise get it from getUserFavorites
        let favoriteIdToRemove = favoriteId;
        
        if (!favoriteIdToRemove) {
          console.log('Getting favorite ID for removal...');
          const favoritesResponse = await getUserFavorites(1);
          if (favoritesResponse.success) {
            const offeringFavorite = favoritesResponse.data.favorites.find(
              fav => fav.type === 'offering' && fav.offering?.id === offeringId
            );
            favoriteIdToRemove = offeringFavorite?.id || null;
          }
        }
        
        if (favoriteIdToRemove) {
          console.log('Removing from favorites. favoriteId:', favoriteIdToRemove);
          // Remove from favorites
          const response = await removeFromFavorites(favoriteIdToRemove);
          console.log('Remove favorite response:', response);
          
          if (response.success) {
            setIsFavorite(false);
            setFavoriteId(null);
            showSuccess('Removed from favorites');
            console.log('Successfully removed from favorites');
          } else {
            throw new Error(response.message || 'Failed to remove from favorites');
          }
        }
      } else {
        console.log('Adding to favorites. offeringId:', offeringId);
        // Add to favorites
        const response = await addToFavorites('offering', offeringId);
        console.log('Add favorite response:', response);
        
        if (response.success) {
          setIsFavorite(true);
          setFavoriteId(response.data.favorite_id);
          showSuccess('Added to favorites');
          console.log('Successfully added to favorites. favoriteId:', response.data.favorite_id);
        } else {
          console.log('Add favorite failed. Checking for conflict...');
          // Handle 409 conflict error (already in favorites)
          if (response.message && response.message.includes('already')) {
            // If it's already in favorites, just update the UI state
            setIsFavorite(true);
            showSuccess('Already in favorites');
            console.log('Item already in favorites, updated UI state');
          } else {
            throw new Error(response.message || 'Failed to add to favorites');
          }
        }
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      
      // Handle specific error cases
      if (error.message && error.message.includes('409')) {
        // 409 conflict - already in favorites
        setIsFavorite(true);
        showSuccess('Already in favorites');
      } else if (error.message && error.message.includes('401')) {
        // 401 unauthorized
        showAlert({
          type: 'error',
          title: 'Authentication Required',
          message: 'Please login again to manage favorites',
          buttons: [{ text: 'OK' }]
        });
        setIsUserAuthenticated(false);
      } else {
        showAlert({
          type: 'error',
          title: 'Failed to Update',
          message: 'Failed to update favorites. Please try again.',
          buttons: [{ text: 'OK' }]
        });
      }
    } finally {
      setFavoriteLoading(false);
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

  const handleEditReview = (reviewId: number) => {
    router.push(`/reviews/edit/${reviewId}` as any);
  };

  const handleDeleteReview = (reviewId: number) => {
    showAlert({
      type: 'warning',
      title: 'Delete Review',
      message: 'Are you sure you want to delete this review? This action cannot be undone.',
      buttons: [
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => confirmDeleteReview(reviewId)
        }
      ]
    });
  };

  const confirmDeleteReview = async (reviewId: number) => {
    try {
      const response = await deleteReview(reviewId);
      
      if (response.success) {
        // Remove review from local state
        setReviews(prev => prev.filter(review => review.id !== reviewId));
        showSuccess('Review deleted successfully');
      } else {
        showAlert({
          type: 'error',
          title: 'Error',
          message: 'Failed to delete review. Please try again.',
          buttons: [{ text: 'OK' }]
        });
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete review. Please try again.',
        buttons: [{ text: 'OK' }]
      });
    }
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out this ${offering?.offering_type}: ${offering?.name} from ${offering?.business?.business_name}`,
        title: offering?.name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const openImageModal = (images: string[], index: number = 0) => {
    console.log('openImageModal called with:', images, index);
    setCurrentImages(images);
    setSelectedImageIndex(index);
    setShowImageModal(true);
    setShowImageHint(false); // Hide hint when user clicks
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
        <TouchableOpacity 
          style={styles.heroImageTouchOverlay}
          onPress={() => openImageModal([getImageUrl(offering.image_url) || getFallbackImageUrl('offering')], 0)}
          activeOpacity={0.9}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.heroOverlay}
          pointerEvents="none"
        >
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
        
        {/* Back button positioned absolutely outside the TouchableOpacity */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        
        {/* Image hint overlay */}
        {showImageHint && (
          <View style={styles.imageHintOverlay}>
            <View style={styles.imageHintContainer}>
              <Ionicons name="finger-print-outline" size={16} color="white" />
              <Text style={styles.imageHintText}>Tap for full image</Text>
            </View>
          </View>
        )}
      </View>

      {/* Quick Actions Bar */}
      <View style={[styles.quickActions, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={toggleFavorite}
          disabled={favoriteLoading}
        >
          <View style={[styles.actionIcon, { backgroundColor: isFavorite ? '#FF6B6B' : colors.buttonPrimary }]}>
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={20} 
              color="white" 
            />
          </View>
          <Text style={[styles.actionLabel, { color: colors.text }]}>
            {isFavorite ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleWriteReview}>
          <View style={[styles.actionIcon, { backgroundColor: colors.buttonPrimary }]}>
            <Ionicons name="create-outline" size={20} color="white" />
          </View>
          <Text style={[styles.actionLabel, { color: colors.text }]}>Write Review</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <View style={[styles.actionIcon, { backgroundColor: '#FF9500' }]}>
            <Ionicons name="share-outline" size={20} color="white" />
          </View>
          <Text style={[styles.actionLabel, { color: colors.text }]}>Share</Text>
        </TouchableOpacity>
        
        {offering?.business && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push(`/business/${offering.business?.id}` as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#2196F3' }]}>
              <Ionicons name="business" size={20} color="white" />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Business</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.scrollViewContainer} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
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
          </View>
          
          {reviews.length > 0 ? (
            <View>
              {reviews.map((item) => (
                <View key={item.id} style={[styles.reviewItem, { backgroundColor: colors.background }]}>
                  {/* Review Header */}
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewUserInfo}>
                      <ProfileAvatar
                        profileImage={item.user.profile_image}
                        userName={item.user.name}
                        size={40}
                        seed={item.user.id.toString()}
                      />
                      <View style={styles.userDetails}>
                        <Text style={[styles.userName, { color: colors.text }]}>{item.user.name}</Text>
                        <View style={styles.reviewMeta}>
                          <View style={styles.starRating}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Ionicons
                                key={star}
                                name={star <= item.overall_rating ? "star" : "star-outline"}
                                size={14}
                                color="#FFD700"
                              />
                            ))}
                          </View>
                          <Text style={[styles.reviewDate, { color: colors.icon }]}>
                            {new Date(item.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    {/* Edit/Delete buttons for user's own reviews */}
                    {isUserAuthenticated && currentUser && item.user.id === currentUser.id && (
                      <View style={styles.reviewActions}>
                        <TouchableOpacity
                          style={[styles.reviewActionButton, { backgroundColor: colors.tint + '15' }]}
                          onPress={() => handleEditReview(item.id)}
                        >
                          <Ionicons name="pencil" size={14} color={colors.tint} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.reviewActionButton, { backgroundColor: '#ef4444' + '15' }]}
                          onPress={() => handleDeleteReview(item.id)}
                        >
                          <Ionicons name="trash" size={14} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Review Title */}
                  {item.title && (
                    <Text style={[styles.reviewTitle, { color: colors.text }]}>{item.title}</Text>
                  )}

                  {/* Review Text */}
                  <Text style={[styles.reviewText, { color: colors.text }]}>{item.review_text}</Text>

                  {/* Review Images */}
                  {item.images && item.images.length > 0 && (
                    <View style={styles.reviewImages}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                        {item.images.map((imageUri: string, index: number) => (
                          <TouchableOpacity 
                            key={index} 
                            activeOpacity={0.8}
                            onPress={() => openImageModal(item.images || [], index)}
                            style={styles.reviewImageContainer}
                          >
                            <Image
                              source={{ uri: imageUri }}
                              style={styles.reviewImage}
                            />
                            {/* Small expand icon for review images */}
                            <View style={styles.reviewImageOverlay}>
                              <Ionicons name="expand-outline" size={16} color="white" />
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Review Footer */}
                  <View style={styles.reviewFooter}>
                    <View style={styles.reviewTags}>
                      {item.is_recommended && (
                        <View style={[styles.recommendedBadge, { backgroundColor: colors.tint + '20' }]}>
                          <Ionicons name="thumbs-up" size={12} color={colors.tint} />
                          <Text style={[styles.recommendedText, { color: colors.tint }]}>Recommended</Text>
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
            </View>
          )}
        </View>
      </ScrollView>

      {/* Image Viewer Modal */}
      <Modal 
        visible={showImageModal} 
        animationType="fade" 
        transparent={true}
        statusBarTranslucent={true}
        presentationStyle="overFullScreen"
      >
        <StatusBar style="light" backgroundColor="rgba(0, 0, 0, 0.7)" />
        <View style={styles.imageModalOverlay}>
          <View style={styles.imageModalContainer}>
            
            {currentImages.length > 0 && (
              <View style={styles.imageModalContent}>
                <TouchableOpacity 
                  style={styles.imageModalCloseButton}
                  onPress={() => setShowImageModal(false)}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
                
                <View style={styles.swipeContainer}>
                  <SmartImage
                    source={currentImages[selectedImageIndex]}
                    type="general"
                    width={width - 40}
                    height={300}
                    style={styles.modalImage}
                  />
                </View>
                
                {currentImages.length > 1 && (
                  <View style={styles.imageCounterContainer}>
                    <View style={styles.navigationButtons}>
                      <TouchableOpacity 
                        style={[styles.navButton, { opacity: selectedImageIndex > 0 ? 1 : 0.3 }]}
                        onPress={() => selectedImageIndex > 0 && setSelectedImageIndex(selectedImageIndex - 1)}
                        disabled={selectedImageIndex === 0}
                      >
                        <Ionicons name="chevron-back" size={24} color="white" />
                      </TouchableOpacity>
                      
                      <Text style={styles.imageCounter}>
                        {selectedImageIndex + 1} of {currentImages.length}
                      </Text>
                      
                      <TouchableOpacity 
                        style={[styles.navButton, { opacity: selectedImageIndex < currentImages.length - 1 ? 1 : 0.3 }]}
                        onPress={() => selectedImageIndex < currentImages.length - 1 && setSelectedImageIndex(selectedImageIndex + 1)}
                        disabled={selectedImageIndex === currentImages.length - 1}
                      >
                        <Ionicons name="chevron-forward" size={24} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

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
    justifyContent: 'flex-end',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
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
  scrollViewContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Review styles
  reviewItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewUserInfo: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  reviewActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewImages: {
    marginBottom: 12,
  },
  imagesScroll: {
    marginHorizontal: -4,
  },
  reviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  reviewImageContainer: {
    position: 'relative',
  },
  reviewImageOverlay: {
    position: 'absolute',
    top: 4,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  reviewTags: {
    flexDirection: 'row',
    flex: 1,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  recommendedText: {
    fontSize: 12,
    fontWeight: '500',
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
  },
  // Image Modal Styles
  heroImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  heroImageTouchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  imageModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  imageModalContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'relative',
    justifyContent: 'center',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: -40,
    right: 10,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  modalImage: {
    borderRadius: 16,
  },
  imageCounterContainer: {
    marginTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  imageCounter: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageHintOverlay: {
    position: 'absolute',
    top: 50,
    right: 20,
    alignItems: 'flex-end',
    zIndex: 5,
  },
  imageHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  imageHintText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});
