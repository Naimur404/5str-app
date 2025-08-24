/**
 * Utility function to get the full image URL
 * @param imagePath - The image path from the API (can be string, object, or null/undefined)
 * @returns Full image URL
 */
export const getImageUrl = (imagePath: any): string => {
  // Handle null/undefined
  if (!imagePath) {
    return 'https://images.unsplash.com/photo-1534307671554-9a6d6e38f7c5?w=300&h=200&fit=crop';
  }

  // Handle object with image_url property (from detailed business responses)
  if (typeof imagePath === 'object' && imagePath.image_url) {
    const imageUrl = imagePath.image_url;
    if (typeof imageUrl === 'string' && imageUrl.trim() !== '') {
      const cleanPath = imageUrl.trim();
      if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
        return cleanPath;
      }
      return `https://5str.xyz/storage/${cleanPath}`;
    }
    return 'https://images.unsplash.com/photo-1534307671554-9a6d6e38f7c5?w=300&h=200&fit=crop';
  }

  // Handle string paths
  if (typeof imagePath === 'string' && imagePath.trim() !== '') {
    const cleanPath = imagePath.trim();
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
      return cleanPath;
    }
    return `https://5str.xyz/storage/${cleanPath}`;
  }

  // Fallback for any other case
  return 'https://images.unsplash.com/photo-1534307671554-9a6d6e38f7c5?w=300&h=200&fit=crop';
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
