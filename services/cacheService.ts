import { HomeResponse } from '@/types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  expiresAt: number; // Now has expiration
}

interface ProfilePageCache {
  user: User;
  reviews: any[];
  recommendations: any[];
  timestamp: number;
  expiresAt: number;
}

class CacheService {
  private static instance: CacheService;
  private memoryCache: Map<string, any> = new Map();

  // Cache keys
  private readonly CACHE_KEYS = {
    HOME_DATA: 'cache_home_data',
    USER_PROFILE: 'cache_user_profile',
    PROFILE_PAGE_DATA: 'cache_profile_page_data',
    CACHE_VERSION: 'cache_version'
  };

  // Cache durations
  private readonly CACHE_DURATIONS = {
    HOME_DATA: 60 * 60 * 1000, // 1 hour
    USER_PROFILE: 2 * 60 * 60 * 1000, // 2 hours
    PROFILE_PAGE_DATA: 2 * 60 * 60 * 1000 // 2 hours
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
        console.log('📍 No cached home data found');
        return null;
      }

      // Calculate distance between cached location and current location
      const distance = this.calculateDistance(
        cached.coordinates.latitude,
        cached.coordinates.longitude,
        currentCoordinates.latitude,
        currentCoordinates.longitude
      );

      console.log('📍 Distance from cached location:', {
        cachedLocation: cached.coordinates,
        currentLocation: currentCoordinates,
        distanceKm: distance.toFixed(2)
      });
      
      // If user moved more than 1km, invalidate cache
      if (distance > 1) {
        console.log(`📍 User moved ${distance.toFixed(2)}km (>1km threshold), invalidating home cache`);
        await this.removeCache(this.CACHE_KEYS.HOME_DATA);
        return null;
      }

      // Check if cache has expired (1 hour)
      if (Date.now() > cached.expiresAt) {
        console.log('⏰ Home data cache expired (1 hour), clearing');
        await this.removeCache(this.CACHE_KEYS.HOME_DATA);
        return null;
      }

      console.log(`✅ Using cached home data (within 1km, age: ${Math.round((Date.now() - cached.timestamp) / 60000)} minutes)`);
      return cached.data;
    } catch (error) {
      console.error('Error getting home data cache:', error);
      return null;
    }
  }

  public async clearHomeData(): Promise<void> {
    console.log('🗑️ Clearing home data cache completely');
    // Clear from both memory and AsyncStorage
    this.memoryCache.delete(this.CACHE_KEYS.HOME_DATA);
    await AsyncStorage.removeItem(this.CACHE_KEYS.HOME_DATA);
  }

  // Force clear all cache and fetch fresh data
  public async forceRefreshHomeData(): Promise<void> {
    console.log('💥 Force clearing all home data cache');
    await this.clearHomeData();
  }

  // User profile cache methods
  public async setUserProfile(user: User): Promise<void> {
    const userProfileCache: UserProfileCache = {
      data: user,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATIONS.USER_PROFILE
    };

    await this.setCache(this.CACHE_KEYS.USER_PROFILE, userProfileCache, this.CACHE_DURATIONS.USER_PROFILE);
  }

  public async getUserProfile(): Promise<User | null> {
    try {
      const cached = await this.getCache<UserProfileCache>(this.CACHE_KEYS.USER_PROFILE);
      
      if (!cached) {
        return null;
      }

      // Check if cache has expired (2 hours)
      if (Date.now() > cached.expiresAt) {
        console.log('User profile cache expired (2 hours), clearing');
        await this.removeCache(this.CACHE_KEYS.USER_PROFILE);
        return null;
      }

      return cached.data;
    } catch (error) {
      console.error('Error getting user profile cache:', error);
      return null;
    }
  }

  public async clearUserProfile(): Promise<void> {
    await this.removeCache(this.CACHE_KEYS.USER_PROFILE);
  }

  // Profile page data cache methods (includes user, reviews, recommendations)
  public async setProfilePageData(user: User, reviews: any[], recommendations: any[]): Promise<void> {
    const profilePageCache: ProfilePageCache = {
      user,
      reviews,
      recommendations,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATIONS.PROFILE_PAGE_DATA
    };

    await this.setCache(this.CACHE_KEYS.PROFILE_PAGE_DATA, profilePageCache, this.CACHE_DURATIONS.PROFILE_PAGE_DATA);
    console.log('✅ Profile page data cached for 2 hours');
  }

  public async getProfilePageData(): Promise<{ user: User; reviews: any[]; recommendations: any[] } | null> {
    try {
      const cached = await this.getCache<ProfilePageCache>(this.CACHE_KEYS.PROFILE_PAGE_DATA);
      
      if (!cached) {
        return null;
      }

      // Check if cache has expired (2 hours)
      if (Date.now() > cached.expiresAt) {
        console.log('Profile page cache expired (2 hours), clearing');
        await this.removeCache(this.CACHE_KEYS.PROFILE_PAGE_DATA);
        return null;
      }

      const ageInMinutes = Math.round((Date.now() - cached.timestamp) / 1000 / 60);
      console.log(`✅ Using cached profile page data (${ageInMinutes} minutes old)`);

      return {
        user: cached.user,
        reviews: cached.reviews,
        recommendations: cached.recommendations
      };
    } catch (error) {
      console.error('Error getting profile page cache:', error);
      return null;
    }
  }

  public async clearProfilePageData(): Promise<void> {
    await this.removeCache(this.CACHE_KEYS.PROFILE_PAGE_DATA);
    console.log('🗑️ Profile page data cache cleared');
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

  public async clearAuthRelatedCache(): Promise<void> {
    try {
      // Clear user profile and profile page data on logout
      await this.clearUserProfile();
      await this.clearProfilePageData();
      console.log('Auth-related cache cleared');
    } catch (error) {
      console.error('Error clearing auth-related cache:', error);
    }
  }

  public async getCacheInfo(): Promise<{
    homeData: { cached: boolean; age?: number; size?: number };
    userProfile: { cached: boolean; age?: number; size?: number };
    profilePageData: { cached: boolean; age?: number; size?: number; expiresIn?: number };
  }> {
    const info: {
      homeData: { cached: boolean; age?: number; size?: number };
      userProfile: { cached: boolean; age?: number; size?: number };
      profilePageData: { cached: boolean; age?: number; size?: number; expiresIn?: number };
    } = {
      homeData: { cached: false },
      userProfile: { cached: false },
      profilePageData: { cached: false }
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

      // Check profile page data cache
      const profilePageData = await AsyncStorage.getItem(this.CACHE_KEYS.PROFILE_PAGE_DATA);
      if (profilePageData) {
        const parsed = JSON.parse(profilePageData);
        const ageSeconds = Math.round((Date.now() - parsed.data.timestamp) / 1000);
        const expiresInSeconds = Math.max(0, Math.round((parsed.data.expiresAt - Date.now()) / 1000));
        info.profilePageData = {
          cached: true,
          age: ageSeconds,
          size: profilePageData.length,
          expiresIn: expiresInSeconds
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
