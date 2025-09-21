// Banner types
export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  image_url: string;
  link_type: string;
  link_id: number | null;
  link_url: string;
  position: string;
  target_location: string | null;
  is_active: boolean;
  sort_order: number;
  start_date: string;
  end_date: string;
  click_count: number;
  view_count: number;
}

// Category/Service types
export interface TopService {
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

// Business types
export interface Business {
  id: number;
  business_name: string;
  slug: string;
  landmark: string | null;
  full_address?: string; // For search API results
  overall_rating: string;
  price_range: number;
  distance?: number | string;
  distance_km?: string;
  category_name: string;
  subcategory_name: string | null;
  logo_image?: string | { image_url: string } | null; // Legacy field
  images?: {
    logo?: string | null;
    cover?: string | null;
  }; // New API structure
  section_priority?: string; // New field for section-specific data
  opening_status?: {
    is_open: boolean;
    status: string;
    next_change: string;
  }; // For open-now API
  description?: string;
  area?: string;
  city?: string;
  total_reviews?: number;
  is_verified?: boolean;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  type?: string;
  // Trending-specific fields
  trend_score?: string;
  hybrid_score?: string;
  view_count?: number;
  search_count?: number;
}

// Special Offer types
export interface SpecialOffer {
  id: number;
  title: string;
  description: string;
  offer_type: string;
  discount_percentage: string;
  valid_to: string;
  valid_until?: string | null; // Legacy field for backward compatibility
  business: {
    id: number;
    business_name: string;
    slug: string;
    landmark: string | null;
    overall_rating: string;
    price_range: number;
    category_name: string;
    subcategory_name: string;
    logo_image: string | null;
  };
}

// National Brand types
export interface NationalBrand {
  id: number;
  business_name: string;
  slug: string;
  description: string;
  overall_rating: string;
  total_reviews: number;
  is_national: boolean;
  service_coverage: string;
  business_model: string;
  category: {
    id: number;
    name: string;
  };
  logo_image: string | null;
}

// Featured Attraction types
export interface FeaturedAttraction {
  id: number;
  name: string;
  slug: string;
  description: string;
  type: string;
  category: string;
  subcategory: string;
  city: string;
  area: string;
  district: string;
  is_free: boolean;
  entry_fee: string;
  currency: string;
  overall_rating: number;
  total_reviews: number;
  total_views: number;
  discovery_score: number;
  estimated_duration_minutes: number;
  difficulty_level: string;
  cover_image_url: string;
  google_maps_url: string;
  distance_km: number;
  facilities: string[];
  best_time_to_visit: {
    months: string[];
  };
  is_featured: boolean;
  recent_reviews_count: number;
}

// Detailed Attraction types
export interface AttractionLocation {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  area: string;
  district: string;
  country: string;
}

export interface AttractionPricing {
  is_free: boolean;
  entry_fee: string;
  currency: string;
}

export interface AttractionSchedule {
  opening_hours: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
}

export interface AttractionContact {
  phone: string;
  email: string;
  website: string;
}

export interface AttractionVisitInfo {
  facilities: string[];
  best_time_to_visit: {
    months: string[];
  };
  estimated_duration_minutes: number;
  difficulty_level: string;
}

export interface AttractionAccessibility {
  wheelchair_accessible: boolean;
  parking_available: boolean;
}

export interface AttractionRatings {
  overall_rating: string;
  total_reviews: number;
}

export interface AttractionEngagement {
  total_likes: number;
  total_dislikes: number;
  total_shares: number;
  total_views: number;
}

export interface AttractionGalleryItem {
  id: number;
  image_url: string;
  title: string;
  description: string;
  is_cover: boolean;
  sort_order: number;
  full_image_url: string;
  thumbnail_url: string;
}

export interface AttractionMedia {
  cover_image_url: string;
  gallery_count: number;
  gallery: AttractionGalleryItem[];
}

export interface AttractionStatusFlags {
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;
  status: string;
}

export interface AttractionMetaData {
  tags: string[];
}

export interface AttractionUserInteractions {
  user_has_liked: boolean;
  user_has_bookmarked: boolean;
  user_has_visited: boolean;
}

export interface AttractionReviewUser {
  id: number;
  name: string;
  profile_image: string | null;
  total_points?: number;
  trust_level: number;
}

export interface AttractionReview {
  id: number;
  attraction_id?: number;
  user_id?: number;
  user: AttractionReviewUser;
  rating: string;
  title: string;
  comment: string;
  visit_date: string;
  experience_tags: string[];
  visit_info?: {
    duration_hours?: number;
    companions?: number;
    transportation?: string;
    weather?: string;
    crowd_level?: string;
  };
  helpful_votes: number;
  total_votes: number;
  helpful_percentage: number;
  is_verified: boolean;
  is_featured: boolean;
  is_anonymous: boolean;
  time_ago: string;
  is_recent: boolean;
  user_vote?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AttractionImage {
  id: number;
  attraction_id: number;
  image_url: string;
  image_path: string;
  title: string;
  description: string;
  alt_text: string | null;
  is_cover: boolean;
  sort_order: number;
  image_type: string;
  meta_data: any;
  uploaded_by: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  full_image_url: string;
  thumbnail_url: string;
  uploader?: any;
}

export interface AttractionDetail {
  id: number;
  name: string;
  slug: string;
  description: string;
  type: string;
  category: string;
  subcategory: string;
  latitude: string;
  longitude: string;
  address: string;
  city: string;
  area: string;
  district: string;
  country: string;
  is_free: boolean;
  entry_fee: string;
  currency: string;
  opening_hours: string; // JSON string
  contact_info: string; // JSON string
  facilities: string; // JSON string array
  best_time_to_visit: string; // JSON string
  estimated_duration_minutes: number;
  difficulty_level: string;
  accessibility_info: string; // JSON string
  overall_rating: string;
  total_reviews: number;
  total_likes: number;
  total_dislikes: number;
  total_shares: number;
  total_views: number;
  discovery_score: string;
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;
  status: string;
  rejection_reason: string | null;
  created_by: number | null;
  verified_by: number | null;
  verified_at: string | null;
  meta_data: string; // JSON string
  created_at: string;
  updated_at: string;
  google_maps_url: string;
  cover_image_url: string;
  gallery_count: number;
  gallery: AttractionImage[];
  reviews: AttractionReview[];
  creator: any | null;
  verifier: any | null;
  cover_image: AttractionImage;
  
