-- Add feed generation support
-- This migration adds feed items table, views, and functions for feed generation

-- Create feed_items table for caching feed content
CREATE TABLE public.feed_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL,
  content_id UUID NOT NULL,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  score DECIMAL DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraint for content types
ALTER TABLE public.feed_items 
ADD CONSTRAINT chk_content_type 
CHECK (content_type IN ('POST', 'REVIEW', 'COMMUNITY_JOIN', 'COMMUNITY_CREATE'));

-- Create indexes for feed queries
CREATE INDEX idx_feed_items_user_id ON public.feed_items(user_id);
CREATE INDEX idx_feed_items_content_type ON public.feed_items(content_type);
CREATE INDEX idx_feed_items_community_id ON public.feed_items(community_id);
CREATE INDEX idx_feed_items_score ON public.feed_items(score DESC);
CREATE INDEX idx_feed_items_created_at ON public.feed_items(created_at DESC);
CREATE INDEX idx_feed_items_is_public ON public.feed_items(is_public);

-- Composite indexes for common feed queries
CREATE INDEX idx_feed_items_user_score_created ON public.feed_items(user_id, score DESC, created_at DESC);
CREATE INDEX idx_feed_items_community_created ON public.feed_items(community_id, created_at DESC);
CREATE INDEX idx_feed_items_public_score ON public.feed_items(is_public, score DESC) WHERE is_public = true;

-- Create view for feed items with metadata
CREATE VIEW public.feed_items_view AS
SELECT 
  fi.id,
  fi.user_id,
  fi.content_type,
  fi.content_id,
  fi.community_id,
  fi.score,
  fi.is_public,
  fi.created_at,
  fi.updated_at,
  
  -- User profile info
  up.username,
  up.display_name,
  up.avatar_url,
  
  -- Community info (if applicable)
  c.name as community_name,
  c.image_url as community_image_url,
  
  -- Content-specific metadata
  CASE 
    WHEN fi.content_type = 'REVIEW' THEN r.title
    WHEN fi.content_type = 'POST' THEN LEFT(p.content, 100)
    ELSE NULL
  END as content_preview,
  
  CASE 
    WHEN fi.content_type = 'REVIEW' THEN r.rating
    ELSE NULL
  END as rating,
  
  CASE 
    WHEN fi.content_type = 'REVIEW' THEN r.likes_count
    WHEN fi.content_type = 'POST' THEN p.likes_count
    ELSE 0
  END as likes_count,
  
  CASE 
    WHEN fi.content_type = 'POST' THEN p.comments_count
    ELSE 0
  END as comments_count

FROM public.feed_items fi
LEFT JOIN public.user_profiles up ON fi.user_id = up.id
LEFT JOIN public.communities c ON fi.community_id = c.id
LEFT JOIN public.reviews r ON fi.content_type = 'REVIEW' AND fi.content_id = r.id
LEFT JOIN public.posts p ON fi.content_type = 'POST' AND fi.content_id = p.id;

-- Function to create feed item when review is created
CREATE OR REPLACE FUNCTION create_feed_item_for_review()
RETURNS TRIGGER AS $
BEGIN
  INSERT INTO public.feed_items (
    user_id,
    content_type,
    content_id,
    community_id,
    score,
    is_public,
    created_at
  ) VALUES (
    NEW.user_id,
    'REVIEW',
    NEW.id,
    NEW.community_id,
    NEW.rating * 2, -- Base score based on rating
    NEW.is_public,
    NEW.created_at
  );
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create feed item when post is created
CREATE OR REPLACE FUNCTION create_feed_item_for_post()
RETURNS TRIGGER AS $
BEGIN
  -- Create feed item for each community the post is shared to
  INSERT INTO public.feed_items (
    user_id,
    content_type,
    content_id,
    community_id,
    score,
    is_public,
    created_at
  )
  SELECT 
    NEW.user_id,
    'POST',
    NEW.id,
    pc.community_id,
    1.0, -- Base score for posts
    NEW.is_public,
    NEW.created_at
  FROM public.post_communities pc
  WHERE pc.post_id = NEW.id;
  
  -- If no communities specified, create a general feed item
  IF NOT EXISTS (SELECT 1 FROM public.post_communities WHERE post_id = NEW.id) THEN
    INSERT INTO public.feed_items (
      user_id,
      content_type,
      content_id,
      community_id,
      score,
      is_public,
      created_at
    ) VALUES (
      NEW.user_id,
      'POST',
      NEW.id,
      NULL,
      1.0,
      NEW.is_public,
      NEW.created_at
    );
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update feed item scores based on engagement
CREATE OR REPLACE FUNCTION update_feed_item_score()
RETURNS TRIGGER AS $
DECLARE
  age_hours DECIMAL;
  engagement_score DECIMAL;
  time_decay DECIMAL;
  final_score DECIMAL;
