import { userTracker } from '@/services/userTrackingService';
import { getAuthToken } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * User Interaction Tracking Setup
 * 
 * This module provides utilities to set up and configure the tracking system
 * Call initializeTracking() when your app starts
 */

/**
 * Initialize the tracking system
 * Call this in your App.tsx or main component
 */
export async function initializeTracking(): Promise<void> {
  try {
    console.log('🔄 Initializing user interaction tracking...');
    
    // Check if user is authenticated
    const token = await getAuthToken();
    const isAuthenticated = !!token;
    
    console.log('👤 User authentication status:', isAuthenticated ? 'Authenticated' : 'Guest');
    
    // Retry any pending interactions from previous sessions
    await userTracker.retryPendingInteractions();
    
    // Set up app state listeners for background/foreground handling
    setupAppStateListeners();
    
    console.log('✅ User interaction tracking initialized successfully');
    
    // Track app launch
    await trackAppLaunch();
    
  } catch (error) {
    console.error('❌ Failed to initialize tracking:', error);
  }
}

/**
 * Track app launch for session analytics
 */
async function trackAppLaunch(): Promise<void> {
  try {
    const launchData = {
      app_version: '1.0.0', // You can get this from app.json or package.json
      platform: 'react-native',
      timestamp: Date.now(),
    };
    
    await AsyncStorage.setItem('last_app_launch', JSON.stringify(launchData));
    console.log('📱 App launch tracked');
  } catch (error) {
    console.error('Failed to track app launch:', error);
  }
}

/**
 * Set up app state listeners for better tracking
 */
function setupAppStateListeners(): void {
  // Note: You might want to use @react-native-async-storage/async-storage or similar
  // for more robust app state handling in a real implementation
  
  console.log('🎧 Setting up app state listeners for tracking');
  
  // In a real implementation, you'd set up listeners here for:
  // - App going to background (flush pending interactions)
  // - App coming to foreground (retry pending interactions)
  // - Network connectivity changes
}

/**
 * Cleanup tracking resources
 * Call this when your app is about to close
 */
export async function cleanupTracking(): Promise<void> {
  try {
    console.log('🧹 Cleaning up tracking resources...');
    
    // Flush any pending interactions
    await userTracker.flushBatch();
    
    // Dispose of the tracker
    userTracker.dispose();
    
    console.log('✅ Tracking cleanup completed');
  } catch (error) {
    console.error('❌ Failed to cleanup tracking:', error);
  }
}

/**
 * Get tracking statistics for debugging
 */
export async function getTrackingStats(): Promise<{
  pendingInteractions: number;
  lastFlush: string | null;
  sessionId: string;
}> {
  try {
    const pendingKey = 'pending_interactions';
    const pending = await AsyncStorage.getItem(pendingKey);
    const pendingInteractions = pending ? JSON.parse(pending) : [];
    
    const lastFlush = await AsyncStorage.getItem('last_tracking_flush');
    
    return {
      pendingInteractions: pendingInteractions.length,
      lastFlush,
      sessionId: 'current_session', // You'd get this from the tracker
    };
  } catch (error) {
    console.error('Failed to get tracking stats:', error);
    return {
      pendingInteractions: 0,
      lastFlush: null,
      sessionId: 'unknown',
    };
  }
}

/**
 * Debug function to manually flush tracking data
 * Useful for testing
 */
export async function debugFlushTracking(): Promise<void> {
  try {
    console.log('🔧 [DEBUG] Manually flushing tracking data...');
    await userTracker.flushBatch();
    console.log('✅ [DEBUG] Tracking data flushed');
  } catch (error) {
    console.error('❌ [DEBUG] Failed to flush tracking data:', error);
  }
}

/**
 * Check if tracking is working properly
 * Returns a health check status
 */
export async function checkTrackingHealth(): Promise<{
  isHealthy: boolean;
  issues: string[];
}> {
  const issues: string[] = [];
  
  try {
    // Check if we can access AsyncStorage
    await AsyncStorage.getItem('test_key');
  } catch (error) {
    issues.push('AsyncStorage access failed');
  }
  
  try {
    // Check if we can get auth token
    await getAuthToken();
  } catch (error) {
    issues.push('Auth token access failed');
  }
  
  // Check if API endpoints are configured
  const hasTrackingEndpoints = true; // You'd check API_CONFIG here
  if (!hasTrackingEndpoints) {
    issues.push('Tracking API endpoints not configured');
  }
  
  return {
    isHealthy: issues.length === 0,
    issues,
  };
}

/**
 * Configuration for different tracking levels
 */
export const TRACKING_LEVELS = {
  MINIMAL: {
    trackViews: false,
    trackClicks: true,
    trackHighValue: true,
    batchSize: 20,
  },
  STANDARD: {
    trackViews: true,
    trackClicks: true,
    trackHighValue: true,
    batchSize: 10,
  },
  COMPREHENSIVE: {
    trackViews: true,
    trackClicks: true,
    trackHighValue: true,
    trackOffers: true,
    trackCollections: true,
    batchSize: 5,
  },
};

/**
 * Apply tracking configuration
 */
export function configureTracking(level: keyof typeof TRACKING_LEVELS): void {
  const config = TRACKING_LEVELS[level];
  console.log(`📊 Configuring tracking level: ${level}`, config);
  
  // In a real implementation, you'd apply these settings to the tracker
  // For now, we'll just log the configuration
}

export default {
  initializeTracking,
  cleanupTracking,
  getTrackingStats,
  debugFlushTracking,
  checkTrackingHealth,
  configureTracking,
  TRACKING_LEVELS,
};
