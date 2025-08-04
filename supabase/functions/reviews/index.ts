// Review CRUD operations
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/utils.ts'
import { authenticateUser } from '../_shared/auth.ts'
import { createErrorResponse, createSuccessResponse } from '../_shared/errors.ts'
import { 
  Review, 
  CreateReviewRequest, 
  UpdateReviewRequest,
  ReviewableItem,
  CreateReviewableItemRequest,
  PaginationParams,
  ApiResponse 
} from '../_shared/types.ts'
import { 
  validateReviewCreate, 
  validateAndThrow, 
  ValidationException,
  sanitizeText,
  validateUUID,
  validateRequired,
  validateRating
} from '../_shared/validation.ts'
import { 
  querySingle, 
  queryList, 
  applyPagination,
  updateItemRating,
  isCommunityMember,
  getUserProfile
} from '../_shared/database.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return handleCors(req)
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const method = req.method

    // Extract review ID from path if present
    const reviewId = pathSegments[pathSegments.length - 1]
    const isReviewIdPath = reviewId && validateUUID(reviewId)

    // Route requests
    if (method === 'GET' && !isReviewIdPath) {
      return await handleListReviews(req, supabase)
    } else if (method === 'GET' && isReviewIdPath) {
      return await handleGetReview(req, supabase, reviewId)
    } else if (method === 'POST' && !isReviewIdPath) {
      return await handleCreateReview(req, supabase)
    } else if (method === 'PUT' && isReviewIdPath) {
      return await handleUpdateReview(req, supabase, reviewId)
    } else if (method === 'DELETE' && isReviewIdPath) {
      return await handleDeleteReview(req, supabase, reviewId)
    } else if (method === 'POST' && pathSegments.includes('like')) {
      const reviewIdFromPath = pathSegments[pathSegments.indexOf('like') - 1]
      return await handleToggleLike(req, supabase, reviewIdFromPath)
    } else {
      return createErrorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
    }

  } catch (error) {
    console.error('Review function error:', error)
    
    if (error instanceof ValidationException) {
      return createErrorResponse('VALIDATION_ERROR', 'Validation failed', 400, error.errors)
    }
    
    return createErrorResponse('INTERNAL_ERROR', 'Internal server error', 500)
  }
})

async function handleListReviews(req: Request, supabase: any): Promise<Response> {
  const url = new URL(req.url)
  const params = url.searchParams
  
  // Parse query parameters
  const page = parseInt(params.get('page') || '1')
  const limit = Math.min(parseInt(params.get('limit') || '20'), 100)
  const itemId = params.get('item_id')
  const communityId = params.get('community_id')
  const userId = params.get('user_id')
  const isPublic = params.get('is_public')
  const sortBy = params.get('sort_by') || 'created_at'
  const sortOrder = params.get('sort_order') || 'desc'

  try {
    let query = supabase
      .from('reviews')
      .select(`
        *,
        user_profiles!reviews_user_id_fkey(id, username, display_name, avatar_url),
        reviewable_items!reviews_item_id_fkey(id, title, type, image_url),
        communities!reviews_community_id_fkey(id, name, image_url)
      `)

    // Apply filters
    if (itemId) {
      if (!validateUUID(itemId)) {
        return createErrorResponse('INVALID_ITEM_ID', 'Invalid item ID format', 400)
      }
      query = query.eq('item_id', itemId)
    }

    if (communityId) {
      if (!validateUUID(communityId)) {
        return createErrorResponse('INVALID_COMMUNITY_ID', 'Invalid community ID format', 400)
      }
      query = query.eq('community_id', communityId)
    }

    if (userId) {
      if (!validateUUID(userId)) {
        return createErrorResponse('INVALID_USER_ID', 'Invalid user ID format', 400)
      }
      query = query.eq('user_id', userId)
    }

    if (isPublic !== null) {
      query = query.eq('is_public', isPublic === 'true')
    }

    // Apply sorting
    const validSortFields = ['created_at', 'updated_at', 'rating', 'likes_count']
    if (validSortFields.includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    }

    // Apply pagination
    query = applyPagination(query, { page, limit })

    const result = await queryList<Review>(supabase, query)
    
    if (result.error) {
      return createErrorResponse('DATABASE_ERROR', result.error.message, 500)
    }

    return createSuccessResponse({
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.count || 0,
        has_more: result.data.length === limit
      }
    })

  } catch (error) {
    console.error('List reviews error:', error)
    return createErrorResponse('INTERNAL_ERROR', 'Failed to list reviews', 500)
  }
}

