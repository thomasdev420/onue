import { NextResponse } from 'next/server';
import { getSupabase } from '../../../supabaseClient';

export async function GET() {
  try {
    const supabase = getSupabase();
    
    // Get ALL images with their categories
    const { data: allImages, error: fetchError } = await supabase
      .from('images')
      .select('id, title, category, image_url')
      .order('id');
    
    if (fetchError) {
      return NextResponse.json({ 
        error: 'Failed to fetch images',
        details: fetchError.message 
      }, { status: 500 });
    }
    
    // Group by category
    const categoryGroups = {};
    allImages.forEach(img => {
      const category = img.category || 'null';
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push({
        id: img.id,
        title: img.title,
        image_url: img.image_url
      });
    });
    
    // Count by category
    const categoryCounts = {};
    Object.keys(categoryGroups).forEach(category => {
      categoryCounts[category] = categoryGroups[category].length;
    });
    
    return NextResponse.json({
      success: true,
      totalImages: allImages.length,
      categoryCounts: categoryCounts,
      categoryGroups: categoryGroups,
      allImages: allImages
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ 
      error: 'Failed to debug images',
      details: error.message 
    }, { status: 500 });
  }
} 