  // Computed/parsed properties (we'll add these in the component)
  location?: AttractionLocation;
  pricing?: AttractionPricing;
  schedule?: AttractionSchedule;
  contact?: AttractionContact;
  visit_info?: AttractionVisitInfo;
  accessibility?: AttractionAccessibility;
  ratings?: AttractionRatings;
  engagement?: AttractionEngagement;
  media?: AttractionMedia;
  status_flags?: AttractionStatusFlags;
}

export interface TopNationalBrandSection {
  section_title: string;
  section_type: string;
  section_description: string;
  businesses: NationalBrand[];
}

// Dynamic Section types
export interface DynamicSection {
  section_name: string;
  section_slug: string;
  count: number;
  businesses: Business[];
}

// Trending types
export interface Trending {
  businesses: Business[];
  categories: any[];
  search_terms: any[];
  area: string;
  date: string;
}

// User Location types
export interface UserLocation {
  latitude: string;
  longitude: string;
  radius_km: string;
}

// Home API Response
export interface HomeResponse {
  success: boolean;
  message?: string; // Add optional message field for error cases
  data: {
    banners: Banner[];
    top_services: TopService[];
    trending_businesses: Business[];
    popular_nearby: Business[];
    dynamic_sections: DynamicSection[];
    special_offers: SpecialOffer[];
    featured_businesses: Business[];
    featured_attractions: FeaturedAttraction[];
    popular_attractions: FeaturedAttraction[];
    trending: Trending;
    user_location: UserLocation;
    top_national_brands: TopNationalBrandSection[];
  };
}

// Search API Response
export interface SearchResponse {
  success: boolean;
  message?: string; // Add optional message field for error cases
  data: {
    search_term: string;
    search_type: string;
    total_results: number;
    results: {
      businesses: {
        data: Business[];
        pagination: {
          current_page: number;
          last_page: number;
          per_page: number;
          total: number;
          has_more: boolean;
        };
      };
      offerings: {
        data: Offering[];
        pagination: {
          current_page: number;
          last_page: number;
          per_page: number;
          total: number;
          has_more: boolean;
        };
      };
    };
  };
}

// Offering types
export interface Offering {
  id: number;
  name: string;
  description: string;
  offering_type: string;
  price: string;
  price_max?: string;
  price_range?: string;
  currency: string;
  image_url: string;
  is_available: boolean;
  is_popular: boolean;
  is_featured: boolean;
  average_rating: string;
  total_reviews: number;
  business: {
    id: number;
    business_name: string;
    slug: string;
    city: string;
    area: string;
    distance_km: number;
  };
  category: any;
  type: string;
}

// Popular Nearby Response
export interface PopularNearbyResponse {
  success: boolean;
  data: {
    businesses: Business[];
    location: UserLocation;
    pagination?: {
      current_page: number;
      total_pages: number;
      has_more: boolean;
    };
  };
}

// Dynamic Section Response
export interface DynamicSectionResponse {
  success: boolean;
  data: {
    section_name: string;
    section_slug: string;
    businesses: Business[];
    location: UserLocation;
    pagination?: {
      current_page: number;
      total_pages: number;
      has_more: boolean;
    };
  };
}

// Featured Businesses Response
export interface FeaturedBusinessesResponse {
  success: boolean;
  data: {
    businesses: Business[];
    location: UserLocation;
    pagination?: {
      current_page: number;
      total_pages: number;
      has_more: boolean;
    };
  };
}

// Special Offers Response
export interface SpecialOffersResponse {
  success: boolean;
  data: {
    offers: SpecialOffer[];
    location: UserLocation;
    pagination?: {
      current_page: number;
      total_pages: number;
      has_more: boolean;
    };
  };
}

// Popular Attractions Response
export interface PopularAttractionsResponse {
  success: boolean;
  data: {
    attractions: FeaturedAttraction[];
    location: UserLocation;
    pagination?: {
      current_page: number;
      total_pages: number;
      has_more: boolean;
    };
  };
}

// Featured Attractions Response
export interface FeaturedAttractionsResponse {
  success: boolean;
  data: {
    attractions: FeaturedAttraction[];
    location: UserLocation;
    pagination?: {
      current_page: number;
      total_pages: number;
      has_more: boolean;
    };
  };
}

// Attraction Detail Response
export interface AttractionDetailResponse {
  success: boolean;
  message: string;
  data: AttractionDetail;
}

// Review Submission Request
export interface AttractionReviewSubmissionRequest {
  rating: number;
  title?: string;
  comment: string;
  visit_date?: string;
  experience_tags?: string[];
  visit_info?: {
    duration_hours?: number;
    companions?: number;
    transportation?: string;
    weather?: string;
    crowd_level?: string;
  };
  is_anonymous?: boolean;
}

// Review Submission Response
export interface AttractionReviewSubmissionResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    attraction_id: string;
    user_id: number;
    rating: string;
    title: string;
    comment: string;
    visit_date: string;
    experience_tags: string[];
    visit_info: {
      duration_hours?: number;
      companions?: number;
      transportation?: string;
      weather?: string;
      crowd_level?: string;
    };
    is_anonymous: boolean;
    status: string;
    helpful_votes: number;
    total_votes: number;
    helpful_percentage: number;
    time_ago: string;
    is_recent: boolean;
    is_verified: boolean;
    is_featured: boolean;
    created_at: string;
    updated_at: string;
    user: AttractionReviewUser;
    attraction: {
      id: number;
      name: string;
      slug: string;
      overall_rating: string;
      total_reviews: number;
    };
  };
}

