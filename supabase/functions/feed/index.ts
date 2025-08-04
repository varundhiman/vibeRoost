// Feed generation Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/utils.ts"
import { createErrorResponse, createSuccessResponse } from "../_shared/errors.ts"
import { requireAuthContext, AuthError, createAuthErrorResponse } from "../_shared/auth.ts"
import { validateRequest } from "../_shared/validation.ts"
import { 
  FeedParams, 
  ContentType, 
  PaginatedResponse,
  FeedItem as FeedItemType
} from "../_shared/types.ts"
import { 
  generatePersonalizedFeed,
  generateCommunityFeed,
  generateUserFeed,
  refreshUserFeed,
  getFeedWithMetadata,
  FeedItemWithMetadata
} from "./personalization.ts"

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method

    // Route requests
    if (path === '/feed' || path === '/') {
      if (method === 'GET') {
        return await handleGetPersonalizedFeed(req)
      } else if (method === 'POST') {
        return await handleRefreshFeed(req)
      }
    } else if (path.startsWith('/community/')) {
      const communityId = path.split('/')[2]
      if (method === 'GET') {
        return await handleGetCommunityFeed(req, communityId)
      }
    } else if (path.startsWith('/user/')) {
      const userId = path.split('/')[2]
      if (method === 'GET') {
        return await handleGetUserFeed(req, userId)
      }
    }

    return createErrorResponse('NOT_FOUND', 'Endpoint not found', 404)
  } catch (error) {
    console.error('Feed function error:', error)
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error)
    }
    
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Internal server error',
      500,
      { error: error.message }
    )
  }
})

/**
 * Handle GET /feed - Get personalized feed for authenticated user
 */
async function handleGetPersonalizedFeed(req: Request): Promise<Response> {
  const { user, supabase } = await requireAuthContext(req)
  const url = new URL(req.url)
  
  // Parse query parameters
  const params: FeedParams = {
    page: parseInt(url.searchParams.get('page') || '1'),
    limit: Math.min(parseInt(url.searchParams.get('limit') || '20'), 50),
    cursor: url.searchParams.get('cursor') || undefined,
    content_types: url.searchParams.get('content_types')?.split(',') as ContentType[] || undefined
  }

  // Validate parameters
  const validation = validateRequest(params, {
    page: { type: 'number', min: 1, optional: true },
    limit: { type: 'number', min: 1, max: 50, optional: true },
    cursor: { type: 'string', optional: true },
    content_types: { type: 'array', optional: true }
  })

  if (!validation.isValid) {
    return createErrorResponse('VALIDATION_ERROR', 'Invalid parameters', 400, validation.errors)
  }

  try {
    const feedItems = await generatePersonalizedFeed(supabase, user.id, params)
    const feedWithMetadata = await getFeedWithMetadata(supabase, feedItems, user.id)
    
    const response: PaginatedResponse<FeedItemWithMetadata> = {
      data: feedWithMetadata,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
        total: feedWithMetadata.length,
        has_more: feedWithMetadata.length === (params.limit || 20)
      }
    }

    return createSuccessResponse(response)
  } catch (error) {
    console.error('Error generating personalized feed:', error)
    return createErrorResponse('FEED_ERROR', 'Failed to generate feed', 500)
  }
}

/**
 * Handle GET /community/{id} - Get community-specific feed
 */
async function handleGetCommunityFeed(req: Request, communityId: string): Promise<Response> {
  const { user, supabase } = await requireAuthContext(req)
  const url = new URL(req.url)
  
  // Parse query parameters
  const params: FeedParams = {
    page: parseInt(url.searchParams.get('page') || '1'),
    limit: Math.min(parseInt(url.searchParams.get('limit') || '20'), 50),
    cursor: url.searchParams.get('cursor') || undefined,
    community_id: communityId
  }

  try {
    const feedItems = await generateCommunityFeed(supabase, user.id, communityId, params)
    const feedWithMetadata = await getFeedWithMetadata(supabase, feedItems, user.id)
    
    const response: PaginatedResponse<FeedItemWithMetadata> = {
      data: feedWithMetadata,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
        total: feedWithMetadata.length,
        has_more: feedWithMetadata.length === (params.limit || 20)
      }
    }

    return createSuccessResponse(response)
  } catch (error) {
    console.error('Error generating community feed:', error)
    return createErrorResponse('FEED_ERROR', 'Failed to generate community feed', 500)
  }
}

/**
 * Handle GET /user/{id} - Get user's public feed
 */
async function handleGetUserFeed(req: Request, userId: string): Promise<Response> {
  const { user, supabase } = await requireAuthContext(req)
  const url = new URL(req.url)
  
  // Parse query parameters
  const params: FeedParams = {
    page: parseInt(url.searchParams.get('page') || '1'),
    limit: Math.min(parseInt(url.searchParams.get('limit') || '20'), 50),
    cursor: url.searchParams.get('cursor') || undefined,
    user_id: userId
  }

  try {
    const feedItems = await generateUserFeed(supabase, user.id, userId, params)
    const feedWithMetadata = await getFeedWithMetadata(supabase, feedItems, user.id)
    
    const response: PaginatedResponse<FeedItemWithMetadata> = {
      data: feedWithMetadata,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
        total: feedWithMetadata.length,
        has_more: feedWithMetadata.length === (params.limit || 20)
      }
    }

    return createSuccessResponse(response)
  } catch (error) {
    console.error('Error generating user feed:', error)
    return createErrorResponse('FEED_ERROR', 'Failed to generate user feed', 500)
  }
}

/**
 * Handle POST /feed - Refresh user's feed cache
 */
async function handleRefreshFeed(req: Request): Promise<Response> {
  const { user, supabase } = await requireAuthContext(req)

  try {
    await refreshUserFeed(supabase, user.id)
    return createSuccessResponse({ message: 'Feed refreshed successfully' })
  } catch (error) {
    console.error('Error refreshing feed:', error)
    return createErrorResponse('FEED_ERROR', 'Failed to refresh feed', 500)
  }
}