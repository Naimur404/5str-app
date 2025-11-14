// Conditional imports for Expo Go compatibility
let GoogleSignin: any;
let statusCodes: any;
let isSuccessResponse: any;
let isErrorWithCode: any;

try {
  const googleSignInModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = googleSignInModule.GoogleSignin;
  statusCodes = googleSignInModule.statusCodes;
  isSuccessResponse = googleSignInModule.isSuccessResponse;
  isErrorWithCode = googleSignInModule.isErrorWithCode;
} catch (error) {
  console.log('Google Sign-In module not available (Expo Go)');
}

import { googleSignIn } from './api';

// Google Sign-In Configuration
const WEB_CLIENT_ID = '511722915060-rgd4pfrkf0cjhd3447kdid1b272dcneg.apps.googleusercontent.com';

// Check if Google Sign-In module is available (returns false in Expo Go)
const isGoogleSignInAvailable = (): boolean => {
  try {
    return GoogleSignin && typeof GoogleSignin.configure === 'function';
  } catch (error) {
    return false;
  }
};

export const initializeGoogleSignIn = async () => {
  if (!isGoogleSignInAvailable()) {
    console.log('Google Sign-In not available (running in Expo Go or module not linked)');
    return;
  }
  
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    await GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      offlineAccess: false,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
    });
    console.log('Google Sign-In initialized successfully');
  } catch (error) {
    console.error('Google Sign-In initialization error:', error);
    throw error;
  }
};

export interface GoogleSignInResult {
  success: boolean;
  user?: {
    id: number;
    name: string;
    email: string;
    google_id: string;
    avatar: string;
    phone: string | null;
    profile_image: string | null;
    current_latitude: number | null;
    current_longitude: number | null;
    city: string | null;
    total_points: number;
    total_reviews_written: number;
    trust_level: number;
    is_active: boolean;
    email_verified_at: string;
    role?: string; // Add role property
  };
  token?: string;
  error?: string;
}

export const signInWithGoogle = async (): Promise<GoogleSignInResult> => {
  // Check if Google Sign-In is available (won't work in Expo Go)
  if (!isGoogleSignInAvailable()) {
    return {
      success: false,
      error: 'Google Sign-In not available in Expo Go. Please use a development build or production app.'
    };
  }

  try {
    // Initialize Google Sign-In if not already done
    await initializeGoogleSignIn();

    // Check if device has Google Play Services
    await GoogleSignin.hasPlayServices();

    // Sign in with Google
    const response = await GoogleSignin.signIn();

    if (isSuccessResponse(response)) {
      const { user, idToken } = response.data;
      
      if (!idToken) {
        return {
          success: false,
          error: 'Failed to get Google ID token'
        };
      }

      console.log('Google Sign-In successful:', {
        id: user.id,
        name: user.name,
        email: user.email,
        photo: user.photo,
      });

      // Send the ID token to your Laravel API
      try {
        const apiResponse = await googleSignIn(idToken);
        
        if (apiResponse.success) {
          return {
            success: true,
            user: apiResponse.user,
            token: apiResponse.token
          };
        } else {
          return {
            success: false,
            error: apiResponse.message || 'Authentication failed'
          };
        }
      } catch (apiError: any) {
        console.error('API authentication error:', apiError);
        return {
          success: false,
          error: apiError.message || 'Server authentication failed'
        };
      }

    } else {
      // Sign in was cancelled or failed
      return {
        success: false,
        error: 'Google Sign-In was cancelled'
      };
    }

  } catch (error: any) {
    console.error('Google Sign-In error:', error);

    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          return {
            success: false,
            error: 'Google Sign-In was cancelled'
          };
        case statusCodes.IN_PROGRESS:
          return {
            success: false,
            error: 'Google Sign-In is already in progress'
          };
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          return {
            success: false,
            error: 'Google Play Services not available'
          };
        default:
          return {
            success: false,
            error: `Google Sign-In error: ${error.code}`
          };
      }
    }

    return {
      success: false,
      error: error.message || 'Google Sign-In failed'
    };
  }
};

export const signOutFromGoogle = async (): Promise<void> => {
  if (!isGoogleSignInAvailable()) {
    console.log('Google Sign-In not available');
    return;
  }
  
  try {
    await GoogleSignin.signOut();
    console.log('Google Sign-Out successful');
  } catch (error) {
    console.error('Google Sign-Out error:', error);
  }
};

export const isGoogleSignedIn = async (): Promise<boolean> => {
  if (!isGoogleSignInAvailable()) {
    return false;
  }
  
  try {
    const user = await GoogleSignin.getCurrentUser();
    return user !== null;
  } catch (error) {
    console.error('Error checking Google Sign-In status:', error);
    return false;
  }
};

export const getCurrentGoogleUser = async () => {
  if (!isGoogleSignInAvailable()) {
    return null;
  }
  
  try {
    return await GoogleSignin.getCurrentUser();
  } catch (error) {
    console.error('Error getting current Google user:', error);
    return null;
  }
};