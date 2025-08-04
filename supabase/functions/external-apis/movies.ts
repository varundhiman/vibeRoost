import { RateLimitService } from './rate-limiter.ts'
import { CacheService } from './cache.ts'
import { MovieData, MovieSearchResult } from '../_shared/types.ts'

export class MovieService {
  private readonly baseUrl = 'https://api.themoviedb.org/3'
  private readonly apiKey: string
  private readonly rateLimiter: RateLimitService
  private readonly cache: CacheService

  constructor(rateLimiter?: RateLimitService, cache?: CacheService) {
    this.apiKey = Deno.env.get('TMDB_API_KEY') || ''
    if (!this.apiKey) {
      throw new Error('TMDB_API_KEY environment variable is required')
    }
    
    this.rateLimiter = rateLimiter || new RateLimitService()
    this.cache = cache || new CacheService()
  }

  async searchMovies(query: string, page: number = 1): Promise<MovieSearchResult> {
    const cacheKey = `tmdb:search:${query}:${page}`
    
    // Check cache first
    const cached = await this.cache.get<MovieSearchResult>(cacheKey)
    if (cached) {
      console.log(`Returning cached TMDB search results for query: ${query}`)
      return cached
    }

    // Check rate limit
    const rateLimitResult = await this.rateLimiter.checkLimit('tmdb')
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for TMDB API. Reset in ${rateLimitResult.resetTime} seconds`)
      return this.getFallbackSearchResult(query)
    }

    try {
      const url = `${this.baseUrl}/search/movie?api_key=${this.apiKey}&query=${encodeURIComponent(query)}&page=${page}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('TMDB API rate limit exceeded')
        }
        throw new Error(`TMDB API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      const result: MovieSearchResult = {
        results: data.results?.map((movie: any) => this.mapToMovieData(movie)) || [],
        total_results: data.total_results || 0,
        total_pages: data.total_pages || 0,
        page: data.page || 1,
      }

      // Cache the result for 6 hours
      await this.cache.set(cacheKey, result, 6 * 60 * 60)
      
      console.log(`Cached TMDB search results for query: ${query}`)
      return result

    } catch (error) {
      console.error(`Error searching TMDB for query: ${query}`, error)
      
      // Return fallback data
      return this.getFallbackSearchResult(query)
    }
  }

  async getMovieDetails(movieId: string): Promise<MovieData> {
    const cacheKey = `tmdb:movie:${movieId}`
    
    // Check cache first
    const cached = await this.cache.get<MovieData>(cacheKey)
    if (cached) {
      console.log(`Returning cached TMDB movie details for ID: ${movieId}`)
      return cached
    }

    // Check rate limit
    const rateLimitResult = await this.rateLimiter.checkLimit('tmdb')
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for TMDB API. Reset in ${rateLimitResult.resetTime} seconds`)
      return this.getFallbackMovieData(movieId)
    }

    try {
      const url = `${this.baseUrl}/movie/${movieId}?api_key=${this.apiKey}&append_to_response=genres`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('TMDB API rate limit exceeded')
        }
        if (response.status === 404) {
          throw new Error(`Movie not found: ${movieId}`)
        }
        throw new Error(`TMDB API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const result = this.mapToMovieData(data, true)

      // Cache the result for 24 hours
      await this.cache.set(cacheKey, result, 24 * 60 * 60)
      
      console.log(`Cached TMDB movie details for ID: ${movieId}`)
      return result

    } catch (error) {
      console.error(`Error fetching TMDB movie details for ID: ${movieId}`, error)
      
      // Return fallback data
      return this.getFallbackMovieData(movieId)
    }
  }

  private mapToMovieData(tmdbData: any, includeGenres: boolean = false): MovieData {
    const movieData: MovieData = {
      id: tmdbData.id?.toString() || '',
      title: tmdbData.title || '',
      overview: tmdbData.overview || undefined,
      release_date: tmdbData.release_date || undefined,
      poster_path: tmdbData.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : undefined,
      backdrop_path: tmdbData.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tmdbData.backdrop_path}` : undefined,
      vote_average: tmdbData.vote_average || undefined,
      vote_count: tmdbData.vote_count || undefined,
      genre_ids: tmdbData.genre_ids || undefined,
      runtime: tmdbData.runtime || undefined,
      original_language: tmdbData.original_language || undefined,
      adult: tmdbData.adult || false,
      popularity: tmdbData.popularity || undefined,
    }

    // Map genres if available (for detailed movie data)
    if (includeGenres && tmdbData.genres) {
      movieData.genres = tmdbData.genres.map((genre: any) => genre.name)
    }

    return movieData
  }

  private getFallbackSearchResult(query: string): MovieSearchResult {
    console.log(`Providing fallback search result for query: ${query}`)
    return {
      results: [],
      total_results: 0,
      total_pages: 0,
      page: 1,
    }
  }

  private getFallbackMovieData(movieId: string): MovieData {
    console.log(`Providing fallback movie data for ID: ${movieId}`)
    return {
      id: movieId,
      title: 'Movie information unavailable',
      overview: 'Movie details could not be retrieved at this time.',
    }
  }
}