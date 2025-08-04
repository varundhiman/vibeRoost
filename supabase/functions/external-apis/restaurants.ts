import { RateLimitService } from './rate-limiter.ts'
import { CacheService } from './cache.ts'
import { RestaurantData, RestaurantSearchResult } from '../_shared/types.ts'

export class RestaurantService {
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/place'
  private readonly apiKey: string
  private readonly rateLimiter: RateLimitService
  private readonly cache: CacheService

  constructor(rateLimiter?: RateLimitService, cache?: CacheService) {
    this.apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY') || ''
    if (!this.apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY environment variable is required')
    }
    
    this.rateLimiter = rateLimiter || new RateLimitService()
    this.cache = cache || new CacheService()
  }

  async searchRestaurants(query: string, location: string, radius: number = 5000): Promise<RestaurantSearchResult> {
    const cacheKey = `google_places:search:${query}:${location}:${radius}`
    
    // Check cache first
    const cached = await this.cache.get<RestaurantSearchResult>(cacheKey)
    if (cached) {
      console.log(`Returning cached Google Places search results for query: ${query}`)
      return cached
    }

    // Check rate limit
    const rateLimitResult = await this.rateLimiter.checkLimit('google_places')
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for Google Places API. Reset in ${rateLimitResult.resetTime} seconds`)
      return this.getFallbackSearchResult(query)
    }

    try {
      // First, geocode the location to get coordinates
      const coordinates = await this.geocodeLocation(location)
      
      const url = `${this.baseUrl}/textsearch/json?query=${encodeURIComponent(query)}&location=${coordinates.lat},${coordinates.lng}&radius=${radius}&type=restaurant&key=${this.apiKey}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Google Places API rate limit exceeded')
        }
        throw new Error(`Google Places API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${data.status}`)
      }

      const result: RestaurantSearchResult = {
        results: data.results?.map((place: any) => this.mapToRestaurantData(place)) || [],
        status: data.status,
        next_page_token: data.next_page_token,
      }

      // Cache the result for 6 hours
      await this.cache.set(cacheKey, result, 6 * 60 * 60)
      
      console.log(`Cached Google Places search results for query: ${query}`)
      return result

    } catch (error) {
      console.error(`Error searching Google Places for query: ${query}`, error)
      
      // Return fallback data
      return this.getFallbackSearchResult(query)
    }
  }

  async getRestaurantDetails(placeId: string): Promise<RestaurantData> {
    const cacheKey = `google_places:details:${placeId}`
    
    // Check cache first
    const cached = await this.cache.get<RestaurantData>(cacheKey)
    if (cached) {
      console.log(`Returning cached Google Places details for place ID: ${placeId}`)
      return cached
    }

    // Check rate limit
    const rateLimitResult = await this.rateLimiter.checkLimit('google_places')
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for Google Places API. Reset in ${rateLimitResult.resetTime} seconds`)
      return this.getFallbackRestaurantData(placeId)
    }

    try {
      const fields = 'place_id,name,formatted_address,rating,price_level,photos,formatted_phone_number,website,types,opening_hours,geometry,business_status,user_ratings_total'
      const url = `${this.baseUrl}/details/json?place_id=${placeId}&fields=${fields}&key=${this.apiKey}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Google Places API rate limit exceeded')
        }
        throw new Error(`Google Places API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.status !== 'OK') {
        if (data.status === 'NOT_FOUND') {
          throw new Error(`Restaurant not found: ${placeId}`)
        }
        throw new Error(`Google Places API error: ${data.status}`)
      }

      const result = this.mapToRestaurantData(data.result)

      // Cache the result for 24 hours
      await this.cache.set(cacheKey, result, 24 * 60 * 60)
      
      console.log(`Cached Google Places details for place ID: ${placeId}`)
      return result

    } catch (error) {
      console.error(`Error fetching Google Places details for place ID: ${placeId}`, error)
      
      // Return fallback data
      return this.getFallbackRestaurantData(placeId)
    }
  }

  private async geocodeLocation(location: string): Promise<{ lat: number; lng: number }> {
    const cacheKey = `geocode:${location}`
    
    // Check cache first
    const cached = await this.cache.get<{ lat: number; lng: number }>(cacheKey)
    if (cached) {
      return cached
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${this.apiKey}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.status !== 'OK' || !data.results?.length) {
      throw new Error(`Could not geocode location: ${location}`)
    }

    const coordinates = {
      lat: data.results[0].geometry.location.lat,
      lng: data.results[0].geometry.location.lng,
    }

    // Cache for 7 days
    await this.cache.set(cacheKey, coordinates, 7 * 24 * 60 * 60)
    
    return coordinates
  }

  private mapToRestaurantData(placesData: any): RestaurantData {
    const restaurantData: RestaurantData = {
      place_id: placesData.place_id || '',
      name: placesData.name || '',
      formatted_address: placesData.formatted_address || undefined,
      rating: placesData.rating || undefined,
      price_level: placesData.price_level || undefined,
      formatted_phone_number: placesData.formatted_phone_number || undefined,
      website: placesData.website || undefined,
      types: placesData.types || undefined,
      business_status: placesData.business_status || undefined,
      user_ratings_total: placesData.user_ratings_total || undefined,
    }

    // Map photos
    if (placesData.photos && placesData.photos.length > 0) {
      restaurantData.photos = placesData.photos.map((photo: any) => 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${this.apiKey}`
      )
    }

    // Map opening hours
    if (placesData.opening_hours) {
      restaurantData.opening_hours = {
        open_now: placesData.opening_hours.open_now,
        weekday_text: placesData.opening_hours.weekday_text,
      }
    }

    // Map geometry
    if (placesData.geometry?.location) {
      restaurantData.geometry = {
        location: {
          lat: placesData.geometry.location.lat,
          lng: placesData.geometry.location.lng,
        }
      }
    }

    return restaurantData
  }

  private getFallbackSearchResult(query: string): RestaurantSearchResult {
    console.log(`Providing fallback search result for query: ${query}`)
    return {
      results: [],
      status: 'ZERO_RESULTS',
    }
  }

  private getFallbackRestaurantData(placeId: string): RestaurantData {
    console.log(`Providing fallback restaurant data for place ID: ${placeId}`)
    return {
      place_id: placeId,
      name: 'Restaurant information unavailable',
      formatted_address: 'Address could not be retrieved at this time.',
    }
  }
}