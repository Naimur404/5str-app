import AsyncStorage from '@react-native-async-storage/async-storage';
import { HomeResponse } from '@/types/api';
import { User } from './api';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt?: number;
}

interface HomeDataCache {
  data: HomeResponse['data'];
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timestamp: number;
  expiresAt: number;
}

interface UserProfileCache {
  data: User;
  timestamp: number;
  // No expiration for user profile - only cleared on update/logout
}

class CacheService {
  private static instance: CacheService;
  private memoryCache: Map<string, any> = new Map();

  // Cache keys
  private readonly CACHE_KEYS = {
    HOME_DATA: 'cache_home_data',
    USER_PROFILE: 'cache_user_profile',
    CACHE_VERSION: 'cache_version'
  };

  // Cache durations
  private readonly CACHE_DURATIONS = {
    HOME_DATA: 5 * 60 * 1000, // 5 minutes
    USER_PROFILE: Infinity // Until manual clear (profile update/logout)
  };

  private readonly CURRENT_CACHE_VERSION = '1.0';

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  constructor() {
    this.initializeCache();
  }

  private async initializeCache() {
    try {
      // Check cache version and clear if outdated
      const storedVersion = await AsyncStorage.getItem(this.CACHE_KEYS.CACHE_VERSION);
      if (storedVersion !== this.CURRENT_CACHE_VERSION) {
        console.log('Cache version outdated, clearing all cache');
        await this.clearAllCache();
        await AsyncStorage.setItem(this.CACHE_KEYS.CACHE_VERSION, this.CURRENT_CACHE_VERSION);
      }
    } catch (error) {
      console.error('Error initializing cache:', error);
    }
  }

  // Generic cache methods
  private async setCache<T>(key: string, data: T, expirationTime?: number): Promise<void> {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: expirationTime ? Date.now() + expirationTime : undefined
      };

      // Store in both memory and AsyncStorage
      this.memoryCache.set(key, cacheItem);
      await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
      
