# Profile Screen API Integration

## Overview
The profile screen has been updated to integrate with the real API endpoints for user authentication and data management.

## API Endpoints Integrated

### 1. User Profile (`/v1/auth/user`)
- **Method**: GET
- **Headers**: `Authorization: Bearer {token}`
- **Response**: User profile data including:
  - Personal information (name, email, phone, city)
  - User statistics (total_points, total_favorites, total_reviews)
  - User level information with progress tracking
  - Trust level and activity metrics

### 2. User Reviews (`/user/reviews`)
- **Method**: GET
- **Headers**: `Authorization: Bearer {token}`
- **Query Params**: `page` (optional, defaults to 1)
- **Response**: Paginated list of user reviews with:
  - Review details (rating, text, helpful counts)
  - Associated business or offering information
  - Review status and creation date

## Features Implemented

### 1. Authentication State Management
- Token storage using AsyncStorage
- Auto-detection of login status
- Guest user support with limited functionality

### 2. Profile Display
- **Authenticated Users**:
  - Real user data from API
  - Profile picture with fallback
  - User level with progress bar
  - Statistics (reviews, favorites, points)
  - Recent reviews carousel
  - Level progression tracking

- **Guest Users**:
  - Default guest profile
  - Sign-in prompt
  - Limited access to features

### 3. User Reviews Section
- Displays recent 3 reviews in horizontal scroll
- Star ratings visualization
- Business/offering name display
- Review date formatting
- "See All" option for full review list

### 4. Dynamic Settings Menu
- Different options for authenticated vs guest users
- Review management for logged-in users
- Sign-in option for guests
- Sign-out option for authenticated users

### 5. Loading & Refresh States
- Loading spinner during API calls
- Pull-to-refresh functionality
- Error handling for network issues

## Token Management
- Login screen saves token after successful authentication
- Profile screen retrieves and uses token for API calls
- Logout functionality clears stored token
- Automatic token validation

## UI Enhancements
- Level progress bar with percentage
- Recent reviews cards with ratings
- Conditional rendering based on auth status
- Responsive design for different user states

## Error Handling
- Network error management
- Invalid token handling
- Graceful fallback to guest mode
- User-friendly error messages

## Next Steps
- Implement edit profile functionality
- Add full reviews management screen
- Integrate with favorites API
- Add profile picture upload
- Implement level achievement notifications
