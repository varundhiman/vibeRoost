# Design Document

## Overview

This design outlines the migration from Java Spring Boot microservices to Supabase Edge Functions for the VibeRoost social recommendation application. The new architecture leverages Supabase's serverless infrastructure to provide a more maintainable, scalable, and cost-effective backend solution.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Web     │    │   Frontend       │    │   Mobile App    │
│   Application   │    │   Shared Library │    │   (Future)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Supabase Edge         │
                    │   Functions             │
                    │   (TypeScript)          │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Supabase Database     │
                    │   (PostgreSQL)          │
                    └─────────────────────────┘
```

### Edge Functions Structure

```
supabase/
├── functions/
│   ├── users/
│   │   ├── index.ts              # User CRUD operations
│   │   ├── block.ts              # User blocking functionality
│   │   └── profile.ts            # Profile management
│   ├── communities/
│   │   ├── index.ts              # Community CRUD
│   │   ├── membership.ts         # Join/leave communities
│   │   └── discovery.ts          # Community search/discovery
│   ├── reviews/
│   │   ├── index.ts              # Review CRUD operations
│   │   ├── ratings.ts            # Rating calculations
│   │   └── validation.ts         # Review validation
│   ├── feed/
│   │   ├── index.ts              # Feed generation
│   │   ├── personalization.ts    # Personalized content
│   │   └── realtime.ts           # Real-time updates
│   ├── external-apis/
│   │   ├── movies.ts             # Movie API integration
│   │   ├── restaurants.ts        # Restaurant API integration
│   │   └── rate-limiter.ts       # Rate limiting utilities
│   └── shared/
│       ├── auth.ts               # Authentication utilities
│       ├── validation.ts         # Common validation
│       ├── database.ts           # Database utilities
│       └── types.ts              # Shared TypeScript types
└── migrations/
    ├── 001_initial_schema.sql
    ├── 002_rls_policies.sql
    └── 003_indexes.sql
```

## Components and Interfaces

### 1. User Management Functions

**Endpoint:** `/functions/v1/users`

**Operations:**
- `GET /users/{id}` - Get user profile
- `PUT /users/{id}` - Update user profile
- `POST /users/{id}/block` - Block user
- `DELETE /users/{id}/block` - Unblock user
- `GET /users/{id}/blocked` - Get blocked users list

**Key Features:**
- Integration with Supabase Auth
- Profile validation and sanitization
- User blocking/unblocking logic
- Privacy controls

### 2. Community Management Functions

**Endpoint:** `/functions/v1/communities`

**Operations:**
- `GET /communities` - List communities with pagination
- `POST /communities` - Create new community
- `GET /communities/{id}` - Get community details
- `PUT /communities/{id}` - Update community
- `POST /communities/{id}/join` - Join community
- `DELETE /communities/{id}/leave` - Leave community
- `GET /communities/{id}/members` - Get community members

**Key Features:**
- Community discovery with search and filtering
- Membership management
- Community moderation features
- Privacy and access controls

### 3. Review System Functions

**Endpoint:** `/functions/v1/reviews`

**Operations:**
- `GET /reviews` - List reviews with filtering
- `POST /reviews` - Create new review
- `GET /reviews/{id}` - Get review details
- `PUT /reviews/{id}` - Update review
- `DELETE /reviews/{id}` - Delete review
- `POST /reviews/{id}/like` - Like/unlike review

**Key Features:**
- Review validation and moderation
- Rating aggregation and calculations
- Spam detection and prevention
- Rich media support (images, videos)

### 4. Feed Generation Functions

**Endpoint:** `/functions/v1/feed`

**Operations:**
- `GET /feed` - Get personalized feed
- `GET /feed/community/{id}` - Get community feed
- `GET /feed/user/{id}` - Get user's public feed
- `POST /feed/refresh` - Trigger feed refresh

**Key Features:**
- Personalized content algorithms
- Real-time feed updates
- Content ranking and sorting
- Feed caching and optimization

### 5. External API Integration Functions

**Endpoint:** `/functions/v1/external`

**Operations:**
- `GET /external/movies/search` - Search movies
- `GET /external/movies/{id}` - Get movie details
- `GET /external/restaurants/search` - Search restaurants
- `GET /external/restaurants/{id}` - Get restaurant details

**Key Features:**
- Rate limiting and quota management
- Response caching
- Error handling and fallbacks
- Data normalization

## Data Models

### Database Schema

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  location VARCHAR(100),
  website VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Communities table
CREATE TABLE public.communities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  is_private BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community memberships
CREATE TABLE public.community_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- Reviewable items
CREATE TABLE public.reviewable_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id VARCHAR(255),
  type VARCHAR(50) NOT NULL, -- 'movie', 'restaurant', 'book', etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.reviewable_items(id) ON DELETE CASCADE,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  content TEXT,
  images TEXT[],
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_id, community_id)
);

-- User blocks
CREATE TABLE public.user_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Feed items (for caching)
CREATE TABLE public.feed_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL, -- 'review', 'community_join', etc.
  content_id UUID NOT NULL,
  score DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;

-- User profiles: Users can read public profiles, update their own
CREATE POLICY "Public profiles are viewable by everyone" ON public.user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Communities: Public communities viewable by all, private by members only
CREATE POLICY "Public communities are viewable by everyone" ON public.communities
  FOR SELECT USING (NOT is_private OR auth.uid() IN (
    SELECT user_id FROM public.community_memberships 
    WHERE community_id = id
  ));

-- Reviews: Public reviews viewable by all, private by community members
CREATE POLICY "Reviews are viewable based on privacy settings" ON public.reviews
  FOR SELECT USING (
    is_public OR 
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT user_id FROM public.community_memberships 
      WHERE community_id = reviews.community_id
    )
  );

CREATE POLICY "Users can manage their own reviews" ON public.reviews
  FOR ALL USING (auth.uid() = user_id);
```

## Error Handling

### Standardized Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}
```

### Common Error Codes

- `AUTH_REQUIRED` - Authentication required
- `AUTH_INVALID` - Invalid authentication token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Input validation failed
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `EXTERNAL_API_ERROR` - External API failure
- `DATABASE_ERROR` - Database operation failed

## Testing Strategy

### Unit Testing

- Test individual Edge Functions with mock data
- Validate input/output schemas
- Test error handling scenarios
- Mock external API calls

### Integration Testing

- Test Edge Functions with real Supabase database
- Test authentication flows
- Test RLS policies
- Test external API integrations

### End-to-End Testing

- Test complete user workflows
- Test frontend integration
- Test real-time features
- Performance testing under load

### Testing Tools

- **Deno Test** - Built-in testing for Edge Functions
- **Supabase CLI** - Local development and testing
- **Jest** - Frontend integration tests
- **Playwright** - End-to-end browser testing

## Performance Considerations

### Caching Strategy

- **Edge Function Response Caching** - Cache frequently accessed data
- **Database Query Optimization** - Use indexes and efficient queries
- **External API Caching** - Cache external API responses
- **Feed Caching** - Pre-generate and cache user feeds

### Database Optimization

- **Indexes** - Create indexes on frequently queried columns
- **Connection Pooling** - Efficient database connection management
- **Query Optimization** - Use efficient SQL queries and joins
- **Pagination** - Implement cursor-based pagination for large datasets

### Monitoring and Observability

- **Function Logs** - Comprehensive logging in Edge Functions
- **Performance Metrics** - Track function execution times
- **Error Tracking** - Monitor and alert on errors
- **Database Monitoring** - Track database performance and usage