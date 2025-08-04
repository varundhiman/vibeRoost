import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createErrorResponse, createSuccessResponse, withErrorHandling, AppError, ERROR_CODES } from '../_shared/errors.ts'
import { getAuthUser, requireAuth } from '../_shared/auth.ts'
import { MovieService } from './movies.ts'
import { RestaurantService } from './restaurants.ts'

const movieService = new MovieService()
const restaurantService = new RestaurantService()

serve(withErrorHandling(async (req) => {
  // Validate authentication
  const user = await getAuthUser(req)
  requireAuth(user)

  const url = new URL(req.url)
  const pathSegments = url.pathname.split('/').filter(Boolean)
  
  // Remove 'functions/v1/external-apis' from path
  const apiPath = pathSegments.slice(3)
  
  if (apiPath.length === 0) {
    throw new AppError('API path required', ERROR_CODES.INVALID_INPUT, 400)
  }

  const [apiType, ...remainingPath] = apiPath

  switch (apiType) {
    case 'movies':
      return await handleMovieRequest(req, remainingPath, url.searchParams)
    
    case 'restaurants':
      return await handleRestaurantRequest(req, remainingPath, url.searchParams)
    
    default:
      throw new AppError(`Unknown API type: ${apiType}`, ERROR_CODES.INVALID_INPUT, 400)
  }
}))

async function handleMovieRequest(req: Request, path: string[], searchParams: URLSearchParams) {
  const method = req.method

  if (path.length === 0) {
    throw new AppError('Movie endpoint required', ERROR_CODES.INVALID_INPUT, 400)
  }

  const [endpoint, ...params] = path

  switch (endpoint) {
    case 'search':
      if (method !== 'GET') {
        throw new AppError('Only GET method allowed', ERROR_CODES.INVALID_INPUT, 405)
      }
      
      const query = searchParams.get('query')
      if (!query) {
        throw new AppError('Query parameter required', ERROR_CODES.INVALID_INPUT, 400)
      }
      
      const page = parseInt(searchParams.get('page') || '1')
      const result = await movieService.searchMovies(query, page)
      
      return createSuccessResponse(result)

    case 'details':
      if (method !== 'GET') {
        throw new AppError('Only GET method allowed', ERROR_CODES.INVALID_INPUT, 405)
      }
      
      if (params.length === 0) {
        throw new AppError('Movie ID required', ERROR_CODES.INVALID_INPUT, 400)
      }
      
      const movieId = params[0]
      const movieDetails = await movieService.getMovieDetails(movieId)
      
      return createSuccessResponse(movieDetails)

    default:
      throw new AppError(`Unknown movie endpoint: ${endpoint}`, ERROR_CODES.INVALID_INPUT, 400)
  }
}

async function handleRestaurantRequest(req: Request, path: string[], searchParams: URLSearchParams) {
  const method = req.method

  if (path.length === 0) {
    throw new AppError('Restaurant endpoint required', ERROR_CODES.INVALID_INPUT, 400)
  }

  const [endpoint, ...params] = path

  switch (endpoint) {
    case 'search':
      if (method !== 'GET') {
        throw new AppError('Only GET method allowed', ERROR_CODES.INVALID_INPUT, 405)
      }
      
      const query = searchParams.get('query')
      const location = searchParams.get('location')
      
      if (!query || !location) {
        throw new AppError('Query and location parameters required', ERROR_CODES.INVALID_INPUT, 400)
      }
      
      const radius = parseInt(searchParams.get('radius') || '5000')
      const result = await restaurantService.searchRestaurants(query, location, radius)
      
      return createSuccessResponse(result)

    case 'details':
      if (method !== 'GET') {
        throw new AppError('Only GET method allowed', ERROR_CODES.INVALID_INPUT, 405)
      }
      
      if (params.length === 0) {
        throw new AppError('Place ID required', ERROR_CODES.INVALID_INPUT, 400)
      }
      
      const placeId = params[0]
      const restaurantDetails = await restaurantService.getRestaurantDetails(placeId)
      
      return createSuccessResponse(restaurantDetails)

    default:
      throw new AppError(`Unknown restaurant endpoint: ${endpoint}`, ERROR_CODES.INVALID_INPUT, 400)
  }
}