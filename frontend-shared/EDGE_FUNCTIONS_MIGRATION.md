# Edge Functions Migration Summary

This document summarizes the changes made to the frontend-shared library to support Supabase Edge Functions.

## Changes Made

### 1. API Configuration (`src/api/config.ts`)
- Updated `baseURL` to point to Supabase Edge Functions endpoint (`/functions/v1`)
- Updated all API endpoints to match Edge Function structure:
  - `/users` for user management
  - `/communities` for community management  
  - `/reviews` for review system
  - `/feed` for feed generation
  - `/external` for external API integration
- Increased timeout to 15 seconds for Edge Functions

### 2. API Client (`src/api/client.ts`)
- Added Supabase-specific headers (`apikey`) for Edge Function authentication
- Implemented Edge Function response transformation to handle the standardized response format
- Updated error handling to support Edge Function error codes:
  - `AUTH_REQUIRED`, `AUTH_INVALID` → 401
  - `FORBIDDEN` → 403
  - `NOT_FOUND` → 404
  - `VALIDATION_ERROR`, `INVALID_INPUT` → 400
  - `RATE_LIMIT_EXCEEDED` → 429
  - `EXTERNAL_API_ERROR` → 502
- Enhanced response interceptor to handle Edge Function response format

### 3. Type Definitions (`src/types/index.ts`)
- Added `EdgeFunctionResponse<T>` interface for Edge Function response format
- Updated all data models to match Edge Function schemas:
  - `UserProfile` with snake_case fields
  - `Community` with updated structure
  - `Review` with new fields and relationships
  - `Post`, `Comment`, `FeedItem` with Edge Function format
- Added request/response types for Edge Functions:
  - `CreateCommunityRequest`, `UpdateCommunityRequest`
  - `CreateReviewRequest`, `UpdateReviewRequest`
  - `UpdateUserProfileRequest`
  - `MovieData`, `RestaurantData` for external APIs
- Maintained backward compatibility with legacy enum format

### 4. Service Updates

#### UserService (`src/services/userService.ts`)
- Updated to use new Edge Function endpoints
- Added support for new `UserProfile` format
- Maintained backward compatibility with legacy `User` interface
- Added methods: `getProfile()`, `updateProfile()`, `updatePrivacySettings()`
- Updated search and blocking functionality

#### CommunityService (`src/services/communityService.ts`)
- Updated to use Edge Function endpoints
- Added support for new `Community` data structure
- Updated pagination to use `page`/`limit` instead of `page`/`size`
- Added community discovery methods

#### ReviewService (`src/services/reviewService.ts`)
- Updated to use Edge Function endpoints
- Added support for new `Review` and `ReviewableItem` structures
- Added like/unlike functionality
- Updated to use new request/response formats

#### FeedService (`src/services/feedService.ts`)
- Updated to use Edge Function endpoints
- Added support for personalized and community-specific feeds
- Added feed refresh functionality
- Marked legacy post management methods with warnings

#### ExternalApiService (`src/services/externalApiService.ts`)
- Updated to use Edge Function endpoints for external API integration
- Added support for movie and restaurant search
- Updated to use new `MovieData` and `RestaurantData` types
- Maintained backward compatibility with legacy method names

## Breaking Changes

### API Endpoints
- All endpoints now use Edge Function paths (e.g., `/users` instead of `/api/users`)
- Pagination parameters changed from `page`/`size` to `page`/`limit`
- Search parameters changed from `q` to `search`

### Response Format
- All responses now follow Edge Function format with `data`/`error` structure
- Error codes updated to match Edge Function standards

### Data Models
- Field names changed from camelCase to snake_case to match database schema
- Some fields renamed or restructured (e.g., `memberCount` → `member_count`)

## Backward Compatibility

The library maintains backward compatibility through:
- Legacy method wrappers that transform between old and new formats
- Dual type definitions (e.g., both `User` and `UserProfile`)
- Legacy enum constants alongside new type definitions

## File Upload Changes

File upload functionality (profile pictures, review photos) needs to be reimplemented using Supabase Storage directly, as Edge Functions handle file uploads differently than the previous Java services.

## Testing

Tests need to be updated to reflect:
- New endpoint paths
- Updated error codes
- New response formats
- Changed pagination parameters

## Next Steps

1. Update tests to match new API expectations
2. Implement file upload using Supabase Storage
3. Test integration with actual Edge Functions
4. Update Redux store integration (separate task)
5. Update React web application (separate task)