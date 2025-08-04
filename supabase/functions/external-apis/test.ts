import { assertEquals, assertExists, assertRejects } from 'https://deno.land/std@0.168.0/testing/asserts.ts'
import { MovieService } from './movies.ts'
import { RestaurantService } from './restaurants.ts'
import { RateLimitService } from './rate-limiter.ts'
import { CacheService } from './cache.ts'
import { MovieData, MovieSearchResult, RestaurantData, RestaurantSearchResult } from '../_shared/types.ts'

// Mock environment variables for testing
Deno.env.set('TMDB_API_KEY', 'test_tmdb_key')
Deno.env.set('GOOGLE_PLACES_API_KEY', 'test_google_key')

// Test RateLimitService
Deno.test('RateLimitService - should allow requests within limit', async () => {
  const rateLimiter = new RateLimitService()
  rateLimiter.setRateLimit('test_api', 5, 60) // 5 requests per minute

  // First 5 requests should be allowed
  for (let i = 0; i < 5; i++) {
    const result = await rateLimiter.checkLimit('test_api')
    assertEquals(result.allowed, true)
    assertEquals(result.remaining, 4 - i)
  }

  // 6th request should be denied
  const result = await rateLimiter.checkLimit('test_api')
  assertEquals(result.allowed, false)
  assertEquals(result.remaining, 0)
})

Deno.test('RateLimitService - should reset after window expires', async () => {
  const rateLimiter = new RateLimitService()
  rateLimiter.setRateLimit('test_api_2', 2, 1) // 2 requests per second

  // Use up the limit
  await rateLimiter.checkLimit('test_api_2')
  await rateLimiter.checkLimit('test_api_2')
  
  let result = await rateLimiter.checkLimit('test_api_2')
  assertEquals(result.allowed, false)

  // Wait for window to reset
  await new Promise(resolve => setTimeout(resolve, 1100))

  // Should be allowed again
  result = await rateLimiter.checkLimit('test_api_2')
  assertEquals(result.allowed, true)
})

Deno.test('RateLimitService - should get remaining requests correctly', async () => {
  const rateLimiter = new RateLimitService()
  rateLimiter.setRateLimit('test_api_3', 10, 60)

  assertEquals(rateLimiter.getRemainingRequests('test_api_3'), 10)

  await rateLimiter.checkLimit('test_api_3')
  assertEquals(rateLimiter.getRemainingRequests('test_api_3'), 9)

  await rateLimiter.checkLimit('test_api_3')
  assertEquals(rateLimiter.getRemainingRequests('test_api_3'), 8)
})

Deno.test('RateLimitService - should handle unknown API', async () => {
  const rateLimiter = new RateLimitService()

  await assertRejects(
    () => rateLimiter.checkLimit('unknown_api'),
    Error,
    'Unknown API: unknown_api'
  )
})

// Test CacheService
Deno.test('CacheService - should store and retrieve data', async () => {
  const cache = new CacheService(false) // Don't start cleanup
  const testData = { message: 'Hello, World!' }

  await cache.set('test_key', testData, 60)
  const retrieved = await cache.get('test_key')

  assertEquals(retrieved, testData)
})

Deno.test('CacheService - should return null for non-existent key', async () => {
  const cache = new CacheService(false)
  const result = await cache.get('non_existent_key')
  assertEquals(result, null)
})

Deno.test('CacheService - should expire data after TTL', async () => {
  const cache = new CacheService(false)
  const testData = { message: 'This will expire' }

  await cache.set('expire_key', testData, 1) // 1 second TTL
  
  // Should exist immediately
  let result = await cache.get('expire_key')
  assertEquals(result, testData)

  // Wait for expiration
  await new Promise(resolve => setTimeout(resolve, 1100))

  // Should be null after expiration
  result = await cache.get('expire_key')
  assertEquals(result, null)
})

Deno.test('CacheService - should check if key exists', async () => {
  const cache = new CacheService(false)
  
  assertEquals(await cache.has('missing_key'), false)
  
  await cache.set('existing_key', 'data', 60)
  assertEquals(await cache.has('existing_key'), true)
})

Deno.test('CacheService - should delete keys', async () => {
  const cache = new CacheService(false)
  
  await cache.set('delete_me', 'data', 60)
  assertEquals(await cache.has('delete_me'), true)
  
  const deleted = await cache.delete('delete_me')
  assertEquals(deleted, true)
  assertEquals(await cache.has('delete_me'), false)
})

Deno.test('CacheService - should get TTL correctly', async () => {
  const cache = new CacheService(false)
  
  await cache.set('ttl_key', 'data', 10)
  const ttl = await cache.ttl('ttl_key')
  
  // TTL should be close to 10 seconds (allowing for small timing differences)
  assertEquals(ttl >= 9 && ttl <= 10, true)
})

Deno.test('CacheService - should return -2 for non-existent key TTL', async () => {
  const cache = new CacheService(false)
  const ttl = await cache.ttl('non_existent')
  assertEquals(ttl, -2)
})

Deno.test('CacheService - getOrSet should fetch and cache data', async () => {
  const cache = new CacheService(false)
  let fetchCount = 0
  
  const fetcher = async () => {
    fetchCount++
    return { data: 'fetched_data', count: fetchCount }
  }

  // First call should fetch
  const result1 = await cache.getOrSet('fetch_key', fetcher, 60)
  assertEquals(result1.data, 'fetched_data')
  assertEquals(result1.count, 1)
  assertEquals(fetchCount, 1)

  // Second call should use cache
  const result2 = await cache.getOrSet('fetch_key', fetcher, 60)
  assertEquals(result2.data, 'fetched_data')
  assertEquals(result2.count, 1) // Same as first call
  assertEquals(fetchCount, 1) // Fetcher not called again
})

