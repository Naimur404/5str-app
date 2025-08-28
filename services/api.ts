import { API_CONFIG, getApiUrl } from '@/constants/Api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TopService, CategoriesResponse, TodayTrendingResponse, NotificationsResponse, NotificationActionResponse } from '../types/api';

/**
 * API Service with Smart Authentication
 * 
 * Authentication Strategy:
 * - ALL API calls will send the authentication token IF the user is logged in
 * - This enables server-side user analytics and personalized responses for logged-in users
 * - requireAuth parameter only controls whether the API call should FAIL if no token exists
 * - Public endpoints (requireAuth=false) work for both logged-in and guest users
 * - Protected endpoints (requireAuth=true) require authentication and will fail without token
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// Types
export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  profile_image: string | null;
  current_latitude: number | null;
  current_longitude: number | null;
  trust_level: number;
  total_points: number;
  total_favorites: number;
  total_reviews: number;
  user_level: {
    level: number;
    level_name: string;
    level_description: string;
    total_score: number;
    progress_to_next_level: number;
    points_contribution: number;
    activity_contribution: number;
    trust_contribution: number;
    next_level_threshold: number;
  };
  is_active: boolean;
  role: string;
  email_verified_at: string;
}

export interface Review {
  id: number;
  overall_rating: number;
  title: string | null;
  review_text: string;
  is_recommended: boolean;
  helpful_count: number;
  not_helpful_count: number;
  status: string;
  created_at: string;
  type: 'business' | 'offering';
  user_vote_status?: {
    has_voted: boolean;
    user_vote: boolean;
  };
  user: {
    id: number;
    name: string;
    profile_image: string | null;
    trust_level: number;
  };
  business?: {
    id: number;
    business_name: string;
    slug: string;
    category_name: string;
    logo_image: string;
  };
  offering?: {
    id: number;
    name: string;
    offering_type: string;
    business_name: string;
    image_url: string | null;
  };
}

export interface SubmitReviewRequest {
  reviewable_type: 'business' | 'offering';
  reviewable_id: number;
  overall_rating: number;
  service_rating?: number;
  quality_rating?: number;
  value_rating?: number;
  title?: string;
  review_text: string;
  pros?: string[];
  cons?: string[];
  visit_date?: string;
  amount_spent?: number;
  party_size?: number;
  is_recommended?: boolean;
  is_verified_visit?: boolean;
  images?: string[]; // Base64 encoded images with data URL prefix
}

export interface SubmitReviewResponse {
  success: boolean;
  data: {
    review: Review;
  };
  message?: string;
}

export interface UserResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
  };
}

export interface ReviewsResponse {
  success: boolean;
  data: {
    reviews: Review[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      has_more: boolean;
    };
  };
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  level: number;
  icon_image: string;
  banner_image: string | null;
  description: string | null;
  color_code: string;
  sort_order: number;
  is_featured: boolean;
  is_popular: boolean;
  is_active: boolean;
  total_businesses: number;
}

export interface Business {
  id: number;
  business_name: string;
  slug: string;
  description: string;
  category_id: number;
  subcategory_id: number;
  owner_user_id: number;
  business_email: string;
  business_phone: string;
  website_url: string | null;
  full_address: string;
  latitude: string;
  longitude: string;
  city: string;
  area: string;
  landmark: string;
  opening_hours: {
    [key: string]: string;
  };
  price_range: number;
  has_delivery: boolean;
  has_pickup: boolean;
  has_parking: boolean;
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;
  approval_status: string;
  rejection_reason: string | null;
  approved_by: number | null;
  approved_at: string | null;
  pending_changes: any;
  has_pending_changes: boolean;
  overall_rating: string;
  total_reviews: number;
  discovery_score: string;
  is_favorite: boolean;
  category: Category;
  logo_image: {
    id: number;
    business_id: number;
    image_url: string;
    image_type: string;
    sort_order: number;
    is_primary: boolean;
  } | null;
}

export interface CategoryBusinessesResponse {
  success: boolean;
  data: {
    category: Category;
    businesses: Business[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      has_more: boolean;
    };
    filters_applied: {
      location: string | null;
      min_rating: number | null;
      price_range: number | null;
      sort: string;
    };
  };
}

// Business Details Interfaces
export interface BusinessImage {
  id: number;
  business_id: number;
  image_url: string;
  image_type: string;
  sort_order: number;
  is_primary: boolean;
}

export interface BusinessOwner {
  id: number;
  name: string;
  email: string;
  phone: string;
  profile_image: string | null;
  current_latitude: string | null;
  current_longitude: string | null;
  city: string;
  total_points: number;
  total_reviews_written: number;
  trust_level: number;
  email_verified_at: string | null;
  is_active: boolean;
}

export interface DetailedBusiness {
  id: number;
  business_name: string;
  slug: string;
  description: string;
  category_id: number;
  subcategory_id: number;
  owner_user_id: number;
  business_email: string;
  business_phone: string;
  website_url: string | null;
  full_address: string;
  latitude: string;
  longitude: string;
  city: string;
  area: string;
  landmark: string;
  opening_hours: Record<string, string>;
  price_range: number;
  has_delivery: boolean;
  has_pickup: boolean;
  has_parking: boolean;
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;
  approval_status: string;
  rejection_reason: string | null;
  approved_by: number | null;
  approved_at: string | null;
  pending_changes: any;
  has_pending_changes: boolean;
  overall_rating: string;
  total_reviews: number;
  discovery_score: string;
  is_favorite: boolean;
  category: Category;
  subcategory: Category;
  owner: BusinessOwner;
  images: BusinessImage[];
  logo_image: BusinessImage | null;
  cover_image: BusinessImage | null;
  gallery_images: BusinessImage[];
}

export interface Offering {
  id: number;
  name: string;
  description: string;
  offering_type: string;
  price: string;
  price_max: string | null;
  price_range: string;
  currency: string;
  image_url: string | null;
  is_available: boolean;
  is_popular: boolean;
  is_featured: boolean;
  average_rating: string;
  total_reviews: number;
  is_favorite: boolean;
  category: any | null;
  business?: {
    id: number;
    business_name: string;
    slug: string;
  };
}

export interface BusinessDetailsResponse {
  success: boolean;
  data: DetailedBusiness;
}

export interface BusinessOfferingsResponse {
  success: boolean;
  data: {
    business_id: string;
    offerings: Offering[];
  };
}

export interface BusinessReviewsResponse {
  success: boolean;
  data: {
    business: {
      id: number;
      business_name: string;
      overall_rating: string;
      total_reviews: number;
    };
    reviews: Review[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      has_more: boolean;
    };
  };
}

export interface OfferingDetailsResponse {
  success: boolean;
  data: Offering;
}

export interface OfferingReviewsResponse {
  success: boolean;
  data: {
    offering: {
      id: number;
      name: string;
      offering_type: string;
      average_rating: string;
      total_reviews: number;
    };
    reviews: Review[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      has_more: boolean;
    };
  };
}

// Offer Details Interfaces
export interface OfferBusiness {
  id: number;
  business_name: string;
  slug: string;
  logo_image: string;
}

export interface OfferDetails {
  id: number;
  title: string;
  description: string;
  offer_type: string;
  discount_percentage: string | null;
  discount_amount: string | null;
  minimum_spend: string | null;
  offer_code: string | null;
  usage_limit: number | null;
  current_usage: number;
  valid_from: string;
  valid_to: string;
  applicable_days: string | null;
  banner_image: string | null;
  is_featured: boolean;
  is_active: boolean;
  is_expired: boolean;
  remaining_days: number;
  is_valid_today: boolean;
  can_be_used: boolean;
  user_has_used: boolean;
  user_usage_count: number;
  business: OfferBusiness;
}

export interface OfferDetailsResponse {
  success: boolean;
  data: OfferDetails;
  message?: string;
}

// Favorites Interfaces
export interface FavoriteOffering {
  id: number;
  name: string;
  business_id: number;
  offering_type: string;
  price_range: string;
  average_rating: string;
  total_reviews: number;
  business_name: string;
  image_url: string | null;
}

export interface FavoriteBusiness {
  id: number;
  business_name: string;
  slug: string;
  landmark: string;
  overall_rating: string;
  total_reviews: number;
  price_range: number;
  category_name: string;
  logo_image: string;
}

export interface Favorite {
  id: number;
  type: 'offering' | 'business';
  favorited_at: string;
  offering?: FavoriteOffering;
  business?: FavoriteBusiness;
}

export interface FavoritesResponse {
  success: boolean;
  data: {
    favorites: Favorite[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      has_more: boolean;
    };
  };
}

export interface AddFavoriteResponse {
  success: boolean;
  message: string;
  data: {
    favorite_id: number;
  };
}

export interface DeleteFavoriteResponse {
  success: boolean;
  message: string;
}

// Top Services Interfaces
export interface TopServicesResponse {
  success: boolean;
  data: {
    services: TopService[];
    location: {
      latitude: number;
      longitude: number;
      radius_km: number;
    };
  };
}

// Storage helpers
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const setAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('auth_token', token);
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
};

export const removeAuthToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('auth_token');
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

// API call helper with JSON validation
const makeApiCall = async (endpoint: string, options: RequestInit = {}, requireAuth: boolean = false): Promise<any> => {
  // Always check for token availability - if user is logged in, send token for analytics
  const token = await getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'ReactNative/5StrApp',
    ...(options.headers as Record<string, string>),
  };

  // If user is logged in (has token), always send it for user analytics
  // If requireAuth is true and no token, throw error
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (requireAuth) {
    throw new Error('Authentication required. Please login to continue.');
  }

  const url = getApiUrl(endpoint);
  console.log('API Call:', {
    url,
    method: options.method || 'GET',
    headers: headers,
    body: options.body,
    hasToken: !!token,
    requireAuth,
    sendingTokenForAnalytics: !!token && !requireAuth
  });

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    console.error('Network error:', error);
    throw new Error('Network error. Please check your internet connection.');
  }

  console.log('API Response:', {
    url,
    status: response.status,
    ok: response.ok,
    contentType: response.headers.get('content-type')
  });

  // Get the raw response text first
  let responseText: string;
  try {
    responseText = await response.text();
  } catch (error) {
    console.error('Failed to read response text:', error);
    throw new Error('Failed to read response from server.');
  }

  console.log('Raw response text (first 500 chars):', responseText.substring(0, 500));

  // Validate that we received JSON
  const contentType = response.headers.get('content-type');
  const isJsonContentType = contentType && contentType.includes('application/json');
  
  if (!isJsonContentType) {
    console.warn('Response is not JSON, content-type:', contentType);
    
    // Check if response looks like HTML (common for error pages)
    if (responseText.trim().startsWith('<')) {
      if (responseText.includes('Imunify360')) {
        throw new Error('Request blocked by security system. Please try again later.');
      } else if (responseText.includes('404') || responseText.includes('Not Found')) {
        throw new Error('API endpoint not found. Please update the app.');
      } else if (responseText.includes('500') || responseText.includes('Internal Server Error')) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error('Server returned an HTML page instead of JSON data.');
      }
    }
    
    // If it's not HTML, it might be plain text error
    throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 100)}`);
  }

  // Parse JSON response
  let responseData: any;
  try {
    if (responseText.trim() === '') {
      responseData = {};
    } else {
      responseData = JSON.parse(responseText);
    }
    console.log('Parsed response data:', responseData);
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    console.error('Response text that failed to parse:', responseText);
    throw new Error('Server returned invalid JSON data.');
  }

  // Validate that response has expected structure
  if (typeof responseData !== 'object' || responseData === null) {
    throw new Error('Server returned invalid response format.');
  }

  if (!response.ok) {
    // For specific status codes, return the parsed response with success: false
    if (response.status === 409) {
      return {
        success: false,
        message: responseData?.message || 'This item is already in your favorites',
        status: response.status
      };
    }
    
    if (response.status === 401) {
      return {
        success: false,
        message: responseData?.message || 'Authentication required',
        status: response.status
      };
    }
    
    if (response.status === 422) {
      return {
        success: false,
        message: responseData?.message || 'Validation failed',
        errors: responseData?.errors || {},
        status: response.status
      };
    }
    
    // For other errors, throw with more info
    const errorMessage = responseData?.message || `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }

  // Validate successful response structure
  if (responseData.success === false) {
    throw new Error(responseData.message || 'Request failed');
  }

  return responseData;
};

// API functions
export const login = async (email: string, password: string): Promise<any> => {
  const response = await makeApiCall(API_CONFIG.ENDPOINTS.LOGIN, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, false);
  
  if (response.data?.token) {
    await setAuthToken(response.data.token);
  }
  
  return response;
};

export const register = async (userData: any): Promise<any> => {
  const response = await makeApiCall(API_CONFIG.ENDPOINTS.REGISTER, {
    method: 'POST',
    body: JSON.stringify(userData),
  }, false);
  
  if (response.data?.token) {
    await setAuthToken(response.data.token);
  }
  
  return response;
};

export const getUserProfile = async (): Promise<UserResponse> => {
  return makeApiCall(API_CONFIG.ENDPOINTS.USER_PROFILE, {}, true);
};

// Update Profile interface
export interface UpdateProfilePayload {
  name: string;
  phone: string;
  city: string;
  latitude: number;
  longitude: number;
  profile_image: string;
}

export const updateProfile = async (payload: UpdateProfilePayload): Promise<UserResponse> => {
  return makeApiCall(API_CONFIG.ENDPOINTS.UPDATE_PROFILE, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, true);
};

export const getUserReviews = async (page: number = 1): Promise<ReviewsResponse> => {
  return makeApiCall(`${API_CONFIG.ENDPOINTS.USER_REVIEWS}?page=${page}`, {}, true);
};

export const getCategoryBusinesses = async (
  categoryId: number, 
  page: number = 1,
  latitude?: number,
  longitude?: number
): Promise<CategoryBusinessesResponse> => {
  let url = `${API_CONFIG.ENDPOINTS.CATEGORY_BUSINESSES}/${categoryId}/businesses?page=${page}`;
  
  // Add latitude and longitude if provided
  if (latitude !== undefined && longitude !== undefined) {
    url += `&latitude=${latitude}&longitude=${longitude}`;
  }
  
  // Don't require auth but send token if available for analytics
  return makeApiCall(url, {}, false);
};

export const logout = async (): Promise<{success: boolean; message?: string}> => {
  try {
    // Call the logout API endpoint to invalidate the token on the server
    const response = await makeApiCall(API_CONFIG.ENDPOINTS.LOGOUT, {
      method: 'POST',
    }, true); // requireAuth = true since we need to send the token to logout

    // Remove the token from local storage regardless of API response
    await removeAuthToken();

    return {
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error) {
    console.error('Error during logout:', error);
    
    // Even if API call fails, remove local token
    await removeAuthToken();
    
    return {
      success: true,
      message: 'Logged out (local token cleared)'
    };
  }
};

// Business Details API Functions
export const getBusinessDetails = async (
  businessId: number, 
  latitude?: number, 
  longitude?: number
): Promise<BusinessDetailsResponse> => {
  let url = `${API_CONFIG.ENDPOINTS.BUSINESS_DETAILS}/${businessId}`;
  
  if (latitude !== undefined && longitude !== undefined) {
    url += `?latitude=${latitude}&longitude=${longitude}`;
  }
  
  // Send token if available for user-specific data and analytics
  return makeApiCall(url, {}, false);
};

export const getBusinessOfferings = async (
  businessId: number, 
  latitude?: number, 
  longitude?: number
): Promise<BusinessOfferingsResponse> => {
  let url = `${API_CONFIG.ENDPOINTS.BUSINESS_OFFERINGS}/${businessId}/offerings`;
  
  if (latitude !== undefined && longitude !== undefined) {
    url += `?latitude=${latitude}&longitude=${longitude}`;
  }
  
  // Send token if available for user-specific data and analytics
  return makeApiCall(url, {}, false);
};

export const getBusinessReviews = async (businessId: number, page: number = 1): Promise<BusinessReviewsResponse> => {
  // Send token if available for vote status and analytics
  return makeApiCall(`${API_CONFIG.ENDPOINTS.BUSINESS_REVIEWS}/${businessId}/reviews?page=${page}`, {}, false);
};

export const getBusinessOffers = async (
  businessId: number, 
  latitude?: number, 
  longitude?: number
): Promise<any> => {
  let url = `${API_CONFIG.ENDPOINTS.BUSINESS_OFFERS}/${businessId}/offers`;
  
  if (latitude !== undefined && longitude !== undefined) {
    url += `?latitude=${latitude}&longitude=${longitude}`;
  }
  
  // Send token if available for user-specific data and analytics
  return makeApiCall(url, {}, false);
};

export const getOfferingDetails = async (
  businessId: number, 
  offeringId: number, 
  latitude?: number, 
  longitude?: number
): Promise<OfferingDetailsResponse> => {
  let url = `${API_CONFIG.ENDPOINTS.OFFERING_DETAILS}/${businessId}/offerings/${offeringId}`;
  
  if (latitude !== undefined && longitude !== undefined) {
    url += `?latitude=${latitude}&longitude=${longitude}`;
  }
  
  // Send token if available for user-specific data and analytics
  return makeApiCall(url, {}, false);
};

export const getOfferingReviews = async (businessId: number, offeringId: number, page: number = 1): Promise<OfferingReviewsResponse> => {
  // Send token if available for vote status and analytics
  return makeApiCall(`${API_CONFIG.ENDPOINTS.OFFERING_REVIEWS}/${businessId}/offerings/${offeringId}/reviews?page=${page}`, {}, false);
};

// Offer Details API Functions
export const getOfferDetails = async (offerId: number): Promise<OfferDetailsResponse> => {
  // Send token if available for user-specific data and analytics
  return makeApiCall(`${API_CONFIG.ENDPOINTS.OFFER_DETAILS}/${offerId}`, {}, false);
};

// Favorites API Functions
export const getUserFavorites = async (page: number = 1): Promise<FavoritesResponse> => {
  console.log('Getting user favorites, page:', page);
  const result = await makeApiCall(`${API_CONFIG.ENDPOINTS.USER_FAVORITES}?page=${page}`, {}, true);
  console.log('getUserFavorites result:', result);
  return result;
};

export const addToFavorites = async (favoritable_type: 'offering' | 'business', favoritable_id: number): Promise<AddFavoriteResponse> => {
  console.log('Adding to favorites:', { favoritable_type, favoritable_id });
  
  return makeApiCall(API_CONFIG.ENDPOINTS.USER_FAVORITES, {
    method: 'POST',
    body: JSON.stringify({
      favoritable_type,
      favoritable_id: favoritable_id,
    }),
  }, true);
};

export const removeFromFavorites = async (favoriteId: number): Promise<DeleteFavoriteResponse> => {
  return makeApiCall(`${API_CONFIG.ENDPOINTS.USER_FAVORITES}/${favoriteId}`, {
    method: 'DELETE',
  }, true);
};

// Review API Functions
export const submitReview = async (reviewData: SubmitReviewRequest): Promise<SubmitReviewResponse> => {
  return makeApiCall(API_CONFIG.ENDPOINTS.SUBMIT_REVIEW, {
    method: 'POST',
    body: JSON.stringify(reviewData),
  }, true);
};

// Vote API Functions
export interface VoteResponse {
  success: boolean;
  message: string;
  data?: {
    helpful_count: number;
    not_helpful_count?: number; // Made optional in case API doesn't return it
    user_vote_status: {
      has_voted: boolean;
      user_vote: boolean;
    };
  };
}

export const voteReview = async (reviewId: number, isHelpful: boolean): Promise<VoteResponse> => {
  return makeApiCall(`${API_CONFIG.ENDPOINTS.REVIEW_VOTE}/${reviewId}/vote`, {
    method: 'POST',
    body: JSON.stringify({
      is_helpful: isHelpful ? 1 : 0
    }),
  }, true);
};

export const removeVote = async (reviewId: number): Promise<VoteResponse> => {
  return makeApiCall(`${API_CONFIG.ENDPOINTS.REVIEW_VOTE}/${reviewId}/vote`, {
    method: 'DELETE',
  }, true);
};

// Top Services API Functions
export const getTopServices = async (
  latitude: number,
  longitude: number,
  limit: number = 20,
  radiusKm: number = 15
): Promise<TopServicesResponse> => {
  const url = `${API_CONFIG.ENDPOINTS.TOP_SERVICES}?latitude=${latitude}&longitude=${longitude}&limit=${limit}&radius=${radiusKm}`;
  // Send token if available for analytics and user-specific data
  return makeApiCall(url, {}, false);
};

// Get Popular Nearby Businesses
export const getPopularNearby = async (
  latitude: number,
  longitude: number,
  limit: number = 20,
  radiusKm: number = 15,
  page: number = 1
): Promise<any> => {
  const url = `${API_CONFIG.ENDPOINTS.POPULAR_NEARBY}?latitude=${latitude}&longitude=${longitude}&limit=${limit}&radius=${radiusKm}&page=${page}`;
  return makeApiCall(url, {}, false);
};

// Get Dynamic Section Data
export const getDynamicSection = async (
  sectionSlug: string,
  latitude: number,
  longitude: number,
  limit: number = 20,
  radiusKm: number = 15,
  page: number = 1
): Promise<any> => {
  const url = `${API_CONFIG.ENDPOINTS.DYNAMIC_SECTIONS}/${sectionSlug}?latitude=${latitude}&longitude=${longitude}&limit=${limit}&radius=${radiusKm}&page=${page}`;
  return makeApiCall(url, {}, false);
};

// Get Featured Businesses
export const getFeaturedBusinesses = async (
  latitude: number,
  longitude: number,
  limit: number = 20,
  radiusKm: number = 15,
  page: number = 1
): Promise<any> => {
  const url = `${API_CONFIG.ENDPOINTS.FEATURED_BUSINESSES}?latitude=${latitude}&longitude=${longitude}&limit=${limit}&radius=${radiusKm}&page=${page}`;
  return makeApiCall(url, {}, false);
};

// Get Special Offers
export const getSpecialOffers = async (
  latitude: number,
  longitude: number,
  limit: number = 20,
  radiusKm: number = 15,
  page: number = 1
): Promise<any> => {
  const url = `${API_CONFIG.ENDPOINTS.SPECIAL_OFFERS}?latitude=${latitude}&longitude=${longitude}&limit=${limit}&radius=${radiusKm}&page=${page}`;
  return makeApiCall(url, {}, false);
};

// Get Top Rated Businesses
export const getTopRated = async (
  latitude: number,
  longitude: number,
  limit: number = 20,
  radiusKm: number = 15,
  page: number = 1,
  categoryId?: number
): Promise<any> => {
  let url = `${API_CONFIG.ENDPOINTS.TOP_RATED}?latitude=${latitude}&longitude=${longitude}&limit=${limit}&radius=${radiusKm}&page=${page}`;
  
  if (categoryId) {
    url += `&category_id=${categoryId}`;
  }
  
  return makeApiCall(url, {}, false);
};

// Get Open Now Businesses
export const getOpenNow = async (
  latitude: number,
  longitude: number,
  limit: number = 20,
  radiusKm: number = 15,
  page: number = 1,
  categoryId?: number
): Promise<any> => {
  let url = `${API_CONFIG.ENDPOINTS.OPEN_NOW}?latitude=${latitude}&longitude=${longitude}&limit=${limit}&radius=${radiusKm}&page=${page}`;
  
  if (categoryId) {
    url += `&category_id=${categoryId}`;
  }
  
  return makeApiCall(url, {}, false);
};

// Get Categories for discovery page
export const getCategories = async (
  page: number = 1,
  limit: number = 50
): Promise<CategoriesResponse> => {
  const url = `${API_CONFIG.ENDPOINTS.CATEGORIES}?page=${page}&limit=${limit}`;
  return makeApiCall(url, {}, false);
};

// Get Today's Trending data
export const getTodayTrending = async (
  latitude?: number,
  longitude?: number
): Promise<TodayTrendingResponse> => {
  let url = API_CONFIG.ENDPOINTS.TODAY_TRENDING;
  
  if (latitude !== undefined && longitude !== undefined) {
    url += `?latitude=${latitude}&longitude=${longitude}`;
  }
  
  return makeApiCall(url, {}, false);
};

// Helper function to validate and parse JSON responses
export const validateJsonResponse = async (response: Response): Promise<any> => {
  // Get the raw response text first
  let responseText: string;
  try {
    responseText = await response.text();
  } catch (error) {
    console.error('Failed to read response text:', error);
    throw new Error('Failed to read response from server.');
  }

  console.log('Raw response text (first 500 chars):', responseText.substring(0, 500));

  // Validate that we received JSON
  const contentType = response.headers.get('content-type');
  const isJsonContentType = contentType && contentType.includes('application/json');
  
  if (!isJsonContentType) {
    console.warn('Response is not JSON, content-type:', contentType);
    
    // Check if response looks like HTML (common for error pages)
    if (responseText.trim().startsWith('<')) {
      if (responseText.includes('Imunify360')) {
        throw new Error('Request blocked by security system. Please try again later.');
      } else if (responseText.includes('404') || responseText.includes('Not Found')) {
        throw new Error('API endpoint not found. Please update the app.');
      } else if (responseText.includes('500') || responseText.includes('Internal Server Error')) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error('Server returned an HTML page instead of JSON data.');
      }
    }
    
    // If it's not HTML, it might be plain text error
    throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 100)}`);
  }

  // Parse JSON response
  let responseData: any;
  try {
    if (responseText.trim() === '') {
      responseData = {};
    } else {
      responseData = JSON.parse(responseText);
    }
    console.log('Parsed response data:', responseData);
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    console.error('Response text that failed to parse:', responseText);
    throw new Error('Server returned invalid JSON data.');
  }

  // Validate that response has expected structure
  if (typeof responseData !== 'object' || responseData === null) {
    throw new Error('Server returned invalid response format.');
  }

  return responseData;
};

// Generic API call function for other components to use with validation
export const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  return makeApiCall(endpoint, options, true);
};

// Generic fetch with JSON validation for components that need direct fetch
export const fetchWithJsonValidation = async (url: string, options: RequestInit = {}): Promise<any> => {
  let response: Response;
  
  // Always check for token and send if available for analytics
  const token = await getAuthToken();
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'ReactNative/5StrApp',
  };

  // Add authorization header if token is available
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers as Record<string, string>),
      },
    });
  } catch (error) {
    console.error('Network error:', error);
    throw new Error('Network error. Please check your internet connection.');
  }

  console.log('Fetch Response:', {
    url,
    status: response.status,
    ok: response.ok,
    contentType: response.headers.get('content-type'),
    hasToken: !!token
  });

  const responseData = await validateJsonResponse(response);

  if (!response.ok) {
    const errorMessage = responseData?.message || `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }

  // Validate successful response structure for API responses
  if (responseData.success === false) {
    throw new Error(responseData.message || 'Request failed');
  }

  return responseData;
};

// Helper function to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAuthToken();
  return !!token;
};

// Notification API Functions
export const getUnreadNotifications = async (): Promise<NotificationsResponse> => {
  return makeApiCall(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}?filter=unread`, {}, true);
};

export const getAllNotifications = async (page: number = 1): Promise<NotificationsResponse> => {
  return makeApiCall(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}?page=${page}`, {}, true);
};

export const markNotificationAsRead = async (notificationId: string): Promise<NotificationActionResponse> => {
  return makeApiCall(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/${notificationId}/read`, {
    method: 'PATCH',
  }, true);
};

export const markAllNotificationsAsRead = async (): Promise<NotificationActionResponse> => {
  return makeApiCall(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/mark-all-read`, {
    method: 'PATCH',
  }, true);
};

export const deleteNotification = async (notificationId: string): Promise<NotificationActionResponse> => {
  return makeApiCall(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/${notificationId}`, {
    method: 'DELETE',
  }, true);
};

export const deleteAllNotifications = async (): Promise<NotificationActionResponse> => {
  return makeApiCall(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}`, {
    method: 'DELETE',
    body: JSON.stringify({
      confirm: true
    }),
  }, true);
};

// Location Recommendations API Functions
export interface LocationRecommendation {
  id: number;
  business_name: string;
  slug: string;
  phone: string | null;
  landmark: string | null;
  latitude: string;
  longitude: string;
  distance_km: number;
  overall_rating: string;
  total_reviews: number;
  price_range: number;
  is_featured: boolean;
  category: {
    id: number;
    name: string;
    slug: string;
    icon_image: string;
    color_code: string;
  };
  subcategory: {
    id: number;
    name: string;
    slug: string;
  };
  logo_image: string;
  area_relevance_score: number;
  recommendation_reason: string;
}

export interface LocationRecommendationsResponse {
  success: boolean;
  data: {
    user_location: {
      specific_area: string;
      coordinates: {
        latitude: string;
        longitude: string;
      };
      precision_level: string;
    };
    recommendations: LocationRecommendation[];
    metadata: {
      total_found: number;
      search_radius_km: number;
      area_based_scoring: boolean;
    };
  };
}

export const getLocationRecommendations = async (
  latitude: number,
  longitude: number,
  limit: number = 20,
  radiusKm: number = 15
): Promise<LocationRecommendationsResponse> => {
  const url = `${API_CONFIG.ENDPOINTS.LOCATION_RECOMMENDATIONS}?latitude=${latitude}&longitude=${longitude}&limit=${limit}&radius=${radiusKm}`;
  // Send token if available for personalized recommendations
  return makeApiCall(url, {}, false);
};
