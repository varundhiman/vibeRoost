# Database Migrations

This directory contains the database migrations for the VibeRoost social recommendation app using Supabase.

## Migration Files

1. **20240101000001_initial_schema.sql** - Creates all core tables and relationships
2. **20240101000002_create_indexes.sql** - Adds performance indexes for optimal query performance
3. **20240101000003_rls_policies.sql** - Implements Row Level Security policies for data protection
4. **20240101000004_triggers.sql** - Sets up database triggers for automatic updates and data consistency

## Running Migrations

To apply these migrations to your Supabase project:

```bash
# Apply all migrations
supabase db push

# Or apply migrations individually
supabase db push --include-all
```

## Schema Overview

The database schema includes the following main entities:

- **user_profiles** - Extended user profiles (linked to auth.users)
- **communities** - User communities with privacy controls
- **community_memberships** - User-community relationships
- **reviewable_items** - Items that can be reviewed (movies, restaurants, etc.)
- **reviews** - User reviews with ratings and community associations
- **posts** - Social posts with community associations
- **comments** - Comments on posts
- **likes** - Likes for posts, comments, and reviews
- **user_blocks** - User blocking functionality
- **notifications** - System notifications
- **feed_items** - Cached feed items for performance

## Security

All tables have Row Level Security (RLS) enabled with comprehensive policies that:

- Respect user privacy settings
- Enforce community access controls
- Protect sensitive user data
- Ensure data integrity

## Performance

The schema includes optimized indexes for:

- Common query patterns
- Feed generation
- Search functionality
- Real-time features