import { NextResponse } from 'next/server';
import { getSupabase } from '../../../supabaseClient';

export async function POST() {
  try {
    const supabase = getSupabase();
    
    console.log('Starting comprehensive fix of business images...');
    
    // Get ALL images to check their categories
    const { data: allImages, error: fetchError } = await supabase
      .from('images')
      .select('*');
    
    if (fetchError) {
      return NextResponse.json({ 
        error: 'Failed to fetch images',
        details: fetchError.message 
      }, { status: 500 });
    }
    
    console.log(`Found ${allImages.length} total images`);
    
    // Find all images that should NOT be in business category
    const businessImages = allImages.filter(img => img.category === 'business');
    console.log(`Found ${businessImages.length} images currently in business category`);
    
    const results = {
      totalImages: allImages.length,
      businessImages: businessImages.length,
      corrected: 0,
      errors: 0,
      corrections: []
    };
    
    // For each business image, check if it should be recategorized
    for (const image of businessImages) {
      try {
        console.log(`Checking image: ${image.title}`);
        
        // Simple keyword-based categorization (faster than AI reprocessing)
        const title = (image.title || '').toLowerCase();
        const description = (image.description || '').toLowerCase();
        const keywords = (image.keywords || []).map(k => k.toLowerCase());
        
        let newCategory = 'business'; // default
        
        // Check for indicators of other categories
        if (title.includes('running') || title.includes('athlete') || title.includes('fitness') || 
            keywords.some(k => k.includes('running') || k.includes('athlete') || k.includes('fitness'))) {
          newCategory = 'sports';
        } else if (title.includes('nature') || title.includes('outdoor') || title.includes('landscape') ||
                   keywords.some(k => k.includes('nature') || k.includes('outdoor') || k.includes('landscape'))) {
          newCategory = 'nature';
        } else if (title.includes('family') || title.includes('child') || title.includes('parent') ||
                   keywords.some(k => k.includes('family') || k.includes('child') || k.includes('parent'))) {
          newCategory = 'family';
        } else if (title.includes('food') || title.includes('dining') || title.includes('restaurant') ||
                   keywords.some(k => k.includes('food') || k.includes('dining') || k.includes('restaurant'))) {
          newCategory = 'food';
        } else if (title.includes('travel') || title.includes('adventure') || title.includes('journey') ||
                   keywords.some(k => k.includes('travel') || k.includes('adventure') || k.includes('journey'))) {
          newCategory = 'travel';
        } else if (title.includes('technology') || title.includes('computer') || title.includes('digital') ||
                   keywords.some(k => k.includes('technology') || k.includes('computer') || k.includes('digital'))) {
          newCategory = 'technology';
        } else if (title.includes('creative') || title.includes('art') || title.includes('design') ||
                   keywords.some(k => k.includes('creative') || k.includes('art') || k.includes('design'))) {
          newCategory = 'creativity';
        } else if (title.includes('health') || title.includes('wellness') || title.includes('medical') ||
                   keywords.some(k => k.includes('health') || k.includes('wellness') || k.includes('medical'))) {
          newCategory = 'health';
        } else if (title.includes('education') || title.includes('learning') || title.includes('academic') ||
                   keywords.some(k => k.includes('education') || k.includes('learning') || k.includes('academic'))) {
          newCategory = 'education';
        } else if (title.includes('luxury') || title.includes('premium') || title.includes('exclusive') ||
                   keywords.some(k => k.includes('luxury') || k.includes('premium') || k.includes('exclusive'))) {
          newCategory = 'luxury';
        } else if (title.includes('romantic') || title.includes('love') || title.includes('couple') ||
                   keywords.some(k => k.includes('romantic') || k.includes('love') || k.includes('couple'))) {
          newCategory = 'romantic';
        } else if (title.includes('urban') || title.includes('city') || title.includes('metropolitan') ||
                   keywords.some(k => k.includes('urban') || k.includes('city') || k.includes('metropolitan'))) {
          newCategory = 'urban';
        } else if (title.includes('abstract') || title.includes('conceptual') || title.includes('minimal') ||
                   keywords.some(k => k.includes('abstract') || k.includes('conceptual') || k.includes('minimal'))) {
          newCategory = 'abstract';
        } else if (title.includes('lifestyle') || title.includes('daily') || title.includes('personal') ||
                   keywords.some(k => k.includes('lifestyle') || k.includes('daily') || k.includes('personal'))) {
          newCategory = 'lifestyle';
        } else {
          // If no clear category, move to general
          newCategory = 'general';
        }
        
        // Only update if category is changing
        if (newCategory !== 'business') {
          console.log(`Correcting "${image.title}" from business to ${newCategory}`);
          
          const { error: updateError } = await supabase
            .from('images')
            .update({ category: newCategory })
            .eq('id', image.id);
          
          if (updateError) {
            console.error(`Failed to update image ${image.id}:`, updateError);
            results.errors++;
          } else {
            results.corrected++;
            results.corrections.push({
              id: image.id,
              oldCategory: 'business',
              newCategory: newCategory,
              title: image.title
            });
          }
        }
        
      } catch (error) {
        console.error(`Error processing image ${image.id}:`, error);
        results.errors++;
      }
    }
    
    console.log('Fix completed:', results);
    
    return NextResponse.json({
      success: true,
      message: `Fixed ${results.corrected} out of ${results.businessImages} business images.`,
      results: results
    });
    
  } catch (error) {
    console.error('Fix error:', error);
    return NextResponse.json({ 
      error: 'Failed to fix business images',
      details: error.message 
    }, { status: 500 });
  }
} 