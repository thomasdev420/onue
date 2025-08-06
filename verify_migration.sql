-- Comprehensive verification script to check migration success
-- This checks both stock photos (images table) and user-uploaded images (user_images table)

-- ========================================
-- 1. CHECK STOCK PHOTOS (IMAGES TABLE)
-- ========================================

-- Check all categories in stock photos table
SELECT 
    'STOCK_PHOTOS' as table_name,
    category,
    COUNT(*) as count
FROM images 
WHERE category IS NOT NULL
GROUP BY category
ORDER BY count DESC;

-- Check for any old categories in stock photos that might still exist
SELECT 
    'OLD_STOCK_CATEGORIES_FOUND' as status,
    category,
    COUNT(*) as count
FROM images 
WHERE category IN (
    'business', 'technology', 'success', 'motivation', 'growth', 'creativity', 
    'social_media', 'entrepreneurship', 'marketing', 'lifestyle', 'nature', 
    'health', 'education', 'finance', 'travel', 'food', 'fashion', 'sports', 
    'family', 'abstract', 'industrial', 'urban', 'rural', 'science', 
    'romantic', 'general'
)
GROUP BY category;

-- ========================================
-- 2. CHECK USER-UPLOADED IMAGES (USER_IMAGES TABLE)
-- ========================================

-- Check all categories in user-uploaded images table
SELECT 
    'USER_UPLOADS' as table_name,
    category,
    COUNT(*) as count
FROM user_images 
WHERE category IS NOT NULL
GROUP BY category
ORDER BY count DESC;

-- Check for any old categories in user uploads that might still exist
SELECT 
    'OLD_USER_CATEGORIES_FOUND' as status,
    category,
    COUNT(*) as count
FROM user_images 
WHERE category IN (
    'business', 'technology', 'success', 'motivation', 'growth', 'creativity', 
    'social_media', 'entrepreneurship', 'marketing', 'lifestyle', 'nature', 
    'health', 'education', 'finance', 'travel', 'food', 'fashion', 'sports', 
    'family', 'abstract', 'industrial', 'urban', 'rural', 'science', 
    'romantic', 'general'
)
GROUP BY category;

-- ========================================
-- 3. CHECK AI_MEMORY TABLE
-- ========================================

-- Check all creative preferences in ai_memory
SELECT 
    'ai_memory' as table_name,
    value as category_preference,
    COUNT(*) as count
FROM ai_memory 
WHERE category = 'creative_preferences'
GROUP BY value
ORDER BY count DESC;

-- Check for any old category references in ai_memory
SELECT 
    'OLD_AI_MEMORIES_FOUND' as status,
    value,
    COUNT(*) as count
FROM ai_memory 
WHERE category = 'creative_preferences'
AND (
    value LIKE '%business%' OR value LIKE '%technology%' OR value LIKE '%success%' 
    OR value LIKE '%motivation%' OR value LIKE '%growth%' OR value LIKE '%creativity%' 
    OR value LIKE '%social_media%' OR value LIKE '%entrepreneurship%' OR value LIKE '%marketing%' 
    OR value LIKE '%lifestyle%' OR value LIKE '%nature%' OR value LIKE '%health%' 
    OR value LIKE '%education%' OR value LIKE '%finance%' OR value LIKE '%travel%' 
    OR value LIKE '%food%' OR value LIKE '%fashion%' OR value LIKE '%sports%' 
    OR value LIKE '%family%' OR value LIKE '%abstract%' OR value LIKE '%industrial%' 
    OR value LIKE '%urban%' OR value LIKE '%rural%' OR value LIKE '%science%' 
    OR value LIKE '%romantic%' OR value LIKE '%running%' OR value LIKE '%general%'
)
GROUP BY value;

-- ========================================
-- 4. COMPREHENSIVE SUMMARY REPORT
-- ========================================

-- Overall summary for both image types
SELECT 
    'MIGRATION_SUMMARY' as report_type,
    'Total stock photos with categories' as metric,
    COUNT(*) as value
FROM images 
WHERE category IS NOT NULL

UNION ALL

SELECT 
    'MIGRATION_SUMMARY' as report_type,
    'Total user uploads with categories' as metric,
    COUNT(*) as value
FROM user_images 
WHERE category IS NOT NULL

UNION ALL

SELECT 
    'MIGRATION_SUMMARY' as report_type,
    'Total AI memory records' as metric,
    COUNT(*) as value
FROM ai_memory 
WHERE category = 'creative_preferences'

UNION ALL

SELECT 
    'MIGRATION_SUMMARY' as report_type,
    'New categories in stock photos' as metric,
    COUNT(DISTINCT category) as value
FROM images 
WHERE category IN ('pool', 'sunset_sunrise', 'art', 'neighbourhood_walk', 'luxury', 'running')

UNION ALL

SELECT 
    'MIGRATION_SUMMARY' as report_type,
    'New categories in user uploads' as metric,
    COUNT(DISTINCT category) as value
FROM user_images 
WHERE category IN ('pool', 'sunset_sunrise', 'art', 'neighbourhood_walk', 'luxury', 'running');

-- ========================================
-- 5. EXPECTED NEW CATEGORIES - STOCK PHOTOS
-- ========================================

