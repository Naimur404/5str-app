import { useCallback, useEffect, useRef } from 'react';

/**
 * React Hook for Attraction Interaction Tracking
 * 
 * Similar to useBusinessTracking but for attractions.
 * Automatically tracks views when component mounts.
 */

export interface UseAttractionTrackingOptions {
  autoTrackView?: boolean;
  viewSource?: string;
  viewContext?: Record<string, any>;
}

export function useAttractionTracking(
  attractionId: number | null,
  options: UseAttractionTrackingOptions = {}
) {
  const { 
    autoTrackView = true, 
    viewSource = 'component_mount',
    viewContext = {} 
  } = options;
  
  const hasTrackedView = useRef(false);
  const attractionIdRef = useRef(attractionId);

  // Update ref when attractionId changes
  useEffect(() => {
    attractionIdRef.current = attractionId;
    hasTrackedView.current = false;
  }, [attractionId]);

  // Auto-track view on mount/attractionId change
  useEffect(() => {
    if (autoTrackView && attractionId && !hasTrackedView.current) {
      // Log attraction view (we can implement this later if needed)
      console.log('📊 Attraction view tracked:', {
        attractionId,
        source: viewSource,
        context: viewContext,
      });
      hasTrackedView.current = true;
    }
  }, [attractionId, autoTrackView, viewSource, viewContext]);

  // Tracking methods for attractions
  const trackClick = useCallback((context: Record<string, any> = {}) => {
    if (attractionIdRef.current) {
      console.log('📊 Attraction click tracked:', {
        attractionId: attractionIdRef.current,
        context,
      });
    }
  }, []);

  const trackLike = useCallback((isLiking: boolean, context: Record<string, any> = {}) => {
    if (attractionIdRef.current) {
      console.log('📊 Attraction like tracked:', {
        attractionId: attractionIdRef.current,
        action: isLiking ? 'like' : 'unlike',
        context,
      });
    }
  }, []);

  const trackBookmark = useCallback((isBookmarking: boolean, context: Record<string, any> = {}) => {
    if (attractionIdRef.current) {
      console.log('📊 Attraction bookmark tracked:', {
        attractionId: attractionIdRef.current,
        action: isBookmarking ? 'bookmark' : 'unbookmark',
        context,
      });
    }
  }, []);

  const trackVisit = useCallback((context: Record<string, any> = {}) => {
    if (attractionIdRef.current) {
      console.log('📊 Attraction visit tracked:', {
        attractionId: attractionIdRef.current,
        context,
      });
    }
  }, []);

  const trackShare = useCallback((context: Record<string, any> = {}) => {
    if (attractionIdRef.current) {
      console.log('📊 Attraction share tracked:', {
        attractionId: attractionIdRef.current,
        context,
      });
    }
  }, []);

  const trackReview = useCallback((context: Record<string, any> = {}) => {
    if (attractionIdRef.current) {
      console.log('📊 Attraction review tracked:', {
        attractionId: attractionIdRef.current,
        context,
      });
    }
  }, []);

  return {
    trackClick,
    trackLike,
    trackBookmark,
    trackVisit,
    trackShare,
    trackReview,
  };
}

/**
 * Hook for tracking interactions in attraction list views
 */
export function useAttractionListTracking(section: string = 'unknown') {
  const trackItemView = useCallback((attractionId: number, position: number, context: Record<string, any> = {}) => {
    console.log('📊 Attraction list item view tracked:', {
      attractionId,
      section,
      position,
      context,
    });
  }, [section]);

  const trackItemClick = useCallback((attractionId: number, position: number, context: Record<string, any> = {}) => {
    console.log('📊 Attraction list item click tracked:', {
      attractionId,
      section,
      position,
      context,
    });
  }, [section]);

  return {
    trackItemView,
    trackItemClick,
  };
}

export default useAttractionTracking;