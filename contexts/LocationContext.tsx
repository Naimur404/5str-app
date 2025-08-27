import React, { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { locationService, UserLocation } from '../services/locationService';

interface LocationContextType {
  location: UserLocation | null;
  manualLocation: { name: string; latitude: number; longitude: number; division?: string } | null;
  isLoading: boolean;
  isUpdating: boolean;
  isLocationChanging: boolean;
  refreshLocation: () => Promise<void>;
  requestLocationUpdate: () => Promise<{
    success: boolean;
    location?: UserLocation;
    message: string;
  }>;
  setManualLocation: (location: { name: string; latitude: number; longitude: number; division?: string }) => void;
  clearManualLocation: () => void;
  getCoordinatesForAPI: () => { latitude: number; longitude: number };
  getCurrentLocationInfo: () => { name: string; isManual: boolean; division?: string };
  onLocationChange: (callback: () => void) => () => void;
  locationAge: number;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [manualLocation, setManualLocationState] = useState<{ name: string; latitude: number; longitude: number; division?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLocationChanging, setIsLocationChanging] = useState(false);
  const [locationAge, setLocationAge] = useState(0);
  const locationChangeCallbacks = useRef<Set<() => void>>(new Set());
  
  // Use ref for immediate access to manual location
  const manualLocationRef = useRef<{ name: string; latitude: number; longitude: number; division?: string } | null>(null);

  useEffect(() => {
    initializeLocation();
    
    // Update location age every minute
    const ageUpdateInterval = setInterval(() => {
      setLocationAge(locationService.getLocationAge());
      setIsUpdating(locationService.isUpdating());
    }, 60000); // Update every minute

    return () => {
      clearInterval(ageUpdateInterval);
      locationService.cleanup();
    };
  }, []);

  const initializeLocation = async () => {
    try {
      setIsLoading(true);
      console.log('LocationProvider: Initializing location service');
      
      const initialLocation = await locationService.initialize();
      setLocation(initialLocation);
      setLocationAge(locationService.getLocationAge());
      
      console.log('LocationProvider: Location initialized:', {
        lat: initialLocation.latitude,
        lng: initialLocation.longitude,
        age: locationService.getLocationAge() + ' minutes'
      });
    } catch (error) {
      console.error('LocationProvider: Error initializing location:', error);
      // Set default location as fallback
      const defaultLocation = locationService.getCoordinatesForAPI();
      setLocation({
        ...defaultLocation,
        timestamp: Date.now(),
        source: 'default',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshLocation = useCallback(async () => {
    try {
      setIsUpdating(true);
      console.log('LocationProvider: Manual refresh requested');
      
      const newLocation = await locationService.refreshLocation();
      setLocation(newLocation);
      setLocationAge(locationService.getLocationAge());
      
      console.log('LocationProvider: Location refreshed manually');
    } catch (error) {
      console.error('LocationProvider: Error refreshing location:', error);
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const requestLocationUpdate = useCallback(async () => {
    try {
      setIsUpdating(true);
      setIsLocationChanging(true);
      console.log('🔄 LocationProvider: User requested location update');
      
      // Clear manual location when using GPS
      manualLocationRef.current = null;
      setManualLocationState(null);
      
      const result = await locationService.requestLocationUpdate();
      
      if (result.success && result.location) {
        setLocation(result.location);
        setLocationAge(locationService.getLocationAge());
        console.log('✅ LocationProvider: Location updated successfully');
        
        // Notify all listeners that location changed
        console.log('🔔 Notifying', locationChangeCallbacks.current.size, 'location change listeners');
        locationChangeCallbacks.current.forEach(callback => {
          try {
            callback();
          } catch (error) {
            console.error('LocationProvider: Error in location change callback:', error);
          }
        });
      }
      
      return result;
    } catch (error) {
      console.error('LocationProvider: Error requesting location update:', error);
      return {
        success: false,
        message: 'Failed to update location. Please try again.'
      };
    } finally {
      setIsUpdating(false);
      // Reset location changing state after a delay to allow for data fetching
      setTimeout(() => {
        setIsLocationChanging(false);
      }, 1000);
    }
  }, []);

  const getCoordinatesForAPI = useCallback(() => {
    // Use ref for immediate access to manual location
    const currentManualLocation = manualLocationRef.current;
    
    if (currentManualLocation) {
      console.log('🎯 Using manual location for API:', currentManualLocation);
      return {
        latitude: currentManualLocation.latitude,
        longitude: currentManualLocation.longitude,
      };
    }
    const serviceCoords = locationService.getCoordinatesForAPI();
    console.log('📡 Using service location for API:', serviceCoords);
    return serviceCoords;
  }, []); // Remove manualLocation dependency since we're using ref

  const setManualLocation = useCallback((location: { name: string; latitude: number; longitude: number; division?: string }) => {
    setIsLocationChanging(true);
    
    // Update ref immediately for instant access
    manualLocationRef.current = location;
    // Update state for UI
    setManualLocationState(location);
    
    console.log('🎯 LocationProvider: Manual location set:', location);
    
    // Immediately notify listeners since ref is updated
    console.log('🔔 Notifying', locationChangeCallbacks.current.size, 'location change listeners');
    locationChangeCallbacks.current.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('LocationProvider: Error in location change callback:', error);
      }
    });
    
    // Reset location changing state after a delay to allow for data fetching
    setTimeout(() => {
      setIsLocationChanging(false);
    }, 1500);
  }, []);

  const clearManualLocation = useCallback(() => {
    manualLocationRef.current = null;
    setManualLocationState(null);
    console.log('LocationProvider: Manual location cleared');
  }, []);

  const getCurrentLocationInfo = useCallback(() => {
    const currentManualLocation = manualLocationRef.current;
    
    if (currentManualLocation) {
      return {
        name: currentManualLocation.name,
        isManual: true,
        division: currentManualLocation.division,
      };
    }
    
    // For GPS location, provide a generic name
    return {
      name: 'Current Location',
      isManual: false,
    };
  }, []); // Remove manualLocation dependency since we're using ref

  // Subscribe to location changes
  const onLocationChange = useCallback((callback: () => void) => {
    locationChangeCallbacks.current.add(callback);
    console.log('📝 LocationProvider: Added location change listener. Total listeners:', locationChangeCallbacks.current.size);
    
    // Return unsubscribe function
    return () => {
      locationChangeCallbacks.current.delete(callback);
      console.log('🗑️ LocationProvider: Removed location change listener. Total listeners:', locationChangeCallbacks.current.size);
    };
  }, []);

  const contextValue: LocationContextType = {
    location,
    manualLocation,
    isLoading,
    isUpdating,
    isLocationChanging,
    refreshLocation,
    requestLocationUpdate,
    setManualLocation,
    clearManualLocation,
    getCoordinatesForAPI,
    getCurrentLocationInfo,
    onLocationChange,
    locationAge,
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export default LocationProvider;