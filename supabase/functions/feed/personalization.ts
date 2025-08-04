// Feed personalization and generation algorithms
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  FeedParams, 
  ContentType, 
  FeedItem as FeedItemType,
  UserProfile,
  Community,
  Review,
  Post
} from "../_shared/types.ts"
import { 
  queryList, 
  querySingle, 
  applyCursorPagination,
  applyPagination,
  isCommunityMember,
  isUserBlocked
} from "../_shared/database.ts"

export interface FeedItemWithMetadata {
  id: string
  content_type: ContentType
  content_id: string
  score: number
  created_at: string
  
  // Metadata based on content type
  user?: UserProfile
  community?: Community
  review?: Review
  post?: Post
  item?: any // ReviewableItem
}

/**
 * Generate personalized feed for a user
 */
export async function generatePersonalizedFeed(
  supabase: SupabaseClient,
  userId: string,
  params: FeedParams
): Promise<FeedItemType[]> {
  try {
    // Get user's communities for content filtering
    const userCommunities = await getUserCommunities(supabase, userId)
    const communityIds = userCommunities.map(c => c.id)
    
    // Get blocked users to filter out their content
    const blockedUsers = await getBlockedUsers(supabase, userId)
    const blockedUserIds = blockedUsers.map(b => b.blocked_id)
    
    // Build base query for feed items
    let query = supabase
      .from('feed_items_view') // We'll create this view
      .select(`
        id,
        user_id,
        content_type,
        content_id,
        score,
        created_at
      `)
      .neq('user_id', userId) // Don't include user's own content in personalized feed
    
    // Filter out blocked users
    if (blockedUserIds.length > 0) {
      query = query.not('user_id', 'in', `(${blockedUserIds.join(',')})`)
    }
    
    // Filter by content types if specified
    if (params.content_types && params.content_types.length > 0) {
      query = query.in('content_type', params.content_types)
    }
    
    // Apply community filtering - show content from user's communities
    if (communityIds.length > 0) {
      query = query.or(`community_id.in.(${communityIds.join(',')}),is_public.eq.true`)
    } else {
      // If user is not in any communities, only show public content
      query = query.eq('is_public', true)
    }
    
    // Apply pagination
    if (params.cursor) {
      query = applyCursorPagination(query, params.cursor, params.limit || 20)
    } else {
      query = applyPagination(query, { page: params.page || 1, limit: params.limit || 20 })
    }
    
    // Order by personalized score (combination of recency, engagement, and user preferences)
    query = query.order('score', { ascending: false })
      .order('created_at', { ascending: false })
    
    const result = await queryList<FeedItemType>(supabase, query)
    
    if (result.error) {
      console.error('Error fetching personalized feed:', result.error)
      return []
    }
    
    return result.data
  } catch (error) {
    console.error('Error generating personalized feed:', error)
    return []
  }
}

/**
 * Generate community-specific feed
 */
export async function generateCommunityFeed(
  supabase: SupabaseClient,
  userId: string,
  communityId: string,
  params: FeedParams
): Promise<FeedItemType[]> {
  try {
    // Check if user is member of the community
    const isMember = await isCommunityMember(supabase, userId, communityId)
    
    // Get community info to check if it's private
    const { data: community } = await supabase
      .from('communities')
      .select('is_private')
      .eq('id', communityId)
      .single()
    
    // If community is private and user is not a member, return empty feed
    if (community?.is_private && !isMember) {
      return []
    }
    
    // Get blocked users
    const blockedUsers = await getBlockedUsers(supabase, userId)
    const blockedUserIds = blockedUsers.map(b => b.blocked_id)
    
    // Build query for community feed
    let query = supabase
      .from('feed_items_view')
      .select(`
        id,
        user_id,
        content_type,
        content_id,
        score,
        created_at
      `)
      .eq('community_id', communityId)
    
    // Filter out blocked users
    if (blockedUserIds.length > 0) {
      query = query.not('user_id', 'in', `(${blockedUserIds.join(',')})`)
    }
    
    // Apply pagination
    if (params.cursor) {
      query = applyCursorPagination(query, params.cursor, params.limit || 20)
    } else {
      query = applyPagination(query, { page: params.page || 1, limit: params.limit || 20 })
    }
    
    // Order by creation time for community feeds (chronological)
    query = query.order('created_at', { ascending: false })
    
    const result = await queryList<FeedItemType>(supabase, query)
    
    if (result.error) {
      console.error('Error fetching community feed:', result.error)
      return []
    }
    
    return result.data
  } catch (error) {
    console.error('Error generating community feed:', error)
    return []
  }
}