BEGIN
  -- Calculate age in hours
  age_hours := EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 3600;
  
  -- Calculate engagement score based on content type
  IF NEW.content_type = 'REVIEW' THEN
    engagement_score := (COALESCE(NEW.likes_count, 0) * 2) + (NEW.rating * 0.5);
  ELSIF NEW.content_type = 'POST' THEN
    engagement_score := (COALESCE(NEW.likes_count, 0) * 1.5) + (COALESCE(NEW.comments_count, 0) * 1);
  ELSE
    engagement_score := 1;
  END IF;
  
  -- Apply time decay (content becomes less relevant over time)
  time_decay := EXP(-age_hours / 24.0); -- Decay over 24 hours
  
  -- Calculate final score
  final_score := engagement_score * time_decay;
  
  -- Update feed items
  UPDATE public.feed_items 
  SET 
    score = final_score,
    updated_at = NOW()
  WHERE content_id = NEW.id 
    AND content_type = CASE 
      WHEN TG_TABLE_NAME = 'reviews' THEN 'REVIEW'
      WHEN TG_TABLE_NAME = 'posts' THEN 'POST'
      ELSE content_type
    END;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old feed items
CREATE OR REPLACE FUNCTION cleanup_old_feed_items()
RETURNS VOID AS $
BEGIN
  -- Delete feed items older than 30 days
  DELETE FROM public.feed_items 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Keep only top 1000 items per user to prevent unlimited growth
  DELETE FROM public.feed_items 
  WHERE id IN (
    SELECT id 
    FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY score DESC, created_at DESC) as rn
      FROM public.feed_items
    ) ranked
    WHERE rn > 1000
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic feed item creation
CREATE TRIGGER create_feed_item_on_review_insert
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION create_feed_item_for_review();

CREATE TRIGGER create_feed_item_on_post_insert
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION create_feed_item_for_post();

-- Create triggers for feed score updates
CREATE TRIGGER update_feed_score_on_review_update
  AFTER UPDATE ON public.reviews
  FOR EACH ROW
  WHEN (OLD.likes_count IS DISTINCT FROM NEW.likes_count OR OLD.rating IS DISTINCT FROM NEW.rating)
  EXECUTE FUNCTION update_feed_item_score();

CREATE TRIGGER update_feed_score_on_post_update
  AFTER UPDATE ON public.posts
  FOR EACH ROW
  WHEN (OLD.likes_count IS DISTINCT FROM NEW.likes_count OR OLD.comments_count IS DISTINCT FROM NEW.comments_count)
  EXECUTE FUNCTION update_feed_item_score();

-- Enable RLS on feed_items table
ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for feed_items
CREATE POLICY "Users can view feed items based on community membership and privacy" 
ON public.feed_items FOR SELECT USING (
  -- Public content is viewable by everyone
  is_public = true OR
  -- Users can see their own feed items
  user_id = auth.uid() OR
  -- Users can see content from communities they're members of
  (community_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.community_memberships cm
    WHERE cm.community_id = feed_items.community_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'APPROVED'
  ))
);

CREATE POLICY "Users can manage their own feed items" 
ON public.feed_items FOR ALL USING (user_id = auth.uid());

-- Create scheduled job to clean up old feed items (if pg_cron is available)
-- This would typically be set up separately in production
-- SELECT cron.schedule('cleanup-feed-items', '0 2 * * *', 'SELECT cleanup_old_feed_items();');

-- Function to execute raw SQL (for feed refresh operations)
CREATE OR REPLACE FUNCTION execute_sql(sql TEXT, params JSONB DEFAULT '[]'::jsonb)
RETURNS VOID AS $
BEGIN
  -- This is a simplified version - in production you'd want more security
  -- and parameter binding
  EXECUTE sql;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;