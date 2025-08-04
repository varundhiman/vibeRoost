// Rating aggregation and calculation logic
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { querySingle, queryList } from '../_shared/database.ts'
import { ReviewableItem } from '../_shared/types.ts'

export interface RatingStats {
  average_rating: number
  total_reviews: number
  rating_distribution: {
    [key: number]: number // rating -> count
  }
}

export interface ItemRatingUpdate {
  aggregated_rating: number
  review_count: number
  updated_at: string
}

/**
 * Calculate comprehensive rating statistics for an item
 */
export async function calculateRatingStats(
  supabase: SupabaseClient,
  itemId: string
): Promise<RatingStats | null> {
  try {
    // Get all reviews for the item
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('item_id', itemId)

    if (error || !reviews || reviews.length === 0) {
      return {
        average_rating: 0,
        total_reviews: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0)
    const averageRating = totalRating / reviews.length

    // Calculate rating distribution
    const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    reviews.forEach((review: any) => {
      distribution[review.rating] = (distribution[review.rating] || 0) + 1
    })

    return {
      average_rating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
      total_reviews: reviews.length,
      rating_distribution: distribution
    }

  } catch (error) {
    console.error('Error calculating rating stats:', error)
    return null
  }
}

/**
 * Update aggregated rating for a reviewable item
 */
export async function updateItemAggregatedRating(
  supabase: SupabaseClient,
  itemId: string
): Promise<boolean> {
  try {
    const stats = await calculateRatingStats(supabase, itemId)
    if (!stats) {
      return false
    }

    const updateData: ItemRatingUpdate = {
      aggregated_rating: stats.average_rating,
      review_count: stats.total_reviews,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('reviewable_items')
      .update(updateData)
      .eq('id', itemId)

    if (error) {
      console.error('Error updating item rating:', error)
      return false
    }

    return true

  } catch (error) {
    console.error('Error updating aggregated rating:', error)
    return false
  }
}

/**
 * Get top rated items by category
 */
export async function getTopRatedItems(
  supabase: SupabaseClient,
  itemType?: string,
  limit: number = 10,
  minReviews: number = 5
): Promise<ReviewableItem[]> {
  try {
    let query = supabase
      .from('reviewable_items')
      .select('*')
      .gte('review_count', minReviews)
      .order('aggregated_rating', { ascending: false })
      .order('review_count', { ascending: false })
      .limit(limit)

    if (itemType) {
      query = query.eq('type', itemType)
    }

    const result = await queryList<ReviewableItem>(supabase, query)
    return result.data || []

  } catch (error) {
    console.error('Error getting top rated items:', error)
    return []
  }
}

/**
 * Get trending items based on recent review activity
 */
export async function getTrendingItems(
  supabase: SupabaseClient,
  itemType?: string,
  limit: number = 10,
  daysSince: number = 7
): Promise<ReviewableItem[]> {
  try {
    const sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - daysSince)

    // Get items with recent reviews
    let query = supabase
      .from('reviewable_items')
      .select(`
        *,
        recent_reviews:reviews!reviews_item_id_fkey(count)
      `)
      .gte('reviews.created_at', sinceDate.toISOString())

    if (itemType) {
      query = query.eq('type', itemType)
    }

    const result = await queryList<ReviewableItem>(supabase, query.limit(limit))
    return result.data || []

  } catch (error) {
    console.error('Error getting trending items:', error)
    return []
  }
}

/**
 * Calculate user's average rating given
 */
export async function getUserAverageRating(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('user_id', userId)

    if (error || !reviews || reviews.length === 0) {
      return 0
    }

    const totalRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0)
    return Math.round((totalRating / reviews.length) * 100) / 100

  } catch (error) {
    console.error('Error calculating user average rating:', error)
    return 0
  }
}

/**
 * Get rating distribution for a specific item
 */
export async function getItemRatingDistribution(
  supabase: SupabaseClient,
  itemId: string
): Promise<{ [key: number]: number }> {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('item_id', itemId)

    if (error || !reviews) {
      return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    }

    const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    reviews.forEach((review: any) => {
      distribution[review.rating] = (distribution[review.rating] || 0) + 1
    })

    return distribution

  } catch (error) {
    console.error('Error getting rating distribution:', error)
    return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  }
}

/**
 * Compare user's rating with community average
 */
export async function compareUserRatingWithCommunity(
  supabase: SupabaseClient,
  userId: string,
  itemId: string,
  communityId: string
): Promise<{
  user_rating: number | null
  community_average: number
  difference: number
}> {
  try {
    // Get user's rating
    const { data: userReview } = await supabase
      .from('reviews')
      .select('rating')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .eq('community_id', communityId)
      .single()

    // Get community average for this item
    const { data: communityReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('item_id', itemId)
      .eq('community_id', communityId)

    let communityAverage = 0
    if (communityReviews && communityReviews.length > 0) {
      const total = communityReviews.reduce((sum: number, review: any) => sum + review.rating, 0)
      communityAverage = Math.round((total / communityReviews.length) * 100) / 100
    }

    const userRating = userReview?.rating || null
    const difference = userRating ? userRating - communityAverage : 0

    return {
      user_rating: userRating,
      community_average: communityAverage,
      difference: Math.round(difference * 100) / 100
    }

  } catch (error) {
    console.error('Error comparing ratings:', error)
    return {
      user_rating: null,
      community_average: 0,
      difference: 0
    }
  }
}

/**
 * Get similar items based on rating patterns
 */
export async function getSimilarItems(
  supabase: SupabaseClient,
  itemId: string,
  limit: number = 5
): Promise<ReviewableItem[]> {
  try {
    // Get the target item's details
    const { data: targetItem } = await supabase
      .from('reviewable_items')
      .select('type, aggregated_rating')
      .eq('id', itemId)
      .single()

    if (!targetItem) {
      return []
    }

    // Find items with similar ratings in the same category
    const ratingRange = 0.5 // +/- 0.5 rating points
    const minRating = Math.max(1, targetItem.aggregated_rating - ratingRange)
    const maxRating = Math.min(5, targetItem.aggregated_rating + ratingRange)

    const { data: similarItems } = await supabase
      .from('reviewable_items')
      .select('*')
      .eq('type', targetItem.type)
      .neq('id', itemId)
      .gte('aggregated_rating', minRating)
      .lte('aggregated_rating', maxRating)
      .gte('review_count', 3) // Minimum reviews for reliability
      .order('review_count', { ascending: false })
      .limit(limit)

    return similarItems || []

  } catch (error) {
    console.error('Error getting similar items:', error)
    return []
  }
}