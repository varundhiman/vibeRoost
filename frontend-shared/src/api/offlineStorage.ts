export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt?: number;
}

export class OfflineStorageService {
  private readonly CACHE_PREFIX = 'socialrec_cache_';
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  async set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(key);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      };

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(cacheKey, JSON.stringify(entry));
      }
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }

      const cacheKey = this.getCacheKey(key);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);
      
      // Check if entry has expired
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cacheKey = this.getCacheKey(key);
        localStorage.removeItem(cacheKey);
      }
    } catch (error) {
      console.warn('Failed to remove cached data:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith(this.CACHE_PREFIX)) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  async cleanExpired(): Promise<void> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }

      const keys = Object.keys(localStorage);
      const now = Date.now();

      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const entry: CacheEntry<any> = JSON.parse(cached);
              if (entry.expiresAt && now > entry.expiresAt) {
                localStorage.removeItem(key);
              }
            }
          } catch (error) {
            // Remove corrupted entries
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to clean expired cache entries:', error);
    }
  }

  private getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  // Get cache statistics
  getCacheStats(): { totalEntries: number; totalSize: number } {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return { totalEntries: 0, totalSize: 0 };
      }

      const keys = Object.keys(localStorage);
      let totalEntries = 0;
      let totalSize = 0;

      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          totalEntries++;
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }
      });

      return { totalEntries, totalSize };
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return { totalEntries: 0, totalSize: 0 };
    }
  }
}