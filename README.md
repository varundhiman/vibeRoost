# Social Recommendation App

A modern social recommendation platform built with Supabase Edge Functions and React.

## Architecture

This application uses a serverless architecture with Supabase Edge Functions:

- **Edge Functions** - TypeScript/Deno serverless functions for all backend logic
- **Supabase Database** - PostgreSQL database with Row Level Security (RLS)
- **Supabase Auth** - Built-in authentication and user management
- **Supabase Storage** - File storage for images and media
- **React Frontend** - Modern React application with TypeScript

### Edge Functions

- **Users** (`/functions/v1/users`) - User profile management and blocking
- **Communities** (`/functions/v1/communities`) - Community CRUD and membership
- **Reviews** (`/functions/v1/reviews`) - Review system and reviewable items
- **Feed** (`/functions/v1/feed`) - Personalized feed generation
- **External APIs** (`/functions/v1/external-apis`) - Movie and restaurant data integration

## Prerequisites

- Node.js 18 or higher
- Supabase CLI
- Supabase account and project

## Local Development Setup

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Configure Environment Variables

Create a `.env.backend` file in the root directory:

```bash
# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# External API Keys
GOOGLE_PLACES_API_KEY=your-google-places-api-key
TMDB_API_KEY=your-tmdb-api-key
```

### 3. Start Supabase Local Development

```bash
# Start all Supabase services
supabase start

# Or use the convenience script
./scripts/start-with-supabase.sh
```

This will start:
- PostgreSQL database on port 54322
- API Gateway on port 54321
- Supabase Dashboard on port 54323
- Edge Functions on port 54321/functions/v1

### 4. Deploy Edge Functions (Local)

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individual functions
supabase functions deploy users
supabase functions deploy communities
supabase functions deploy reviews
supabase functions deploy feed
supabase functions deploy external-apis
```

### 5. Start Frontend Development

```bash
# Install dependencies
cd web-app
npm install

# Start development server
npm start
```

## Project Structure

```
social-recommendation-app/
├── supabase/
│   ├── functions/              # Edge Functions
│   │   ├── users/             # User management
│   │   ├── communities/       # Community management
│   │   ├── reviews/           # Review system
│   │   ├── feed/              # Feed generation
│   │   ├── external-apis/     # External API integration
│   │   └── _shared/           # Shared utilities
│   └── migrations/            # Database migrations
├── frontend-shared/           # Shared frontend library
│   ├── src/
│   │   ├── api/              # API client
│   │   ├── auth/             # Authentication
│   │   ├── services/         # Service classes
│   │   ├── store/            # Redux store
│   │   └── types/            # TypeScript types
├── web-app/                   # React web application
│   └── src/
│       ├── components/       # React components
│       ├── pages/           # Page components
│       └── hooks/           # Custom hooks
└── scripts/                  # Development scripts
```

## Technology Stack

- **Backend**: TypeScript, Deno, Supabase Edge Functions
- **Database**: PostgreSQL with Supabase
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Frontend**: React 18, TypeScript, Redux Toolkit
- **Styling**: Tailwind CSS
- **Build Tools**: Vite, npm

## API Endpoints

All Edge Functions are available at `http://localhost:54321/functions/v1/`:

- `GET/POST /users` - User profile management
- `GET/POST /communities` - Community operations
- `GET/POST /reviews` - Review system
- `GET /feed` - Personalized feed
- `GET /external-apis/movies/search` - Movie search
- `GET /external-apis/restaurants/search` - Restaurant search

## Development Guidelines

1. Use TypeScript for all code
2. Follow functional programming patterns in Edge Functions
3. Implement proper error handling with standardized responses
4. Use Row Level Security (RLS) for database access control
5. Write tests for all Edge Functions
6. Use environment variables for configuration

## Testing

```bash
# Test Edge Functions
cd supabase/functions
deno test --allow-all

# Test frontend shared library
cd frontend-shared
npm test

# Test React application
cd web-app
npm test
```

## Deployment

### Edge Functions
```bash
# Deploy to Supabase
supabase functions deploy --project-ref your-project-ref
```

### Frontend
```bash
# Build for production
cd web-app
npm run build

# Deploy to your preferred hosting platform
```

## Migration from Java Services

This project has been migrated from Java microservices to Supabase Edge Functions. The migration provides:

- **Simplified Architecture**: Single serverless platform instead of multiple Java services
- **Better Performance**: Edge Functions with global distribution
- **Reduced Complexity**: No need for service discovery, load balancing, or container orchestration
- **Cost Efficiency**: Pay-per-use serverless model
- **Built-in Features**: Authentication, database, and storage included

For migration details, see `frontend-shared/EDGE_FUNCTIONS_MIGRATION.md`.


