# Shared Utilities for Supabase Edge Functions

This directory contains shared TypeScript utilities used across all Supabase Edge Functions in the social recommendation app.

## Files Overview

### 📋 `types.ts`
Complete TypeScript type definitions matching the database schema:
- **Enums**: ProfileVisibility, CommunityType, MemberRole, ItemType, etc.
- **Interfaces**: UserProfile, Community, Review, Post, Comment, Like, etc.
- **Request/Response types**: API request/response interfaces
- **Utility types**: Pagination, query results, error types

### 🔐 `auth.ts`
Authentication utilities for JWT validation and Supabase integration:
- `getAuthUser()` - Extract and validate JWT from request headers
- `requireAuth()` - Require authentication with error handling
- `createSupabaseServiceClient()` - Service role client for admin operations
- `createSupabaseUserClient()` - User context client for RLS
- `getAuthContext()` / `requireAuthContext()` - Combined auth + client
- Custom `AuthError` class for authentication failures

### 🗄️ `database.ts`
Database connection and query utilities:
- `querySingle()` / `queryList()` - Execute queries with error handling
- `applyPagination()` / `applyCursorPagination()` - Pagination helpers
- User/community helper functions (existence checks, role validation)
- Counter management and aggregation utilities
- Transaction support with retry logic
- Batch operations and error handling

### ✅ `validation.ts`
Comprehensive validation functions and error handling:
- Basic validators: email, URL, UUID, username, required fields
- Entity-specific validators: user profiles, communities, reviews, posts
- `ValidationException` class for structured error reporting
- Sanitization functions for security
- Type-safe validation with detailed error codes

### 🚨 `errors.ts`
Standardized error handling and response creation:
- Custom error classes: `AppError`, `NotFoundError`, `ConflictError`, etc.
- `createErrorResponse()` / `createSuccessResponse()` - HTTP response helpers
- CORS handling and middleware utilities
- Rate limiting and permission checking
- Comprehensive error logging

### 🛠️ `utils.ts`
Common utility functions:
- Pagination and request parsing utilities
- Retry logic with exponential backoff
- Data manipulation (pick, omit, deep clone)
- String utilities (slugify, truncate, capitalize)
- Date/time formatting and parsing
- File size formatting and JSON utilities

### 🧪 `test.ts`
Comprehensive test suite covering all utilities:
- Validation function tests
- Error handling tests
- Response creation tests
- Integration tests for all modules

### 📦 `index.ts`
Centralized export file for easy importing across Edge Functions.

## Usage Examples

### Basic Authentication
```typescript
import { requireAuthContext } from '../_shared/index.ts';

export default async function handler(req: Request) {
  const { user, supabase } = await requireAuthContext(req);
  // Now you have authenticated user and supabase client
}
```

### Validation
```typescript
import { validateAndThrow, validateReviewCreate } from '../_shared/index.ts';

const reviewData = await parseRequestBody<CreateReviewRequest>(req);
validateAndThrow(reviewData, validateReviewCreate);
```

### Database Operations
```typescript
import { querySingle, getUserProfile } from '../_shared/index.ts';

const { data: profile, error } = await getUserProfile(supabase, userId);
if (error) {
  throw new NotFoundError('User profile', userId);
}
```

### Error Handling
```typescript
import { withErrorHandling, createSuccessResponse } from '../_shared/index.ts';

export default withErrorHandling(async (req: Request) => {
  // Your function logic here
  return createSuccessResponse(data);
});
```

## Testing

Run the test suite with Deno:

```bash
deno test --allow-env supabase/functions/_shared/test.ts
```

## Requirements Satisfied

This implementation satisfies the following requirements from the migration spec:

- ✅ **7.2**: Shared TypeScript types for all data models
- ✅ **7.4**: Authentication utilities for JWT validation
- ✅ **7.4**: Database connection and query utilities  
- ✅ **7.4**: Common validation functions and error handling

All utilities are designed to work seamlessly with Supabase's Edge Functions runtime and follow TypeScript best practices for type safety and error handling.