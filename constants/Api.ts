export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000',
  ENDPOINTS: {
    LOGIN: '/api/v1/login',
    REGISTER: '/api/v1/register',
    LOGOUT: '/api/v1/auth/logout',
    HOME: '/api/v1/home',
    TOP_SERVICES: '/api/v1/home/top-services',
    POPULAR_NEARBY: '/api/v1/home/popular-nearby',
    DYNAMIC_SECTIONS: '/api/v1/home/dynamic-sections',
    FEATURED_BUSINESSES: '/api/v1/home/featured-businesses',
    SPECIAL_OFFERS: '/api/v1/home/special-offers',
    TOP_RATED: '/api/v1/top-rated',
    OPEN_NOW: '/api/v1/open-now',
    SEARCH: '/api/v1/search',
    CATEGORIES: '/api/v1/categories',
    TODAY_TRENDING: '/api/v1/today-trending',
    USER_PROFILE: '/api/v1/auth/user',
    UPDATE_PROFILE: '/api/v1/auth/profile',
    USER_REVIEWS: '/api/v1/user/reviews',
    USER_FAVORITES: '/api/v1/user/favorites',
    SUBMIT_REVIEW: '/api/v1/reviews',
    REVIEW_VOTE: '/api/v1/reviews', // Base endpoint for voting, reviewId will be appended
    CATEGORY_BUSINESSES: '/api/v1/categories',
    BUSINESS_DETAILS: '/api/v1/businesses',
    BUSINESS_OFFERINGS: '/api/v1/businesses',
    BUSINESS_REVIEWS: '/api/v1/businesses',
    BUSINESS_OFFERS: '/api/v1/businesses',
    OFFERING_DETAILS: '/api/v1/businesses',
    OFFERING_REVIEWS: '/api/v1/businesses',
    OFFER_DETAILS: '/api/v1/offers',
  }
};

export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
