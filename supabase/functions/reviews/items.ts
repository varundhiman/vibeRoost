// Reviewable items management
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/utils.ts'
import { authenticateUser } from '../_shared/auth.ts'
import { createErrorResponse, createSuccessResponse } from '../_shared/errors.ts'
import { 
  ReviewableItem, 
  CreateReviewableItemRequest,
  ItemType,
  PaginationParams 
} from '../_shared/types.ts'
import { 
  validateRequired,
  validateLength,
  validateEnum,
  validateURL,
  ValidationException,
  sanitizeText
} from '../_shared/validation.ts'
import { 
  querySingle, 
  queryList, 
  applyPagination
} from '../_shared/database.ts'

/**
 * Validate reviewable item creation request
 */
function validateItemCreate(data: CreateReviewableItemRequest): string[] {
  const errors: string[] = []
  
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required')
  } else if (data.title.length > 255) {
    errors.push('Title must be no more than 255 characters')
  }
  
  if (!data.type) {
    errors.push('Item type is required')
  } else {
    const validTypes: ItemType[] = ['MOVIE', 'TV_SHOW', 'RESTAURANT', 'SERVICE', 'VACATION_SPOT', 'RECIPE', 'ACTIVITY']
    if (!validTypes.includes(data.type)) {
      errors.push(`Item type must be one of: ${validTypes.join(', ')}`)
    }
  }
  
  if (data.description && data.description.length > 2000) {
    errors.push('Description must be no more than 2000 characters')
  }
  
  if (data.image_url && !isValidURL(data.image_url)) {
    errors.push('Image URL must be a valid URL')
  }
  
  if (data.external_id && data.external_id.length > 255) {
    errors.push('External ID must be no more than 255 characters')
  }
  
  return errors
}

/**
 * Simple URL validation
 */
function isValidURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Create or get existing reviewable item
 */
export async function createOrGetReviewableItem(
  supabase: any,
  itemData: CreateReviewableItemRequest
): Promise<{ data: ReviewableItem | null; error: string | null }> {
  try {
    // Validate input
    const validationErrors = validateItemCreate(itemData)
    if (validationErrors.length > 0) {
      return { data: null, error: validationErrors.join(', ') }
    }

    // Check if item already exists by external_id and type
    if (itemData.external_id) {
      const { data: existingItem } = await supabase
        .from('reviewable_items')
        .select('*')
        .eq('external_id', itemData.external_id)
        .eq('type', itemData.type)
        .single()

      if (existingItem) {
        return { data: existingItem, error: null }
      }
    }

    // Sanitize and prepare data
    const sanitizedData = {
      external_id: itemData.external_id || null,
      type: itemData.type,
      title: sanitizeText(itemData.title),
      description: itemData.description ? sanitizeText(itemData.description) : null,
      image_url: itemData.image_url || null,
      metadata: itemData.metadata || {},
      aggregated_rating: 0,
      review_count: 0
    }

    // Create new item
    const { data: newItem, error } = await supabase
      .from('reviewable_items')
      .insert(sanitizedData)
      .select('*')
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: newItem, error: null }

  } catch (error) {
    console.error('Error creating reviewable item:', error)
    return { data: null, error: 'Failed to create reviewable item' }
  }
}

/**
 * Search reviewable items
 */
export async function searchReviewableItems(
  supabase: any,
  query: string,
  itemType?: ItemType,
  page: number = 1,
  limit: number = 20
): Promise<{ data: ReviewableItem[]; error: string | null; total?: number }> {
  try {
    let dbQuery = supabase
      .from('reviewable_items')
      .select('*', { count: 'exact' })

    // Add text search
    if (query && query.trim().length > 0) {
      dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    }

    // Filter by type
    if (itemType) {
      dbQuery = dbQuery.eq('type', itemType)
    }

    // Apply pagination and ordering
    dbQuery = dbQuery
      .order('review_count', { ascending: false })
      .order('aggregated_rating', { ascending: false })

    dbQuery = applyPagination(dbQuery, { page, limit })

    const result = await queryList<ReviewableItem>(supabase, dbQuery)
    
    if (result.error) {
      return { data: [], error: result.error.message }
    }

    return { 
      data: result.data, 
      error: null, 
      total: result.count 
    }

  } catch (error) {
    console.error('Error searching reviewable items:', error)
    return { data: [], error: 'Failed to search items' }
  }
}

/**
 * Get reviewable item by ID
 */
export async function getReviewableItem(
  supabase: any,
  itemId: string
): Promise<{ data: ReviewableItem | null; error: string | null }> {
  try {
    const query = supabase
      .from('reviewable_items')
      .select(`
        *,
        reviews(
          id,
          rating,
          title,
          content,
          created_at,
          user_profiles!reviews_user_id_fkey(username, display_name, avatar_url)
        )
      `)
      .eq('id', itemId)

    const result = await querySingle<ReviewableItem>(supabase, query)
    
    if (result.error) {
      return { data: null, error: result.error.message }
    }

    if (!result.data) {
      return { data: null, error: 'Item not found' }
    }

    return { data: result.data, error: null }

  } catch (error) {
    console.error('Error getting reviewable item:', error)
    return { data: null, error: 'Failed to get item' }
  }
}

/**
 * Update reviewable item metadata
 */
