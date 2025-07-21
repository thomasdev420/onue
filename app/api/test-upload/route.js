import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  console.log('🧪 Testing simple upload...');
  
  try {
    const { imageUrl, title } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json({
        success: false,
        error: 'Image URL is required'
      }, { status: 400 });
    }
    
    // Use service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase URL or Service Role Key');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Test inserting an image with AI labeling
    const testImage = {
      title: title || 'Test Image',
      image_url: imageUrl,
      is_stock_photo: true,
      category: 'test',
      subcategory: 'test-upload',
      keywords: ['test', 'upload', 'automation'],
      visual_style: ['modern'],
      color_palette: ['blue'],
      mood: ['professional'],
      industry_tags: ['technology'],
      content_type: ['test'],
      quality_score: 85,
      use_cases: ['testing'],
      ai_generated: true,
      description: 'Test image for upload functionality',
      aspect_ratio: '16:9',
      file_size: 1024000,
      dimensions: '1920x1080',
      usage_count: 0
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('images')
      .insert(testImage)
      .select();
    
    if (insertError) {
      return NextResponse.json({
        success: false,
        error: `Database insert failed: ${insertError.message}`
      }, { status: 500 });
    }
    
    console.log('✅ Test upload successful');
    
    return NextResponse.json({
      success: true,
      message: 'Test image uploaded and labeled successfully',
      image: insertData[0]
    });
    
  } catch (error) {
    console.error('❌ Test upload failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 