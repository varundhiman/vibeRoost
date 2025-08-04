// User Profile Management Edge Functions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/utils.ts'
import { 
  requireAuthContext, 
  createAuthErrorResponse, 
  AuthError 
} from '../_shared/auth.ts'
import { 
  ApiResponse, 
  UserProfile 
} from '../_shared/types.ts'
import { 
  validateUUID 
} from '../_shared/validation.ts'
import { 
  querySingle, 
  queryList 
} from '../_shared/database.ts'

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    
    // Route to appropriate handler based on path and method
    if (pathParts.includes('search')) {
      return await searchUserProfiles(req)
    }
    
    // Default to getting current user's profile
    return await getCurrentUserProfile(req)
    
  } catch (error) {
    console.error('User profile function error:', error)
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error)
    }
    
    return createErrorResponse(
      'Internal server error',
      'INTERNAL_ERROR',
      500
    )
  }
})

/**
 * Get current user's profile
 */
async function getCurrentUserProfile(req: Request): Promise<Response> {
  const context = await requireAuthContext(req)
  
  const result = await querySingle<UserProfile>(
    context.supabase,
    context.supabase
      .from('user_profiles')
      .select(`
        id,
        username,
        display_name,
        bio,
        avatar_url,
        location,
        website,
        profile_visibility,
        allow_direct_messages,
        show_in_search,
        created_at,
        updated_at
      `)
      .eq('id', context.user.id)
  )
  
  if (result.error) {
    if (result.error.code === 'PGRST116') {
      return createErrorResponse('User profile not found', 'USER_NOT_FOUND', 404)
    }
    return createErrorResponse(
      'Failed to fetch user profile',
      'DATABASE_ERROR',
      500
    )
  }
  
  const response: ApiResponse<UserProfile> = {
    data: result.data,
    timestamp: new Date().toISOString()
  }
  
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

/**
 * Search user profiles
 */
async function searchUserProfiles(req: Request): Promise<Response> {
  const context = await requireAuthContext(req)
  
  const url = new URL(req.url)
  const query = url.searchParams.get('q')
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
  
  if (!query || query.trim().length < 2) {
    return createErrorResponse('Search query must be at least 2 characters', 'INVALID_QUERY', 400)
  }
  
  const from = (page - 1) * limit
  const to = from + limit - 1
  
  // Search users by username or display name
  // Only return users who have show_in_search enabled and are not blocked
  const result = await queryList<UserProfile>(
    context.supabase,
    context.supabase
      .from('user_profiles')
      .select(`
        id,
        username,
        display_name,
        bio,
        avatar_url,
        location,
        profile_visibility,
        created_at
      `)
      .eq('show_in_search', true)
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .not('id', 'in', `(
        SELECT blocked_id FROM user_blocks WHERE blocker_id = '${context.user.id}'
        UNION
        SELECT blocker_id FROM user_blocks WHERE blocked_id = '${context.user.id}'
      )`)
      .order('username')
      .range(from, to)
  )
  
  if (result.error) {
    return createErrorResponse(
      'Failed to search user profiles',
      'DATABASE_ERROR',
      500
    )
  }
  
  // Filter out private profiles unless the user is in their communities
  const filteredData = result.data.filter(profile => {
    // Always show public profiles
    if (profile.profile_visibility === 'PUBLIC') {
      return true
    }
    
    // For now, we'll show all profiles that allow search
    // In a more complex implementation, we'd check community memberships
    return profile.profile_visibility !== 'PRIVATE'
  })
  
  const response: ApiResponse<UserProfile[]> = {
    data: filteredData,
    timestamp: new Date().toISOString()
  }
  
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

/**
 * Create error response
 */
function createErrorResponse(message: string, code: string, status: number): Response {
  const response: ApiResponse = {
    error: {
      code,
      message
    },
    timestamp: new Date().toISOString()
  }
  
  return new Response(JSON.stringify(response), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}