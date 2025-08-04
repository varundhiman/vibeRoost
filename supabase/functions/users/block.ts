// User Blocking Edge Functions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/utils.ts'
import { 
  requireAuthContext, 
  createAuthErrorResponse, 
  AuthError 
} from '../_shared/auth.ts'
import { 
  ApiResponse, 
  UserBlock 
} from '../_shared/types.ts'
import { 
  validateUUID,
  ValidationException 
} from '../_shared/validation.ts'
import { 
  querySingle, 
  queryList,
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
    
    // Extract user ID from path: /users/{userId}/block
    const userIdIndex = pathParts.indexOf('users') + 1
    const userId = pathParts[userIdIndex]
    
    if (!userId || !validateUUID(userId)) {
      return createErrorResponse('Valid user ID is required', 'INVALID_REQUEST', 400)
    }

    // Route to appropriate handler based on HTTP method
    switch (req.method) {
      case 'POST':
        return await blockUser(req, userId)
      case 'DELETE':
        return await unblockUser(req, userId)
      case 'GET':
        return await getBlockedUsers(req)
      default:
        return createErrorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405)
    }
  } catch (error) {
    console.error('User block function error:', error)
    
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
 * Block a user
 */
async function blockUser(req: Request, blockedUserId: string): Promise<Response> {
  const context = await requireAuthContext(req)
  
  // Users cannot block themselves
  if (context.user.id === blockedUserId) {
    return createErrorResponse('Cannot block yourself', 'INVALID_REQUEST', 400)
  }
  
  // Check if user exists
  const userExists = await querySingle(
    context.supabase,
    context.supabase
      .from('user_profiles')
      .select('id')
      .eq('id', blockedUserId)
  )
  
  if (userExists.error || !userExists.data) {
    return createErrorResponse('User not found', 'USER_NOT_FOUND', 404)
  }
  
  // Check if already blocked
  const existingBlock = await querySingle(
    context.supabase,
    context.supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', context.user.id)
      .eq('blocked_id', blockedUserId)
  )
  
  if (existingBlock.data) {
    return createErrorResponse('User is already blocked', 'ALREADY_BLOCKED', 409)
  }
  
  // Create the block
  const blockData = {
    blocker_id: context.user.id,
    blocked_id: blockedUserId,
    created_at: new Date().toISOString()
  }
  
  const result = await querySingle<UserBlock>(
    context.supabase,
    context.supabase
      .from('user_blocks')
      .insert(blockData)
      .select(`
        id,
        blocker_id,
        blocked_id,
        created_at
      `)
  )
  
  if (result.error) {
    return createErrorResponse(
      'Failed to block user',
      'DATABASE_ERROR',
      500
    )
  }
  
  const response: ApiResponse<UserBlock> = {
    data: result.data,
    timestamp: new Date().toISOString()
  }
  
  return new Response(JSON.stringify(response), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

/**
 * Unblock a user
 */
async function unblockUser(req: Request, blockedUserId: string): Promise<Response> {
  const context = await requireAuthContext(req)
  
  // Find and delete the block
  const result = await querySingle(
    context.supabase,
    context.supabase
      .from('user_blocks')
      .delete()
      .eq('blocker_id', context.user.id)
      .eq('blocked_id', blockedUserId)
      .select('id')
  )
  
  if (result.error) {
    return createErrorResponse(
      'Failed to unblock user',
      'DATABASE_ERROR',
      500
    )
  }
  
  if (!result.data) {
    return createErrorResponse('User is not blocked', 'NOT_BLOCKED', 404)
  }
  
  const response: ApiResponse<{ success: boolean }> = {
    data: { success: true },
    timestamp: new Date().toISOString()
  }
  
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

/**
 * Get list of blocked users
 */
async function getBlockedUsers(req: Request): Promise<Response> {
  const context = await requireAuthContext(req)
  
  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
  
  const from = (page - 1) * limit
  const to = from + limit - 1
  
  // Get blocked users with their profile information
  const result = await queryList(
    context.supabase,
    context.supabase
      .from('user_blocks')
      .select(`
        id,
        blocked_id,
        created_at,
        blocked_user:user_profiles!user_blocks_blocked_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('blocker_id', context.user.id)
      .order('created_at', { ascending: false })
      .range(from, to)
  )
  
  if (result.error) {
    return createErrorResponse(
      'Failed to fetch blocked users',
      'DATABASE_ERROR',
      500
    )
  }
  
  const response: ApiResponse<any[]> = {
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