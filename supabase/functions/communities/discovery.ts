// Community discovery and search
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { 
  withErrorHandling, 
  createSuccessResponse
} from '../_shared/errors.ts'
import { 
  requireAuthContext, 
  getAuthContext
} from '../_shared/auth.ts'
import { 
  queryList, 
  applyPagination,
  isCommunityMember
} from '../_shared/database.ts'
import { 
  Community, 
  PaginationParams,
  PaginatedResponse,
  CommunityType
} from '../_shared/types.ts'

serve(withErrorHandling(async (req: Request): Promise<Response> => {
  const url = new URL(req.url)
  const method = req.method
  
  switch (method) {
    case 'GET':
      return await discoverCommunities(req)
    
    default:
      return new Response('Method not allowed', { status: 405 })
  }
}))

/**
 * Discover communities with advanced search and filtering
 */
async function discoverCommunities(req: Request): Promise<Response> {
  // Auth is optional for discovery - public communities can be viewed by anyone
  const authContext = await getAuthContext(req)
  const supabase = authContext?.supabase || 
    (await import('../_shared/auth.ts')).createSupabaseServiceClient()
  
  const url = new URL(req.url)
  
  // Parse query parameters
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
  const search = url.searchParams.get('search')
  const type = url.searchParams.get('type') as CommunityType
  const sortBy = url.searchParams.get('sort_by') || 'created_at'
  const sortOrder = url.searchParams.get('sort_order') || 'desc'
  const minMembers = parseInt(url.searchParams.get('min_members') || '0')
  const maxMembers = parseInt(url.searchParams.get('max_members') || '999999')
  const includePrivate = url.searchParams.get('include_private') === 'true'
  const recommendedOnly = url.searchParams.get('recommended') === 'true'
  
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
  
  // Apply privacy filter
  if (!includePrivate || !authContext) {
    query = query.eq('is_private', false)
  }
  
  // Apply search filter
  if (search) {
    const searchTerm = search.trim()
    query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
  }
  
  // Apply type filter
  if (type) {
    query = query.eq('type', type)
  }
  
  // Apply member count filters
  if (minMembers > 0) {
    query = query.gte('member_count', minMembers)
  }
  if (maxMembers < 999999) {
    query = query.lte('member_count', maxMembers)
  }
  
  // Apply recommended filter (communities with similar interests)
  if (recommendedOnly && authContext) {
    // Get user's communities to find similar ones
    const userCommunitiesQuery = supabase
      .from('community_memberships')
      .select('community_id')
      .eq('user_id', authContext.user.id)
      .eq('status', 'APPROVED')
    
    const userCommunitiesResult = await queryList(supabase, userCommunitiesQuery)
    
    if (userCommunitiesResult.data.length > 0) {
      const userCommunityIds = userCommunitiesResult.data.map((m: any) => m.community_id)
      
      // Exclude communities user is already in
      query = query.not('id', 'in', `(${userCommunityIds.join(',')})`)
      
      // This is a simplified recommendation - in production you might want
      // more sophisticated algorithms based on tags, categories, etc.
    }
  }
  
  // Apply sorting
  const validSortFields = ['created_at', 'member_count', 'name']
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at'
  const ascending = sortOrder === 'asc'
  
  query = query.order(sortField, { ascending })
  
  // Apply pagination
  query = applyPagination(query, { page, limit })
  
  const result = await queryList<Community & { 
    created_by_profile: any 
  }>(supabase, query)
  
  if (result.error) {
    throw result.error
  }
  
  // Enhance results with user membership status if authenticated
  let enhancedData = result.data
  if (authContext) {
    enhancedData = await Promise.all(
      result.data.map(async (community) => {
        const isMember = await isCommunityMember(
          supabase, 
          authContext.user.id, 
          community.id
        )
        return {
          ...community,
          user_is_member: isMember
        }
      })
    )
  }
  
  const response: PaginatedResponse<Community & { 
    created_by_profile: any,
    user_is_member?: boolean 
  }> = {
    data: enhancedData,
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
 * Get trending communities (most active recently)
 */
export async function getTrendingCommunities(req: Request): Promise<Response> {
  const authContext = await getAuthContext(req)
  const supabase = authContext?.supabase || 
    (await import('../_shared/auth.ts')).createSupabaseServiceClient()
  
  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50)
  const timeframe = url.searchParams.get('timeframe') || '7d' // 1d, 7d, 30d
  
  // Calculate date threshold based on timeframe
  const now = new Date()
  let daysBack = 7
  switch (timeframe) {
    case '1d': daysBack = 1; break
    case '30d': daysBack = 30; break
    default: daysBack = 7
  }
  const threshold = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))
  
  // Get communities with recent activity (posts, reviews, new members)
  const query = supabase
    .from('communities')
    .select(`
      *,
      created_by_profile:user_profiles!communities_created_by_fkey(
        id,
        username,
        display_name,
        avatar_url
      ),
      recent_posts:posts!inner(count),
      recent_reviews:reviews!inner(count),
      recent_members:community_memberships!inner(count)
    `)
    .eq('is_private', false)
    .gte('posts.created_at', threshold.toISOString())
    .gte('reviews.created_at', threshold.toISOString())
    .gte('community_memberships.joined_at', threshold.toISOString())
    .limit(limit)
    .order('member_count', { ascending: false })
  
  const result = await queryList<Community & { 
    created_by_profile: any,
    recent_posts: any[],
    recent_reviews: any[],
    recent_members: any[]
  }>(supabase, query)
  
  if (result.error) {
    throw result.error
  }
  
  // Calculate activity score and sort by it
  const communitiesWithScore = result.data.map(community => ({
    ...community,
    activity_score: (
      (community.recent_posts?.length || 0) * 3 +
      (community.recent_reviews?.length || 0) * 2 +
      (community.recent_members?.length || 0) * 1
    )
  })).sort((a, b) => b.activity_score - a.activity_score)
  
  return createSuccessResponse(communitiesWithScore)
}

/**
 * Get community suggestions based on user interests
 */
export async function getSuggestedCommunities(req: Request): Promise<Response> {
  const { user, supabase } = await requireAuthContext(req)
  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50)
  
  // Get user's current communities
  const userCommunitiesQuery = supabase
    .from('community_memberships')
    .select(`
      community_id,
      community:communities!community_memberships_community_id_fkey(
        type,
        name
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'APPROVED')
  
  const userCommunitiesResult = await queryList(supabase, userCommunitiesQuery)
  
  if (userCommunitiesResult.error) {
    throw userCommunitiesResult.error
  }
  
  const userCommunityIds = userCommunitiesResult.data.map((m: any) => m.community_id)
  
  // Find communities with similar members (collaborative filtering)
  let suggestedQuery = supabase
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
    .eq('is_private', false)
    .limit(limit)
    .order('member_count', { ascending: false })
  
  // Exclude communities user is already in
  if (userCommunityIds.length > 0) {
    suggestedQuery = suggestedQuery.not('id', 'in', `(${userCommunityIds.join(',')})`)
  }
  
  const suggestedResult = await queryList<Community & { 
    created_by_profile: any 
  }>(supabase, suggestedQuery)
  
  if (suggestedResult.error) {
    throw suggestedResult.error
  }
  
  // In a more sophisticated implementation, you would:
  // 1. Analyze user's community types and interests
  // 2. Look at what similar users have joined
  // 3. Consider user's review history and preferences
  // 4. Use machine learning for better recommendations
  
  return createSuccessResponse(suggestedResult.data)
}