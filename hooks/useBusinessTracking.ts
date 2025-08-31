import { useCallback, useEffect, useRef } from 'react';
import { userTracker, InteractionType, InteractionContext } from '@/services/userTrackingService';

/**
 * React Hook for Business Interaction Tracking
 * 
 * Provides easy-to-use tracking methods for React components.
 * Automatically tracks views when component mounts.
 */

export interface UseBusinessTrackingOptions {
  autoTrackView?: boolean;
  viewSource?: string;
  viewContext?: InteractionContext;
}

export function useBusinessTracking(
  businessId: number | null,
  options: UseBusinessTrackingOptions = {}
) {
  const { 
    autoTrackView = true, 
    viewSource = 'component_mount',
    viewContext = {} 
  } = options;
  
  const hasTrackedView = useRef(false);
  const businessIdRef = useRef(businessId);

  // Update ref when businessId changes
  useEffect(() => {
    businessIdRef.current = businessId;
    hasTrackedView.current = false;
  }, [businessId]);

  // Auto-track view on mount/businessId change
  useEffect(() => {
    if (autoTrackView && businessId && !hasTrackedView.current) {
      userTracker.trackView(businessId, {
        source: viewSource,
        ...viewContext,
      });
      hasTrackedView.current = true;
    }
  }, [businessId, autoTrackView, viewSource, viewContext]);

  // Tracking methods
  const trackClick = useCallback((context: InteractionContext = {}) => {
    if (businessIdRef.current) {
      userTracker.trackClick(businessIdRef.current, context);
    }
  }, []);

  const trackSearchClick = useCallback((context: InteractionContext = {}) => {
    if (businessIdRef.current) {
      userTracker.trackSearchClick(businessIdRef.current, context);
    }
  }, []);

  const trackPhoneCall = useCallback((context: InteractionContext = {}) => {
    if (businessIdRef.current) {
      userTracker.trackPhoneCall(businessIdRef.current, context);
    }
  }, []);

  const trackFavorite = useCallback((isFavoriting: boolean, context: InteractionContext = {}) => {
    if (businessIdRef.current) {
      userTracker.trackFavorite(businessIdRef.current, isFavoriting, context);
    }
  }, []);

  const trackReview = useCallback((context: InteractionContext = {}) => {
    if (businessIdRef.current) {
      userTracker.trackReview(businessIdRef.current, context);
    }
  }, []);

  const trackShare = useCallback((context: InteractionContext = {}) => {
    if (businessIdRef.current) {
      userTracker.trackShare(businessIdRef.current, context);
    }
  }, []);

  const trackCollectionAdd = useCallback((collectionId: number, context: InteractionContext = {}) => {
    if (businessIdRef.current) {
      userTracker.trackCollectionAdd(businessIdRef.current, collectionId, context);
    }
  }, []);

  const trackCollectionRemove = useCallback((collectionId: number, context: InteractionContext = {}) => {
    if (businessIdRef.current) {
      userTracker.trackCollectionRemove(businessIdRef.current, collectionId, context);
    }
  }, []);

  const trackOfferView = useCallback((offerId: number, context: InteractionContext = {}) => {
    if (businessIdRef.current) {
      userTracker.trackOfferView(businessIdRef.current, offerId, context);
    }
  }, []);

  const trackOfferUse = useCallback((offerId: number, context: InteractionContext = {}) => {
    if (businessIdRef.current) {
      userTracker.trackOfferUse(businessIdRef.current, offerId, context);
    }
  }, []);

  const trackDirectionRequest = useCallback((context: InteractionContext = {}) => {
    if (businessIdRef.current) {
      userTracker.trackDirectionRequest(businessIdRef.current, context);
    }
  }, []);

  const trackWebsiteClick = useCallback((context: InteractionContext = {}) => {
    if (businessIdRef.current) {
      userTracker.trackWebsiteClick(businessIdRef.current, context);
    }
  }, []);

  return {
    trackClick,
    trackSearchClick,
    trackPhoneCall,
    trackFavorite,
    trackReview,
    trackShare,
    trackCollectionAdd,
    trackCollectionRemove,
    trackOfferView,
    trackOfferUse,
    trackDirectionRequest,
    trackWebsiteClick,
  };
}

/**
 * Hook for tracking interactions in list views
 * Helps with tracking position and section context
 */
export function useListTracking(section: string = 'unknown') {
  const trackItemView = useCallback((businessId: number, position: number, context: InteractionContext = {}) => {
    userTracker.trackView(businessId, {
      section,
      position,
      source: 'list_view',
      ...context,
    });
  }, [section]);

  const trackItemClick = useCallback((businessId: number, position: number, context: InteractionContext = {}) => {
    userTracker.trackClick(businessId, {
      section,
      position,
      source: 'list_item',
      element: 'list_item',
      ...context,
    });
  }, [section]);

  const trackItemSearchClick = useCallback((businessId: number, position: number, searchQuery: string, context: InteractionContext = {}) => {
    userTracker.trackSearchClick(businessId, {
      section,
      position,
      source: 'search_results',
      search_query: searchQuery,
      element: 'search_result_item',
      ...context,
    });
  }, [section]);

  return {
    trackItemView,
    trackItemClick,
    trackItemSearchClick,
  };
}

/**
 * Hook for tracking search interactions
 */
export function useSearchTracking() {
  const trackSearchResultClick = useCallback((
    businessId: number, 
    position: number, 
    searchQuery: string, 
    context: InteractionContext = {}
  ) => {
    userTracker.trackSearchClick(businessId, {
      position,
      search_query: searchQuery,
      source: 'search_results',
      element: 'search_result',
      ...context,
    });
  }, []);

  return {
    trackSearchResultClick,
  };
}

/**
 * Hook for automatic view tracking with visibility detection
 * Useful for FlatList items and similar components
 */
export function useViewTracking(
  businessId: number | null,
  options: {
    threshold?: number;
    delay?: number;
    source?: string;
    position?: number;
    section?: string;
  } = {}
) {
  const {
    threshold = 0.5,
    delay = 1000,
    source = 'auto_view',
    position,
    section
  } = options;

  const hasTracked = useRef(false);
  const timeoutRef = useRef<any>(null);

  const trackViewIfVisible = useCallback(() => {
    if (businessId && !hasTracked.current) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        userTracker.trackView(businessId, {
          source,
          position,
          section,
          visibility_threshold: threshold,
          auto_tracked: true,
        });
        hasTracked.current = true;
      }, delay);
    }
  }, [businessId, threshold, delay, source, position, section]);

  const cancelViewTracking = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Reset tracking when businessId changes
  useEffect(() => {
    hasTracked.current = false;
    cancelViewTracking();
  }, [businessId, cancelViewTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelViewTracking();
    };
  }, [cancelViewTracking]);

  return {
    trackViewIfVisible,
    cancelViewTracking,
    hasTracked: hasTracked.current,
  };
}

export default useBusinessTracking;
