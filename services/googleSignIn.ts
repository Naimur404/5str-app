import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { setAuthToken } from './api';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.5str.xyz';
const GOOGLE_TOKEN_ENDPOINT = '/api/auth/google/token';

// Google OAuth Configuration
const GOOGLE_WEB_CLIENT_ID = '511722915060-rgd4pfrkf0cjhd3447kdid1b272dcneg.apps.googleusercontent.com'; // Web client (for iOS and token verification)
const GOOGLE_ANDROID_CLIENT_ID = '511722915060-4vdb2tujgcvjkcnetcioqba4itm9m4n5.apps.googleusercontent.com'; // Android client

// Response Interfaces
export interface GoogleSignInResult {
  success: boolean;
  user?: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    profile_image: string | null;
    current_latitude: number | null;
    current_longitude: number | null;
    city: string | null;
    total_points: number;
    total_reviews_written: number;
    trust_level: number;
    email_verified_at: string | null;
    is_active: boolean;
    google_id: string;
    avatar: string;
    role?: string;
  };
  token?: string;
  token_type?: string;
  error?: string;
}

interface GoogleTokenResponse {
  success: boolean;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    profile_image: string | null;
    current_latitude: number | null;
    current_longitude: number | null;
    city: string | null;
    total_points: number;
    total_reviews_written: number;
    trust_level: number;
    email_verified_at: string | null;
    is_active: boolean;
    google_id: string;
    avatar: string;
  };
  token: string;
  token_type: string;
  message?: string;
}

/**
 * Initialize Google Sign-In
 * Must be called before using signInWithGoogle
 */
export const initializeGoogleSignIn = async (): Promise<void> => {
  try {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID, // Still needed for ID token
      offlineAccess: true, // To get ID token
      scopes: ['profile', 'email'],
    });
    console.log('Google Sign-In configured successfully');
  } catch (error) {
    console.error('Error configuring Google Sign-In:', error);
    throw error;
  }
};

/**
 * Check if Google Sign-In is available
 */
export const isGoogleSignInAvailable = (): boolean => {
  return true; // Native Google Sign-In is always available in development builds
};
const verifyGoogleToken = async (idToken: string): Promise<GoogleTokenResponse> => {
  try {
    console.log('Sending Google ID token to backend...');

    const response = await fetch(`${API_BASE_URL}${GOOGLE_TOKEN_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: idToken }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token verification error:', errorText);
      throw new Error(`Authentication failed: ${response.status}`);
    }

    const data: GoogleTokenResponse = await response.json();
    
    if (!data.success || !data.token || !data.user) {
      throw new Error(data.message || 'Invalid response from server');
    }

    return data;
  } catch (error) {
    console.error('Error verifying Google token:', error);
    throw error;
  }
};

/**
 * Sign in with Google using native Google Sign-In SDK
 * Gets Google ID token and sends it to backend for verification
 */
export const signInWithGoogle = async (): Promise<GoogleSignInResult> => {
  try {
    console.log('Starting Google Sign-In flow...');

    // Ensure Google Sign-In is configured
    initializeGoogleSignIn();

    // Check for play services on Android
    await GoogleSignin.hasPlayServices();

    // Sign out first to force account selection every time
    try {
      await GoogleSignin.signOut();
    } catch (signOutError) {
      // Ignore if user wasn't signed in
      console.log('No previous sign-in to clear');
    }

    // Sign in with Google - will show account picker
    const response = await GoogleSignin.signIn();

    console.log('Google Sign-In successful, user info:', {
      email: response.data?.user.email,
      name: response.data?.user.name,
    });

    // Get the ID token from response
    const idToken = response.data?.idToken;

    if (!idToken) {
      console.error('No ID token in response:', response);
      return {
        success: false,
        error: 'No authentication token received from Google'
      };
    }

    console.log('Got Google ID token, sending to backend...');

    // Send the ID token to backend for verification
    const authData = await verifyGoogleToken(idToken);

    // Store the authentication token
    await setAuthToken(authData.token);

    console.log('Backend authentication successful:', {
      id: authData.user.id,
      name: authData.user.name,
      email: authData.user.email,
    });

    return {
      success: true,
      user: authData.user,
      token: authData.token,
      token_type: authData.token_type
    };

  } catch (error: any) {
    console.error('Google Sign-In error:', error);

    // Handle specific Google Sign-In errors
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return {
        success: false,
        error: 'Google Sign-In was cancelled'
      };
    } else if (error.code === statusCodes.IN_PROGRESS) {
      return {
        success: false,
        error: 'Google Sign-In is already in progress'
      };
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return {
        success: false,
        error: 'Google Play Services not available or outdated'
      };
    }
    
    return {
      success: false,
      error: error.message || 'Google Sign-In failed'
    };
  }
};

/**
 * Sign out from Google account
 */
export const signOutFromGoogle = async (): Promise<void> => {
  try {
    await GoogleSignin.signOut();
    console.log('Successfully signed out from Google');
  } catch (error) {
    console.error('Error signing out from Google:', error);
  }
};

/**
 * Get current Google user info (if already signed in)
 */
export const getCurrentGoogleUser = async () => {
  try {
    const userInfo = await GoogleSignin.signInSilently();
    return userInfo.data;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};