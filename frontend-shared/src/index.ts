// Main SDK export
export { SocialRecSDK } from './sdk';
export type { SocialRecSDKConfig } from './sdk';

// Types
export * from './types';

// Auth
export { SupabaseAuthService } from './auth/supabaseAuth';
export type { AuthConfig } from './auth/supabaseAuth';

// API Client
export { ApiClient } from './api/client';
export { defaultApiConfig, API_ENDPOINTS } from './api/config';
export type { ApiConfig } from './api/config';
export { OfflineStorageService } from './api/offlineStorage';

// Services
export { UserService } from './services/userService';
export { CommunityService } from './services/communityService';
export type { MembershipActionRequest } from './services/communityService';
export { ReviewService } from './services/reviewService';
export { FeedService } from './services/feedService';
export type { CreatePostRequest, UpdatePostRequest } from './services/feedService';
export { ExternalApiService } from './services/externalApiService';
export type { 
  MovieSearchRequest,
  RestaurantSearchRequest,
  GooglePlacesSearchRequest, 
  GooglePlacesData, 
  RottenTomatoesSearchRequest, 
  RottenTomatoesData 
} from './services/externalApiService';

// Redux Store
export { createStore, store } from './store';
export type { RootState, AppDispatch } from './store';

// Redux Slices
export { authSlice, setUser, setLoading, setError, clearAuth } from './store/slices/authSlice';
export { 
  selectAuth, 
  selectUser, 
  selectIsAuthenticated, 
  selectAuthLoading, 
  selectAuthError 
} from './store/slices/authSlice';

export { 
  userSlice, 
  setProfile, 
  updateProfile, 
  updatePrivacySettings, 
  clearProfile 
} from './store/slices/userSlice';
export { 
  selectUserProfile, 
  selectUserLoading, 
  selectUserError 
} from './store/slices/userSlice';

export { 
  communitySlice, 
  setCommunities, 
  addCommunity, 
  updateCommunity, 
  removeCommunity, 
  setMemberships, 
  addMembership, 
  updateMembership, 
  removeMembership, 
  setSelectedCommunity, 
  clearCommunities 
} from './store/slices/communitySlice';
export { 
  selectCommunities, 
  selectMemberships, 
  selectSelectedCommunity, 
  selectCommunityLoading, 
  selectCommunityError 
} from './store/slices/communitySlice';

export { 
  reviewSlice, 
  setReviews, 
  addReview, 
  updateReview, 
  removeReview, 
  setReviewableItems, 
  addReviewableItem, 
  updateReviewableItem, 
  setSelectedReview, 
  clearReviews 
} from './store/slices/reviewSlice';
export { 
  selectReviews, 
  selectReviewableItems, 
  selectSelectedReview, 
  selectReviewLoading, 
  selectReviewError 
} from './store/slices/reviewSlice';

export { 
  feedSlice, 
  setFeedItems, 
  appendFeedItems, 
  prependFeedItems, 
  updateFeedItem, 
  removeFeedItem, 
  setPosts, 
  addPost, 
  updatePost, 
  removePost, 
  likePost, 
  unlikePost, 
  addComment, 
  setSelectedPost, 
  clearFeed 
} from './store/slices/feedSlice';
export { 
  selectFeedItems, 
  selectPosts, 
  selectSelectedPost, 
  selectFeedLoading, 
  selectFeedHasMore, 
  selectFeedError 
} from './store/slices/feedSlice';

// RTK Query API
export { apiSlice } from './store/api/apiSlice';