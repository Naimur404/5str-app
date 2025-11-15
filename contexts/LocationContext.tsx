import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { locationService, UserLocation } from '../services/locationService';

// Bangladesh boundaries (approximate)
const BANGLADESH_BOUNDS = {
  minLat: 20.670883,  // Southernmost point
  maxLat: 26.631945,  // Northernmost point
  minLng: 88.028336,  // Westernmost point
  maxLng: 92.673668,  // Easternmost point
};

// Function to check if coordinates are within Bangladesh
const isLocationInBangladesh = (latitude: number, longitude: number): boolean => {
  return (
    latitude >= BANGLADESH_BOUNDS.minLat &&
    latitude <= BANGLADESH_BOUNDS.maxLat &&
    longitude >= BANGLADESH_BOUNDS.minLng &&
    longitude <= BANGLADESH_BOUNDS.maxLng
  );
};

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
        // Check if the detected location is within Bangladesh
        if (!isLocationInBangladesh(result.location.latitude, result.location.longitude)) {
          console.warn('⚠️ Detected location is outside Bangladesh');
          Alert.alert(
            'Location Outside Bangladesh',
            'Your GPS location appears to be outside Bangladesh. This app provides services within Bangladesh only.\n\nPlease select a location from Bangladesh districts using the location selector at the top of the screen.',
            [
              {
                text: 'OK',
                style: 'default',
              },
            ]
          );
          
          // Use default location instead
          const defaultLocation = locationService.getCoordinatesForAPI();
          setLocation({
            ...defaultLocation,
            timestamp: Date.now(),
            source: 'default',
          });
          setLocationAge(0);
          
          return {
            success: false,
            message: 'Location is outside Bangladesh. Using default location.'
          };
        }
        
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
    
    let coordinates;
    if (currentManualLocation) {
      console.log('🎯 Using manual location for API:', currentManualLocation);
      coordinates = {
        latitude: currentManualLocation.latitude,
        longitude: currentManualLocation.longitude,
      };
    } else {
      coordinates = locationService.getCoordinatesForAPI();
      console.log('📡 Using service location for API:', coordinates);
    }
    
    // Check if location is within Bangladesh
    if (!isLocationInBangladesh(coordinates.latitude, coordinates.longitude)) {
      console.warn('⚠️ Location is outside Bangladesh bounds');
      Alert.alert(
        'Location Outside Bangladesh',
        'Your current location is outside Bangladesh. Please select a location from Bangladesh districts to access local businesses and services.\n\nYou can select a location from the location selector at the top of the screen.',
        [
          {
            text: 'OK',
            style: 'default',
          },
        ]
      );
      
      // Return default Chittagong location
      return {
        latitude: 22.3569,
        longitude: 91.7832,
      };
    }
    
    return coordinates;
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