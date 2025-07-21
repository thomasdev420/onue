import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  console.log('🔧 Setting up enhanced database schema...');
  
  const results = {
    success: false,
    operations: [],
    errors: []
  };
  
  try {
    // Use service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase URL or Service Role Key');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Operation 1: Check current table structure
    console.log('1. Checking current images table structure...');
    try {
      const { data: sampleData, error: sampleError } = await supabase
        .from('images')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        results.errors.push(`Sample query error: ${sampleError.message}`);
      } else {
        const currentColumns = sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : [];
        console.log('Current columns:', currentColumns);
        results.operations.push(`✅ Current columns: ${currentColumns.join(', ')}`);
      }
    } catch (error) {
      results.errors.push(`Structure check error: ${error.message}`);
    }
    
    // Operation 2: Create storage bucket if it doesn't exist
    console.log('2. Setting up storage bucket...');
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        results.errors.push(`Storage buckets error: ${bucketsError.message}`);
      } else {
        const userImagesBucket = buckets.find(b => b.name === 'user-images');
        
        if (!userImagesBucket) {
          const { error: createBucketError } = await supabase.storage.createBucket('user-images', {
            public: true,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            fileSizeLimit: 10485760 // 10MB
          });
          
          if (createBucketError) {
            results.errors.push(`Create bucket error: ${createBucketError.message}`);
          } else {
            results.operations.push('✅ Created user-images storage bucket');
          }
        } else {
          results.operations.push('✅ user-images storage bucket already exists');
        }
      }
    } catch (error) {
      results.errors.push(`Storage setup exception: ${error.message}`);
    }
    
    // Operation 3: Test if we can insert with new columns
    console.log('3. Testing insert with new columns...');
    try {
      const testImage = {
        title: 'Test Image for AI Labeling',
        image_url: 'https://example.com/test.jpg',
        is_stock_photo: true,
        category: 'test',
        subcategory: 'test',
        keywords: ['test', 'ai', 'labeling'],
        visual_style: ['modern'],
        color_palette: ['blue'],
        mood: ['professional'],
        industry_tags: ['technology'],
        content_type: ['business'],
        quality_score: 85,
        use_cases: ['presentations'],
        ai_generated: true,
        description: 'Test image for AI labeling system',
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
        results.errors.push(`Insert test error: ${insertError.message}`);
        console.log('Insert error details:', insertError);
      } else {
        results.operations.push('✅ Successfully inserted test image with AI labeling fields');
        
        // Clean up test data
        if (insertData && insertData.length > 0) {
          await supabase
            .from('images')
            .delete()
            .eq('id', insertData[0].id);
        }
      }
    } catch (error) {
      results.errors.push(`Insert test exception: ${error.message}`);
    }
    
    results.success = results.errors.length === 0;
    
    if (results.success) {
      console.log('🎉 Database setup completed successfully!');
    } else {
      console.log('⚠️ Database setup completed with errors');
    }
    
    return NextResponse.json({
      success: results.success,
      operations: results.operations,
      errors: results.errors,
      summary: {
        totalOperations: results.operations.length,
        errorCount: results.errors.length,
        status: results.success ? '✅ Setup Complete' : '⚠️ Setup with Errors'
      }
    });
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      operations: results.operations,
      errors: [...results.errors, error.message]
    }, { status: 500 });
  }
} 