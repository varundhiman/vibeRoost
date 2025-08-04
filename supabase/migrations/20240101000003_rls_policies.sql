-- Row Level Security (RLS) policies for VibeRoost
-- This migration implements comprehensive data protection policies

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviewable_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.user_profiles
  FOR SELECT USING (
    profile_visibility = 'PUBLIC' OR 
    auth.uid() = user_profiles.id OR
    (profile_visibility = 'COMMUNITIES_ONLY' AND auth.uid() IN (
      SELECT cm1.user_id FROM public.community_memberships cm1
      JOIN public.community_memberships cm2 ON cm1.community_id = cm2.community_id
      WHERE cm2.user_id = user_profiles.id AND cm1.status = 'APPROVED' AND cm2.status = 'APPROVED'
    ))
  );

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_profiles.id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_profiles.id);

-- Communities policies
CREATE POLICY "Public communities are viewable by everyone" ON public.communities
  FOR SELECT USING (
    NOT is_private OR 
    auth.uid() = created_by OR
    auth.uid() IN (
      SELECT user_id FROM public.community_memberships 
      WHERE community_id = id AND status = 'APPROVED'
    )
  );

CREATE POLICY "Authenticated users can create communities" ON public.communities
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Community owners and moderators can update communities" ON public.communities
  FOR UPDATE USING (
    auth.uid() = created_by OR
    auth.uid() IN (
      SELECT user_id FROM public.community_memberships 
      WHERE community_id = communities.id AND role IN ('OWNER', 'MODERATOR') AND status = 'APPROVED'
    )
  );

CREATE POLICY "Community owners can delete communities" ON public.communities
  FOR DELETE USING (auth.uid() = created_by);

-- Community memberships policies
CREATE POLICY "Community memberships are viewable by community members" ON public.community_memberships
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT user_id FROM public.community_memberships cm2
      WHERE cm2.community_id = community_id AND cm2.status = 'APPROVED'
    )
  );

CREATE POLICY "Users can join communities" ON public.community_memberships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities or owners can manage memberships" ON public.community_memberships
  FOR DELETE USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT c.created_by FROM public.communities c WHERE c.id = community_id
    ) OR
    auth.uid() IN (
      SELECT cm.user_id FROM public.community_memberships cm
      WHERE cm.community_id = community_id AND cm.role IN ('OWNER', 'MODERATOR') AND cm.status = 'APPROVED'
    )
  );

CREATE POLICY "Owners and moderators can update memberships" ON public.community_memberships
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT c.created_by FROM public.communities c WHERE c.id = community_id
    ) OR
    auth.uid() IN (
      SELECT cm.user_id FROM public.community_memberships cm
      WHERE cm.community_id = community_id AND cm.role IN ('OWNER', 'MODERATOR') AND cm.status = 'APPROVED'
    )
  );

-- Reviewable items policies (public read, authenticated write)
CREATE POLICY "Reviewable items are viewable by everyone" ON public.reviewable_items
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviewable items" ON public.reviewable_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update reviewable items" ON public.reviewable_items
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Reviews policies
CREATE POLICY "Reviews are viewable based on privacy settings" ON public.reviews
  FOR SELECT USING (
    is_public OR 
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT user_id FROM public.community_memberships 
      WHERE community_id = reviews.community_id AND status = 'APPROVED'
    )
  );

CREATE POLICY "Users can create their own reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Posts policies
CREATE POLICY "Posts are viewable based on privacy and community membership" ON public.posts
  FOR SELECT USING (
    is_public OR 
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT cm.user_id FROM public.community_memberships cm
      JOIN public.post_communities pc ON cm.community_id = pc.community_id
      WHERE pc.post_id = posts.id AND cm.status = 'APPROVED'
    )
  );

CREATE POLICY "Users can create their own posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- Post communities policies
CREATE POLICY "Post community associations are viewable by community members" ON public.post_communities
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.community_memberships 
      WHERE community_id = post_communities.community_id AND status = 'APPROVED'
    )
  );

CREATE POLICY "Post authors can associate posts with communities they belong to" ON public.post_communities
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.posts WHERE id = post_id
    ) AND
    auth.uid() IN (
      SELECT user_id FROM public.community_memberships 
      WHERE community_id = post_communities.community_id AND status = 'APPROVED'
    )
  );

CREATE POLICY "Post authors can remove community associations" ON public.post_communities
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.posts WHERE id = post_id
    )
  );

-- Comments policies
CREATE POLICY "Comments are viewable if the post is viewable" ON public.comments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT p.user_id FROM public.posts p WHERE p.id = post_id
    ) OR
    EXISTS (
      SELECT 1 FROM public.posts p WHERE p.id = post_id AND (
        p.is_public OR 
        auth.uid() IN (
          SELECT cm.user_id FROM public.community_memberships cm
          JOIN public.post_communities pc ON cm.community_id = pc.community_id
          WHERE pc.post_id = p.id AND cm.status = 'APPROVED'
        )
      )
    )
  );

CREATE POLICY "Users can create comments on viewable posts" ON public.comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.posts p WHERE p.id = post_id AND (
        p.is_public OR 
        auth.uid() = p.user_id OR
        auth.uid() IN (
          SELECT cm.user_id FROM public.community_memberships cm
          JOIN public.post_communities pc ON cm.community_id = pc.community_id
          WHERE pc.post_id = p.id AND cm.status = 'APPROVED'
        )
      )
    )
  );

CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own likes" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON public.likes
  FOR DELETE USING (auth.uid() = user_id);

-- User blocks policies
CREATE POLICY "Users can view their own blocks" ON public.user_blocks
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create their own blocks" ON public.user_blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks" ON public.user_blocks
  FOR DELETE USING (auth.uid() = blocker_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = recipient_id);

CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = recipient_id);

-- Feed items policies
CREATE POLICY "Users can view their own feed items" ON public.feed_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage feed items" ON public.feed_items
  FOR ALL USING (true);