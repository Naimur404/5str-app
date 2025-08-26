import React from 'react';

/**
 * Utility functions for managing loading states and skeleton animations
 */

/**
 * Creates a smart loading manager that prevents skeleton flashing while keeping the UI responsive
 * @param setLoading - Function to set loading state
 * @param setSkeletonVisible - Function to set skeleton visibility
 * @param minDisplayTime - Minimum time to show skeleton (default: 300ms)
 */
export const createSmartLoadingManager = (
  setLoading: (loading: boolean) => void,
  setSkeletonVisible: (visible: boolean) => void,
  minDisplayTime: number = 300
) => {
  let startTime: number | null = null;

  const startLoading = () => {
    startTime = Date.now();
    setLoading(true);
    setSkeletonVisible(true);
  };

  const stopLoading = () => {
    if (!startTime) {
      // No start time, stop immediately
      setLoading(false);
      setSkeletonVisible(false);
      return;
    }

    const elapsedTime = Date.now() - startTime;

    if (elapsedTime >= minDisplayTime) {
      // Enough time has passed, hide immediately
      setLoading(false);
      setSkeletonVisible(false);
    } else {
      // Too fast, wait a bit to prevent flash
      const remainingTime = minDisplayTime - elapsedTime;
      setTimeout(() => {
        setLoading(false);
        setSkeletonVisible(false);
      }, remainingTime);
    }

    startTime = null;
  };

  const stopImmediately = () => {
    setLoading(false);
    setSkeletonVisible(false);
    startTime = null;
  };

  return {
    startLoading,
    stopLoading,
    stopImmediately
  };
};

/**
 * Hook for managing skeleton loading with smart timing
 * @param minDisplayTime - Minimum time to show skeleton (default: 300ms)
 */
export const useSmartLoading = (minDisplayTime: number = 300) => {
  const [loading, setLoading] = React.useState(true);
  const [skeletonVisible, setSkeletonVisible] = React.useState(true);
  
  const manager = React.useMemo(
    () => createSmartLoadingManager(setLoading, setSkeletonVisible, minDisplayTime),
    [minDisplayTime]
  );

  return {
    loading,
    skeletonVisible,
    startLoading: manager.startLoading,
    stopLoading: manager.stopLoading,
    stopImmediately: manager.stopImmediately
  };
};
