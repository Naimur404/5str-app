import React, { useState } from 'react';
import { 
  Image, 
  View, 
  Text, 
  StyleSheet, 
  ImageStyle, 
  ViewStyle, 
  TextStyle,
  ActivityIndicator,
  DimensionValue
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  getImageUrl, 
  getFallbackImageUrl, 
  getOptimizedImageUrl,
  getCategoryIconUrl,
  getBusinessLogoUrl,
  getUserAvatarUrl
} from '@/utils/imageUtils';

interface SmartImageProps {
  // Image source
  source: any;
  
  // Image type for fallback selection
  type?: 'business' | 'offering' | 'user' | 'category' | 'general';
  
  // Dimensions
  width?: DimensionValue;
  height?: DimensionValue;
  
  // Styling
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  
  // Optimization
  quality?: number;
  
  // Fallback options
  showInitials?: boolean;
  initialsText?: string;
  colorCode?: string;
  
  // Loading and error states
  showLoadingIndicator?: boolean;
  loadingColor?: string;
  
  // Border radius
  borderRadius?: number;
  
  // Icon fallback (for categories)
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  
  // Resize mode
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

const SmartImage: React.FC<SmartImageProps> = ({
  source,
  type = 'general',
  width = 100,
  height = 100,
  style,
  containerStyle,
  quality = 80,
  showInitials = false,
  initialsText,
  colorCode,
  showLoadingIndicator = true,
  loadingColor = '#007AFF',
  borderRadius = 8,
  fallbackIcon = 'image-outline',
  resizeMode = 'cover'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };
  
  const handleLoadEnd = () => {
    setIsLoading(false);
  };
  
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };
  
  // Get appropriate image URL based on type
  const getImageSource = () => {
    if (type === 'category') {
      const categoryData = getCategoryIconUrl(source, colorCode);
      return categoryData;
    }
    
    if (type === 'business') {
      const businessData = getBusinessLogoUrl(source, initialsText);
      return { imageUrl: businessData.imageUrl, initials: businessData.initials };
    }
    
    if (type === 'user') {
      const userData = getUserAvatarUrl(source, initialsText);
      return { imageUrl: userData.imageUrl, initials: userData.initials };
    }
    
    // For general types, use optimized URL
    const imageUrl = getOptimizedImageUrl(
      source, 
      typeof width === 'number' ? width : 300,
      typeof height === 'number' ? height : 200,
      quality
    );
    
    return { imageUrl };
  };
  
  const imageData = getImageSource();
  const fallbackUrl = getFallbackImageUrl(type === 'category' ? 'general' : type);
  
  const containerStyles: ViewStyle = {
    width,
    height,
    borderRadius,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    ...containerStyle
  };
  
  const imageStyles: ImageStyle = {
    width: '100%',
    height: '100%',
    ...style
  };
  
  // Render category with color background
  if (type === 'category' && 'showColorBackground' in imageData && imageData.showColorBackground) {
    return (
      <View style={[containerStyles, { backgroundColor: imageData.backgroundColor }]}>
        <Ionicons name={fallbackIcon} size={Math.min(32, typeof width === 'number' ? width * 0.4 : 32)} color="white" />
      </View>
    );
  }
  
  // Render initials fallback
  if ((hasError || !imageData.imageUrl) && showInitials && (imageData as any).initials) {
    const fontSize = Math.min(24, typeof width === 'number' ? width * 0.3 : 24);
    return (
      <View style={[containerStyles, { backgroundColor: colorCode || loadingColor }]}>
        <Text style={[styles.initialsText, { fontSize, color: 'white' }]}>
          {(imageData as any).initials}
        </Text>
      </View>
    );
  }
  
  // Render image with loading and error states
  return (
    <View style={containerStyles}>
      {/* Main Image */}
      <Image
        source={{ uri: imageData.imageUrl || fallbackUrl }}
        style={imageStyles}
        resizeMode={resizeMode}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
      />
      
      {/* Loading Indicator */}
      {isLoading && showLoadingIndicator && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={loadingColor} />
        </View>
      )}
      
      {/* Error Fallback */}
      {hasError && (
        <View style={styles.errorOverlay}>
          <Ionicons 
            name={fallbackIcon} 
            size={Math.min(32, typeof width === 'number' ? width * 0.4 : 32)} 
            color="#999" 
          />
        </View>
      )}
    </View>
  );
};

// Preset components for common use cases
export const BusinessLogo: React.FC<Omit<SmartImageProps, 'type'> & { businessName?: string }> = ({ 
  businessName, 
  ...props 
}) => (
  <SmartImage 
    type="business" 
    showInitials={true} 
    initialsText={businessName} 
    fallbackIcon="storefront-outline"
    {...props} 
  />
);

export const UserAvatar: React.FC<Omit<SmartImageProps, 'type'> & { userName?: string }> = ({ 
  userName, 
  ...props 
}) => (
  <SmartImage 
    type="user" 
    showInitials={true} 
    initialsText={userName} 
    fallbackIcon="person-outline"
    borderRadius={typeof props.width === 'number' ? props.width / 2 : 50}
    {...props} 
  />
);

export const CategoryIcon: React.FC<Omit<SmartImageProps, 'type'>> = (props) => (
  <SmartImage 
    type="category" 
    fallbackIcon="grid-outline"
    {...props} 
  />
);

export const OfferingImage: React.FC<Omit<SmartImageProps, 'type'>> = (props) => (
  <SmartImage 
    type="offering" 
    fallbackIcon="pricetag-outline"
    {...props} 
  />
);

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SmartImage;
