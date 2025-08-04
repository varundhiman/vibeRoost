# 🚀 Production Deployment Guide

## Step 1: Link to Production Supabase Project

First, you need to link your local Supabase project to your production instance:

```bash
# Login to Supabase (if not already logged in)
supabase login

# Link to your production project
supabase link --project-ref your-project-id
```

When prompted, enter your database password: `Infy@2302421`

## Step 2: Deploy Database Migrations

Deploy your database schema to production:

```bash
# Push all migrations to production
supabase db push
```

## Step 3: Deploy Edge Functions

Deploy all your Edge Functions to production:

```bash
# Deploy all functions
supabase functions deploy users
supabase functions deploy communities  
supabase functions deploy reviews
supabase functions deploy feed
supabase functions deploy external-apis
```

## Step 4: Set Environment Variables for Edge Functions

Your Edge Functions need environment variables in production. Set them using:

```bash
# Set the JWT secret for Edge Functions
supabase secrets set JWT_SECRET=your-jwt-secret

# Set the service role key
supabase secrets set SERVICE_ROLE_KEY=your-service-role-key

# Set the database URL
supabase secrets set SUPABASE_URL=https://your-project.supabase.co

# If you have external API keys, set them too (example):
# supabase secrets set YELP_API_KEY=your_yelp_api_key
# supabase secrets set TMDB_API_KEY=your_tmdb_api_key
```

## Step 5: Start Your Frontend

Now your frontend is configured to connect directly to production:

```bash
# Build the shared library
cd frontend-shared
npm install
npm run build

# Start the web app
cd ../web-app
npm install
npm start
```

## Step 6: Verify Everything Works

1. **Frontend**: http://localhost:3000
2. **Supabase Dashboard**: https://supabase.com/dashboard/project/your-project-id
3. **Edge Functions**: https://your-project.supabase.co/functions/v1/

## Troubleshooting

### If Edge Functions fail to deploy:
```bash
# Check function logs
supabase functions logs --project-ref your-project-id

# Test individual function
supabase functions serve users --project-ref your-project-id
```

### If frontend can't connect:
1. Check that environment variables are set correctly in `web-app/.env`
2. Verify Edge Functions are deployed and working
3. Check browser network tab for API call errors

### If authentication fails:
1. Verify the anon key matches your production project
2. Check that RLS policies are properly set up in production
3. Ensure auth settings match between local and production

## Environment Files Created

✅ `web-app/.env` - Production Supabase config for React app
✅ `frontend-shared/.env` - Production config for shared library
✅ Removed local proxy from `web-app/package.json`

Your app is now configured to run against production Supabase! 🎉