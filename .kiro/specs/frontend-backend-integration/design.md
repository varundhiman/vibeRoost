# Frontend-Backend Integration Design

## Overview

This design document outlines how to connect the React frontend to the Supabase Edge Functions backend. The integration will replace placeholder implementations with actual API calls using the existing SDK architecture.

## Architecture

### Current State
- Frontend has placeholder implementations with TODO comments
- SDK services exist but aren't being used in React components
- Edge Functions are deployed and functional
- Authentication is working

### Target State
- React components use SDK services for all data operations
- Proper error handling and loading states throughout the UI
- Type-safe API calls with validation
- Offline handling where appropriate

## Components and Interfaces

### 1. SDK Integration Pattern

Each React component will follow this pattern:

```typescript
// Import SDK from shared library
import { SocialRecSDK } from '@socialrec/frontend-shared';

// Initialize SDK (or get from context)
const sdk = new SocialRecSDK({...});

// Use SDK services in component
const handleSubmit = async (data) => {
  try {
    setLoading(true);
    const result = await sdk.reviews.createReview(data);
    // Handle success
  } catch (error) {
    // Handle error
  } finally {
    setLoading(false);
  }
};
```

### 2. Review Management Integration

**CreateReviewPage Updates:**
- Replace TODO implementation with `sdk.reviews.createReview()`
- Add proper error handling and validation
- Implement photo upload to Supabase Storage
- Connect to actual communities data

**ReviewsPage Updates:**
- Fetch reviews using `sdk.reviews.getReviews()`
- Implement pagination and filtering
- Add real-time updates for new reviews

### 3. Community Management Integration

**CommunitiesPage Updates:**
- Fetch communities using `sdk.communities.getCommunities()`
- Implement join/leave functionality
- Add community creation modal

**CommunityDetailPage Updates:**
- Fetch community details and members
- Display community-specific reviews and activity

### 4. User Profile Integration

**ProfilePage Updates:**
- Fetch user profile using `sdk.users.getProfile()`
- Implement profile editing with `sdk.users.updateProfile()`
- Add profile picture upload

### 5. Feed Integration

**DashboardPage Updates:**
- Replace mock data with `sdk.feed.getFeed()`
- Implement real-time activity updates
- Add personalization based on user communities

## Data Models

### API Request/Response Types

```typescript
// Review Creation
interface CreateReviewRequest {
  itemName: string;
  itemType: ItemType;
  title: string;
  description: string;
  rating: number;
  communityIds: string[];
  photos?: File[];
}

// Community Creation
interface CreateCommunityRequest {
  name: string;
  description: string;
  type: 'PUBLIC' | 'PRIVATE';
  category: string;
}

// Profile Update
interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  profilePicture?: File;
  privacySettings?: PrivacySettings;
}
```

## Error Handling

### Error Types and Handling

1. **Network Errors**: Display "Connection failed" message with retry option
2. **Authentication Errors**: Redirect to login page
3. **Validation Errors**: Display field-specific error messages
4. **Server Errors**: Display generic "Something went wrong" message
5. **Not Found Errors**: Display appropriate 404 content

### Error Display Strategy

```typescript
// Centralized error handling
const handleApiError = (error: ApiError) => {
  switch (error.type) {
    case 'NETWORK_ERROR':
      toast.error('Connection failed. Please check your internet connection.');
      break;
    case 'AUTH_ERROR':
      dispatch(clearAuth());
      navigate('/login');
      break;
    case 'VALIDATION_ERROR':
      // Display field-specific errors
      setFieldErrors(error.details);
      break;
    default:
      toast.error('Something went wrong. Please try again.');
  }
};
```

## Testing Strategy

### Unit Tests
- Test SDK service integration in components
- Mock API responses for predictable testing
- Test error handling scenarios

### Integration Tests
- Test complete user flows (create review, join community)
- Test authentication integration
- Test offline behavior

### End-to-End Tests
- Test critical user journeys
- Test across different browsers and devices
- Test with real backend services

## Implementation Phases

### Phase 1: Core Review Functionality
- Connect CreateReviewPage to reviews API
- Connect ReviewsPage to reviews API
- Implement basic error handling

### Phase 2: Community Management
- Connect CommunitiesPage to communities API
- Implement community creation and joining
- Add community-specific views

### Phase 3: User Profiles and Feed
- Connect ProfilePage to users API
- Connect DashboardPage to feed API
- Implement real-time updates

### Phase 4: Enhanced Features
- Add photo upload functionality
- Implement search and filtering
- Add offline support

## Security Considerations

- All API calls use authenticated requests with JWT tokens
- File uploads are validated for type and size
- User input is sanitized before sending to API
- Sensitive operations require re-authentication
- Rate limiting is handled gracefully

## Performance Considerations

- Implement pagination for large data sets
- Use React Query or SWR for caching and background updates
- Optimize image uploads with compression
- Implement lazy loading for non-critical content
- Use debouncing for search functionality