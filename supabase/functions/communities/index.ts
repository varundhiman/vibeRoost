// Community CRUD operations
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { 
  withErrorHandling, 
  createSuccessResponse, 
  NotFoundError, 
  ForbiddenError,
  ConflictError,
  assertResourceExists,
  assertPermission
} from '../_shared/errors.ts'
import { 
  requireAuthContext, 
  AuthContext 
} from '../_shared/auth.ts'
import { 
  querySingle, 
  queryList, 
  applyPagination,
  canModerateCommunity,
  isCommunityMember,
  getCommunityRole,
  incrementCounter,
  decrementCounter
} from '../_shared/database.ts'
import { 
  validateAndThrow,
  validateCommunityCreate,
  sanitizeText
} from '../_shared/validation.ts'
import { 
  Community, 
  CreateCommunityRequest, 
  UpdateCommunityRequest,
  PaginationParams,
  PaginatedResponse,
  CommunityType
} from '../_shared/types.ts'

serve(withErrorHandling(async (req: Request): Promise<Response> => {
  const url = new URL(req.url)
  const method = req.method
  const pathSegments = url.pathname.split('/').filter(Boolean)
  
  // Extract community ID from path if present
  const communityId = pathSegments[pathSegments.length - 1]
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(communityId)
  
  // Add debug endpoint
  if (method === 'GET' && url.pathname.endsWith('/debug-auth')) {
    return await debugAuth(req)
  }
  
  switch (method) {
    case 'GET':
      if (isUUID) {
        return await getCommunity(req, communityId)
      } else {
        return await listCommunities(req)
      }
    
    case 'POST':
      return await createCommunity(req)
    
    case 'PUT':
      if (!isUUID) {
        throw new NotFoundError('Community', communityId)
      }
      return await updateCommunity(req, communityId)
    
    case 'DELETE':
      if (!isUUID) {
        throw new NotFoundError('Community', communityId)
      }
      return await deleteCommunity(req, communityId)
    
    default:
      return new Response('Method not allowed', { status: 405 })
  }
}))

/**
 * Get a single community by ID
 */
