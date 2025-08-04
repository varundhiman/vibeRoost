# Supabase Edge Functions

This directory contains the Supabase Edge Functions for the VibeRoost social recommendation application.

## Structure

```
functions/
├── users/                  # User management functions
│   ├── index.ts           # User CRUD operations
│   ├── block.ts           # User blocking functionality
│   └── profile.ts         # Profile management
├── communities/           # Community management functions
│   ├── index.ts           # Community CRUD
│   ├── membership.ts      # Join/leave communities
│   └── discovery.ts       # Community search/discovery
├── reviews/               # Review system functions
│   └── index.ts           # Review CRUD operations
├── feed/                  # Feed generation functions
│   └── index.ts           # Feed generation
└── _shared/               # Shared utilities
    ├── auth.ts            # Authentication utilities
    ├── validation.ts      # Common validation
    └── types.ts           # Shared TypeScript types
```

## Development

### Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- [Deno](https://deno.land/) runtime (installed automatically with Supabase CLI)

### Local Development

1. Start the local Supabase environment:
   ```bash
   supabase start
   ```

2. Serve the Edge Functions:
   ```bash
   supabase functions serve --env-file .env.backend
   ```

   Or use the convenience script:
   ```bash
   ./scripts/start-edge-functions.sh
   ```

3. Functions will be available at:
   ```
   http://localhost:54321/functions/v1/{function-name}
   ```

### Testing

Run tests with:
```bash
deno test --allow-all
```

### Deployment

Deploy all functions:
```bash
supabase functions deploy
```

Deploy a specific function:
```bash
supabase functions deploy {function-name}
```

## Environment Variables

The following environment variables are required:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

## Function Endpoints

### Users
- `POST /functions/v1/users` - User operations
- `POST /functions/v1/users/block` - User blocking
- `POST /functions/v1/users/profile` - Profile management

### Communities
- `POST /functions/v1/communities` - Community CRUD
- `POST /functions/v1/communities/membership` - Membership management
- `POST /functions/v1/communities/discovery` - Community discovery

### Reviews
- `POST /functions/v1/reviews` - Review operations

### Feed
- `POST /functions/v1/feed` - Feed generation

## Authentication

All functions expect a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

## Error Handling

Functions return standardized error responses:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "path": "/functions/v1/endpoint"
}
```