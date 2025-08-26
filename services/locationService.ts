import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

class LocationService {
  private static instance: LocationService;
  private currentLocation: UserLocation | null = null;
  private isUpdatingLocation = false;
  private locationUpdateTimer: any = null;
  private backgroundUpdateTimer: any = null;
  
  // Cache duration: 10 minutes (in milliseconds)
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  private readonly STORAGE_KEY = 'cached_user_location';
  private readonly DEFAULT_LOCATION: UserLocation = {
    latitude: 22.3569,
    longitude: 91.7832,
    timestamp: Date.now(),
  };

  private constructor() {}

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Initialize location service - loads cached location and starts background updates
   */
  public async initialize(): Promise<UserLocation> {
    console.log('LocationService: Initializing...');
    
    // Try to load cached location first
    const cachedLocation = await this.loadCachedLocation();
    
    if (cachedLocation && this.isLocationValid(cachedLocation)) {
      console.log('LocationService: Using valid cached location');
      this.currentLocation = cachedLocation;
      this.scheduleNextUpdate(cachedLocation);
      return cachedLocation;
    }
    
    // No valid cache, get fresh location
    console.log('LocationService: No valid cache, getting fresh location');
    return this.getCurrentLocationWithFallback();
  }

  /**
   * Get current location with caching and fallback
   */
  public async getCurrentLocation(): Promise<UserLocation> {
    // Return cached location if valid
    if (this.currentLocation && this.isLocationValid(this.currentLocation)) {
      return this.currentLocation;
    }
    
    // Get fresh location
    return this.getCurrentLocationWithFallback();
  }

  /**
   * Force refresh location (ignores cache)
   */
  public async refreshLocation(): Promise<UserLocation> {
    console.log('LocationService: Force refreshing location');
    return this.getCurrentLocationWithFallback();
  }

  /**
   * Get location with fallback to default
   */
  private async getCurrentLocationWithFallback(): Promise<UserLocation> {
    if (this.isUpdatingLocation) {
      console.log('LocationService: Already updating, returning current or default');
      return this.currentLocation || this.DEFAULT_LOCATION;
    }

    this.isUpdatingLocation = true;

    try {
      // Set default location immediately
      if (!this.currentLocation) {
        this.currentLocation = { ...this.DEFAULT_LOCATION, timestamp: Date.now() };
      }

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('LocationService: Permission denied, using default location');
        const defaultLocation = { ...this.DEFAULT_LOCATION, timestamp: Date.now() };
        await this.saveLocationToCache(defaultLocation);
        this.currentLocation = defaultLocation;
        this.scheduleNextUpdate(defaultLocation);
        return defaultLocation;
      }

      // Get actual location
      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newLocation: UserLocation = {
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
        timestamp: Date.now(),
        accuracy: locationResult.coords.accuracy || undefined,
      };

      console.log('LocationService: Got fresh location:', {
        lat: newLocation.latitude,
        lng: newLocation.longitude,
        accuracy: newLocation.accuracy
      });

      // Save to cache and update current location
      await this.saveLocationToCache(newLocation);
      this.currentLocation = newLocation;
      this.scheduleNextUpdate(newLocation);

      return newLocation;

    } catch (error) {
      console.warn('LocationService: Error getting location:', error);
      const fallbackLocation = this.currentLocation || { ...this.DEFAULT_LOCATION, timestamp: Date.now() };
      await this.saveLocationToCache(fallbackLocation);
      this.scheduleNextUpdate(fallbackLocation);
      return fallbackLocation;
    } finally {
      this.isUpdatingLocation = false;
    }
  }

  /**
   * Load cached location from AsyncStorage
   */
  private async loadCachedLocation(): Promise<UserLocation | null> {
    try {
      const cached = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (cached) {
        const location: UserLocation = JSON.parse(cached);
        console.log('LocationService: Loaded cached location:', {
          lat: location.latitude,
          lng: location.longitude,
          age: Math.round((Date.now() - location.timestamp) / 1000 / 60) + ' minutes'
        });
        return location;
      }
    } catch (error) {
      console.warn('LocationService: Error loading cached location:', error);
    }
    return null;
  }

  /**
   * Save location to AsyncStorage
   */
  private async saveLocationToCache(location: UserLocation): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(location));
      console.log('LocationService: Saved location to cache');
    } catch (error) {
      console.warn('LocationService: Error saving location to cache:', error);
    }
  }

  /**
   * Check if cached location is still valid (within cache duration)
   */
  private isLocationValid(location: UserLocation): boolean {
    const age = Date.now() - location.timestamp;
    const isValid = age < this.CACHE_DURATION;
    
    if (!isValid) {
      console.log('LocationService: Cached location expired, age:', Math.round(age / 1000 / 60) + ' minutes');
    }
    
    return isValid;
  }

  /**
   * Schedule next location update
   */
  private scheduleNextUpdate(location: UserLocation): void {
    // Clear existing timers
    if (this.backgroundUpdateTimer) {
      clearTimeout(this.backgroundUpdateTimer);
    }

    // Calculate time until next update needed
    const age = Date.now() - location.timestamp;
    const timeUntilUpdate = Math.max(this.CACHE_DURATION - age, 60000); // At least 1 minute

    console.log('LocationService: Scheduling next update in', Math.round(timeUntilUpdate / 1000 / 60) + ' minutes');

    this.backgroundUpdateTimer = setTimeout(async () => {
      console.log('LocationService: Background update triggered');
      await this.getCurrentLocationWithFallback();
    }, timeUntilUpdate);
  }

  /**
   * Get location age in minutes
   */
  public getLocationAge(): number {
    if (!this.currentLocation) return Infinity;
    return Math.round((Date.now() - this.currentLocation.timestamp) / 1000 / 60);
  }

  /**
   * Check if location is currently being updated
   */
  public isUpdating(): boolean {
    return this.isUpdatingLocation;
  }

  /**
   * Clean up timers
   */
  public cleanup(): void {
    if (this.locationUpdateTimer) {
      clearTimeout(this.locationUpdateTimer);
      this.locationUpdateTimer = null;
    }
    if (this.backgroundUpdateTimer) {
      clearTimeout(this.backgroundUpdateTimer);
      this.backgroundUpdateTimer = null;
    }
  }

  /**
   * Get location for API calls (always returns coordinates)
   */
  public getCoordinatesForAPI(): { latitude: number; longitude: number } {
    const location = this.currentLocation || this.DEFAULT_LOCATION;
    return {
      latitude: location.latitude,
      longitude: location.longitude,
    };
  }
}

// Export singleton instance
export const locationService = LocationService.getInstance();
export default locationService;
