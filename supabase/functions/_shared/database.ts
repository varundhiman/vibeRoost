// Database connection and query utilities
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { QueryResult, QueryListResult, PaginationParams, DatabaseError } from './types.ts'

/**
 * Execute a single row query with error handling
 */
export async function querySingle<T>(
  supabase: SupabaseClient,
  query: any
): Promise<QueryResult<T>> {
  try {
    const { data, error } = await query.single()
    
    if (error) {
      return {
        data: null,
        error: {
          code: error.code || 'DATABASE_ERROR',
          message: error.message,
          details: error.details
        }
      }
    }
    
    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'DATABASE_ERROR',
        message: (err as Error).message || 'Database operation failed',
        details: err
      }
    }
  }
}

/**
 * Execute a list query with error handling
 */
export async function queryList<T>(
  supabase: SupabaseClient,
  query: any
): Promise<QueryListResult<T>> {
  try {
    const { data, error, count } = await query
    
    if (error) {
      return {
        data: [],
        error: {
          code: error.code || 'DATABASE_ERROR',
          message: error.message,
          details: error.details
        }
      }
    }
    
    return { data: data || [], error: null, count }
  } catch (err) {
    return {
      data: [],
      error: {
        code: 'DATABASE_ERROR',
        message: (err as Error).message || 'Database operation failed',
        details: err
      }
    }
  }
}

/**
 * Apply pagination to a query
 */
export function applyPagination(
  query: any,
  params: PaginationParams
): any {
  const { page = 1, limit = 20 } = params
  const from = (page - 1) * limit
  const to = from + limit - 1
  
  return query.range(from, to)
}

/**
 * Apply cursor-based pagination
 */
export function applyCursorPagination(
  query: any,
  cursor?: string,
  limit: number = 20
): any {
  if (cursor) {
    query = query.gt('created_at', cursor)
  }
  
  return query.limit(limit).order('created_at', { ascending: false })
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<QueryResult<any>> {
  const query = supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
  
  return await querySingle(supabase, query)
}

/**
 * Check if user exists
 */
export async function userExists(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', userId)
    .single()
  
  return !!data
}

/**
 * Check if user is blocked by another user
 */
export async function isUserBlocked(
  supabase: SupabaseClient,
  blockerId: string,
  blockedId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('user_blocks')
    .select('id')
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)
    .single()
  
  return !!data
}

/**
 * Check if user is member of community
 */
export async function isCommunityMember(
  supabase: SupabaseClient,
  userId: string,
  communityId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('community_memberships')
    .select('id')
    .eq('user_id', userId)
    .eq('community_id', communityId)
    .eq('status', 'APPROVED')
    .single()
  
  return !!data
}

/**
 * Get user's role in community
 */
export async function getCommunityRole(
  supabase: SupabaseClient,
  userId: string,
  communityId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('community_memberships')
    .select('role')
    .eq('user_id', userId)
    .eq('community_id', communityId)
    .eq('status', 'APPROVED')
    .single()
  
  return data?.role || null
}

/**
 * Check if user can moderate community
 */
export async function canModerateCommunity(
  supabase: SupabaseClient,
  userId: string,
  communityId: string
): Promise<boolean> {
  const role = await getCommunityRole(supabase, userId, communityId)
  return role === 'OWNER' || role === 'MODERATOR'
}

/**
 * Update aggregated rating for reviewable item
 * Note: This is now handled automatically by database triggers,
 * but keeping this function for manual updates if needed
 */
export async function updateItemRating(
  supabase: SupabaseClient,
  itemId: string
): Promise<void> {
  try {
    // The rating update is now handled by database triggers
    // This function is kept for compatibility and manual updates
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('item_id', itemId)
    
    if (!reviews || reviews.length === 0) {
      // Set to 0 if no reviews
      await supabase
        .from('reviewable_items')
        .update({
          aggregated_rating: 0,
          review_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
      return
    }
    
    const totalRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0)
    const avgRating = totalRating / reviews.length
    
    // Update the item
    await supabase
      .from('reviewable_items')
      .update({
        aggregated_rating: Math.round(avgRating * 100) / 100, // Round to 2 decimal places
        review_count: reviews.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
  } catch (error) {
    console.error('Error updating item rating:', error)
  }
}

/**
 * Increment counter field
 */
export async function incrementCounter(
  supabase: SupabaseClient,
  table: string,
  field: string,
  id: string,
  increment: number = 1
): Promise<void> {
  await supabase.rpc('increment_counter', {
    table_name: table,
    field_name: field,
    record_id: id,
    increment_by: increment
  })
}

/**
 * Decrement counter field
 */
export async function decrementCounter(
  supabase: SupabaseClient,
  table: string,
  field: string,
  id: string,
  decrement: number = 1
): Promise<void> {
  await incrementCounter(supabase, table, field, id, -decrement)
}

/**
 * Batch insert with error handling
 */
export async function batchInsert<T>(
  supabase: SupabaseClient,
  table: string,
  records: T[]
): Promise<QueryListResult<T>> {
  try {
    const { data, error } = await supabase
      .from(table)
      .insert(records)
      .select()
    
    if (error) {
      return {
        data: [],
        error: {
          code: error.code || 'DATABASE_ERROR',
          message: error.message,
          details: error.details
        }
      }
    }
    
    return { data: data || [], error: null }
  } catch (err) {
    return {
      data: [],
      error: {
        code: 'DATABASE_ERROR',
        message: (err as Error).message || 'Batch insert failed',
        details: err
      }
    }
  }
}

/**
 * Execute transaction with retry logic
 */
export async function executeTransaction<T>(
  supabase: SupabaseClient,
  operations: ((client: SupabaseClient) => Promise<T>),
  maxRetries: number = 3
): Promise<QueryResult<T>> {
  let lastError: DatabaseError | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operations(supabase)
      return { data: result, error: null }
    } catch (err) {
      lastError = {
        code: 'TRANSACTION_ERROR',
        message: (err as Error).message || 'Transaction failed',
        details: { attempt, maxRetries, error: err }
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100))
      }
    }
  }
  
  return { data: null, error: lastError }
}

/**
 * Sanitize text input to prevent XSS
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Generate UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID()
}

/**
 * Create database error from Supabase error
 */
export function createDatabaseError(error: any): DatabaseError {
  return {
    code: error.code || 'DATABASE_ERROR',
    message: error.message || 'Database operation failed',
    details: error.details || error
  }
}