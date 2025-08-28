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
  overall_rating: string;
  price_range: number;
  distance?: number | string;
  distance_km?: string;
  category_name: string;
  subcategory_name: string;
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
    trending: Trending;
    user_location: UserLocation;
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
  is_following?: boolean; // For authenticated users
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
