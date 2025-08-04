-- Add moderation support for reviews
-- This migration adds moderation status fields and moderation flags table

-- Add moderation fields to reviews table
ALTER TABLE public.reviews 
ADD COLUMN moderation_status VARCHAR(20) DEFAULT 'approved',
ADD COLUMN moderation_reason TEXT,
ADD COLUMN moderated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN moderated_by UUID REFERENCES auth.users(id);

-- Add constraint for moderation status
ALTER TABLE public.reviews 
ADD CONSTRAINT chk_moderation_status 
CHECK (moderation_status IN ('approved', 'flagged', 'rejected', 'pending'));

-- Create moderation_flags table for manual review flags
CREATE TABLE public.moderation_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
  flagged_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT chk_flag_status 
    CHECK (status IN ('pending', 'resolved', 'dismissed'))
);

-- Create function to increment counter fields
CREATE OR REPLACE FUNCTION increment_counter(
  table_name TEXT,
  field_name TEXT,
  record_id UUID,
  increment_by INTEGER DEFAULT 1
) RETURNS VOID AS $$
BEGIN
  EXECUTE format('UPDATE %I SET %I = %I + $1 WHERE id = $2', 
    table_name, field_name, field_name) 
  USING increment_by, record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update item rating when reviews change
CREATE OR REPLACE FUNCTION update_item_rating_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Update aggregated rating and review count
  UPDATE public.reviewable_items 
  SET 
    aggregated_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM public.reviews 
      WHERE item_id = COALESCE(NEW.item_id, OLD.item_id)
    ),
    review_count = (
      SELECT COUNT(*)
      FROM public.reviews 
      WHERE item_id = COALESCE(NEW.item_id, OLD.item_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.item_id, OLD.item_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically update item ratings
CREATE TRIGGER update_item_rating_on_review_insert
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_item_rating_trigger();

CREATE TRIGGER update_item_rating_on_review_update
  AFTER UPDATE ON public.reviews
  FOR EACH ROW
  WHEN (OLD.rating IS DISTINCT FROM NEW.rating)
  EXECUTE FUNCTION update_item_rating_trigger();

CREATE TRIGGER update_item_rating_on_review_delete
  AFTER DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_item_rating_trigger();

-- Create function to update community member count
CREATE OR REPLACE FUNCTION update_community_member_count_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'APPROVED' THEN
    UPDATE public.communities 
    SET member_count = member_count + 1 
    WHERE id = NEW.community_id;
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
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'APPROVED' THEN
    UPDATE public.communities 
    SET member_count = member_count - 1 
    WHERE id = OLD.community_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update community member counts
CREATE TRIGGER update_community_member_count
  AFTER INSERT OR UPDATE OR DELETE ON public.community_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_community_member_count_trigger();

-- Add indexes for moderation queries
CREATE INDEX idx_reviews_moderation_status ON public.reviews(moderation_status);
CREATE INDEX idx_moderation_flags_status ON public.moderation_flags(status);
CREATE INDEX idx_moderation_flags_review_id ON public.moderation_flags(review_id);

-- Add unique constraint for external_id and type combination
CREATE UNIQUE INDEX idx_reviewable_items_external_id_type 
ON public.reviewable_items(external_id, type) 
WHERE external_id IS NOT NULL;