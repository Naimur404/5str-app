import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useToastGlobal } from '@/contexts/ToastContext';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/CustomAlert';
import { 
  getAttractionDetails,
  getAttractionReviews,
  submitAttractionReview,
  voteAttractionReviewHelpful,
  voteAttractionReviewNotHelpful,
  isAuthenticated
} from '@/services/api';
import { 
  AttractionDetail, 
  AttractionReview,
  AttractionReviewSubmissionRequest
} from '@/types/api';
import { getFallbackImageUrl, getImageUrl } from '@/utils/imageUtils';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import SmartImage from '@/components/SmartImage';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = 240;

export default function AttractionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { showSuccess, showError } = useToastGlobal();
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();

  // State
  const [attraction, setAttraction] = useState<AttractionDetail | null>(null);
  const [reviews, setReviews] = useState<AttractionReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [votingReviewId, setVotingReviewId] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Load attraction data and check authentication
  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchAttractionDetail();
        checkAuthentication();
        // Reviews are now loaded with attraction details, 
        // only fetch additional reviews if needed
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

  const fetchAttractionDetail = async () => {
    try {
      setLoading(true);
      const response = await getAttractionDetails(parseInt(id as string));
      
      if (response.success) {
        const attraction = response.data;
        
        setAttraction(attraction);
        
        // Set initial reviews from the attraction details response
        if (attraction.reviews && attraction.reviews.length > 0) {
          setReviews(attraction.reviews);
        }
      } else {
        showError('Failed to load attraction details');
      }
    } catch (error) {
      console.error('Error fetching attraction:', error);
      showError('Network error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAttractionReviews = async (page = 1) => {
    try {
      setReviewsLoading(true);
      const response = await getAttractionReviews(parseInt(id as string), page, 10, 'helpful');
      
      if (response.success) {
        if (page === 1) {
          setReviews(response.data.data);
        } else {
          setReviews(prev => [...prev, ...response.data.data]);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
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

  const handleViewAllReviews = () => {
    if (!isUserAuthenticated) {
      showAlert({
        type: 'info',
        title: 'Please Login to View All Reviews',
        message: 'Sign in to your account to view all reviews and discover what other travelers are saying',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/welcome' as any) }
        ]
      });
      return;
    }
    router.push(`/attraction/${id}/all-reviews` as any);
  };

  const handleReviewVote = async (reviewId: number, isHelpful: boolean) => {
    if (!isUserAuthenticated) {
      showAlert({
        type: 'info',
        title: 'Sign Up to Vote on Reviews',
        message: 'Create an account to vote on reviews and help other travelers find useful information',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Up', onPress: () => router.push('/welcome' as any) }
        ]
      });
      return;
    }

    // Prevent double-clicking
    if (votingReviewId === reviewId) {
      return;
    }

    setVotingReviewId(reviewId);

    try {
      console.log(`🗳️ Voting on review ${reviewId} (${isHelpful ? 'helpful' : 'not helpful'}) for attraction ${id}`);
      
      const response = isHelpful 
        ? await voteAttractionReviewHelpful(parseInt(id as string), reviewId)
        : await voteAttractionReviewNotHelpful(parseInt(id as string), reviewId);
      
      console.log('📊 Vote response:', response);
      
      if (response.success) {
        showSuccess(response.message || `Review marked as ${isHelpful ? 'helpful' : 'not helpful'}`);
        
        // Update the review in local state with API response data
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { 
                ...review, 
                helpful_votes: response.data.helpful_votes,
                total_votes: response.data.total_votes,
                helpful_percentage: response.data.helpful_percentage,
                user_vote: isHelpful ? 'helpful' : 'not_helpful'
              }
            : review
        ));
        
        console.log(`✅ Updated review ${reviewId}: ${response.data.helpful_votes}/${response.data.total_votes} helpful votes (${response.data.helpful_percentage}%)`);
        
        // Optionally refresh reviews to ensure data consistency
        // fetchAttractionReviews();
      } else {
        // Handle API error responses
        console.log('❌ Vote failed:', response.message);
        showAlert({
          type: 'warning',
          title: 'Unable to Vote',
          message: response.message || 'Failed to submit your vote',
          buttons: [{ text: 'OK', onPress: hideAlert }]
        });
      }
    } catch (error: any) {
      console.error('❌ Error voting on review:', error);
      
      // Handle specific HTTP error codes
      if (error.response?.status === 400) {
        // Own review vote error
        showAlert({
          type: 'info',
          title: 'Cannot Vote',
          message: error.response?.data?.message || 'You cannot vote on your own review',
          buttons: [{ text: 'OK', onPress: hideAlert }]
        });
      } else if (error.response?.status === 409) {
        // Already voted error
        showAlert({
          type: 'info',
          title: 'Already Voted',
          message: error.response?.data?.message || 'You have already voted on this review',
          buttons: [{ text: 'OK', onPress: hideAlert }]
        });
      } else if (error.response?.status === 401) {
        // Authentication error
        showAlert({
          type: 'error',
          title: 'Authentication Required',
          message: 'Please sign in again to vote on reviews',
          buttons: [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => router.push('/welcome' as any) }
          ]
        });
        setIsUserAuthenticated(false);
      } else {
        // Generic network error
        showError(error?.message || 'Network error occurred while voting');
      }
    } finally {
      setVotingReviewId(null);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAttractionDetail();
    fetchAttractionReviews();
  };

  const openImageModal = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  if (loading && !attraction) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <Ionicons name="location-outline" size={64} color={colors.icon} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading attraction details...</Text>
          <Text style={[styles.loadingSubText, { color: colors.icon }]}>Please wait while we fetch the information</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!attraction) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.icon} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Attraction not found</Text>
          <Text style={[styles.loadingSubText, { color: colors.icon }]}>
            The attraction you're looking for doesn't exist or has been removed.
          </Text>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: colors.tint, marginTop: 20 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <SmartImage
          source={attraction?.media?.cover_image_url || getFallbackImageUrl('general')}
          type="general"
          width="100%"
          height="100%"
          style={styles.heroImage}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.heroOverlay}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.heroContent}>
            <Text style={styles.attractionTitle} numberOfLines={2}>{attraction?.name || 'Loading...'}</Text>
            <Text style={styles.attractionLocation}>
              {attraction?.location?.area || ''}{attraction?.location?.area && attraction?.location?.city ? ', ' : ''}{attraction?.location?.city || ''}
            </Text>
            
            <View style={styles.headerMeta}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>{attraction?.ratings?.overall_rating || '0'}</Text>
                <Text style={styles.reviewsCount}>({attraction?.ratings?.total_reviews || 0} reviews)</Text>
              </View>
              
              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeText}>
                  {attraction?.pricing?.is_free ? 'FREE' : `${attraction?.pricing?.currency || ''} ${attraction?.pricing?.entry_fee || ''}`}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Action Buttons */}
      <View style={[styles.quickActions, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleWriteReview}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.tint }]}>
            <Ionicons name="create-outline" size={16} color="white" />
          </View>
          <Text style={[styles.actionLabel, { color: colors.text }]}>Review</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => attraction?.google_maps_url && Linking.openURL(attraction.google_maps_url)}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#22C55E' }]}>
            <Ionicons name="location-outline" size={16} color="white" />
          </View>
          <Text style={[styles.actionLabel, { color: colors.text }]}>Directions</Text>
        </TouchableOpacity>
        
        {attraction?.contact?.website && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => attraction.contact?.website && Linking.openURL(attraction.contact.website)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FF9800' }]}>
              <Ionicons name="globe" size={16} color="white" />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Website</Text>
          </TouchableOpacity>
        )}
        
        {attraction?.contact?.phone && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => attraction.contact?.phone && Linking.openURL(`tel:${attraction.contact.phone}`)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="call" size={16} color="white" />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Call</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Description */}
        <View style={[styles.section, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          <Text style={[styles.description, { color: colors.text }]}>
            {attraction?.description || 'Discover this amazing attraction and all it has to offer. Come explore and create memorable experiences!'}
          </Text>
          
          {/* Tags */}
          {(attraction?.meta_data as any)?.tags && Array.isArray((attraction?.meta_data as any).tags) && (attraction?.meta_data as any).tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {(attraction?.meta_data as any).tags.map((tag: string, index: number) => (
                <View key={index} style={[styles.attractionTag, { backgroundColor: colors.tint + '20', borderColor: colors.tint + '40', borderWidth: 1 }]}>
                  <Text style={[styles.attractionTagText, { color: colors.tint }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Visit Information */}
        <View style={[styles.section, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Visit Information</Text>
          
          {attraction?.visit_info ? (
            <View>
            
            {attraction.visit_info.estimated_duration_minutes && (
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color={colors.tint} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  Duration: {Math.floor(attraction.visit_info.estimated_duration_minutes / 60)}h {attraction.visit_info.estimated_duration_minutes % 60}min
                </Text>
              </View>
            )}
            
            {attraction.visit_info.difficulty_level && (
              <View style={styles.infoRow}>
                <Ionicons name="fitness-outline" size={20} color={colors.tint} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  Difficulty: {attraction.visit_info.difficulty_level}
                </Text>
              </View>
            )}
            
            {attraction.visit_info.best_time_to_visit?.months && attraction.visit_info.best_time_to_visit.months.length > 0 && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color={colors.tint} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  Best time: {attraction.visit_info.best_time_to_visit.months.join(', ')}
                </Text>
              </View>
            )}
            </View>
          ) : (
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={20} color={colors.tint} />
              <Text style={[styles.infoText, { color: colors.text }]}>Visit information will be available soon</Text>
            </View>
          )}
        </View>

        {/* Opening Hours */}
        <View style={[styles.section, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Opening Hours</Text>
          {attraction?.schedule?.opening_hours && Object.keys(attraction.schedule.opening_hours).length > 0 ? (
            <View>
              {Object.entries(attraction.schedule.opening_hours).map(([day, hours]: [string, any]) => (
                <View key={day} style={styles.infoRow}>
                  <Ionicons name="time-outline" size={20} color={colors.tint} />
                  <Text style={[styles.infoText, { color: colors.text }]}>
                    {day.charAt(0).toUpperCase() + day.slice(1)}: {hours?.open || 'Closed'} - {hours?.close || 'Closed'}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={colors.tint} />
              <Text style={[styles.infoText, { color: colors.text }]}>Opening hours: 6:00 AM - 8:00 PM (Daily)</Text>
            </View>
          )}
        </View>

        {/* Facilities */}
        <View style={[styles.section, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Facilities</Text>
          {attraction?.visit_info?.facilities && attraction.visit_info.facilities.length > 0 ? (
            <View style={styles.facilitiesContainer}>
              {attraction.visit_info.facilities.map((facility: string, index: number) => (
                <View key={index} style={[styles.facilityItem, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.tint} style={styles.facilityIcon} />
                  <Text style={[styles.facilityText, { color: colors.text }]}>{facility.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noFacilitiesContainer}>
              <Ionicons name="business-outline" size={24} color={colors.icon} />
              <Text style={[styles.noFacilitiesText, { color: colors.icon }]}>Facility information coming soon</Text>
            </View>
          )}
        </View>

        {/* Best Time to Visit */}
        <View style={[styles.section, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Best Time to Visit</Text>
          {attraction?.visit_info?.best_time_to_visit?.months && attraction.visit_info.best_time_to_visit.months.length > 0 ? (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.tint} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {attraction.visit_info.best_time_to_visit.months.join(', ')}
              </Text>
            </View>
          ) : (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.tint} />
              <Text style={[styles.infoText, { color: colors.text }]}>Best months: November - March (Winter season)</Text>
            </View>
          )}
        </View>

        {/* Accessibility */}
        <View style={[styles.section, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Accessibility</Text>
          <View style={styles.infoRow}>
            <Ionicons name="accessibility-outline" size={20} color={colors.tint} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {attraction?.accessibility?.wheelchair_accessible ? 'Wheelchair accessible' : 'Limited wheelchair access'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="car-outline" size={20} color={colors.tint} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {attraction?.accessibility?.parking_available ? 'Parking available' : 'Limited parking'}
            </Text>
          </View>
        </View>

        {/* Gallery */}
        {attraction?.media?.gallery && attraction.media.gallery.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Photo Gallery ({attraction.media.gallery.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryContainer}>
              {attraction.media.gallery.map((image: any, index: number) => (
                <TouchableOpacity 
                  key={image.id} 
                  style={styles.galleryImageContainer}
                  onPress={() => openImageModal(index)}
                >
                  <SmartImage
                    source={image.full_image_url || image.image_url}
                    type="general"
                    width={200}
                    height={150}
                    style={styles.galleryImage}
                  />
                  {image.title && (
                    <Text style={[styles.galleryImageTitle, { color: colors.text }]} numberOfLines={1}>
                      {image.title}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Contact Information */}
        <View style={[styles.section, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>
          {attraction?.contact && Object.keys(attraction.contact).length > 0 ? (
            <View>
              {attraction.contact.phone && (
                <TouchableOpacity 
                  style={styles.infoRow}
                  onPress={() => attraction.contact?.phone && Linking.openURL(`tel:${attraction.contact.phone}`)}
                >
                  <Ionicons name="call-outline" size={20} color={colors.tint} />
                  <Text style={[styles.infoText, { color: colors.tint }]}>{attraction.contact.phone}</Text>
                </TouchableOpacity>
              )}
              
              {attraction.contact.email && (
                <TouchableOpacity 
                  style={styles.infoRow}
                  onPress={() => attraction.contact?.email && Linking.openURL(`mailto:${attraction.contact.email}`)}
                >
                  <Ionicons name="mail-outline" size={20} color={colors.tint} />
                  <Text style={[styles.infoText, { color: colors.tint }]}>{attraction.contact.email}</Text>
                </TouchableOpacity>
              )}
              
              {attraction.contact.website && (
                <TouchableOpacity 
                  style={styles.infoRow}
                  onPress={() => attraction.contact?.website && Linking.openURL(attraction.contact.website)}
                >
                  <Ionicons name="globe-outline" size={20} color={colors.tint} />
                  <Text style={[styles.infoText, { color: colors.tint }]}>Visit Website</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={20} color={colors.icon} />
              <Text style={[styles.infoText, { color: colors.icon }]}>Contact information will be available soon</Text>
            </View>
          )}
        </View>

        {/* Pricing & Hours */}
        <View style={[styles.section, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Pricing & Information</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={20} color={colors.tint} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {attraction?.pricing?.is_free ? 'Free Entry' : 
               attraction?.pricing?.entry_fee ? `${attraction.pricing.currency} ${attraction.pricing.entry_fee}` : 
               'Pricing information coming soon'}
            </Text>
          </View>
        </View>

        {/* Reviews Section - Compact Summary */}
        <View style={[styles.section, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
          <View style={styles.reviewsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Reviews ({attraction?.ratings?.total_reviews || 0})
            </Text>
            <TouchableOpacity onPress={handleWriteReview}>
              <Text style={[styles.writeReviewText, { color: colors.tint }]}>Write Review</Text>
            </TouchableOpacity>
          </View>
          
          {/* Rating Summary */}
          {attraction?.ratings && (
            <View style={styles.ratingSummary}>
              <View style={styles.ratingOverview}>
                <Text style={[styles.averageRating, { color: colors.text }]}>
                  {parseFloat(attraction.ratings.overall_rating).toFixed(1)}
                </Text>
                <View style={styles.starsContainer}>
                  {[...Array(5)].map((_, i) => (
                    <Ionicons
                      key={i}
                      name="star"
                      size={16}
                      color={i < Math.floor(parseFloat(attraction?.ratings?.overall_rating || '0')) ? "#FFD700" : colors.icon}
                    />
                  ))}
                </View>
                <Text style={[styles.totalReviews, { color: colors.icon }]}>
                  {attraction.ratings.total_reviews} reviews
                </Text>
              </View>
            </View>
          )}
          
          {/* Preview of Recent Reviews */}
          {reviews && reviews.length > 0 ? (
            <View>
              {reviews.slice(0, 2).map((review) => (
                <View key={review.id} style={[styles.reviewPreview, { borderBottomColor: colors.border }]}>
                  <View style={styles.reviewPreviewHeader}>
                    <Text style={[styles.reviewUserName, { color: colors.text }]}>{review.user.name}</Text>
                    <View style={styles.reviewRating}>
                      {[...Array(5)].map((_, i) => (
                        <Ionicons
                          key={i}
                          name="star"
                          size={10}
                          color={i < parseFloat(review.rating) ? "#FFD700" : colors.icon}
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={[styles.reviewPreviewText, { color: colors.text }]} numberOfLines={2}>
                    {review.comment}
                  </Text>
                </View>
              ))}
              
              <TouchableOpacity 
                style={styles.viewAllReviewsButton}
                onPress={handleViewAllReviews}
              >
                <Text style={[styles.viewAllReviewsText, { color: colors.tint }]}>
                  View All {attraction?.ratings?.total_reviews || reviews.length} Reviews
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.tint} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noReviewsContainer}>
              <Ionicons name="chatbubble-outline" size={32} color={colors.icon} />
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
        </View>
      </ScrollView>

      {/* Image Gallery Modal */}
      <Modal visible={showImageModal} animationType="fade" transparent={true}>
        <View style={styles.imageModalOverlay}>
          <View style={styles.imageModalContainer}>
            <TouchableOpacity 
              style={styles.imageModalCloseButton}
              onPress={() => setShowImageModal(false)}
            >
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
            
            {attraction?.media?.gallery && attraction.media.gallery.length > 0 && (
              <View style={styles.imageModalContent}>
                <SmartImage
                  source={attraction.media.gallery[selectedImageIndex]?.full_image_url || 
                          attraction.media.gallery[selectedImageIndex]?.image_url}
                  type="general"
                  width={width - 40}
                  height={300}
                  style={styles.modalImage}
                />
                
                {attraction.media.gallery[selectedImageIndex]?.title && (
                  <Text style={styles.imageModalTitle}>
                    {attraction.media.gallery[selectedImageIndex].title}
                  </Text>
                )}
                
                <Text style={styles.imageCounter}>
                  {selectedImageIndex + 1} of {attraction.media.gallery.length}
                </Text>
                
                {attraction.media.gallery.length > 1 && (
                  <View style={styles.imageNavigationContainer}>
                    <TouchableOpacity 
                      style={[styles.imageNavButton, selectedImageIndex === 0 && styles.disabledButton]}
                      onPress={() => selectedImageIndex > 0 && setSelectedImageIndex(selectedImageIndex - 1)}
                      disabled={selectedImageIndex === 0}
                    >
                      <Ionicons name="chevron-back" size={24} color={selectedImageIndex === 0 ? "#666" : "white"} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.imageNavButton, selectedImageIndex === (attraction.media?.gallery?.length || 0) - 1 && styles.disabledButton]}
                      onPress={() => selectedImageIndex < (attraction.media?.gallery?.length || 0) - 1 && setSelectedImageIndex(selectedImageIndex + 1)}
                      disabled={selectedImageIndex === (attraction.media?.gallery?.length || 0) - 1}
                    >
                      <Ionicons name="chevron-forward" size={24} color={selectedImageIndex === (attraction.media?.gallery?.length || 0) - 1 ? "#666" : "white"} />
                    </TouchableOpacity>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    height: HERO_HEIGHT,
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
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 50,
    left: 20,
  },
  quickActions: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
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
    flex: 1,
    alignItems: 'center',
    padding: 8,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  attractionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  attractionLocation: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  headerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  reviewsCount: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
    marginLeft: 4,
  },
  priceBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priceBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 8,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    flex: 1,
  },
  facilitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  facilityText: {
    fontSize: 14,
    fontWeight: '500',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  writeReviewText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewCard: {
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
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
    marginLeft: 4,
  },
  reviewTime: {
    fontSize: 12,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  reviewTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reviewTagText: {
    fontSize: 11,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 16,
  },
  reviewVoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewVoteText: {
    fontSize: 12,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalCancelText: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  ratingSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  textInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 44,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    marginTop: 4,
  },
  modalSubtext: {
    fontSize: 14,
    lineHeight: 18,
  },
  tagsSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 4,
  },
  tagOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerInfo: {
    flex: 1,
  },
  facilityIcon: {
    marginRight: 8,
  },
  noFacilitiesContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noFacilitiesText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  noReviewsContainer: {
    alignItems: 'center',
    padding: 32,
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
    marginBottom: 20,
  },
  firstReviewButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  firstReviewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  galleryContainer: {
    marginTop: 16,
  },
  galleryImageContainer: {
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  galleryImage: {
    borderRadius: 8,
  },
  galleryImageTitle: {
    fontSize: 12,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  // Tag Styles
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
    gap: 8,
  },
  attractionTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  attractionTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Image Modal Styles
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalImage: {
    borderRadius: 12,
  },
  imageModalTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  imageCounter: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
    opacity: 0.8,
  },
  imageNavigationContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 40,
  },
  imageNavButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  // Popular Review Badge Styles
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 4,
    gap: 4,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Rating Summary Styles
  ratingSummary: {
    marginBottom: 16,
  },
  ratingOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  averageRating: {
    fontSize: 24,
    fontWeight: '700',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  totalReviews: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Review Preview Styles
  reviewPreview: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  reviewPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewPreviewText: {
    fontSize: 14,
    lineHeight: 18,
  },
  viewAllReviewsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    gap: 4,
  },
  viewAllReviewsText: {
    fontSize: 16,
    fontWeight: '600',
  },
});