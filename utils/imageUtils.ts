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
      return `https://api.5str.xyz/storage/${cleanPath}`;
    }
    return 'https://images.unsplash.com/photo-1534307671554-9a6d6e38f7c5?w=300&h=200&fit=crop';
  }

  // Handle string paths
  if (typeof imagePath === 'string' && imagePath.trim() !== '') {
    const cleanPath = imagePath.trim();
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
      return cleanPath;
    }
    return `https://api.5str.xyz/storage/${cleanPath}`;
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

/**
 * Enhanced image URL with size optimization
 * @param imagePath - The image path from the API
 * @param width - Desired width in pixels
 * @param height - Desired height in pixels
 * @param quality - Image quality (1-100)
 * @returns Optimized image URL
 */
export const getOptimizedImageUrl = (
  imagePath: any, 
  width: number = 300, 
  height: number = 200, 
  quality: number = 80
): string => {
  const baseUrl = getImageUrl(imagePath);
  
  // If it's already an external URL, return as is
  if (baseUrl.includes('unsplash.com')) {
    return `${baseUrl}&w=${width}&h=${height}&q=${quality}`;
  }
  
  // For local images, return the base URL (optimization can be added server-side later)
  return baseUrl;
};

/**
 * Get category icon image with fallback
 * @param iconPath - Icon path from category data
 * @param colorCode - Color code for fallback background
 * @returns Object with image URL and whether to show color background
 */
export const getCategoryIconUrl = (iconPath: any, colorCode?: string) => {
  if (iconPath) {
    return {
      imageUrl: getImageUrl(iconPath),
      showColorBackground: false,
      backgroundColor: 'transparent'
    };
  }
  
  return {
    imageUrl: null,
    showColorBackground: true,
    backgroundColor: colorCode || '#007AFF'
  };
};

/**
 * Get business logo with fallback
 * @param logoPath - Logo path from business data
 * @param businessName - Business name for generating initials
 * @returns Object with image URL and fallback initials
 */
export const getBusinessLogoUrl = (logoPath: any, businessName?: string) => {
  const imageUrl = logoPath ? getImageUrl(logoPath) : null;
  const initials = businessName 
    ? businessName.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()
    : '??';
    
  return {
    imageUrl,
    initials,
    fallbackUrl: getFallbackImageUrl('business')
  };
};

/**
 * Get user avatar with fallback
 * @param avatarPath - Avatar path from user data
 * @param userName - User name for generating initials
 * @returns Object with image URL and fallback initials
 */
export const getUserAvatarUrl = (avatarPath: any, userName?: string) => {
  const imageUrl = avatarPath ? getImageUrl(avatarPath) : null;
  const initials = userName 
    ? userName.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()
    : 'U';
    
  return {
    imageUrl,
    initials,
    fallbackUrl: getFallbackImageUrl('user')
  };
};

/**
 * Validate if image URL is accessible
 * @param imageUrl - Image URL to validate
 * @returns Promise<boolean>
 */
export const validateImageUrl = async (imageUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Get image dimensions from URL (for layout calculations)
 * @param imageUrl - Image URL
 * @returns Promise with width and height
 */
export const getImageDimensions = (imageUrl: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.width, height: image.height });
    };
    image.onerror = reject;
    image.src = imageUrl;
  });
};

/**
 * Format image URL for different screen densities
 * @param imagePath - The image path from the API
 * @param density - Screen density (1x, 2x, 3x)
 * @returns Formatted image URL
 */
export const getResponsiveImageUrl = (imagePath: any, density: '1x' | '2x' | '3x' = '2x'): string => {
  const baseUrl = getImageUrl(imagePath);
  
  // For Unsplash images, adjust quality based on density
  if (baseUrl.includes('unsplash.com')) {
    const qualityMap = { '1x': 60, '2x': 80, '3x': 90 };
    return baseUrl.includes('q=') 
      ? baseUrl.replace(/q=\d+/, `q=${qualityMap[density]}`)
      : `${baseUrl}&q=${qualityMap[density]}`;
  }
  
  return baseUrl;
};

/**
 * Image loading state helper for React components
 */
export interface ImageLoadState {
  isLoading: boolean;
  hasError: boolean;
  imageUrl: string;
  fallbackUrl: string;
}

export const createImageLoadState = (
  imagePath: any, 
  type: 'business' | 'offering' | 'user' | 'general' = 'general'
): ImageLoadState => {
  return {
    isLoading: true,
    hasError: false,
    imageUrl: getImageUrl(imagePath),
    fallbackUrl: getFallbackImageUrl(type)
  };
};
