import { API_CONFIG, getApiUrl } from '@/constants/Api';
import { getAuthToken, isAuthenticated } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { locationService } from '@/services/locationService';
import { Platform } from 'react-native';

/**
 * User Interaction Tracking Service
 * 
 * Tracks user interactions with businesses for personalization and analytics.
 * Supports 18 different interaction types with contextual data.
 * 
 * Features:
 * - Automatic view tracking with intersection observer
 * - Batching for performance optimization
 * - Offline support with retry mechanism
 * - Privacy-conscious design
 * - Real-time personalization
 */

// Core interaction types with their weights for personalization
export enum InteractionType {
  VIEW = 'view',                           // Weight: 1.0
  SEARCH_CLICK = 'search_click',           // Weight: 1.5
  CLICK = 'click',                         // Weight: 1.0
  PHONE_CALL = 'phone_call',               // Weight: 5.0
  FAVORITE = 'favorite',                   // Weight: 3.0
  UNFAVORITE = 'unfavorite',               // Weight: -2.0
  REVIEW = 'review',                       // Weight: 4.0
  SHARE = 'share',                         // Weight: 3.5
  COLLECTION_ADD = 'collection_add',       // Weight: 4.5
  COLLECTION_REMOVE = 'collection_remove', // Weight: -2.5
  OFFER_VIEW = 'offer_view',               // Weight: 2.0
  OFFER_USE = 'offer_use',                 // Weight: 5.0
  DIRECTION_REQUEST = 'direction_request', // Weight: 3.0
  WEBSITE_CLICK = 'website_click',         // Weight: 2.5
}

// Interaction context for additional data
export interface InteractionContext {
  source?: string;          // Where the interaction came from (home_page, search, recommendations, etc.)
  position?: number;        // Position in a list (1-based)
  section?: string;         // Section name (featured, popular, trending, etc.)
  element?: string;         // UI element that triggered the interaction
  session_id?: string;      // Session identifier
  search_query?: string;    // Search query that led to this interaction
  category_id?: number;     // Category context
  offering_id?: number;     // Offering context for business interactions
  collection_id?: number;   // Collection context
  visibility_percentage?: number; // For view tracking
  duration_ms?: number;     // How long user engaged
  [key: string]: any;       // Additional context data
}

// Core interaction interface
export interface UserInteraction {
  business_id: number;
  action: InteractionType;
  timestamp: number;
  context: InteractionContext;
}

// Batch interaction interface for API
export interface BatchInteractionPayload {
  interactions: UserInteraction[];
}

// API Response interfaces
export interface TrackingResponse {
  success: boolean;
  message?: string;
  data?: {
    interaction_id?: number;
    personalization_updated?: boolean;
    recommendations_refreshed?: boolean;
  };
}

export interface BatchTrackingResponse {
  success: boolean;
  message?: string;
  data?: {
    processed_count: number;
    failed_count: number;
    personalization_updated?: boolean;
  };
}

/**
 * Main User Interaction Tracker Class
 */
class UserInteractionTracker {
  private batch: UserInteraction[] = [];
  private readonly batchSize: number = 10;
  private readonly flushInterval: number = 180000; // 3 minutes
  private batchTimer: any = null;
  private isOnline: boolean = true;
  private sessionId: string = '';
  private userLoginTime: number | null = null;
  private readonly minDelayAfterLogin: number = 2 * 60 * 1000; // 2 minutes in milliseconds

  constructor() {
    this.initializeSession();
    this.setupBatchTimer();
    this.setupNetworkListeners();
    // Clear old pending interactions on app startup to avoid invalid business IDs
    this.clearPendingInteractions();
    // Only retry pending interactions after a delay to allow authentication to be checked
    setTimeout(() => {
      this.retryPendingInteractions();
    }, 3000); // 3 second delay
  }

