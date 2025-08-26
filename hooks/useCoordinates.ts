import { useLocation } from '@/contexts/LocationContext';

/**
 * Hook to easily get coordinates for API calls
 * Always returns valid coordinates (defaults to Chittagong if no location available)
 */
export const useCoordinates = () => {
  const { getCoordinatesForAPI } = useLocation();
  
  return {
    coordinates: getCoordinatesForAPI(),
    getCoordinatesForAPI,
  };
};

export default useCoordinates;