async function getCommunity(req: Request, communityId: string): Promise<Response> {
  const { supabase } = await requireAuthContext(req)
  
  // Get community with member count
  const query = supabase
    .from('communities')
    .select(`
      *,
      created_by_profile:user_profiles!communities_created_by_fkey(
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('id', communityId)
  
  const result = await querySingle<Community & { created_by_profile: any }>(supabase, query)
  
  if (result.error) {
    throw new NotFoundError('Community', communityId)
  }
  
  const community = result.data!
  
  return createSuccessResponse(community)
}

/**
 * List communities with pagination and filtering
 */
async function listCommunities(req: Request): Promise<Response> {
  const { supabase } = await requireAuthContext(req)
  const url = new URL(req.url)
  
  // Parse query parameters
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
  const search = url.searchParams.get('search')
  const type = url.searchParams.get('type') as CommunityType
  const myCommunitiesOnly = url.searchParams.get('my_communities') === 'true'
  
  let query = supabase
    .from('communities')
    .select(`
      *,
      created_by_profile:user_profiles!communities_created_by_fkey(
        id,
        username,
        display_name,
        avatar_url
      )
    `, { count: 'exact' })
  
  // Apply filters
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }
  
  if (type) {
    query = query.eq('type', type)
  }
  
  if (myCommunitiesOnly) {
    const { user } = await requireAuthContext(req)
    // Get user's community IDs first
    const userCommunitiesQuery = supabase
      .from('community_memberships')
      .select('community_id')
      .eq('user_id', user.id)
      .eq('status', 'APPROVED')
    
    const userCommunitiesResult = await queryList(supabase, userCommunitiesQuery)
    if (userCommunitiesResult.data.length > 0) {
      const communityIds = userCommunitiesResult.data.map((m: any) => m.community_id)
      query = query.in('id', communityIds)
    } else {
      // User has no communities, return empty result
      query = query.eq('id', 'no-communities-found')
    }
  }
  
  // Apply pagination and ordering
  query = applyPagination(query, { page, limit })
  query = query.order('created_at', { ascending: false })
  
  const result = await queryList<Community & { created_by_profile: any }>(supabase, query)
  
  if (result.error) {
    throw result.error
  }
  
  const response: PaginatedResponse<Community & { created_by_profile: any }> = {
    data: result.data,
    pagination: {
      page,
      limit,
      total: result.count || 0,
      has_more: (result.count || 0) > page * limit
    }
  }
  
  return createSuccessResponse(response)
}

/**
 * Debug authentication endpoint
 */
async function debugAuth(req: Request): Promise<Response> {
  try {
    console.log('=== DEBUG AUTH ENDPOINT ===')
    const authHeader = req.headers.get('Authorization')
    const apiKeyHeader = req.headers.get('apikey')
    
    console.log('Headers:', {
      authorization: authHeader ? 'Present' : 'Missing',
      apikey: apiKeyHeader ? 'Present' : 'Missing'
    })
    
    const context = await getAuthContext(req)
    
    if (context) {
      return createSuccessResponse({
        authenticated: true,
        user: context.user,
        message: 'Authentication successful'
      })
    } else {
      return createSuccessResponse({
        authenticated: false,
        message: 'Authentication failed'
      })
    }
  } catch (error) {
    console.error('Debug auth error:', error)
    return createSuccessResponse({
      authenticated: false,
      error: error.message,
      message: 'Authentication error'
    })
  }
}

/**
 * Create a new community
 */
async function createCommunity(req: Request): Promise<Response> {
  const { user, supabase } = await requireAuthContext(req)
  const data: CreateCommunityRequest = await req.json()
  
  // Validate input
  validateAndThrow(data, validateCommunityCreate)
  
  // Check for duplicate community name
  const existingQuery = supabase
    .from('communities')
    .select('id')
    .eq('name', data.name.trim())
  
  const existingResult = await querySingle(supabase, existingQuery)
  if (existingResult.data) {
    throw new ConflictError('A community with this name already exists')
  }
  
  // Create community
  const communityData = {
    name: sanitizeText(data.name),
    description: data.description ? sanitizeText(data.description) : null,
    image_url: data.image_url || null,
    type: data.type || 'PUBLIC',
    is_private: data.is_private || false,
    created_by: user.id,
    member_count: 1 // Creator is automatically a member
  }
  
  const createQuery = supabase
    .from('communities')
    .insert(communityData)
    .select(`
      *,
      created_by_profile:user_profiles!communities_created_by_fkey(
        id,
        username,
        display_name,
        avatar_url
      )
    `)
  
  const createResult = await querySingle<Community & { created_by_profile: any }>(supabase, createQuery)
  
  if (createResult.error) {
    throw createResult.error
  }
  
  const community = createResult.data!
  
  // Add creator as owner member
  const membershipData = {
    community_id: community.id,
    user_id: user.id,
    role: 'OWNER',
    status: 'APPROVED',
    approved_by: user.id,
    approved_at: new Date().toISOString()
  }
  
  const membershipQuery = supabase
    .from('community_memberships')
    .insert(membershipData)
  
  const membershipResult = await querySingle(supabase, membershipQuery)
  
  if (membershipResult.error) {
    // Rollback community creation if membership fails
    await supabase.from('communities').delete().eq('id', community.id)
    throw membershipResult.error
  }
  
  return createSuccessResponse(community, 201)
}

/**
 * Update an existing community
 */
async function updateCommunity(req: Request, communityId: string): Promise<Response> {
  const { user, supabase } = await requireAuthContext(req)
  const data: UpdateCommunityRequest = await req.json()
  
  // Check if community exists and user has permission
  const communityQuery = supabase
    .from('communities')
    .select('*')
    .eq('id', communityId)
  
  const communityResult = await querySingle<Community>(supabase, communityQuery)
  const community = assertResourceExists(communityResult.data, 'Community', communityId)
  
  // Check permissions (owner or moderator)
  const canModerate = await canModerateCommunity(supabase, user.id, communityId)
  assertPermission(canModerate, 'You do not have permission to update this community')
  
  // Validate input
  if (data.name !== undefined) {
    validateAndThrow({ name: data.name } as CreateCommunityRequest, validateCommunityCreate)
    
    // Check for duplicate name (excluding current community)
    const existingQuery = supabase
      .from('communities')
      .select('id')
      .eq('name', data.name.trim())
      .neq('id', communityId)
    
    const existingResult = await querySingle(supabase, existingQuery)
    if (existingResult.data) {
      throw new ConflictError('A community with this name already exists')
    }
  }
  
  // Build update data
  const updateData: Partial<Community> = {
    updated_at: new Date().toISOString()
  }
  
  if (data.name !== undefined) {
    updateData.name = sanitizeText(data.name)
  }
  if (data.description !== undefined) {
    updateData.description = data.description ? sanitizeText(data.description) : undefined
  }
  if (data.image_url !== undefined) {
    updateData.image_url = data.image_url || undefined
  }
  if (data.type !== undefined) {
    updateData.type = data.type
  }
  if (data.is_private !== undefined) {
    updateData.is_private = data.is_private
  }
  
  // Update community
  const updateQuery = supabase
    .from('communities')
    .update(updateData)
    .eq('id', communityId)
    .select(`
      *,
      created_by_profile:user_profiles!communities_created_by_fkey(
        id,
        username,
        display_name,
        avatar_url
      )
    `)
  
  const updateResult = await querySingle<Community & { created_by_profile: any }>(supabase, updateQuery)
  
  if (updateResult.error) {
    throw updateResult.error
  }
  
  return createSuccessResponse(updateResult.data!)
}

/**
 * Delete a community
 */
async function deleteCommunity(req: Request, communityId: string): Promise<Response> {
  const { user, supabase } = await requireAuthContext(req)
  
  // Check if community exists and user is owner
  const communityQuery = supabase
    .from('communities')
    .select('*')
    .eq('id', communityId)
  
  const communityResult = await querySingle<Community>(supabase, communityQuery)
  const community = assertResourceExists(communityResult.data, 'Community', communityId)
  
  // Only community owner can delete
  assertPermission(
    community.created_by === user.id, 
    'Only the community owner can delete this community'
  )
  
  // Delete community (cascading deletes will handle memberships, posts, etc.)
  const deleteQuery = supabase
    .from('communities')
    .delete()
    .eq('id', communityId)
  
  const deleteResult = await querySingle(supabase, deleteQuery)
  
  if (deleteResult.error) {
    throw deleteResult.error
  }
  
  return createSuccessResponse({ message: 'Community deleted successfully' })
}