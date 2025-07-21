import { NextResponse } from 'next/server';
import { getSupabase } from '../../../supabaseClient';
import { automatedImageLabelingService } from '../../services/automatedImageLabelingService.js';
import { apiLogger } from '../../utils/logger.js';

export async function POST() {
  try {
    const supabase = getSupabase();
    
    console.log('Starting reprocessing of existing images...');
    
    // Get all images currently categorized as "business"
    const { data: businessImages, error: fetchError } = await supabase
      .from('images')
      .select('*')
      .eq('category', 'business');
    
    if (fetchError) {
      return NextResponse.json({ 
        error: 'Failed to fetch business images',
        details: fetchError.message 
      }, { status: 500 });
    }
    
    console.log(`Found ${businessImages.length} images currently categorized as business`);
    
    if (businessImages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No images found in business category to reprocess'
      });
    }
    
    const results = {
      processed: 0,
      corrected: 0,
      errors: 0,
      corrections: []
    };
    
    // Process each image
    for (const image of businessImages) {
      try {
        console.log(`Reprocessing image: ${image.title}`);
        
        // Re-analyze the image with the improved AI
        const newLabels = await automatedImageLabelingService.generateImageLabels(
          image.image_url, 
          image.title
        );
        
        // Check if category changed
        if (newLabels.category !== 'business') {
          console.log(`Correcting category from "business" to "${newLabels.category}" for: ${image.title}`);
          
          // Update the database
          const { error: updateError } = await supabase
            .from('images')
            .update({
              category: newLabels.category,
              subcategory: newLabels.subcategory,
              keywords: newLabels.keywords,
              visual_style: newLabels.visualStyle,
              color_palette: newLabels.colorPalette,
              mood: newLabels.mood,
              industry_tags: newLabels.industryTags,
              content_type: newLabels.contentType,
              quality_score: newLabels.qualityScore,
              use_cases: newLabels.useCases,
              title: newLabels.title,
              description: newLabels.description
            })
            .eq('id', image.id);
          
          if (updateError) {
            console.error(`Failed to update image ${image.id}:`, updateError);
            results.errors++;
          } else {
            results.corrected++;
            results.corrections.push({
              id: image.id,
              oldCategory: 'business',
              newCategory: newLabels.category,
              title: newLabels.title
            });
          }
        } else {
          console.log(`Image correctly categorized as business: ${image.title}`);
        }
        
        results.processed++;
        
        // Add delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error reprocessing image ${image.id}:`, error);
        results.errors++;
      }
    }
    
    console.log('Reprocessing completed:', results);
    
    return NextResponse.json({
      success: true,
      message: `Reprocessing completed. Processed ${results.processed} images, corrected ${results.corrected} categories.`,
      results: results
    });
    
  } catch (error) {
    console.error('Reprocessing error:', error);
    return NextResponse.json({ 
      error: 'Failed to reprocess images',
      details: error.message 
    }, { status: 500 });
  }
} 