-- Database triggers for VibeRoost
-- This migration creates triggers for automatic timestamp updates and data consistency

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_communities_updated_at 
    BEFORE UPDATE ON public.communities 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviewable_items_updated_at 
    BEFORE UPDATE ON public.reviewable_items 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at 
    BEFORE UPDATE ON public.reviews 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_posts_updated_at 
    BEFORE UPDATE ON public.posts 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON public.comments 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update community member count
CREATE OR REPLACE FUNCTION public.update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'APPROVED' THEN
        UPDATE public.communities 
        SET member_count = member_count + 1 
        WHERE id = NEW.community_id;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'APPROVED' THEN
        UPDATE public.communities 
        SET member_count = member_count - 1 
        WHERE id = OLD.community_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'APPROVED' AND NEW.status = 'APPROVED' THEN
            UPDATE public.communities 
            SET member_count = member_count + 1 
            WHERE id = NEW.community_id;
        ELSIF OLD.status = 'APPROVED' AND NEW.status != 'APPROVED' THEN
            UPDATE public.communities 
            SET member_count = member_count - 1 
            WHERE id = NEW.community_id;
        END IF;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ language 'plpgsql';

-- Create trigger for community member count updates
CREATE TRIGGER update_community_member_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.community_memberships
    FOR EACH ROW EXECUTE FUNCTION public.update_community_member_count();

-- Create function to update review count and aggregated rating
CREATE OR REPLACE FUNCTION public.update_reviewable_item_stats()
RETURNS TRIGGER AS $$
DECLARE
    item_id_to_update UUID;
    new_count INTEGER;
    new_avg_rating DECIMAL(3,2);
BEGIN
    -- Determine which item to update
    IF TG_OP = 'DELETE' THEN
        item_id_to_update := OLD.item_id;
    ELSE
        item_id_to_update := NEW.item_id;
    END IF;
    
    -- Calculate new stats
    SELECT COUNT(*), AVG(rating)
    INTO new_count, new_avg_rating
    FROM public.reviews
    WHERE item_id = item_id_to_update;
    
    -- Update the reviewable item
    UPDATE public.reviewable_items
    SET 
        review_count = new_count,
        aggregated_rating = new_avg_rating,
        updated_at = NOW()
    WHERE id = item_id_to_update;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ language 'plpgsql';

-- Create trigger for reviewable item stats updates
CREATE TRIGGER update_reviewable_item_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_reviewable_item_stats();

-- Create function to update likes count
CREATE OR REPLACE FUNCTION public.update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.like_type = 'POST' THEN
            UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        ELSIF NEW.like_type = 'COMMENT' THEN
            UPDATE public.comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
        ELSIF NEW.like_type = 'REVIEW' THEN
            UPDATE public.reviews SET likes_count = likes_count + 1 WHERE id = NEW.review_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.like_type = 'POST' THEN
            UPDATE public.posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
        ELSIF OLD.like_type = 'COMMENT' THEN
            UPDATE public.comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
        ELSIF OLD.like_type = 'REVIEW' THEN
            UPDATE public.reviews SET likes_count = likes_count - 1 WHERE id = OLD.review_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for likes count updates
CREATE TRIGGER update_likes_count_trigger
    AFTER INSERT OR DELETE ON public.likes
    FOR EACH ROW EXECUTE FUNCTION public.update_likes_count();

-- Create function to update comments count
CREATE OR REPLACE FUNCTION public.update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for comments count updates
CREATE TRIGGER update_comments_count_trigger
    AFTER INSERT OR DELETE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.update_comments_count();