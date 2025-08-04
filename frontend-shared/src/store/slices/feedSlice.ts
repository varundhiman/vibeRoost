import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FeedItem, Post, Comment } from '../../types';

export interface FeedState {
  feedItems: FeedItem[];
  posts: Post[];
  selectedPost: Post | null;
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
}

const initialState: FeedState = {
  feedItems: [],
  posts: [],
  selectedPost: null,
  isLoading: false,
  hasMore: true,
  error: null,
};

export const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    setFeedItems: (state, action: PayloadAction<FeedItem[]>) => {
      state.feedItems = action.payload;
      state.error = null;
    },
    appendFeedItems: (state, action: PayloadAction<FeedItem[]>) => {
      state.feedItems.push(...action.payload);
      state.hasMore = action.payload.length > 0;
    },
    prependFeedItems: (state, action: PayloadAction<FeedItem[]>) => {
      state.feedItems.unshift(...action.payload);
    },
    updateFeedItem: (state, action: PayloadAction<FeedItem>) => {
      const index = state.feedItems.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.feedItems[index] = action.payload;
      }
    },
    removeFeedItem: (state, action: PayloadAction<string>) => {
      state.feedItems = state.feedItems.filter(item => item.id !== action.payload);
    },
    setPosts: (state, action: PayloadAction<Post[]>) => {
      state.posts = action.payload;
    },
    addPost: (state, action: PayloadAction<Post>) => {
      state.posts.unshift(action.payload);
    },
    updatePost: (state, action: PayloadAction<Post>) => {
      const index = state.posts.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.posts[index] = action.payload;
      }
      if (state.selectedPost?.id === action.payload.id) {
        state.selectedPost = action.payload;
      }
    },
    removePost: (state, action: PayloadAction<string>) => {
      state.posts = state.posts.filter(p => p.id !== action.payload);
      if (state.selectedPost?.id === action.payload) {
        state.selectedPost = null;
      }
    },
    likePost: (state, action: PayloadAction<string>) => {
      const post = state.posts.find(p => p.id === action.payload);
      if (post) {
        post.likes_count += 1;
      }
      if (state.selectedPost?.id === action.payload) {
        state.selectedPost.likes_count += 1;
      }
    },
    unlikePost: (state, action: PayloadAction<string>) => {
      const post = state.posts.find(p => p.id === action.payload);
      if (post && post.likes_count > 0) {
        post.likes_count -= 1;
      }
      if (state.selectedPost?.id === action.payload && state.selectedPost.likes_count > 0) {
        state.selectedPost.likes_count -= 1;
      }
    },
    addComment: (state, action: PayloadAction<{ postId: string; comment: Comment }>) => {
      const post = state.posts.find(p => p.id === action.payload.postId);
      if (post) {
        post.comments_count += 1;
      }
      if (state.selectedPost?.id === action.payload.postId) {
        state.selectedPost.comments_count += 1;
      }
    },
    setSelectedPost: (state, action: PayloadAction<Post | null>) => {
      state.selectedPost = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setHasMore: (state, action: PayloadAction<boolean>) => {
      state.hasMore = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearFeed: (state) => {
      state.feedItems = [];
      state.posts = [];
      state.selectedPost = null;
      state.hasMore = true;
      state.error = null;
      state.isLoading = false;
    },
  },
});

export const {
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
  setLoading,
  setHasMore,
  setError,
  clearFeed,
} = feedSlice.actions;

// Selectors
export const selectFeedItems = (state: { feed: FeedState }) => state.feed.feedItems;
export const selectPosts = (state: { feed: FeedState }) => state.feed.posts;
export const selectSelectedPost = (state: { feed: FeedState }) => state.feed.selectedPost;
export const selectFeedLoading = (state: { feed: FeedState }) => state.feed.isLoading;
export const selectFeedHasMore = (state: { feed: FeedState }) => state.feed.hasMore;
export const selectFeedError = (state: { feed: FeedState }) => state.feed.error;