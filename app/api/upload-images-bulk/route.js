import { NextResponse } from 'next/server';
import { getSupabase } from '../../../supabaseClient';
import { automatedImageLabelingService } from '../../services/automatedImageLabelingService.js';
import { apiLogger } from '../../utils/logger.js';

export async function POST(request) {
  try {
    const { images, userId } = await request.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ 
        error: 'Images array is required and must not be empty' 
      }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    apiLogger.info(`Starting bulk image upload and labeling for ${images.length} images`);

    const supabase = getSupabase();
    const results = [];
    const errors = [];

    // Process images in batches for labeling
    const labeledImages = await automatedImageLabelingService.batchLabelImages(images);

    // Insert labeled images into database
    for (const labeledImage of labeledImages) {
      try {
        const { data, error } = await supabase
          .from('images')
          .insert({
            title: labeledImage.title,
            description: labeledImage.description,
            image_url: labeledImage.url,
            category: labeledImage.category,
            subcategory: labeledImage.subcategory,
            keywords: labeledImage.keywords,
            visual_style: labeledImage.visualStyle,
            color_palette: labeledImage.colorPalette,
            mood: labeledImage.mood,
            industry_tags: labeledImage.industryTags,
            content_type: labeledImage.contentType,
            aspect_ratio: labeledImage.aspectRatio,
            quality_score: labeledImage.qualityScore,
            use_cases: labeledImage.useCases,
            ai_generated: labeledImage.aiGenerated,
            user_id: userId
          })
          .select()
          .single();

        if (error) {
          apiLogger.error(`Database error for image ${labeledImage.url}:`, error);
          errors.push({
            url: labeledImage.url,
            error: error.message
          });
        } else {
          results.push({
            id: data.id,
            url: labeledImage.url,
            title: labeledImage.title,
            category: labeledImage.category,
            qualityScore: labeledImage.qualityScore
          });
        }
      } catch (error) {
        apiLogger.error(`Unexpected error processing image ${labeledImage.url}:`, error);
        errors.push({
          url: labeledImage.url,
          error: error.message
        });
      }
    }

    const successCount = results.length;
    const errorCount = errors.length;

    apiLogger.info(`Bulk upload completed: ${successCount} successful, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${successCount} images with AI labeling`,
      results: {
        successful: results,
        errors: errors,
        summary: {
          total: images.length,
          successful: successCount,
          failed: errorCount
        }
      }
    });

  } catch (error) {
    apiLogger.error('Error in bulk image upload:', error);
    return NextResponse.json({ 
      error: 'Failed to process bulk image upload',
      details: error.message
    }, { status: 500 });
  }
} 