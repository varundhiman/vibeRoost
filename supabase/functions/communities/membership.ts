// Community membership management
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
  validateRequired,
  validateUUID,
  throwIfValidationErrors
} from '../_shared/validation.ts'
import { 
  Community, 
  CommunityMembership,
  JoinCommunityRequest,
  PaginationParams,
  PaginatedResponse,
  MemberRole,
  MembershipStatus
} from '../_shared/types.ts'

serve(withErrorHandling(async (req: Request): Promise<Response> => {
  const url = new URL(req.url)
  const method = req.method
  const pathSegments = url.pathname.split('/').filter(Boolean)
  
  // Extract community ID from path
  const communityId = pathSegments[pathSegments.length - 2] // .../communities/{id}/membership
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(communityId)
  
  if (!isUUID) {
    throw new NotFoundError('Community', communityId)
  }
  
  switch (method) {
    case 'GET':
      return await getCommunityMembers(req, communityId)
    
    case 'POST':
      return await joinCommunity(req, communityId)
    
    case 'DELETE':
      return await leaveCommunity(req, communityId)
    
    default:
      return new Response('Method not allowed', { status: 405 })
  }
}))

/**
 * Get community members with pagination
 */
async function getCommunityMembers(req: Request, communityId: string): Promise<Response> {
  const { user, supabase } = await requireAuthContext(req)
  const url = new URL(req.url)
  
  // Check if community exists and user has access
  const communityQuery = supabase
    .from('communities')
    .select('*')
    .eq('id', communityId)
  
  const communityResult = await querySingle<Community>(supabase, communityQuery)
  const community = assertResourceExists(communityResult.data, 'Community', communityId)
  
  // Check if user can view members (must be member for private communities)
  if (community.is_private) {
    const isMember = await isCommunityMember(supabase, user.id, communityId)
    assertPermission(isMember, 'You must be a member to view this community\'s members')
  }
  
  // Parse pagination parameters
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
  const role = url.searchParams.get('role') as MemberRole
  const status = url.searchParams.get('status') as MembershipStatus || 'APPROVED'
  
  let query = supabase
    .from('community_memberships')
    .select(`
      *,
      user_profile:user_profiles!community_memberships_user_id_fkey(
        id,
        username,
        display_name,
        avatar_url
      )
    `, { count: 'exact' })
    .eq('community_id', communityId)
    .eq('status', status)
  
  // Apply role filter if specified
  if (role) {
    query = query.eq('role', role)
  }
  
  // Apply pagination and ordering
  query = applyPagination(query, { page, limit })
  query = query.order('joined_at', { ascending: false })
  
  const result = await queryList<CommunityMembership & { user_profile: any }>(supabase, query)
  
  if (result.error) {
    throw result.error
  }
  
  const response: PaginatedResponse<CommunityMembership & { user_profile: any }> = {
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
 * Join a community
 */
async function joinCommunity(req: Request, communityId: string): Promise<Response> {
  const { user, supabase } = await requireAuthContext(req)
  
  // Check if community exists
  const communityQuery = supabase
    .from('communities')
    .select('*')
    .eq('id', communityId)
  
  const communityResult = await querySingle<Community>(supabase, communityQuery)
  const community = assertResourceExists(communityResult.data, 'Community', communityId)
  
  // Check if user is already a member
  const existingMembershipQuery = supabase
    .from('community_memberships')
    .select('*')
    .eq('community_id', communityId)
    .eq('user_id', user.id)
  
  const existingResult = await querySingle<CommunityMembership>(supabase, existingMembershipQuery)
  
  if (existingResult.data) {
    const membership = existingResult.data
    if (membership.status === 'APPROVED') {
      throw new ConflictError('You are already a member of this community')
    } else if (membership.status === 'PENDING') {
      throw new ConflictError('Your membership request is already pending')
    } else if (membership.status === 'BANNED') {
      throw new ForbiddenError('You are banned from this community')
    }
  }
  
  // Determine membership status based on community type
  let status: MembershipStatus = 'APPROVED'
  let approvedBy: string | null = null
  let approvedAt: string | null = null
  
  if (community.type === 'PRIVATE' || community.type === 'INVITE_ONLY') {
    status = 'PENDING'
  } else {
    approvedBy = user.id // Auto-approve for public communities
    approvedAt = new Date().toISOString()
  }
  
  // Create membership
  const membershipData = {
    community_id: communityId,
    user_id: user.id,
    role: 'MEMBER',
    status,
    approved_by: approvedBy,
    approved_at: approvedAt
  }
  
  const createQuery = supabase
    .from('community_memberships')
    .insert(membershipData)
    .select(`
      *,
      user_profile:user_profiles!community_memberships_user_id_fkey(
        id,
        username,
        display_name,
        avatar_url
      ),
      community:communities!community_memberships_community_id_fkey(
        id,
        name,
        image_url
      )
    `)
  
  const createResult = await querySingle<CommunityMembership & { 
    user_profile: any, 
    community: any 
  }>(supabase, createQuery)
  
  if (createResult.error) {
    throw createResult.error
  }
  
  const membership = createResult.data!
  
  // Increment member count if approved
  if (status === 'APPROVED') {
    await incrementCounter(supabase, 'communities', 'member_count', communityId)
  }
  
  return createSuccessResponse(membership, 201)
}

/**
 * Leave a community or remove a member
 */
async function leaveCommunity(req: Request, communityId: string): Promise<Response> {
  const { user, supabase } = await requireAuthContext(req)
  const url = new URL(req.url)
  
  // Check if a specific user ID is provided (for moderator actions)
  const targetUserId = url.searchParams.get('user_id') || user.id
  const isRemovingOtherUser = targetUserId !== user.id
  
  // Check if community exists
  const communityQuery = supabase
    .from('communities')
    .select('*')
    .eq('id', communityId)
  
  const communityResult = await querySingle<Community>(supabase, communityQuery)
  const community = assertResourceExists(communityResult.data, 'Community', communityId)
  
  // Check if membership exists
  const membershipQuery = supabase
    .from('community_memberships')
    .select('*')
    .eq('community_id', communityId)
    .eq('user_id', targetUserId)
  
  const membershipResult = await querySingle<CommunityMembership>(supabase, membershipQuery)
  const membership = assertResourceExists(membershipResult.data, 'Membership')
  
  // Permission checks
  if (isRemovingOtherUser) {
    // Check if current user can moderate community
    const canModerate = await canModerateCommunity(supabase, user.id, communityId)
    assertPermission(canModerate, 'You do not have permission to remove members')
    
    // Cannot remove community owner
    assertPermission(
      membership.role !== 'OWNER', 
      'Cannot remove the community owner'
    )
    
    // Moderators cannot remove other moderators (only owners can)
    const currentUserRole = await getCommunityRole(supabase, user.id, communityId)
    if (membership.role === 'MODERATOR' && currentUserRole !== 'OWNER') {
      throw new ForbiddenError('Only community owners can remove moderators')
    }
  } else {
    // Users cannot leave if they are the only owner
    if (membership.role === 'OWNER') {
      const ownerCountQuery = supabase
        .from('community_memberships')
        .select('id', { count: 'exact' })
        .eq('community_id', communityId)
        .eq('role', 'OWNER')
        .eq('status', 'APPROVED')
      
      const ownerCountResult = await queryList(supabase, ownerCountQuery)
      
      if ((ownerCountResult.count || 0) <= 1) {
        throw new ForbiddenError('Cannot leave community as the only owner. Transfer ownership first.')
      }
    }
  }
  
  // Remove membership
  const deleteQuery = supabase
    .from('community_memberships')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', targetUserId)
  
  const deleteResult = await querySingle(supabase, deleteQuery)
  
  if (deleteResult.error) {
    throw deleteResult.error
  }
  
  // Decrement member count if membership was approved
  if (membership.status === 'APPROVED') {
    await decrementCounter(supabase, 'communities', 'member_count', communityId)
  }
  
  const message = isRemovingOtherUser 
    ? 'Member removed successfully'
    : 'Left community successfully'
  
  return createSuccessResponse({ message })
}

/**
 * Update member role or status (separate endpoint for moderation actions)
 */
export async function updateMembership(
  req: Request, 
  communityId: string, 
  membershipId: string
): Promise<Response> {
  const { user, supabase } = await requireAuthContext(req)
  const data = await req.json()
  
  // Check if community exists and user can moderate
  const canModerate = await canModerateCommunity(supabase, user.id, communityId)
  assertPermission(canModerate, 'You do not have permission to update memberships')
  
  // Get current membership
  const membershipQuery = supabase
    .from('community_memberships')
    .select('*')
    .eq('id', membershipId)
    .eq('community_id', communityId)
  
  const membershipResult = await querySingle<CommunityMembership>(supabase, membershipQuery)
  const membership = assertResourceExists(membershipResult.data, 'Membership', membershipId)
  
  // Build update data
  const updateData: Partial<CommunityMembership> = {}
  
  if (data.role !== undefined) {
    // Only owners can promote to moderator or owner
    const currentUserRole = await getCommunityRole(supabase, user.id, communityId)
    if ((data.role === 'MODERATOR' || data.role === 'OWNER') && currentUserRole !== 'OWNER') {
      throw new ForbiddenError('Only community owners can promote members to moderator or owner')
    }
    updateData.role = data.role
  }
  
  if (data.status !== undefined) {
    updateData.status = data.status
    if (data.status === 'APPROVED') {
      updateData.approved_by = user.id
      updateData.approved_at = new Date().toISOString()
    }
  }
  
  // Update membership
  const updateQuery = supabase
    .from('community_memberships')
    .update(updateData)
    .eq('id', membershipId)
    .select(`
      *,
      user_profile:user_profiles!community_memberships_user_id_fkey(
        id,
        username,
        display_name,
        avatar_url
      )
    `)
  
  const updateResult = await querySingle<CommunityMembership & { user_profile: any }>(supabase, updateQuery)
  
  if (updateResult.error) {
    throw updateResult.error
  }
  
  // Update member count if status changed
  if (data.status !== undefined && data.status !== membership.status) {
    if (data.status === 'APPROVED' && membership.status !== 'APPROVED') {
      await incrementCounter(supabase, 'communities', 'member_count', communityId)
    } else if (data.status !== 'APPROVED' && membership.status === 'APPROVED') {
      await decrementCounter(supabase, 'communities', 'member_count', communityId)
    }
  }
  
  return createSuccessResponse(updateResult.data!)
}