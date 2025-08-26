import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { locationService, UserLocation } from '../services/locationService';

interface LocationContextType {
  location: UserLocation | null;
  isLoading: boolean;
  isUpdating: boolean;
  refreshLocation: () => Promise<void>;
  getCoordinatesForAPI: () => { latitude: number; longitude: number };
  locationAge: number;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [location, setLocation] = useState<UserLocation | null>(null);
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

  const getCoordinatesForAPI = () => {
    return locationService.getCoordinatesForAPI();
  };

  const contextValue: LocationContextType = {
    location,
    isLoading,
    isUpdating,
    refreshLocation,
    getCoordinatesForAPI,
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
