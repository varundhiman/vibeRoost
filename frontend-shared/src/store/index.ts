import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { authSlice } from './slices/authSlice';
import { userSlice } from './slices/userSlice';
import { communitySlice } from './slices/communitySlice';
import { reviewSlice } from './slices/reviewSlice';
import { feedSlice } from './slices/feedSlice';
import { apiSlice } from './api/apiSlice';

export const createStore = (preloadedState?: any) => {
  const store = configureStore({
    reducer: {
      auth: authSlice.reducer,
      user: userSlice.reducer,
      community: communitySlice.reducer,
      review: reviewSlice.reducer,
      feed: feedSlice.reducer,
      api: apiSlice.reducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        },
      }).concat(apiSlice.middleware),
  });

  // Enable listener behavior for the store
  setupListeners(store.dispatch);

  return store;
};

export type RootState = ReturnType<ReturnType<typeof createStore>['getState']>;
export type AppDispatch = ReturnType<typeof createStore>['dispatch'];

// Export store instance for testing
export const store = createStore();