  /**
   * Initialize tracking session
   */
  private initializeSession(): void {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setup automatic batch flushing
   */
  private setupBatchTimer(): void {
    this.batchTimer = setInterval(() => {
      this.flushBatch();
    }, this.flushInterval);
  }

  /**
   * Setup network connectivity listeners
   */
  private setupNetworkListeners(): void {
    // Note: In a real implementation, you might want to use @react-native-netinfo/netinfo
    // For now, we'll assume online connectivity
    this.isOnline = true;
  }

  /**
   * Get current session context
   */
  private getBaseContext(): Partial<InteractionContext> {
    return {
      session_id: this.sessionId,
    };
  }

  /**
   * Set user login time for tracking delay
   */
  setUserLoginTime(): void {
    this.userLoginTime = Date.now();
    console.log('🔐 User login time recorded for tracking delay');
  }

  /**
   * Check if user is authenticated and enough time has passed since login
   */
  private async canSendTrackingData(): Promise<boolean> {
    try {
      const authenticated = await isAuthenticated();
      
      if (!authenticated) {
        console.log('⏸️ Skipping tracking API call: User not authenticated');
        return false;
      }

      if (this.userLoginTime) {
        const timeSinceLogin = Date.now() - this.userLoginTime;
        if (timeSinceLogin < this.minDelayAfterLogin) {
          const remainingTime = Math.ceil((this.minDelayAfterLogin - timeSinceLogin) / 1000);
          console.log(`⏳ Skipping tracking API call: Need to wait ${remainingTime} more seconds after login`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.log('❌ Error checking authentication status:', error);
      return false;
    }
  }

  /**
   * Get device source name
   */
  private getDeviceSource(): string {
    const platformName = Platform.OS === 'ios' ? 'iPhone' : 'Android';
    const version = Platform.Version;
    return `${platformName}_${version}`;
  }

  /**
   * Track a user interaction
   */
  async trackInteraction(
    businessId: number,
    action: InteractionType,
    context: InteractionContext = {}
  ): Promise<void> {
    // Validate business ID
    if (!businessId || typeof businessId !== 'number' || businessId <= 0) {
      console.warn('🚨 Invalid business ID for tracking:', {
        businessId,
        businessId_type: typeof businessId,
        action,
        context
      });
      return;
    }

    // Check if user is authenticated before tracking anything
    const canTrack = await this.canSendTrackingData();
    if (!canTrack) {
      console.log('⏸️ Skipping interaction tracking: User not authenticated or timing restriction');
      return;
    }

    console.log('📝 Tracking interaction:', {
      businessId,
      action,
      context: JSON.stringify(context, null, 2)
    });

    const interaction: UserInteraction = {
      business_id: businessId,
      action,
      timestamp: Date.now(),
      context: {
        ...this.getBaseContext(),
        ...context,
      },
    };

    console.log('🎯 Tracking new interaction:');
    console.log('   Business ID:', businessId);
    console.log('   Action:', action);
    console.log('   Timestamp:', new Date(interaction.timestamp).toISOString());
    console.log('   Current Batch Size:', this.batch.length + 1);
    console.log('   Will Send Immediately:', this.isHighPriorityInteraction(action));
    console.log('   Complete Interaction Object:', JSON.stringify(interaction, null, 2));

    // Add to batch
    this.batch.push(interaction);

    // For high-priority interactions, send immediately
    if (this.isHighPriorityInteraction(action)) {
      await this.sendInteractionImmediately(interaction);
    } else if (this.batch.length >= this.batchSize) {
      await this.flushBatch();
    }

    // Store locally for offline support
    await this.storeInteractionLocally(interaction);
  }

  /**
   * Check if interaction should be sent immediately
   */
  private isHighPriorityInteraction(action: InteractionType): boolean {
    return [
      InteractionType.PHONE_CALL,
      InteractionType.OFFER_USE,
      InteractionType.REVIEW,
      InteractionType.COLLECTION_ADD,
    ].includes(action);
  }

  /**
   * Send single interaction immediately
   */
  private async sendInteractionImmediately(interaction: UserInteraction): Promise<void> {
    if (!this.isOnline) {
      return; // Will be retried later
    }

    try {
      await this.sendInteractionToAPI(interaction);
      await this.removeInteractionFromLocal(interaction);
    } catch (error) {
      console.error('Failed to send immediate interaction:', error);
    }
  }

  /**
   * Flush current batch to server
   */
  async flushBatch(): Promise<void> {
    if (this.batch.length === 0 || !this.isOnline) {
      console.log('⏸️ Skipping batch flush:', {
        batchLength: this.batch.length,
        isOnline: this.isOnline,
        reason: this.batch.length === 0 ? 'empty_batch' : 'offline'
      });
      return;
    }

    // Check authentication before attempting to send batch
    const canSend = await this.canSendTrackingData();
    if (!canSend) {
      console.log('⏸️ Skipping batch flush: User not authenticated or timing restriction');
      // Clear the batch since we can't send it and don't want to accumulate
      this.batch = [];
      return;
    }

    const batchToSend = [...this.batch];
    this.batch = [];

    console.log('🚀 Flushing batch of interactions:', {
      count: batchToSend.length,
      interactions: batchToSend.map(i => ({ business_id: i.business_id, action: i.action }))
    });

    try {
      await this.sendBatchToAPI(batchToSend);
      // Remove sent interactions from local storage
      for (const interaction of batchToSend) {
        await this.removeInteractionFromLocal(interaction);
      }
      console.log('✅ Batch successfully sent and cleaned up');
    } catch (error) {
      console.error('❌ Failed to send batch:', error);
      // Add back to batch for retry
      this.batch.unshift(...batchToSend);
      console.log('🔄 Re-added failed interactions to batch for retry');
    }
  }

  /**
   * Get current user location and device source
   */
  private async getLocationAndSource(): Promise<{latitude: number, longitude: number, source: string}> {
    try {
      const coordinates = locationService.getCoordinatesForAPI();
      
      return {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        source: this.getDeviceSource() // Use device name instead of location source
      };
    } catch (error) {
      console.log('Error getting location from service:', error);
      // Return default coordinates if location service fails
      return { 
        latitude: 22.3569, 
        longitude: 91.7832, 
        source: this.getDeviceSource()
      };
    }
  }

  /**
   * Send single interaction to API
   */
  private async sendInteractionToAPI(interaction: UserInteraction): Promise<TrackingResponse> {
    // Check authentication and timing before sending
    if (!(await this.canSendTrackingData())) {
      throw new Error('Cannot send tracking data: Authentication or timing check failed');
    }

    const token = await getAuthToken();
    const location = await this.getLocationAndSource();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'ReactNative/5StrApp',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const payload = {
      ...interaction,
      user_latitude: location.latitude,
      user_longitude: location.longitude,
      source: location.source
    };

    console.log('📊 Sending single interaction to API:');
    console.log('   Endpoint:', getApiUrl(API_CONFIG.ENDPOINTS.TRACK_INTERACTION));
    console.log('   Has Auth Token:', !!token);
    console.log('   Complete Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.TRACK_INTERACTION), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('❌ API Error (single interaction):', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Single interaction API response:');
    console.log('   Status:', response.status);
    console.log('   Response Data:', JSON.stringify(result, null, 2));
    return result;
  }

  /**
   * Send batch of interactions to API
   */
  private async sendBatchToAPI(interactions: UserInteraction[]): Promise<BatchTrackingResponse> {
    // Check authentication and timing before sending
    if (!(await this.canSendTrackingData())) {
      throw new Error('Cannot send tracking data: Authentication or timing check failed');
    }

    // Validate interactions before sending
    const validInteractions = interactions.filter(interaction => {
      const isValid = (
        interaction.business_id && 
        typeof interaction.business_id === 'number' &&
        interaction.business_id > 0 &&
        interaction.action && 
        typeof interaction.action === 'string' &&
        interaction.timestamp && 
        typeof interaction.timestamp === 'number' &&
        interaction.timestamp > 0 &&
        interaction.context &&
        typeof interaction.context === 'object'
      );

      if (!isValid) {
        console.warn('🚨 Invalid interaction filtered out:', {
          business_id: interaction.business_id,
          business_id_type: typeof interaction.business_id,
          action: interaction.action,
          action_type: typeof interaction.action,
          timestamp: interaction.timestamp,
          timestamp_type: typeof interaction.timestamp,
          context: interaction.context,
          context_type: typeof interaction.context,
          full_interaction: interaction
        });
      } else {
        console.log('✅ Valid interaction:', {
          business_id: interaction.business_id,
          action: interaction.action,
          timestamp: new Date(interaction.timestamp).toISOString(),
          context: interaction.context
        });
      }

      return isValid;
    });

    if (validInteractions.length === 0) {
      console.warn('🚨 No valid interactions to send');
      return { success: false, message: 'No valid interactions to send' };
    }

    if (validInteractions.length !== interactions.length) {
      console.warn(`🚨 Filtered out ${interactions.length - validInteractions.length} invalid interactions`);
    }

    const token = await getAuthToken();
    const location = await this.getLocationAndSource();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'ReactNative/5StrApp',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const payload = {
      user_latitude: location.latitude,
      user_longitude: location.longitude,
      source: location.source,
      interactions: validInteractions.map(interaction => ({
        business_id: parseInt(String(interaction.business_id), 10), // Ensure it's an integer
        action: interaction.action,
        context: interaction.context,
        timestamp: interaction.timestamp,
      })),
    };

    console.log('📊 Sending batch interactions to API:');
    console.log('   Endpoint:', getApiUrl(API_CONFIG.ENDPOINTS.TRACK_BATCH));
    console.log('   Has Auth Token:', !!token);
    console.log('   Interaction Count:', validInteractions.length);
    console.log('   Business IDs being tracked:', validInteractions.map(i => i.business_id));
    console.log('   Business IDs types:', validInteractions.map(i => typeof i.business_id));
    console.log('   Actions being tracked:', validInteractions.map(i => i.action));
    
    // Log each interaction individually for debugging
    validInteractions.forEach((interaction, index) => {
      console.log(`   Interaction ${index}:`, {
        business_id: interaction.business_id,
        business_id_type: typeof interaction.business_id,
        action: interaction.action,
        timestamp: interaction.timestamp,
        context: interaction.context
      });
    });
    
    console.log('   Complete Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.TRACK_BATCH), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('❌ API Error (batch interactions):', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        interactionCount: validInteractions.length
      });

      // Try to get the error response body for more details
      try {
        const errorBody = await response.text();
        console.error('❌ Error Response Body:', errorBody);
        
        // Log the problematic interactions for debugging
        console.error('❌ Problematic interactions that caused 422:', JSON.stringify(validInteractions, null, 2));
        
        // Specifically log the first interaction that's causing the issue
        if (validInteractions.length > 0) {
          console.error('❌ FIRST INTERACTION (causing error):', {
            business_id: validInteractions[0].business_id,
            business_id_type: typeof validInteractions[0].business_id,
            business_id_value: JSON.stringify(validInteractions[0].business_id),
            action: validInteractions[0].action,
            timestamp: validInteractions[0].timestamp,
            context: validInteractions[0].context,
            full_interaction: validInteractions[0]
          });
        }
        
        // Try to identify which specific interaction is causing the issue
        const errorObj = JSON.parse(errorBody);
        if (errorObj.errors) {
          Object.keys(errorObj.errors).forEach(key => {
            console.error(`❌ Field error - ${key}:`, errorObj.errors[key]);
          });
        }
      } catch (bodyError) {
        console.error('❌ Could not read error response body:', bodyError);
      }

      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Batch interactions API response:');
    console.log('   Status:', response.status);
    console.log('   Sent Interactions:', validInteractions.length);
    console.log('   Response Data:', JSON.stringify(result, null, 2));
    return result;
  }

  /**
   * Store interaction locally for offline support
   */
  private async storeInteractionLocally(interaction: UserInteraction): Promise<void> {
    try {
      const pendingKey = 'pending_interactions';
      const existing = await AsyncStorage.getItem(pendingKey);
      const pendingInteractions = existing ? JSON.parse(existing) : [];
      
      pendingInteractions.push(interaction);
      
      // Keep only last 100 interactions to prevent storage bloat
      if (pendingInteractions.length > 100) {
        pendingInteractions.splice(0, pendingInteractions.length - 100);
      }
      
      await AsyncStorage.setItem(pendingKey, JSON.stringify(pendingInteractions));
    } catch (error) {
      console.error('Failed to store interaction locally:', error);
    }
  }

  /**
   * Remove interaction from local storage
   */
  private async removeInteractionFromLocal(interaction: UserInteraction): Promise<void> {
    try {
      const pendingKey = 'pending_interactions';
      const existing = await AsyncStorage.getItem(pendingKey);
      if (!existing) return;
      
      const pendingInteractions = JSON.parse(existing);
      const updatedInteractions = pendingInteractions.filter((pending: UserInteraction) => 
        !(pending.business_id === interaction.business_id &&
          pending.action === interaction.action &&
          pending.timestamp === interaction.timestamp)
      );
      
      await AsyncStorage.setItem(pendingKey, JSON.stringify(updatedInteractions));
    } catch (error) {
      console.error('Failed to remove interaction from local storage:', error);
    }
  }

  /**
   * Retry pending interactions when connection is restored
   */
  async retryPendingInteractions(): Promise<void> {
    try {
      // Check authentication before attempting to retry
      const canSend = await this.canSendTrackingData();
      if (!canSend) {
        console.log('⏸️ Skipping pending interactions retry: User not authenticated or timing restriction');
        return;
      }

      const pendingKey = 'pending_interactions';
      const existing = await AsyncStorage.getItem(pendingKey);
      if (!existing) return;
      
      const pendingInteractions: UserInteraction[] = JSON.parse(existing);
      
      if (pendingInteractions.length === 0) return;
      
      console.log(`🔄 Retrying ${pendingInteractions.length} pending interactions`);
      
      // Try to send in batches
      const batchSize = 10;
      for (let i = 0; i < pendingInteractions.length; i += batchSize) {
        const batch = pendingInteractions.slice(i, i + batchSize);
        try {
          await this.sendBatchToAPI(batch);
        } catch (error) {
          console.error('❌ Failed to retry batch:', error);
          // Keep remaining interactions for next retry
          const remainingInteractions = pendingInteractions.slice(i);
          await AsyncStorage.setItem(pendingKey, JSON.stringify(remainingInteractions));
          return;
        }
      }
      
      // Clear all pending interactions if successful
      await AsyncStorage.removeItem(pendingKey);
      console.log('✅ Successfully retried all pending interactions');
    } catch (error) {
      console.error('❌ Failed to retry pending interactions:', error);
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    
    // Flush any remaining interactions
    this.flushBatch();
  }

  /**
   * Clear all pending interactions (useful when user logs out)
   */
  async clearPendingInteractions(): Promise<void> {
    try {
      await AsyncStorage.removeItem('pending_interactions');
      this.batch = []; // Clear current batch as well
      console.log('🧹 Cleared all pending interactions');
    } catch (error) {
      console.error('❌ Failed to clear pending interactions:', error);
    }
  }

  // ==================== High-level tracking methods ====================

  /**
   * Track business view
   */
  async trackView(businessId: number, context: InteractionContext = {}): Promise<void> {
    await this.trackInteraction(businessId, InteractionType.VIEW, {
      ...context,
      source: context.source || 'unknown',
    });
  }

  /**
   * Track business click
   */
  async trackClick(businessId: number, context: InteractionContext = {}): Promise<void> {
    await this.trackInteraction(businessId, InteractionType.CLICK, {
      ...context,
      element: context.element || 'business_card',
    });
  }

  /**
   * Track search result click
   */
  async trackSearchClick(businessId: number, context: InteractionContext = {}): Promise<void> {
    await this.trackInteraction(businessId, InteractionType.SEARCH_CLICK, {
      ...context,
      source: 'search_results',
    });
  }

  /**
   * Track phone call
   */
  async trackPhoneCall(businessId: number, context: InteractionContext = {}): Promise<void> {
    await this.trackInteraction(businessId, InteractionType.PHONE_CALL, {
      ...context,
      element: 'phone_button',
    });
  }

  /**
   * Track favorite/unfavorite action
   */
  async trackFavorite(businessId: number, isFavoriting: boolean, context: InteractionContext = {}): Promise<void> {
    const action = isFavoriting ? InteractionType.FAVORITE : InteractionType.UNFAVORITE;
    await this.trackInteraction(businessId, action, {
      ...context,
      element: 'favorite_button',
    });
  }

  /**
   * Track review submission
   */
  async trackReview(businessId: number, context: InteractionContext = {}): Promise<void> {
    await this.trackInteraction(businessId, InteractionType.REVIEW, {
      ...context,
      element: 'review_form',
    });
  }

  /**
   * Track business share
   */
  async trackShare(businessId: number, context: InteractionContext = {}): Promise<void> {
    await this.trackInteraction(businessId, InteractionType.SHARE, {
      ...context,
      element: 'share_button',
    });
  }

  /**
   * Track collection actions
   */
  async trackCollectionAdd(businessId: number, collectionId: number, context: InteractionContext = {}): Promise<void> {
    await this.trackInteraction(businessId, InteractionType.COLLECTION_ADD, {
      ...context,
      collection_id: collectionId,
      element: 'collection_button',
    });
  }

  async trackCollectionRemove(businessId: number, collectionId: number, context: InteractionContext = {}): Promise<void> {
    await this.trackInteraction(businessId, InteractionType.COLLECTION_REMOVE, {
      ...context,
      collection_id: collectionId,
      element: 'collection_button',
    });
  }

  /**
   * Track offer interactions
   */
  async trackOfferView(businessId: number, offerId: number, context: InteractionContext = {}): Promise<void> {
    await this.trackInteraction(businessId, InteractionType.OFFER_VIEW, {
      ...context,
      offer_id: offerId,
    });
  }

  async trackOfferUse(businessId: number, offerId: number, context: InteractionContext = {}): Promise<void> {
    await this.trackInteraction(businessId, InteractionType.OFFER_USE, {
      ...context,
      offer_id: offerId,
      element: 'offer_redeem_button',
    });
  }

  /**
   * Track directions request
   */
  async trackDirectionRequest(businessId: number, context: InteractionContext = {}): Promise<void> {
    await this.trackInteraction(businessId, InteractionType.DIRECTION_REQUEST, {
      ...context,
      element: 'directions_button',
    });
  }

  /**
   * Track website visit
   */
  async trackWebsiteClick(businessId: number, context: InteractionContext = {}): Promise<void> {
    await this.trackInteraction(businessId, InteractionType.WEBSITE_CLICK, {
      ...context,
      element: 'website_button',
    });
  }

  /**
   * Public method to record user login time
   */
  recordUserLogin(): void {
    this.setUserLoginTime();
  }
}

// Create and export singleton instance
export const userTracker = new UserInteractionTracker();

// Export utility functions for React components
export const useInteractionTracking = () => {
  return {
    trackView: userTracker.trackView.bind(userTracker),
    trackClick: userTracker.trackClick.bind(userTracker),
    trackSearchClick: userTracker.trackSearchClick.bind(userTracker),
    trackPhoneCall: userTracker.trackPhoneCall.bind(userTracker),
    trackFavorite: userTracker.trackFavorite.bind(userTracker),
    trackReview: userTracker.trackReview.bind(userTracker),
    trackShare: userTracker.trackShare.bind(userTracker),
    trackCollectionAdd: userTracker.trackCollectionAdd.bind(userTracker),
    trackCollectionRemove: userTracker.trackCollectionRemove.bind(userTracker),
    trackOfferView: userTracker.trackOfferView.bind(userTracker),
    trackOfferUse: userTracker.trackOfferUse.bind(userTracker),
    trackDirectionRequest: userTracker.trackDirectionRequest.bind(userTracker),
    trackWebsiteClick: userTracker.trackWebsiteClick.bind(userTracker),
  };
};

export default userTracker;