-- This should show only the new categories in stock photos
SELECT 
    'EXPECTED_NEW_STOCK_CATEGORIES' as check_type,
    'pool' as expected_category,
    COUNT(*) as actual_count
FROM images 
WHERE category = 'pool'

UNION ALL

SELECT 
    'EXPECTED_NEW_STOCK_CATEGORIES' as check_type,
    'sunset_sunrise' as expected_category,
    COUNT(*) as actual_count
FROM images 
WHERE category = 'sunset_sunrise'

UNION ALL

SELECT 
    'EXPECTED_NEW_STOCK_CATEGORIES' as check_type,
    'art' as expected_category,
    COUNT(*) as actual_count
FROM images 
WHERE category = 'art'

UNION ALL

SELECT 
    'EXPECTED_NEW_STOCK_CATEGORIES' as check_type,
    'neighbourhood_walk' as expected_category,
    COUNT(*) as actual_count
FROM images 
WHERE category = 'neighbourhood_walk'

UNION ALL

SELECT 
    'EXPECTED_NEW_STOCK_CATEGORIES' as check_type,
    'luxury' as expected_category,
    COUNT(*) as actual_count
FROM images 
WHERE category = 'luxury'

UNION ALL

SELECT 
    'EXPECTED_NEW_STOCK_CATEGORIES' as check_type,
    'running' as expected_category,
    COUNT(*) as actual_count
FROM images 
WHERE category = 'running';

-- ========================================
-- 6. EXPECTED NEW CATEGORIES - USER UPLOADS
-- ========================================

-- This should show only the new categories in user uploads
SELECT 
    'EXPECTED_NEW_USER_CATEGORIES' as check_type,
    'pool' as expected_category,
    COUNT(*) as actual_count
FROM user_images 
WHERE category = 'pool'

UNION ALL

SELECT 
    'EXPECTED_NEW_USER_CATEGORIES' as check_type,
    'sunset_sunrise' as expected_category,
    COUNT(*) as actual_count
FROM user_images 
WHERE category = 'sunset_sunrise'

UNION ALL

SELECT 
    'EXPECTED_NEW_USER_CATEGORIES' as check_type,
    'art' as expected_category,
    COUNT(*) as actual_count
FROM user_images 
WHERE category = 'art'

UNION ALL

SELECT 
    'EXPECTED_NEW_USER_CATEGORIES' as check_type,
    'neighbourhood_walk' as expected_category,
    COUNT(*) as actual_count
FROM user_images 
WHERE category = 'neighbourhood_walk'

UNION ALL

SELECT 
    'EXPECTED_NEW_USER_CATEGORIES' as check_type,
    'luxury' as expected_category,
    COUNT(*) as actual_count
FROM user_images 
WHERE category = 'luxury'

UNION ALL

SELECT 
    'EXPECTED_NEW_USER_CATEGORIES' as check_type,
    'running' as expected_category,
    COUNT(*) as actual_count
FROM user_images 
WHERE category = 'running';

-- ========================================
-- 7. CLEANUP VERIFICATION - STOCK PHOTOS
-- ========================================

-- Check if any old categories still exist in stock photos (should return 0 rows)
SELECT 
    'CLEANUP_CHECK_STOCK' as status,
    'Old categories still exist in stock photos' as issue,
    category,
    COUNT(*) as count
FROM images 
WHERE category IN (
    'business', 'technology', 'success', 'motivation', 'growth', 'creativity', 
    'social_media', 'entrepreneurship', 'marketing', 'lifestyle', 'nature', 
    'health', 'education', 'finance', 'travel', 'food', 'fashion', 'sports', 
    'family', 'abstract', 'industrial', 'urban', 'rural', 'science', 
    'romantic', 'general'
)
GROUP BY category;

-- ========================================
-- 8. CLEANUP VERIFICATION - USER UPLOADS
-- ========================================

-- Check if any old categories still exist in user uploads (should return 0 rows)
SELECT 
    'CLEANUP_CHECK_USER' as status,
    'Old categories still exist in user uploads' as issue,
    category,
    COUNT(*) as count
FROM user_images 
WHERE category IN (
    'business', 'technology', 'success', 'motivation', 'growth', 'creativity', 
    'social_media', 'entrepreneurship', 'marketing', 'lifestyle', 'nature', 
    'health', 'education', 'finance', 'travel', 'food', 'fashion', 'sports', 
    'family', 'abstract', 'industrial', 'urban', 'rural', 'science', 
    'romantic', 'general'
)
GROUP BY category;

-- ========================================
-- 9. SYSTEM OVERVIEW
-- ========================================

-- Show the complete picture of the image system
SELECT 
    'SYSTEM_OVERVIEW' as report_type,
    'Stock photos total' as metric,
    COUNT(*) as value
FROM images

UNION ALL

SELECT 
    'SYSTEM_OVERVIEW' as report_type,
    'User uploads total' as metric,
    COUNT(*) as value
FROM user_images

UNION ALL

SELECT 
    'SYSTEM_OVERVIEW' as report_type,
    'Stock photos with categories' as metric,
    COUNT(*) as value
FROM images 
WHERE category IS NOT NULL

UNION ALL

SELECT 
    'SYSTEM_OVERVIEW' as report_type,
    'User uploads with categories' as metric,
    COUNT(*) as value
FROM user_images 
WHERE category IS NOT NULL; 