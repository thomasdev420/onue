import { NextResponse } from 'next/server';
import { getSupabase } from '../../../supabaseClient';
import { CATEGORIES, CATEGORY_KEYWORDS } from '../../shared/constants/imageCategories.js';

export async function GET() {
  try {
    const supabase = getSupabase();
    
    // Get all images with categories
    const { data: libraryImages, error: fetchError } = await supabase
      .from('images')
      .select('id, title, image_url, category');
    
    if (fetchError) {
      return NextResponse.json({ 
        error: 'Failed to fetch images',
        details: fetchError.message 
      }, { status: 500 });
    }
    
    // Simulate the ContentModal categorization logic
    const categorizedImages = {};
    Object.keys(CATEGORIES).forEach(category => {
      categorizedImages[category] = [];
    });
    
    libraryImages.forEach(image => {
      // Use database category if available, otherwise fall back to keyword matching
      const dbCategory = image.category;
      if (dbCategory && categorizedImages[dbCategory]) {
        categorizedImages[dbCategory].push(image);
      } else {
        // Fallback to keyword matching for images without database categories
        let matched = false;
        for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
          if (image.title && keywords.some(keyword => 
            image.title.toLowerCase().includes(keyword.toLowerCase())
          )) {
            categorizedImages[category].push(image);
            matched = true;
            break;
          }
        }
        if (!matched) {
          // Default to general instead of business
          categorizedImages.general.push(image);
        }
      }
    });
    
    // Count images by category
    const categoryCounts = {};
    Object.keys(categorizedImages).forEach(category => {
      categoryCounts[category] = categorizedImages[category].length;
    });
    
    return NextResponse.json({
      success: true,
      totalImages: libraryImages.length,
      categoryCounts: categoryCounts,
      businessImages: categorizedImages.business || [],
      generalImages: categorizedImages.general || [],
      sampleBusinessImages: (categorizedImages.business || []).slice(0, 3).map(img => ({
        id: img.id,
        title: img.title,
        category: img.category
      }))
    });
    
  } catch (error) {
    console.error('Test UI categorization error:', error);
    return NextResponse.json({ 
      error: 'Failed to test UI categorization',
      details: error.message 
    }, { status: 500 });
  }
} 