// Review Vote Response
export interface AttractionReviewVoteResponse {
  success: boolean;
  message: string;
  data: {
    helpful_votes: number;
    total_votes: number;
    helpful_percentage: number;
  };
}

// Reviews List Response
export interface AttractionReviewsResponse {
  success: boolean;
  message: string;
  data: {
    current_page: number;
    data: AttractionReview[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
  meta: {
    attraction: {
      id: number;
      name: string;
      overall_rating: number;
      total_reviews: number;
    };
  };
}

// Category interface (alias for TopService for clarity)
export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: string | null;
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

// Categories Response
export interface CategoriesResponse {
  success: boolean;
  data: Category[];
  pagination?: {
    current_page: number;
    total_pages: number;
    has_more: boolean;
  };
}

// Trending Business interface
export interface TrendingBusiness {
  id: number;
  business_name: string;
  slug: string;
  landmark: string | null;
  area: string;
  overall_rating: string;
  price_range: number;
  phone: string;
  website: string;
  is_featured: boolean;
  is_verified: boolean;
  category: {
    id: number;
    name: string;
    slug: string;
    icon: string;
    color: string;
  };
  subcategory: {
    id: number;
    name: string;
    slug: string;
  };
  images: {
    logo: string;
    cover: string | null;
    gallery?: string[];
  };
  trend_score: string;
  trend_rank: number;
}

// Trending Offering interface
export interface TrendingOffering {
  id: number;
  name: string;
  offering_type: string;
  price: string;
  description: string;
  image_url: string;
  trend_score: string;
  trend_rank: number;
  business: {
    id: number;
    business_name: string;
    slug: string;
    area: string;
    category_name: string | null;
    images: {
      logo: string;
      cover: string | null;
    };
  };
}

// Today's Trending Response
export interface TodayTrendingResponse {
  success: boolean;
  data: {
    trending_businesses: TrendingBusiness[];
    trending_offerings: TrendingOffering[];
    summary: {
      date: string;
      area: string;
      total_trending_items: number;
      businesses_count: number;
      offerings_count: number;
      location_provided: boolean;
    };
    location: {
      latitude: number | null;
      longitude: number | null;
      determined_area: string;
    };
  };
}

// Notification types
export interface Notification {
  id: string;
  title: string;
  body: string;
  icon: string;
  color: string;
  is_read: boolean;
  read_at: string | null;
  time_ago: string;
}

export interface NotificationStats {
  total_count: number;
  unread_count: number;
  read_count: number;
}

export interface NotificationFilters {
  current_filter: string;
  search: string | null;
  sort_by: string;
  sort_order: string;
}

export interface NotificationPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  has_more: boolean;
  from: number;
  to: number;
}

export interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    pagination: NotificationPagination;
    stats: NotificationStats;
    filters: NotificationFilters;
  };
}

