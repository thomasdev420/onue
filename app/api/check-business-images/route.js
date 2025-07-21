import { NextResponse } from 'next/server';
import { getSupabase } from '../../../supabaseClient';

export async function GET() {
  try {
    const supabase = getSupabase();
    
    // Get count of business images
    const { data: businessImages, error: businessError } = await supabase
      .from('images')
      .select('id, title, category')
      .eq('category', 'business');
    
    if (businessError) {
      return NextResponse.json({ 
        error: 'Failed to fetch business images',
        details: businessError.message 
      }, { status: 500 });
    }
    
    // Get total count of all images
    const { count: totalImages, error: totalError } = await supabase
      .from('images')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) {
      return NextResponse.json({ 
        error: 'Failed to fetch total images',
        details: totalError.message 
      }, { status: 500 });
    }
    
    // Get category distribution
    const { data: categoryStats, error: categoryError } = await supabase
      .from('images')
      .select('category');
    
    if (categoryError) {
      return NextResponse.json({ 
        error: 'Failed to fetch category stats',
        details: categoryError.message 
      }, { status: 500 });
    }
    
    // Count categories
    const categoryCounts = {};
    categoryStats.forEach(img => {
      categoryCounts[img.category] = (categoryCounts[img.category] || 0) + 1;
    });
    
    return NextResponse.json({
      success: true,
      stats: {
        totalImages: totalImages,
        businessImages: businessImages.length,
        businessPercentage: totalImages > 0 ? ((businessImages.length / totalImages) * 100).toFixed(1) : 0,
        categoryDistribution: categoryCounts
      },
      businessImageSamples: businessImages.slice(0, 5).map(img => ({
        id: img.id,
        title: img.title
      }))
    });
    
  } catch (error) {
    console.error('Check business images error:', error);
    return NextResponse.json({ 
      error: 'Failed to check business images',
      details: error.message 
    }, { status: 500 });
  }
} 