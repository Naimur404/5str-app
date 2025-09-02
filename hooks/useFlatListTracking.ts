import React, { useCallback } from 'react';
import { userTracker } from '@/services/userTrackingService';

/**
 * Hook for tracking interactions in FlatList components
 * Provides tracking functions that automatically include position and section context
 */
export function useFlatListTracking(
  section: string,
  searchQuery?: string
) {
  const trackItemView = useCallback((businessId: number, position: number) => {
    // Validate business ID before tracking
    if (!businessId || typeof businessId !== 'number' || businessId <= 0) {
      console.warn('🚨 Invalid business ID in trackItemView:', {
        businessId,
        businessId_type: typeof businessId,
        position,
        section
      });
      return;
    }

    userTracker.trackView(businessId, {
      section,
      position: position + 1, // Make position 1-based
      source: 'list_view',
      search_query: searchQuery,
    });
  }, [section, searchQuery]);

  const trackItemClick = useCallback((businessId: number, position: number) => {
    // Validate business ID before tracking
    if (!businessId || typeof businessId !== 'number' || businessId <= 0) {
      console.warn('🚨 Invalid business ID in trackItemClick:', {
        businessId,
        businessId_type: typeof businessId,
        position,
        section
      });
      return;
    }

    if (searchQuery) {
      userTracker.trackSearchClick(businessId, {
        section,
        position: position + 1,
        search_query: searchQuery,
        element: 'list_item',
      });
    } else {
      userTracker.trackClick(businessId, {
        section,
        position: position + 1,
        element: 'list_item',
      });
    }
  }, [section, searchQuery]);

  return {
    trackItemView,
    trackItemClick,
  };
}

/**
 * Simple function to add tracking to business card press handlers
 * Use this in your existing FlatList renderItem functions
 */
export function addTrackingToPress(
  originalOnPress: () => void,
  businessId: number,
  position: number,
  section: string,
  searchQuery?: string
) {
  return () => {
    // Validate business ID before tracking
    if (!businessId || typeof businessId !== 'number' || businessId <= 0) {
      console.warn('🚨 Invalid business ID in addTrackingToPress:', {
        businessId,
        businessId_type: typeof businessId,
        position,
        section,
        searchQuery
      });
      // Still call the original onPress even if tracking fails
      originalOnPress();
      return;
    }

    // Track the interaction
    if (searchQuery) {
      userTracker.trackSearchClick(businessId, {
        section,
        position: position + 1,
        search_query: searchQuery,
        element: 'business_card',
      });
    } else {
      userTracker.trackClick(businessId, {
        section,
        position: position + 1,
        element: 'business_card',
      });
    }
    
    // Call the original onPress
    originalOnPress();
  };
}

export default useFlatListTracking;