export interface NotificationActionResponse {
  success: boolean;
  message?: string;
}

// Collection types
export interface Collection {
  id: number;
  name: string;
  description: string;
  is_public: boolean;
  cover_image: string | null;
  slug: string;
  businesses_count: number;
  followers_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    profile_image?: string | null;
  };
  businesses?: CollectionBusiness[];
  is_following?: boolean; // For authenticated users (legacy)
  is_followed_by_user?: boolean; // For authenticated users
  can_edit?: boolean; // If current user owns this collection
}

export interface CollectionBusiness {
  id: number;
  name: string;
  phone: string;
  address: string;
  image_url: string | null;
  rating?: number;
  category_name?: string;
  notes?: string; // User's personal notes about the business
  sort_order?: number;
  added_at?: string;
}

export interface CollectionItem {
  id: number;
  collection_id: number;
  business_id: number;
  notes: string | null;
  sort_order: number;
  added_at: string;
  business: CollectionBusiness;
}

// Collection API Request types
export interface CreateCollectionRequest {
  name: string;
  description: string;
  is_public: boolean;
  cover_image?: string;
}

export interface UpdateCollectionRequest extends CreateCollectionRequest {}

export interface AddBusinessToCollectionRequest {
  business_id: number;
  notes?: string;
  sort_order?: number;
}

// Collection API Response types
export interface CollectionsResponse {
  success: boolean;
  data: {
    collections: Collection[];
  };
}

export interface CollectionResponse {
  success: boolean;
  data: {
    collection: Collection;
  };
}

export interface CollectionItemResponse {
  success: boolean;
  message: string;
  data: {
    collection_item: CollectionItem;
  };
}

export interface CollectionActionResponse {
  success: boolean;
  message: string;
  status?: number;
}

export interface PopularCollectionsResponse {
  success: boolean;
  data: {
    collections: Collection[];
  };
}

export interface SearchCollectionsResponse {
  success: boolean;
  data: {
    collections: Collection[];
  };
}

// ==========================================
// ATTRACTION INTERACTION TYPES
// ==========================================

// Attraction Interaction Types
export type AttractionInteractionType = 'like' | 'dislike' | 'bookmark' | 'share' | 'visit' | 'wishlist';
export type AttractionInteractionPriority = 'low' | 'medium' | 'high';
export type VisitCompanionType = 'solo' | 'partner' | 'friend' | 'family' | 'group' | 'business';

