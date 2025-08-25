# Image Helper Usage Guide

This guide shows how to use the enhanced image helpers and SmartImage component in the 5str-app.

## Basic Image Utilities

### 1. getImageUrl()
Converts any image path to a full URL with proper fallbacks:

```typescript
import { getImageUrl } from '@/utils/imageUtils';

// Basic usage
const imageUrl = getImageUrl(business.logo_image);

// Handles various input types:
const url1 = getImageUrl('path/to/image.jpg');          // Local path
const url2 = getImageUrl('https://example.com/img.jpg'); // Full URL
const url3 = getImageUrl({ image_url: 'path.jpg' });     // Object format
const url4 = getImageUrl(null);                          // Null/undefined
```

### 2. getOptimizedImageUrl()
Gets optimized images with size and quality control:

```typescript
import { getOptimizedImageUrl } from '@/utils/imageUtils';

const optimizedUrl = getOptimizedImageUrl(
  business.logo_image,
  300,  // width
  200,  // height
  80    // quality (1-100)
);
```

### 3. Specialized Helpers

```typescript
import { 
  getCategoryIconUrl, 
  getBusinessLogoUrl, 
  getUserAvatarUrl 
} from '@/utils/imageUtils';

// Category icons with color fallback
const categoryData = getCategoryIconUrl(category.icon_image, category.color_code);
// Returns: { imageUrl, showColorBackground, backgroundColor }

// Business logos with initials fallback
const businessData = getBusinessLogoUrl(business.logo_image, business.business_name);
// Returns: { imageUrl, initials, fallbackUrl }

// User avatars with initials
const userData = getUserAvatarUrl(user.profile_image, user.full_name);
// Returns: { imageUrl, initials, fallbackUrl }
```

## SmartImage Component

### Basic Usage

```typescript
import SmartImage from '@/components/SmartImage';

<SmartImage
  source={business.logo_image}
  type="business"
  width={100}
  height={100}
  borderRadius={12}
/>
```

### Advanced Usage with All Options

```typescript
<SmartImage
  source={user.profile_image}
  type="user"
  width={80}
  height={80}
  borderRadius={40}
  showInitials={true}
  initialsText={user.full_name}
  showLoadingIndicator={true}
  loadingColor="#007AFF"
  quality={90}
  resizeMode="cover"
  fallbackIcon="person-outline"
  style={{ opacity: 0.9 }}
  containerStyle={{ borderWidth: 2, borderColor: '#007AFF' }}
/>
```

## Preset Components

### BusinessLogo
```typescript
import { BusinessLogo } from '@/components/SmartImage';

<BusinessLogo
  source={business.logo_image}
  businessName={business.business_name}
  width={80}
  height={80}
  borderRadius={12}
/>
```

### UserAvatar
```typescript
import { UserAvatar } from '@/components/SmartImage';

<UserAvatar
  source={user.profile_image}
  userName={user.full_name}
  width={50}
  height={50}
  // borderRadius automatically set to make it circular
/>
```

### CategoryIcon
```typescript
import { CategoryIcon } from '@/components/SmartImage';

<CategoryIcon
  source={category.icon_image}
  colorCode={category.color_code}
  width={64}
  height={64}
  borderRadius={32}
/>
```

### OfferingImage
```typescript
import { OfferingImage } from '@/components/SmartImage';

<OfferingImage
  source={offering.image_url}
  width={200}
  height={120}
  borderRadius={12}
/>
```

## Migration Examples

### Before (using old method):
```typescript
<Image 
  source={{ 
    uri: getImageUrl(business.logo_image) || getFallbackImageUrl('business')
  }} 
  style={styles.businessImage} 
/>
```

### After (using SmartImage):
```typescript
<BusinessLogo
  source={business.logo_image}
  businessName={business.business_name}
  width={80}
  height={80}
  borderRadius={12}
/>
```

## Advanced Features

### Loading States
SmartImage automatically handles loading states with indicators.

### Error Handling
Automatically falls back to appropriate placeholder images or initials.

### Performance Optimization
- Automatic image size optimization
- Responsive image loading based on screen density
- Memory-efficient fallback handling

### Responsive Images
```typescript
import { getResponsiveImageUrl } from '@/utils/imageUtils';

const responsiveUrl = getResponsiveImageUrl(image, '2x'); // '1x', '2x', '3x'
```

### Image Validation
```typescript
import { validateImageUrl } from '@/utils/imageUtils';

const isValid = await validateImageUrl(imageUrl);
```

## Best Practices

1. **Always use SmartImage for user-facing images** - It handles all edge cases
2. **Specify appropriate types** - This ensures correct fallbacks
3. **Use preset components** when available - BusinessLogo, UserAvatar, etc.
4. **Set reasonable dimensions** - For performance and layout
5. **Use borderRadius consistently** - For design cohesion

## Common Use Cases

### In FlatList/ScrollView:
```typescript
const renderItem = ({ item }) => (
  <TouchableOpacity style={styles.card}>
    <BusinessLogo
      source={item.logo_image}
      businessName={item.business_name}
      width={60}
      height={60}
    />
    <Text>{item.business_name}</Text>
  </TouchableOpacity>
);
```

### Profile Headers:
```typescript
<UserAvatar
  source={user.profile_image}
  userName={user.full_name}
  width={100}
  height={100}
  containerStyle={styles.profileAvatar}
/>
```

### Category Grids:
```typescript
<CategoryIcon
  source={category.icon_image}
  colorCode={category.color_code}
  width={64}
  height={64}
  borderRadius={32}
/>
```
