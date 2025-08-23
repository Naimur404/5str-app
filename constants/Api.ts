export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000',
  ENDPOINTS: {
    LOGIN: '/api/v1/login',
    REGISTER: '/api/v1/register',
    LOGOUT: '/api/v1/logout',
    HOME: '/api/v1/home',
    SEARCH: '/api/v1/search',
    USER_PROFILE: '/api/v1/auth/user',
    USER_REVIEWS: '/api/v1/user/reviews',
    USER_FAVORITES: '/api/v1/user/favorites',
    SUBMIT_REVIEW: '/api/v1/reviews',
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
