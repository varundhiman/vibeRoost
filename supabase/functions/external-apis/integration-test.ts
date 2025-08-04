import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts'
import { MovieService } from './movies.ts'
import { RestaurantService } from './restaurants.ts'
import { RateLimitService } from './rate-limiter.ts'
import { CacheService } from './cache.ts'

// Mock environment variables for testing
Deno.env.set('TMDB_API_KEY', 'test_tmdb_key')
Deno.env.set('GOOGLE_PLACES_API_KEY', 'test_google_key')

// Integration test for service initialization
Deno.test('External APIs Integration - should initialize services correctly', () => {
  const rateLimiter = new RateLimitService()
  const cache = new CacheService(false)
  
  const movieService = new MovieService(rateLimiter, cache)
  const restaurantService = new RestaurantService(rateLimiter, cache)
  
  // Services should be created without errors
  assertEquals(typeof movieService, 'object')
  assertEquals(typeof restaurantService, 'object')
})

Deno.test('External APIs Integration - should handle rate limiting across services', async () => {
  const rateLimiter = new RateLimitService()
  const cache = new CacheService(false)
  
  // Set a very low rate limit for testing
  rateLimiter.setRateLimit('test_integration', 2, 60)
  
  // First two requests should be allowed
  let result1 = await rateLimiter.checkLimit('test_integration')
  assertEquals(result1.allowed, true)
  assertEquals(result1.remaining, 1)
  
  let result2 = await rateLimiter.checkLimit('test_integration')
  assertEquals(result2.allowed, true)
  assertEquals(result2.remaining, 0)
  
  // Third request should be denied
  let result3 = await rateLimiter.checkLimit('test_integration')
  assertEquals(result3.allowed, false)
  assertEquals(result3.remaining, 0)
})

Deno.test('External APIs Integration - should handle caching across services', async () => {
  const cache = new CacheService(false)
  
  // Test cache operations
  await cache.set('integration_test', { data: 'test_value' }, 60)
  
  const retrieved = await cache.get<{ data: string }>('integration_test')
  assertEquals(retrieved?.data, 'test_value')
  
  // Test cache expiration
  await cache.set('expire_test', { data: 'will_expire' }, 1)
  
  // Wait for expiration
  await new Promise(resolve => setTimeout(resolve, 1100))
  
  const expired = await cache.get('expire_test')
  assertEquals(expired, null)
})

Deno.test('External APIs Integration - should handle service errors gracefully', async () => {
  // Mock fetch to simulate API errors
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => {
    return new Response('Service Unavailable', { status: 503 })
  }

  try {
    const rateLimiter = new RateLimitService()
    const cache = new CacheService(false)
    const movieService = new MovieService(rateLimiter, cache)
    
    // Should return fallback data instead of throwing
    const result = await movieService.searchMovies('test query')
    assertEquals(result.results.length, 0)
    assertEquals(result.total_results, 0)
  } finally {
    // Restore original fetch
    globalThis.fetch = originalFetch
  }
})

Deno.test('External APIs Integration - should validate environment variables', () => {
  // Temporarily remove environment variables
  const originalTmdbKey = Deno.env.get('TMDB_API_KEY')
  const originalGoogleKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
  
  try {
    Deno.env.delete('TMDB_API_KEY')
    
    // Should throw error when API key is missing
    let errorThrown = false
    try {
      new MovieService()
    } catch (error) {
      errorThrown = true
      assertEquals((error as Error).message, 'TMDB_API_KEY environment variable is required')
    }
    assertEquals(errorThrown, true)
    
    // Restore TMDB key and test Google Places
    Deno.env.set('TMDB_API_KEY', 'test_key')
    Deno.env.delete('GOOGLE_PLACES_API_KEY')
    
    errorThrown = false
    try {
      new RestaurantService()
    } catch (error) {
      errorThrown = true
      assertEquals((error as Error).message, 'GOOGLE_PLACES_API_KEY environment variable is required')
    }
    assertEquals(errorThrown, true)
    
  } finally {
    // Restore original environment variables
    if (originalTmdbKey) Deno.env.set('TMDB_API_KEY', originalTmdbKey)
    if (originalGoogleKey) Deno.env.set('GOOGLE_PLACES_API_KEY', originalGoogleKey)
  }
})

console.log('All external API integration tests completed!')