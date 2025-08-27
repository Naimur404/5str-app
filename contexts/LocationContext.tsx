import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { locationService, UserLocation } from '../services/locationService';

interface LocationContextType {
  location: UserLocation | null;
  manualLocation: { name: string; latitude: number; longitude: number; division?: string } | null;
  isLoading: boolean;
  isUpdating: boolean;
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
  const [locationAge, setLocationAge] = useState(0);

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

  const refreshLocation = async () => {
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
  };

  const requestLocationUpdate = async () => {
    try {
      setIsUpdating(true);
      console.log('LocationProvider: User requested location update');
      
      const result = await locationService.requestLocationUpdate();
      
      if (result.success && result.location) {
        setLocation(result.location);
        setLocationAge(locationService.getLocationAge());
        console.log('LocationProvider: Location updated successfully');
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
    }
  };

  const getCoordinatesForAPI = () => {
    // If manual location is set, use it; otherwise use the service
    if (manualLocation) {
      return {
        latitude: manualLocation.latitude,
        longitude: manualLocation.longitude,
      };
    }
    return locationService.getCoordinatesForAPI();
  };

  const setManualLocation = (location: { name: string; latitude: number; longitude: number; division?: string }) => {
    setManualLocationState(location);
    console.log('LocationProvider: Manual location set:', location);
  };

  const clearManualLocation = () => {
    setManualLocationState(null);
    console.log('LocationProvider: Manual location cleared');
  };

  const getCurrentLocationInfo = () => {
    if (manualLocation) {
      return {
        name: manualLocation.name,
        isManual: true,
        division: manualLocation.division,
      };
    }
    
    // For GPS location, provide a generic name
    return {
      name: 'Current Location',
      isManual: false,
    };
  };

  const contextValue: LocationContextType = {
    location,
    manualLocation,
    isLoading,
    isUpdating,
    refreshLocation,
    requestLocationUpdate,
    setManualLocation,
    clearManualLocation,
    getCoordinatesForAPI,
    getCurrentLocationInfo,
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
