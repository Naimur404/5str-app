export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000',
  ENDPOINTS: {
    LOGIN: '/api/v1/login',
    REGISTER: '/api/v1/register',
    LOGOUT: '/api/v1/auth/logout',
    EMAIL_VERIFY: '/api/v1/email/verify',
    EMAIL_RESEND: '/api/v1/email/resend',
    EMAIL_STATUS: '/api/v1/email/status',
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
    SUBMIT_REVIEW: '/api/v1/reviews', // Also used for edit, show and delete with reviewId
    REVIEW_VOTE: '/api/v1/reviews', // Base endpoint for voting, reviewId will be appended
    CATEGORY_BUSINESSES: '/api/v1/categories',
    BUSINESS_DETAILS: '/api/v1/businesses',
    BUSINESS_OFFERINGS: '/api/v1/businesses',
    BUSINESS_REVIEWS: '/api/v1/businesses',
    BUSINESS_OFFERS: '/api/v1/businesses',
    OFFERING_DETAILS: '/api/v1/businesses',
    OFFERING_REVIEWS: '/api/v1/businesses',
    OFFER_DETAILS: '/api/v1/offers',
    NOTIFICATIONS: '/api/v1/notifications',
    LOCATION_RECOMMENDATIONS: '/api/v1/location/recommendations',
    // New Recommendation Endpoints
    RECOMMENDATIONS: '/api/v1/recommendations',
    RECOMMENDATIONS_ADVANCED_AI: '/api/v1/recommendations/advanced-ai',
    RECOMMENDATIONS_PERSONALIZED: '/api/v1/recommendations/personalized',
    RECOMMENDATIONS_SIMILAR: '/api/v1/recommendations/similar',
    COLLECTIONS: '/api/v1/collections',
    COLLECTION_FOLLOW: '/api/v1/collections',
    POPULAR_COLLECTIONS: '/api/v1/discover/collections/popular',
    SEARCH_COLLECTIONS: '/api/v1/discover/collections/search',
    // User Interaction Tracking Endpoints
    TRACK_INTERACTION: '/api/v1/interactions/track',
    TRACK_BATCH: '/api/v1/interactions/batch',
    BUSINESS_NATIONAL: '/api/v1/businesses/national',
    // Attraction Endpoints
    ATTRACTIONS: '/api/v1/attractions',
    FEATURED_ATTRACTIONS: '/api/v1/attractions/featured',
    POPULAR_ATTRACTIONS: '/api/v1/attractions/popular',
    ATTRACTION_REVIEWS: '/api/v1/attraction-reviews',
    // Attraction Interaction Endpoints
    ATTRACTION_INTERACTIONS: '/api/v1/attraction-interactions',
    ATTRACTION_INTERACTIONS_TOGGLE: '/api/v1/attraction-interactions/toggle',
    ATTRACTION_INTERACTIONS_REMOVE: '/api/v1/attraction-interactions/remove',
    ATTRACTION_INTERACTIONS_USER: '/api/v1/attraction-interactions/user',
    ATTRACTION_INTERACTIONS_ATTRACTION: '/api/v1/attraction-interactions/attraction',
    ATTRACTION_INTERACTIONS_LIKED: '/api/v1/attraction-interactions/liked',
    ATTRACTION_INTERACTIONS_BOOKMARKED: '/api/v1/attraction-interactions/bookmarked',
    ATTRACTION_INTERACTIONS_VISITED: '/api/v1/attraction-interactions/visited',
    ATTRACTION_INTERACTIONS_STATUS: '/api/v1/attraction-interactions/status',
    // Business Submission Endpoints
    BUSINESS_CATEGORIES_LIST: '/api/v1/businesses/categories',
    BUSINESS_SUBMISSION: '/api/v1/submissions/business',
    MY_SUBMISSIONS: '/api/v1/submissions/my-submissions',
    SUBMISSION_DETAILS: '/api/v1/submissions/business',
  }
};

export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
