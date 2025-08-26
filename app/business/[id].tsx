import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { getImageUrl, getFallbackImageUrl } from '@/utils/imageUtils';
import {
    addToFavorites,
    DetailedBusiness,
    getBusinessDetails,
    getBusinessOfferings,
    getBusinessOffers,
    getBusinessReviews,
    getUserFavorites,
    isAuthenticated,
    Offering,
    removeFromFavorites,
    Review,
    getAuthToken
} from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import ReviewCard from '@/components/ReviewCard';
import { BusinessDetailsSkeleton } from '@/components/SkeletonLoader';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/CustomAlert';
import { useToastGlobal } from '@/contexts/ToastContext';
import * as Location from 'expo-location';
import { useLocation } from '@/contexts/LocationContext';

const { width } = Dimensions.get('window');

type TabType = 'overview' | 'menu' | 'ratings';

export default function BusinessDetailsScreen() {
  const [business, setBusiness] = useState<DetailedBusiness | null>(null);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<number | null>(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [offeringFavorites, setOfferingFavorites] = useState<{[key: number]: {isFavorite: boolean, favoriteId: number | null}}>({});
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);

  const router = useRouter();
  const params = useLocalSearchParams();
  const businessId = parseInt(params.id as string);
  
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();
  const { showSuccess } = useToastGlobal();
  const { getCoordinatesForAPI } = useLocation();

  useEffect(() => {
    if (businessId) {
      checkAuthenticationAndLoadData();
    }
  }, [businessId]);

  const checkAuthenticationAndLoadData = async () => {
    try {
      const authenticated = await isAuthenticated();
      setIsUserAuthenticated(authenticated);
      console.log('User authenticated:', authenticated);
      
      // Load business data (which now includes favorite status)
      loadBusinessData();
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsUserAuthenticated(false);
      // Still load business data even if auth check fails
      loadBusinessData();
    }
  };

  const loadBusinessData = async () => {
    try {
      setLoading(true);
      console.log('Loading business data for ID:', businessId);

      // Get coordinates from location service
      const coordinates = getCoordinatesForAPI();

      // Load business details with favorite status
      const [businessResponse, offeringsResponse, reviewsResponse, offersResponse] = await Promise.all([
        getBusinessDetails(businessId, coordinates.latitude, coordinates.longitude),
        getBusinessOfferings(businessId, coordinates.latitude, coordinates.longitude),
        getBusinessReviews(businessId),
        getBusinessOffers(businessId, coordinates.latitude, coordinates.longitude)
      ]);

      console.log('Business details response:', businessResponse);
      console.log('Offerings response:', offeringsResponse);

      if (businessResponse.success && businessResponse.data) {
        setBusiness(businessResponse.data);
        // Set favorite status from API response
        setIsFavorite(businessResponse.data.is_favorite || false);
        console.log('Business favorite status from API:', businessResponse.data.is_favorite);
      } else {
        setError('Failed to load business details');
      }

      if (offeringsResponse.success) {
        setOfferings(offeringsResponse.data.offerings);
        
        // Set offering favorites from API responses
        const offeringFavs: {[key: number]: {isFavorite: boolean, favoriteId: number | null}} = {};
        offeringsResponse.data.offerings.forEach((offering: Offering) => {
          if (offering.is_favorite !== undefined) {
            offeringFavs[offering.id] = {
              isFavorite: offering.is_favorite,
              favoriteId: null // We'll get this when needed for removal
            };
          }
        });
        setOfferingFavorites(offeringFavs);
        console.log('Offering favorites from API:', offeringFavs);
      }

      if (reviewsResponse.success) {
        setReviews(reviewsResponse.data.reviews);
      }

      if (offersResponse.success) {
        setOffers(offersResponse.data);
      }

    } catch (error) {
      console.error('Error loading business data:', error);
      setError('Failed to load business details');
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
        message: 'Create an account to save your favorite businesses and get personalized recommendations',
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
            const businessFavorite = favoritesResponse.data.favorites.find(
              fav => fav.type === 'business' && fav.business?.id === businessId
            );
            favoriteIdToRemove = businessFavorite?.id || null;
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
        console.log('Adding to favorites. businessId:', businessId);
        // Add to favorites
        const response = await addToFavorites('business', businessId);
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

  const toggleOfferingFavorite = async (offeringId: number) => {
    if (!isUserAuthenticated) {
      showAlert({
        type: 'info',
        title: 'Sign Up to Save Favorites',
        message: 'Create an account to save your favorite items and get personalized recommendations',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Up', onPress: () => router.push('/welcome' as any) }
        ]
      });
      return;
    }

    try {
      const currentFav = offeringFavorites[offeringId];
      
      if (currentFav?.isFavorite) {
        // If we have favoriteId, use it; otherwise get it from getUserFavorites
        let favoriteIdToRemove = currentFav.favoriteId;
        
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
          // Remove from favorites
          const response = await removeFromFavorites(favoriteIdToRemove);
          if (response.success) {
            setOfferingFavorites(prev => ({
              ...prev,
              [offeringId]: { isFavorite: false, favoriteId: null }
            }));
            showSuccess('Removed from favorites');
            console.log('Successfully removed offering from favorites');
          } else {
            throw new Error(response.message || 'Failed to remove from favorites');
          }
        }
      } else {
        // Add to favorites
        const response = await addToFavorites('offering', offeringId);
        if (response.success) {
          setOfferingFavorites(prev => ({
            ...prev,
            [offeringId]: { isFavorite: true, favoriteId: response.data.favorite_id }
          }));
          showSuccess('Added to favorites');
          console.log('Successfully added offering to favorites');
        } else {
          // Handle 409 conflict error (already in favorites)
          if (response.message && response.message.includes('already')) {
            setOfferingFavorites(prev => ({
              ...prev,
              [offeringId]: { isFavorite: true, favoriteId: null }
            }));
            showSuccess('Already in favorites');
            console.log('Offering already in favorites');
          } else {
            throw new Error(response.message || 'Failed to add to favorites');
          }
        }
      }
    } catch (error: any) {
      console.error('Error toggling offering favorite:', error);
      
      // Handle specific error cases
      if (error.message && error.message.includes('409')) {
        // 409 conflict - already in favorites
        setOfferingFavorites(prev => ({
          ...prev,
          [offeringId]: { isFavorite: true, favoriteId: null }
        }));
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
    }
  };

  const handleCall = () => {
    if (business?.business_phone) {
      Linking.openURL(`tel:${business.business_phone}`);
    }
  };

  const handleWebsite = () => {
    if (business?.website_url) {
      Linking.openURL(business.website_url);
    }
  };

  const handleDirections = () => {
    if (business?.latitude && business?.longitude) {
      const url = `https://maps.google.com/?q=${business.latitude},${business.longitude}`;
      Linking.openURL(url);
    }
  };

  const handleWriteReview = async () => {
    if (!isUserAuthenticated) {
      showAlert({
        type: 'info',
        title: 'Sign Up to Write Reviews',
        message: 'Create an account to share your experience and help others discover great places',
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
        type: 'business',
        id: businessId.toString(),
        businessName: business?.business_name || 'Business'
      }
    });
  };

  const getPriceRangeText = (priceRange: number) => {
    const ranges = {
      1: '$',
      2: '$$',
      3: '$$$',
      4: '$$$$'
    };
    return ranges[priceRange as keyof typeof ranges] || '$$';
  };

  const getOfferingsTabName = () => {
    if (!business?.category?.name) return 'MENU';
    
    const categoryName = business.category.name.toLowerCase();
    
    if (categoryName.includes('restaurant') || categoryName.includes('food') || categoryName.includes('cafe') || categoryName.includes('coffee')) {
      return 'MENU';
    } else if (categoryName.includes('clothing') || categoryName.includes('fashion') || categoryName.includes('apparel') || categoryName.includes('store') || categoryName.includes('shop')) {
      return 'PRODUCTS';
    } else if (categoryName.includes('service') || categoryName.includes('repair') || categoryName.includes('salon') || categoryName.includes('spa')) {
      return 'SERVICES';
    } else {
      return 'OFFERINGS';
    }
  };

  const formatOpeningHours = (hours: Record<string, string>) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.map(day => ({
      day,
      hours: hours[day.toLowerCase()] || 'Closed'
    }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'menu':
        return renderMenuTab();
      case 'ratings':
        return renderRatingsTab();
      default:
        return renderOverviewTab();
    }
  };

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Business Info Card */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.businessInfoHeader}>
          <View style={styles.businessInfoLeft}>
            <Text style={[styles.businessInfoName, { color: colors.text }]}>
              {business?.business_name}
            </Text>
            <Text style={[styles.businessInfoCategory, { color: colors.icon }]}>
              {business?.category.name} • {business?.subcategory.name}
            </Text>
            <View style={styles.businessInfoMeta}>
              <View style={styles.businessInfoRating}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={[styles.businessInfoRatingText, { color: colors.text }]}>
                  {business?.overall_rating} ({business?.total_reviews} reviews)
                </Text>
              </View>
              <Text style={[styles.businessInfoPrice, { color: colors.tint }]}>
                {getPriceRangeText(business?.price_range || 2)}
              </Text>
            </View>
          </View>
          {business?.is_verified && (
            <View style={styles.businessVerifiedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.businessVerifiedText}>Verified</Text>
            </View>
          )}
        </View>
      </View>

      {/* Location and Contact */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Location And Contact</Text>
        
        <TouchableOpacity style={styles.contactItem} onPress={handleDirections}>
          <View style={[styles.contactIconContainer, { backgroundColor: '#2196F3' }]}>
            <Ionicons name="location" size={20} color="white" />
          </View>
          <View style={styles.contactTextContainer}>
            <Text style={[styles.contactLabel, { color: colors.icon }]}>Address</Text>
            <Text style={[styles.contactText, { color: colors.text }]} numberOfLines={2}>
              {business?.full_address}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.icon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
          <View style={[styles.contactIconContainer, { backgroundColor: '#4CAF50' }]}>
            <Ionicons name="call" size={20} color="white" />
          </View>
          <View style={styles.contactTextContainer}>
            <Text style={[styles.contactLabel, { color: colors.icon }]}>Phone</Text>
            <Text style={[styles.contactText, { color: colors.text }]}>
              {business?.business_phone}
            </Text>
          </View>
        </TouchableOpacity>

        {business?.website_url && (
          <TouchableOpacity style={styles.contactItem} onPress={handleWebsite}>
            <View style={[styles.contactIconContainer, { backgroundColor: '#FF9800' }]}>
              <Ionicons name="globe" size={20} color="white" />
            </View>
            <View style={styles.contactTextContainer}>
              <Text style={[styles.contactLabel, { color: colors.icon }]}>Website</Text>
              <Text style={[styles.contactText, { color: colors.text }]} numberOfLines={1}>
                {business.website_url}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.icon} />
          </TouchableOpacity>
        )}

        <View style={styles.socialLinks}>
          <Text style={[styles.socialTitle, { color: colors.text }]}>Follow Us</Text>
          <View style={styles.socialIconsContainer}>
            {business?.website_url && (
              <TouchableOpacity style={[styles.socialIcon, { backgroundColor: '#FF9800' }]} onPress={handleWebsite}>
                <Ionicons name="globe" size={20} color="white" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.socialIcon, { backgroundColor: '#E4405F' }]}>
              <Ionicons name="logo-instagram" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialIcon, { backgroundColor: '#1877F2' }]}>
              <Ionicons name="logo-facebook" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* About this Business */}
      {business?.description && (
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About this Business</Text>
          <Text style={[styles.description, { color: colors.text }]}>
            {business.description}
          </Text>
        </View>
      )}

      {/* Opening Hours */}
      {business?.opening_hours && (
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Opening Hours</Text>
          <View style={styles.hoursContainer}>
            {formatOpeningHours(business.opening_hours).map((item, index) => (
              <View key={index} style={styles.hourItem}>
                <Text style={[styles.dayText, { color: colors.text }]}>{item.day}</Text>
                <Text style={[styles.hoursText, { color: item.hours === 'Closed' ? '#ef4444' : colors.tint }]}>
                  {item.hours}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Overall Rating */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.ratingHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Overall rating</Text>
          <TouchableOpacity 
            style={[styles.writeReviewButton, { backgroundColor: colors.buttonPrimary }]}
            onPress={handleWriteReview}
          >
            <Text style={[styles.writeReviewText, { color: colors.buttonText }]}>Write a review</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.ratingContainer}>
          <View style={styles.ratingMainInfo}>
            <Text style={[styles.ratingNumber, { color: colors.text }]}>
              {business?.overall_rating}
            </Text>
            <View style={styles.ratingStarsContainer}>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name="star"
                    size={16}
                    color={star <= Math.floor(parseFloat(business?.overall_rating || '0')) ? '#FFD700' : colors.icon}
                  />
                ))}
              </View>
              <Text style={[styles.reviewCount, { color: colors.icon }]}>
                Based on {business?.total_reviews} review{business?.total_reviews !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderMenuItemCard = ({ item }: { item: Offering }) => {
    const offeringFav = offeringFavorites[item.id] || { isFavorite: false, favoriteId: null };
    return (
      <TouchableOpacity 
        style={[styles.menuItemCard, { backgroundColor: colors.card }]}
        onPress={() => router.push(`/offering/${businessId}/${item.id}` as any)}
      >
        {item.image_url ? (
          <View style={styles.menuItemCardHeader}>
            <Image 
              source={{ uri: getImageUrl(item.image_url) }} 
              style={styles.menuItemCardImage}
            />
            <TouchableOpacity
              style={styles.menuItemCardFavorite}
              onPress={(e) => {
                e.stopPropagation();
                toggleOfferingFavorite(item.id);
              }}
            >
              <Ionicons 
                name={offeringFav.isFavorite ? "heart" : "heart-outline"} 
                size={16} 
                color={offeringFav.isFavorite ? "#FF6B6B" : "white"} 
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.menuItemCardPlaceholder}>
            <Ionicons 
              name={item.offering_type === 'product' ? 'cube-outline' : 'briefcase-outline'} 
              size={40} 
              color={colors.icon} 
            />
            <TouchableOpacity
              style={styles.menuItemCardFavoriteNoImage}
              onPress={(e) => {
                e.stopPropagation();
                toggleOfferingFavorite(item.id);
              }}
            >
              <Ionicons 
                name={offeringFav.isFavorite ? "heart" : "heart-outline"} 
                size={16} 
                color={offeringFav.isFavorite ? "#FF6B6B" : colors.icon} 
              />
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.menuItemCardContent}>
          <Text style={[styles.menuItemCardName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          
          <Text style={[styles.menuItemCardDescription, { color: colors.icon }]} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.menuItemCardFooter}>
            <Text style={[styles.menuItemCardPrice, { color: colors.tint }]}>
              {item.price_range}
            </Text>
            
            <View style={styles.menuItemCardRating}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={[styles.menuItemCardRatingText, { color: colors.text }]}>
                {parseFloat(item.average_rating).toFixed(1)}
              </Text>
            </View>
          </View>
          
          <View style={styles.menuItemCardBadges}>
            {item.is_popular && (
              <View style={[styles.menuItemCardBadge, styles.popularBadge]}>
                <Ionicons name="flame" size={8} color="white" />
                <Text style={styles.cardBadgeText}>Popular</Text>
              </View>
            )}
            
            {item.is_featured && (
              <View style={[styles.menuItemCardBadge, styles.featuredBadge]}>
                <Ionicons name="star" size={8} color="white" />
                <Text style={styles.cardBadgeText}>Featured</Text>
              </View>
            )}
            
            {!item.is_available && (
              <View style={[styles.menuItemCardBadge, styles.unavailableBadge]}>
                <Text style={styles.cardBadgeText}>Unavailable</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMenuTab = () => (
    <View style={styles.tabContent}>
      {offerings.length > 0 ? (
        <View>
          <Text style={[styles.menuHeader, { color: colors.text }]}>
            {getOfferingsTabName()} ({offerings.length} items)
          </Text>
          <FlatList
            data={offerings}
            renderItem={renderMenuItemCard}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.menuRow}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      ) : (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
            <Ionicons name="restaurant-outline" size={48} color={colors.icon} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No {getOfferingsTabName().toLowerCase()} Available</Text>
          <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
            This business hasn't added their {getOfferingsTabName().toLowerCase()} yet. Check back later!
          </Text>
        </View>
      )}
    </View>
  );

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

  const renderRatingsTab = () => (
    <View style={styles.tabContent}>
      {reviews.length > 0 ? (
        <View>
          <Text style={[styles.reviewsHeader, { color: colors.text }]}>
            Customer Reviews ({reviews.length})
          </Text>
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
            Be the first to share your experience with this business!
          </Text>
          <TouchableOpacity 
            style={[styles.writeFirstReviewButton, { backgroundColor: colors.buttonPrimary }]}
            onPress={handleWriteReview}
          >
            <Text style={[styles.writeFirstReviewText, { color: colors.buttonText }]}>Write the First Review</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <BusinessDetailsSkeleton colors={colors} />
      </View>
    );
  }

  if (error || !business) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Business Not Found</Text>
          <Text style={[styles.errorSubtitle, { color: colors.icon }]}>
            {error || 'Unable to load business information'}
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.buttonPrimary }]}
            onPress={loadBusinessData}
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
      
      {/* Header with Hero Image */}
      <View style={styles.heroSection}>
        <Image 
          source={{ uri: getImageUrl(business.logo_image?.image_url) || getFallbackImageUrl('business') }} 
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
          
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={toggleFavorite}
            disabled={favoriteLoading}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? "#FF6B6B" : "white"} 
            />
          </TouchableOpacity>

          <View style={styles.heroContent}>
            <Text style={styles.businessName}>{business.business_name}</Text>
            <Text style={styles.businessSubtitle}>
              {business.category.name} • {business.subcategory.name}
            </Text>
            <View style={styles.businessMeta}>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingBadgeText}>{business.overall_rating}</Text>
                <Text style={styles.ratingBadgeText}>({business.total_reviews})</Text>
              </View>
              <Text style={styles.priceRange}>{getPriceRangeText(business.price_range)}</Text>
              {business.is_verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Quick Actions Bar */}
      <View style={[styles.quickActions, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
          <View style={[styles.actionIcon, { backgroundColor: '#4CAF50' }]}>
            <Ionicons name="call" size={20} color="white" />
          </View>
          <Text style={[styles.actionLabel, { color: colors.text }]}>Call</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleDirections}>
          <View style={[styles.actionIcon, { backgroundColor: '#2196F3' }]}>
            <Ionicons name="navigate" size={20} color="white" />
          </View>
          <Text style={[styles.actionLabel, { color: colors.text }]}>Directions</Text>
        </TouchableOpacity>
        
        {business?.website_url && (
          <TouchableOpacity style={styles.actionButton} onPress={handleWebsite}>
            <View style={[styles.actionIcon, { backgroundColor: '#FF9800' }]}>
              <Ionicons name="globe" size={20} color="white" />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Website</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.actionButton} onPress={handleWriteReview}>
          <View style={[styles.actionIcon, { backgroundColor: colors.buttonPrimary }]}>
            <Ionicons name="star" size={20} color="white" />
          </View>
          <Text style={[styles.actionLabel, { color: colors.text }]}>Review</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabBar, { backgroundColor: colors.card }]}>
        {[
          { key: 'overview', label: 'OVERVIEW' },
          { key: 'menu', label: getOfferingsTabName() },
          { key: 'ratings', label: 'RATINGS' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabItem,
              activeTab === tab.key && { borderBottomColor: colors.tint }
            ]}
            onPress={() => setActiveTab(tab.key as TabType)}
          >
            <Text style={[
              styles.tabLabel,
              { color: activeTab === tab.key ? colors.tint : colors.icon }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
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
    fontSize: 16,
    fontWeight: '600',
  },
  heroSection: {
    height: 320,
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
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 50,
    right: 20,
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  businessName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  businessSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginBottom: 12,
  },
  businessMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
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
  priceRange: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contactText: {
    flex: 1,
    fontSize: 16,
  },
  socialLinks: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  hourItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  hoursText: {
    fontSize: 16,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  writeReviewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  writeReviewText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewCount: {
    fontSize: 14,
  },
  menuItem: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  menuItemHeader: {
    position: 'relative',
    height: 150,
    marginBottom: 12,
  },
  menuItemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  menuItemFavorite: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
  },
  menuItemContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  menuItemContentWithFavorite: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  menuItemFavoriteNoImage: {
    padding: 8,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  menuItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuItemRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewCountText: {
    fontSize: 12,
    marginLeft: 2,
  },
  menuItemDetails: {
    marginBottom: 12,
  },
  menuItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  menuItemType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  menuItemTypeText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  menuItemCurrency: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  menuItemCurrencyText: {
    fontSize: 10,
    fontWeight: '600',
  },
  menuItemBadges: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  menuItemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  popularBadge: {
    backgroundColor: '#FF6B6B',
  },
  featuredBadge: {
    backgroundColor: '#4CAF50',
  },
  unavailableBadge: {
    backgroundColor: '#9E9E9E',
  },
  badgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  availabilityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  availableIndicator: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availabilityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
    opacity: 0.7,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    paddingVertical: 20,
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
    paddingVertical: 8,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  businessInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  businessInfoLeft: {
    flex: 1,
  },
  businessInfoName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  businessInfoCategory: {
    fontSize: 16,
    marginBottom: 12,
  },
  businessInfoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  businessInfoRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  businessInfoRatingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  businessInfoPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  businessVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  businessVerifiedText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  socialTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  socialIconsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hoursContainer: {
    gap: 8,
  },
  ratingMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ratingStarsContainer: {
    alignItems: 'flex-start',
  },
  menuHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  menuItemMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  menuItemTags: {
    flexDirection: 'row',
    gap: 8,
  },
  menuTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  menuTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  reviewUserInfo: {
    marginLeft: 12,
  },
  reviewRatingContainer: {
    alignItems: 'flex-end',
  },
  reviewRatingText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  writeFirstReviewButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
  },
  writeFirstReviewText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // New card layout styles
  menuRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  menuItemCard: {
    width: (width - 48) / 2 - 8, // Two columns with padding
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  menuItemCardHeader: {
    position: 'relative',
    height: 100,
  },
  menuItemCardImage: {
    width: '100%',
    height: '100%',
  },
  menuItemCardFavorite: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 6,
  },
  menuItemCardPlaceholder: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    position: 'relative',
  },
  menuItemCardFavoriteNoImage: {
    position: 'absolute',
    top: 6,
    right: 6,
    padding: 6,
  },
  menuItemCardContent: {
    padding: 12,
  },
  menuItemCardName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  menuItemCardDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  menuItemCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  menuItemCardPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  menuItemCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  menuItemCardRatingText: {
    fontSize: 11,
    fontWeight: '600',
  },
  menuItemCardBadges: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  menuItemCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
  },
  cardBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
