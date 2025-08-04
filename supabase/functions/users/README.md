# User Management Edge Functions

This directory contains Supabase Edge Functions for user management operations including profile management and user blocking functionality.

## Functions

### 1. User Profile Management (`index.ts`)

Handles user profile CRUD operations.

#### Endpoints

- `GET /functions/v1/users/{userId}` - Get user profile by ID
- `PUT /functions/v1/users/{userId}` - Update user profile (own profile only)

#### Authentication

All endpoints require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <jwt-token>
```

#### Examples

**Get User Profile:**
```bash
curl -X GET \
  'https://your-project.supabase.co/functions/v1/users/123e4567-e89b-12d3-a456-426614174000' \
  -H 'Authorization: Bearer <jwt-token>'
```

**Update User Profile:**
```bash
curl -X PUT \
  'https://your-project.supabase.co/functions/v1/users/123e4567-e89b-12d3-a456-426614174000' \
  -H 'Authorization: Bearer <jwt-token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "display_name": "New Display Name",
    "bio": "Updated bio",
    "profile_visibility": "PUBLIC"
  }'
```

### 2. User Blocking (`block.ts`)

Handles user blocking and unblocking functionality.

#### Endpoints

- `POST /functions/v1/users/{userId}/block` - Block a user
- `DELETE /functions/v1/users/{userId}/block` - Unblock a user
- `GET /functions/v1/users/blocked` - Get list of blocked users

#### Examples

**Block User:**
```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/users/456e7890-e89b-12d3-a456-426614174001/block' \
  -H 'Authorization: Bearer <jwt-token>'
```

**Unblock User:**
```bash
curl -X DELETE \
  'https://your-project.supabase.co/functions/v1/users/456e7890-e89b-12d3-a456-426614174001/block' \
  -H 'Authorization: Bearer <jwt-token>'
```

**Get Blocked Users:**
```bash
curl -X GET \
  'https://your-project.supabase.co/functions/v1/users/blocked?page=1&limit=20' \
  -H 'Authorization: Bearer <jwt-token>'
```

### 3. Profile Search (`profile.ts`)

Handles user profile search and current user profile retrieval.

#### Endpoints

- `GET /functions/v1/users/profile` - Get current user's profile
- `GET /functions/v1/users/profile/search` - Search user profiles

#### Examples

**Get Current User Profile:**
```bash
curl -X GET \
  'https://your-project.supabase.co/functions/v1/users/profile' \
  -H 'Authorization: Bearer <jwt-token>'
```

**Search Users:**
```bash
curl -X GET \
  'https://your-project.supabase.co/functions/v1/users/profile/search?q=john&page=1&limit=10' \
  -H 'Authorization: Bearer <jwt-token>'
```

## Data Models

### UserProfile
```typescript
interface UserProfile {
  id: string
  username: string
  display_name?: string
  bio?: string
  avatar_url?: string
  location?: string
  website?: string
  profile_visibility: 'PUBLIC' | 'COMMUNITIES_ONLY' | 'PRIVATE'
  allow_direct_messages: boolean
  show_in_search: boolean
  created_at: string
  updated_at: string
}
```

### UserBlock
```typescript
interface UserBlock {
  id: string
  blocker_id: string
  blocked_id: string
  created_at: string
}
```

## Error Responses

All functions return standardized error responses:

```typescript
interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
}
```

### Common Error Codes

- `AUTH_REQUIRED` - Authentication required (401)
- `FORBIDDEN` - Insufficient permissions (403)
- `USER_NOT_FOUND` - User not found (404)
- `VALIDATION_ERROR` - Input validation failed (400)
- `USERNAME_TAKEN` - Username already exists (409)
- `ALREADY_BLOCKED` - User is already blocked (409)
- `NOT_BLOCKED` - User is not blocked (404)
- `METHOD_NOT_ALLOWED` - HTTP method not supported (405)
- `INTERNAL_ERROR` - Server error (500)

## Validation Rules

### Username
- 3-50 characters
- Only letters, numbers, and underscores
- Must be unique

### Display Name
- 1-100 characters (optional)

### Bio
- 0-500 characters (optional)

### Website
- Must be a valid URL (optional)

### Profile Visibility
- Must be one of: `PUBLIC`, `COMMUNITIES_ONLY`, `PRIVATE`

## Security

- All endpoints require authentication via Supabase Auth
- Users can only update their own profiles
- Row Level Security (RLS) policies enforce data access controls
- Input validation and sanitization prevent XSS attacks
- User blocking prevents blocked users from appearing in search results

## Testing

Run the unit tests:
```bash
deno test --allow-net --allow-env supabase/functions/users/test.ts
```

Run the integration tests (requires local Supabase):
```bash
deno test --allow-net --allow-env supabase/functions/users/integration-test.ts
```

## Dependencies

- `@supabase/supabase-js` - Supabase client
- `djwt` - JWT verification
- Shared utilities from `../_shared/`

## Database Tables

The functions interact with these database tables:

- `user_profiles` - User profile information
- `user_blocks` - User blocking relationships
- `auth.users` - Supabase Auth users (read-only)

Ensure the database schema is set up according to the migration files in `supabase/migrations/`.