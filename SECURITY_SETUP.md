# 🔐 Security Setup Guide

## Environment Variables Setup

### 1. Backend Environment Variables

Copy the example file and fill in your actual values:

```bash
cp .env.backend.example .env.backend
```

Then edit `.env.backend` with your actual Supabase credentials:

```env
# Your Supabase project URL
SUPABASE_URL=https://your-project-id.supabase.co

# Database connection
SUPABASE_DB_HOST=your-project-id.supabase.co
SUPABASE_DB_PORT=6543
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USERNAME=postgres
SUPABASE_DB_PASSWORD=your-actual-password

# Supabase keys (from Dashboard > Settings > API)
SUPABASE_ANON_KEY=your-actual-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
SUPABASE_JWT_SECRET=your-actual-jwt-secret
```

### 2. Frontend Environment Variables

For local development, create `web-app/.env.local`:

```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-actual-anon-key
REACT_APP_API_BASE_URL=https://your-project-id.supabase.co/functions/v1
REACT_APP_ENV=production
```

### 3. Netlify Environment Variables

In your Netlify dashboard, set these environment variables:

```
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-actual-anon-key
REACT_APP_API_BASE_URL=https://your-project-id.supabase.co/functions/v1
REACT_APP_ENV=production
NODE_VERSION=18
NPM_FLAGS=--production=false
```

## Security Best Practices

### ✅ Safe to Commit:
- `.env.example` files with placeholder values
- Public URLs and endpoints
- Configuration templates

### ❌ Never Commit:
- `.env` files with actual credentials
- Database passwords
- Service role keys
- JWT secrets
- Any file ending in `.local`

### 🔒 Key Security Notes:

1. **Supabase Anon Key**: While called "anon", this key is designed to be public and used in frontend applications. It has limited permissions.

2. **Service Role Key**: This is sensitive and should never be exposed in frontend code or committed to git.

3. **JWT Secret**: Used for signing tokens, must be kept secret.

4. **Database Password**: Direct database access credentials, highly sensitive.

## Getting Your Credentials

### From Supabase Dashboard:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings > API
4. Copy the values:
   - Project URL → `SUPABASE_URL`
   - anon/public key → `SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

5. Go to Settings > Database
   - Copy connection details for database variables

## Troubleshooting

If you see "exposed secrets" warnings:
- This is usually a false positive for the anon key
- The anon key is meant to be public
- Ensure service role keys are not in frontend code
- Check that `.env` files are properly gitignored

## File Structure

```
├── .env.backend.example     # Template for backend env vars
├── .env.backend            # Your actual backend credentials (gitignored)
├── web-app/
│   ├── .env.example        # Template for frontend env vars
│   └── .env.local          # Your actual frontend credentials (gitignored)
```