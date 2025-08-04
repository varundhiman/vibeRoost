-- Initial schema migration for VibeRoost social recommendation app
-- This migration creates all core tables for the Supabase Edge Functions backend

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  location VARCHAR(100),
  website VARCHAR(255),
  profile_visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
  allow_direct_messages BOOLEAN NOT NULL DEFAULT true,
  show_in_search BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT chk_profile_visibility 
    CHECK (profile_visibility IN ('PUBLIC', 'COMMUNITIES_ONLY', 'PRIVATE'))
);

-- Create communities table
CREATE TABLE public.communities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  type VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
  is_private BOOLEAN DEFAULT FALSE,
  member_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT chk_community_type 
    CHECK (type IN ('PUBLIC', 'PRIVATE', 'INVITE_ONLY'))
);

-- Create community_memberships table
CREATE TABLE public.community_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'MEMBER',
  status VARCHAR(20) NOT NULL DEFAULT 'APPROVED',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(community_id, user_id),
  CONSTRAINT chk_member_role 
    CHECK (role IN ('OWNER', 'MODERATOR', 'MEMBER')),
  CONSTRAINT chk_membership_status 
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'BANNED'))
);

-- Create reviewable_items table
CREATE TABLE public.reviewable_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id VARCHAR(255),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  metadata JSONB,
  aggregated_rating DECIMAL(3,2),
  review_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT chk_item_type 
    CHECK (type IN ('MOVIE', 'TV_SHOW', 'RESTAURANT', 'SERVICE', 'VACATION_SPOT', 'RECIPE', 'ACTIVITY'))
);

-- Create reviews table
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
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, item_id, community_id)
);

-- Create posts table
CREATE TABLE public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  referenced_item_id UUID REFERENCES public.reviewable_items(id),
  images TEXT[],
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create post_communities table for community associations
CREATE TABLE public.post_communities (
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, community_id)
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create likes table
CREATE TABLE public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
  like_type VARCHAR(20) NOT NULL CHECK (like_type IN ('POST', 'COMMENT', 'REVIEW')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can only like each item once
  CONSTRAINT unique_user_post_like UNIQUE (user_id, post_id),
  CONSTRAINT unique_user_comment_like UNIQUE (user_id, comment_id),
  CONSTRAINT unique_user_review_like UNIQUE (user_id, review_id),
  
  -- Ensure exactly one target is set
  CONSTRAINT check_like_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL AND review_id IS NULL AND like_type = 'POST') OR
    (post_id IS NULL AND comment_id IS NOT NULL AND review_id IS NULL AND like_type = 'COMMENT') OR
    (post_id IS NULL AND comment_id IS NULL AND review_id IS NOT NULL AND like_type = 'REVIEW')
  )
);

-- Create user_blocks table
CREATE TABLE public.user_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(blocker_id, blocked_id),
  CONSTRAINT chk_user_blocks_not_self CHECK (blocker_id != blocked_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(30) NOT NULL CHECK (notification_type IN (
    'POST_LIKE', 'COMMENT_LIKE', 'REVIEW_LIKE', 'POST_COMMENT', 'MENTION', 
    'COMMUNITY_POST', 'COMMUNITY_JOIN', 'MODERATION_ACTION'
  )),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feed_items table (for caching personalized feeds)
CREATE TABLE public.feed_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL,
  content_id UUID NOT NULL,
  score DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT chk_content_type 
    CHECK (content_type IN ('POST', 'REVIEW', 'COMMUNITY_JOIN', 'COMMUNITY_CREATE'))
);