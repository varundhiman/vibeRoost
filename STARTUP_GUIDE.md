# Quick Startup Guide

Follow these steps to get the Social Recommendation App running with Edge Functions:

## Prerequisites

Make sure you have installed:
- Node.js 18+ 
- Supabase CLI: `npm install -g supabase`

## Step 1: Start Supabase Services

```bash
# Start Supabase local development environment
supabase start

# Or use the convenience script
./scripts/start-with-supabase.sh
```

This will start:
- PostgreSQL database on port 54322
- API Gateway on port 54321  
- Supabase Dashboard on port 54323
- Edge Functions on port 54321/functions/v1

## Step 2: Deploy Edge Functions

```bash
# Deploy all Edge Functions to local Supabase
supabase functions deploy users
supabase functions deploy communities  
supabase functions deploy reviews
supabase functions deploy feed
supabase functions deploy external-apis
```

## Step 3: Install Frontend Dependencies

```bash
# Install frontend-shared dependencies
cd frontend-shared
npm install
npm run build

# Install web-app dependencies  
cd ../web-app
npm install
```

## Step 4: Start the Web Application

```bash
# From the web-app directory
npm start
```

The app will be available at: http://localhost:3000

## Step 5: Test the Connection

1. Open http://localhost:3000
2. Try to sign up for a new account
3. Navigate through the app to test different features

## Troubleshooting

### If Supabase won't start:
```bash
supabase stop
supabase start
```

### If Edge Functions aren't working:
```bash
# Check function logs
supabase functions logs

# Redeploy functions
supabase functions deploy --no-verify-jwt
```

### If frontend can't connect:
- Check that Supabase is running on port 54321
- Verify the .env.local file in web-app has correct URLs
- Check browser console for errors

## Available Services

Once running, you can access:

- **Web App**: http://localhost:3000
- **Supabase Dashboard**: http://localhost:54323  
- **Database**: http://localhost:54322
- **Edge Functions**: http://localhost:54321/functions/v1/

### Edge Function Endpoints:
- `POST /functions/v1/users` - User management
- `GET/POST /functions/v1/communities` - Communities
- `GET/POST /functions/v1/reviews` - Reviews  
- `GET /functions/v1/feed` - Personalized feed
- `GET /functions/v1/external-apis/movies/search` - Movie search
- `GET /functions/v1/external-apis/restaurants/search` - Restaurant search