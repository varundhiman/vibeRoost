// User Management Edge Functions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/utils.ts'
import { 
  requireAuthContext, 
  createAuthErrorResponse, 
  AuthError 
} from '../_shared/auth.ts'
import { 
  ApiResponse, 
  UserProfile, 
  UpdateUserProfileRequest 
} from '../_shared/types.ts'
import { 
  validateUserProfileUpdate, 
  throwIfValidationErrors,
  sanitizeText,
  ValidationException 
} from '../_shared/validation.ts'
import { 
  querySingle, 
  createDatabaseError 
} from '../_shared/database.ts'

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    
    // Extract user ID from path: /users/{userId}
    const userId = pathParts[pathParts.length - 1]
    
    if (!userId) {
      return createErrorResponse('User ID is required', 'INVALID_REQUEST', 400)
    }

    // Route to appropriate handler based on HTTP method
    switch (req.method) {
      case 'GET':
        return await getUserProfile(req, userId)
      case 'PUT':
        return await updateUserProfile(req, userId)
      default:
        return createErrorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405)
    }
  } catch (error) {
    console.error('User function error:', error)
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error)
    }
    
    if (error instanceof ValidationException) {
      return createValidationErrorResponse(error)
    }
    
    return createErrorResponse(
      'Internal server error',
      'INTERNAL_ERROR',
      500
    )
  }
})

/**
 * Get user profile by ID
 */
async function getUserProfile(req: Request, userId: string): Promise<Response> {
  const context = await requireAuthContext(req)
  
  // Users can view their own profile or public profiles
  // For now, we'll allow viewing any profile (RLS will handle privacy)
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
      .eq('id', userId)
  )
  
  if (result.error) {
    if (result.error.code === 'PGRST116') {
      return createErrorResponse('User not found', 'USER_NOT_FOUND', 404)
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
 * Update user profile
 */
async function updateUserProfile(req: Request, userId: string): Promise<Response> {
  const context = await requireAuthContext(req)
  
  // Users can only update their own profile
  if (context.user.id !== userId) {
    throw new AuthError('Cannot update another user\'s profile', 'FORBIDDEN')
  }
  
  const requestBody = await req.json()
  const updateData: UpdateUserProfileRequest = requestBody
  
  // Validate the update data
  const validationErrors = validateUserProfileUpdate(updateData)
  throwIfValidationErrors(validationErrors)
  
  // Sanitize text fields
  const sanitizedData: Partial<UserProfile> = {}
  
  if (updateData.username !== undefined) {
    sanitizedData.username = sanitizeText(updateData.username)
  }
  if (updateData.display_name !== undefined) {
    sanitizedData.display_name = updateData.display_name ? sanitizeText(updateData.display_name) : null
  }
  if (updateData.bio !== undefined) {
    sanitizedData.bio = updateData.bio ? sanitizeText(updateData.bio) : null
  }
  if (updateData.location !== undefined) {
    sanitizedData.location = updateData.location ? sanitizeText(updateData.location) : null
  }
  if (updateData.website !== undefined) {
    sanitizedData.website = updateData.website || null
  }
  if (updateData.avatar_url !== undefined) {
    sanitizedData.avatar_url = updateData.avatar_url || null
  }
  if (updateData.profile_visibility !== undefined) {
    sanitizedData.profile_visibility = updateData.profile_visibility
  }
  if (updateData.allow_direct_messages !== undefined) {
    sanitizedData.allow_direct_messages = updateData.allow_direct_messages
  }
  if (updateData.show_in_search !== undefined) {
    sanitizedData.show_in_search = updateData.show_in_search
  }
  
  // Add updated timestamp
  sanitizedData.updated_at = new Date().toISOString()
  
  // Update the user profile
  const result = await querySingle<UserProfile>(
    context.supabase,
    context.supabase
      .from('user_profiles')
      .update(sanitizedData)
      .eq('id', userId)
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
  )
  
  if (result.error) {
    if (result.error.code === 'PGRST116') {
      return createErrorResponse('User not found', 'USER_NOT_FOUND', 404)
    }
    if (result.error.code === '23505') {
      return createErrorResponse('Username already taken', 'USERNAME_TAKEN', 409)
    }
    return createErrorResponse(
      'Failed to update user profile',
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

/**
 * Create validation error response
 */
function createValidationErrorResponse(error: ValidationException): Response {
  const response: ApiResponse = {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: error.errors
    },
    timestamp: new Date().toISOString()
  }
  
  return new Response(JSON.stringify(response), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}