export async function updateReviewableItem(
  supabase: any,
  itemId: string,
  updateData: Partial<CreateReviewableItemRequest>
): Promise<{ data: ReviewableItem | null; error: string | null }> {
  try {
    // Validate update data
    const validationErrors: string[] = []
    
    if (updateData.title !== undefined) {
      if (!updateData.title || updateData.title.trim().length === 0) {
        validationErrors.push('Title cannot be empty')
      } else if (updateData.title.length > 255) {
        validationErrors.push('Title must be no more than 255 characters')
      }
    }
    
    if (updateData.description !== undefined && updateData.description && updateData.description.length > 2000) {
      validationErrors.push('Description must be no more than 2000 characters')
    }
    
    if (updateData.image_url !== undefined && updateData.image_url && !isValidURL(updateData.image_url)) {
      validationErrors.push('Image URL must be a valid URL')
    }

    if (validationErrors.length > 0) {
      return { data: null, error: validationErrors.join(', ') }
    }

    // Prepare update data
    const sanitizedUpdate: any = {
      updated_at: new Date().toISOString()
    }

    if (updateData.title !== undefined) {
      sanitizedUpdate.title = sanitizeText(updateData.title)
    }
    if (updateData.description !== undefined) {
      sanitizedUpdate.description = updateData.description ? sanitizeText(updateData.description) : null
    }
    if (updateData.image_url !== undefined) {
      sanitizedUpdate.image_url = updateData.image_url
    }
    if (updateData.metadata !== undefined) {
      sanitizedUpdate.metadata = updateData.metadata
    }

    // Update the item
    const { data: updatedItem, error } = await supabase
      .from('reviewable_items')
      .update(sanitizedUpdate)
      .eq('id', itemId)
      .select('*')
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: updatedItem, error: null }

  } catch (error) {
    console.error('Error updating reviewable item:', error)
    return { data: null, error: 'Failed to update item' }
  }
}

/**
 * Get popular items by type
 */
export async function getPopularItems(
  supabase: any,
  itemType?: ItemType,
  limit: number = 10
): Promise<{ data: ReviewableItem[]; error: string | null }> {
  try {
    let query = supabase
      .from('reviewable_items')
      .select('*')
      .gte('review_count', 1)
      .order('aggregated_rating', { ascending: false })
      .order('review_count', { ascending: false })
      .limit(limit)

    if (itemType) {
      query = query.eq('type', itemType)
    }

    const result = await queryList<ReviewableItem>(supabase, query)
    
    if (result.error) {
      return { data: [], error: result.error.message }
    }

    return { data: result.data, error: null }

  } catch (error) {
    console.error('Error getting popular items:', error)
    return { data: [], error: 'Failed to get popular items' }
  }
}

/**
 * Get recently added items
 */
export async function getRecentItems(
  supabase: any,
  itemType?: ItemType,
  limit: number = 10
): Promise<{ data: ReviewableItem[]; error: string | null }> {
  try {
    let query = supabase
      .from('reviewable_items')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (itemType) {
      query = query.eq('type', itemType)
    }

    const result = await queryList<ReviewableItem>(supabase, query)
    
    if (result.error) {
      return { data: [], error: result.error.message }
    }

    return { data: result.data, error: null }

  } catch (error) {
    console.error('Error getting recent items:', error)
    return { data: [], error: 'Failed to get recent items' }
  }
}

/**
 * Get items by external ID (for API integrations)
 */
export async function getItemByExternalId(
  supabase: any,
  externalId: string,
  itemType: ItemType
): Promise<{ data: ReviewableItem | null; error: string | null }> {
  try {
    const query = supabase
      .from('reviewable_items')
      .select('*')
      .eq('external_id', externalId)
      .eq('type', itemType)

    const result = await querySingle<ReviewableItem>(supabase, query)
    
    if (result.error) {
      return { data: null, error: result.error.message }
    }

    return { data: result.data, error: null }

  } catch (error) {
    console.error('Error getting item by external ID:', error)
    return { data: null, error: 'Failed to get item' }
  }
}

/**
 * Bulk create reviewable items (for data imports)
 */
export async function bulkCreateReviewableItems(
  supabase: any,
  items: CreateReviewableItemRequest[]
): Promise<{ data: ReviewableItem[]; error: string | null; created: number }> {
  try {
    const validItems: any[] = []
    const errors: string[] = []

    // Validate all items first
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const itemErrors = validateItemCreate(item)
      
      if (itemErrors.length > 0) {
        errors.push(`Item ${i + 1}: ${itemErrors.join(', ')}`)
      } else {
        validItems.push({
          external_id: item.external_id || null,
          type: item.type,
          title: sanitizeText(item.title),
          description: item.description ? sanitizeText(item.description) : null,
          image_url: item.image_url || null,
          metadata: item.metadata || {},
          aggregated_rating: 0,
          review_count: 0
        })
      }
    }

    if (errors.length > 0) {
      return { data: [], error: errors.join('; '), created: 0 }
    }

    // Insert valid items
    const { data: createdItems, error } = await supabase
      .from('reviewable_items')
      .insert(validItems)
      .select('*')

    if (error) {
      return { data: [], error: error.message, created: 0 }
    }

    return { 
      data: createdItems || [], 
      error: null, 
      created: createdItems?.length || 0 
    }

  } catch (error) {
    console.error('Error bulk creating items:', error)
    return { data: [], error: 'Failed to bulk create items', created: 0 }
  }
}