async function handleGetReview(req: Request, supabase: any, reviewId: string): Promise<Response> {
  try {
    const query = supabase
      .from('reviews')
      .select(`
        *,
        user_profiles!reviews_user_id_fkey(id, username, display_name, avatar_url),
        reviewable_items!reviews_item_id_fkey(*),
        communities!reviews_community_id_fkey(id, name, image_url)
      `)
      .eq('id', reviewId)

    const result = await querySingle<Review>(supabase, query)
    
    if (result.error) {
      return createErrorResponse('DATABASE_ERROR', result.error.message, 500)
    }

    if (!result.data) {
      return createErrorResponse('NOT_FOUND', 'Review not found', 404)
    }

    return createSuccessResponse(result.data)

  } catch (error) {
    console.error('Get review error:', error)
    return createErrorResponse('INTERNAL_ERROR', 'Failed to get review', 500)
  }
}

async function handleCreateReview(req: Request, supabase: any): Promise<Response> {
  // Authenticate user
  const authResult = await authenticateUser(req, supabase)
  if (!authResult.success) {
    return createErrorResponse('AUTH_REQUIRED', authResult.error || 'Authentication required', 401)
  }

  const userId = authResult.user!.id

  try {
    const body = await req.json()
    const reviewData: CreateReviewRequest = body

    // Validate input
    validateAndThrow(reviewData, validateReviewCreate)

    // Check if user is member of the community
    const isMember = await isCommunityMember(supabase, userId, reviewData.community_id)
    if (!isMember) {
      return createErrorResponse('FORBIDDEN', 'You must be a member of this community to create reviews', 403)
    }

    // Check if user already reviewed this item in this community
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', userId)
      .eq('item_id', reviewData.item_id)
      .eq('community_id', reviewData.community_id)
      .single()

    if (existingReview) {
      return createErrorResponse('DUPLICATE_REVIEW', 'You have already reviewed this item in this community', 409)
    }

    // Sanitize text content
    const sanitizedData = {
      ...reviewData,
      title: reviewData.title ? sanitizeText(reviewData.title) : null,
      content: reviewData.content ? sanitizeText(reviewData.content) : null,
      user_id: userId,
      is_public: reviewData.is_public ?? true,
      likes_count: 0
    }

    // Moderate the review content
    const { moderateReview } = await import('./moderation.ts')
    const moderationResult = await moderateReview(supabase, sanitizedData, userId)

    // Apply moderation result
    if (moderationResult.suggested_action === 'reject') {
      sanitizedData.moderation_status = 'rejected'
      sanitizedData.moderation_reason = moderationResult.reasons.join('; ')
      sanitizedData.is_public = false
    } else if (moderationResult.suggested_action === 'flag') {
      sanitizedData.moderation_status = 'flagged'
      sanitizedData.moderation_reason = moderationResult.reasons.join('; ')
    }

    // Create the review
    const { data: review, error } = await supabase
      .from('reviews')
      .insert(sanitizedData)
      .select(`
        *,
        user_profiles!reviews_user_id_fkey(id, username, display_name, avatar_url),
        reviewable_items!reviews_item_id_fkey(*),
        communities!reviews_community_id_fkey(id, name, image_url)
      `)
      .single()

    if (error) {
      return createErrorResponse('DATABASE_ERROR', error.message, 500)
    }

    // Auto-moderate if needed (this will update the review status)
    if (moderationResult.suggested_action !== 'approve') {
      const { autoModerateReview } = await import('./moderation.ts')
      await autoModerateReview(supabase, review.id, moderationResult)
    }

    // Note: Rating aggregation is now handled by database triggers
    // but we can still call this for immediate consistency if needed
    await updateItemRating(supabase, reviewData.item_id)

    return createSuccessResponse(review, 201)

  } catch (error) {
    console.error('Create review error:', error)
    
    if (error instanceof ValidationException) {
      return createErrorResponse('VALIDATION_ERROR', 'Validation failed', 400, error.errors)
    }
    
    return createErrorResponse('INTERNAL_ERROR', 'Failed to create review', 500)
  }
}

