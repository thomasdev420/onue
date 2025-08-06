-- Cleanup script to remove images that don't match the new categories
-- This will remove images that aren't: pool, sunset_sunrise, art, neighbourhood_walk, luxury

-- ========================================
-- 1. FIRST, LET'S SEE WHAT WE'RE REMOVING
-- ========================================

-- Check what categories exist in stock photos
SELECT 
    'CURRENT_STOCK_CATEGORIES' as status,
    category,
    COUNT(*) as count
FROM images 
GROUP BY category
ORDER BY count DESC;

-- Check what categories exist in user uploads
SELECT 
    'CURRENT_USER_CATEGORIES' as status,
    category,
    COUNT(*) as count
FROM user_images 
GROUP BY category
ORDER BY count DESC;

-- ========================================
-- 2. COUNT IMAGES TO BE REMOVED
-- ========================================

-- Count stock photos that will be removed
SELECT 
    'STOCK_PHOTOS_TO_REMOVE' as status,
    category,
    COUNT(*) as count
FROM images 
WHERE category NOT IN ('pool', 'sunset_sunrise', 'art', 'neighbourhood_walk', 'luxury', 'running')
GROUP BY category
ORDER BY count DESC;

-- Count user uploads that will be removed
SELECT 
    'USER_UPLOADS_TO_REMOVE' as status,
    category,
    COUNT(*) as count
FROM user_images 
WHERE category NOT IN ('pool', 'sunset_sunrise', 'art', 'neighbourhood_walk', 'luxury', 'running')
GROUP BY category
ORDER BY count DESC;

-- ========================================
-- 3. REMOVE NON-MATCHING IMAGES
-- ========================================

-- Remove stock photos that don't match new categories
DELETE FROM images 
WHERE category NOT IN ('pool', 'sunset_sunrise', 'art', 'neighbourhood_walk', 'luxury', 'running');

-- Remove user uploads that don't match new categories
DELETE FROM user_images 
WHERE category NOT IN ('pool', 'sunset_sunrise', 'art', 'neighbourhood_walk', 'luxury', 'running');

-- ========================================
-- 4. VERIFY CLEANUP
-- ========================================

-- Check remaining stock photos
SELECT 
    'REMAINING_STOCK_PHOTOS' as status,
    category,
    COUNT(*) as count
FROM images 
GROUP BY category
ORDER BY count DESC;

-- Check remaining user uploads
SELECT 
    'REMAINING_USER_UPLOADS' as status,
    category,
    COUNT(*) as count
FROM user_images 
GROUP BY category
ORDER BY count DESC;

-- ========================================
-- 5. FINAL SUMMARY
-- ========================================

-- Show final counts
SELECT 
    'FINAL_SUMMARY' as report_type,
    'Total stock photos remaining' as metric,
    COUNT(*) as value
FROM images

UNION ALL

SELECT 
    'FINAL_SUMMARY' as report_type,
    'Total user uploads remaining' as metric,
    COUNT(*) as value
FROM user_images

UNION ALL

SELECT 
    'FINAL_SUMMARY' as report_type,
    'Stock photos by category' as metric,
    COUNT(DISTINCT category) as value
FROM images

UNION ALL

SELECT 
    'FINAL_SUMMARY' as report_type,
    'User uploads by category' as metric,
    COUNT(DISTINCT category) as value
FROM user_images; 