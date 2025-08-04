import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../index';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080',
    prepareHeaders: (headers, { getState }) => {
      // This will be handled by the ApiClient interceptors
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['User', 'Community', 'Review', 'Post', 'Feed'],
  endpoints: () => ({}),
});

// Export hooks for usage in functional components
export const {} = apiSlice;