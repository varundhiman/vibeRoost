// Common types shared across the application

// Edge Function response format
export interface EdgeFunctionResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path?: string;
}

// User types (updated to match Edge Function schema)
export interface UserProfile {
  id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  website?: string;
  profile_visibility: ProfileVisibility;
  allow_direct_messages: boolean;
  show_in_search: boolean;
  created_at: string;
  updated_at: string;
}



export type ProfileVisibility = 'PUBLIC' | 'COMMUNITIES_ONLY' | 'PRIVATE';

// Legacy enum for backward compatibility
export const ProfileVisibility = {
  PUBLIC: 'PUBLIC' as ProfileVisibility,
  COMMUNITIES_ONLY: 'COMMUNITIES_ONLY' as ProfileVisibility,
  PRIVATE: 'PRIVATE' as ProfileVisibility
} as const;

// Legacy User interface for Redux compatibility
export interface User {
  id: string;
  email?: string;
  username: string;
  displayName?: string;
  profilePicture?: string;
  createdAt: string;
  privacySettings?: PrivacySettings;
}

export interface PrivacySettings {
  profileVisibility: ProfileVisibility;
  allowDirectMessages: boolean;
  showInSearch: boolean;
}

// Legacy Post and Comment interfaces for Redux compatibility
export interface Post {
  id: string;
  user_id: string;
  content: string;
  referenced_item_id?: string;
  images?: string[];
  likes_count: number;
  comments_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

// Community types (updated to match Edge Function schema)
export interface Community {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  type: CommunityType;
  is_private: boolean;
  member_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type CommunityType = 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';
export type MemberRole = 'OWNER' | 'MODERATOR' | 'MEMBER';
export type MembershipStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'BANNED';

export interface CommunityMembership {
  id: string;
  community_id: string;
  user_id: string;
  role: MemberRole;
  status: MembershipStatus;
  joined_at: string;
  approved_by?: string;
  approved_at?: string;
}

// Review types (updated to match Edge Function schema)
export interface Review {
  id: string;
  user_id: string;
  item_id: string;
  community_id: string;
  rating: number;
  title?: string;
  content?: string;
  images?: string[];
  is_public: boolean;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

export type ItemType = 'MOVIE' | 'TV_SHOW' | 'RESTAURANT' | 'SERVICE' | 'VACATION_SPOT' | 'RECIPE' | 'ACTIVITY';

export interface ReviewableItem {
  id: string;
  external_id?: string;
  type: ItemType;
  title: string;
  description?: string;
  image_url?: string;
  metadata?: Record<string, any>;
  aggregated_rating?: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

// Feed types (updated to match Edge Function schema)

export type ContentType = 'POST' | 'REVIEW' | 'COMMUNITY_JOIN' | 'COMMUNITY_CREATE';

export interface FeedItem {
  id: string;
  user_id: string;
  content_type: ContentType;
  content_id: string;
  score: number;
  created_at: string;
}

export interface UserBlock {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

// API Response types (updated for Edge Functions)
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

export interface ApiError {
  message: string;
  code: string;
  details?: any;
}

// Request types for Edge Functions
export interface CreateCommunityRequest {
  name: string;
  description?: string;
  image_url?: string;
  type?: CommunityType;
  is_private?: boolean;
}

export interface UpdateCommunityRequest {
  name?: string;
  description?: string;
  image_url?: string;
  type?: CommunityType;
  is_private?: boolean;
}

export interface CreateReviewRequest {
  item_id: string;
  community_id: string;
  rating: number;
  title?: string;
  content?: string;
  images?: string[];
  is_public?: boolean;
}

export interface UpdateReviewRequest {
  rating?: number;
  title?: string;
  content?: string;
  images?: string[];
  is_public?: boolean;
}

export interface UpdateUserProfileRequest {
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  website?: string;
  profile_visibility?: ProfileVisibility;
  allow_direct_messages?: boolean;
  show_in_search?: boolean;
}

export interface CreateReviewableItemRequest {
  external_id?: string;
  type: ItemType;
  title: string;
  description?: string;
  image_url?: string;
  metadata?: Record<string, any>;
}

// External API types
export interface MovieData {
  id: string;
  title: string;
  overview?: string;
  release_date?: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
  genres?: string[];
  runtime?: number;
  original_language?: string;
  adult?: boolean;
  popularity?: number;
}

export interface RestaurantData {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating?: number;
  price_level?: number;
  photos?: string[];
  formatted_phone_number?: string;
  website?: string;
  types?: string[];
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  business_status?: string;
  user_ratings_total?: number;
}