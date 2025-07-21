-- Enhanced Images Table with AI-Generated Labeling Support
-- This table stores images with comprehensive AI-generated metadata for optimal content matching

CREATE TABLE IF NOT EXISTS images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic image information
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  
  -- AI-generated categorization
  category TEXT NOT NULL,
  subcategory TEXT,
  
  -- Search and matching fields
  keywords TEXT[] NOT NULL DEFAULT '{}',
  
  -- Visual analysis fields
  visual_style TEXT[] DEFAULT '{}',
  color_palette TEXT[] DEFAULT '{}',
  mood TEXT[] DEFAULT '{}',
  
  -- Content and industry classification
  industry_tags TEXT[] DEFAULT '{}',
  content_type TEXT[] DEFAULT '{}',
  
  -- Technical specifications
  aspect_ratio TEXT DEFAULT '16:9',
  quality_score INTEGER DEFAULT 70,
  
  -- Usage and application
  use_cases TEXT[] DEFAULT '{}',
  
  -- Metadata
  ai_generated BOOLEAN DEFAULT false,
  user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT images_quality_score_check CHECK (quality_score >= 1 AND quality_score <= 100),
  CONSTRAINT images_category_check CHECK (category IN (
    'business', 'technology', 'success', 'motivation', 'growth', 'creativity', 
    'social_media', 'entrepreneurship', 'marketing', 'lifestyle', 'luxury', 
    'nature', 'health', 'education', 'finance', 'travel', 'food', 'fashion', 
    'sports', 'family', 'abstract', 'industrial', 'urban', 'rural', 'science', 
    'romantic', 'running'
  ))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_images_category ON images(category);
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_quality_score ON images(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_ai_generated ON images(ai_generated);

-- GIN indexes for array fields (enables efficient searching)
CREATE INDEX IF NOT EXISTS idx_images_keywords_gin ON images USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_images_visual_style_gin ON images USING GIN(visual_style);
CREATE INDEX IF NOT EXISTS idx_images_color_palette_gin ON images USING GIN(color_palette);
CREATE INDEX IF NOT EXISTS idx_images_mood_gin ON images USING GIN(mood);
CREATE INDEX IF NOT EXISTS idx_images_industry_tags_gin ON images USING GIN(industry_tags);
CREATE INDEX IF NOT EXISTS idx_images_content_type_gin ON images USING GIN(content_type);
CREATE INDEX IF NOT EXISTS idx_images_use_cases_gin ON images USING GIN(use_cases);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_images_category_quality ON images(category, quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_images_user_created ON images(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_category_keywords ON images(category) INCLUDE (keywords);

-- Full-text search index for title and description
CREATE INDEX IF NOT EXISTS idx_images_fulltext ON images USING GIN(
  to_tsvector('english', title || ' ' || COALESCE(description, ''))
);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_images_updated_at
  BEFORE UPDATE ON images
  FOR EACH ROW
  EXECUTE FUNCTION update_images_updated_at();

-- Function to search images by keywords
CREATE OR REPLACE FUNCTION search_images_by_keywords(search_keywords TEXT[])
RETURNS TABLE (
  id UUID,
  title TEXT,
  image_url TEXT,
  category TEXT,
  quality_score INTEGER,
  relevance_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.title,
    i.image_url,
    i.category,
    i.quality_score,
    -- Calculate relevance score based on keyword matches
    (
      CASE 
        WHEN array_length(array(
          SELECT unnest(search_keywords) 
          INTERSECT 
          SELECT unnest(i.keywords)
        ), 1) IS NOT NULL 
        THEN array_length(array(
          SELECT unnest(search_keywords) 
          INTERSECT 
          SELECT unnest(i.keywords)
        ), 1) * 10
        ELSE 0
      END + i.quality_score
    )::INTEGER as relevance_score
  FROM images i
  WHERE i.keywords && search_keywords
  ORDER BY relevance_score DESC, i.quality_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get images by category with quality filtering
CREATE OR REPLACE FUNCTION get_images_by_category(
  target_category TEXT,
  min_quality INTEGER DEFAULT 50,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  image_url TEXT,
  category TEXT,
  quality_score INTEGER,
  keywords TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.title,
    i.image_url,
    i.category,
    i.quality_score,
    i.keywords
  FROM images i
  WHERE i.category = target_category 
    AND i.quality_score >= min_quality
  ORDER BY i.quality_score DESC, i.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- View for image analytics
CREATE OR REPLACE VIEW images_analytics AS
SELECT 
  category,
  COUNT(*) as total_images,
  AVG(quality_score) as avg_quality,
  COUNT(CASE WHEN ai_generated THEN 1 END) as ai_labeled_count,
  COUNT(CASE WHEN NOT ai_generated THEN 1 END) as manually_labeled_count,
  array_agg(DISTINCT subcategory) FILTER (WHERE subcategory IS NOT NULL) as subcategories,
  MAX(created_at) as latest_upload
FROM images
GROUP BY category
ORDER BY total_images DESC;

-- Function to get image recommendations based on content
CREATE OR REPLACE FUNCTION get_image_recommendations(
  content_keywords TEXT[],
  target_category TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  image_url TEXT,
  category TEXT,
  relevance_score INTEGER,
  quality_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.title,
    i.image_url,
    i.category,
    -- Calculate relevance based on keyword overlap and category match
    (
      CASE 
        WHEN target_category IS NOT NULL AND i.category = target_category THEN 50
        ELSE 0
      END +
      CASE 
        WHEN array_length(array(
          SELECT unnest(content_keywords) 
          INTERSECT 
          SELECT unnest(i.keywords)
        ), 1) IS NOT NULL 
        THEN array_length(array(
          SELECT unnest(content_keywords) 
          INTERSECT 
          SELECT unnest(i.keywords)
        ), 1) * 15
        ELSE 0
      END + i.quality_score
    )::INTEGER as relevance_score,
    i.quality_score
  FROM images i
  WHERE (target_category IS NULL OR i.category = target_category)
    AND i.keywords && content_keywords
  ORDER BY relevance_score DESC, i.quality_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE images IS 'Stores images with comprehensive AI-generated metadata for content creation';
COMMENT ON COLUMN images.title IS 'SEO-friendly title generated by AI';
COMMENT ON COLUMN images.description IS 'Detailed description of image content';
COMMENT ON COLUMN images.category IS 'Primary category from predefined list';
COMMENT ON COLUMN images.subcategory IS 'Specific subcategory within the main category';
COMMENT ON COLUMN images.keywords IS 'Array of keywords for search and matching';
COMMENT ON COLUMN images.visual_style IS 'Array of visual style descriptors';
COMMENT ON COLUMN images.color_palette IS 'Array of dominant colors in the image';
COMMENT ON COLUMN images.mood IS 'Array of emotional/mood descriptors';
COMMENT ON COLUMN images.industry_tags IS 'Array of relevant industries';
COMMENT ON COLUMN images.content_type IS 'Array of content type classifications';
COMMENT ON COLUMN images.quality_score IS 'AI-assessed quality score (1-100)';
COMMENT ON COLUMN images.use_cases IS 'Array of recommended use cases';
COMMENT ON COLUMN images.ai_generated IS 'Whether labels were generated by AI';

-- Grant necessary permissions
GRANT ALL ON images TO authenticated;
GRANT ALL ON images TO anon;
GRANT SELECT ON images_analytics TO authenticated;
GRANT SELECT ON images_analytics TO anon;
GRANT EXECUTE ON FUNCTION search_images_by_keywords(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION search_images_by_keywords(TEXT[]) TO anon;
GRANT EXECUTE ON FUNCTION get_images_by_category(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_images_by_category(TEXT, INTEGER, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_image_recommendations(TEXT[], TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_image_recommendations(TEXT[], TEXT, INTEGER) TO anon; 