# API Configuration Update

## Changes Made

### 1. Updated Constants/Api.ts
Added new authentication and user endpoints:
```typescript
USER_PROFILE: '/api/v1/auth/user',
USER_REVIEWS: '/api/v1/user/reviews',
```

### 2. Enhanced API Service (services/api.ts)
- **Centralized API Configuration**: Now uses constants from Api.ts instead of hardcoded URLs
- **New Functions Added**:
  - `login(email, password)` - Handles authentication and token storage
  - `register(userData)` - Handles user registration and token storage
  - `getUserProfile()` - Fetches authenticated user profile
  - `getUserReviews(page)` - Fetches user's review history
  - `apiCall(endpoint, options)` - Generic API call function for other components
  - `isAuthenticated()` - Checks if user has valid token

### 3. Updated Authentication Screens
- **Login Screen**: Now uses centralized `login()` function
- **Register Screen**: Now uses centralized `register()` function
- **Simplified Code**: Removed duplicate fetch logic and error handling

## API Endpoints Now Available

| Endpoint | Purpose | Authentication |
|----------|---------|----------------|
| `/api/v1/login` | User login | No |
| `/api/v1/register` | User registration | No |
| `/api/v1/home` | Home screen data | Optional |
| `/api/v1/search` | Search businesses | Optional |
| `/api/v1/auth/user` | User profile data | Required |
| `/api/v1/user/reviews` | User reviews | Required |

## Benefits

### 1. **Centralized Configuration**
- All API endpoints defined in one place
- Easy to update URLs during development/production
- Consistent URL building across the app

### 2. **Improved Code Reusability**
- Authentication logic centralized
- Token management handled automatically
- Consistent error handling across all API calls

### 3. **Better Maintainability**
- Single source of truth for API configuration
- Easier to add new endpoints
- Simplified debugging and testing

### 4. **Enhanced Security**
- Automatic token attachment for authenticated endpoints
- Secure token storage using AsyncStorage
- Consistent authentication state management

## Usage Examples

```typescript
// Login
const result = await login('user@example.com', 'password');

// Get user profile
const profile = await getUserProfile();

// Get user reviews
const reviews = await getUserReviews(1);

// Check authentication status
const isLoggedIn = await isAuthenticated();

// Make custom API call
const data = await apiCall('/api/v1/custom-endpoint');
```

## Next Steps
- Add error handling for expired tokens
- Implement token refresh functionality
- Add offline caching for API responses
- Create API response type definitions for all endpoints
