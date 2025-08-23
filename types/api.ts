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
  landmark: string;
  overall_rating: string;
  price_range: number;
  distance?: number;
  distance_km?: string;
  category_name: string;
  subcategory_name: string;
  logo_image: string;
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
  discount_percentage: string;
  valid_until: string | null;
  business: Business;
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
  data: {
    banners: Banner[];
    top_services: TopService[];
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
        data: any[];
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