/**
 * Generate user's public feed (their posts and reviews)
 */
export async function generateUserFeed(
  supabase: SupabaseClient,
  viewerId: string,
  targetUserId: string,
  params: FeedParams
): Promise<FeedItemType[]> {
  try {
    // Check if viewer is blocked by target user
    const isBlocked = await isUserBlocked(supabase, targetUserId, viewerId)
    if (isBlocked) {
      return []
    }
    
    // Get target user's profile to check visibility settings
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('profile_visibility')
      .eq('id', targetUserId)
      .single()
    
    // Check if viewer can see this user's content
    if (userProfile?.profile_visibility === 'PRIVATE' && viewerId !== targetUserId) {
      return []
    }
    
    // If profile is COMMUNITIES_ONLY, check if they share any communities
    if (userProfile?.profile_visibility === 'COMMUNITIES_ONLY' && viewerId !== targetUserId) {
      const sharedCommunities = await getSharedCommunities(supabase, viewerId, targetUserId)
      if (sharedCommunities.length === 0) {
        return []
      }
    }
    
    // Build query for user's public content
    let query = supabase
      .from('feed_items_view')
      .select(`
        id,
        user_id,
        content_type,
        content_id,
        score,
        created_at
      `)
      .eq('user_id', targetUserId)
      .eq('is_public', true) // Only show public content in user feeds
    
    // Apply pagination
    if (params.cursor) {
      query = applyCursorPagination(query, params.cursor, params.limit || 20)
    } else {
      query = applyPagination(query, { page: params.page || 1, limit: params.limit || 20 })
    }
    
    // Order by creation time
    query = query.order('created_at', { ascending: false })
    
    const result = await queryList<FeedItemType>(supabase, query)
    
    if (result.error) {
      console.error('Error fetching user feed:', result.error)
      return []
    }
    
    return result.data
  } catch (error) {
    console.error('Error generating user feed:', error)
    return []
  }
}

/**
 * Refresh user's feed cache by recalculating scores
 */
export async function refreshUserFeed(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  try {
    // Get user's communities and preferences
    const userCommunities = await getUserCommunities(supabase, userId)
    const communityIds = userCommunities.map(c => c.id)
    
    // Calculate new scores for feed items
    // This is a simplified scoring algorithm - in production you might want more sophisticated ML-based scoring
    const scoringQuery = `
      UPDATE feed_items 
      SET score = CASE
        WHEN content_type = 'REVIEW' THEN 
          (EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600)::numeric * -0.1 + 
          (SELECT COALESCE(likes_count, 0) FROM reviews WHERE id = content_id) * 2 +
          (SELECT rating FROM reviews WHERE id = content_id) * 0.5
        WHEN content_type = 'POST' THEN
          (EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600)::numeric * -0.1 + 
          (SELECT COALESCE(likes_count, 0) FROM posts WHERE id = content_id) * 1.5 +
          (SELECT COALESCE(comments_count, 0) FROM posts WHERE id = content_id) * 1
        ELSE 1
      END
      WHERE user_id = $1
    `
    
    await supabase.rpc('execute_sql', { 
      sql: scoringQuery, 
      params: [userId] 
    })
    
    console.log(`Feed refreshed for user ${userId}`)
  } catch (error) {
    console.error('Error refreshing user feed:', error)
    throw error
  }
}

/**
 * Get feed items with full metadata for display
 */
