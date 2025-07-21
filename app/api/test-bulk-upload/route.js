import { NextResponse } from 'next/server';
import { getSupabase } from '../../../supabaseClient';

export async function POST() {
  console.log('🧪 Testing Bulk Upload Functionality...');
  
  const results = {
    success: false,
    tests: [],
    errors: []
  };
  
  try {
    const supabase = getSupabase();
    
    // Test 1: Check storage bucket access
    console.log('1. Testing storage bucket access...');
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        results.errors.push(`Storage bucket access failed: ${bucketsError.message}`);
      } else {
        const userImagesBucket = buckets.find(b => b.name === 'user-images');
        if (userImagesBucket) {
          results.tests.push('✅ user-images storage bucket accessible');
        } else {
          results.errors.push('user-images storage bucket not found');
        }
      }
    } catch (error) {
      results.errors.push(`Storage bucket test failed: ${error.message}`);
    }
    
    // Test 2: Check database insert capability
    console.log('2. Testing database insert capability...');
    try {
      const testImage = {
        title: 'Test Image for Bulk Upload',
        image_url: 'https://example.com/test-bulk-upload.jpg',
        is_stock_photo: true,
        category: 'test',
        subcategory: 'bulk-upload-test',
        keywords: ['test', 'bulk', 'upload', 'automation'],
        visual_style: ['modern'],
        color_palette: ['blue'],
        mood: ['professional'],
        industry_tags: ['technology'],
        content_type: ['test'],
        quality_score: 85,
        use_cases: ['testing'],
        ai_generated: true,
        description: 'Test image for bulk upload functionality',
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
        results.errors.push(`Database insert failed: ${insertError.message}`);
      } else {
        results.tests.push('✅ Database insert successful');
        
        // Clean up test data
        if (insertData && insertData.length > 0) {
          await supabase
            .from('images')
            .delete()
            .eq('id', insertData[0].id);
          results.tests.push('✅ Test data cleanup successful');
        }
      }
    } catch (error) {
      results.errors.push(`Database insert test failed: ${error.message}`);
    }
    
    // Test 3: Check image retrieval capability
    console.log('3. Testing image retrieval capability...');
    try {
      const { data: images, error: retrieveError } = await supabase
        .from('images')
        .select('*')
        .limit(5);
      
      if (retrieveError) {
        results.errors.push(`Image retrieval failed: ${retrieveError.message}`);
      } else {
        results.tests.push(`✅ Image retrieval successful (${images.length} images found)`);
      }
    } catch (error) {
      results.errors.push(`Image retrieval test failed: ${error.message}`);
    }
    
    // Test 4: Check search functionality
    console.log('4. Testing search functionality...');
    try {
      const { data: searchResults, error: searchError } = await supabase
        .from('images')
        .select('*')
        .ilike('title', '%business%')
        .limit(3);
      
      if (searchError) {
        results.errors.push(`Search functionality failed: ${searchError.message}`);
      } else {
        results.tests.push(`✅ Search functionality working (${searchResults.length} results)`);
      }
    } catch (error) {
      results.errors.push(`Search test failed: ${error.message}`);
    }
    
    // Test 5: Check API endpoint availability
    console.log('5. Testing API endpoint availability...');
    try {
      const response = await fetch('http://localhost:3000/api/upload-images-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: [],
          userId: 'test-user'
        })
      });
      
      if (response.ok) {
        results.tests.push('✅ Bulk upload API endpoint accessible');
      } else {
        results.errors.push(`Bulk upload API endpoint error: ${response.status}`);
      }
    } catch (error) {
      results.errors.push(`API endpoint test failed: ${error.message}`);
    }
    
    results.success = results.errors.length === 0;
    
    if (results.success) {
      console.log('🎉 Bulk upload functionality test completed successfully!');
    } else {
      console.log('⚠️ Bulk upload functionality test completed with errors');
    }
    
    return NextResponse.json({
      success: results.success,
      tests: results.tests,
      errors: results.errors,
      summary: {
        totalTests: results.tests.length,
        errorCount: results.errors.length,
        status: results.success ? '✅ All Tests Passed' : '⚠️ Tests with Errors'
      }
    });
    
  } catch (error) {
    console.error('❌ Bulk upload functionality test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      tests: results.tests,
      errors: [...results.errors, error.message]
    }, { status: 500 });
  }
} 