// Test MovieService (with mocked fetch)
Deno.test('MovieService - should handle API errors gracefully', async () => {
  // Mock fetch to simulate API error
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => {
    return new Response('API Error', { status: 500 })
  }

  try {
    const rateLimiter = new RateLimitService()
    const cache = new CacheService(false)
    const movieService = new MovieService(rateLimiter, cache)
    const result = await movieService.searchMovies('test query')
    
    // Should return fallback data
    assertEquals(result.results.length, 0)
    assertEquals(result.total_results, 0)
  } finally {
    // Restore original fetch
    globalThis.fetch = originalFetch
  }
})

Deno.test('MovieService - should handle rate limit errors', async () => {
  // Create a rate limiter that's already at limit
  const rateLimiter = new RateLimitService()
  const cache = new CacheService(false)
  const movieService = new MovieService(rateLimiter, cache)
  
  // Exhaust the rate limit
  for (let i = 0; i < 50; i++) {
    await rateLimiter.checkLimit('tmdb')
  }

  // Next call should return fallback data
  const result = await movieService.getMovieDetails('123')
  assertEquals(result.id, '123')
  assertEquals(result.title, 'Movie information unavailable')
})

Deno.test('MovieService - should parse successful API response', async () => {
  const mockResponse = {
    results: [
      {
        id: 123,
        title: 'Test Movie',
        overview: 'A test movie',
        release_date: '2023-01-01',
        vote_average: 8.5,
        genre_ids: [28, 12]
      }
    ],
    total_results: 1,
    total_pages: 1,
    page: 1
  }

  // Mock fetch to return successful response
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => {
    return new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const rateLimiter = new RateLimitService()
    const cache = new CacheService(false)
    const movieService = new MovieService(rateLimiter, cache)
    const result = await movieService.searchMovies('test')
    
    assertEquals(result.results.length, 1)
    assertEquals(result.results[0].id, '123')
    assertEquals(result.results[0].title, 'Test Movie')
    assertEquals(result.results[0].vote_average, 8.5)
  } finally {
    // Restore original fetch
    globalThis.fetch = originalFetch
  }
})

// Test RestaurantService (with mocked fetch)
Deno.test('RestaurantService - should handle geocoding errors', async () => {
  // Mock fetch to simulate geocoding error
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = input.toString()
    if (url.includes('geocode')) {
      return new Response(JSON.stringify({ status: 'ZERO_RESULTS' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    return new Response('Not Found', { status: 404 })
  }

  try {
    const rateLimiter = new RateLimitService()
    const cache = new CacheService(false)
    const restaurantService = new RestaurantService(rateLimiter, cache)
    
    // Should return fallback data instead of throwing
    const result = await restaurantService.searchRestaurants('pizza', 'invalid location')
    assertEquals(result.results.length, 0)
    assertEquals(result.status, 'ZERO_RESULTS')
  } finally {
    // Restore original fetch
    globalThis.fetch = originalFetch
  }
})

Deno.test('RestaurantService - should parse successful search response', async () => {
  const mockGeocodeResponse = {
    status: 'OK',
    results: [{
      geometry: {
        location: { lat: 40.7128, lng: -74.0060 }
      }
    }]
  }

  const mockSearchResponse = {
    status: 'OK',
    results: [
      {
        place_id: 'test_place_id',
        name: 'Test Restaurant',
        formatted_address: '123 Test St, Test City',
        rating: 4.5,
        price_level: 2,
        types: ['restaurant', 'food']
      }
    ]
  }

  // Mock fetch to return successful responses
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = input.toString()
    if (url.includes('geocode')) {
      return new Response(JSON.stringify(mockGeocodeResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } else if (url.includes('textsearch')) {
      return new Response(JSON.stringify(mockSearchResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    return new Response('Not Found', { status: 404 })
  }

  try {
    const rateLimiter = new RateLimitService()
    const cache = new CacheService(false)
    const restaurantService = new RestaurantService(rateLimiter, cache)
    const result = await restaurantService.searchRestaurants('pizza', 'New York')
    
    assertEquals(result.results.length, 1)
    assertEquals(result.results[0].place_id, 'test_place_id')
    assertEquals(result.results[0].name, 'Test Restaurant')
    assertEquals(result.results[0].rating, 4.5)
  } finally {
    // Restore original fetch
    globalThis.fetch = originalFetch
  }
})

Deno.test('RestaurantService - should handle place details not found', async () => {
  // Mock fetch to simulate place not found
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => {
    return new Response(JSON.stringify({ status: 'NOT_FOUND' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const rateLimiter = new RateLimitService()
    const cache = new CacheService(false)
    const restaurantService = new RestaurantService(rateLimiter, cache)
    
    // Should return fallback data instead of throwing
    const result = await restaurantService.getRestaurantDetails('invalid_place_id')
    assertEquals(result.place_id, 'invalid_place_id')
    assertEquals(result.name, 'Restaurant information unavailable')
  } finally {
    // Restore original fetch
    globalThis.fetch = originalFetch
  }
})

// Integration test for cache key creation
Deno.test('CacheService - createKey should format keys correctly', () => {
  const key1 = CacheService.createKey('prefix', 'part1', 'part2')
  assertEquals(key1, 'prefix:part1:part2')

  const key2 = CacheService.createKey('api', 'search', 123, 'query')
  assertEquals(key2, 'api:search:123:query')
})

console.log('All external API tests completed!')