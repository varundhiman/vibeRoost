export interface CacheEntry<T> {
  data: T
  expiresAt: number
}

export class CacheService {
  private readonly storage = new Map<string, CacheEntry<any>>()
  private readonly maxSize = 1000 // Maximum number of cache entries
  private readonly cleanupInterval = 5 * 60 * 1000 // Cleanup every 5 minutes
  private cleanupTimer?: number

  constructor(startCleanup: boolean = true) {
    // Start periodic cleanup only if requested (not during testing)
    if (startCleanup) {
      this.startCleanup()
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.storage.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.storage.delete(key)
      return null
    }

    return entry.data as T
  }

  async set<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + (ttlSeconds * 1000)
    
    // If cache is at max size, remove oldest entries
    if (this.storage.size >= this.maxSize) {
      this.evictOldest()
    }

    this.storage.set(key, { data, expiresAt })
  }

  async delete(key: string): Promise<boolean> {
    return this.storage.delete(key)
  }

  async clear(): Promise<void> {
    this.storage.clear()
  }

  async has(key: string): Promise<boolean> {
    const entry = this.storage.get(key)
    
    if (!entry) {
      return false
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.storage.delete(key)
      return false
    }

    return true
  }

  async keys(): Promise<string[]> {
    const validKeys: string[] = []
    const now = Date.now()

    for (const [key, entry] of this.storage.entries()) {
      if (now <= entry.expiresAt) {
        validKeys.push(key)
      } else {
        this.storage.delete(key)
      }
    }

    return validKeys
  }

  async size(): Promise<number> {
    // Clean expired entries first
    this.cleanupExpired()
    return this.storage.size
  }

  // Get cache statistics
  getStats(): {
    size: number
    maxSize: number
    hitRate?: number
    memoryUsage?: number
  } {
    this.cleanupExpired()
    
    return {
      size: this.storage.size,
      maxSize: this.maxSize,
      // Note: Hit rate tracking would require additional counters
      // Memory usage estimation would require more complex calculation
    }
  }

  // Set TTL for existing key
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const entry = this.storage.get(key)
    
    if (!entry) {
      return false
    }

    entry.expiresAt = Date.now() + (ttlSeconds * 1000)
    return true
  }

  // Get TTL for a key
  async ttl(key: string): Promise<number> {
    const entry = this.storage.get(key)
    
    if (!entry) {
      return -2 // Key doesn't exist
    }

    const remaining = entry.expiresAt - Date.now()
    
    if (remaining <= 0) {
      this.storage.delete(key)
      return -2 // Key expired
    }

    return Math.ceil(remaining / 1000) // Return seconds
  }

  private cleanupExpired(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.storage.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.storage.delete(key))
  }

  private evictOldest(): void {
    // Simple LRU-like eviction: remove entries that expire soonest
    const entries = Array.from(this.storage.entries())
    entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt)

    // Remove oldest 10% of entries
    const toRemove = Math.ceil(entries.length * 0.1)
    for (let i = 0; i < toRemove; i++) {
      this.storage.delete(entries[i][0])
    }
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired()
    }, this.cleanupInterval)
  }

  // Method to stop cleanup (useful for testing)
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
  }

  // Utility method to create cache keys
  static createKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`
  }

  // Utility method for cache-aside pattern
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Fetch data
    const data = await fetcher()
    
    // Store in cache
    await this.set(key, data, ttlSeconds)
    
    return data
  }

  // Utility method for cache warming
  async warmup<T>(
    keys: string[],
    fetcher: (key: string) => Promise<T>,
    ttlSeconds: number
  ): Promise<void> {
    const promises = keys.map(async (key) => {
      const exists = await this.has(key)
      if (!exists) {
        try {
          const data = await fetcher(key)
          await this.set(key, data, ttlSeconds)
        } catch (error) {
          console.error(`Failed to warm cache for key ${key}:`, error)
        }
      }
    })

    await Promise.all(promises)
  }
}