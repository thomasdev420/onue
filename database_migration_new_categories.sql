-- Migration to update image categories to new system
-- Remove old categories and update to: pool, sunset_sunrise, art, neighbourhood_walk, luxury

-- First, update any existing images with old categories to use the new ones
UPDATE user_images 
SET category = 'luxury'
WHERE category IN ('business', 'technology', 'success', 'motivation', 'growth', 'creativity', 'social_media', 'entrepreneurship', 'marketing', 'lifestyle');

UPDATE user_images 
SET category = 'pool'
WHERE category IN ('nature', 'health', 'education', 'finance', 'travel', 'food', 'fashion', 'sports', 'family', 'abstract', 'industrial', 'urban', 'rural', 'science', 'romantic', 'general');

-- Keep running category as running
UPDATE user_images 
SET category = 'running'
WHERE category = 'running';

-- For ai_memory table, we need to handle the unique constraint carefully
-- First, delete old category-related memories
DELETE FROM ai_memory 
WHERE category = 'creative_preferences' 
AND (value LIKE '%business%' OR value LIKE '%technology%' OR value LIKE '%success%' OR value LIKE '%motivation%' OR value LIKE '%growth%' OR value LIKE '%creativity%' OR value LIKE '%social_media%' OR value LIKE '%entrepreneurship%' OR value LIKE '%marketing%' OR value LIKE '%lifestyle%' OR value LIKE '%nature%' OR value LIKE '%health%' OR value LIKE '%education%' OR value LIKE '%finance%' OR value LIKE '%travel%' OR value LIKE '%food%' OR value LIKE '%fashion%' OR value LIKE '%sports%' OR value LIKE '%family%' OR value LIKE '%abstract%' OR value LIKE '%industrial%' OR value LIKE '%urban%' OR value LIKE '%rural%' OR value LIKE '%science%' OR value LIKE '%romantic%' OR value LIKE '%running%' OR value LIKE '%general%');

-- Then insert new category preferences (only if they don't already exist)
INSERT INTO ai_memory (user_id, category, priority, type, value, context, original_input)
SELECT DISTINCT 
    user_id,
    'creative_preferences',
    4,
    'category_preference',
    'luxury',
    'Updated from old business categories',
    'Migration from old business categories'
FROM ai_memory 
WHERE user_id IN (
    SELECT DISTINCT user_id 
    FROM ai_memory 
    WHERE category = 'creative_preferences'
)
ON CONFLICT (user_id, category, value) DO NOTHING;

INSERT INTO ai_memory (user_id, category, priority, type, value, context, original_input)
SELECT DISTINCT 
    user_id,
    'creative_preferences',
    4,
    'category_preference',
    'pool',
    'Updated from old general categories',
    'Migration from old general categories'
FROM ai_memory 
WHERE user_id IN (
    SELECT DISTINCT user_id 
    FROM ai_memory 
    WHERE category = 'creative_preferences'
)
ON CONFLICT (user_id, category, value) DO NOTHING;

-- Verify the migration worked
SELECT DISTINCT category FROM user_images WHERE category IS NOT NULL; 