      console.log(`Cache set for ${key}:`, {
        dataSize: JSON.stringify(data).length,
        expiresAt: expirationTime ? new Date(Date.now() + expirationTime).toISOString() : 'Never',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error setting cache for ${key}:`, error);
    }
  }

  private async getCache<T>(key: string): Promise<T | null> {
    try {
      // Check memory cache first
      let cacheItem: CacheItem<T> | null = this.memoryCache.get(key) || null;

      // If not in memory, check AsyncStorage
      if (!cacheItem) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          cacheItem = JSON.parse(cached);
          // Restore to memory cache
          if (cacheItem) {
            this.memoryCache.set(key, cacheItem);
          }
        }
      }

      if (!cacheItem) {
        return null;
      }

      // Check if cache has expired
      if (cacheItem.expiresAt && Date.now() > cacheItem.expiresAt) {
        console.log(`Cache expired for ${key}`);
        await this.removeCache(key);
        return null;
      }

      console.log(`Cache hit for ${key}:`, {
        age: Math.round((Date.now() - cacheItem.timestamp) / 1000),
        expires: cacheItem.expiresAt ? new Date(cacheItem.expiresAt).toISOString() : 'Never'
      });

      return cacheItem.data;
    } catch (error) {
      console.error(`Error getting cache for ${key}:`, error);
      return null;
    }
  }

  private async removeCache(key: string): Promise<void> {
    try {
      this.memoryCache.delete(key);
      await AsyncStorage.removeItem(key);
      console.log(`Cache cleared for ${key}`);
    } catch (error) {
      console.error(`Error removing cache for ${key}:`, error);
    }
  }

  // Home data cache methods
  public async setHomeData(
    data: HomeResponse['data'], 
    coordinates: { latitude: number; longitude: number }
  ): Promise<void> {
    const homeDataCache: HomeDataCache = {
      data,
      coordinates,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATIONS.HOME_DATA
    };

    await this.setCache(this.CACHE_KEYS.HOME_DATA, homeDataCache, this.CACHE_DURATIONS.HOME_DATA);
  }

  public async getHomeData(
    currentCoordinates: { latitude: number; longitude: number }
  ): Promise<HomeResponse['data'] | null> {
    try {
      const cached = await this.getCache<HomeDataCache>(this.CACHE_KEYS.HOME_DATA);
      
      if (!cached) {
        return null;
      }

      // Check if coordinates have changed significantly (more than 1km)
      const distance = this.calculateDistance(
        cached.coordinates.latitude,
        cached.coordinates.longitude,
        currentCoordinates.latitude,
        currentCoordinates.longitude
      );

      if (distance > 1) { // More than 1km difference
        console.log(`Location changed by ${distance.toFixed(2)}km, invalidating home cache`);
        await this.removeCache(this.CACHE_KEYS.HOME_DATA);
        return null;
      }

      return cached.data;
    } catch (error) {
      console.error('Error getting home data cache:', error);
      return null;
    }
  }

  public async clearHomeData(): Promise<void> {
    await this.removeCache(this.CACHE_KEYS.HOME_DATA);
  }

  // User profile cache methods
  public async setUserProfile(user: User): Promise<void> {
    const userProfileCache: UserProfileCache = {
      data: user,
      timestamp: Date.now()
    };

    await this.setCache(this.CACHE_KEYS.USER_PROFILE, userProfileCache);
  }

  public async getUserProfile(): Promise<User | null> {
    try {
      const cached = await this.getCache<UserProfileCache>(this.CACHE_KEYS.USER_PROFILE);
      return cached ? cached.data : null;
    } catch (error) {
      console.error('Error getting user profile cache:', error);
      return null;
    }
  }

  public async clearUserProfile(): Promise<void> {
    await this.removeCache(this.CACHE_KEYS.USER_PROFILE);
  }

  // Utility methods
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Cache management methods
  public async clearAllCache(): Promise<void> {
    try {
      // Clear memory cache
      this.memoryCache.clear();
      
      // Clear AsyncStorage cache
      const keys = Object.values(this.CACHE_KEYS);
      await AsyncStorage.multiRemove(keys);
      
      console.log('All cache cleared');
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }

  public async getCacheInfo(): Promise<{
    homeData: { cached: boolean; age?: number; size?: number };
    userProfile: { cached: boolean; age?: number; size?: number };
  }> {
    const info: {
      homeData: { cached: boolean; age?: number; size?: number };
      userProfile: { cached: boolean; age?: number; size?: number };
    } = {
      homeData: { cached: false },
      userProfile: { cached: false }
    };

    try {
      // Check home data cache
      const homeData = await AsyncStorage.getItem(this.CACHE_KEYS.HOME_DATA);
      if (homeData) {
        const parsed = JSON.parse(homeData);
        info.homeData = {
          cached: true,
          age: Math.round((Date.now() - parsed.timestamp) / 1000),
          size: homeData.length
        };
      }

      // Check user profile cache
      const userProfile = await AsyncStorage.getItem(this.CACHE_KEYS.USER_PROFILE);
      if (userProfile) {
        const parsed = JSON.parse(userProfile);
        info.userProfile = {
          cached: true,
          age: Math.round((Date.now() - parsed.timestamp) / 1000),
          size: userProfile.length
        };
      }
    } catch (error) {
      console.error('Error getting cache info:', error);
    }

    return info;
  }

  // Method to preload data when app starts
  public async preloadCachedData(): Promise<{
    homeData: HomeResponse['data'] | null;
    userProfile: User | null;
  }> {
    console.log('Preloading cached data...');
    
    try {
      // Get all cached data in parallel
      const [homeDataRaw, userProfileRaw] = await Promise.all([
        AsyncStorage.getItem(this.CACHE_KEYS.HOME_DATA),
        AsyncStorage.getItem(this.CACHE_KEYS.USER_PROFILE)
      ]);

      let homeData: HomeResponse['data'] | null = null;
      let userProfile: User | null = null;

      // Parse home data
      if (homeDataRaw) {
        try {
          const homeCache: CacheItem<HomeDataCache> = JSON.parse(homeDataRaw);
          if (!homeCache.expiresAt || Date.now() < homeCache.expiresAt) {
            homeData = homeCache.data.data;
            // Restore to memory cache
            this.memoryCache.set(this.CACHE_KEYS.HOME_DATA, homeCache);
            console.log('Home data loaded from cache');
          } else {
            console.log('Home data cache expired, removing');
            await this.removeCache(this.CACHE_KEYS.HOME_DATA);
          }
        } catch (error) {
          console.error('Error parsing home data cache:', error);
        }
      }

      // Parse user profile
      if (userProfileRaw) {
        try {
          const userCache: CacheItem<UserProfileCache> = JSON.parse(userProfileRaw);
          userProfile = userCache.data.data;
          // Restore to memory cache
          this.memoryCache.set(this.CACHE_KEYS.USER_PROFILE, userCache);
          console.log('User profile loaded from cache');
        } catch (error) {
          console.error('Error parsing user profile cache:', error);
        }
      }

      return { homeData, userProfile };
    } catch (error) {
      console.error('Error preloading cached data:', error);
      return { homeData: null, userProfile: null };
    }
  }
}

export default CacheService.getInstance();
