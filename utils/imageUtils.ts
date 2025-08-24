/**
 * Utility function to get the full image URL
 * @param imagePath - The image path from the API
 * @returns Full image URL
 */
export const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) {
    return 'https://images.unsplash.com/photo-1534307671554-9a6d6e38f7c5?w=300&h=200&fit=crop';
  }

  // If the path already includes http:// or https://, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If it's a relative path, add the base URL
  return `https://5str.xyz/storage/${imagePath}`;
};

/**
 * Get fallback image URL for different types
 */
export const getFallbackImageUrl = (type: 'business' | 'offering' | 'user' | 'general' = 'general'): string => {
  const fallbacks = {
    business: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
    offering: 'https://images.unsplash.com/photo-1534307671554-9a6d6e38f7c5?w=300&h=200&fit=crop',
    user: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
    general: 'https://images.unsplash.com/photo-1534307671554-9a6d6e38f7c5?w=300&h=200&fit=crop'
  };
  
  return fallbacks[type];
};