async function handleUpdateReview(req: Request, supabase: any, reviewId: string): Promise<Response> {
  // Authenticate user
  const authResult = await authenticateUser(req, supabase)
  if (!authResult.success) {
    return createErrorResponse('AUTH_REQUIRED', authResult.error || 'Authentication required', 401)
  }

  const userId = authResult.user!.id

  try {
    const body = await req.json()
    const updateData: UpdateReviewRequest = body

    // Validate rating if provided
    if (updateData.rating !== undefined) {
      const ratingError = validateRating(updateData.rating)
      if (ratingError) {
        return createErrorResponse('VALIDATION_ERROR', ratingError.message, 400)
      }
    }

    // Check if review exists and user owns it
    const { data: existingReview, error: fetchError } = await supabase
      .from('reviews')
      .select('user_id, item_id')
      .eq('id', reviewId)
      .single()

    if (fetchError || !existingReview) {
      return createErrorResponse('NOT_FOUND', 'Review not found', 404)
    }

    if (existingReview.user_id !== userId) {
      return createErrorResponse('FORBIDDEN', 'You can only update your own reviews', 403)
    }

    // Sanitize text content
    const sanitizedData: any = {
      updated_at: new Date().toISOString()
    }

    if (updateData.rating !== undefined) {
      sanitizedData.rating = updateData.rating
    }
    if (updateData.title !== undefined) {
      sanitizedData.title = updateData.title ? sanitizeText(updateData.title) : null
    }
    if (updateData.content !== undefined) {
      sanitizedData.content = updateData.content ? sanitizeText(updateData.content) : null
    }
    if (updateData.images !== undefined) {
      sanitizedData.images = updateData.images
    }
    if (updateData.is_public !== undefined) {
      sanitizedData.is_public = updateData.is_public
    }

    // Update the review
    const { data: review, error } = await supabase
      .from('reviews')
      .update(sanitizedData)
      .eq('id', reviewId)
      .select(`
        *,
        user_profiles!reviews_user_id_fkey(id, username, display_name, avatar_url),
        reviewable_items!reviews_item_id_fkey(*),
        communities!reviews_community_id_fkey(id, name, image_url)
      `)
      .single()

    if (error) {
      return createErrorResponse('DATABASE_ERROR', error.message, 500)
    }

    // Update aggregated rating if rating was changed
    if (updateData.rating !== undefined) {
      await updateItemRating(supabase, existingReview.item_id)
    }

    return createSuccessResponse(review)

  } catch (error) {
    console.error('Update review error:', error)
    return createErrorResponse('INTERNAL_ERROR', 'Failed to update review', 500)
  }
}

async function handleDeleteReview(req: Request, supabase: any, reviewId: string): Promise<Response> {
  // Authenticate user
  const authResult = await authenticateUser(req, supabase)
  if (!authResult.success) {
    return createErrorResponse('AUTH_REQUIRED', authResult.error || 'Authentication required', 401)
  }

  const userId = authResult.user!.id

  try {
    // Check if review exists and user owns it
    const { data: existingReview, error: fetchError } = await supabase
      .from('reviews')
      .select('user_id, item_id')
      .eq('id', reviewId)
      .single()

    if (fetchError || !existingReview) {
      return createErrorResponse('NOT_FOUND', 'Review not found', 404)
    }

    if (existingReview.user_id !== userId) {
      return createErrorResponse('FORBIDDEN', 'You can only delete your own reviews', 403)
    }

    // Delete the review
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (error) {
      return createErrorResponse('DATABASE_ERROR', error.message, 500)
    }

    // Update aggregated rating for the item
    await updateItemRating(supabase, existingReview.item_id)

    return createSuccessResponse({ message: 'Review deleted successfully' })

  } catch (error) {
    console.error('Delete review error:', error)
    return createErrorResponse('INTERNAL_ERROR', 'Failed to delete review', 500)
  }
}

async function handleToggleLike(req: Request, supabase: any, reviewId: string): Promise<Response> {
  // Authenticate user
  const authResult = await authenticateUser(req, supabase)
  if (!authResult.success) {
    return createErrorResponse('AUTH_REQUIRED', authResult.error || 'Authentication required', 401)
  }

  const userId = authResult.user!.id

  try {
    // Check if review exists
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id, likes_count')
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return createErrorResponse('NOT_FOUND', 'Review not found', 404)
    }

    // Check if user already liked this review
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('review_id', reviewId)
      .eq('like_type', 'REVIEW')
      .single()

    let isLiked = false
    let newLikesCount = review.likes_count

    if (existingLike) {
      // Unlike - remove the like
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) {
        return createErrorResponse('DATABASE_ERROR', deleteError.message, 500)
      }

      newLikesCount = Math.max(0, newLikesCount - 1)
      isLiked = false
    } else {
      // Like - add the like
      const { error: insertError } = await supabase
        .from('likes')
        .insert({
          user_id: userId,
          review_id: reviewId,
          like_type: 'REVIEW'
        })

      if (insertError) {
        return createErrorResponse('DATABASE_ERROR', insertError.message, 500)
      }

      newLikesCount = newLikesCount + 1
      isLiked = true
    }

    // Update likes count on review
    const { error: updateError } = await supabase
      .from('reviews')
      .update({ likes_count: newLikesCount })
      .eq('id', reviewId)

    if (updateError) {
      return createErrorResponse('DATABASE_ERROR', updateError.message, 500)
    }

    return createSuccessResponse({
      is_liked: isLiked,
      likes_count: newLikesCount
    })

  } catch (error) {
    console.error('Toggle like error:', error)
    return createErrorResponse('INTERNAL_ERROR', 'Failed to toggle like', 500)
  }
}