-- Performance indexes for VibeRoost database
-- This migration creates indexes for optimal query performance

-- User profiles indexes
CREATE INDEX idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX idx_user_profiles_display_name ON public.user_profiles(display_name);
CREATE INDEX idx_user_profiles_created_at ON public.user_profiles(created_at);
CREATE INDEX idx_user_profiles_profile_visibility ON public.user_profiles(profile_visibility);
CREATE INDEX idx_user_profiles_show_in_search ON public.user_profiles(show_in_search) WHERE show_in_search = true;

-- Communities indexes
CREATE INDEX idx_communities_name ON public.communities(name);
CREATE INDEX idx_communities_type ON public.communities(type);
CREATE INDEX idx_communities_is_private ON public.communities(is_private);
CREATE INDEX idx_communities_created_by ON public.communities(created_by);
CREATE INDEX idx_communities_member_count ON public.communities(member_count);
CREATE INDEX idx_communities_created_at ON public.communities(created_at);

-- Community memberships indexes
CREATE INDEX idx_memberships_user_id ON public.community_memberships(user_id);
CREATE INDEX idx_memberships_community_id ON public.community_memberships(community_id);
CREATE INDEX idx_memberships_status ON public.community_memberships(status);
CREATE INDEX idx_memberships_role ON public.community_memberships(role);
CREATE INDEX idx_memberships_joined_at ON public.community_memberships(joined_at);
CREATE INDEX idx_memberships_user_approved ON public.community_memberships(user_id, status) WHERE status = 'APPROVED';

-- Reviewable items indexes
CREATE INDEX idx_reviewable_items_type ON public.reviewable_items(type);
CREATE INDEX idx_reviewable_items_title ON public.reviewable_items(title);
CREATE INDEX idx_reviewable_items_external_id ON public.reviewable_items(external_id);
CREATE INDEX idx_reviewable_items_aggregated_rating ON public.reviewable_items(aggregated_rating);
CREATE INDEX idx_reviewable_items_review_count ON public.reviewable_items(review_count);
CREATE INDEX idx_reviewable_items_created_at ON public.reviewable_items(created_at);
CREATE INDEX idx_reviewable_items_type_rating ON public.reviewable_items(type, aggregated_rating);

-- Reviews indexes
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_item_id ON public.reviews(item_id);
CREATE INDEX idx_reviews_community_id ON public.reviews(community_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at);
CREATE INDEX idx_reviews_likes_count ON public.reviews(likes_count);
CREATE INDEX idx_reviews_is_public ON public.reviews(is_public);
CREATE INDEX idx_reviews_public_recent ON public.reviews(created_at DESC) WHERE is_public = true;
CREATE INDEX idx_reviews_community_recent ON public.reviews(community_id, created_at DESC);

-- Posts indexes
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_referenced_item_id ON public.posts(referenced_item_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at);
CREATE INDEX idx_posts_likes_count ON public.posts(likes_count);
CREATE INDEX idx_posts_comments_count ON public.posts(comments_count);
CREATE INDEX idx_posts_is_public ON public.posts(is_public);
CREATE INDEX idx_posts_public_recent ON public.posts(created_at DESC) WHERE is_public = true;

-- Post communities indexes
CREATE INDEX idx_post_communities_post_id ON public.post_communities(post_id);
CREATE INDEX idx_post_communities_community_id ON public.post_communities(community_id);

-- Comments indexes
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at);
CREATE INDEX idx_comments_likes_count ON public.comments(likes_count);
CREATE INDEX idx_comments_post_recent ON public.comments(post_id, created_at DESC);

-- Likes indexes
CREATE INDEX idx_likes_user_id ON public.likes(user_id);
CREATE INDEX idx_likes_post_id ON public.likes(post_id);
CREATE INDEX idx_likes_comment_id ON public.likes(comment_id);
CREATE INDEX idx_likes_review_id ON public.likes(review_id);
CREATE INDEX idx_likes_like_type ON public.likes(like_type);
CREATE INDEX idx_likes_created_at ON public.likes(created_at);

-- User blocks indexes
CREATE INDEX idx_user_blocks_blocker_id ON public.user_blocks(blocker_id);
CREATE INDEX idx_user_blocks_blocked_id ON public.user_blocks(blocked_id);
CREATE INDEX idx_user_blocks_created_at ON public.user_blocks(created_at);

-- Notifications indexes
CREATE INDEX idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX idx_notifications_actor_id ON public.notifications(actor_id);
CREATE INDEX idx_notifications_type ON public.notifications(notification_type);
CREATE INDEX idx_notifications_post_id ON public.notifications(post_id);
CREATE INDEX idx_notifications_comment_id ON public.notifications(comment_id);
CREATE INDEX idx_notifications_review_id ON public.notifications(review_id);
CREATE INDEX idx_notifications_community_id ON public.notifications(community_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX idx_notifications_recipient_unread ON public.notifications(recipient_id, created_at DESC) WHERE is_read = false;

-- Feed items indexes
CREATE INDEX idx_feed_items_user_id ON public.feed_items(user_id);
CREATE INDEX idx_feed_items_content_type ON public.feed_items(content_type);
CREATE INDEX idx_feed_items_content_id ON public.feed_items(content_id);
CREATE INDEX idx_feed_items_score ON public.feed_items(score);
CREATE INDEX idx_feed_items_created_at ON public.feed_items(created_at);
CREATE INDEX idx_feed_items_user_score ON public.feed_items(user_id, score DESC);
CREATE INDEX idx_feed_items_user_recent ON public.feed_items(user_id, created_at DESC);