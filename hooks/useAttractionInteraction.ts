import {
    getUserAttractionInteractions,
    getUserBookmarkedAttractions,
    getUserLikedAttractions,
    getUserVisitedAttractions,
    removeAttractionInteraction,
    storeAttractionInteraction,
    toggleAttractionInteraction
} from '@/services/api';
import {
    AttractionInteractionPriority,
    AttractionInteractionRequest,
    AttractionInteractionToggleRequest,
    AttractionInteractionType,
    VisitCompanionType
} from '@/types/api';
import React, { useCallback, useState } from 'react';
import { useToast } from './useToast';

interface AttractionInteractionState {
  isLiked: boolean;
  isBookmarked: boolean;
  isWishlisted: boolean;
  hasVisited: boolean;
  loading: boolean;
  error: string | null;
}

export const useAttractionInteraction = (attractionId: number) => {
  const [state, setState] = useState<AttractionInteractionState>({
    isLiked: false,
    isBookmarked: false,
    isWishlisted: false,
    hasVisited: false,
    loading: true, // Start with loading true to fetch initial state
    error: null,
  });

  const { showSuccess, showError } = useToast();

  // Initialize interaction states from API
  const initializeStates = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Fetch user's interactions for this attraction
      const response = await getUserAttractionInteractions(attractionId);
      
      if (response.success && response.data?.data) {
        const interactions = response.data.data; // Access the nested data array
        
        const isLiked = interactions.some((i: any) => i.interaction_type === 'like');
        const isBookmarked = interactions.some((i: any) => i.interaction_type === 'bookmark');
        const isWishlisted = interactions.some((i: any) => i.interaction_type === 'wishlist');
        const hasVisited = interactions.some((i: any) => i.interaction_type === 'visit');
        
        setState(prev => ({
          ...prev,
          isLiked,
          isBookmarked,
          isWishlisted,
          hasVisited,
          loading: false,
        }));
      } else {
        // If no data or user not authenticated, just stop loading
        setState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.log('Could not fetch user interactions (possibly not authenticated):', error);
      setState(prev => ({ ...prev, loading: false })); // Don't show error for auth issues
    }
  }, [attractionId]);

  // Initialize on mount
  React.useEffect(() => {
    initializeStates();
  }, [initializeStates]);

  // Helper to update state
  const updateState = useCallback((updates: Partial<AttractionInteractionState>) => {
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);

  // Store new interaction
  const storeInteraction = useCallback(async (interactionData: Omit<AttractionInteractionRequest, 'attraction_id'>) => {
    updateState({ loading: true, error: null });
    
    try {
      const response = await storeAttractionInteraction({
        ...interactionData,
        attraction_id: attractionId,
      });

      if (response.success) {
        showSuccess(response.message);
        
        // Update local state based on interaction type
        const { interaction_type } = interactionData;
        switch (interaction_type) {
          case 'like':
            updateState({ isLiked: true });
            break;
          case 'bookmark':
            updateState({ isBookmarked: true });
            break;
          case 'wishlist':
            updateState({ isWishlisted: true });
            break;
          case 'visit':
            updateState({ hasVisited: true });
            break;
        }
        
        return response;
      } else {
        throw new Error(response.message || 'Failed to record interaction');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to record interaction';
      updateState({ error: errorMessage });
      showError(errorMessage);
      throw error;
    } finally {
      updateState({ loading: false });
    }
  }, [attractionId, showSuccess, showError, updateState]);

  // Toggle interaction (like, bookmark, wishlist)
  const toggleInteraction = useCallback(async (toggleData: Omit<AttractionInteractionToggleRequest, 'attraction_id'>) => {
    updateState({ loading: true, error: null });
    
    try {
      const response = await toggleAttractionInteraction({
        ...toggleData,
        attraction_id: attractionId,
      });

      if (response.success) {
        showSuccess(response.message);
        
        // Update local state based on interaction type and action
        const { interaction_type } = toggleData;
        const { action } = response.data;
        const isActive = action === 'created';
        
        switch (interaction_type) {
          case 'like':
            updateState({ isLiked: isActive });
            break;
          case 'bookmark':
            updateState({ isBookmarked: isActive });
            break;
          case 'wishlist':
            updateState({ isWishlisted: isActive });
            break;
        }
        
        return response;
      } else {
        throw new Error(response.message || 'Failed to toggle interaction');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle interaction';
      updateState({ error: errorMessage });
      showError(errorMessage);
      throw error;
    } finally {
      updateState({ loading: false });
    }
  }, [attractionId, showSuccess, showError, updateState]);

  // Remove interaction
  const removeInteraction = useCallback(async (interactionType: AttractionInteractionType) => {
    updateState({ loading: true, error: null });
    
    try {
      const response = await removeAttractionInteraction({
        attraction_id: attractionId,
        interaction_type: interactionType,
      });

      if (response.success) {
        showSuccess(response.message);
        
        // Update local state
        switch (interactionType) {
          case 'like':
            updateState({ isLiked: false });
            break;
          case 'bookmark':
            updateState({ isBookmarked: false });
            break;
          case 'wishlist':
            updateState({ isWishlisted: false });
            break;
          case 'visit':
            updateState({ hasVisited: false });
            break;
        }
        
        return response;
      } else {
        throw new Error(response.message || 'Failed to remove interaction');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove interaction';
      updateState({ error: errorMessage });
      showError(errorMessage);
      throw error;
    } finally {
      updateState({ loading: false });
    }
  }, [attractionId, showSuccess, showError, updateState]);

  // Convenience methods for specific interactions
  const like = useCallback(async (notes?: string, isPublic: boolean = true) => {
    return toggleInteraction({
      interaction_type: 'like',
      notes,
      is_public: isPublic,
    });
  }, [toggleInteraction]);

  const bookmark = useCallback(async (
    notes?: string,
    priority?: AttractionInteractionPriority,
    plannedVisitDate?: string,
    isPublic: boolean = false
  ) => {
    return toggleInteraction({
      interaction_type: 'bookmark',
      notes,
      priority,
      planned_visit_date: plannedVisitDate,
      is_public: isPublic,
    });
  }, [toggleInteraction]);

  const addToWishlist = useCallback(async (
    notes?: string,
    priority?: AttractionInteractionPriority,
    plannedVisitDate?: string,
    isPublic: boolean = true
  ) => {
    return toggleInteraction({
      interaction_type: 'wishlist',
      notes,
      priority,
      planned_visit_date: plannedVisitDate,
      is_public: isPublic,
    });
  }, [toggleInteraction]);

  const recordVisit = useCallback(async (
    visitDate: string,
    rating: number,
    notes?: string,
    durationMinutes?: number,
    companions?: VisitCompanionType[],
    weather?: string,
    isPublic: boolean = true
  ) => {
    return storeInteraction({
      interaction_type: 'visit',
      visit_date: visitDate,
      rating,
      notes,
      duration_minutes: durationMinutes,
      companions,
      weather,
      is_public: isPublic,
    });
  }, [storeInteraction]);

  const share = useCallback(async (
    platform: string,
    message?: string,
    notes?: string,
    isPublic: boolean = true
  ) => {
    return storeInteraction({
      interaction_type: 'share',
      platform,
      message,
      notes,
      is_public: isPublic,
    });
  }, [storeInteraction]);

  return {
    // State
    isLiked: state.isLiked,
    isBookmarked: state.isBookmarked,
    isWishlisted: state.isWishlisted,
    hasVisited: state.hasVisited,
    loading: state.loading,
    error: state.error,
    
    // General methods
    storeInteraction,
    toggleInteraction,
    removeInteraction,
    
    // Convenience methods
    like,
    bookmark,
    addToWishlist,
    recordVisit,
    share,
    
    // State management
    updateState,
  };
};

// Hook for managing user's attraction interaction lists
export const useUserAttractionLists = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useToast();

  const fetchLikedAttractions = useCallback(async (page: number = 1, perPage: number = 15) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getUserLikedAttractions(page, perPage);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch liked attractions');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch liked attractions';
      setError(errorMessage);
      showError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const fetchBookmarkedAttractions = useCallback(async (page: number = 1, perPage: number = 15) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getUserBookmarkedAttractions(page, perPage);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch bookmarked attractions');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch bookmarked attractions';
      setError(errorMessage);
      showError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const fetchVisitedAttractions = useCallback(async (page: number = 1, perPage: number = 15) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getUserVisitedAttractions(page, perPage);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch visited attractions');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch visited attractions';
      setError(errorMessage);
      showError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  return {
    loading,
    error,
    fetchLikedAttractions,
    fetchBookmarkedAttractions,
    fetchVisitedAttractions,
  };
};