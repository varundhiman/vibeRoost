import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Review, ReviewableItem } from '../../types';

export interface ReviewState {
  reviews: Review[];
  reviewableItems: ReviewableItem[];
  selectedReview: Review | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ReviewState = {
  reviews: [],
  reviewableItems: [],
  selectedReview: null,
  isLoading: false,
  error: null,
};

export const reviewSlice = createSlice({
  name: 'review',
  initialState,
  reducers: {
    setReviews: (state, action: PayloadAction<Review[]>) => {
      state.reviews = action.payload;
      state.error = null;
    },
    addReview: (state, action: PayloadAction<Review>) => {
      state.reviews.unshift(action.payload);
    },
    updateReview: (state, action: PayloadAction<Review>) => {
      const index = state.reviews.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.reviews[index] = action.payload;
      }
      if (state.selectedReview?.id === action.payload.id) {
        state.selectedReview = action.payload;
      }
    },
    removeReview: (state, action: PayloadAction<string>) => {
      state.reviews = state.reviews.filter(r => r.id !== action.payload);
      if (state.selectedReview?.id === action.payload) {
        state.selectedReview = null;
      }
    },
    setReviewableItems: (state, action: PayloadAction<ReviewableItem[]>) => {
      state.reviewableItems = action.payload;
    },
    addReviewableItem: (state, action: PayloadAction<ReviewableItem>) => {
      const existingIndex = state.reviewableItems.findIndex(item => item.id === action.payload.id);
      if (existingIndex === -1) {
        state.reviewableItems.push(action.payload);
      } else {
        state.reviewableItems[existingIndex] = action.payload;
      }
    },
    updateReviewableItem: (state, action: PayloadAction<ReviewableItem>) => {
      const index = state.reviewableItems.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.reviewableItems[index] = action.payload;
      }
    },
    setSelectedReview: (state, action: PayloadAction<Review | null>) => {
      state.selectedReview = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearReviews: (state) => {
      state.reviews = [];
      state.reviewableItems = [];
      state.selectedReview = null;
      state.error = null;
      state.isLoading = false;
    },
  },
});

export const {
  setReviews,
  addReview,
  updateReview,
  removeReview,
  setReviewableItems,
  addReviewableItem,
  updateReviewableItem,
  setSelectedReview,
  setLoading,
  setError,
  clearReviews,
} = reviewSlice.actions;

// Selectors
export const selectReviews = (state: { review: ReviewState }) => state.review.reviews;
export const selectReviewableItems = (state: { review: ReviewState }) => state.review.reviewableItems;
export const selectSelectedReview = (state: { review: ReviewState }) => state.review.selectedReview;
export const selectReviewLoading = (state: { review: ReviewState }) => state.review.isLoading;
export const selectReviewError = (state: { review: ReviewState }) => state.review.error;