export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  limit: number
}

export interface RateLimitConfig {
  requests: number
  windowSeconds: number
}

export class RateLimitService {
  private readonly limits: Record<string, RateLimitConfig> = {
    tmdb: { requests: 40, windowSeconds: 10 }, // TMDB allows 40 requests per 10 seconds
    google_places: { requests: 100, windowSeconds: 60 }, // Conservative limit for Google Places
  }

  private readonly storage = new Map<string, { count: number; resetTime: number }>()

  async checkLimit(apiName: string): Promise<RateLimitResult> {
    const config = this.limits[apiName]
    if (!config) {
      throw new Error(`Unknown API: ${apiName}`)
    }

    const now = Date.now()
    const windowStart = Math.floor(now / (config.windowSeconds * 1000)) * (config.windowSeconds * 1000)
    const resetTime = windowStart + (config.windowSeconds * 1000)
    const key = `${apiName}:${windowStart}`

    // Clean up old entries
    this.cleanupOldEntries(now)

    // Get current count for this window
    const current = this.storage.get(key) || { count: 0, resetTime }

    if (current.count >= config.requests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Math.ceil((resetTime - now) / 1000),
        limit: config.requests,
      }
    }

    // Increment counter
    current.count++
    this.storage.set(key, current)

    return {
      allowed: true,
      remaining: config.requests - current.count,
      resetTime: Math.ceil((resetTime - now) / 1000),
      limit: config.requests,
    }
  }

  getRemainingRequests(apiName: string): number {
    const config = this.limits[apiName]
    if (!config) {
      return 0
    }

    const now = Date.now()
    const windowStart = Math.floor(now / (config.windowSeconds * 1000)) * (config.windowSeconds * 1000)
    const key = `${apiName}:${windowStart}`

    const current = this.storage.get(key)
    if (!current) {
      return config.requests
    }

    return Math.max(0, config.requests - current.count)
  }

  getResetTime(apiName: string): number {
    const config = this.limits[apiName]
    if (!config) {
      return 0
    }

    const now = Date.now()
    const windowStart = Math.floor(now / (config.windowSeconds * 1000)) * (config.windowSeconds * 1000)
    const resetTime = windowStart + (config.windowSeconds * 1000)

    return Math.ceil((resetTime - now) / 1000)
  }

  private cleanupOldEntries(now: number): void {
    const cutoff = now - (5 * 60 * 1000) // Remove entries older than 5 minutes

    for (const [key, value] of this.storage.entries()) {
      if (value.resetTime < cutoff) {
        this.storage.delete(key)
      }
    }
  }

  // Method to add custom rate limits
  setRateLimit(apiName: string, requests: number, windowSeconds: number): void {
    this.limits[apiName] = { requests, windowSeconds }
  }

  // Method to get current rate limit configuration
  getRateLimitConfig(apiName: string): RateLimitConfig | null {
    return this.limits[apiName] || null
  }

  // Method to reset rate limit for an API (useful for testing)
  resetRateLimit(apiName: string): void {
    const config = this.limits[apiName]
    if (!config) {
      return
    }

    const now = Date.now()
    const windowStart = Math.floor(now / (config.windowSeconds * 1000)) * (config.windowSeconds * 1000)
    const key = `${apiName}:${windowStart}`

    this.storage.delete(key)
  }

  // Get statistics for monitoring
  getStats(): Record<string, { current: number; limit: number; resetTime: number }> {
    const stats: Record<string, { current: number; limit: number; resetTime: number }> = {}
    const now = Date.now()

    for (const [apiName, config] of Object.entries(this.limits)) {
      const windowStart = Math.floor(now / (config.windowSeconds * 1000)) * (config.windowSeconds * 1000)
      const resetTime = windowStart + (config.windowSeconds * 1000)
      const key = `${apiName}:${windowStart}`

      const current = this.storage.get(key)?.count || 0

      stats[apiName] = {
        current,
        limit: config.requests,
        resetTime: Math.ceil((resetTime - now) / 1000),
      }
    }

    return stats
  }
}