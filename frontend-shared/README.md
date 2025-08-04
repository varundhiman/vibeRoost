# Social Recommendation App - Frontend Shared Library

A TypeScript library providing shared API client, authentication, and state management utilities for the Social Recommendation App frontend applications.

## Features

- **TypeScript API Client** with Axios for HTTP requests
- **Supabase Authentication** integration with automatic token management
- **Redux Store** with RTK Query for state management
- **Offline Support** with local storage fallbacks
- **Error Handling** and retry logic for API calls
- **Comprehensive Testing** with Vitest

## Installation

```bash
npm install @socialrec/frontend-shared
```

## Quick Start

### Initialize the SDK

```typescript
import { SocialRecSDK } from '@socialrec/frontend-shared';

const sdk = new SocialRecSDK({
  auth: {
    supabaseUrl: process.env.REACT_APP_SUPABASE_URL!,
    supabaseAnonKey: process.env.REACT_APP_SUPABASE_ANON_KEY!,
  },
  api: {
    baseURL: process.env.REACT_APP_API_BASE_URL,
    enableOfflineSupport: true,
  },
});

await sdk.initialize();
```

### Use with Redux

```typescript
import { Provider } from 'react-redux';
import { createStore } from '@socialrec/frontend-shared';

const store = createStore();

function App() {
  return (
    <Provider store={store}>
      {/* Your app components */}
    </Provider>
  );
}
```

### Authentication

```typescript
// Sign up
const { user, error } = await sdk.auth.signUp('user@example.com', 'password');

// Sign in
const { user, error } = await sdk.auth.signIn('user@example.com', 'password');

// Sign in with OAuth
await sdk.auth.signInWithProvider('google');

// Sign out
await sdk.auth.signOut();
```

### API Services

```typescript
// User service
const profile = await sdk.users.getProfile();
await sdk.users.updateProfile({ displayName: 'New Name' });

// Community service
const communities = await sdk.communities.getCommunities();
await sdk.communities.joinCommunity('community-id');

// Review service
const reviews = await sdk.reviews.getReviews();
await sdk.reviews.createReview({
  itemId: 'item-id',
  itemType: ItemType.RESTAURANT,
  rating: 5,
  title: 'Great place!',
  communities: ['community-id'],
});

// Feed service
const feed = await sdk.feed.getFeed();
await sdk.feed.createPost({
  content: 'Check out this place!',
  communities: ['community-id'],
});
```

### Redux State Management

```typescript
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectUser, 
  selectCommunities, 
  selectFeedItems,
  setUser,
  addCommunity 
} from '@socialrec/frontend-shared';

function MyComponent() {
  const user = useSelector(selectUser);
  const communities = useSelector(selectCommunities);
  const feedItems = useSelector(selectFeedItems);
  const dispatch = useDispatch();

  // Update state
  dispatch(setUser(newUser));
  dispatch(addCommunity(newCommunity));

  return (
    <div>
      <h1>Welcome, {user?.displayName}</h1>
      {/* Render communities and feed */}
    </div>
  );
}
```

## API Reference

### SDK Classes

- `SocialRecSDK` - Main SDK class
- `ApiClient` - HTTP client with authentication and retry logic
- `SupabaseAuthService` - Authentication service
- `OfflineStorageService` - Local storage with expiration

### Services

- `UserService` - User profile and settings management
- `CommunityService` - Community and membership operations
- `ReviewService` - Review and reviewable item operations
- `FeedService` - Feed and post operations
- `ExternalApiService` - External API integrations

### Redux Slices

- `authSlice` - Authentication state
- `userSlice` - User profile state
- `communitySlice` - Community and membership state
- `reviewSlice` - Review and reviewable item state
- `feedSlice` - Feed and post state

## Configuration

### Environment Variables

```bash
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### API Configuration

```typescript
const config = {
  baseURL: 'https://api.example.com',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
  enableOfflineSupport: true,
};
```

## Error Handling

The SDK provides comprehensive error handling with specific error codes:

```typescript
try {
  const result = await sdk.users.getProfile();
} catch (error) {
  switch (error.code) {
    case 'NETWORK_ERROR':
      // Handle network issues
      break;
    case 'UNAUTHORIZED':
      // Handle authentication issues
      break;
    case 'RATE_LIMITED':
      // Handle rate limiting
      break;
    default:
      // Handle other errors
      break;
  }
}
```

## Offline Support

The SDK automatically caches GET requests and provides offline fallbacks:

```typescript
// Data will be served from cache when offline
const data = await sdk.users.getProfile();

// Check cache statistics
const stats = sdk.api.offlineStorage.getCacheStats();
console.log(`Cache entries: ${stats.totalEntries}, Size: ${stats.totalSize}`);

// Clean expired entries
await sdk.api.offlineStorage.cleanExpired();
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Development

Build the library:

```bash
npm run build
```

Type checking:

```bash
npm run type-check
```

Linting:

```bash
npm run lint
```

## License

MIT