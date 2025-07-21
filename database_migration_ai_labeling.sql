-- Migration: Add AI Labeling Columns to Images Table
-- Run this in your Supabase SQL Editor

-- Add AI labeling columns to images table
ALTER TABLE images 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS visual_style TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS color_palette TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS mood TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS industry_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS content_type TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS use_cases TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS aspect_ratio TEXT DEFAULT '16:9',
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS dimensions TEXT,
ADD COLUMN IF NOT EXISTS last_used TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_images_category ON images(category);
CREATE INDEX IF NOT EXISTS idx_images_keywords ON images USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_images_quality ON images(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_images_created ON images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_usage ON images(usage_count DESC);

-- Create search function for intelligent image matching
CREATE OR REPLACE FUNCTION search_images(
  search_query TEXT,
  category_filter TEXT DEFAULT NULL,
  quality_min INTEGER DEFAULT 0,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  image_url TEXT,
  category TEXT,
  keywords TEXT[],
  quality_score INTEGER,
  relevance_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.title,
    i.description,
    i.image_url,
    i.category,
    i.keywords,
    i.quality_score,
    CASE 
      WHEN i.category = category_filter THEN 1.5
      ELSE 1.0
    END * 
    CASE 
      WHEN i.quality_score >= quality_min THEN 1.2
      ELSE 0.8
    END *
    CASE 
      WHEN search_query = ANY(i.keywords) THEN 2.0
      WHEN search_query ILIKE '%' || ANY(i.keywords) || '%' THEN 1.5
      ELSE 1.0
    END as relevance_score
  FROM images i
  WHERE 
    (category_filter IS NULL OR i.category = category_filter)
    AND i.quality_score >= quality_min
    AND (
      search_query ILIKE '%' || i.title || '%'
      OR search_query ILIKE '%' || i.description || '%'
      OR search_query = ANY(i.keywords)
      OR search_query ILIKE '%' || ANY(i.keywords) || '%'
    )
  ORDER BY relevance_score DESC, i.quality_score DESC
  LIMIT limit_count;
END;
$$;

-- Create analytics view for image usage
CREATE OR REPLACE VIEW image_analytics AS
SELECT 
  category,
  COUNT(*) as total_images,
  AVG(quality_score) as avg_quality,
  SUM(usage_count) as total_usage,
  MAX(last_used) as last_used_date
FROM images 
WHERE is_stock_photo = true
GROUP BY category
ORDER BY total_usage DESC;

-- Grant permissions
GRANT SELECT ON image_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION search_images TO authenticated; 