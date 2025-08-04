// Shared TypeScript types for Supabase Edge Functions

// Enums
export type ProfileVisibility = 'PUBLIC' | 'COMMUNITIES_ONLY' | 'PRIVATE'
export type CommunityType = 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY'
export type MemberRole = 'OWNER' | 'MODERATOR' | 'MEMBER'
export type MembershipStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'BANNED'
export type ItemType = 'MOVIE' | 'TV_SHOW' | 'RESTAURANT' | 'SERVICE' | 'VACATION_SPOT' | 'RECIPE' | 'ACTIVITY'
export type LikeType = 'POST' | 'COMMENT' | 'REVIEW'
export type NotificationType = 'POST_LIKE' | 'COMMENT_LIKE' | 'REVIEW_LIKE' | 'POST_COMMENT' | 'MENTION' | 'COMMUNITY_POST' | 'COMMUNITY_JOIN' | 'MODERATION_ACTION'
export type ContentType = 'POST' | 'REVIEW' | 'COMMUNITY_JOIN' | 'COMMUNITY_CREATE'

// User types
export interface UserProfile {
  id: string
  username: string
  display_name?: string
  bio?: string
  avatar_url?: string
  location?: string
  website?: string
  profile_visibility: ProfileVisibility
  allow_direct_messages: boolean
  show_in_search: boolean
  created_at: string
  updated_at: string
}

// Community types
export interface Community {
  id: string
  name: string
  description?: string
  image_url?: string
  type: CommunityType
  is_private: boolean
  member_count: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface CommunityMembership {
  id: string
  community_id: string
  user_id: string
  role: MemberRole
  status: MembershipStatus
  joined_at: string
  approved_by?: string
  approved_at?: string
}

// Review types
export interface ReviewableItem {
  id: string
  external_id?: string
  type: ItemType
  title: string
  description?: string
  image_url?: string
  metadata?: Record<string, any>
  aggregated_rating?: number
  review_count: number
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  user_id: string
  item_id: string
  community_id: string
  rating: number
  title?: string
  content?: string
  images?: string[]
  is_public: boolean
  likes_count: number
  created_at: string
  updated_at: string
}

// Post types
export interface Post {
  id: string
  user_id: string
  content: string
  referenced_item_id?: string
  images?: string[]
  likes_count: number
  comments_count: number
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface PostCommunity {
  post_id: string
  community_id: string
}

export interface Comment {
  id: string
  user_id: string
  post_id: string
  content: string
  likes_count: number
  created_at: string
  updated_at: string
}

export interface Like {
  id: string
  user_id: string
  post_id?: string
  comment_id?: string
  review_id?: string
  like_type: LikeType
  created_at: string
}

export interface UserBlock {
  id: string
  blocker_id: string
  blocked_id: string
  created_at: string
}

export interface Notification {
  id: string
  recipient_id: string
  actor_id: string
  notification_type: NotificationType
  post_id?: string
  comment_id?: string
  review_id?: string
  community_id?: string
  message: string
  is_read: boolean
  created_at: string
}

// Feed types
export interface FeedItem {
  id: string
  user_id: string
  content_type: ContentType
  content_id: string
  score: number
  created_at: string
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
  path?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    has_more: boolean
  }
}

// Request types
export interface CreateCommunityRequest {
  name: string
  description?: string
  image_url?: string
  type?: CommunityType
  is_private?: boolean
}

export interface UpdateCommunityRequest {
  name?: string
  description?: string
  image_url?: string
  type?: CommunityType
  is_private?: boolean
}

export interface JoinCommunityRequest {
  community_id: string
}

export interface CreateReviewRequest {
  item_id: string
  community_id: string
  rating: number
  title?: string
  content?: string
  images?: string[]
  is_public?: boolean
}

export interface UpdateReviewRequest {
  rating?: number
  title?: string
  content?: string
  images?: string[]
  is_public?: boolean
}

export interface CreatePostRequest {
  content: string
  referenced_item_id?: string
  images?: string[]
  community_ids?: string[]
  is_public?: boolean
}

export interface UpdatePostRequest {
  content?: string
  images?: string[]
  is_public?: boolean
}

export interface CreateCommentRequest {
  post_id: string
  content: string
}

export interface UpdateCommentRequest {
  content: string
}

export interface UpdateUserProfileRequest {
  username?: string
  display_name?: string
  bio?: string
  avatar_url?: string
  location?: string
  website?: string
  profile_visibility?: ProfileVisibility
  allow_direct_messages?: boolean
  show_in_search?: boolean
}

export interface CreateReviewableItemRequest {
  external_id?: string
  type: ItemType
  title: string
  description?: string
  image_url?: string
  metadata?: Record<string, any>
}

// Query parameters
export interface PaginationParams {
  page?: number
  limit?: number
  cursor?: string
}

export interface FeedParams extends PaginationParams {
  community_id?: string
  user_id?: string
  content_types?: ContentType[]
}

export interface SearchParams extends PaginationParams {
  query: string
  type?: ItemType | 'community' | 'user'
  filters?: Record<string, any>
}

// External API types
export interface MovieData {
  id: string
  title: string
  overview?: string
  release_date?: string
  poster_path?: string
  backdrop_path?: string
  vote_average?: number
  vote_count?: number
  genre_ids?: number[]
  genres?: string[]
  runtime?: number
  original_language?: string
  adult?: boolean
  popularity?: number
}

export interface MovieSearchResult {
  results: MovieData[]
  total_results: number
  total_pages: number
  page: number
}

export interface RestaurantData {
  place_id: string
  name: string
  formatted_address?: string
  rating?: number
  price_level?: number
  photos?: string[]
  formatted_phone_number?: string
  website?: string
  types?: string[]
  opening_hours?: {
    open_now?: boolean
    weekday_text?: string[]
  }
  geometry?: {
    location: {
      lat: number
      lng: number
    }
  }
  business_status?: string
  user_ratings_total?: number
}

export interface RestaurantSearchResult {
  results: RestaurantData[]
  status: string
  next_page_token?: string
}

// Database utility types
export interface DatabaseError {
  code: string
  message: string
  details?: any
}

export interface QueryResult<T> {
  data: T | null
  error: DatabaseError | null
}

export interface QueryListResult<T> {
  data: T[]
  error: DatabaseError | null
  count?: number
}