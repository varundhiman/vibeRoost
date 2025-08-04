export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

// Use hardcoded production Supabase URL for consistency
const SUPABASE_URL = 'https://ovjsvutuyfuiomgwbfzt.supabase.co';

export const defaultApiConfig: ApiConfig = {
  baseURL: `${SUPABASE_URL}/functions/v1`,
  timeout: 15000, // Increased timeout for Edge Functions
  retryAttempts: 3,
  retryDelay: 1000,
};

export const API_ENDPOINTS = {
  // User Management Edge Functions
  USERS: '/users',
  USER_PROFILE: '/users/{id}',
  USER_BLOCK: '/users/{id}/block',
  
  // Community Management Edge Functions
  COMMUNITIES: '/communities',
  COMMUNITY_DETAIL: '/communities/{id}',
  COMMUNITY_MEMBERS: '/communities/{id}/members',
  COMMUNITY_JOIN: '/communities/{id}/join',
  COMMUNITY_LEAVE: '/communities/{id}/leave',
  
  // Review System Edge Functions
  REVIEWS: '/reviews',
  REVIEW_DETAIL: '/reviews/{id}',
  REVIEW_LIKE: '/reviews/{id}/like',
  REVIEWABLE_ITEMS: '/reviews/items',
  
  // Feed Generation Edge Functions
  FEED: '/feed',
  FEED_COMMUNITY: '/feed/community/{id}',
  FEED_USER: '/feed/user/{id}',
  FEED_REFRESH: '/feed/refresh',
  
  // External API Integration Edge Functions
  EXTERNAL_MOVIES_SEARCH: '/external-apis/movies/search',
  EXTERNAL_MOVIES_DETAIL: '/external-apis/movies/{id}',
  EXTERNAL_RESTAURANTS_SEARCH: '/external-apis/restaurants/search',
  EXTERNAL_RESTAURANTS_DETAIL: '/external-apis/restaurants/{id}',
} as const;