export async function getFeedWithMetadata(
  supabase: SupabaseClient,
  feedItems: FeedItemType[],
  viewerId: string
): Promise<FeedItemWithMetadata[]> {
  if (feedItems.length === 0) {
    return []
  }
  
  const itemsWithMetadata: FeedItemWithMetadata[] = []
  
  for (const item of feedItems) {
    try {
      const itemWithMetadata: FeedItemWithMetadata = {
        id: item.id,
        content_type: item.content_type,
        content_id: item.content_id,
        score: item.score,
        created_at: item.created_at
      }
      
      // Get user profile
      const { data: user } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', item.user_id)
        .single()
      
      if (user) {
        itemWithMetadata.user = user
      }
      
      // Get content-specific metadata
      if (item.content_type === 'REVIEW') {
        const { data: review } = await supabase
          .from('reviews')
          .select(`
            *,
            reviewable_items (*)
          `)
          .eq('id', item.content_id)
          .single()
        
        if (review) {
          itemWithMetadata.review = review
          itemWithMetadata.item = review.reviewable_items
          
          // Get community info
          const { data: community } = await supabase
            .from('communities')
            .select('*')
            .eq('id', review.community_id)
            .single()
          
          if (community) {
            itemWithMetadata.community = community
          }
        }
      } else if (item.content_type === 'POST') {
        const { data: post } = await supabase
          .from('posts')
          .select(`
            *,
            reviewable_items (*),
            post_communities (
              communities (*)
            )
          `)
          .eq('id', item.content_id)
          .single()
        
        if (post) {
          itemWithMetadata.post = post
          if (post.referenced_item_id) {
            itemWithMetadata.item = post.reviewable_items
          }
          
          // Get communities this post was shared to
          if (post.post_communities && post.post_communities.length > 0) {
            itemWithMetadata.community = post.post_communities[0].communities
          }
        }
      }
      
      itemsWithMetadata.push(itemWithMetadata)
    } catch (error) {
      console.error(`Error getting metadata for feed item ${item.id}:`, error)
      // Still include the item without metadata
      itemsWithMetadata.push({
        id: item.id,
        content_type: item.content_type,
        content_id: item.content_id,
        score: item.score,
        created_at: item.created_at
      })
    }
  }
  
  return itemsWithMetadata
}

/**
 * Get user's communities
 */
async function getUserCommunities(
  supabase: SupabaseClient,
  userId: string
): Promise<Community[]> {
  const { data } = await supabase
    .from('community_memberships')
    .select(`
      communities (*)
    `)
    .eq('user_id', userId)
    .eq('status', 'APPROVED')
  
  return data?.map(m => m.communities).filter(Boolean) || []
}

/**
 * Get users blocked by the given user
 */
async function getBlockedUsers(
  supabase: SupabaseClient,
  userId: string
): Promise<{ blocked_id: string }[]> {
  const { data } = await supabase
    .from('user_blocks')
    .select('blocked_id')
    .eq('blocker_id', userId)
  
  return data || []
}

/**
 * Get communities shared between two users
 */
async function getSharedCommunities(
  supabase: SupabaseClient,
  userId1: string,
  userId2: string
): Promise<Community[]> {
  const { data } = await supabase
    .from('community_memberships')
    .select(`
      community_id,
      communities (*)
    `)
    .eq('user_id', userId1)
    .eq('status', 'APPROVED')
  
  if (!data || data.length === 0) {
    return []
  }
  
  const user1Communities = data.map(m => m.community_id)
  
  const { data: sharedData } = await supabase
    .from('community_memberships')
    .select(`
      communities (*)
    `)
    .eq('user_id', userId2)
    .eq('status', 'APPROVED')
    .in('community_id', user1Communities)
  
  return sharedData?.map(m => m.communities).filter(Boolean) || []
}

/**
 * Calculate engagement score for content
 */
export function calculateEngagementScore(
  likes: number,
  comments: number,
  shares: number = 0,
  ageInHours: number
): number {
  // Base engagement score
  const engagementScore = (likes * 2) + (comments * 3) + (shares * 5)
  
  // Time decay factor (content gets less relevant over time)
  const timeDecay = Math.exp(-ageInHours / 24) // Decay over 24 hours
  
  // Combine engagement and recency
  return engagementScore * timeDecay
}

/**
 * Calculate personalization score based on user preferences
 */
export function calculatePersonalizationScore(
  userId: string,
  contentUserId: string,
  communityId: string,
  userCommunities: string[],
  userInteractions: Record<string, number>
): number {
  let score = 1.0 // Base score
  
  // Boost content from communities user is active in
  if (userCommunities.includes(communityId)) {
    score *= 1.5
  }
  
  // Boost content from users the viewer has interacted with
  if (userInteractions[contentUserId]) {
    score *= (1 + userInteractions[contentUserId] * 0.1)
  }
  
  return score
}