// Base Interaction Data Interface
export interface AttractionInteractionData {
  // Visit-specific fields
  visit_date?: string;
  duration_minutes?: number;
  companions?: VisitCompanionType[];
  weather?: string;
  
  // Share-specific fields
  platform?: string;
  message?: string;
  
  // Bookmark/Wishlist-specific fields
  priority?: AttractionInteractionPriority;
  planned_visit_date?: string;
}

// Request Interfaces
export interface AttractionInteractionRequest {
  attraction_id: number;
  interaction_type: AttractionInteractionType;
  notes?: string;
  is_public?: boolean;
  rating?: number; // For visit interactions (0-5)
  
  // Type-specific fields
  visit_date?: string;
  duration_minutes?: number;
  companions?: VisitCompanionType[];
  weather?: string;
  platform?: string;
  message?: string;
  priority?: AttractionInteractionPriority;
  planned_visit_date?: string;
}

export interface AttractionInteractionToggleRequest {
  attraction_id: number;
  interaction_type: 'like' | 'dislike' | 'bookmark' | 'wishlist';
  notes?: string;
  is_public?: boolean;
  priority?: AttractionInteractionPriority;
  planned_visit_date?: string;
}

export interface AttractionInteractionRemoveRequest {
  attraction_id: number;
  interaction_type: AttractionInteractionType;
}

// Response Data Interfaces
export interface AttractionInteraction {
  id: number;
  user_id: number;
  attraction_id: number;
  interaction_type: AttractionInteractionType;
  interaction_data: AttractionInteractionData;
  notes: string | null;
  user_rating: number | null;
  is_public: boolean;
  is_active: boolean;
  interaction_date: string;
  created_at: string;
  updated_at: string;
}

export interface AttractionInteractionWithUser extends AttractionInteraction {
  user: {
    id: number;
    name: string;
    profile_image: string | null;
    trust_level: number;
  };
}

export interface AttractionInteractionWithAttraction extends AttractionInteraction {
  attraction: {
    id: number;
    name: string;
    slug: string;
    cover_image_url: string;
    overall_rating: string;
    category: string;
    city: string;
    is_free: boolean;
  };
}

export interface AttractionStats {
  total_likes: number;
  total_dislikes: number;
  total_shares: number;
  total_visits?: number;
  total_bookmarks?: number;
  total_wishlists?: number;
}

// Response Interfaces
export interface AttractionInteractionResponse {
  success: boolean;
  message: string;
  data: {
    interaction: AttractionInteraction;
    attraction: {
      id: number;
      name: string;
      total_likes: number;
      total_shares: number;
    };
  };
}

export interface AttractionInteractionToggleResponse {
  success: boolean;
  message: string;
  data: {
    action: 'created' | 'removed';
    is_liked?: boolean;
    is_bookmarked?: boolean;
    is_wishlisted?: boolean;
    interaction: AttractionInteraction | null;
    attraction_stats: AttractionStats;
  };
}

export interface AttractionInteractionActionResponse {
  success: boolean;
  message: string;
}

// List Response Interfaces
export interface UserAttractionInteractionsResponse {
  success: boolean;
  message: string;
  data: {
    current_page: number;
    data: AttractionInteractionWithAttraction[];
    first_page_url: string;
    per_page: number;
    total: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
  };
}

export interface AttractionInteractionsResponse {
  success: boolean;
  message: string;
  data: {
    current_page: number;
    data: AttractionInteractionWithUser[];
    per_page: number;
    total: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
  };
  meta: {
    attraction: {
      id: number;
      name: string;
      total_likes: number;
      total_shares: number;
    };
  };
}

export interface UserLikedAttractionsResponse {
  success: boolean;
  message: string;
  data: {
    current_page: number;
    data: AttractionInteractionWithAttraction[];
    per_page: number;
    total: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
  };
}

export interface UserBookmarkedAttractionsResponse {
  success: boolean;
  message: string;
  data: {
    current_page: number;
    data: AttractionInteractionWithAttraction[];
    per_page: number;
    total: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
  };
}

export interface UserVisitedAttractionsResponse {
  success: boolean;
  message: string;
  data: {
    current_page: number;
    data: AttractionInteractionWithAttraction[];
    per_page: number;
    total: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
  };
}
